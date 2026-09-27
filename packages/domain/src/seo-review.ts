import {query,transaction} from './db';
import {sourceDocument} from './documents';
import {audit,DomainError} from './crud';
import {canRead,getResource} from './registry';
import type {Actor,Document,Row} from './types';

export type ReviewEntity='content_item_translations'|'product_translations';
function kind(value:string):ReviewEntity{
 if(value!=='content_item_translations'&&value!=='product_translations')throw new DomainError('只支持页面、文章和产品');
 return value;
}
function read(actor:Actor,table:ReviewEntity){if(!canRead(actor,getResource(table)))throw new DomainError('没有查看此内容的权限',403);}
function publish(actor:Actor){if(!(['admin','super_admin'].includes(actor.role)||(actor.permissions?actor.permissions.includes('publishing.write'):actor.role==='reviewer')))throw new DomainError('没有发布权限',403);}
function textLength(value:unknown){return Array.from(String(value||'')).length;}
function internalLinks(value:unknown){const found=new Set<string>();function visit(x:unknown){if(typeof x==='string'){for(const match of x.matchAll(/(?:href\s*=\s*["']|^)(\/[a-z]{2}(?:-[a-z]{2})?\/[a-zA-Z0-9_/#?&=.%~-]*)/g))found.add(match[1].split(/[?#]/)[0].replace(/\/$/,'')||'/');}else if(Array.isArray(x))x.forEach(visit);else if(x&&typeof x==='object')Object.entries(x).forEach(([key,v])=>{if(['url','href','html','text'].includes(key))visit(v);else if(typeof v==='object')visit(v);});}visit(value);return [...found].filter(Boolean).slice(0,100);}

export async function seoReview(actor:Actor,tableName:string,id:string){
 const table=kind(tableName);read(actor,table);
 const doc=await sourceDocument(table,id);
 const issues:{key:string;label:string;severity:'error'|'warning'|'info';detail:string;fixResource:string}[]=[];
 const add=(key:string,label:string,severity:'error'|'warning'|'info',detail:string,fixResource:string=table)=>issues.push({key,label,severity,detail,fixResource});
 const title=String(doc.seo.meta_title||doc.title||'');
 const summary=String(doc.seo.meta_description||doc.description||'');
 if(!title.trim())add('title','搜索标题','error','缺少标题。');else if(textLength(title)>65)add('title','搜索标题','warning',`当前 ${textLength(title)} 字符，建议精简，避免搜索结果截断。`);
 if(!summary.trim())add('description','搜索摘要','warning','没有搜索摘要，搜索引擎可能自行截取正文。');else if(textLength(summary)>160)add('description','搜索摘要','warning',`当前 ${textLength(summary)} 字符，建议精简。`);
 const siteOrigin=String(doc.site.primary_domain||'');
 if(doc.seo.canonical_url){try{const canonical=new URL(doc.seo.canonical_url,siteOrigin);if(!['https:','http:'].includes(canonical.protocol))throw Error();if(canonical.pathname!==doc.route)add('canonical','规范地址','warning','canonical 指向与本页面不同的路径，请确认是否有意合并。','seo_metadata');}catch{add('canonical','规范地址','error','canonical 不是有效的 HTTP(S) 地址。','seo_metadata');}}
 else add('canonical','规范地址','info','未手动设置，发布渲染会使用本页路径。','seo_metadata');
 const locale=(await query('SELECT code,hreflang FROM locales WHERE id=$1',[doc.localeId]))[0];
 const siblings=await query(`SELECT l.code,l.hreflang,t.path,t.id FROM ${table} t JOIN locales l ON l.id=t.locale_id WHERE t.${table==='content_item_translations'?'content_item_id':'product_id'}=$1 AND t.deleted_at IS NULL AND l.is_enabled`,[doc.groupId]);
 const missing=siblings.filter(x=>x.id!==id&&!doc.alternates.some(a=>a.locale===x.code));
 if(missing.length)add('hreflang','多语言关联','info',`${missing.map(x=>x.code).join('、')} 尚未发布，不会出现在当前 hreflang 中。`);
 if(!locale?.hreflang)add('hreflang','多语言关联','warning','当前语言缺少 hreflang 代码。','locales');
 if(!doc.schema?.id)add('schema','结构化数据','info','没有绑定自定义 JSON-LD；请确认自动生成的页面类型满足需求。','schema_markup');
 else if(doc.schema?.override_json&&!['object'].includes(typeof doc.schema.override_json))add('schema','结构化数据','error','覆盖数据格式不正确。','schema_markup');
 const links=internalLinks(doc.body);
 if(!links.length)add('links','站内链接','info','正文没有站内链接；可在相关内容中补充有帮助的导航。');
 else{const found=await query<{route:string}>('SELECT route FROM published_documents WHERE route=ANY($1::text[])',[links]);const live=new Set(found.map(x=>x.route));const broken=links.filter(x=>x!==doc.route&&!live.has(x));if(broken.length)add('links','站内链接','warning',`以下站内路径尚未发布：${broken.slice(0,5).join('、')}`);}
 const missingAlt=doc.media.filter(m=>!String(m.alt_text||'').trim());
 if(missingAlt.length)add('alt','图片描述','warning',`${missingAlt.length} 张图片缺少当前语言的 ALT 描述。`,'media_asset_translations');
 if(!doc.site.enable_indexing)add('index','索引状态','warning','站点当前关闭搜索引擎收录。','site_settings');
 if(doc.seo.robots_index===false)add('index','索引状态','warning','本页设置为 noindex。','seo_metadata');
 const score=Math.max(0,100-issues.reduce((sum,x)=>sum+(x.severity==='error'?20:x.severity==='warning'?10:0),0));
 return {title:doc.title,route:doc.route,locale:doc.locale,score,issues,checkedAt:new Date().toISOString()};
}

export async function publishPreview(actor:Actor,tableName:string,id:string){
 const table=kind(tableName);read(actor,table);
 const draft=await sourceDocument(table,id);
 const released=(await query<{snapshot:Document}>('SELECT snapshot FROM published_documents WHERE entity_type=$1 AND entity_id=$2',[table,id]))[0]?.snapshot||null;
 const fields:['title'|'description'|'route'|'body'|'seo',string][]=[['title','标题'],['description','摘要'],['route','路径'],['body','正文'],['seo','搜索设置']];
 const differences=fields.filter(([key])=>JSON.stringify(draft[key])!==JSON.stringify(released?.[key])).map(([key,label])=>({key,label,before:released?.[key]??null,after:draft[key]}));
 const revisions=await query<{id:string;created_at:string;route:string;title:string}>(`SELECT id,created_at,metadata->'snapshot'->>'route' AS route,metadata->'snapshot'->>'title' AS title FROM publish_jobs WHERE entity_type=$1 AND entity_id=$2 AND job_type='publish' AND status='completed' AND metadata ? 'snapshot' ORDER BY created_at DESC LIMIT 15`,[table,id]);
 return {draft,released,differences,revisions};
}

export async function rollbackPublished(actor:Actor,jobId:string){
 publish(actor);
 return transaction(async c=>{
  const old=(await c.query(`SELECT * FROM publish_jobs WHERE id=$1 AND job_type='publish' AND status='completed' AND entity_type IN ('content_item_translations','product_translations') FOR UPDATE`,[jobId])).rows[0];
  if(!old?.metadata?.snapshot)throw new DomainError('找不到可恢复的已发布版本',404);
  const table=kind(old.entity_type);const doc=old.metadata.snapshot as Document;
  const live=(await c.query(`SELECT id,path,deleted_at FROM ${table} WHERE id=$1 FOR UPDATE`,[old.entity_id])).rows[0];
  if(!live||live.deleted_at)throw new DomainError('内容已删除，不能回滚');
  if(live.path!==doc.route)throw new DomainError('网址已更改；请先检查路径后重新发布');
  const task=(await c.query(`INSERT INTO publish_jobs(job_type,entity_type,entity_id,locale_id,requested_by,metadata) VALUES('publish',$1,$2,$3,$4,$5::jsonb) RETURNING id`,[table,old.entity_id,old.locale_id,actor.id,JSON.stringify({snapshot:doc,route:doc.route,rollbackOf:old.id})])).rows[0];
  await audit(c,actor,table,'rollback.requested',{id:old.entity_id,job_id:old.id},{id:old.entity_id,job_id:task.id});
  return {jobId:task.id,route:doc.route};
 });
}
