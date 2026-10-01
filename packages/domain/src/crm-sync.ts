import {createCipheriv,createDecipheriv,createHash,randomBytes,randomUUID} from 'node:crypto';
import {request as httpsRequest} from 'node:https';
import {query,transaction} from './db';
import {audit,DomainError} from './crud';
import {canRead,canWrite,getResource} from './registry';
import {pinnedPublicAddress} from './growth';
import type {Actor,Row} from './types';

const key='crm.generic_https';
function admin(actor:Actor){if(!['admin','super_admin'].includes(actor.role))throw new DomainError('只有管理员可配置 CRM 连接',403);}
function lead(actor:Actor,write=false){const r=getResource('inquiries');if(!(write?canWrite(actor,r):canRead(actor,r)))throw new DomainError('没有客户跟进权限',403);}
function baseURL(value:string){let url:URL;try{url=new URL(value.trim());}catch{throw new DomainError('CRM 地址必须是完整 HTTPS 网址');}if(url.protocol!=='https:'||url.port||url.username||url.password||url.search||url.hash||!url.hostname.includes('.'))throw new DomainError('CRM 地址必须是公开 HTTPS 地址，不能带端口、账号或查询参数');return url.href.replace(/\/$/,'');}
function cryptoKey(){const secret=process.env.PAYLOAD_SECRET;if(!secret||secret.length<32)throw new DomainError('服务器缺少 PAYLOAD_SECRET，无法保存 CRM 凭据',503);return createHash('sha256').update('suns-crm-token-v1:').update(secret).digest();}
function seal(token:string){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',cryptoKey(),iv);const data=Buffer.concat([cipher.update(token,'utf8'),cipher.final()]);return ['v1',iv.toString('base64url'),cipher.getAuthTag().toString('base64url'),data.toString('base64url')].join(':');}
function unseal(value:string){try{const [version,iv,tag,data]=value.split(':');if(version!=='v1'||!iv||!tag||!data)throw new Error('Invalid cipher');const decipher=createDecipheriv('aes-256-gcm',cryptoKey(),Buffer.from(iv,'base64url'));decipher.setAuthTag(Buffer.from(tag,'base64url'));return Buffer.concat([decipher.update(Buffer.from(data,'base64url')),decipher.final()]).toString('utf8');}catch{throw new DomainError('CRM 凭据无法解密，请重新保存访问令牌',503);}}
async function config(){const row=(await query('SELECT value FROM runtime_settings WHERE key=$1',[key]))[0]?.value as Row|undefined;return {endpoint:String(row?.endpoint||''),enabled:row?.enabled===true,tokenCipher:String(row?.tokenCipher||'')};}
export async function crmSettings(actor:Actor){admin(actor);const value=await config();const connection=(await query("SELECT status,last_synced_at,last_error FROM integration_connections WHERE provider='generic_https_crm' AND connection_name='default'"))[0];return {endpoint:value.endpoint,enabled:value.enabled,configured:!!value.tokenCipher,lastSyncedAt:connection?.last_synced_at,lastError:connection?.last_error};}
export async function saveCrmSettings(actor:Actor,input:{endpoint:string;enabled:boolean;token?:string}){
 admin(actor);const endpoint=baseURL(input.endpoint);await pinnedPublicAddress(new URL(endpoint).hostname);
 const old=await config();let tokenCipher=old.tokenCipher;
 if(input.token){const token=input.token.trim();if(token.length<16||token.length>500||/\s/.test(token))throw new DomainError('CRM 令牌应为 16–500 个无空格字符');tokenCipher=seal(token);}
 if(input.enabled&&!tokenCipher)throw new DomainError('启用 CRM 同步前请填写访问令牌');
 return transaction(async c=>{await c.query('INSERT INTO runtime_settings(key,value) VALUES($1,$2::jsonb) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value',[key,JSON.stringify({endpoint,enabled:input.enabled,tokenCipher})]);
  await c.query(`INSERT INTO integration_connections(provider,connection_name,status,config,secret_ref) VALUES('generic_https_crm','default',$1,$2::jsonb,$3)
   ON CONFLICT(provider,connection_name) DO UPDATE SET status=EXCLUDED.status,config=EXCLUDED.config,secret_ref=EXCLUDED.secret_ref`,[input.enabled?'active':'disabled',JSON.stringify({endpoint}),key]);
  await audit(c,actor,'integration_connections','configure',null,{provider:'generic_https_crm',endpoint,enabled:input.enabled});return {endpoint,enabled:input.enabled,configured:!!tokenCipher};});
}

// 同步工作台会带出询盘编号/姓名/邮箱与 CRM 远端记录：同属**内部运维视图**，门禁用 leads.**write**（F-3 裁定 (b)，2026-10-01）。
export async function crmWorkspace(actor:Actor){lead(actor,true);const [jobs,conflicts,links]=await Promise.all([
 query(`SELECT j.id,j.direction,j.status,j.attempt_count,j.next_attempt_at,j.error_message,j.created_at,i.inquiry_number,i.name FROM crm_sync_jobs j LEFT JOIN inquiries i ON i.id=j.inquiry_id ORDER BY j.created_at DESC LIMIT 100`),
 query(`SELECT c.id,c.inquiry_id,c.status,c.created_at,i.inquiry_number,i.name,i.email AS local_email,i.company AS local_company,i.status AS local_status,
  c.remote_record->>'name' AS remote_name,c.remote_record->>'email' AS remote_email,c.remote_record->>'company' AS remote_company,c.remote_record->>'status' AS remote_status
  FROM crm_sync_conflicts c LEFT JOIN inquiries i ON i.id=c.inquiry_id WHERE c.status='open' ORDER BY c.created_at DESC LIMIT 100`),
 query(`SELECT l.id,l.external_id,l.last_synced_at,i.inquiry_number,i.name FROM crm_sync_links l JOIN inquiries i ON i.id=l.inquiry_id ORDER BY l.last_synced_at DESC NULLS LAST LIMIT 50`)]);
 return {jobs,conflicts,links};
}
export async function queueCrmSync(actor:Actor,input:{direction:'push'|'pull';inquiryId?:string}){
 lead(actor,true);if(input.direction==='pull')admin(actor);
 const cfg=await config();if(!cfg.enabled||!cfg.tokenCipher)throw new DomainError('先在 CRM 设置中启用连接');
 if(input.direction==='push'&&!input.inquiryId)throw new DomainError('请选择要同步的询盘');
 if(input.inquiryId){const exists=(await query('SELECT id FROM inquiries WHERE id=$1 AND deleted_at IS NULL',[input.inquiryId]))[0];if(!exists)throw new DomainError('询盘不存在',404);}
 const pending=(await query("SELECT id FROM crm_sync_jobs WHERE direction=$1 AND inquiry_id IS NOT DISTINCT FROM $2::uuid AND status IN ('pending','processing') LIMIT 1",[input.direction,input.inquiryId||null]))[0];if(pending)return pending;
 const row=(await query('INSERT INTO crm_sync_jobs(direction,inquiry_id,requested_by) VALUES($1,$2,$3) RETURNING *',[input.direction,input.inquiryId||null,actor.id]))[0];return row;
}
export async function retryCrmJob(actor:Actor,id:string){lead(actor,true);const row=(await query("UPDATE crm_sync_jobs SET status='pending',attempt_count=0,error_message=NULL,next_attempt_at=now() WHERE id=$1 AND status='failed' RETURNING *",[id]))[0];if(!row)throw new DomainError('只有失败任务可以重试；冲突请先人工处理',409);return row;}

async function crmRequest(path:string,method:'GET'|'POST',body?:unknown){
 const cfg=await config();if(!cfg.enabled||!cfg.tokenCipher)throw new DomainError('CRM 连接尚未启用');const token=unseal(cfg.tokenCipher),url=new URL(path,cfg.endpoint+'/');
 const pin=await pinnedPublicAddress(url.hostname);const content=body===undefined?'':JSON.stringify(body);
 return new Promise<{status:number;data:Row}>((resolve,reject)=>{const request=httpsRequest({hostname:url.hostname,port:443,path:url.pathname+url.search,method,
  lookup:(_hostname,_options,callback)=>callback(null,pin.address,pin.family),timeout:15000,
  headers:{'Authorization':'Bearer '+token,'Accept':'application/json','Content-Type':'application/json','User-Agent':'SUNS-CRM-Sync/2.1',...(content?{'Content-Length':Buffer.byteLength(content)}:{})}},response=>{
   const status=response.statusCode||0;let size=0;const chunks:Buffer[]=[];response.on('data',(chunk:Buffer)=>{size+=chunk.length;if(size>1_000_000){request.destroy(new DomainError('CRM 响应过大'));return;}chunks.push(chunk);});
   response.on('end',()=>{let data:Row={};try{data=JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}');}catch{reject(new DomainError('CRM 返回无效 JSON',502));return;}resolve({status,data});});response.on('error',reject);
  });request.on('timeout',()=>request.destroy(new DomainError('CRM 请求超时',504)));request.on('error',reject);request.end(content||undefined);});
}
function remoteRecord(value:unknown):Row{
 if(!value||typeof value!=='object'||Array.isArray(value))throw new DomainError('CRM 返回的线索格式无效',502);
 const row=value as Row;const externalId=String(row.externalId||''),email=String(row.email||''),name=String(row.name||''),updatedAt=String(row.updatedAt||'');
 if(!externalId||externalId.length>200||!/^\S+@\S+\.\S+$/.test(email)||email.length>254||!name||name.length>160||!Number.isFinite(Date.parse(updatedAt)))throw new DomainError('CRM 线索缺少 externalId、邮箱、名称或更新时间',502);
 return {externalId,email,name,company:String(row.company||'').slice(0,200),phone:String(row.phone||'').slice(0,80),message:String(row.message||'').slice(0,10000),status:['new','processing','qualified','replied','closed','spam'].includes(row.status)?row.status:'new',updatedAt,externalKey:typeof row.externalKey==='string'?row.externalKey:''};
}
async function conflict(record:Row,inquiryId:string|null){await query('INSERT INTO crm_sync_conflicts(inquiry_id,external_id,remote_record) VALUES($1,$2,$3::jsonb)',[inquiryId,record.externalId,JSON.stringify(record)]);}
async function applyRemote(record:Row,force=false,selectedInquiryId?:string|null){
 return transaction(async c=>{
  if(!force){const open=(await c.query("SELECT id FROM crm_sync_conflicts WHERE external_id=$1 AND status='open' LIMIT 1",[record.externalId])).rows[0];if(open)return 'conflict';}
  const linked=(await c.query('SELECT * FROM crm_sync_links WHERE external_id=$1 FOR UPDATE',[record.externalId])).rows[0];
  if(linked&&selectedInquiryId&&linked.inquiry_id!==selectedInquiryId)throw new DomainError('该 CRM 记录已关联另一条本地询盘',409);
  let local=linked?(await c.query('SELECT * FROM inquiries WHERE id=$1 AND deleted_at IS NULL FOR UPDATE',[linked.inquiry_id])).rows[0]:null;
  if(!local&&selectedInquiryId){local=(await c.query('SELECT * FROM inquiries WHERE id=$1 AND deleted_at IS NULL FOR UPDATE',[selectedInquiryId])).rows[0];if(!local)throw new DomainError('选择的本地询盘不存在',404);if(String(local.email).toLowerCase()!==String(record.email).toLowerCase()||String(local.company||'')!==String(record.company||''))throw new DomainError('所选询盘的邮箱和公司与 CRM 记录不一致',409);const existing=(await c.query('SELECT external_id FROM crm_sync_links WHERE inquiry_id=$1',[local.id])).rows[0];if(existing&&existing.external_id!==record.externalId)throw new DomainError('所选询盘已关联另一条 CRM 记录',409);}
  if(!local&&record.externalKey&&/^[0-9a-f-]{36}$/i.test(record.externalKey))local=(await c.query('SELECT * FROM inquiries WHERE id=$1 AND deleted_at IS NULL FOR UPDATE',[record.externalKey])).rows[0];
  if(!local&&!force){const matches=(await c.query('SELECT * FROM inquiries WHERE email=$1 AND coalesce(company,\'\')=$2 AND deleted_at IS NULL LIMIT 2 FOR UPDATE',[record.email,record.company])).rows;
   if(matches.length>1){await c.query('INSERT INTO crm_sync_conflicts(inquiry_id,external_id,remote_record) VALUES(NULL,$1,$2::jsonb)',[record.externalId,JSON.stringify(record)]);return 'conflict';}
   if(matches.length===1&&!force){await c.query('INSERT INTO crm_sync_conflicts(inquiry_id,external_id,remote_record) VALUES($1,$2,$3::jsonb)',[matches[0].id,record.externalId,JSON.stringify(record)]);return 'conflict';}
   local=null;
  }
  if(local){const existing=(await c.query('SELECT external_id FROM crm_sync_links WHERE inquiry_id=$1',[local.id])).rows[0];if(existing&&existing.external_id!==record.externalId){if(force)throw new DomainError('本地询盘已关联另一条 CRM 记录',409);await c.query('INSERT INTO crm_sync_conflicts(inquiry_id,external_id,remote_record) VALUES($1,$2,$3::jsonb)',[local.id,record.externalId,JSON.stringify(record)]);return 'conflict';}}
  if(linked&&local&&!force&&linked.last_local_updated_at&&linked.last_remote_updated_at&&new Date(local.updated_at)>new Date(linked.last_local_updated_at)&&new Date(record.updatedAt)>new Date(linked.last_remote_updated_at)){
   await c.query('INSERT INTO crm_sync_conflicts(inquiry_id,external_id,remote_record) VALUES($1,$2,$3::jsonb)',[local.id,record.externalId,JSON.stringify(record)]);return 'conflict';
  }
  if(local){await c.query('UPDATE inquiries SET name=$2,email=$3,company=$4,phone=$5,status=$6,message=CASE WHEN $7=\'\' THEN message ELSE $7 END WHERE id=$1',[local.id,record.name,record.email,record.company||null,record.phone||null,record.status,record.message]);}
  else{const number='CRM-'+randomUUID().slice(0,12).toUpperCase();local=(await c.query("INSERT INTO inquiries(inquiry_number,inquiry_type,name,email,company,phone,message,status) VALUES($1,'contact',$2,$3,$4,$5,$6,$7) RETURNING *",[number,record.name,record.email,record.company||null,record.phone||null,record.message||'Imported from CRM',record.status])).rows[0];}
  const latest=(await c.query('SELECT updated_at FROM inquiries WHERE id=$1',[local.id])).rows[0];
  await c.query(`INSERT INTO crm_sync_links(inquiry_id,external_id,last_local_updated_at,last_remote_updated_at,last_synced_at) VALUES($1,$2,$3,$4,now())
   ON CONFLICT(inquiry_id) DO UPDATE SET external_id=EXCLUDED.external_id,last_local_updated_at=EXCLUDED.last_local_updated_at,last_remote_updated_at=EXCLUDED.last_remote_updated_at,last_synced_at=now()`,[local.id,record.externalId,latest.updated_at,record.updatedAt]);
  await c.query('INSERT INTO audit_logs(action,entity_type,entity_id,new_data) VALUES($1,$2,$3,$4::jsonb)',['crm_pull','inquiries',local.id,JSON.stringify({externalId:record.externalId})]);return 'applied';
 });
}
async function pushInquiry(id:string){const inquiry=(await query('SELECT * FROM inquiries WHERE id=$1 AND deleted_at IS NULL',[id]))[0];if(!inquiry)throw new DomainError('询盘已不存在',404);
 const link=(await query('SELECT * FROM crm_sync_links WHERE inquiry_id=$1',[id]))[0];const payload={externalKey:id,externalId:link?.external_id||undefined,name:inquiry.name,email:inquiry.email,company:inquiry.company,phone:inquiry.phone,message:inquiry.message,status:inquiry.status,updatedAt:inquiry.updated_at,createdAt:inquiry.created_at};
 const result=await crmRequest('leads/upsert','POST',payload);
 if(result.status===409){const record=remoteRecord(result.data.record);await conflict(record,id);return 'conflict';}
 if(result.status<200||result.status>=300)throw new DomainError(`CRM 接口返回 ${result.status}`,502);
 const record=remoteRecord({...payload,...result.data});
 await query(`INSERT INTO crm_sync_links(inquiry_id,external_id,last_local_updated_at,last_remote_updated_at,last_synced_at) VALUES($1,$2,$3,$4,now())
  ON CONFLICT(inquiry_id) DO UPDATE SET external_id=EXCLUDED.external_id,last_local_updated_at=EXCLUDED.last_local_updated_at,last_remote_updated_at=EXCLUDED.last_remote_updated_at,last_synced_at=now()`,[id,record.externalId,inquiry.updated_at,record.updatedAt]);return 'applied';
}
async function pullInquiries(){let cursor='',read=0,conflicts=0;for(let page=0;page<10;page++){const result=await crmRequest('leads?limit=100'+(cursor?'&cursor='+encodeURIComponent(cursor):''),'GET');if(result.status<200||result.status>=300)throw new DomainError(`CRM 接口返回 ${result.status}`,502);
  if(!Array.isArray(result.data.items)||result.data.items.length>100)throw new DomainError('CRM 返回的分页数据无效',502);
  for(const item of result.data.items){const outcome=await applyRemote(remoteRecord(item));read++;if(outcome==='conflict')conflicts++;}
  const next=String(result.data.nextCursor||'');if(!next)break;if(next.length>500||next===cursor)throw new DomainError('CRM 分页游标无效',502);if(page===9)throw new DomainError('CRM 本次拉取超过 1000 条，需缩小远端分页范围',502);cursor=next;
 }return {read,conflicts};}

export async function scheduleCrmSync(){const cfg=await config();if(!cfg.enabled||!cfg.tokenCipher)return;
 await query(`INSERT INTO crm_sync_jobs(direction) SELECT 'pull' WHERE NOT EXISTS(SELECT 1 FROM crm_sync_jobs WHERE direction='pull' AND (created_at>now()-interval '15 minutes' OR status IN ('pending','processing','failed')))`);
 await query(`INSERT INTO crm_sync_jobs(direction,inquiry_id) SELECT 'push',i.id FROM inquiries i LEFT JOIN crm_sync_links l ON l.inquiry_id=i.id
  WHERE i.deleted_at IS NULL AND (l.last_local_updated_at IS NULL OR i.updated_at>l.last_local_updated_at) AND NOT EXISTS(SELECT 1 FROM crm_sync_conflicts c WHERE c.inquiry_id=i.id AND c.status='open') AND NOT EXISTS(SELECT 1 FROM crm_sync_jobs j WHERE j.direction='push' AND j.inquiry_id=i.id AND j.status IN ('pending','processing','failed')) ORDER BY i.updated_at LIMIT 50`);
}
export async function runCrmSyncJob(){const job=await transaction(async c=>{const row=(await c.query(`SELECT * FROM crm_sync_jobs WHERE ((status IN ('pending','failed') AND next_attempt_at<=now()) OR (status='processing' AND updated_at<now()-interval '30 minutes')) AND attempt_count<5 ORDER BY next_attempt_at FOR UPDATE SKIP LOCKED LIMIT 1`)).rows[0];if(!row)return null;return (await c.query("UPDATE crm_sync_jobs SET status='processing',attempt_count=attempt_count+1 WHERE id=$1 RETURNING *",[row.id])).rows[0];});if(!job)return null;
 try{const result=job.direction==='push'?await pushInquiry(job.inquiry_id):await pullInquiries();const status=result==='conflict'||typeof result==='object'&&result.conflicts?'conflict':'completed';
  await query('UPDATE crm_sync_jobs SET status=$2,error_message=NULL WHERE id=$1',[job.id,status]);await query("UPDATE integration_connections SET last_synced_at=now(),last_error=NULL WHERE provider='generic_https_crm' AND connection_name='default'");
  return {jobId:job.id,status};
 }catch(error){const message=(error instanceof Error?error.message:'同步失败').slice(0,500),delay=Math.min(60,2**Math.max(0,job.attempt_count-1));
  await query("UPDATE crm_sync_jobs SET status='failed',error_message=$2,next_attempt_at=now()+make_interval(mins=>$3) WHERE id=$1",[job.id,message,delay]);
  await query("UPDATE integration_connections SET last_error=$1 WHERE provider='generic_https_crm' AND connection_name='default'",[message]);throw error;}
}
export async function resolveCrmConflict(actor:Actor,input:{id:string;resolution:'keep_local'|'use_remote';inquiryId?:string}){
 admin(actor);const item=(await query("SELECT * FROM crm_sync_conflicts WHERE id=$1 AND status='open'",[input.id]))[0];if(!item)throw new DomainError('冲突不存在或已处理',404);
 if(input.resolution==='keep_local'){if(!item.inquiry_id)throw new DomainError('未匹配到本地询盘，请选择导入 CRM 记录');await queueCrmSync(actor,{direction:'push',inquiryId:item.inquiry_id});}
 else await applyRemote(remoteRecord(item.remote_record),true,input.inquiryId||item.inquiry_id||null);
 await transaction(async c=>{const updated=(await c.query("UPDATE crm_sync_conflicts SET status=$2,resolved_by=$3,resolved_at=now() WHERE id=$1 AND status='open' RETURNING id,inquiry_id,external_id,status",[input.id,input.resolution,actor.id])).rows[0];if(updated)await audit(c,actor,'crm_sync_conflicts','resolve',null,updated);});return {ok:true};
}
