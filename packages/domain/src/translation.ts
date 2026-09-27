import {query, transaction} from './db';
import {audit, DomainError} from './crud';
import {canRead, canWrite, getResource} from './registry';
import type {Actor, Row} from './types';
import {activeLLMConfig,llmTranslateBatch,normalizeLLMEndpoint,LLM_PROVIDER} from './llm';
import {glossaryFor,memoryLookup,sourceHash} from './translation-tools';

export type TranslationKind = 'content_item_translations' | 'product_translations';
const kinds:TranslationKind[] = ['content_item_translations','product_translations'];
const translatedKeys = new Set(['title','name','excerpt','short_description','description','text','subtitle','alt','label','question','answer','quote','author','primary_button_text','secondary_button_text']);

function kind(value:string):TranslationKind {
 if (!kinds.includes(value as TranslationKind)) throw new DomainError('只支持页面、文章和产品自动翻译');
 return value as TranslationKind;
}
function allowed(actor:Actor, table:TranslationKind, write=false) {
 if (!(write ? canWrite(actor,getResource(table)) : canRead(actor,getResource(table)))) throw new DomainError('没有翻译权限',403);
}

// 对外只暴露“能不能翻译、为什么不能”，具体凭据由 llm 模块负责。
export async function translationConfig(){
 const value=await activeLLMConfig();
 const reason=value.keyProblem||(!value.apiKey?'尚未保存 DeepSeek API 密钥':!value.enabled?'自动翻译已停用':'');
 return {configured:!!value.apiKey&&value.enabled&&!value.keyProblem,provider:value.provider,model:value.model,enabled:value.enabled,reason};
}

function route(locale:string, source:Row, table:TranslationKind, slug:string) {
 return '/'+locale+(table==='product_translations'?'/products/':source.content_type==='article'?'/blog/':'/')+slug;
}
async function sourceRow(table:TranslationKind,id:string) {
 const parent=table==='product_translations'?'products':'content_items';
 const fk=table==='product_translations'?'product_id':'content_item_id';
 const contentType=table==='content_item_translations'?'p.content_type':'NULL::text';
 const row=(await query(`SELECT t.*,${contentType} AS content_type,l.code AS source_code,l.native_name AS source_language FROM ${table} t JOIN ${parent} p ON p.id=t.${fk} JOIN locales l ON l.id=t.locale_id WHERE t.id=$1 AND t.deleted_at IS NULL AND p.deleted_at IS NULL`,[id]))[0];
 if(!row)throw new DomainError('原文不存在或已删除',404);
 return row;
}
function sameParent(table:TranslationKind){return table==='product_translations'?'product_id':'content_item_id';}

export async function translationTargets(actor:Actor,tableName:string,sourceId:string){
 const table=kind(tableName);allowed(actor,table);
 const source=await sourceRow(table,sourceId);
 const fk=sameParent(table);
 const statusName=table==='product_translations'?'publish_status':'status';
 const locales=await query(`SELECT l.id,l.code,l.native_name,t.id AS existing_id,t.${statusName} AS existing_status FROM locales l LEFT JOIN ${table} t ON t.locale_id=l.id AND t.${fk}=$1 AND t.deleted_at IS NULL WHERE l.is_enabled ORDER BY l.sort_order,l.code`,[source[fk]]);
 return {source:{id:source.id,title:source.title||source.name,locale_id:source.locale_id,language:source.source_language},locales};
}

export async function enqueueTranslations(actor:Actor,input:{entityType:string;entityId:string;targetLocaleIds:string[];overwriteDraft?:boolean}){
 const table=kind(input.entityType);allowed(actor,table,true);
 const config=await translationConfig();
 if(!config.configured)throw new DomainError(config.reason||'请先到“自动翻译 → AI 设置”配置 DeepSeek',503);
 const source=await sourceRow(table,input.entityId);
 const fk=sameParent(table);
 const targets=[...new Set(input.targetLocaleIds)];
 if(!targets.length||targets.length>20)throw new DomainError('请选择 1 到 20 种目标语言');
 return transaction(async c=>{
  const jobs:Row[]=[];
  for(const localeId of targets){
   if(localeId===source.locale_id)throw new DomainError('目标语言不能与原文相同');
   const locale=(await c.query('SELECT id,code FROM locales WHERE id=$1 AND is_enabled',[localeId])).rows[0];
   if(!locale)throw new DomainError('目标语言未启用');
   const existing=(await c.query(`SELECT id,${table==='product_translations'?'publish_status':'status'} AS status FROM ${table} WHERE ${fk}=$1 AND locale_id=$2 AND deleted_at IS NULL`,[source[fk],localeId])).rows[0];
   if(existing&&(!input.overwriteDraft||!['draft','review'].includes(existing.status)))throw new DomainError('目标语言已有内容；只能勾选覆盖已有草稿，已发布内容不可覆盖');
   const duplicate=(await c.query("SELECT 1 FROM translation_jobs WHERE entity_type=$1 AND entity_id=$2 AND target_locale_id=$3 AND status IN ('pending','processing') LIMIT 1",[table,source.id,localeId])).rows[0];
   if(duplicate)throw new DomainError('该目标语言已有翻译任务，请等待完成');
   const job=(await c.query(`INSERT INTO translation_jobs(entity_type,entity_id,source_locale_id,target_locale_id,provider,requested_by,result_data)
    VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id,status`,[table,source.id,source.locale_id,localeId,config.provider,actor.id,JSON.stringify({overwriteDraft:!!input.overwriteDraft})])).rows[0];
   jobs.push(job);
  }
  return {jobs};
 });
}

