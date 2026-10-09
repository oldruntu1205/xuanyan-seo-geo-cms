import { isDeepStrictEqual } from 'node:util';
import {access} from 'node:fs/promises';
import path from 'node:path';
import {outputRoot} from './files';
import { createHash } from 'node:crypto';
import type { Job } from 'bullmq';
import { pool,query,siteContext,type Document,type Row } from '@suns/domain';
import { renderHTML,systemDocument,siteCSS,siteJS,escape,words,homeWords,tradeText } from '@suns/ui';
import { writeAtomic,removeRoute,routeFile,removeSitemap } from './files';
const digest=(s:string)=>createHash('sha256').update(s).digest('hex');

// 批量发布优化（2026-10-02 事故修复，L1 终审 R12-1/R12-2 已收紧）：refreshSite() 会把「全部已发布文档」
// 逐条重渲染 + 重建 sitemap，单次成本与已发布总数 N 成正比；过去每个任务都无条件调用它，于是批量发布
// 退化成 O(N²)（实测 2567 个任务的批次：速率 284→372→229→158→125→106→53 条/小时，ETA 从 4 小时涨到 26+ 小时）。
//
// 门控语义：只有「没有其它仍在活动的发布任务」时才做站级刷新（由轮次末尾那次负责收敛）。
// ⚠️ R12-1：必须统计全部**非终态**任务，即 pending / processing / retrying —— 只看 pending/retrying 是错的：
//   多 worker 下任务一旦被 claim 就是 processing，此时 pending/retrying 可能为 0，会被误判「队列已空」而重复全站刷新。
//   （本项目 publish_jobs.status 的 CHECK 是 pending|processing|completed|failed|retrying|cancelled，没有 running。）
// ⚠️ R12-2：PUBLISH_REFRESH_MAX_DEFER_MS **不是**「站点最多陈旧 N 毫秒」的 wall-clock SLA ——
//   它只在「有新的发布任务经过本门控」时才会被检查；若最后一个任务失败/被取消/死信而再无任务进入，
//   站级产物（列表页/首页/sitemap/manifest）会一直停在上次刷新，不会自己触发。它应读作
//   **active-queue defer interval**：在发布任务持续流动期间，距上次站级刷新超过该时长即强制刷新。
//   若将来产品契约要求严格上限，必须升级为持久化的 delayed rebuild job，而不是模块级时间戳。
const nonNegativeIntEnv=(name:string,fallback:number):number=>{const raw=process.env[name];if(raw===undefined||raw.trim()==='')return fallback;const value=Number(raw);if(!Number.isInteger(value)||value<0)throw new Error(`${name} must be a non-negative integer (got: ${raw})`);return value;};
const PUBLISH_QUEUE_THRESHOLD=nonNegativeIntEnv('PUBLISH_QUEUE_THRESHOLD',0);
const PUBLISH_REFRESH_MAX_DEFER_MS=nonNegativeIntEnv('PUBLISH_REFRESH_MAX_DEFER_MS',300000);
let lastSiteRefreshAt=0;
async function shouldRefreshSiteNow(jobId:string):Promise<boolean>{
 if(Date.now()-lastSiteRefreshAt>=PUBLISH_REFRESH_MAX_DEFER_MS)return true;
 const active=Number((await query("SELECT count(*) AS n FROM publish_jobs WHERE id<>$1 AND status IN('pending','processing','retrying')",[jobId]))[0].n);
 return active<=PUBLISH_QUEUE_THRESHOLD;
}

