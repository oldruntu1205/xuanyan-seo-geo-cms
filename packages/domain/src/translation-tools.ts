import {createHash} from 'node:crypto';
import {query,transaction} from './db';
import {audit,DomainError} from './crud';
import {canRead,canWrite,getResource} from './registry';
import type {Actor,Row} from './types';

function requireTranslation(actor:Actor,write=false){
 const r=getResource('content_item_translations');
 if(!(write?canWrite(actor,r):canRead(actor,r))&&!(write?canWrite(actor,getResource('product_translations')):canRead(actor,getResource('product_translations'))))throw new DomainError('没有翻译权限',403);
}
export function sourceHash(text:string){return createHash('sha256').update(text.trim()).digest('hex');}
export async function translationTerms(actor:Actor){requireTranslation(actor);return query(`SELECT t.id,t.source_term,t.target_term,t.note,t.source_locale_id,t.target_locale_id,t.approval_status,t.review_note,t.reviewed_at,s.native_name AS source_language,d.native_name AS target_language,u.display_name AS reviewer_name FROM translation_terms t JOIN locales s ON s.id=t.source_locale_id JOIN locales d ON d.id=t.target_locale_id LEFT JOIN users u ON u.id=t.reviewed_by ORDER BY CASE WHEN t.approval_status='pending' THEN 0 ELSE 1 END,t.updated_at DESC LIMIT 200`);}
export async function saveTranslationTerm(actor:Actor,input:{id?:string;sourceLocaleId:string;targetLocaleId:string;sourceTerm:string;targetTerm:string;note?:string}){
 requireTranslation(actor,true);
 if(input.sourceLocaleId===input.targetLocaleId)throw new DomainError('源语言与目标语言不能相同');
 return transaction(async c=>{
  const result=input.id?
   (await c.query("UPDATE translation_terms SET source_locale_id=$2,target_locale_id=$3,source_term=$4,target_term=$5,note=$6,approval_status='pending',reviewed_by=NULL,reviewed_at=NULL,review_note=NULL WHERE id=$1 RETURNING *",[input.id,input.sourceLocaleId,input.targetLocaleId,input.sourceTerm.trim(),input.targetTerm.trim(),input.note||null])).rows[0]:
   (await c.query('INSERT INTO translation_terms(source_locale_id,target_locale_id,source_term,target_term,note,created_by) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',[input.sourceLocaleId,input.targetLocaleId,input.sourceTerm.trim(),input.targetTerm.trim(),input.note||null,actor.id])).rows[0];
  if(!result)throw new DomainError('术语不存在',404);
  await audit(c,actor,'translation_terms',input.id?'update':'create',null,result);return result;
 });
}
export async function removeTranslationTerm(actor:Actor,id:string){requireTranslation(actor,true);return transaction(async c=>{const old=(await c.query('DELETE FROM translation_terms WHERE id=$1 RETURNING *',[id])).rows[0];if(!old)throw new DomainError('术语不存在',404);await audit(c,actor,'translation_terms','delete',old,null);return {ok:true};});}
export function canReviewTranslationTerm(actor:Actor){return ['admin','super_admin','reviewer'].includes(actor.role)||!!actor.permissions?.includes('translation.approve');}
export async function reviewTranslationTerm(actor:Actor,id:string,decision:'approved'|'rejected',note=''){
 requireTranslation(actor);if(!canReviewTranslationTerm(actor))throw new DomainError('只有审核员或管理员可审批术语',403);
 return transaction(async c=>{
  const before=(await c.query('SELECT * FROM translation_terms WHERE id=$1 FOR UPDATE',[id])).rows[0];if(!before)throw new DomainError('术语不存在',404);
  if(before.approval_status!=='pending')throw new DomainError('这条术语已经审批；修改后才能重新提交',409);
  const after=(await c.query('UPDATE translation_terms SET approval_status=$2,reviewed_by=$3,reviewed_at=now(),review_note=$4 WHERE id=$1 RETURNING *',[id,decision,actor.id,note.trim()||null])).rows[0];
  await c.query('INSERT INTO translation_term_reviews(term_id,decision,note,reviewer_id) VALUES($1,$2,$3,$4)',[id,decision,note.trim()||null,actor.id]);
  await audit(c,actor,'translation_terms','review',before,after);return after;
 });
}
export async function translationMemories(actor:Actor){requireTranslation(actor);return query(`SELECT m.id,m.source_text,m.target_text,m.source_locale_id,m.target_locale_id,m.updated_at,s.native_name AS source_language,d.native_name AS target_language FROM translation_memory m JOIN locales s ON s.id=m.source_locale_id JOIN locales d ON d.id=m.target_locale_id ORDER BY m.updated_at DESC LIMIT 100`);}
export async function translationComparison(actor:Actor,id:string){
 requireTranslation(actor);
 const job=(await query('SELECT * FROM translation_jobs WHERE id=$1',[id]))[0];if(!job)throw new DomainError('翻译任务不存在',404);
 if(!['content_item_translations','product_translations'].includes(job.entity_type)||!canRead(actor,getResource(job.entity_type)))throw new DomainError('没有查看此翻译的权限',403);
 const table=job.entity_type;
 const source=(await query(`SELECT * FROM ${table} WHERE id=$1 AND deleted_at IS NULL`,[job.entity_id]))[0];
 const target=job.target_translation_id?(await query(`SELECT * FROM ${table} WHERE id=$1 AND deleted_at IS NULL`,[job.target_translation_id]))[0]:null;
 if(!source||!target)throw new DomainError('原文或译文草稿不存在',404);
 const fields=table==='content_item_translations'?['title','excerpt','body']:['name','short_description','description','features','applications'];
 return {job:{id:job.id,status:job.status},source:Object.fromEntries(fields.map(k=>[k,source[k]])),target:Object.fromEntries(fields.map(k=>[k,target[k]])),targetPath:target.path};
}
export async function memoryLookup(sourceCode:string,targetCode:string,texts:string[]){
 const hashes=texts.map(sourceHash);
 const rows=await query<Row>(`SELECT source_hash,source_text,target_text FROM translation_memory WHERE source_locale_id=(SELECT id FROM locales WHERE code=$1) AND target_locale_id=(SELECT id FROM locales WHERE code=$2) AND source_hash=ANY($3::char(64)[])`,[sourceCode,targetCode,hashes]);
 const byHash=new Map(rows.map(r=>[String(r.source_hash).trim(),r]));
 return texts.map((text,i)=>{const candidate=byHash.get(hashes[i]);return candidate?.source_text===text.trim()?String(candidate.target_text):null;});
}
export async function glossaryFor(sourceCode:string,targetCode:string){return query<{source_term:string;target_term:string}>(`SELECT source_term,target_term FROM translation_terms WHERE approval_status='approved' AND source_locale_id=(SELECT id FROM locales WHERE code=$1) AND target_locale_id=(SELECT id FROM locales WHERE code=$2) ORDER BY length(source_term) DESC LIMIT 100`,[sourceCode,targetCode]);}

export async function approveTranslationBatch(actor:Actor,ids:string[]){
 requireTranslation(actor,true);
 const done:string[]=[];const failed:{id:string;error:string}[]=[];
 for(const id of [...new Set(ids)].slice(0,30)){
  try{const {translationAction}=await import('./translation');await translationAction(actor,id,'approve');done.push(id);}
  catch(error){failed.push({id,error:error instanceof Error?error.message:'审核失败'});}
 }
 return {done,failed};
}
