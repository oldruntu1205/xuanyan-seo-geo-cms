import {z} from 'zod';
import {renderHTML} from '@suns/ui';
import {DomainError,seoReview,publishPreview,rollbackPublished,translationTerms,saveTranslationTerm,removeTranslationTerm,translationMemories,translationComparison,approveTranslationBatch,importKeywords,keywordOverview,competitorPages,inspectCompetitor,competitorHistory,geoPrompts,saveGeoPrompt,sampleGeoPrompt,inquiryWorkspace,updateInquiry,assistantContext,assistantHistory,suggestWithAssistant,aiWritingHistory,inquiryIntent,recomputeInquiryIntentForActor,setInquiryIntentOverrideForActor,type Actor} from '@suns/domain';
import {v21Api} from './v21-api';
import {agentContext,agentRuns,agentRun,createAgentRun,decideAgentRun} from '@suns/domain';
import {geoMonitorWorkspace,saveGeoModel,saveGeoRegion,saveGeoTarget,saveGeoBudget,queueGeoMonitorSample,geoMonitorTrend} from '@suns/domain';
import {crmOverview,crmOptions,crmCustomers,crmCustomer,crmDeal,saveCrmAccount,saveCrmContact,saveCrmDeal,setCrmMember,addCrmActivity,addCrmTask,updateCrmTask} from '@suns/domain';
import {marketingDashboard,marketingAudience,recordMarketingConsent,saveMarketingSettings,saveMarketingSegment,saveMarketingCampaign,changeMarketingCampaign} from '@suns/domain';
import {biCatalog,createBiReport,biReport,biDrilldown,biExportRows} from '@suns/domain';