async function writeDocument(doc:Document,jobId:string){
 const html=renderHTML(doc),checksum=digest(html),relative=routeFile(doc.route);
 await query(`INSERT INTO publish_job_routes(publish_job_id,route,action,status,started_at) VALUES($1,$2,'generate','processing',now()) ON CONFLICT(publish_job_id,route,action) DO UPDATE SET status='processing',started_at=now(),error_message=NULL`,[jobId,doc.route]);
 try{const prior=(await query("SELECT checksum FROM static_routes WHERE route=$1 AND status='active'",[doc.route]))[0];let exists=false;try{await access(path.join(outputRoot(),relative));exists=true;}catch{}if(prior?.checksum===checksum&&exists){await query("UPDATE publish_job_routes SET status='skipped',finished_at=now() WHERE publish_job_id=$1 AND route=$2 AND action='generate'",[jobId,doc.route]);return;}await writeAtomic(relative,html);await query(`INSERT INTO static_routes(locale_id,route,entity_type,entity_id,output_path,checksum,etag,status,last_generated_at,last_publish_job_id) VALUES($1,$2,$3,$4,$5,$6,$7,'active',now(),$8) ON CONFLICT(route) DO UPDATE SET locale_id=EXCLUDED.locale_id,entity_type=EXCLUDED.entity_type,entity_id=EXCLUDED.entity_id,output_path=EXCLUDED.output_path,checksum=EXCLUDED.checksum,etag=EXCLUDED.etag,status='active',last_generated_at=now(),last_publish_job_id=EXCLUDED.last_publish_job_id`,[doc.localeId,doc.route,doc.entityType,doc.entityId,relative,checksum,'"'+checksum+'"',jobId]);await query(`UPDATE publish_job_routes SET status='completed',finished_at=now() WHERE publish_job_id=$1 AND route=$2 AND action='generate'`,[jobId,doc.route]);}
 catch(error:any){await query(`UPDATE publish_job_routes SET status='failed',finished_at=now(),error_message=$3 WHERE publish_job_id=$1 AND route=$2 AND action='generate'`,[jobId,doc.route,error.message]);throw error;}
}
async function removePublished(route:string,jobId:string){await query(`INSERT INTO publish_job_routes(publish_job_id,route,action,status,started_at) VALUES($1,$2,'delete','processing',now()) ON CONFLICT(publish_job_id,route,action) DO UPDATE SET status='processing'`,[jobId,route]);await removeRoute(route);await query('DELETE FROM published_documents WHERE route=$1',[route]);await query("UPDATE static_routes SET status='removed',last_publish_job_id=$2 WHERE route=$1",[route,jobId]);await query(`UPDATE publish_job_routes SET status='completed',finished_at=now() WHERE publish_job_id=$1 AND route=$2 AND action='delete'`,[jobId,route]);}
async function store(doc:Document,jobId:string){const prior=(await query('SELECT snapshot FROM published_documents WHERE route=$1',[doc.route]))[0]?.snapshot;const clean=(v:any)=>{const x=JSON.parse(JSON.stringify(v));delete x.updatedAt;return x;};if(prior&&isDeepStrictEqual(clean(prior),clean(doc)))doc.updatedAt=prior.updatedAt;await writeDocument(doc,jobId);if(prior&&isDeepStrictEqual(prior,JSON.parse(JSON.stringify(doc))))return;await query(`INSERT INTO published_documents(route,locale_id,entity_type,entity_id,snapshot,job_id) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(route) DO UPDATE SET locale_id=EXCLUDED.locale_id,entity_type=EXCLUDED.entity_type,entity_id=EXCLUDED.entity_id,snapshot=EXCLUDED.snapshot,published_at=now(),job_id=EXCLUDED.job_id`,[doc.route,doc.localeId,doc.entityType,doc.entityId,JSON.stringify(doc),jobId]);}
// 已发布文档 → 卡片形状（产品区 / 文章区 / 关联产品共用）
const cardOf=(d:Document)=>({id:d.product?.id,sku:d.product?.sku,route:d.route,title:d.title,description:d.description,media:d.media,applications:d.product?.applications||[]});

