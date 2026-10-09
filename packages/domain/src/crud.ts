import { query, transaction, identifier as q } from './db';
import { resources, getResource, canRead, canWrite } from './registry';
import { leadTableScope } from './lead-scope';
import type { Actor, Row } from './types';
import type { PoolClient } from 'pg';
export class DomainError extends Error { constructor(message:string,public status=400){super(message);} }
const privateColumns=new Set(['password_hash','search_vector']);
const immutable=new Set(['deleted_at','id','created_at','updated_at','search_vector','password_hash','created_by','updated_by']);
export async function columns(table:string) {
 getResource(table);
 const cols=await query(`SELECT c.column_name AS name,c.data_type AS type,c.is_nullable='YES' AS nullable,c.column_default AS default,
 (SELECT ccu.table_name FROM information_schema.constraint_column_usage ccu JOIN information_schema.table_constraints tc ON tc.constraint_name=ccu.constraint_name AND tc.constraint_schema=ccu.constraint_schema JOIN information_schema.key_column_usage kcu ON kcu.constraint_name=tc.constraint_name AND kcu.constraint_schema=tc.constraint_schema WHERE tc.table_schema='public' AND tc.table_name=c.table_name AND tc.constraint_type='FOREIGN KEY' AND kcu.column_name=c.column_name LIMIT 1) AS reference
 FROM information_schema.columns c WHERE c.table_schema='public' AND c.table_name=$1 ORDER BY c.ordinal_position`,[table]);
 // Bind each CHECK to its own column through conkey/attnum instead of substring-matching the definition text,
 // which would confuse "status" with "publish_status". Numeric literals are captured too (e.g. redirect_type IN (301,302)).
 // attname is cast to text so the result is a text[] the pg driver parses; name[] would arrive as a raw string.
 const checks=await query(`SELECT pg_get_constraintdef(con.oid) AS definition,array(SELECT a.attname::text FROM unnest(con.conkey) WITH ORDINALITY u(attnum,n) JOIN pg_attribute a ON a.attrelid=con.conrelid AND a.attnum=u.attnum ORDER BY u.n) AS columns FROM pg_constraint con WHERE con.conrelid=to_regclass($1) AND con.contype='c'`,['public.'+table]);
 return cols.filter(c=>!privateColumns.has(c.name)).map(c=>{const check=checks.find(x=>x.columns.length===1&&x.columns[0]===c.name&&x.definition.includes('= ANY'));return {...c,options:check?Array.from(check.definition.matchAll(/'([^']+)'|(-?\d+(?:\.\d+)?)/g),(m:any)=>m[1]??m[2]):undefined,readonly:immutable.has(c.name)};});
}
export function allowed(actor:Actor|undefined,table:string,write=false) {if(!actor)throw new DomainError('请先登录',401);const r=getResource(table);if(!(write?canWrite(actor,r):canRead(actor,r)))throw new DomainError('没有此操作权限',403);return r;}
export async function list(actor:Actor,table:string,options:{page?:number;limit?:number;search?:string;filter?:Row}={}){
 const r=allowed(actor,table);const cols=await columns(table);const names=cols.map(c=>c.name);const params:unknown[]=[];const where:string[]=[];
 if(names.includes('deleted_at'))where.push('deleted_at IS NULL');
 if(['audit_logs','content_revisions'].includes(table)&&!['admin','super_admin'].includes(actor.role)){params.push(resources.filter(r=>canRead(actor,r)&&!['history','system','leads'].includes(r.group)).map(r=>r.table));where.push(`entity_type=ANY(${params.length}::text[])`);}
 for(const [k,v] of Object.entries(options.filter??{})){if(!names.includes(k))throw new DomainError('Invalid filter');params.push(v);where.push(`${q(k)}=$${params.length}`);}
 if(options.search){const textCols=cols.filter(c=>['text','character varying','USER-DEFINED'].includes(c.type)&&!['id'].includes(c.name)&&!c.name.endsWith('_id')).map(c=>q(c.name)+'::text');if(textCols.length){params.push('%'+options.search.slice(0,200)+'%');where.push(`concat_ws(' ',${textCols.join(',')}) ILIKE $${params.length}`);}}
 // leads 组（询盘/明细/下载记录）：client 只看自己的（邮箱匹配或指派给他），其余角色不受限
 if(r.group==='leads'){const scope=leadTableScope(actor,table,params).replace(/^\s*AND\s+/,'');if(scope)where.push(scope);}
 const predicate=where.length?' WHERE '+where.join(' AND '):'';const count=await query(`SELECT count(*)::int AS count FROM ${q(table)}${predicate}`,params);
 const limit=Math.min(100,Math.max(1,options.limit||25)),page=Math.max(1,options.page||1);
 const rows=await query(`SELECT ${names.map(q).join(',')} FROM ${q(table)}${predicate} ORDER BY ${q(names.includes('updated_at')?'updated_at':names.includes('created_at')?'created_at':r.key![0])} DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`,[...params,limit,(page-1)*limit]);
 return {rows,total:count[0].count,page,limit,columns:cols,resource:r};
}
export function keyWhere(table:string,key:Row,offset=0){const keys=getResource(table).key!;if(keys.some(k=>key[k]===undefined))throw new DomainError('Missing record key');return {sql:keys.map((k,i)=>`${q(k)}=$${i+1+offset}`).join(' AND '),values:keys.map(k=>key[k])};}
export async function audit(c:PoolClient,actor:Actor,table:string,action:string,old:Row|null,next:Row|null){
 const scrub=(x:Row|null)=>{if(!x)return null;const row={...x};privateColumns.forEach(k=>delete row[k]);return row;};
 await c.query('INSERT INTO audit_logs(user_id,action,entity_type,entity_id,old_data,new_data) VALUES($1,$2,$3,$4,$5,$6)',[actor.id,action,table,next?.id??old?.id??null,JSON.stringify(scrub(old)),JSON.stringify(scrub(next))]);
 if(old?.id && ['content_items','content_item_translations','products','product_translations'].includes(table))await c.query(`INSERT INTO content_revisions(entity_type,entity_id,locale_id,version_number,snapshot,created_by) SELECT $1,$2,$3,coalesce(max(version_number),0)+1,$4,$5 FROM content_revisions WHERE entity_type=$1 AND entity_id=$2`,[table,old.id,old.locale_id??null,JSON.stringify(scrub(old)),actor.id]);
}
export async function ensureActor(actor:Actor){await query(`INSERT INTO users(id,email,password_hash,display_name) VALUES($1,$2,'external:payload',$3) ON CONFLICT(id) DO UPDATE SET email=EXCLUDED.email,display_name=EXCLUDED.display_name`,[actor.id,actor.email,actor.displayName||actor.email]);}
export async function save(actor:Actor,table:string,input:Row,key?:Row){
 allowed(actor,table,true);const cols=await columns(table);const names=new Set(cols.map(c=>c.name));const expected=input._expectedUpdatedAt;const data:Row={};
 for(const [k,v] of Object.entries(input)){if(k.startsWith('_'))continue;if(!names.has(k)||immutable.has(k))continue;if(typeof v==='string'&&v.length>1000000)throw new DomainError('Field too large');data[k]=v;}
 if(['content_item_translations','product_translations','content_items'].includes(table)&&['published','scheduled'].includes(data.status??data.publish_status))throw new DomainError('请使用发布 / 定时发布操作');
 if(table==='media_assets'&&Object.keys(data).some(k=>!['deleted_at','original_filename'].includes(k)))throw new DomainError('媒体文件通过上传接口创建');
 if(table==='locales'&&key&&data.code){const old=await list(actor,table,{filter:key});if(old.rows[0]?.code!==data.code)throw new DomainError('已有语言代码不可重命名；请新建语言');}
 if(table==='site_settings'&&data.primary_domain){try{const u=new URL(data.primary_domain);if(!['http:','https:'].includes(u.protocol)||u.username||u.password)throw new Error();data.primary_domain=u.origin;}catch{throw new DomainError('请输入完整 http(s) 站点地址');}}
 if(data.body!==undefined&&(!Array.isArray(data.body)||data.body.some((b:any)=>!b||typeof b.type!=='string'||!b.data||typeof b.data!=='object'||Array.isArray(b.data))))throw new DomainError('正文必须是包含 type 和 data 的区块数组');
 if(names.has('updated_by'))data.updated_by=actor.id;
 if(!key&&names.has('created_by'))data.created_by=actor.id;
 return transaction(async c=>{
  let old:Row|null=null;if(key){const w=keyWhere(table,key);old=(await c.query(`SELECT * FROM ${q(table)} WHERE ${w.sql} FOR UPDATE`,w.values)).rows[0];if(!old)throw new DomainError('记录不存在',404);if(expected&&old.updated_at&&new Date(expected).getTime()!==new Date(old.updated_at).getTime())throw new DomainError('记录已被其他人修改，请重新加载',409);}
  const fields=Object.keys(data);if(!fields.length)throw new DomainError('没有可保存的字段');
 // 2026-10-09 L1 终审 Q4 要求：后台不能继续让用户编辑一个会被块表忽略的 body。
 // 渲染时块表优先（见 documents.ts），若在某条已存在块表行的译文上保存 body，用户会"以为改了、
 // 前台不变"。此处改为**明确拒绝**并给出处置办法 —— 按裁定只做单页面的显式转换，不做全库迁移。
 if(table==='content_item_translations'&&data.body!==undefined&&key){
  const owned=(await c.query('SELECT 1 FROM content_blocks WHERE content_translation_id=$1 LIMIT 1',[key.id]));
  if((owned.rowCount??0)>0)throw new DomainError('该页面的内容由「页面区块」提供，保存正文不会生效。请改用「页面区块」编辑；若确实要改回正文，请先删除该页面的全部区块记录。');
 }
  const values=fields.map(k=>cols.find(c=>c.name===k)?.type==='jsonb'?JSON.stringify(data[k]):data[k]);
  let result;if(key){const w=keyWhere(table,key,values.length);result=await c.query(`UPDATE ${q(table)} SET ${fields.map((f,i)=>`${q(f)}=$${i+1}`).join(',')} WHERE ${w.sql} RETURNING *`,[...values,...w.values]);}
  else result=await c.query(`INSERT INTO ${q(table)}(${fields.map(q).join(',')}) VALUES(${fields.map((_,i)=>'$'+(i+1)).join(',')}) RETURNING *`,values);
  await audit(c,actor,table,key?'update':'create',old,result.rows[0]);const row=result.rows[0];privateColumns.forEach(k=>delete row[k]);return row;
 });
}
export async function remove(actor:Actor,table:string,key:Row){
 allowed(actor,table,true);const cols=await columns(table);const w=keyWhere(table,key);
 return transaction(async c=>{const old=(await c.query(`SELECT * FROM ${q(table)} WHERE ${w.sql} FOR UPDATE`,w.values)).rows[0];if(!old)throw new DomainError('记录不存在',404);
  if(['content_items','products'].includes(table)){
   const child=table==='products'?'product_translations':'content_item_translations',fk=table==='products'?'product_id':'content_item_id';
   await c.query(`INSERT INTO publish_jobs(job_type,entity_type,entity_id,locale_id,requested_by,metadata) SELECT 'unpublish',$1,id,locale_id,$2,jsonb_build_object('route',path) FROM ${child} WHERE ${fk}=$3`,[child,actor.id,old.id]);
   await c.query(`UPDATE ${child} SET deleted_at=now() WHERE ${fk}=$1`,[old.id]);
  }
  if(['content_item_translations','product_translations','taxonomy_term_translations'].includes(table))await c.query(`INSERT INTO publish_jobs(job_type,entity_type,entity_id,locale_id,requested_by,metadata) VALUES('unpublish',$1,$2,$3,$4,jsonb_build_object('route',$5::text))`,[table,old.id,old.locale_id,actor.id,old.path]);
  await c.query(cols.some(x=>x.name==='deleted_at')?`UPDATE ${q(table)} SET deleted_at=now() WHERE ${w.sql}`:`DELETE FROM ${q(table)} WHERE ${w.sql}`,w.values);
  await audit(c,actor,table,'delete',old,null);return {ok:true};
 });
}
export async function restoreRevision(actor:Actor,id:string){
 const r=(await query('SELECT * FROM content_revisions WHERE id=$1',[id]))[0];if(!r)throw new DomainError('版本不存在',404);
 const data={...r.snapshot};if('status'in data)data.status='draft';if('publish_status'in data)data.publish_status='draft';return save(actor,r.entity_type,data,{id:r.entity_id});
}
