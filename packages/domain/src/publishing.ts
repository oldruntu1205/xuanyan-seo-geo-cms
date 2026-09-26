import { query, transaction } from './db';
import { sourceDocument } from './documents';
import { DomainError, audit } from './crud';
import { publishModeFor } from './registry';
import type { Actor } from './types';
export async function requestPublish(actor:Actor,table:string,id:string,action='publish',scheduledAt?:string){
 if(!(['admin','super_admin'].includes(actor.role)||(actor.permissions?actor.permissions.includes('publishing.write'):actor.role==='reviewer')))throw new DomainError('需要审核或管理员发布权限',403);
 // 可发布的资源由 registry 单点声明，避免这里再维护一份副本。
 if(publishModeFor(table)!=='record')throw new DomainError('不支持发布此类型');
 if(!['publish','unpublish','rebuild'].includes(action))throw new DomainError('Invalid publish action');
 const at=scheduledAt?new Date(scheduledAt):null;if(at&&(!Number.isFinite(at.getTime())||at.getTime()<Date.now()))throw new DomainError('定时发布时间必须在未来');
 return transaction(async c=>{
  await c.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
  const old=(await c.query(`SELECT * FROM ${table} WHERE id=$1 FOR UPDATE`,[id])).rows[0];
  const snapshot=await sourceDocument(table,id);
  if(!old||new Date(old.updated_at).getTime()!==new Date(snapshot.updatedAt).getTime())throw new DomainError('内容已修改，请重新提交发布',409);
  const task=(await c.query(`INSERT INTO publish_jobs(job_type,entity_type,entity_id,locale_id,requested_by,scheduled_at,metadata) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,[action,table,id,snapshot.localeId,actor.id,at,JSON.stringify({snapshot,route:snapshot.route})])).rows[0];
  if(at&&table!=='taxonomy_term_translations'){const status=table==='product_translations'?'publish_status':'status';await c.query(`UPDATE ${table} SET ${status}='scheduled',scheduled_at=$2 WHERE id=$1`,[id,at]);}
  await audit(c,actor,table,action==='unpublish'?'unpublish.requested':'publish.requested',old,{id,job_id:task.id,scheduled_at:at});return task;
 });
}
export async function rebuildSite(actor:Actor){if(!(['admin','super_admin'].includes(actor.role)||(actor.permissions?actor.permissions.includes('publishing.write'):actor.role==='reviewer')))throw new DomainError('没有发布权限',403);return(await query(`INSERT INTO publish_jobs(job_type,entity_type,requested_by,metadata) VALUES('rebuild','site',$1,'{}') RETURNING *`,[actor.id]))[0];}
export async function jobAction(actor:Actor,id:string,action:string){
 if(!(['admin','super_admin'].includes(actor.role)||(actor.permissions?actor.permissions.includes('publishing.write'):actor.role==='reviewer')))throw new DomainError('没有发布权限',403);
 return transaction(async c=>{const j=(await c.query('SELECT * FROM publish_jobs WHERE id=$1 FOR UPDATE',[id])).rows[0];if(!j)throw new DomainError('Task not found',404);
  if(action==='cancel'){if(!['pending','retrying'].includes(j.status))throw new DomainError('只能取消尚未处理的任务',409);return(await c.query("UPDATE publish_jobs SET status='cancelled',finished_at=now() WHERE id=$1 RETURNING *",[id])).rows[0];}
  if(action==='retry'&&['failed','cancelled'].includes(j.status))return(await c.query(`INSERT INTO publish_jobs(job_type,entity_type,entity_id,locale_id,requested_by,metadata) VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,[j.job_type,j.entity_type,j.entity_id,j.locale_id,actor.id,j.metadata])).rows[0];throw new DomainError('Invalid job action');
 });
}