export async function translationJobs(actor:Actor){
 if(!kinds.some(t=>canRead(actor,getResource(t))))throw new DomainError('没有翻译权限',403);
 const rows=await query(`SELECT j.id,j.entity_type,j.status,j.provider,j.error_message,j.created_at,j.started_at,j.completed_at,
  sl.native_name AS source_language,tl.native_name AS target_language,
  coalesce(ct.title,pt.name,'原文已删除') AS source_title,
  coalesce(target_content.path,target_product.path) AS target_path,
  j.target_translation_id
  FROM translation_jobs j
  JOIN locales sl ON sl.id=j.source_locale_id JOIN locales tl ON tl.id=j.target_locale_id
  LEFT JOIN content_item_translations ct ON j.entity_type='content_item_translations' AND ct.id=j.entity_id
  LEFT JOIN product_translations pt ON j.entity_type='product_translations' AND pt.id=j.entity_id
  LEFT JOIN content_item_translations target_content ON j.entity_type='content_item_translations' AND target_content.id=j.target_translation_id
  LEFT JOIN product_translations target_product ON j.entity_type='product_translations' AND target_product.id=j.target_translation_id
  WHERE j.entity_type=ANY($1::text[]) ORDER BY j.created_at DESC LIMIT 100`,[kinds.filter(t=>canRead(actor,getResource(t)))]);
 return {rows,config:await translationConfig()};
}

export async function translationAction(actor:Actor,id:string,action:'retry'|'approve'){
 const current=(await query('SELECT * FROM translation_jobs WHERE id=$1',[id]))[0];
 if(!current)throw new DomainError('翻译任务不存在',404);
 const table=kind(current.entity_type);
 allowed(actor,table,true);
 if(action==='retry'){
  if(current.status!=='failed')throw new DomainError('只有失败任务可以重试');
  const config=await translationConfig();
  if(!config.configured)throw new DomainError(config.reason||'请先配置翻译服务',503);
  await query("UPDATE translation_jobs SET status='pending',error_message=NULL,started_at=NULL,completed_at=NULL,attempt_count=0 WHERE id=$1 AND status='failed'",[id]);
 }else if(action==='approve'){
  if(current.status!=='review')throw new DomainError('任务尚未进入待审核状态');
  await transaction(async c=>{
   const job=(await c.query("SELECT * FROM translation_jobs WHERE id=$1 AND status='review' FOR UPDATE",[id])).rows[0];
   if(!job)throw new DomainError('任务状态已改变，请刷新后重试',409);
   const target=job.target_translation_id?(await c.query(`SELECT * FROM ${table} WHERE id=$1 AND deleted_at IS NULL`,[job.target_translation_id])).rows[0]:null;
   if(!target)throw new DomainError('译文草稿不存在，请先检查内容');
   const pairs=Array.isArray(job.result_data?.segmentPairs)?job.result_data.segmentPairs:[];
   for(const pair of pairs){
    if(!Array.isArray(pair.path)||typeof pair.source!=='string')continue;
    let value:any=target;for(const key of pair.path)value=value?.[key];
    if(typeof value!=='string'||!value.trim())continue;
    await c.query(`INSERT INTO translation_memory(source_locale_id,target_locale_id,source_hash,source_text,target_text,approved_by) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(source_locale_id,target_locale_id,source_hash) DO UPDATE SET target_text=EXCLUDED.target_text,approved_by=EXCLUDED.approved_by`,[job.source_locale_id,job.target_locale_id,sourceHash(pair.source),pair.source.trim(),value.trim(),actor.id]);
   }
   await c.query("UPDATE translation_jobs SET status='approved' WHERE id=$1",[id]);
   await audit(c,actor,'translation_jobs','approve',job,{...job,status:'approved'});
  });
 }else throw new DomainError('未知操作');
 return {ok:true};
}

