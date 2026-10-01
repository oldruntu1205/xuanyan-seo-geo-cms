import type {Actor} from './types';

// 「谁能看哪些询盘」的**唯一**归属口径（F-3 第 1 条，2026-10-01 定）：
//   client 角色 = 只看「自己的」询盘：**邮箱精确匹配**（同一邮箱提交的 RFQ）**或**已**指派给他**（assigned_to）。
//   其余角色（admin/super_admin/editor/seo_manager/translator/reviewer）不受限。
// 为什么要集中在一处：询盘读入口有 4 个模块（crud.list / workflow / trade-operations / crm），
// 只要漏掉任何一个，换个接口就能绕过过滤。
export function isClientActor(actor:Actor){return actor.role==='client';}

/** 给「按 inquiries 取数」的查询追加归属过滤；会往 params 追加 2 个参数，返回以 ` AND ` 开头的片段。 */
export function inquiryScope(actor:Actor,alias:string,params:unknown[]):string{
 if(!isClientActor(actor))return '';
 params.push(actor.email,actor.id);const n=params.length;
 return ` AND (${alias}.email = $${n-1} OR ${alias}.assigned_to = $${n})`;
}

/** 给「引用了 inquiries 的子表」追加归属过滤（如 inquiry_items）；经 EXISTS 关联父表。 */
export function inquiryChildScope(actor:Actor,childAlias:string,parentKey:string,parentAlias:string,params:unknown[]):string{
 if(!isClientActor(actor))return '';
 params.push(actor.email,actor.id);const n=params.length;
 return ` AND EXISTS (SELECT 1 FROM inquiries ${parentAlias} WHERE ${parentAlias}.id = ${childAlias}.${parentKey} AND (${parentAlias}.email = $${n-1} OR ${parentAlias}.assigned_to = $${n}))`;
}

/**
 * 通用表级过滤（给 crud.list 用）：表名取自 registry，值一律参数化。
 * leads 组只有三张表可被 list：inquiries / inquiry_items / download_events。
 * 其余 leads 组表一律 `AND false`（保守：宁可看不到，也不要漏看别人的）。
 */
export function leadTableScope(actor:Actor,table:string,params:unknown[]):string{
 if(!isClientActor(actor))return '';
 if(table==='inquiries')return inquiryScope(actor,'inquiries',params);
 if(table==='inquiry_items')return inquiryChildScope(actor,'inquiry_items','inquiry_id','scoped_parent',params);
 if(table==='download_events'){params.push(actor.email);const n=params.length;return ` AND download_events.email = $${n}`;}
 return ' AND false';
}

/** 把 ` AND (…)` 片段塞进 JOIN 的 ON 条件用（去掉开头的 AND）。 */
export function asJoinCondition(fragment:string):string{return fragment?fragment.replace(/^\s*AND\s+/,' AND '):'';}