/** 自动填充区块的「块类型 → 已发布文档集合」映射（2026-10-09 S2/G1，规范 §7.2；S4/G5 补 certifications）。
 *
 * 为什么抽成纯函数：这段逻辑原本埋在 refreshSite 的循环里，只有连库跑一次全站刷新才验得到；
 * 抽出来后用夹具就能逐条断言三条分支，回归成本从「起库 + 发布」降到一次 tsx 调用
 * （与 systemHomeBlocks 的离线验证同一手法）。
 * 为什么 category_grid 必须在这里填：该块类型早已存在、UI 的 cards() 也已能渲染它，
 * 但发布器从不给它填 items ⇒ 运营在首页/分类页只能手抄分类标题与 URL。分类同样只取
 * 已发布快照（不读草稿、不新增对外 API），未发布的分类不会出现在公开页。
 * certifications（S4/G5）是唯一「数据源不是 Document 快照」的一类：它取 trade_market_cards
 * 的证书行（已由 certificateCards() 过滤发布态/有效期/来源完整性），形状直接就是渲染要的形状。
 * 返回 null = 该类型不由发布器接管（手填 items 一律保留，不被覆盖）。 */
export function autoBlockSource(type:string,products:Document[],content:Document[],categories:Document[],certificates:Row[]=[]):Document[]|Row[]|null{
 if(type==='product_grid')return products;
 if(type==='category_grid')return categories;
 if(type==='latest_articles')return content;
 if(type==='certifications')return certificates;
 return null;
}
/** 自动填充的 items 计算：排除自身路由（分类页不能把自己列进自己的分类列表）、
 * 默认 6 条（块数据 data.limit 可覆盖）、上限 24（与产品区/文章区原口径一致）。
 * 证书行没有 route 字段（它指向的是 source_url），故 certifications 分支不做自身路由排除。 */
export function autoBlockItems(type:string,ownRoute:string,products:Document[],content:Document[],categories:Document[],limit?:unknown,certificates:Row[]=[]):Row[]|null{
 const source=autoBlockSource(type,products,content,categories,certificates);
 if(!source)return null;
 const take=Math.min(24,Number(limit)||6);
 if(type==='certifications')return (source as Row[]).slice(0,take);
 return (source as Document[]).filter(x=>x.route!==ownRoute).slice(0,take).map(cardOf);
}

/** 质量与认证的数据源（S4/G5）：trade_market_cards 里 kind='certificate' 的**已发布、未过期、
 * 关联页面未变更**的行。判据与 packages/domain 的 publicTradeCards() 逐条对齐
 * （status='published' / valid_until 未过期 / source_hash 完整性），唯一差别是**不按市场过滤**：
 * 认证是面向所有访客的通用资质，而市场块才是"按采购目的地定制"。
 * 为什么不直接调 publicTradeCards()：它要求传入具体市场（country IN ('',$market)），
 * 而这里要的是"该语言的全部认证"；为什么不改 domain：规范 §8.3 明确 trade-operations.ts 本轮不改。 */
async function certificateCards(locale:string):Promise<Row[]>{
 return query(`SELECT m.kind,m.title,m.summary,m.source_url,m.valid_until::text AS valid_until
  FROM trade_market_cards m JOIN locales l ON l.id=m.locale_id
  WHERE l.code=$1 AND l.is_enabled AND m.kind='certificate' AND m.status='published'
    AND (m.valid_until IS NULL OR m.valid_until>=CURRENT_DATE)
    AND (m.source_hash IS NULL OR EXISTS(SELECT 1 FROM published_documents p WHERE p.route=m.source_url AND md5(p.snapshot::text)=m.source_hash))
  ORDER BY m.valid_until NULLS LAST,m.created_at DESC LIMIT 24`,[locale]);
}