type Segment={path:(string|number)[];text:string};
function segments(document:Row){
 const found:Segment[]=[];
 function visit(value:unknown,path:(string|number)[]){
  if(typeof value==='string'){
   const key=path.at(-1);
   if(value.trim()&&(typeof key==='string'&&translatedKeys.has(key)||typeof key==='number'&&['features','applications'].includes(String(path[0]))))found.push({path,text:value});
  }else if(Array.isArray(value))value.forEach((x,i)=>visit(x,[...path,i]));
  else if(value&&typeof value==='object')for(const [key,item] of Object.entries(value))visit(item,[...path,key]);
 }
 visit(document,[]);return found;
}
function setPath(object:Row,path:(string|number)[],value:string){let target:Row=object;for(const key of path.slice(0,-1))target=target[key];target[path.at(-1)!]=value;}
const usageKeys=['prompt_tokens','completion_tokens','total_tokens'] as const;

// 分批调用上游并按原顺序拼回。任一批失败即整体失败，已产生的译文不落库。
async function translateTexts(texts:string[],sourceLocale:string,targetLocale:string){
 const config=await activeLLMConfig();
 if(config.keyProblem)throw new DomainError(config.keyProblem,503);
 if(!config.apiKey)throw new DomainError('尚未配置 DeepSeek API 密钥，请到“自动翻译 → AI 设置”填写并保存',503);
 if(!config.enabled)throw new DomainError('自动翻译已停用，请在“自动翻译 → AI 设置”勾选“启用自动翻译”',503);
 const endpoint=normalizeLLMEndpoint(config.url);
 const all:string[]=new Array(texts.length);
 const usage:Row={prompt_tokens:0,completion_tokens:0,total_tokens:0};
 const startedAt=Date.now();
 const remembered=await memoryLookup(sourceLocale,targetLocale,texts);
 const terms=await glossaryFor(sourceLocale,targetLocale);
 const missing=texts.map((text,index)=>({text,index})).filter(x=>{if(remembered[x.index]){all[x.index]=remembered[x.index]!;return false;}return true;});
 let batches=0,offset=0;
 while(offset<missing.length){
  const batch:{text:string;index:number}[]=[];let length=0;
  while(offset<missing.length&&batch.length<12&&(length+missing[offset].text.length<4500||!batch.length)){
   batch.push(missing[offset]);length+=missing[offset].text.length;offset++;
  }
  const result=await llmTranslateBatch({endpoint,apiKey:config.apiKey,model:config.model},batch.map(x=>x.text),sourceLocale,targetLocale,terms);
  for(const key of usageKeys)usage[key]=(Number(usage[key])||0)+(Number(result.usage?.[key])||0);
  batch.forEach((item,i)=>{all[item.index]=result.texts[i];});
  batches++;
 }
 return {texts:all,usage,model:config.model,durationMs:Date.now()-startedAt,batches};
}

export async function claimTranslationJob(){
 await query("UPDATE translation_jobs SET status=CASE WHEN attempt_count>=3 THEN 'failed' ELSE 'pending' END,error_message=CASE WHEN attempt_count>=3 THEN '任务中断次数过多，请手动重试' ELSE NULL END WHERE status='processing' AND started_at<now()-interval '60 minutes'");
 return (await query(`WITH next AS (SELECT id FROM translation_jobs WHERE status='pending' ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1)
  UPDATE translation_jobs j SET status='processing',started_at=now(),completed_at=NULL,error_message=NULL,attempt_count=attempt_count+1 FROM next WHERE j.id=next.id RETURNING j.*`))[0];
}

