import {query,transaction} from './db';
import {audit,DomainError} from './crud';
import {canRead,canWrite,getResource} from './registry';
import type {Actor} from './types';

type TaskKind='translation'|'content_review'|'content_update';
type TaskStatus='open'|'in_progress'|'in_review'|'done'|'cancelled';
type EntityType='content_item_translations'|'product_translations';
function allowed(actor:Actor,type:EntityType,write=false){const resource=getResource(type);if(!(write?canWrite(actor,resource):canRead(actor,resource)))throw new DomainError('没有处理此内容的权限',403);}

export async function collaborationTasks(actor:Actor){
 if(!canRead(actor,getResource('content_item_translations'))&&!canRead(actor,getResource('product_translations')))throw new DomainError('没有查看协作任务的权限',403);
 const rows=await query(`SELECT t.*,coalesce(c.title,p.name) AS entity_name,coalesce(c.path,p.path) AS entity_path,
  a.display_name AS assignee_name,b.display_name AS creator_name FROM collaboration_tasks t
  LEFT JOIN content_item_translations c ON t.entity_type='content_item_translations' AND c.id=t.entity_id
  LEFT JOIN product_translations p ON t.entity_type='product_translations' AND p.id=t.entity_id
  LEFT JOIN users a ON a.id=t.assigned_to LEFT JOIN users b ON b.id=t.created_by
  ORDER BY CASE WHEN t.status IN ('open','in_progress','in_review') THEN 0 ELSE 1 END,t.due_at NULLS LAST,t.created_at DESC LIMIT 200`);
 const users=await query("SELECT id,display_name,email FROM users WHERE status='active' AND deleted_at IS NULL ORDER BY display_name LIMIT 100");
 return {rows:rows.filter(row=>canRead(actor,getResource(row.entity_type))),users};
}

export async function createCollaborationTasks(actor:Actor,input:{kind:TaskKind;entityType:EntityType;entityIds:string[];title:string;instructions?:string;assignedTo?:string;dueAt?:string}){
 allowed(actor,input.entityType,true);
 if(input.entityIds.length<1||input.entityIds.length>30)throw new DomainError('每批请选择 1–30 条内容');
 const ids=[...new Set(input.entityIds)];
 const table=input.entityType;
 return transaction(async c=>{
  if(input.assignedTo){const user=(await c.query("SELECT id FROM users WHERE id=$1 AND status='active' AND deleted_at IS NULL",[input.assignedTo])).rows[0];if(!user)throw new DomainError('负责人不可用');}
  const found=(await c.query(`SELECT id FROM ${table} WHERE id=ANY($1::uuid[]) AND deleted_at IS NULL`,[ids])).rows.map(row=>row.id);
  if(found.length!==ids.length)throw new DomainError('部分内容不存在或已经删除');
  const rows=[];
  for(const id of ids){const row=(await c.query(`INSERT INTO collaboration_tasks(kind,entity_type,entity_id,title,instructions,assigned_to,created_by,due_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,[input.kind,table,id,input.title.trim(),input.instructions?.trim()||null,input.assignedTo||null,actor.id,input.dueAt||null])).rows[0];rows.push(row);await audit(c,actor,'collaboration_tasks','create',null,row);}
  return {rows};
 });
}

export async function updateCollaborationTask(actor:Actor,input:{id:string;status:TaskStatus;assignedTo?:string|null;note?:string}){
 return transaction(async c=>{
  const before=(await c.query('SELECT * FROM collaboration_tasks WHERE id=$1 FOR UPDATE',[input.id])).rows[0];if(!before)throw new DomainError('协作任务不存在',404);
  const manager=['admin','super_admin','reviewer'].includes(actor.role);
  allowed(actor,before.entity_type,!manager);
  if(!manager&&before.created_by!==actor.id&&before.assigned_to!==actor.id)throw new DomainError('只有任务负责人或创建者可更新',403);
  if(input.status==='done'&&!manager)throw new DomainError('任务完成需审核员确认',403);
  const assignee=input.assignedTo===undefined?before.assigned_to:input.assignedTo;
  if(assignee){const user=(await c.query("SELECT id FROM users WHERE id=$1 AND status='active' AND deleted_at IS NULL",[assignee])).rows[0];if(!user)throw new DomainError('负责人不可用');}
  const after=(await c.query(`UPDATE collaboration_tasks SET status=$2,assigned_to=$3,reviewed_by=$4,reviewed_at=$5,
    instructions=CASE WHEN $6::text IS NULL THEN instructions ELSE concat_ws(E'\n',instructions,$6::text) END WHERE id=$1 RETURNING *`,
   [input.id,input.status,assignee,input.status==='done'?actor.id:null,input.status==='done'?new Date():null,input.note?.trim()||null])).rows[0];
  await audit(c,actor,'collaboration_tasks','update',before,after);return after;
 });
}