type Json=(request:Request)=>Promise<any>;
type Respond=(data:unknown,status?:number)=>Response;
const uuid=z.string().uuid();
const target=z.object({entityType:z.enum(['content_item_translations','product_translations']),id:uuid});
export async function v2Api(request:Request,path:string[],actor:Actor,url:URL,json:Json,response:Respond):Promise<Response>{
 const action=path[1],method=request.method;
 if(action?.startsWith('v21-'))return v21Api(request,action,actor,url,json,response);
 if(action==='crm-overview'&&method==='GET'){const input=z.object({q:z.string().max(100).default(''),stage:z.enum(['','new','qualified','proposal','negotiation','won','lost']).default(''),page:z.coerce.number().int().min(1).max(10000).default(1)}).parse(Object.fromEntries(url.searchParams));return response(await crmOverview(actor,input.q,input.stage,input.page));}
 if(action==='crm-options'&&method==='GET'){const input=z.object({kind:z.enum(['accounts','contacts','inquiries']),q:z.string().max(100).default('')}).parse(Object.fromEntries(url.searchParams));return response(await crmOptions(actor,input.kind,input.q));}
 if(action==='crm-customers'&&method==='GET'){const input=z.object({kind:z.enum(['accounts','contacts']),q:z.string().max(100).default(''),page:z.coerce.number().int().min(1).max(10000).default(1)}).parse(Object.fromEntries(url.searchParams));return response(await crmCustomers(actor,input.kind,input.q,input.page));}
 if(action==='crm-customer'&&method==='GET'){const input=z.object({kind:z.enum(['account','contact']),id:uuid,page:z.coerce.number().int().min(1).max(10000).default(1)}).parse(Object.fromEntries(url.searchParams));return response(await crmCustomer(actor,input.kind,input.id,input.page));}
 if(action==='crm-deal'&&method==='GET')return response(await crmDeal(actor,uuid.parse(url.searchParams.get('id'))));
 if(action==='crm-account'&&method==='POST'){const input=z.object({id:uuid.optional(),name:z.string().trim().min(2).max(200),country:z.string().max(120).optional(),website:z.string().max(500).optional(),phone:z.string().max(80).optional(),description:z.string().max(4000).optional(),ownerId:uuid.nullable().optional(),status:z.enum(['active','archived'])}).parse(await json(request));return response(await saveCrmAccount(actor,input),input.id?200:201);}
 if(action==='crm-contact'&&method==='POST'){const input=z.object({id:uuid.optional(),name:z.string().trim().min(1).max(160),email:z.string().email().max(320),phone:z.string().max(80).optional(),title:z.string().max(160).optional(),ownerId:uuid.nullable().optional(),accountId:uuid.nullable().optional(),status:z.enum(['active','archived'])}).parse(await json(request));return response(await saveCrmContact(actor,input),input.id?200:201);}
 if(action==='crm-deal'&&method==='POST'){const input=z.object({id:uuid.optional(),title:z.string().trim().min(2).max(200),contactId:uuid,accountId:uuid.nullable().optional(),inquiryId:uuid.nullable().optional(),stage:z.enum(['new','qualified','proposal','negotiation','won','lost']),amount:z.number().min(0).max(999999999999),currency:z.string().regex(/^[A-Z]{3}$/),probability:z.number().int().min(0).max(100),ownerId:uuid.nullable().optional(),expectedCloseOn:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),nextAction:z.string().max(1000).nullable().optional(),nextActionAt:z.string().datetime({offset:true}).nullable().optional(),lossReason:z.string().max(1000).nullable().optional(),expectedUpdatedAt:z.string().datetime({offset:true}).optional()}).parse(await json(request));return response(await saveCrmDeal(actor,input),input.id?200:201);}
 if(action==='crm-member'&&method==='POST'){const input=z.object({dealId:uuid,userId:uuid,action:z.enum(['add','remove'])}).parse(await json(request));return response(await setCrmMember(actor,input));}
 if(action==='crm-activity'&&method==='POST'){const input=z.object({opportunityId:uuid.optional(),contactId:uuid.optional(),accountId:uuid.optional(),kind:z.enum(['note','call','email','meeting']),summary:z.string().trim().min(2).max(200),detail:z.string().max(10000).optional(),occurredAt:z.string().datetime({offset:true}).optional()}).parse(await json(request));return response(await addCrmActivity(actor,input),201);}
 if(action==='crm-task'&&method==='POST'){const input=z.object({opportunityId:uuid.optional(),contactId:uuid.optional(),title:z.string().trim().min(2).max(200),description:z.string().max(4000).optional(),assignedTo:uuid,dueAt:z.string().datetime({offset:true}).nullable().optional()}).parse(await json(request));return response(await addCrmTask(actor,input),201);}
 if(action==='crm-task'&&method==='PATCH'){const input=z.object({id:uuid,status:z.enum(['open','done','cancelled'])}).parse(await json(request));return response(await updateCrmTask(actor,input.id,input.status));}
 if(action==='marketing-dashboard'&&method==='GET')return response(await marketingDashboard(actor));
 if(action==='marketing-audience'&&method==='GET')return response(await marketingAudience(actor,uuid.parse(url.searchParams.get('segmentId'))));
 if(action==='marketing-consent'&&method==='POST'){const input=z.object({contactId:uuid,state:z.enum(['granted','revoked']),source:z.string().max(200).optional(),evidence:z.string().max(2000).optional()}).parse(await json(request));return response(await recordMarketingConsent(actor,input));}
 if(action==='marketing-settings'&&method==='POST'){const input=z.object({enabled:z.boolean(),maxPer7Days:z.number().int().min(0).max(10),maxPer30Days:z.number().int().min(0).max(30),globalDailyCap:z.number().int().min(0).max(100000)}).parse(await json(request));return response(await saveMarketingSettings(actor,input));}
 if(action==='marketing-segment'&&method==='POST'){const input=z.object({id:uuid.optional(),name:z.string().trim().min(2).max(120),criteria:z.object({country:z.string().trim().max(120).optional(),inquiryStatus:z.enum(['new','processing','qualified','replied','closed','spam']).optional(),stage:z.enum(['new','qualified','proposal','negotiation','won','lost']).optional(),minInquiries:z.number().int().min(1).max(1000).optional()}).strict(),enabled:z.boolean()}).parse(await json(request));return response(await saveMarketingSegment(actor,input),input.id?200:201);}
 if(action==='marketing-campaign'&&method==='POST'){const input=z.object({id:uuid.optional(),code:z.string().regex(/^[a-z0-9][a-z0-9_-]{1,59}$/),name:z.string().trim().min(2).max(160),segmentId:uuid,triggerType:z.enum(['manual','lead_received','stage_changed']),subject:z.string().trim().min(2).max(200),body:z.string().trim().min(10).max(10000),cooldownDays:z.number().int().min(0).max(365),dailyCap:z.number().int().min(0).max(100000)}).parse(await json(request));return response(await saveMarketingCampaign(actor,input),input.id?200:201);}
 if(action==='marketing-campaign-action'&&method==='POST'){const input=z.object({id:uuid,action:z.enum(['activate','pause','resume'])}).parse(await json(request));return response(await changeMarketingCampaign(actor,input.id,input.action));}
 if(action==='bi-catalog'&&method==='GET')return response(await biCatalog(actor));
 if(action==='bi-report'&&method==='POST'){const input=z.object({name:z.string().trim().min(2).max(160),dateFrom:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),dateTo:z.string().regex(/^\d{4}-\d{2}-\d{2}$/)}).parse(await json(request));return response(await createBiReport(actor,input),201);}
 if(action==='bi-report'&&method==='GET')return response(await biReport(actor,uuid.parse(url.searchParams.get('id'))));
 if(action==='bi-drilldown'&&method==='GET'){const input=z.object({id:uuid,metric:z.string().max(80),dimension:z.string().max(200),page:z.coerce.number().int().min(1).max(10000).default(1)}).parse(Object.fromEntries(url.searchParams));return response(await biDrilldown(actor,input.id,input.metric,input.dimension,input.page));}
 if(action==='bi-export'&&method==='GET'){const id=uuid.parse(url.searchParams.get('id'));const rows=await biExportRows(actor,id);const cell=(v:unknown)=>{let s=String(v??'');if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};const csv=['metric_code,dimension,source_table,source_id,item_label,occurred_at,value',...rows.map(x=>[x.metric_code,x.dimension,x.source_table,x.source_id,x.item_label,new Date(x.occurred_at).toISOString(),x.value].map(cell).join(','))].join('\r\n');return new Response('\uFEFF'+csv,{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="bi-report-${id}.csv"`,'Cache-Control':'no-store'}});}
 if(action==='agent-context'&&method==='GET')return response(await agentContext(actor));
 if(action==='agent-runs'){
  if(method==='GET')return response(await agentRuns(actor));
  if(method==='POST'){const input=z.object({entityType:z.enum(['content_item_translations','product_translations']),entityId:uuid,objective:z.string().trim().min(10).max(1500),maxSteps:z.number().int().min(2).max(8).default(5),tokenBudget:z.number().int().min(5000).max(16000).default(8000)}).parse(await json(request));return response(await createAgentRun(actor,input),201);}
 }
 if(action==='agent-run'&&method==='GET')return response(await agentRun(actor,uuid.parse(url.searchParams.get('id'))));
 if(action==='agent-decision'&&method==='POST'){const input=z.object({id:uuid,action:z.enum(['approve','reject','apply','cancel','rate']),note:z.string().trim().max(1000).optional(),rating:z.number().int().min(1).max(5).optional()}).parse(await json(request));return response(await decideAgentRun(actor,input.id,input.action,input.note,input.rating));}
 if(action==='geo-monitor'&&method==='GET'){const {q,page}=z.object({q:z.string().max(100).default(''),page:z.coerce.number().int().min(1).max(100000).default(1)}).parse(Object.fromEntries(url.searchParams));return response(await geoMonitorWorkspace(actor,q,page));}
 if(action==='geo-monitor-model'&&method==='POST'){const input=z.object({id:uuid.optional(),code:z.string().min(2).max(40),displayName:z.string().trim().min(2).max(100),provider:z.string().trim().min(2).max(80),model:z.string().min(2).max(100),endpoint:z.string().url().max(1000),credentialSource:z.enum(['site_default','profile']),apiKey:z.string().max(500).optional(),inputRate:z.number().min(0).max(100000),outputRate:z.number().min(0).max(100000),maxOutputTokens:z.number().int().min(300).max(3000),enabled:z.boolean()}).parse(await json(request));return response(await saveGeoModel(actor,input),input.id?200:201);}
 if(action==='geo-monitor-region'&&method==='POST'){const input=z.object({id:uuid.optional(),code:z.string().min(2).max(40),displayName:z.string().trim().min(2).max(100),countryCode:z.string().max(2).optional(),description:z.string().max(1000).optional(),enabled:z.boolean()}).parse(await json(request));return response(await saveGeoRegion(actor,input),input.id?200:201);}
 if(action==='geo-monitor-target'&&method==='POST'){const input=z.object({id:uuid.optional(),promptId:uuid,modelProfileId:uuid,regionId:uuid,intervalMinutes:z.number().int().min(60).max(10080),enabled:z.boolean()}).parse(await json(request));return response(await saveGeoTarget(actor,input),input.id?200:201);}
 if(action==='geo-monitor-budget'&&method==='POST'){const input=z.object({dailyLimitUsd:z.number().min(0).max(1000000),monthlyLimitUsd:z.number().min(0).max(10000000),maxQueuedJobs:z.number().int().min(1).max(100000),enabled:z.boolean()}).parse(await json(request));return response(await saveGeoBudget(actor,input));}
 if(action==='geo-monitor-sample'&&method==='POST'){const {targetId}=z.object({targetId:uuid}).parse(await json(request));return response(await queueGeoMonitorSample(actor,targetId),202);}
 if(action==='geo-monitor-trend'&&method==='GET'){const {promptId,days}=z.object({promptId:uuid,days:z.coerce.number().int().refine(x=>[7,30,90].includes(x)).default(30)}).parse(Object.fromEntries(url.searchParams));return response(await geoMonitorTrend(actor,promptId,days));}
 if(action==='seo'&&method==='GET'){const input=target.parse(Object.fromEntries(url.searchParams));return response(await seoReview(actor,input.entityType,input.id));}
 if(action==='preview'&&method==='GET'){const input=target.parse(Object.fromEntries(url.searchParams));const data=await publishPreview(actor,input.entityType,input.id);return response({...data,html:renderHTML(data.draft)});}
 if(action==='rollback'&&method==='POST'){const {jobId}=z.object({jobId:uuid}).parse(await json(request));return response(await rollbackPublished(actor,jobId),202);}
 if(action==='translation-terms'){
  if(method==='GET')return response({rows:await translationTerms(actor)});
  if(method==='POST'){const input=z.object({id:uuid.optional(),sourceLocaleId:uuid,targetLocaleId:uuid,sourceTerm:z.string().trim().min(1).max(200),targetTerm:z.string().trim().min(1).max(200),note:z.string().max(1000).optional()}).parse(await json(request));return response(await saveTranslationTerm(actor,input),input.id?200:201);}
  if(method==='DELETE'){const {id}=z.object({id:uuid}).parse(await json(request));return response(await removeTranslationTerm(actor,id));}
 }
 if(action==='translation-memory'&&method==='GET')return response({rows:await translationMemories(actor)});
 if(action==='translation-compare'&&method==='GET'){const id=uuid.parse(url.searchParams.get('id'));return response(await translationComparison(actor,id));}
 if(action==='translation-batch'&&method==='POST'){const {ids}=z.object({ids:z.array(uuid).min(1).max(30)}).parse(await json(request));return response(await approveTranslationBatch(actor,ids));}
 if(action==='keywords'){
  if(method==='GET')return response(await keywordOverview(actor));
  if(method==='POST'){const input=z.object({propertyUrl:z.string().trim().min(5).max(500),localeId:uuid,dateStart:z.string(),dateEnd:z.string(),csv:z.string().min(20).max(2_000_000)}).parse(await json(request));return response(await importKeywords(actor,input),201);}
 }
 if(action==='competitors'){
  if(method==='GET')return response({rows:await competitorPages(actor)});
  if(method==='POST'){const input=z.object({url:z.string().url().max(2000),label:z.string().trim().min(2).max(160),localeId:uuid.optional()}).parse(await json(request));return response(await inspectCompetitor(actor,input),201);}
 }
 if(action==='competitor-history'&&method==='GET'){const id=uuid.parse(url.searchParams.get('id'));return response(await competitorHistory(actor,id));}
 if(action==='geo'){
  if(method==='GET')return response(await geoPrompts(actor));
  if(method==='POST'){const input=z.object({id:uuid.optional(),localeId:uuid,market:z.string().trim().min(2).max(80),prompt:z.string().trim().min(10).max(1000),brandName:z.string().trim().min(2).max(120),enabled:z.boolean().optional()}).parse(await json(request));return response(await saveGeoPrompt(actor,input),input.id?200:201);}
 }
 if(action==='geo-sample'&&method==='POST'){const {id}=z.object({id:uuid}).parse(await json(request));return response(await sampleGeoPrompt(actor,id),201);}
 if(action==='inquiries'){
  if(method==='GET'){const id=url.searchParams.get('id');return response(await inquiryWorkspace(actor,id?uuid.parse(id):undefined));}
  if(method==='PATCH'){const input=z.object({id:uuid,status:z.enum(['new','processing','qualified','replied','closed','spam']),assignedTo:uuid.nullable().optional(),nextFollowUpAt:z.string().datetime({offset:true}).nullable().optional(),note:z.string().trim().max(4000).optional()}).parse(await json(request));return response(await updateInquiry(actor,input));}
 }
 // 意向评级（内部 SPEC §10/§11）。落到本仓库的既有路由约定即：
 //   GET   /api/v1/v2/inquiry-intent?id=…   ←→ SPEC 的“读取机器分/人工覆盖/最终等级”
 //   POST  /api/v1/v2/inquiry-intent        ←→ SPEC 的 POST /admin/inquiries/:id/intent/recompute（V1 唯一触发方式）
 //   PATCH /api/v1/v2/inquiry-intent        ←→ SPEC 的 PATCH /admin/inquiries/:id/intent-override（level 可为 null = 清除）
 // 权限与归属全部在 domain 层：lead-scope + registry 权限门，路由本身不做归属判断（避免两套口径）。
 if(action==='inquiry-intent'){
  if(method==='GET')return response(await inquiryIntent(actor,uuid.parse(url.searchParams.get('id'))));
  if(method==='POST'){const {id}=z.object({id:uuid}).parse(await json(request));return response(await recomputeInquiryIntentForActor(actor,id));}
  if(method==='PATCH'){const {id,level}=z.object({id:uuid,level:z.enum(['hot','warm','cold','observe']).nullable()}).parse(await json(request));return response(await setInquiryIntentOverrideForActor(actor,id,level));}
 }
 if(action==='assistant-context'&&method==='GET')return response(await assistantContext(actor));
 if(action==='assistant-history'&&method==='GET')return response({rows:await assistantHistory(actor)});
 if(action==='assistant-suggest'&&method==='POST'){const input=z.object({entityType:z.enum(['content_item_translations','product_translations']),entityId:uuid,task:z.enum(['writing','translation','seo']),instruction:z.string().trim().min(5).max(1000),targetLocaleId:uuid.optional()}).parse(await json(request));return response(await suggestWithAssistant(actor,input),201);}
 if(action==='ai-writing-history'&&method==='GET')return response({rows:await aiWritingHistory(actor)});
 throw new DomainError('未知 V2.0 操作',404);
}