/** 首页系统文档的板块序列（2026-10-09 S1）。
 *
 * 为什么顺序在这里而不是在 packages/ui：首页在「某条实体页占用同 route」之前，是由发布器生成的
 * system 文档（见下方 refreshSite）。既然板块顺序要变成数据（这样运营在后台排序/隐藏才生效），
 * 生成这份数据的责任就在发布器 —— 前端从此只负责「按 body 数组顺序渲染」。
 *
 * 与旧实现的等价性：旧 homepage() 写死为
 *   creds → product_grid → company_intro → process → case_studies → latest_articles → trade → cta
 * 这里按同一顺序产出板块序列，并保留文章/案例块的眉标与「查看全部」按钮文案。
 * 注（L1 终审第二轮指正）：原句写的「保证系统首页的观感不回退」属未经验证的声明，已删除 ——
 *   观感差异应以旧/新发布产物对比为证。另：cta 块的 label/url 现在会生效（旧实现被 closeBlock
 *   丢弃），这本身就是一处刻意的行为变化，不应被描述成"等价"。
 *
 * 导出以便离线验证：不连数据库也能用夹具渲染这一段，断言顺序与显示/隐藏行为。
 *
 * S4/G5：`certificates`（来自 certificateCards() 的证书行）非空时，在「案例」之前插入
 * `certifications` 块；为空时**不插入**（避免为 0 条证书凭空多出一个空板块，也让生产在
 * 尚无资质资料时与旧首页结构完全一致）。标题走 9 语言表（S6/G7），不再 `locale==='zh'?中:英`。 */
export function systemHomeBlocks(locale:string,ctx:Row,products:Document[],content:Document[],prefix:string,certificates:Row[]=[]){
 const copy=homeWords[locale]||homeWords.en;
 const w0=words[locale]||words.en;
 const w=(key:string)=>tradeText(locale,key);
 const trust:{dt:string;dd:string;small?:string}[]=copy.proof.map((label,i)=>({dt:w(['materials','process','markets'][i]||'materials'),dd:label}));
 return [
  {type:'trust_bar',data:{title:ctx.site.site_name||'',items:trust.slice(0,4)}},
  {type:'product_grid',data:{title:w('homeProducts'),items:products.slice(0,6).map(cardOf)}},
  {type:'company_intro',data:{caps:copy.intro,title:copy.introTitle,text:ctx.site.company_description||ctx.site.footer_description||''}},
  {type:'process_steps',data:{caps:w('process'),title:w('processTitle'),description:copy.collectionText,items:['step1','step2','step3'].map(key=>({title:w(key)}))}},
  ...(certificates.length?[{type:'certifications',data:{caps:w('certCaps'),title:w('certTitle'),items:certificates.slice(0,6)}}]:[]),
  {type:'case_studies',data:{caps:w0[0],title:w('homeCases'),action_label:w0[1],action_url:prefix+'/blog',items:content.filter(x=>x.contentType==='case_study').slice(0,3).map(cardOf)}},
  {type:'latest_articles',data:{caps:copy.craft,title:w('homeKnowledge'),description:copy.craftText,action_label:w0[1],action_url:prefix+'/blog',items:content.filter(x=>x.contentType!=='case_study'&&x.route!==prefix).slice(0,3).map(cardOf)}},
  {type:'market_procurement',data:{}},
  {type:'cta',data:{title:w('homeCtaTitle'),label:w('homeCtaLabel'),url:prefix+'/contact'}},
 ];
}

