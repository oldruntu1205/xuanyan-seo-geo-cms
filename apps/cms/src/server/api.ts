import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { query,transaction,serviceForVisitor,resources,canRead,canWrite,list,save,remove,restoreRevision,requestPublish,rebuildSite,jobAction,siteContext,released,DomainError,assetURL,type Row } from '@suns/domain';
import { actorFor,checkOrigin } from './auth';
import { uploadMedia } from './media';

const response=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
async function json(request:Request){const raw=await boundedBody(request,2_000_000);try{return JSON.parse(new TextDecoder().decode(raw));}catch{throw new DomainError('无效 JSON');}}
export async function boundedBody(request:Request,limit:number){const reader=request.body?.getReader();if(!reader)throw new DomainError('请求正文不能为空');const chunks:Uint8Array[]=[];let total=0;for(;;){const {value,done}=await reader.read();if(done)break;total+=value.byteLength;if(total>limit){await reader.cancel();throw new DomainError('请求过大',413);}chunks.push(value);}const b=new Uint8Array(total);let offset=0;for(const c of chunks){b.set(c,offset);offset+=c.length;}return b;}
let proxyWarningIssued=false;
// Forwarded headers are trustworthy only when the operator declares a proxy in front (TRUST_PROXY=1).
// Otherwise every visitor deliberately shares one bucket: trusting a client-supplied header would let anyone bypass rate limits.
function clientIP(request:Request){
 if(process.env.TRUST_PROXY!=='1'){if(process.env.DEPLOYMENT_ENV==='production'&&!proxyWarningIssued){proxyWarningIssued=true;console.warn('[rate-limit] TRUST_PROXY is not "1": all visitors share one bucket. Set TRUST_PROXY=1 behind a proxy that overwrites X-Real-IP.');}return 'local';}
 const real=(request.headers.get('x-real-ip')||'').trim();if(real)return real;
 return (request.headers.get('x-forwarded-for')||'').split(',')[0]?.trim()||'unknown';
}
async function rateLimit(request:Request,name:string,max:number){const rows=await query(`INSERT INTO api_rate_limits(key,window_start,count) VALUES($1,now(),1) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN api_rate_limits.window_start<now()-interval '1 minute' THEN 1 ELSE api_rate_limits.count+1 END,window_start=CASE WHEN api_rate_limits.window_start<now()-interval '1 minute' THEN now() ELSE api_rate_limits.window_start END RETURNING count`,[name+':'+clientIP(request)]);if(rows[0].count>max)throw new DomainError('请求过于频繁，请稍后重试',429);}
const inquirySchema=z.object({key:z.string().uuid(),locale:z.string().min(2).max(10),name:z.string().trim().min(1).max(160),email:z.string().email().max(254),company:z.string().max(200).optional(),phone:z.string().max(80).optional(),country:z.string().max(80).optional(),message:z.string().trim().min(5).max(10000),inquiry_type:z.enum(['contact','rfq','product','sample','distributor']).default('contact'),website:z.string().max(200).optional(),source_url:z.string().max(2000).optional(),consent:z.literal(true),items:z.array(z.object({product_id:z.string().uuid(),quantity:z.number().positive().max(1e9)})).max(50).optional(),utm_source:z.string().max(200).optional(),utm_medium:z.string().max(200).optional(),utm_campaign:z.string().max(200).optional(),utm_term:z.string().max(200).optional(),utm_content:z.string().max(200).optional()});
async function publicApi(request:Request,parts:string[],url:URL):Promise<Response|undefined>{
 const action=parts[0];const locale=url.searchParams.get('locale')||'en';
 if(request.method==='GET'&&action==='service'){const l=(await query('SELECT id FROM locales WHERE code=$1 AND is_enabled',[locale]))[0];if(!l)return response({channels:[]});const country=(url.searchParams.get('country')||(process.env.TRUST_PROXY==='1'?request.headers.get('cf-ipcountry'):'')||'').toUpperCase();const ctx=await siteContext(l.id);return response({channels:serviceForVisitor(ctx.channels,/^[A-Z]{2}$/.test(country)?country:'')});}
 if(request.method==='GET'&&action==='health'){await query('SELECT 1');return response({ok:true});}
 if(request.method==='GET'&&action==='document'){const doc=await released(url.searchParams.get('path')||'');return doc?response(doc):response({error:'页面尚未发布'},404);}
 if(request.method==='GET'&&action==='catalog'){
  const type=url.searchParams.get('kind')==='products'?'product_translations':'content_item_translations';const page=Math.max(1,Number(url.searchParams.get('page'))||1);
  const rows=await query(`SELECT route,snapshot->>'title' AS title,snapshot->>'description' AS description,snapshot->'media' AS media FROM published_documents WHERE locale_id=(SELECT id FROM locales WHERE code=$1 AND is_enabled) AND entity_type=$2 ORDER BY published_at DESC LIMIT 24 OFFSET $3`,[locale,type,(page-1)*24]);return response({rows,page});
 }
 if(request.method==='GET'&&action==='search'){
  await rateLimit(request,'search',90);const term=(url.searchParams.get('q')||'').slice(0,150);const rows=term.trim()?await query(`SELECT route,snapshot->>'title' AS title,snapshot->>'description' AS description FROM published_documents WHERE locale_id=(SELECT id FROM locales WHERE code=$1 AND is_enabled) AND to_tsvector('simple',coalesce(snapshot->>'title','')||' '||coalesce(snapshot->>'description','')) @@ plainto_tsquery('simple',$2) ORDER BY published_at DESC LIMIT 30`,[locale,term]):[];return response({rows});
 }
 if(request.method==='GET'&&action==='resolve'){
  const path=(url.searchParams.get('path')||'').replace(/\/$/,'');const r=(await query('UPDATE redirects SET hit_count=hit_count+1,last_hit_at=now() WHERE source_path=$1 AND is_enabled RETURNING target_url,redirect_type',[path]))[0];return r?new Response(null,{status:r.redirect_type,headers:{Location:r.target_url}}):new Response('Not found',{status:404});
 }
 if(request.method==='POST'&&action==='inquiries'){
  checkOrigin(request);await rateLimit(request,'inquiry',6);const data=inquirySchema.parse(await json(request));if(data.website)return response({ok:true});
  const result=await transaction(async c=>{
   await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[data.key]);const existing=(await c.query('SELECT i.inquiry_number FROM public_submissions s JOIN inquiries i ON i.id=s.inquiry_id WHERE s.key=$1',[data.key])).rows[0];if(existing)return existing;
   const l=(await c.query('SELECT id FROM locales WHERE code=$1 AND is_enabled',[data.locale])).rows[0];if(!l)throw new DomainError('Unsupported locale');
   const number='RFQ-'+new Date().toISOString().slice(0,10).replaceAll('-','')+'-'+randomUUID().slice(0,8).toUpperCase();
   const item=(await c.query(`INSERT INTO inquiries(inquiry_number,inquiry_type,name,email,company,phone,country,locale_id,message,source_url,utm_source,utm_medium,utm_campaign,utm_term,utm_content,consent_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,now()) RETURNING id,inquiry_number`,[number,data.inquiry_type,data.name,data.email,data.company,data.phone,data.country,l.id,data.message,data.source_url,data.utm_source,data.utm_medium,data.utm_campaign,data.utm_term,data.utm_content])).rows[0];
   for(const entry of data.items||[]){const p=(await c.query(`SELECT p.sku,p.id,t.name FROM products p JOIN product_translations t ON t.product_id=p.id AND t.locale_id=$2 JOIN published_documents d ON d.entity_id=t.id AND d.entity_type='product_translations' WHERE p.id=$1 AND p.deleted_at IS NULL`,[entry.product_id,l.id])).rows[0];if(!p)throw new DomainError('Product is unavailable');await c.query(`INSERT INTO inquiry_items(inquiry_id,product_id,product_name_snapshot,sku_snapshot,quantity) VALUES($1,$2,$3,$4,$5)`,[item.id,p.id,p.name,p.sku,entry.quantity]);}
   await c.query('INSERT INTO public_submissions(key,inquiry_id) VALUES($1,$2)',[data.key,item.id]);return item;
  });return response({ok:true,inquiry_number:result.inquiry_number},201);
 }
 if(request.method==='GET'&&action==='download'){
  await rateLimit(request,'download',60);const id=z.string().uuid().parse(parts[1]);const m=(await query(`SELECT * FROM media_assets WHERE id=$1 AND deleted_at IS NULL AND EXISTS(SELECT 1 FROM published_documents WHERE snapshot->'documents' @> jsonb_build_array(jsonb_build_object('media_id',$1::text)))`,[id]))[0];if(!m)throw new DomainError('File not found',404);await query(`INSERT INTO download_events(media_id,locale_id,source_url) VALUES($1,(SELECT id FROM locales WHERE code=$2),$3)`,[id,locale,request.headers.get('referer')?.slice(0,2000)]);return new Response(null,{status:302,headers:{Location:assetURL(m),'Cache-Control':'no-store'}});
 }
 if(action==='chat'&&request.method==='POST')return response({error:'AI chat is not enabled. Please use the contact form.'},501);
 return undefined;
}
export async function handle(request:Request,{params}:{params:Promise<{path:string[]}>}){
 try{
  const {path}=await params;const url=new URL(request.url);const publicResponse=await publicApi(request,path,url);if(publicResponse)return publicResponse;
  checkOrigin(request);const actor=await actorFor(request);const table=url.searchParams.get('resource')||'';
  if(path[0]==='meta')return response({actor,resources:resources.filter(r=>canRead(actor,r)).map(r=>({...r,writable:canWrite(actor,r)}))});
  if(path[0]==='dashboard'){const names=['content_items','products','media_assets','publish_jobs',...(['admin','super_admin'].includes(actor.role)?['inquiries']:[])];const counts:Row={};for(const t of names)counts[t]=(await query(`SELECT count(*)::int AS n FROM ${t}`))[0].n;return response({counts,jobs:await query('SELECT id,job_type,entity_type,status,error_message,created_at FROM publish_jobs ORDER BY created_at DESC LIMIT 8')});}
  if(path[0]==='records'){
   if(request.method==='GET'){const filter=url.searchParams.get('filter');return response(await list(actor,table,{page:Number(url.searchParams.get('page')),search:url.searchParams.get('search')||'',filter:filter?JSON.parse(filter):undefined}));}
   const body=await json(request);if(request.method==='POST'||request.method==='PATCH')return response(await save(actor,table,body.data,body.key),request.method==='POST'?201:200);if(request.method==='DELETE')return response(await remove(actor,table,body.key));
  }
  if(path[0]==='upload'&&request.method==='POST'){
   if(!canWrite(actor,resources.find(r=>r.table==='media_assets')!))throw new DomainError('没有上传权限',403);
   const bytes=await boundedBody(request,26*1024*1024);const copy=new Request(request.url,{method:'POST',headers:request.headers,body:bytes as any});const form=await copy.formData();const file=form.get('file');if(!(file instanceof File))throw new DomainError('请选择文件');return response(await uploadMedia(file,actor),201);
  }
  if(path[0]==='publish'&&request.method==='POST'){const b=await json(request);return response(b.resource==='site'?await rebuildSite(actor):await requestPublish(actor,b.resource,b.id,b.action,b.scheduledAt),202);}
  if(path[0]==='jobs'&&request.method==='POST'){const b=await json(request);return response(await jobAction(actor,b.id,b.action));}
  if(path[0]==='restore'&&request.method==='POST'){const b=await json(request);return response(await restoreRevision(actor,b.id));}
  return response({error:'Not found'},404);
 }catch(error:any){if(error instanceof DomainError)return response({error:error.message},error.status);if(error instanceof z.ZodError)return response({error:error.errors.map(e=>e.path.join('.')+': '+e.message).join('; ')},400);if(error.code==='23505')return response({error:'记录或 URL 已存在，请检查唯一字段'},409);if(['23503','23514','23502','22P02','22007','22003'].includes(error.code))return response({error:'字段格式、必填值或关联记录不符合数据约束'},400);console.error('API failure',error);return response({error:'服务暂时不可用，请联系管理员'},503);}
}
