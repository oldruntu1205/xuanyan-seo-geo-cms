// 买家意向评级（规则版）V1 —— 内部 SPEC（规则版 V1，2026-10-02 回签；不随公开仓库分发）
//
// 本文件分三层，边界是**硬约束**（L1 D1–D7）：
//   ① 纯函数评分核心 scoreInquiryIntent() / buildInquiryIntentSignals()：不读时间、不读环境变量、
//      不访问数据库/网络 —— 相同输入必须逐字段相同输出，所以 `pnpm test` 可以完全免库地跑它。
//   ② 仓储接口 InquiryIntentRepository：把「读一行、只写机器三列、整组写/清人工三列」做成契约，
//      应用命令层 recomputeInquiryIntent() 只依赖接口 → D4（重算绝不触碰人工覆盖）可以在无库测试里被断言。
//   ③ 数据库聚合与命令（actor 入口）：所有读/重算/覆盖都复用 lead-scope 的归属口径（D7），
//      **不写 inquiries.status**（D3），**不建触发器/不加队列**（D6，V1 仅后台手动重算）。
import {query} from './db';
import {DomainError} from './crud';
import {canRead,canWrite,getResource} from './registry';
import {inquiryScope} from './lead-scope';
import type {Actor} from './types';

export type IntentLevel='hot'|'warm'|'cold'|'observe';
export const INTENT_LEVELS:readonly IntentLevel[]=['hot','warm','cold','observe'];
/** 后台显示名；“未评分”不是第五个等级，不得落库（SPEC §2）。 */
export const INTENT_LEVEL_LABELS:Record<IntentLevel,string>={hot:'高意向',warm:'中意向',cold:'低意向',observe:'观察'};

export const PURCHASE_KEYWORDS:readonly string[]=['moq','price','quote','quotation','container','order','fob','cif','采购','报价','起订量'];
export const SPAM_PATTERNS:readonly RegExp[]=[/<\s*a\s[^>]*href\s*=/i,/viagra/i,/casino/i,/payday loan/i,/backlink/i,/guest post/i];

export interface InquiryIntentSignals{
  itemCount:number;
  hasQuantityAboveOne:boolean;
  messageLength:number;
  hasPurchaseKeyword:boolean;
  spamDetected:boolean;
  inquiryType:'contact'|'rfq'|'product'|'sample'|'distributor'|null;
  sourceKind:'product'|'home_or_contact'|'other'|'unknown';
  hasCountry:boolean;
  /** 同 email 的**不同下载目标**数量；进 scorer 前已去重（SPEC §4.8）。 */
  distinctDownloadTargetCount:number;
  /** 包含当前询盘；>=2 表示至少有一次同邮箱历史询盘（SPEC §4.9 的“复访近似”）。 */
  sameEmailInquiryCount:number;
  hasUtmSource:boolean;
}

export interface InquiryIntentContributions{
  items:number;quantity:number;messageLength:number;purchaseKeyword:number;inquiryType:number;
  source:number;country:number;downloads:number;revisit:number;utm:number;
}

export interface InquiryIntentScore{
  /** integer, 0..100（总分封顶 100，SPEC §5） */
  score:number;
  level:IntentLevel;
  spamDetected:boolean;
  contributions:InquiryIntentContributions;
}

/** 信号聚合层的输入：只允许 SPEC §3/§4 列出的字段，避免 scorer 反向依赖库结构。 */
export interface InquiryIntentRawInput{
  message:string;
  inquiryType:'contact'|'rfq'|'product'|'sample'|'distributor'|null;
  sourceKind:'product'|'home_or_contact'|'other'|'unknown';
  country:string|null;
  utmSource:string|null;
  itemQuantities:number[];
  distinctDownloadTargetCount:number;
  sameEmailInquiryCount:number;
}

/** SPEC §7：应用层需要比较 key 时用它；数据库查询仍以 citext 为准，不另发明 email 相等语义。 */
export function normalizeIntentEmail(email:string|null|undefined):string{return String(email??'').trim().toLowerCase();}

export function detectIntentSpam(message:string):boolean{const text=String(message??'');return SPAM_PATTERNS.some(pattern=>pattern.test(text));}

export function detectPurchaseKeyword(message:string):boolean{const text=String(message??'').toLowerCase();return PURCHASE_KEYWORDS.some(keyword=>text.includes(keyword));}

/** 规范化后的 Unicode 字符数（码点计数），数到 `cap` 即停 —— SPEC §4.3 明确允许不数满。 */
export function intentMessageLength(message:string,cap=500):number{let count=0;for(const _character of String(message??'')){if(count>=cap)break;count+=1;}return count;}

