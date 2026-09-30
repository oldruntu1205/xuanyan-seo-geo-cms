import {z} from 'zod';
import {tradeWorkspace,tradeInquiry,createTradeQuote,changeTradeQuote,createPortalGrant,revokePortalGrant,marketWorkspace,createMarketCard,changeMarketCard,saveTradeService,recordTradeResponse,tradeFunnel,DomainError,type Actor} from '@suns/domain';
export async function tradeApi(request:Request,parts:string[],actor:Actor,url:URL,json:(r:Request)=>Promise<any>,response:(data:unknown,status?:number)=>Response){
 const action=parts[1],method=request.method,uuid=z.string().uuid();
 const listing=()=>z.object({q:z.string().max(100).default(''),page:z.coerce.number().int().min(1).max(10000).default(1)}).parse(Object.fromEntries(url.searchParams));
 if(action==='workspace'&&method==='GET'){const v=listing();return response(await tradeWorkspace(actor,v.q,v.page));}
 if(action==='inquiry'&&method==='GET')return response(await tradeInquiry(actor,uuid.parse(url.searchParams.get('id'))));
 if(action==='quote'&&method==='POST')return response(await createTradeQuote(actor,await json(request)),201);
 if(action==='quote-action'&&method==='POST')return response(await changeTradeQuote(actor,await json(request)));
 if(action==='grant'&&method==='POST')return response(await createPortalGrant(actor,await json(request)),201);
 if(action==='revoke'&&method==='POST'){const {id}=z.object({id:uuid}).parse(await json(request));return response(await revokePortalGrant(actor,id));}
 if(action==='market'&&method==='GET'){const v=listing();return response(await marketWorkspace(actor,v.q,v.page));}
 if(action==='market'&&method==='POST')return response(await createMarketCard(actor,await json(request)),201);
 if(action==='market-action'&&method==='POST'){const v=z.object({id:uuid,action:z.enum(['publish','withdraw'])}).parse(await json(request));return response(await changeMarketCard(actor,v.id,v.action));}
 if(action==='service'&&method==='POST')return response(await saveTradeService(actor,await json(request)));
 if(action==='response'&&method==='POST')return response(await recordTradeResponse(actor,await json(request)));
 if(action==='funnel'&&method==='GET')return response(await tradeFunnel(actor,Object.fromEntries(url.searchParams)));
 throw new DomainError('功能入口不存在',404);
}
