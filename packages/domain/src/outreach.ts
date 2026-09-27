import {query,transaction} from './db';
import {audit,DomainError} from './crud';
import {canRead,canWrite,getResource} from './registry';
import type {Actor} from './types';

function access(actor:Actor,write=false){const r=getResource('seo_metadata');if(!(write?canWrite(actor,r):canRead(actor,r)))throw new DomainError('没有外联工作台权限',403);}
function httpsURL(value:string){let url:URL;try{url=new URL(value.trim());}catch{throw new DomainError('请输入完整 HTTPS 网址');}if(url.protocol!=='https:'||url.username||url.password||url.port||url.hash||url.hostname==='localhost'||url.hostname.endsWith('.local'))throw new DomainError('只接受公开 HTTPS 网址');return url.href;}
function reviewer(actor:Actor){if(!['admin','super_admin','reviewer'].includes(actor.role))throw new DomainError('外联草稿需要审核员或管理员批准',403);}

export async function outreachWorkspace(actor:Actor){access(actor);const partners=await query(`SELECT p.*,(SELECT count(*)::int FROM outreach_drafts d WHERE d.partner_id=p.id AND d.status='draft') AS draft_count,(SELECT count(*)::int FROM outreach_links l WHERE l.partner_id=p.id) AS link_count FROM outreach_partners p ORDER BY p.updated_at DESC LIMIT 150`);return {partners};}
export async function outreachPartner(actor:Actor,id:string){access(actor);const partner=(await query('SELECT * FROM outreach_partners WHERE id=$1',[id]))[0];if(!partner)throw new DomainError('合作对象不存在',404);const [drafts,replies,links]=await Promise.all([
 query('SELECT d.*,u.display_name AS author_name FROM outreach_drafts d LEFT JOIN users u ON u.id=d.author_id WHERE d.partner_id=$1 ORDER BY d.created_at DESC LIMIT 50',[id]),
 query('SELECT * FROM outreach_replies WHERE partner_id=$1 ORDER BY received_at DESC LIMIT 50',[id]),
 query('SELECT * FROM outreach_links WHERE partner_id=$1 ORDER BY first_seen_at DESC LIMIT 50',[id])]);return {partner,drafts,replies,links};}
