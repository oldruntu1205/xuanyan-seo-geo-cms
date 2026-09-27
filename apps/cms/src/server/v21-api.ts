import {z} from 'zod';
import {DomainError,reviewTranslationTerm,collaborationTasks,createCollaborationTasks,updateCollaborationTask,acknowledgeCompetitorEvent,saveGeoSchedule,geoTrend,outreachWorkspace,outreachPartner,saveOutreachPartner,createOutreachDraft,reviewOutreachDraft,recordOutreachReply,recordOutreachLink,crmSettings,saveCrmSettings,crmWorkspace,queueCrmSync,retryCrmJob,resolveCrmConflict,type Actor} from '@suns/domain';

type Json=(request:Request)=>Promise<any>;
type Respond=(data:unknown,status?:number)=>Response;
const uuid=z.string().uuid();
const entityType=z.enum(['content_item_translations','product_translations']);
export async function v21Api(request:Request,action:string,actor:Actor,url:URL,json:Json,response:Respond):Promise<Response>{
 const method=request.method;
 if(action==='v21-terms-review'&&method==='POST'){const x=z.object({id:uuid,decision:z.enum(['approved','rejected']),note:z.string().max(1000).optional()}).parse(await json(request));return response(await reviewTranslationTerm(actor,x.id,x.decision,x.note));}
 if(action==='v21-tasks'){
  if(method==='GET')return response(await collaborationTasks(actor));
  if(method==='POST'){const x=z.object({kind:z.enum(['translation','content_review','content_update']),entityType,entityIds:z.array(uuid).min(1).max(30),title:z.string().trim().min(2).max(200),instructions:z.string().max(4000).optional(),assignedTo:uuid.optional(),dueAt:z.string().datetime({offset:true}).optional()}).parse(await json(request));return response(await createCollaborationTasks(actor,x),201);}
  if(method==='PATCH'){const x=z.object({id:uuid,status:z.enum(['open','in_progress','in_review','done','cancelled']),assignedTo:uuid.nullable().optional(),note:z.string().max(1000).optional()}).parse(await json(request));return response(await updateCollaborationTask(actor,x));}
 }
 if(action==='v21-competitor-alert'&&method==='POST'){const {id}=z.object({id:uuid}).parse(await json(request));return response(await acknowledgeCompetitorEvent(actor,id));}
 if(action==='v21-geo-schedule'&&method==='POST'){const x=z.object({promptId:uuid,intervalMinutes:z.number().int().min(60).max(10080),enabled:z.boolean()}).parse(await json(request));return response(await saveGeoSchedule(actor,x));}
 if(action==='v21-geo-trend'&&method==='GET')return response(await geoTrend(actor,uuid.parse(url.searchParams.get('id'))));
 if(action==='v21-outreach'){
  if(method==='GET')return response(await outreachWorkspace(actor));
  if(method==='POST'){const x=z.object({id:uuid.optional(),organization:z.string().trim().min(2).max(200),websiteUrl:z.string().url().max(2000),contactName:z.string().max(160).optional(),contactEmail:z.string().email().max(254).optional().or(z.literal('')),fitNote:z.string().max(4000).optional()}).parse(await json(request));return response(await saveOutreachPartner(actor,x),x.id?200:201);}
 }
 if(action==='v21-outreach-detail'&&method==='GET')return response(await outreachPartner(actor,uuid.parse(url.searchParams.get('id'))));
 if(action==='v21-outreach-draft'&&method==='POST'){const x=z.object({partnerId:uuid,subject:z.string().trim().min(2).max(250),body:z.string().trim().min(10).max(10000)}).parse(await json(request));return response(await createOutreachDraft(actor,x),201);}
 if(action==='v21-outreach-review'&&method==='POST'){const x=z.object({id:uuid,action:z.enum(['approve','reject','mark_sent']),note:z.string().max(1000).optional()}).parse(await json(request));return response(await reviewOutreachDraft(actor,x));}
 if(action==='v21-outreach-reply'&&method==='POST'){const x=z.object({partnerId:uuid,summary:z.string().trim().min(2).max(4000),receivedAt:z.string().datetime({offset:true})}).parse(await json(request));return response(await recordOutreachReply(actor,x),201);}
 if(action==='v21-outreach-link'&&method==='POST'){const x=z.object({partnerId:uuid,sourceUrl:z.string().url().max(2000),targetUrl:z.string().url().max(2000)}).parse(await json(request));return response(await recordOutreachLink(actor,x),201);}
 if(action==='v21-crm-settings'){
  if(method==='GET')return response(await crmSettings(actor));
  if(method==='POST'){const x=z.object({endpoint:z.string().url().max(500),enabled:z.boolean(),token:z.string().max(500).optional()}).parse(await json(request));return response(await saveCrmSettings(actor,x));}
 }
 if(action==='v21-crm'&&method==='GET')return response(await crmWorkspace(actor));
 if(action==='v21-crm-queue'&&method==='POST'){const x=z.object({direction:z.enum(['push','pull']),inquiryId:uuid.optional()}).parse(await json(request));return response(await queueCrmSync(actor,x),202);}
 if(action==='v21-crm-retry'&&method==='POST'){const {id}=z.object({id:uuid}).parse(await json(request));return response(await retryCrmJob(actor,id),202);}
 if(action==='v21-crm-resolve'&&method==='POST'){const x=z.object({id:uuid,resolution:z.enum(['keep_local','use_remote']),inquiryId:uuid.optional()}).parse(await json(request));return response(await resolveCrmConflict(actor,x));}
 throw new DomainError('未知 V2.1 操作',404);
}
