import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { query,transaction,serviceForVisitor,resources,canRead,canWrite,list,save,remove,restoreRevision,requestPublish,rebuildSite,jobAction,siteContext,released,DomainError,assetURL,referenceLabels,canResolveReference,identifier,audit,type Row } from '@suns/domain';
import { actorFor,checkOrigin } from './auth';
import { uploadMedia } from './media';
import {translationTargets,translationJobs,enqueueTranslations,translationAction,llmSettings,saveLLMSettings,testLLMSettings,writingContext,generateWriting,saveWritingDraft,writingDraftSchema,generateProduct,saveProductDraft,productDraftSchema} from '@suns/domain';
import {v2Api} from './v2-api';
import {tradeApi} from './trade-api';
import {publicTradeCards,recordTradeVisit,portalWorkspace,portalDecision} from '@suns/domain';
import {tradePortalHTML} from '@suns/ui';

const response=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
async function json(request:Request){const raw=await boundedBody(request,2_000_000);try{return JSON.parse(new TextDecoder().decode(raw));}catch{throw new DomainError('无效 JSON');}}
// 供“可带可不带正文”的接口使用：空正文按 {} 处理，不报错。
async function optionalJson(request:Request,limit=50_000){if(!request.body)return {};const raw=await boundedBody(request,limit);const text=new TextDecoder().decode(raw).trim();if(!text)return {};try{return JSON.parse(text);}catch{throw new DomainError('无效 JSON');}}
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
const inquirySchema=z.object({visit_id:z.string().uuid().optional(),key:z.string().uuid(),locale:z.string().min(2).max(10),name:z.string().trim().min(1).max(160),email:z.string().email().max(254),company:z.string().max(200).optional(),phone:z.string().max(80).optional(),country:z.string().max(80).optional(),message:z.string().trim().min(5).max(10000),specification_notes:z.string().max(2000).optional(),target_delivery_on:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),preferred_incoterm:z.enum(['EXW','FCA','FOB','CFR','CIF','CPT','CIP','DAP','DPU','DDP']).optional(),inquiry_type:z.enum(['contact','rfq','product','sample','distributor']).default('contact'),website:z.string().max(200).optional(),source_url:z.string().max(2000).optional(),consent:z.literal(true),items:z.array(z.object({product_id:z.string().uuid(),quantity:z.number().positive().max(1e9)})).max(50).optional(),utm_source:z.string().max(200).optional(),utm_medium:z.string().max(200).optional(),utm_campaign:z.string().max(200).optional(),utm_term:z.string().max(200).optional(),utm_content:z.string().max(200).optional()});
async function inquiryInput(request:Request){
 if(!request.headers.get('content-type')?.startsWith('multipart/form-data'))return {data:inquirySchema.parse(await json(request)),attachment:null};
 const raw=await boundedBody(request,5_600_000);
 let parsed:FormData;try{parsed=await new Request(request.url,{method:'POST',headers:{'Content-Type':request.headers.get('content-type')||''},body:raw as BodyInit}).formData();}catch{throw new DomainError('无效表单内容');}
 const payload=parsed.get('payload');if(typeof payload!=='string'||payload.length>50_000)throw new DomainError('无效询盘内容');
 let data;try{data=inquirySchema.parse(JSON.parse(payload));}catch(error){if(error instanceof SyntaxError)throw new DomainError('无效询盘内容');throw error;}
 const file=parsed.get('attachment');if(!(file instanceof File)||!file.size)return {data,attachment:null};
 if(file.size>5_242_880)throw new DomainError('附件不可超过 5 MB',413);
 const bytes=Buffer.from(await file.arrayBuffer());
 const mime=bytes.subarray(0,5).toString()==='%PDF-'?'application/pdf':bytes.subarray(0,3).equals(Buffer.from([0xff,0xd8,0xff]))?'image/jpeg':bytes.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]))?'image/png':bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP'?'image/webp':'';
 if(!mime||mime!==file.type)throw new DomainError('仅支持有效的 PDF、JPG、PNG 或 WebP 文件');
 const filename=file.name.replace(/[\\/\x00-\x1f\x7f]/g,'_').trim().slice(0,180)||'attachment';
 return {data,attachment:{filename,mime,bytes}};
}
async function publicApi(request:Request,parts:string[],url:URL):Promise<Response|undefined>{
 const action=parts[0];const locale=url.searchParams.get('locale')||'en';
 if(action==='trade-public'){
  if(parts[1]==='portal-page'&&request.method==='GET')return new Response(tradePortalHTML,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"}});
  if(parts[1]==='cards'&&request.method==='GET'){await rateLimit(request,'trade-cards',120);const detected=process.env.TRUST_PROXY==='1'?(request.headers.get('cf-ipcountry')||''):'';const market=z.string().regex(/^([A-Z]{2})?$/).parse(url.searchParams.has('country')?url.searchParams.get('country')||'':/^[A-Z]{2}$/.test(detected)?detected:'');return response(await publicTradeCards(z.string().max(10).parse(locale),market));}
  if(parts[1]==='visit'&&request.method==='POST'){checkOrigin(request);await rateLimit(request,'trade-visit',60);return response(await recordTradeVisit(await json(request)));}
  if(['portal','decision'].includes(parts[1])){await rateLimit(request,'trade-portal',60);const token=request.headers.get('authorization')?.replace(/^Bearer /,'')||'';if(parts[1]==='portal'&&request.method==='GET')return response(await portalWorkspace(token));if(parts[1]==='decision'&&request.method==='POST'){checkOrigin(request);return response(await portalDecision(token,await json(request)));}}
  throw new DomainError('入口不存在',404);
 }
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
  checkOrigin(request);await rateLimit(request,'inquiry',6);const {data,attachment}=await inquiryInput(request);if(data.website)return response({ok:true});
  if(data.inquiry_type==='rfq'&&!data.items?.length)throw new DomainError('请先选择询价产品');
  if(data.items&&new Set(data.items.map(x=>x.product_id)).size!==data.items.length)throw new DomainError('询价产品不能重复');
  if(data.target_delivery_on){const date=new Date(data.target_delivery_on+'T00:00:00Z');if(Number.isNaN(date.getTime())||date.toISOString().slice(0,10)!==data.target_delivery_on||data.target_delivery_on<new Date().toISOString().slice(0,10))throw new DomainError('期望交付日期无效');}
  const result=await transaction(async c=>{
   await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[data.key]);const existing=(await c.query('SELECT i.inquiry_number FROM public_submissions s JOIN inquiries i ON i.id=s.inquiry_id WHERE s.key=$1',[data.key])).rows[0];if(existing)return existing;
   const l=(await c.query('SELECT id FROM locales WHERE code=$1 AND is_enabled',[data.locale])).rows[0];if(!l)throw new DomainError('Unsupported locale');
   const number='RFQ-'+new Date().toISOString().slice(0,10).replaceAll('-','')+'-'+randomUUID().slice(0,8).toUpperCase();
   const item=(await c.query(`INSERT INTO inquiries(inquiry_number,inquiry_type,name,email,company,phone,country,locale_id,message,specification_notes,target_delivery_on,preferred_incoterm,source_url,utm_source,utm_medium,utm_campaign,utm_term,utm_content,consent_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,now()) RETURNING id,inquiry_number`,[number,data.inquiry_type,data.name,data.email,data.company,data.phone,data.country,l.id,data.message,data.specification_notes||null,data.target_delivery_on||null,data.preferred_incoterm||null,data.source_url,data.utm_source,data.utm_medium,data.utm_campaign,data.utm_term,data.utm_content])).rows[0];
   for(const entry of data.items||[]){const p=(await c.query(`SELECT p.sku,p.id,t.name,t.order_unit FROM products p JOIN product_translations t ON t.product_id=p.id AND t.locale_id=$2 JOIN published_documents d ON d.entity_id=t.id AND d.entity_type='product_translations' WHERE p.id=$1 AND p.deleted_at IS NULL`,[entry.product_id,l.id])).rows[0];if(!p)throw new DomainError('Product is unavailable');await c.query(`INSERT INTO inquiry_items(inquiry_id,product_id,product_name_snapshot,sku_snapshot,quantity,unit) VALUES($1,$2,$3,$4,$5,$6)`,[item.id,p.id,p.name,p.sku,entry.quantity,p.order_unit]);}
   if(data.visit_id)await c.query(`UPDATE inquiries SET visit_id=(SELECT id FROM trade_visits WHERE id=$2 AND locale_id=$3 AND created_at>now()-interval '1 day') WHERE id=$1`,[item.id,data.visit_id,l.id]);
   if(attachment)await c.query('INSERT INTO inquiry_attachments(inquiry_id,original_filename,mime_type,file_size,content) VALUES($1,$2,$3,$4,$5)',[item.id,attachment.filename,attachment.mime,attachment.bytes.length,attachment.bytes]);
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
  // 必须 await：`try { return promise } catch {}` 不会捕获 promise 的拒绝，
  // 只有 `return await promise` 才会落入下面的 catch。少了这个 await，
  // v2/v21/V3 路由里抛出的 DomainError/ZodError 全部逃逸成 HTTP 500 空响应
  // （实测生产日志有 14 条 status:404 的 DomainError 变成 500，catch 分支标记 'API failure' 出现 0 次）。
  if(path[0]==='v2')return await v2Api(request,path,actor,url,json,response);
  if(path[0]==='trade')return await tradeApi(request,path,actor,url,json,response);
  if(path[0]==='rfq-attachment'&&request.method==='GET'){
   const leads=resources.find(r=>r.table==='inquiries')!;if(!canRead(actor,leads))throw new DomainError('没有询盘权限',403);
   const id=z.string().uuid().parse(path[1]);const file=(await query('SELECT a.original_filename,a.mime_type,a.file_size,a.content FROM inquiry_attachments a JOIN inquiries i ON i.id=a.inquiry_id WHERE a.id=$1 AND i.deleted_at IS NULL',[id]))[0];
   if(!file)throw new DomainError('附件不存在',404);
   return new Response(file.content as BodyInit,{headers:{'Content-Type':file.mime_type,'Content-Length':String(file.file_size),'Content-Disposition':"attachment; filename=\"rfq-file\"; filename*=UTF-8''"+encodeURIComponent(file.original_filename),'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
  }
  if(path[0]==='trade-product'&&request.method==='POST'){
   const productAccess=resources.find(r=>r.table==='products')!,translationAccess=resources.find(r=>r.table==='product_translations')!;
   if(!canWrite(actor,productAccess)||!canWrite(actor,translationAccess))throw new DomainError('没有产品编辑权限',403);
   const input=z.object({translationId:z.string().uuid(),expectedProductUpdatedAt:z.string().datetime({offset:true}),expectedTranslationUpdatedAt:z.string().datetime({offset:true}),minOrderQuantity:z.number().positive().max(1e9).nullable(),leadTimeDays:z.number().int().min(1).max(3650).nullable(),orderUnit:z.string().trim().max(40).nullable(),packagingDetails:z.string().trim().max(4000).nullable(),customizationDetails:z.string().trim().max(4000).nullable(),samplePolicy:z.string().trim().max(4000).nullable()}).parse(await json(request));
   const updated=await transaction(async c=>{
    const translation=(await c.query('SELECT * FROM product_translations WHERE id=$1 AND deleted_at IS NULL FOR UPDATE',[input.translationId])).rows[0];if(!translation)throw new DomainError('产品语言版本不存在',404);
    const product=(await c.query('SELECT * FROM products WHERE id=$1 AND deleted_at IS NULL FOR UPDATE',[translation.product_id])).rows[0];if(!product)throw new DomainError('产品不存在',404);
    if(new Date(product.updated_at).getTime()!==new Date(input.expectedProductUpdatedAt).getTime()||new Date(translation.updated_at).getTime()!==new Date(input.expectedTranslationUpdatedAt).getTime())throw new DomainError('产品已被其他人修改，请刷新后重试',409);
    const nextProduct=(await c.query('UPDATE products SET min_order_quantity=$2,lead_time_days=$3 WHERE id=$1 RETURNING *',[product.id,input.minOrderQuantity,input.leadTimeDays])).rows[0];
    const nextTranslation=(await c.query("UPDATE product_translations SET order_unit=$2,packaging_details=$3,customization_details=$4,sample_policy=$5,publish_status='draft' WHERE id=$1 RETURNING *",[translation.id,input.orderUnit,input.packagingDetails,input.customizationDetails,input.samplePolicy])).rows[0];
    await audit(c,actor,'products','update',product,nextProduct);await audit(c,actor,'product_translations','update',translation,nextTranslation);
    return {id:translation.id,updated_at:nextTranslation.updated_at};
   });return response(updated);
  }
  if(path[0]==='meta')return response({actor,resources:resources.filter(r=>canRead(actor,r)).map(r=>({...r,writable:canWrite(actor,r)})),locales:await query('SELECT id,code,native_name FROM locales WHERE is_enabled ORDER BY sort_order,code')});
  if(path[0]==='reference-options'&&request.method==='GET'){
   const ref=url.searchParams.get('resource')||'';
   if(!resources.some(r=>r.table===ref))throw new DomainError('未知关联资源');
   if(!canResolveReference(actor,ref))throw new DomainError('没有此操作权限',403);
   const ids=await query<{id:string}>('SELECT id FROM '+identifier(ref)+' ORDER BY id LIMIT 100');
   const names=(await referenceLabels(actor,{[ref]:ids.map(x=>x.id)}))[ref];
   return response({rows:ids.map(x=>({id:x.id,name:names[x.id]||'记录 #'+x.id.slice(0,8)})).sort((a,b)=>a.name.localeCompare(b.name))});
  }
  if(path[0]==='reference-labels'&&request.method==='POST'){const body=await json(request);return response(await referenceLabels(actor,body.refs));}
  if(path[0]==='dashboard'){const names=['content_items','products','media_assets','publish_jobs',...(['admin','super_admin'].includes(actor.role)?['inquiries']:[])];const counts:Row={};for(const t of names)counts[t]=(await query(`SELECT count(*)::int AS n FROM ${t}`))[0].n;return response({counts,jobs:await query('SELECT id,job_type,entity_type,status,error_message,created_at FROM publish_jobs ORDER BY created_at DESC LIMIT 8')});}
  if(path[0]==='llm-settings'){
   if(request.method==='GET')return response(await llmSettings(actor));
   if(request.method==='PUT'){
    const input=z.object({model:z.string().max(100),url:z.string().url().max(1000),enabled:z.boolean(),apiKey:z.string().max(500).optional(),clearKey:z.boolean().optional()}).parse(await json(request));
    return response(await saveLLMSettings(actor,input));
   }
  }
  if(path[0]==='llm-test'&&request.method==='POST'){
   // 允许带上尚未保存的 model/url/apiKey 直接试跑；缺省则用已保存配置。任何情况下都不写库。
   const input=z.object({model:z.string().max(100).optional(),url:z.string().max(1000).optional(),apiKey:z.string().max(500).optional()}).parse(await optionalJson(request));
   return response(await testLLMSettings(actor,input));
  }
  if(path[0]==='ai-writing'){
   if(path[1]==='context'&&request.method==='GET')return response(await writingContext(actor));
   if(path[1]==='generate'&&request.method==='POST'){
    const input=z.object({localeId:z.string().uuid(),topic:z.string().trim().min(5).max(180),sourceNotes:z.string().max(5000),productTranslationId:z.string().uuid().optional(),keywords:z.string().max(300).optional()}).parse(await json(request));
    return response(await generateWriting(actor,input));
   }
   if(path[1]==='save'&&request.method==='POST'){
    const input=z.object({localeId:z.string().uuid(),draft:writingDraftSchema,runId:z.string().uuid().optional()}).parse(await json(request));
    return response(await saveWritingDraft(actor,input),201);
   }
  }
  if(path[0]==='ai-product'){
   if(path[1]==='generate'&&request.method==='POST'){
    const input=z.object({localeId:z.string().uuid(),name:z.string().trim().min(2).max(200),notes:z.string().max(5000),keywords:z.string().max(300).optional()}).parse(await json(request));
    return response(await generateProduct(actor,input));
   }
   if(path[1]==='save'&&request.method==='POST'){
    const input=z.object({localeId:z.string().uuid(),sku:z.string().trim().min(2).max(100),draft:productDraftSchema,runId:z.string().uuid().optional()}).parse(await json(request));
    return response(await saveProductDraft(actor,input),201);
   }
  }
  if(path[0]==='translation-targets'&&request.method==='GET'){
   const input=z.object({entityType:z.string(),entityId:z.string().uuid()}).parse(Object.fromEntries(url.searchParams));
   return response(await translationTargets(actor,input.entityType,input.entityId));
  }
  if(path[0]==='translation-jobs'){
   if(request.method==='GET')return response(await translationJobs(actor));
   if(request.method==='POST'){
    const input=z.object({entityType:z.string(),entityId:z.string().uuid(),targetLocaleIds:z.array(z.string().uuid()).min(1).max(20),overwriteDraft:z.boolean().optional()}).parse(await json(request));
    return response(await enqueueTranslations(actor,input),201);
   }
   if(request.method==='PATCH'){
    const input=z.object({id:z.string().uuid(),action:z.enum(['retry','approve'])}).parse(await json(request));
    return response(await translationAction(actor,input.id,input.action));
   }
  }
  if(path[0]==='create-entry'&&request.method==='POST'){
   const input=z.object({
    kind:z.enum(['page','product']),localeId:z.string().uuid(),baseId:z.string().uuid().optional(),
    title:z.string().trim().min(2).max(200),
    slug:z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    contentType:z.enum(['page','article','guide','case_study','application','solution','landing_page']).optional(),
    // 空字符串等同「未提供」：新建页面时前端会带上 sku:''（该输入框只在产品模式下渲染，
    // 用户看不到也就清不掉），若直接用 .optional() 会被 min(2) 拒绝，导致无法新建页面。
    sku:z.preprocess(v=>typeof v==='string'&&v.trim()===''?undefined:v,z.string().trim().min(2).max(100).optional()),
    summary:z.string().trim().max(2000).optional()
   }).parse(await json(request));
   const parentTable=input.kind==='product'?'products':'content_items';
   const childTable=input.kind==='product'?'product_translations':'content_item_translations';
   const parentResource=resources.find(r=>r.table===parentTable)!;
   const childResource=resources.find(r=>r.table===childTable)!;
   if(!canWrite(actor,childResource)||(!input.baseId&&!canWrite(actor,parentResource)))throw new DomainError('没有创建权限',403);
   if(input.kind==='product'&&!input.sku&&!input.baseId)throw new DomainError('请输入产品 SKU');
   const locale=(await query('SELECT id,code FROM locales WHERE id=$1 AND is_enabled',[input.localeId]))[0];
   if(!locale)throw new DomainError('请选择可用语言');
   return response(await transaction(async c=>{
    const parent=input.baseId?(await c.query('SELECT * FROM '+identifier(parentTable)+' WHERE id=$1 AND deleted_at IS NULL',[input.baseId])).rows[0]
     :input.kind==='product'
      ?(await c.query(`INSERT INTO products(sku,status,created_by,updated_by) VALUES($1,'draft',$2,$2) RETURNING *`,[input.sku,actor.id])).rows[0]
      :(await c.query(`INSERT INTO content_items(content_type,status,created_by,updated_by) VALUES($1,'draft',$2,$2) RETURNING *`,[input.contentType||'page',actor.id])).rows[0];
    if(!parent)throw new DomainError('原内容不存在',404);
    const path='/'+locale.code+(input.kind==='product'?'/products/':parent.content_type==='article'?'/blog/':'/')+input.slug;
    const child=input.kind==='product'
     ?(await c.query('INSERT INTO product_translations(product_id,locale_id,name,slug,path,short_description,description) VALUES($1,$2,$3,$4,$5,$6,$6) RETURNING *',[parent.id,locale.id,input.title,input.slug,path,input.summary||null])).rows[0]
     :(await c.query('INSERT INTO content_item_translations(content_item_id,locale_id,title,slug,path,excerpt) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',[parent.id,locale.id,input.title,input.slug,path,input.summary||null])).rows[0];
    if(!input.baseId)await audit(c,actor,parentTable,'create',null,parent);
    await audit(c,actor,childTable,'create',null,child);
    return {id:child.id,path,resource:childTable};
   }),201);
  }
  if(path[0]==='records'){
   if(request.method==='GET'){const filter=url.searchParams.get('filter');return response(await list(actor,table,{page:Number(url.searchParams.get('page')),limit:Number(url.searchParams.get('limit')),search:url.searchParams.get('search')||'',filter:filter?JSON.parse(filter):undefined}));}
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