/** URL → sourceKind（SPEC §4.6）。解析属于聚合层，评分器不碰 published_documents。 */
export function intentSourceKind(url:string|null|undefined):'product'|'home_or_contact'|'other'|'unknown'{
  const raw=String(url??'').trim();
  if(!raw)return 'unknown';
  let pathname=raw;
  try{pathname=new URL(raw).pathname;}catch{pathname=raw.split(/[?#]/)[0];}
  const path=pathname.startsWith('/')?pathname:'/'+pathname;
  if(/\/products?\//.test(path)||/^\/products?$/.test(path))return 'product';
  if(path==='/'||path===''||/\/contact\/?$/.test(path))return 'home_or_contact';
  return 'other';
}

export function buildInquiryIntentSignals(raw:InquiryIntentRawInput):InquiryIntentSignals{
  const quantities=Array.isArray(raw.itemQuantities)?raw.itemQuantities:[];
  const message=String(raw.message??'');
  return {
    itemCount:quantities.length,
    hasQuantityAboveOne:quantities.some(quantity=>Number(quantity)>1),
    messageLength:intentMessageLength(message),
    hasPurchaseKeyword:detectPurchaseKeyword(message),
    spamDetected:detectIntentSpam(message),
    inquiryType:raw.inquiryType??null,
    sourceKind:raw.sourceKind??'unknown',
    hasCountry:String(raw.country??'').trim().length>0,
    distinctDownloadTargetCount:Math.max(0,Math.trunc(Number(raw.distinctDownloadTargetCount)||0)),
    sameEmailInquiryCount:Math.max(0,Math.trunc(Number(raw.sameEmailInquiryCount)||0)),
    hasUtmSource:String(raw.utmSource??'').trim().length>0
  };
}

/** 分数 → 等级（SPEC §5）。独立导出，便于对边界值直接断言，无需凑出恰好等于边界的权重组合。 */
export function scoreToIntentLevel(score:number):IntentLevel{
  const value=Number.isFinite(score)?Number(score):0;
  if(value>=70)return 'hot';
  if(value>=40)return 'warm';
  if(value>=10)return 'cold';
  return 'observe';
}

const ZERO_CONTRIBUTIONS:InquiryIntentContributions={items:0,quantity:0,messageLength:0,purchaseKeyword:0,inquiryType:0,source:0,country:0,downloads:0,revisit:0,utm:0};

/**
 * 评分核心：纯函数、确定性（SPEC §3/§4/§5/§6）。
 * 命中 spam 硬门时直接短路为 `0 / cold` 且所有 contribution 为 0 —— 不再考虑任何正向信号。
 */
export function scoreInquiryIntent(signals:InquiryIntentSignals):InquiryIntentScore{
  if(signals.spamDetected)return {score:0,level:'cold',spamDetected:true,contributions:{...ZERO_CONTRIBUTIONS}};
  const itemCount=Math.max(0,Math.trunc(Number(signals.itemCount)||0));
  const contributions:InquiryIntentContributions={
    items:itemCount<=0?0:Math.min(50,30+itemCount*5),
    quantity:signals.hasQuantityAboveOne?10:0,
    messageLength:signals.messageLength>=500?20:signals.messageLength>=200?10:0,
    purchaseKeyword:signals.hasPurchaseKeyword?15:0,
    inquiryType:signals.inquiryType==='rfq'||signals.inquiryType==='sample'?15:0,
    source:signals.sourceKind==='product'?10:signals.sourceKind==='home_or_contact'?3:0,
    country:signals.hasCountry?5:0,
    downloads:Math.min(15,Math.max(0,Math.trunc(Number(signals.distinctDownloadTargetCount)||0))*5),
    revisit:Number(signals.sameEmailInquiryCount)>=2?15:0,
    utm:signals.hasUtmSource?5:0
  };
  const raw=Object.values(contributions).reduce((sum,value)=>sum+value,0);
  const score=Math.min(100,Math.max(0,raw));
  return {score,level:scoreToIntentLevel(score),spamDetected:false,contributions};
}

// ───────────────────────────── 应用命令层（仓储可注入） ─────────────────────────────

/** 仓储视角的行：**camelCase**（与 L1 测试契约一致），snake_case 列名只在 pg 实现里出现。 */
export interface InquiryIntentRow{
  id:string;
  intentScore:number|null;
  intentLevel:IntentLevel|null;
  intentScoredAt:string|null;
  intentOverrideLevel:IntentLevel|null;
  intentOverrideBy:string|null;
  intentOverrideAt:string|null;
}

export interface InquiryIntentRepository{
  get(inquiryId:string):Promise<InquiryIntentRow|null>;
  /** **只**允许写机器三字段；实现不得触碰人工覆盖三字段（D4）。 */
  updateMachineScore(inquiryId:string,input:{score:number;level:IntentLevel;scoredAt:string}):Promise<void>;
  /** `null` = 清除覆盖：三个 override 字段必须同时置 NULL。 */
  setOverride(inquiryId:string,input:{level:IntentLevel;by:string;at:string}|null):Promise<void>;
}

export function resolveEffectiveIntentLevel(machineLevel:IntentLevel|null|undefined,overrideLevel:IntentLevel|null|undefined):IntentLevel|null{
  return overrideLevel??machineLevel??null;
}

/** SPEC §10/§11 的命令层：算分与落库分离，`scoredAt` 由调用方给（scorer 自己绝不读时间）。 */
export async function recomputeInquiryIntent(input:{inquiryId:string;repository:InquiryIntentRepository;signals:InquiryIntentSignals;scoredAt:string}):Promise<InquiryIntentRow>{
  const before=await input.repository.get(input.inquiryId);
  if(!before)throw new DomainError('询盘不存在',404);
  const result=scoreInquiryIntent(input.signals);
  await input.repository.updateMachineScore(input.inquiryId,{score:result.score,level:result.level,scoredAt:input.scoredAt});
  // 只覆盖机器三字段：人工覆盖三字段原样返回（D4）。
  return {...before,intentScore:result.score,intentLevel:result.level,intentScoredAt:input.scoredAt};
}

export async function setInquiryIntentOverride(input:{inquiryId:string;repository:InquiryIntentRepository;level:IntentLevel|null;actorId:string;at:string}):Promise<InquiryIntentRow>{
  const before=await input.repository.get(input.inquiryId);
  if(!before)throw new DomainError('询盘不存在',404);
  await input.repository.setOverride(input.inquiryId,input.level===null?null:{level:input.level,by:input.actorId,at:input.at});
  return input.level===null?{...before,intentOverrideLevel:null,intentOverrideBy:null,intentOverrideAt:null}:{...before,intentOverrideLevel:input.level,intentOverrideBy:input.actorId,intentOverrideAt:input.at};
}

// ───────────────────────────── 数据库实现 ─────────────────────────────

const INTENT_COLUMNS='id,intent_score,intent_level,intent_scored_at,intent_override_level,intent_override_by,intent_override_at';
const toIso=(value:unknown)=>value===null||value===undefined?null:(value instanceof Date?value.toISOString():String(value));

function toRow(row:any):InquiryIntentRow{return {id:String(row.id),intentScore:row.intent_score===null||row.intent_score===undefined?null:Number(row.intent_score),intentLevel:(row.intent_level??null) as IntentLevel|null,intentScoredAt:toIso(row.intent_scored_at),intentOverrideLevel:(row.intent_override_level??null) as IntentLevel|null,intentOverrideBy:row.intent_override_by??null,intentOverrideAt:toIso(row.intent_override_at)};}

export function pgInquiryIntentRepository():InquiryIntentRepository{
  return {
    async get(inquiryId){const row=(await query(`SELECT ${INTENT_COLUMNS} FROM inquiries WHERE id=$1 AND deleted_at IS NULL`,[inquiryId]))[0];return row?toRow(row):null;},
    // UPDATE 只列机器三列：人工覆盖字段**不在语句里**，所以“重算清掉人工覆盖”在 SQL 层就不可能发生（D4 的机器级保证）。
    async updateMachineScore(inquiryId,{score,level,scoredAt}){await query('UPDATE inquiries SET intent_score=$2,intent_level=$3,intent_scored_at=$4 WHERE id=$1 AND deleted_at IS NULL',[inquiryId,score,level,scoredAt]);},
    async setOverride(inquiryId,value){
      if(value)await query('UPDATE inquiries SET intent_override_level=$2,intent_override_by=$3,intent_override_at=$4 WHERE id=$1 AND deleted_at IS NULL',[inquiryId,value.level,value.by,value.at]);
      else await query('UPDATE inquiries SET intent_override_level=NULL,intent_override_by=NULL,intent_override_at=NULL WHERE id=$1 AND deleted_at IS NULL',[inquiryId]);
    }
  };
}

function intentAccess(actor:Actor,write=false){const resource=getResource('inquiries');if(!(write?canWrite(actor,resource):canRead(actor,resource)))throw new DomainError('没有询盘权限',403);}

/** 归属口径的唯一来源是 lead-scope（D7）：这里只用它的片段，不另写一套 ownership 条件。 */
async function scopedInquiry(actor:Actor,inquiryId:string):Promise<any>{
  const params:unknown[]=[inquiryId];const scope=inquiryScope(actor,'i',params);
  const row=(await query(`SELECT i.id,i.email,i.inquiry_type,i.message,i.country,i.source_url,i.utm_source,i.status FROM inquiries i WHERE i.id=$1 AND i.deleted_at IS NULL${scope}`,params))[0];
  if(!row)throw new DomainError('询盘不存在',404);
  return row;
}

/**
 * 从库里聚合信号（SPEC §3 的输入契约）。
 * 注意：`email` 是 citext，所以同邮箱统计交给 PostgreSQL 的大小写不敏感语义，不用应用层 key 重算（SPEC §7）。
 */
export async function inquiryIntentSignals(actor:Actor,inquiryId:string):Promise<{signals:InquiryIntentSignals;row:any}>{
  intentAccess(actor);
  const row=await scopedInquiry(actor,inquiryId);
  const quantities=(await query('SELECT quantity FROM inquiry_items WHERE inquiry_id=$1 ORDER BY id',[inquiryId])).map(item=>Number(item.quantity));
  const sameEmailCount=Number((await query('SELECT count(*)::int AS n FROM inquiries x WHERE x.deleted_at IS NULL AND x.email=$1',[row.email]))[0]?.n||0);
  // 下载目标去重键：有产品就按产品，否则退回媒体资源；同一目标重复刷新不会重复计分。
  const downloads=Number((await query('SELECT count(DISTINCT coalesce(d.product_id::text,d.media_id::text))::int AS n FROM download_events d WHERE d.email=$1',[row.email]))[0]?.n||0);
  return {row,signals:buildInquiryIntentSignals({
    message:String(row.message??''),
    inquiryType:row.inquiry_type??null,
    sourceKind:intentSourceKind(row.source_url),
    country:row.country??null,
    utmSource:row.utm_source??null,
    itemQuantities:quantities,
    distinctDownloadTargetCount:downloads,
    sameEmailInquiryCount:sameEmailCount
  })};
}

/** 读：只返回 lead scope 内的询盘，否则 404（不泄露存在性）。 */
export async function inquiryIntent(actor:Actor,inquiryId:string){
  intentAccess(actor);
  const row=await scopedInquiry(actor,inquiryId);
  const record=await pgInquiryIntentRepository().get(row.id);
  if(!record)throw new DomainError('询盘不存在',404);
  return {...record,effectiveLevel:resolveEffectiveIntentLevel(record.intentLevel,record.intentOverrideLevel)};
}

/** 手动重算（SPEC §10：唯一的触发方式）；`at` 由调用方给服务端时间。
 * ⚠️ 2026-10-02 **用户决定**：client 也要能「自助重算」——所以门槛是**读**权限（`leads.read`）+ `lead-scope`，
 * 而不是写权限。理由：重算是确定性的纯函数落库、只写**自己可见**询盘的机器三列，不产生新的业务判断。
 * 人工覆盖（override）**仍然要求 `leads.write`** —— 那是销售侧的判断，未随本次放宽。
 */
export async function recomputeInquiryIntentForActor(actor:Actor,inquiryId:string,at=new Date().toISOString()){
  intentAccess(actor,false);
  const {signals}=await inquiryIntentSignals(actor,inquiryId);
  const record=await recomputeInquiryIntent({inquiryId,repository:pgInquiryIntentRepository(),signals,scoredAt:at});
  return {...record,effectiveLevel:resolveEffectiveIntentLevel(record.intentLevel,record.intentOverrideLevel)};
}

/** 人工设置/清除覆盖（SPEC §11）：by 取当前操作者、at 取服务端时间，客户端不得提交这两项。 */
export async function setInquiryIntentOverrideForActor(actor:Actor,inquiryId:string,level:IntentLevel|null,at=new Date().toISOString()){
  intentAccess(actor,true);
  await scopedInquiry(actor,inquiryId);
  const record=await setInquiryIntentOverride({inquiryId,repository:pgInquiryIntentRepository(),level,actorId:actor.id,at});
  return {...record,effectiveLevel:resolveEffectiveIntentLevel(record.intentLevel,record.intentOverrideLevel)};
}
