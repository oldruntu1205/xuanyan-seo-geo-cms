import {z} from 'zod';
import {renderHTML} from '@suns/ui';
import {DomainError,seoReview,publishPreview,rollbackPublished,translationTerms,saveTranslationTerm,removeTranslationTerm,translationMemories,translationComparison,approveTranslationBatch,importKeywords,keywordOverview,competitorPages,inspectCompetitor,competitorHistory,geoPrompts,saveGeoPrompt,sampleGeoPrompt,inquiryWorkspace,updateInquiry,assistantContext,assistantHistory,suggestWithAssistant,aiWritingHistory,type Actor} from '@suns/domain';
import {v21Api} from './v21-api';

type Json=(request:Request)=>Promise<any>;
type Respond=(data:unknown,status?:number)=>Response;
const uuid=z.string().uuid();
const target=z.object({entityType:z.enum(['content_item_translations','product_translations']),id:uuid});
export async function v2Api(request:Request,path:string[],actor:Actor,url:URL,json:Json,response:Respond):Promise<Response>{
 const action=path[1],method=request.method;
 if(action?.startsWith('v21-'))return v21Api(request,action,actor,url,json,response);
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
 if(action==='assistant-context'&&method==='GET')return response(await assistantContext(actor));
 if(action==='assistant-history'&&method==='GET')return response({rows:await assistantHistory(actor)});
 if(action==='assistant-suggest'&&method==='POST'){const input=z.object({entityType:z.enum(['content_item_translations','product_translations']),entityId:uuid,task:z.enum(['writing','translation','seo']),instruction:z.string().trim().min(5).max(1000),targetLocaleId:uuid.optional()}).parse(await json(request));return response(await suggestWithAssistant(actor,input),201);}
 if(action==='ai-writing-history'&&method==='GET')return response({rows:await aiWritingHistory(actor)});
 throw new DomainError('未知 V2.0 操作',404);
}