async function refreshSite(jobId:string){
 await writeAtomic('assets/site.css',siteCSS);await writeAtomic('assets/site.js',siteJS);
 const locales=await query('SELECT * FROM locales WHERE is_enabled ORDER BY sort_order');const changed:string[]=[];
 // E-12：幽灵发布清扫 —— 实体已被删除（含软删）却仍在 published_documents 里留着路由的行，会在每次 rebuild
 // 被重新生成成幽灵页（E-11 就是这么复活的）。这里在站级刷新开头统一退役，走的仍是 removePublished()
 // （= 正常下架同一条路径：删静态文件 + 删 published_documents + 标 static_routes='removed'），不自造清理逻辑。
 // 注意：判据是「正向列举」每个已知 entity_type 的存活条件（unknown/未知类型不命中任何分支 → **不退役，fail closed**，
 // 绝不会因为将来新增 entity_type 而误删公开页）。taxonomy_term_translations 没有 deleted_at 列，只校验其父 taxonomy_terms。
 // 「实体存在但被禁用」（如 taxonomy_terms.is_enabled=false）**不算孤儿** —— 禁用应走下架流程，不属于 orphan GC（L1 Q4 裁定）。
 const orphans=await query(`SELECT d.route FROM published_documents d
  WHERE (d.entity_type='product_translations' AND NOT EXISTS(SELECT 1 FROM product_translations t JOIN products p ON p.id=t.product_id WHERE t.id=d.entity_id AND t.deleted_at IS NULL AND p.deleted_at IS NULL))
     OR (d.entity_type='content_item_translations' AND NOT EXISTS(SELECT 1 FROM content_item_translations t JOIN content_items p ON p.id=t.content_item_id WHERE t.id=d.entity_id AND t.deleted_at IS NULL AND p.deleted_at IS NULL))
     OR (d.entity_type='taxonomy_term_translations' AND NOT EXISTS(SELECT 1 FROM taxonomy_term_translations t JOIN taxonomy_terms p ON p.id=t.term_id WHERE t.id=d.entity_id AND p.deleted_at IS NULL))`);
 if(orphans.length)console.log('Retiring orphan published documents: count='+orphans.length+' job='+jobId+' routes='+orphans.map(o=>String(o.route)).join(','));
 for(const orphan of orphans){await removePublished(String(orphan.route),jobId);changed.push(String(orphan.route));}
 const disabled=await query('SELECT route FROM published_documents WHERE locale_id NOT IN(SELECT id FROM locales WHERE is_enabled)');for(const x of disabled){await removePublished(x.route,jobId);changed.push(x.route);}
 for(const locale of locales){const ctx=await siteContext(locale.id);const released=(await query("SELECT snapshot FROM published_documents WHERE locale_id=$1 AND entity_type<>'system' ORDER BY published_at DESC",[locale.id])).map(r=>r.snapshot as Document);
  const products=released.filter(d=>d.entityType==='product_translations'),content=released.filter(d=>d.entityType==='content_item_translations'&&['article','guide','case_study'].includes(d.contentType||'')),categories=released.filter(d=>d.entityType==='taxonomy_term_translations');const card=cardOf;
  // S4/G5：本语言的证书行（已发布 / 未过期 / 关联页面未变更），供 certifications 块自动填充与首页板块使用。
  const certificates=await certificateCards(locale.code);
  for(const doc of released){Object.assign(doc,ctx);if(doc.entityType==='taxonomy_term_translations')doc.related=released.filter(d=>d.termIds?.includes(doc.groupId||'')).map(card);else doc.related=doc.related.filter(r=>released.some(d=>d.route===r.route));doc.alternates=(await query(`SELECT p.route AS path,l.code AS locale,l.hreflang FROM published_documents p JOIN locales l ON l.id=p.locale_id WHERE l.is_enabled AND p.entity_type=$1 AND (p.snapshot->>'groupId')=$2 ORDER BY l.sort_order`,[doc.entityType,(doc as any).groupId??doc.entityId]));if(!doc.alternates.length)doc.alternates=[{path:doc.route,locale:doc.locale,hreflang:locale.hreflang}];
   for(const b of doc.body){const auto=autoBlockItems(b.type,doc.route,products,content,categories,b.data.limit,certificates);if(auto&&(!b.data.items?.length||b.data._autoItems)){b.data.items=auto;b.data._autoItems=true;}}
   await store(doc,jobId);changed.push(doc.route);
  }
  // S6/G7：系统页（首页 / 产品列表 / 知识列表 / 联系 / 搜索）的标题一律走 9 语言表，
  // 不再 `locale.code==='zh'?中:英`（原先 de/fr/es/it/pt/ja/ko 的这 5 类页面标题全是英文）。
  const w=(key:string)=>tradeText(locale.code,key);
  const prefix='/'+locale.code;const auto:Document[]=[];
  auto.push(systemDocument(locale,ctx,prefix,ctx.site.site_title||ctx.site.site_name,systemHomeBlocks(locale.code,ctx,products,content,prefix,certificates)));
  for(const [name,docs,title] of [['products',products,w('productsTitle')],['blog',content.filter(x=>x.route!==prefix),w('knowledgeTitle')]] as [string,Document[],string][]){const count=Math.max(1,Math.ceil(docs.length/24));for(let page=0;page<count;page++){const route=prefix+'/'+name+(page?'/page/'+(page+1):'');const body:any[]=[{type:'product_grid',data:{title,items:docs.slice(page*24,(page+1)*24).map(card)}}];if(page>0)body.push({type:'cta',data:{title:w('prevPage'),label:'←',url:prefix+'/'+name+(page===1?'':'/page/'+page)}});if(page+1<count)body.push({type:'cta',data:{title:w('nextPage'),label:'→',url:prefix+'/'+name+'/page/'+(page+2)}});auto.push(systemDocument(locale,ctx,route,title,body));}}
  auto.push(systemDocument(locale,ctx,prefix+'/contact',w('contactTitle'),[{type:'contact_form',data:{title:w('contactHeading')}}]));
  auto.push(systemDocument(locale,ctx,prefix+'/search',w('searchTitle'),[{type:'search',data:{}}]));
  const paths=new Set(released.map(x=>x.route));const wanted=new Set(auto.filter(x=>!paths.has(x.route)).map(x=>x.route));const previous=await query("SELECT route FROM published_documents WHERE locale_id=$1 AND entity_type='system'",[locale.id]);for(const old of previous)if(!wanted.has(old.route)&&!paths.has(old.route)){await removePublished(old.route,jobId);changed.push(old.route);}
  for(const doc of auto){if(doc.route.endsWith('/search'))doc.seo.robots_index=false;if(paths.has(doc.route))continue;const suffix=doc.route.slice(prefix.length);doc.alternates=locales.map(l=>({locale:l.code,hreflang:l.hreflang,path:'/'+l.code+suffix}));await store(doc,jobId);changed.push(doc.route);}
 }
 const all=(await query('SELECT snapshot FROM published_documents')).map(r=>r.snapshot as Document);const live=new Set(all.map(d=>d.route));for(const doc of all){const valid=doc.alternates.filter(a=>live.has(a.path));if(valid.length!==doc.alternates.length){doc.alternates=valid;await store(doc,jobId);}}
 await writeSitemaps(jobId);return changed;
}
async function writeSitemaps(jobId:string){
 const pages=await query(`SELECT route,locale_id,snapshot,published_at FROM published_documents WHERE coalesce((snapshot->'seo'->>'robots_index')::boolean,true) AND coalesce((snapshot->'site'->>'enable_indexing')::boolean,false) ORDER BY locale_id,route`);const groups=new Map<string,Row[]>();for(const p of pages){if(p.route.endsWith('/search'))continue;const k=p.snapshot.locale+'-'+(p.snapshot.entityType==='product_translations'?'products':'pages');groups.set(k,[...(groups.get(k)||[]),p]);}
 const files:string[]=[];let origin=process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000';
 for(const [key,rows] of groups)for(let offset=0;offset<rows.length;offset+=45000){const shard=rows.slice(offset,offset+45000),name='sitemap-'+key+'-'+(offset/45000+1)+'.xml';origin=shard[0].snapshot.site.primary_domain;const xml='<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'+shard.map(p=>'<url><loc>'+escape(new URL(p.route,p.snapshot.site.primary_domain).href)+'</loc><lastmod>'+new Date(p.snapshot.updatedAt).toISOString()+'</lastmod>'+(p.snapshot.alternates||[]).map((a:Row)=>'<xhtml:link rel="alternate" hreflang="'+escape(a.hreflang)+'" href="'+escape(new URL(a.path,p.snapshot.site.primary_domain).href)+'"/>').join('')+'</url>').join('')+'</urlset>';await writeAtomic(name,xml);files.push(name);await query(`INSERT INTO sitemap_files(locale_id,content_type,file_path,url_count,last_generated_at,checksum,status) VALUES($1,$2,$3,$4,now(),$5,'completed') ON CONFLICT(file_path) DO UPDATE SET url_count=EXCLUDED.url_count,last_generated_at=now(),checksum=EXCLUDED.checksum,status='completed'`,[shard[0].locale_id,key+'-'+offset,name,shard.length,digest(xml)]);}
 const previousMaps=await query('SELECT file_path FROM sitemap_files');for(const old of previousMaps)if(!files.includes(old.file_path)){await removeSitemap(old.file_path);await query('DELETE FROM sitemap_files WHERE file_path=$1',[old.file_path]);}
 const index='<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+files.map(f=>'<sitemap><loc>'+escape(new URL('/'+f,origin).href)+'</loc></sitemap>').join('')+'</sitemapindex>';await writeAtomic('sitemap.xml',index);
 const rules=await query('SELECT * FROM robots_rules WHERE is_enabled AND environment=$1 ORDER BY sort_order',[process.env.DEPLOYMENT_ENV||'development']);const indexing=await query('SELECT enable_indexing FROM site_settings LIMIT 1');let robots='User-agent: *\n'+(process.env.DEPLOYMENT_ENV==='production'&&indexing[0]?.enable_indexing?'Allow: /':'Disallow: /')+'\n';if(process.env.DEPLOYMENT_ENV==='production'&&indexing[0]?.enable_indexing)for(const r of rules)if(!/[\r\n]/.test(r.user_agent+r.path))robots+='\nUser-agent: '+r.user_agent+'\n'+r.directive[0].toUpperCase()+r.directive.slice(1)+': '+r.path+'\n';robots+='\nSitemap: '+new URL('/sitemap.xml',origin).href+'\n';await writeAtomic('robots.txt',robots);
 const redirects=await query('SELECT source_path,target_url,redirect_type FROM redirects WHERE is_enabled');await writeAtomic('_redirects.json',JSON.stringify(redirects));await writeAtomic('manifest.json',JSON.stringify({generatedAt:new Date().toISOString(),jobId,sitemaps:files}));
}
async function purge(paths:string[],jobId:string){
 if(!process.env.CLOUDFLARE_ZONE_ID&&!process.env.CLOUDFLARE_API_TOKEN)return;
 if(!process.env.CLOUDFLARE_ZONE_ID||!process.env.CLOUDFLARE_API_TOKEN)throw new Error('Cloudflare requires both zone ID and token');
 const site=(await query('SELECT primary_domain FROM site_settings LIMIT 1'))[0];const origin=site?.primary_domain||process.env.NEXT_PUBLIC_SITE_URL;
 const sitemapPaths=(await query('SELECT file_path FROM sitemap_files')).map(r=>'/'+r.file_path);
 const urls=[...new Set([...paths,...sitemapPaths,'/sitemap.xml','/robots.txt','/assets/site.css','/assets/site.js'].flatMap(p=>[new URL(p,origin).href,...(p.includes('.')?[]:[new URL(p+'/',origin).href])]))];
 for(let i=0;i<urls.length;i+=30){const batch=urls.slice(i,i+30);const log=(await query(`INSERT INTO cdn_purge_logs(publish_job_id,provider,paths) VALUES($1,'cloudflare',$2) RETURNING id`,[jobId,JSON.stringify(batch)]))[0];try{const res=await fetch('https://api.cloudflare.com/client/v4/zones/'+process.env.CLOUDFLARE_ZONE_ID+'/purge_cache',{method:'POST',headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN,'Content-Type':'application/json'},body:JSON.stringify({files:batch}),signal:AbortSignal.timeout(20000)});const data=await res.json() as Row;if(!res.ok||!data.success)throw new Error('Cloudflare purge failed: '+res.status);await query("UPDATE cdn_purge_logs SET status='completed',completed_at=now(),provider_response=$2 WHERE id=$1",[log.id,JSON.stringify(data)]);}catch(error:any){await query("UPDATE cdn_purge_logs SET status='failed',completed_at=now(),provider_response=$2 WHERE id=$1",[log.id,JSON.stringify({error:error.message})]);throw error;}}
}
export async function processPublishJob(job:Job){
 const jobId=String(job.data.jobId);const lock=await pool.connect();let started=false;
 try{await lock.query('SELECT pg_advisory_lock(837611,1)');let task=(await query('SELECT * FROM publish_jobs WHERE id=$1',[jobId]))[0];if(!task)throw new Error('Publish job not found');if(['completed','cancelled'].includes(task.status))return {status:task.status};if(task.attempt_count>=task.max_attempts)throw new Error('Publish attempts exhausted');if(task.scheduled_at&&new Date(task.scheduled_at).getTime()>Date.now()+1000)throw new Error('Publish is not due');
  task=(await query("UPDATE publish_jobs SET status='processing',attempt_count=attempt_count+1,started_at=now(),finished_at=NULL,error_message=NULL WHERE id=$1 AND status IN('pending','retrying','processing') RETURNING *",[jobId]))[0];if(!task)return {status:'cancelled'};started=true;const changed:string[]=[];
  if(task.entity_type!=='site'){
   if(!['content_item_translations','product_translations','taxonomy_term_translations'].includes(task.entity_type))throw new Error('Unsupported entity type');
   const old=await query('SELECT route FROM published_documents WHERE entity_type=$1 AND entity_id=$2',[task.entity_type,task.entity_id]);
   const doc=task.metadata.snapshot as Document|undefined;
   if(task.job_type==='unpublish'){for(const item of old){await removePublished(item.route,jobId);changed.push(item.route);}if(task.entity_type!=='taxonomy_term_translations'){const status=task.entity_type==='product_translations'?'publish_status':'status';await query(`UPDATE ${task.entity_type} SET ${status}='draft',scheduled_at=NULL WHERE id=$1`,[task.entity_id]);}}
   else{if(!doc)throw new Error('Publish snapshot missing');const live=(await query(`SELECT * FROM ${task.entity_type} WHERE id=$1`,[task.entity_id]))[0];if(!live||live.deleted_at)throw new Error('Content was removed');if(live.path!==doc.route)throw new Error('Path changed after scheduling. Submit a new publish request.');for(const item of old)if(item.route!==doc.route){await removePublished(item.route,jobId);changed.push(item.route);}await store(doc,jobId);changed.push(doc.route);if(task.entity_type!=='taxonomy_term_translations'){const status=task.entity_type==='product_translations'?'publish_status':'status';await query(`UPDATE ${task.entity_type} SET ${status}='published',published_at=now(),scheduled_at=NULL WHERE id=$1`,[task.entity_id]);}}
  }
  const forceRefresh=task.entity_type==='site';const gate=forceRefresh?'yes':(await shouldRefreshSiteNow(jobId)?'yes':'deferred');
  if(gate==='yes'){changed.push(...await refreshSite(jobId));lastSiteRefreshAt=Date.now();}else{console.log('Site refresh deferred (bulk publish in progress), job '+jobId);}const written=await query("SELECT DISTINCT r.route FROM publish_job_routes r LEFT JOIN static_routes s ON s.route=r.route WHERE r.publish_job_id=$1 AND (r.status='completed' OR s.last_publish_job_id=$1)",[jobId]);await purge(written.map(r=>r.route),jobId);await query("UPDATE publish_jobs SET status='completed',finished_at=now(),error_message=NULL WHERE id=$1",[jobId]);return {routes:changed.length,status:'completed'};
 }catch(error:any){if(started)await query("UPDATE publish_jobs SET status=CASE WHEN attempt_count>=max_attempts THEN 'failed' ELSE 'retrying' END,error_message=$2,finished_at=now() WHERE id=$1",[jobId,String(error.message).slice(0,4000)]);throw error;}
 finally{await lock.query('SELECT pg_advisory_unlock(837611,1)').catch(()=>{});lock.release();}
}