export async function processTranslationJob(job:Row){
 const table=kind(job.entity_type);
 try{
  const source=await sourceRow(table,job.entity_id);
  const targetLocale=(await query('SELECT id,code FROM locales WHERE id=$1 AND is_enabled',[job.target_locale_id]))[0];
  if(!targetLocale)throw new Error('目标语言已停用');
  const fk=sameParent(table);
  const statusName=table==='product_translations'?'publish_status':'status';
  const existing=(await query(`SELECT * FROM ${table} WHERE ${fk}=$1 AND locale_id=$2`,[source[fk],targetLocale.id]))[0];
  if(existing&&!existing.deleted_at&&(!job.result_data?.overwriteDraft||!['draft','review'].includes(existing[statusName])))throw new Error('目标语言已有内容，任务未覆盖它');
  const originalUpdated=existing?.updated_at?new Date(existing.updated_at).getTime():null;
  let document:Row=table==='product_translations'
   ?{name:source.name,short_description:source.short_description,description:source.description,features:source.features,applications:source.applications}
   :{title:source.title,excerpt:source.excerpt,body:source.body};
  if(table==='content_item_translations'){
   const blocks=await query('SELECT block_type AS type,data FROM content_blocks WHERE content_translation_id=$1 AND is_enabled ORDER BY sort_order,id',[source.id]);
   if(blocks.length)document.body=blocks;
  }
  document=structuredClone(document);
  const parts=segments(document);
  if(!parts.length)throw new Error('原文没有可翻译的文字');
  if(parts.length>150||parts.reduce((n,item)=>n+item.text.length,0)>60000)throw new Error('原文超过单次翻译上限，请拆分内容后重试');
  const translated=await translateTexts(parts.map(x=>x.text),source.source_code,targetLocale.code);
  parts.forEach((item,i)=>setPath(document,item.path,translated.texts[i]));
  await transaction(async c=>{
   const fresh=(await c.query(`SELECT * FROM ${table} WHERE ${fk}=$1 AND locale_id=$2 FOR UPDATE`,[source[fk],targetLocale.id])).rows[0];
   if((fresh?.updated_at?new Date(fresh.updated_at).getTime():null)!==originalUpdated)throw new Error('目标草稿已被其他人修改，翻译没有覆盖');
   if(fresh&&!fresh.deleted_at&&(!job.result_data?.overwriteDraft||!['draft','review'].includes(fresh[statusName])))throw new Error('目标语言不再允许覆盖');
   const title=table==='product_translations'?document.name:document.title;
   const reviving=!!fresh?.deleted_at;
   let slug=reviving?source.slug:fresh?.slug||source.slug;
   if(!fresh||reviving){
    let candidate=route(targetLocale.code,source,table,slug);
    if((await c.query('SELECT 1 FROM site_paths WHERE path=$1',[candidate])).rowCount){slug=(source.slug+'-'+String(source[fk]).slice(0,8)).slice(0,200);candidate=route(targetLocale.code,source,table,slug);}
    if((await c.query('SELECT 1 FROM site_paths WHERE path=$1',[candidate])).rowCount)throw new Error('目标语言的网址路径已被占用');
   }
   const path=reviving?route(targetLocale.code,source,table,slug):fresh?.path||route(targetLocale.code,source,table,slug);
   const row=table==='product_translations'
    ?fresh?(await c.query(`UPDATE product_translations SET name=$2,short_description=$3,description=$4,features=$5,applications=$6,publish_status='draft',slug=$7,path=$8,deleted_at=NULL WHERE id=$1 RETURNING *`,[fresh.id,title,document.short_description,document.description,JSON.stringify(document.features),JSON.stringify(document.applications),slug,path])).rows[0]
      :(await c.query(`INSERT INTO product_translations(product_id,locale_id,name,slug,path,short_description,description,features,applications) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,[source.product_id,targetLocale.id,title,slug,path,document.short_description,document.description,JSON.stringify(document.features),JSON.stringify(document.applications)])).rows[0]
    :fresh?(await c.query(`UPDATE content_item_translations SET title=$2,excerpt=$3,body=$4,status='draft',slug=$5,path=$6,deleted_at=NULL WHERE id=$1 RETURNING *`,[fresh.id,title,document.excerpt,JSON.stringify(document.body),slug,path])).rows[0]
      :(await c.query(`INSERT INTO content_item_translations(content_item_id,locale_id,title,slug,path,excerpt,body) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,[source.content_item_id,targetLocale.id,title,slug,path,document.excerpt,JSON.stringify(document.body)])).rows[0];
   // Target page blocks take precedence over body during publishing. Keep them for recovery but disable them after an explicit draft overwrite.
   if(table==='content_item_translations'&&fresh)await c.query('UPDATE content_blocks SET is_enabled=false WHERE content_translation_id=$1 AND is_enabled',[fresh.id]);
   if(job.requested_by)await audit(c,{id:job.requested_by,email:'',role:'translator'},table,fresh?'update':'create',fresh||null,row);
   await c.query("UPDATE translation_jobs SET status='review',target_translation_id=$2,result_data=$3,error_message=NULL,completed_at=now() WHERE id=$1",[job.id,row.id,JSON.stringify({
    sourceUpdatedAt:source.updated_at,targetPath:row.path,translatedFields:parts.length,
    segmentPairs:parts.map(item=>({path:item.path,source:item.text})),
    metrics:{provider:LLM_PROVIDER,model:translated.model,batches:translated.batches,durationMs:translated.durationMs,promptTokens:translated.usage.prompt_tokens,completionTokens:translated.usage.completion_tokens,totalTokens:translated.usage.total_tokens},
   })]);
  });
 }catch(error){
  const message=error instanceof Error?error.message:'翻译任务失败';
  await query("UPDATE translation_jobs SET status='failed',error_message=$2,completed_at=now() WHERE id=$1 AND status='processing'",[job.id,message.slice(0,500)]);
  throw error;
 }
}