export async function saveOutreachPartner(actor:Actor,input:{id?:string;organization:string;websiteUrl:string;contactName?:string;contactEmail?:string;fitNote?:string}){
 access(actor,true);const website=httpsURL(input.websiteUrl);return transaction(async c=>{const before=input.id?(await c.query('SELECT * FROM outreach_partners WHERE id=$1 FOR UPDATE',[input.id])).rows[0]:null;if(input.id&&!before)throw new DomainError('合作对象不存在',404);
  const data=input.id?(await c.query('UPDATE outreach_partners SET organization=$2,website_url=$3,contact_name=$4,contact_email=$5,fit_note=$6 WHERE id=$1 RETURNING *',[input.id,input.organization.trim(),website,input.contactName?.trim()||null,input.contactEmail?.trim()||null,input.fitNote?.trim()||null])).rows[0]
   :(await c.query('INSERT INTO outreach_partners(organization,website_url,contact_name,contact_email,fit_note,created_by) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',[input.organization.trim(),website,input.contactName?.trim()||null,input.contactEmail?.trim()||null,input.fitNote?.trim()||null,actor.id])).rows[0];
  await audit(c,actor,'outreach_partners',input.id?'update':'create',before,data);return data;});
}
export async function createOutreachDraft(actor:Actor,input:{partnerId:string;subject:string;body:string}){
 access(actor,true);return transaction(async c=>{const partner=(await c.query('SELECT id FROM outreach_partners WHERE id=$1',[input.partnerId])).rows[0];if(!partner)throw new DomainError('合作对象不存在',404);
  const draft=(await c.query('INSERT INTO outreach_drafts(partner_id,subject,body,author_id) VALUES($1,$2,$3,$4) RETURNING *',[input.partnerId,input.subject.trim(),input.body.trim(),actor.id])).rows[0];
  await c.query("UPDATE outreach_partners SET status='drafting' WHERE id=$1 AND status='research'",[input.partnerId]);await audit(c,actor,'outreach_drafts','create',null,draft);return draft;});
}
export async function reviewOutreachDraft(actor:Actor,input:{id:string;action:'approve'|'reject'|'mark_sent';note?:string}){
 access(actor,input.action==='mark_sent');if(input.action!=='mark_sent')reviewer(actor);return transaction(async c=>{const before=(await c.query('SELECT * FROM outreach_drafts WHERE id=$1 FOR UPDATE',[input.id])).rows[0];if(!before)throw new DomainError('外联草稿不存在',404);
  if(input.action==='mark_sent'){if(before.status!=='approved')throw new DomainError('只能将已批准的草稿标记为人工发送',409);}
  else{reviewer(actor);if(before.status!=='draft')throw new DomainError('该草稿已审批',409);if(before.author_id===actor.id)throw new DomainError('不能审批自己撰写的草稿',403);}
  const status=input.action==='mark_sent'?'sent_manually':input.action==='approve'?'approved':'rejected';
  const after=(await c.query('UPDATE outreach_drafts SET status=$2,reviewer_id=$3,reviewed_at=$4,review_note=$5,manual_sent_at=$6 WHERE id=$1 RETURNING *',[input.id,status,input.action==='mark_sent'?before.reviewer_id:actor.id,input.action==='mark_sent'?before.reviewed_at:new Date(),input.note?.trim()||before.review_note,input.action==='mark_sent'?new Date():null])).rows[0];
  if(status==='sent_manually')await c.query("UPDATE outreach_partners SET status='contacted' WHERE id=$1",[before.partner_id]);
  await audit(c,actor,'outreach_drafts',input.action,before,after);return after;});
}
export async function recordOutreachReply(actor:Actor,input:{partnerId:string;summary:string;receivedAt:string}){
 access(actor,true);return transaction(async c=>{const partner=(await c.query('SELECT id FROM outreach_partners WHERE id=$1',[input.partnerId])).rows[0];if(!partner)throw new DomainError('合作对象不存在',404);
  const row=(await c.query('INSERT INTO outreach_replies(partner_id,summary,received_at,recorded_by) VALUES($1,$2,$3,$4) RETURNING *',[input.partnerId,input.summary.trim(),input.receivedAt,actor.id])).rows[0];await c.query("UPDATE outreach_partners SET status='replied' WHERE id=$1",[input.partnerId]);await audit(c,actor,'outreach_replies','create',null,row);return row;});
}
export async function recordOutreachLink(actor:Actor,input:{partnerId:string;sourceUrl:string;targetUrl:string}){
 access(actor,true);const source=httpsURL(input.sourceUrl),target=httpsURL(input.targetUrl);
 const site=(await query('SELECT primary_domain FROM site_settings LIMIT 1'))[0];if(!site?.primary_domain||new URL(target).hostname!==new URL(site.primary_domain).hostname)throw new DomainError('目标链接必须指向当前站点');
 return transaction(async c=>{const partner=(await c.query('SELECT id FROM outreach_partners WHERE id=$1',[input.partnerId])).rows[0];if(!partner)throw new DomainError('合作对象不存在',404);
  const row=(await c.query('INSERT INTO outreach_links(partner_id,source_url,target_url,recorded_by) VALUES($1,$2,$3,$4) ON CONFLICT(partner_id,source_url,target_url) DO UPDATE SET verification_status=EXCLUDED.verification_status RETURNING *',[input.partnerId,source,target,actor.id])).rows[0];
  await c.query("UPDATE outreach_partners SET status='linked' WHERE id=$1",[input.partnerId]);await audit(c,actor,'outreach_links','record',null,row);return row;});
}
