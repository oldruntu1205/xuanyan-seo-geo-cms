import {createHash} from 'node:crypto';
import {lookup} from 'node:dns/promises';
import {request as httpsRequest} from 'node:https';
import {isIP} from 'node:net';
import {query,transaction} from './db';
import {audit,DomainError} from './crud';
import {canRead,canWrite,getResource} from './registry';
import {activeLLMConfig} from './llm';
import {queueGeoMonitorSample} from './geo-monitoring';
import type {Actor,Row} from './types';

function seoAccess(actor:Actor,write=false){const r=getResource('seo_metadata');if(!(write?canWrite(actor,r):canRead(actor,r)))throw new DomainError('没有搜索优化权限',403);}
function parseCSV(input:string){
 const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;
 for(let i=0;i<input.length;i++){const c=input[i];if(c==='"'){if(quoted&&input[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&input[i+1]==='\n')i++;row.push(cell);if(row.some(v=>v.trim()))rows.push(row);row=[];cell='';}else cell+=c;}
 if(quoted)throw new DomainError('CSV 引号未闭合');row.push(cell);if(row.some(v=>v.trim()))rows.push(row);return rows;
}
function metric(raw:string,kind:'count'|'rate'|'position'){
 const text=raw.trim().replaceAll(',','');let value=Number(text.replace(/%$/,''));
 if(text.endsWith('%'))value/=100;
 if(!Number.isFinite(value)||value<0||(kind==='rate'&&value>1)||(kind==='count'&&!Number.isInteger(value)))throw new DomainError('CSV 指标包含无效数字');
 return value;
}
export async function importKeywords(actor:Actor,input:{propertyUrl:string;localeId:string;dateStart:string;dateEnd:string;csv:string}){
 seoAccess(actor,true);
 if(input.csv.length>2_000_000)throw new DomainError('CSV 文件不能超过 2 MB',413);
 const site=(await query('SELECT primary_domain,search_console_property FROM site_settings LIMIT 1'))[0];
 const accepted=[site?.primary_domain,site?.search_console_property].filter(Boolean).map(String);
 if(!accepted.length||!accepted.some(x=>x.replace(/\/$/,'')===input.propertyUrl.replace(/\/$/,'')))throw new DomainError('站点属性必须与“站点信息”中配置的域名或 Search Console 属性一致');
 const locale=(await query('SELECT id FROM locales WHERE id=$1 AND is_enabled',[input.localeId]))[0];if(!locale)throw new DomainError('请选择有效语言');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(input.dateStart)||!/^\d{4}-\d{2}-\d{2}$/.test(input.dateEnd)||input.dateStart>input.dateEnd)throw new DomainError('请选择有效的统计日期范围');
 const rows=parseCSV(input.csv.replace(/^\uFEFF/,''));if(rows.length<2||rows.length>5001)throw new DomainError('CSV 应包含标题及 1–5000 行数据');
 const headers=rows[0].map(x=>x.trim().toLowerCase());
 const aliases:Record<string,string[]>={query:['query','queries','search query','关键词','查询'],page:['page','pages','url','页面'],clicks:['clicks','点击次数','点击'],impressions:['impressions','展示次数','展示'],ctr:['ctr','点击率'],position:['position','average position','平均排名','排名']};
 const col=Object.fromEntries(Object.entries(aliases).map(([key,names])=>[key,headers.findIndex(x=>names.includes(x))]));
 if(Object.values(col).some(x=>x<0))throw new DomainError('CSV 需要 Query、Page、Clicks、Impressions、CTR、Position 六列');
 const merged=new Map<string,{queryText:string;pageUrl:string;clicks:number;impressions:number;ctr:number;position:number}>();
 const origin=new URL(site.primary_domain).origin;
 for(const fields of rows.slice(1)){
  const queryText=String(fields[col.query]||'').trim().slice(0,500),pageUrl=String(fields[col.page]||'').trim();
  if(!queryText||!pageUrl)continue;
  let page:URL;try{page=new URL(pageUrl);}catch{throw new DomainError('CSV 包含无效页面地址');}
  if(page.origin!==origin)throw new DomainError('CSV 页面不属于当前站点');
  const clicks=metric(fields[col.clicks]||'', 'count'),impressions=metric(fields[col.impressions]||'', 'count'),ctr=metric(fields[col.ctr]||'', 'rate'),position=metric(fields[col.position]||'', 'position');
  if(clicks>impressions)throw new DomainError('点击数不能超过展示数');
  const key=queryText+'\0'+page.href;if(merged.has(key))throw new DomainError('CSV 存在重复的查询词与页面组合');
  merged.set(key,{queryText,pageUrl:page.href,clicks,impressions,ctr,position});
 }
 if(!merged.size)throw new DomainError('CSV 没有可导入的数据');
 return transaction(async c=>{
  const batch=(await c.query(`INSERT INTO keyword_imports(property_url,locale_id,date_start,date_end,row_count,imported_by) VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,[input.propertyUrl,input.localeId,input.dateStart,input.dateEnd,merged.size,actor.id])).rows[0];
  for(const x of merged.values())await c.query(`INSERT INTO keyword_observations(import_id,query_text,page_url,clicks,impressions,ctr,position) VALUES($1,$2,$3,$4,$5,$6,$7)`,[batch.id,x.queryText,x.pageUrl,x.clicks,x.impressions,x.ctr,x.position]);
  await audit(c,actor,'keyword_imports','create',null,batch);return {id:batch.id,rowCount:merged.size};
 });
}
function topic(queryText:string){const words=queryText.toLowerCase().match(/[\p{L}\p{N}]{2,}/gu)||[];return words.slice(0,2).join(' ')||queryText.trim().slice(0,12);}
export async function keywordOverview(actor:Actor){
 seoAccess(actor);
 const site=(await query('SELECT primary_domain,search_console_property FROM site_settings LIMIT 1'))[0];
 const propertyUrl=site?.search_console_property||site?.primary_domain||'';
 const batch=(await query('SELECT k.*,l.code AS locale FROM keyword_imports k JOIN locales l ON l.id=k.locale_id ORDER BY k.created_at DESC LIMIT 1'))[0];if(!batch)return {propertyUrl,batch:null,clusters:[],rows:[]};
 const rows=await query<Row>(`SELECT query_text,page_url,clicks,impressions,ctr,position FROM keyword_observations WHERE import_id=$1 ORDER BY impressions DESC LIMIT 5000`,[batch.id]);
 const published=await query<{route:string;title:string}>('SELECT route,snapshot->>\'title\' AS title FROM published_documents WHERE locale_id=$1',[batch.locale_id]);
 const groups=new Map<string,{topic:string;clicks:number;impressions:number;queries:string[];hasContent:boolean}>();
 for(const row of rows){const key=topic(row.query_text),group=groups.get(key)||{topic:key,clicks:0,impressions:0,queries:[],hasContent:false};group.clicks+=Number(row.clicks);group.impressions+=Number(row.impressions);if(group.queries.length<5&&!group.queries.includes(row.query_text))group.queries.push(row.query_text);group.hasContent ||=published.some(p=>p.title?.toLowerCase().includes(key)||p.route===new URL(row.page_url).pathname);groups.set(key,group);}
 return {propertyUrl,batch,clusters:[...groups.values()].sort((a,b)=>b.impressions-a.impressions).slice(0,100),rows:rows.slice(0,100)};
}

function publicIP(address:string){
 const version=isIP(address);
 if(version===4){const o=address.split('.').map(Number);return !(o[0]===0||o[0]===10||o[0]===127||o[0]>=224||o[0]===169&&o[1]===254||o[0]===172&&o[1]>=16&&o[1]<=31||o[0]===192&&(o[1]===168||o[1]===0||o[1]===2)||o[0]===100&&o[1]>=64&&o[1]<=127||o[0]===198&&(o[1]===18||o[1]===19||o[1]===51&&o[2]===100)||o[0]===203&&o[1]===0&&o[2]===113);}
 if(version===6){const a=address.toLowerCase();return /^[23][0-9a-f]{0,3}:/.test(a)&&!a.includes('::ffff:');}
 return false;
}
export async function pinnedPublicAddress(hostname:string){if(isIP(hostname))throw new DomainError('地址必须使用公开域名');const resolved=await lookup(hostname,{all:true,verbatim:true});if(!resolved.length||resolved.some(x=>!publicIP(x.address)))throw new DomainError('域名解析到非公开地址，已拒绝请求');return resolved[0];}
/**
 * 固定解析结果用的 `lookup` 回调（防 DNS rebinding：把连接钉死在我们已经校验过的公网 IP 上）。
 *
 * ⚠️ **必须同时适配 Node ≥20 的 `autoSelectFamily`（Happy Eyeballs，默认开启）**：
 * 开启时 `net.connect` 会以 **all 模式**调用传入的 lookup（`options.all === true`），
 * 回调**必须回 `[{address, family}]` 数组**；只回字符串地址时，Node 会去读 `entry.address`
 * 得到 `undefined`，直接抛 `TypeError: Invalid IP address: undefined (ERR_INVALID_IP_ADDRESS)`。
 * 2026-10-02 实测：`growth.ts` / `crm-sync.ts` / `marketing.ts` 三处各自手写过这个回调，
 * 在本机 Node 22.23 与 prod Node 22.20（`getDefaultAutoSelectFamily() === true`）上
 * **任何出站 HTTPS 都会失败** —— 竞品采集（A-6b）、CRM 双向（A-6c）、营销投递（D-3）三个功能同时哑火。
 * 所以这里收敛成**唯一实现**，不要再在调用点各写一遍。
 */
export function pinnedLookup(pin:{address:string;family:number}){
 return (_hostname:string,options:unknown,callback:(error:Error|null,address:string|{address:string;family:number}[],family?:number)=>void)=>{
  const wantsAll=typeof options==='object'&&options!==null&&(options as {all?:boolean}).all===true;
  return wantsAll?callback(null,[{address:pin.address,family:pin.family}]):callback(null,pin.address,pin.family);
 };
}
async function fetchPublic(url:URL,limit:number){
 const pin=await pinnedPublicAddress(url.hostname);
 return new Promise<{status:number;type:string;body:string}>((resolve,reject)=>{
  const req=httpsRequest({hostname:url.hostname,port:443,path:url.pathname+url.search,method:'GET',lookup:pinnedLookup(pin),headers:{'User-Agent':'SUNSBot/1.0 (public page research)','Accept':'text/html,text/plain;q=0.8'},timeout:10000},res=>{
   const status=res.statusCode||0,type=String(res.headers['content-type']||'');const chunks:Buffer[]=[];let size=0;
   res.on('data',(chunk:Buffer)=>{size+=chunk.length;if(size>limit){req.destroy(new DomainError('网页响应超出大小上限'));return;}chunks.push(chunk);});
   res.on('end',()=>resolve({status,type,body:Buffer.concat(chunks).toString('utf8')}));res.on('error',reject);
  });req.on('timeout',()=>req.destroy(new DomainError('竞品站点响应超时')));req.on('error',reject);req.end();
 });
}
function robotsAllowed(body:string,path:string){
 const groups:{agents:string[];rules:{allow:boolean;pattern:string}[]}[]=[];let group:{agents:string[];rules:{allow:boolean;pattern:string}[]}|null=null;let inRules=false;
 for(const raw of body.split(/\r?\n/)){const line=raw.split('#')[0].trim();if(!line)continue;const sep=line.indexOf(':');if(sep<0)continue;const key=line.slice(0,sep).trim().toLowerCase(),value=line.slice(sep+1).trim();
  if(key==='user-agent'){if(!group||inRules){group={agents:[],rules:[]};groups.push(group);inRules=false;}group.agents.push(value.toLowerCase());}
  else if(group&&(key==='allow'||key==='disallow')){inRules=true;if(value)group.rules.push({allow:key==='allow',pattern:value});}
 }
 const exact=groups.filter(g=>g.agents.some(a=>'sunsbot'.includes(a)&&a!=='*'));
 const relevant=exact.length?exact:groups.filter(g=>g.agents.includes('*'));
 const matches=relevant.flatMap(g=>g.rules).filter(r=>{const escaped=r.pattern.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/\\\*/g,'.*');try{return new RegExp('^'+escaped.replace(/\\\$$/,'$')).test(path);}catch{return false;}}).sort((a,b)=>b.pattern.length-a.pattern.length||Number(b.allow)-Number(a.allow));
 return matches[0]?.allow??true;
}
function decodeHTML(s:string){return s.replace(/<[^>]+>/g,' ').replace(/&(?:amp|lt|gt|quot|nbsp|#39);/gi,x=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&nbsp;':' ','&#39;':"'"}[x.toLowerCase()]||x)).replace(/\s+/g,' ').trim();}
function extractHTML(html:string){
 const tag=(name:string)=>decodeHTML(html.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}>`,'i'))?.[1]||'');
 const meta=(key:string)=>{const tags=html.match(/<meta\b[^>]*>/gi)||[];return tags.map(x=>{const attrs=Object.fromEntries([...x.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/g)].map(m=>[m[1].toLowerCase(),m[3]]));return attrs.name?.toLowerCase()===key?attrs.content||'':'';}).find(Boolean)||'';};
 const canonical=(html.match(/<link\b(?=[^>]*rel\s*=\s*["']canonical["'])[^>]*href\s*=\s*["']([^"']+)/i)||[])[1]||'';
 const headings=[...html.matchAll(/<h[12]\b[^>]*>([\s\S]*?)<\/h[12]>/gi)].map(x=>decodeHTML(x[1])).filter(Boolean).slice(0,30);
 return {title:tag('title').slice(0,300),description:meta('description').slice(0,600),canonicalUrl:canonical.slice(0,1000),headings};
}
export async function competitorPages(actor:Actor){seoAccess(actor);return query(`SELECT p.*,l.native_name AS language,(SELECT count(*)::int FROM competitor_snapshots s WHERE s.page_id=p.id) AS snapshot_count,(SELECT count(*)::int FROM competitor_change_events e WHERE e.page_id=p.id AND e.acknowledged_at IS NULL) AS open_alerts FROM competitor_pages p LEFT JOIN locales l ON l.id=p.locale_id ORDER BY p.created_at DESC LIMIT 100`);}
export async function inspectCompetitor(actor:Actor,input:{url:string;label:string;localeId?:string}){
 seoAccess(actor,true);
 let url:URL;try{url=new URL(input.url);}catch{throw new DomainError('请输入完整 HTTPS 网址');}
 if(url.protocol!=='https:'||url.port||url.username||url.password||url.hash||url.hostname==='localhost')throw new DomainError('只允许公开 HTTPS 页面，不能带端口或登录信息');
 const normalized=url.href;
 const prior=(await query('SELECT last_checked_at FROM competitor_pages WHERE url=$1',[normalized]))[0];
 if(prior?.last_checked_at&&Date.now()-new Date(prior.last_checked_at).getTime()<3600000)throw new DomainError('同一页面每小时最多采集一次');
 const robots=await fetchPublic(new URL('/robots.txt',url.origin),500000);
 if(robots.status!==404&&robots.status!==410){if(robots.status!==200||!robotsAllowed(robots.body,url.pathname+url.search))throw new DomainError('站点 robots 规则未允许采集此页面');}
 const fetched=await fetchPublic(url,1_000_000);
 if(fetched.status!==200||!fetched.type.toLowerCase().includes('text/html'))throw new DomainError('页面未返回可读取的 HTML');
 const parsed=extractHTML(fetched.body);if(!parsed.title)throw new DomainError('未能从网页提取标题');
 const hash=createHash('sha256').update(JSON.stringify(parsed)).digest('hex');
 return transaction(async c=>{
  const page=(await c.query(`INSERT INTO competitor_pages(url,label,locale_id,created_by,last_checked_at) VALUES($1,$2,$3,$4,now()) ON CONFLICT(url) DO UPDATE SET label=EXCLUDED.label,locale_id=EXCLUDED.locale_id,last_checked_at=now() RETURNING *`,[normalized,input.label,input.localeId||null,actor.id])).rows[0];
  const previous=(await c.query('SELECT * FROM competitor_snapshots WHERE page_id=$1 ORDER BY fetched_at DESC LIMIT 1',[page.id])).rows[0];
  const snapshot=(await c.query(`INSERT INTO competitor_snapshots(page_id,title,description,canonical_url,headings,content_hash) VALUES($1,$2,$3,$4,$5::jsonb,$6) RETURNING *`,[page.id,parsed.title,parsed.description,parsed.canonicalUrl,JSON.stringify(parsed.headings),hash])).rows[0];
  const fields=previous?(['title','description','canonical_url','headings'] as const).filter(field=>JSON.stringify(previous[field])!==JSON.stringify(snapshot[field])):[];
  if(fields.length)await c.query('INSERT INTO competitor_change_events(page_id,snapshot_id,previous_snapshot_id,changed_fields) VALUES($1,$2,$3,$4::jsonb)',[page.id,snapshot.id,previous.id,JSON.stringify(fields)]);
  await audit(c,actor,'competitor_pages','sample',null,{id:page.id,url:normalized,snapshot_id:snapshot.id,changed_fields:fields});return {page,snapshot,changedFields:fields};
 });
}
export async function competitorHistory(actor:Actor,id:string){
 seoAccess(actor);const page=(await query('SELECT * FROM competitor_pages WHERE id=$1',[id]))[0];if(!page)throw new DomainError('竞品页面不存在',404);
 const snapshots=await query('SELECT * FROM competitor_snapshots WHERE page_id=$1 ORDER BY fetched_at DESC LIMIT 30',[id]);
 const alerts=await query('SELECT * FROM competitor_change_events WHERE page_id=$1 ORDER BY created_at DESC LIMIT 30',[id]);
 const latest=snapshots[0],published=await query(`SELECT route,snapshot->>'title' AS title FROM published_documents WHERE locale_id=$1 AND entity_type IN ('content_item_translations','product_translations') ORDER BY published_at DESC LIMIT 200`,[page.locale_id]);
 const terms:string[]=(String(latest?.title||'')+' '+(Array.isArray(latest?.headings)?latest.headings.join(' '):'')).toLocaleLowerCase().match(/[\p{L}\p{N}]{3,}/gu)||[];
 const suggestions=published.map(row=>({route:row.route,title:row.title,overlap:[...new Set((String(row.title||'').toLocaleLowerCase().match(/[\p{L}\p{N}]{3,}/gu)||[]).filter((word:string)=>terms.includes(word)))]})).filter(row=>row.overlap.length).sort((a,b)=>b.overlap.length-a.overlap.length).slice(0,5);
 return {page,snapshots,alerts,suggestions,changed:snapshots.length>1&&snapshots[0].content_hash!==snapshots[1].content_hash,
  updateAdvice:alerts[0]&&!alerts[0].acknowledged_at?'竞品公开页面有结构变化；检查本站对应主题页面是否需要更新标题、摘要或内链。请人工核对内容与事实来源。':''};
}
export async function acknowledgeCompetitorEvent(actor:Actor,id:string){seoAccess(actor,true);return transaction(async c=>{const before=(await c.query('SELECT * FROM competitor_change_events WHERE id=$1 FOR UPDATE',[id])).rows[0];if(!before)throw new DomainError('变更提醒不存在',404);if(before.acknowledged_at)return before;const after=(await c.query('UPDATE competitor_change_events SET acknowledged_by=$2,acknowledged_at=now() WHERE id=$1 RETURNING *',[id,actor.id])).rows[0];await audit(c,actor,'competitor_change_events','acknowledge',before,after);return after;});}

export async function geoPrompts(actor:Actor){seoAccess(actor);const prompts=await query(`SELECT p.*,l.native_name AS language,s.interval_minutes,s.is_enabled AS schedule_enabled,s.next_run_at,s.last_run_at,s.last_error AS schedule_error FROM geo_prompts p JOIN locales l ON l.id=p.locale_id LEFT JOIN geo_sampling_schedules s ON s.prompt_id=p.id ORDER BY p.updated_at DESC LIMIT 100`);const samples=await query(`SELECT s.id,s.prompt_id,s.model,s.answer,s.citations,s.brand_mentioned,s.usage,s.duration_ms,s.sampled_at,s.sample_kind FROM geo_samples s ORDER BY s.sampled_at DESC LIMIT 100`);return {prompts,samples};}
export async function saveGeoPrompt(actor:Actor,input:{id?:string;localeId:string;market:string;prompt:string;brandName:string;enabled?:boolean}){
 seoAccess(actor,true);return transaction(async c=>{
  const data=input.id?(await c.query(`UPDATE geo_prompts SET locale_id=$2,market=$3,prompt=$4,brand_name=$5,is_enabled=$6 WHERE id=$1 RETURNING *`,[input.id,input.localeId,input.market,input.prompt,input.brandName,input.enabled!==false])).rows[0]
   :(await c.query(`INSERT INTO geo_prompts(locale_id,market,prompt,brand_name,created_by) VALUES($1,$2,$3,$4,$5) RETURNING *`,[input.localeId,input.market,input.prompt,input.brandName,actor.id])).rows[0];
  if(!data)throw new DomainError('监测提示词不存在',404);await audit(c,actor,'geo_prompts',input.id?'update':'create',null,data);return data;
 });
}
export async function sampleGeoPrompt(actor:Actor,id:string){seoAccess(actor,true);const target=(await query(`SELECT t.id FROM geo_monitor_targets t JOIN geo_regions r ON r.id=t.region_id WHERE t.prompt_id=$1 AND t.is_enabled AND r.code='local' ORDER BY t.created_at LIMIT 1`,[id]))[0];if(!target)throw new DomainError('请先在 GEO 监测中心为此问题建立本地模型目标',409);return queueGeoMonitorSample(actor,target.id);}
export async function saveGeoSchedule(actor:Actor,_input:{promptId:string;intervalMinutes:number;enabled:boolean}){seoAccess(actor,true);throw new DomainError('旧重复采样已停用。请在 GEO 监测中心配置模型、地区和成本预算',409);}
export async function geoTrend(actor:Actor,promptId:string){
 seoAccess(actor);const prompt=(await query('SELECT * FROM geo_prompts WHERE id=$1',[promptId]))[0];if(!prompt)throw new DomainError('提示词不存在',404);
 const samples=await query(`SELECT id,model,answer,citations,brand_mentioned,sampled_at,sample_kind,config_hash FROM geo_samples WHERE prompt_id=$1 ORDER BY sampled_at DESC LIMIT 100`,[promptId]);
 const llm=await activeLLMConfig();const current=createHash('sha256').update([prompt.prompt,prompt.market,prompt.brand_name,llm.model].join('\n')).digest('hex');const comparable=samples.filter(s=>s.config_hash===current);
 const byDay=new Map<string,{date:string;samples:number;mentions:number;citations:number}>();
 for(const sample of comparable){const day=new Date(sample.sampled_at).toISOString().slice(0,10),row=byDay.get(day)||{date:day,samples:0,mentions:0,citations:0};row.samples++;row.mentions+=Number(sample.brand_mentioned);row.citations+=Array.isArray(sample.citations)?sample.citations.length:0;byDay.set(day,row);}
 return {prompt,samples:comparable.slice(0,30),daily:[...byDay.values()].sort((a,b)=>a.date.localeCompare(b.date)),changedConfiguration:comparable.length!==samples.length,
  difference:comparable.length>1?{mentionChanged:comparable[0].brand_mentioned!==comparable[1].brand_mentioned,citationCountDelta:(comparable[0].citations?.length||0)-(comparable[1].citations?.length||0),answerChanged:comparable[0].answer!==comparable[1].answer}:null};
}
