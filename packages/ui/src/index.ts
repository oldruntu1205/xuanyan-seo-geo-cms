import sanitize from 'sanitize-html';
import type { Document,Row,Block } from '@suns/domain/types';
import {tradeText} from './trade';
import {countryOptions} from './trade-public';
import {words,homeWords} from './words';
export {siteCSS} from './styles';
export {siteJS} from './browser';
export {tradePortalHTML} from './trade-portal';
// 2026-10-09 S1：文案表与 tradeText 对外导出，供发布器组装「首页系统文档」的板块序列
// （原先顺序写死在 homepage() 里；搬到发布器后，前端只负责「按 body 顺序渲染」）。
export {words,homeWords} from './words';
export {tradeText} from './trade';
export const escape=(v:unknown)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function safeURL(v:unknown,fallback='#'){if(typeof v!=='string'||/[\u0000-\u0020\\]/.test(v))return fallback;if(v.startsWith('/')&&!v.startsWith('//'))return v;if(/^https?:\/\//i.test(v)||/^mailto:[^@]+@[^@]+$/i.test(v)||/^tel:[+\d()-]+$/i.test(v))return v;return fallback;}
const t=(d:Document,i:number)=>(words[d.locale]||words.en)[i];
const p=(v:unknown)=>escape(v).split(/\n\s*\n/).map(x=>'<p>'+x.replaceAll('\n','<br>')+'</p>').join('');
const heading=(v:unknown)=>v?'<h2 class="h-sec">'+escape(v)+'</h2>':'';

/* ── 2026-10-08 企业官网：保留静态发布与业务 DOM 契约 ────────────────────────────────────
   设计与验收 = docs/FRONTEND-INDUSTRIAL-2026-10-08.md。
   本文件仍只负责「CMS 数据 → HTML」，样式表在 styles.ts，行为在 browser.ts。
   三条硬约束（改这里前先读）：
   1. 不得改动 tests/render.test.ts 断言的 DOM 钩子：hero-visual product-visual / hero-caption /
      home-collection / home-product-image / data-slide-count / data-pause / 每页恰好一个 <h1>。
      它们是为兼容既有测试而保留的类名，视觉上由 styles 里的同名选择器接管。
   2. 不得改动 site.js 依赖的钩子：.inquiry-form / [data-rfq-list] / [data-rfq-add] /
      .product-actions 的紧邻兄弟节点 / [data-home-filter] / [data-home-products] /
      [data-carousel] / [data-trade-public] / .search-form + .search-results / .service-widget /
      [data-analytics] / .file-field。
   3. kiln 设计里没有的组件（询盘篮、轮播、统计同意、客服、市场块、搜索、分页）用附加类，
      样式集中在 styles.ts 的 kiln-extra 段，不要往 kiln.css 里混写。            */

// kiln 重设计新增的少量界面词（其余全部沿用 words / tradeText / homeWords 三张既有 9 语言表）。
const extra:Record<string,Record<string,string>>={
 en:{home:'Home',readMore:'Read more',categories:'Categories',previous:'Previous',next:'Next',allProducts:'All products',sendDrawing:'Send a drawing',noPhoto:'Photograph on request',materials:'Materials',process:'Process',markets:'Markets'},
 zh:{home:'首页',readMore:'阅读更多',categories:'产品分类',previous:'上一页',next:'下一页',allProducts:'全部产品',sendDrawing:'发送图纸',noPhoto:'暂无图片，可来信索取实物照片',materials:'材料',process:'工艺',markets:'市场'},
 de:{home:'Start',readMore:'Weiterlesen',categories:'Kategorien',previous:'Zurück',next:'Weiter',allProducts:'Alle Produkte',sendDrawing:'Zeichnung senden',noPhoto:'Foto auf Anfrage',materials:'Material',process:'Fertigung',markets:'Märkte'},
 fr:{home:'Accueil',readMore:'Lire la suite',categories:'Catégories',previous:'Précédent',next:'Suivant',allProducts:'Tous les produits',sendDrawing:'Envoyer un plan',noPhoto:'Photo sur demande',materials:'Matière',process:'Fabrication',markets:'Marchés'},
 es:{home:'Inicio',readMore:'Leer más',categories:'Categorías',previous:'Anterior',next:'Siguiente',allProducts:'Todos los productos',sendDrawing:'Enviar un plano',noPhoto:'Fotografía a petición',materials:'Material',process:'Fabricación',markets:'Mercados'},
 it:{home:'Home',readMore:'Leggi di più',categories:'Categorie',previous:'Precedente',next:'Successivo',allProducts:'Tutti i prodotti',sendDrawing:'Invia un disegno',noPhoto:'Foto su richiesta',materials:'Materiale',process:'Lavorazione',markets:'Mercati'},
 pt:{home:'Início',readMore:'Ler mais',categories:'Categorias',previous:'Anterior',next:'Seguinte',allProducts:'Todos os produtos',sendDrawing:'Enviar um desenho',noPhoto:'Fotografia a pedido',materials:'Material',process:'Fabrico',markets:'Mercados'},
 ja:{home:'ホーム',readMore:'続きを読む',categories:'カテゴリ',previous:'前へ',next:'次へ',allProducts:'すべての製品',sendDrawing:'図面を送る',noPhoto:'写真はお問い合わせください',materials:'材質',process:'製造',markets:'市場'},
 ko:{home:'홈',readMore:'더 보기',categories:'카테고리',previous:'이전',next:'다음',allProducts:'전체 제품',sendDrawing:'도면 보내기',noPhoto:'사진은 문의 주세요',materials:'재질',process:'제조',markets:'시장'},
};
const u=(d:Document,key:string)=>(extra[d.locale]||extra.en)[key]||extra.en[key];

// ── kiln 版式原语（结构与 opctools-redesign/en/* 逐块对齐，勿改层级）────────────
const wrap=(inner:string)=>'<div class="wrap">'+inner+'</div>';
const section=(inner:string,opts:{tight?:boolean;id?:string;cls?:string}={})=>'<section class="section'+(opts.tight?' section--tight':'')+(opts.cls?' '+opts.cls:'')+'"'+(opts.id?' id="'+escape(opts.id)+'"':'')+'>'+inner+'</section>';
const caps=(v:unknown,style='')=>v?'<p class="caps"'+(style?' style="'+style+'"':'')+'>'+escape(v)+'</p>':'';
const h2sec=(v:unknown,style='margin-top:1rem')=>v?'<h2 class="h-sec"'+(style?' style="'+style+'"':'')+'>'+escape(v)+'</h2>':'';
const lede=(v:unknown)=>v?'<p class="lede">'+escape(v)+'</p>':'';
const btn=(href:string,label:string,kind='')=>label?'<a class="btn'+(kind?' '+kind:'')+'" href="'+escape(safeURL(href))+'">'+escape(label)+'</a>':'';
function secHead(opts:{caps?:string;title?:unknown;description?:unknown;action?:string}){
 return '<div class="sec-head"><div class="t">'+caps(opts.caps)+h2sec(opts.title)+lede(opts.description)+'</div>'+(opts.action||'')+'</div>';
}
function crumbs(d:Document,trail:{label:string;href?:string}[]){
 return '<nav class="crumbs" aria-label="Breadcrumb"><a href="/'+escape(d.locale)+'/">'+escape(u(d,'home'))+'</a>'+trail.map(x=>'<span class="sep">/</span>'+(x.href?'<a href="'+escape(safeURL(x.href))+'">'+escape(x.label)+'</a>':'<span>'+escape(x.label)+'</span>')).join('')+'</nav>';
}
function pageHead(opts:{crumbs:string;caps?:string;title:string;description?:unknown;action?:string;split?:boolean}){
 const head=opts.crumbs+(opts.caps?caps(opts.caps,'margin-top:1.4rem'):'')+'<h1>'+escape(opts.title)+'</h1>'+lede(opts.description);
 return '<section class="page-head'+(opts.split?' page-head--split':'')+'">'+wrap(opts.split?('<div>'+head+'</div>'+(opts.action?opts.action:'')):head)+'</section>';
}

function image(m:Row,priority=false,fallbackAlt=''){const src=safeURL(m.url||m.image||m.src||m.desktopURL,'');if(!src)return '';const variants=Array.isArray(m.variants)?m.variants:[];const sources=['avif','webp'].map(format=>{const items=variants.filter((v:Row)=>v.format===format);return items.length?'<source type="image/'+format+'" srcset="'+items.map((v:Row)=>escape(safeURL(v.url))+' '+Number(v.width)+'w').join(', ')+'" sizes="(max-width:650px) 100vw, 50vw">':'';}).join('');return `<picture>${sources}<img src="${escape(src)}" alt="${escape(m.alt_text||m.alt||fallbackAlt||'')}" ${m.width?'width="'+Number(m.width)+'"':''} ${m.height?'height="'+Number(m.height)+'"':''} loading="${priority?'eager':'lazy'}" decoding="async" ${priority?'fetchpriority="high"':''}></picture>`;}
const appsOf=(item:Row):string[]=>Array.isArray(item.applications)?item.applications.map((x:Row|string)=>typeof x==='string'?x:(x.title||x.text||'')).filter(Boolean) as string[]:[];
const labelOf=(item:Row)=>String(item.category_label||item.category||item.group||item.kicker||'').trim();
const specOf=(item:Row,apps:string[])=>{const explicit=String(item.spec||'').trim();return explicit||[item.sku,...apps.slice(0,2)].filter(Boolean).join(' · ');};

function card(item:Row,d:Document){
 const name=String(item.title||item.name||'');const href=escape(safeURL(item.route||item.url));
 const media=image(item.media?.[0]||{url:item.image,alt:name},false,name);
 const apps=appsOf(item);const cat=labelOf(item);const spec=specOf(item,apps);
 return '<a class="card'+(media?'':' card--plot')+'" href="'+href+'"'+(cat?' data-cat="'+escape(cat)+'"':'')+'>'
  +'<div class="card-art">'+(media||'<span class="plot">'+escape(u(d,'noPhoto'))+'</span>')+'</div>'
  +'<div class="card-body">'+(cat?'<span class="card-cat">'+escape(cat)+'</span>':'')+'<h3>'+escape(name)+'</h3>'+(spec?'<span class="spec">'+escape(spec)+'</span>':'')+'</div></a>';
}
function cards(items:Row[]=[],d:Document){
 if(!items.length)return '';
 const cats=[...new Set(items.map(labelOf).filter(Boolean))];
 const filters=cats.length>1?'<div class="filters" role="group" aria-label="'+escape(u(d,'categories'))+'"><button type="button" aria-pressed="true" data-filter="all">'+escape(u(d,'allProducts'))+'</button>'+cats.map(c=>'<button type="button" aria-pressed="false" data-filter="'+escape(c)+'">'+escape(c)+'</button>').join('')+'</div>':'';
 return filters+'<div class="grid">'+items.map(x=>card(x,d)).join('')+'</div>';
}
function posts(items:Row[]=[],d:Document,label?:string){
 if(!items.length)return '';
 return '<div class="posts">'+items.map(x=>{
  const name=String(x.title||x.name||'');const href=escape(safeURL(x.route||x.url));const cat=labelOf(x)||label||'';const desc=String(x.description||x.text||'');
  return '<a class="post" href="'+href+'">'+(cat?'<span class="k">'+escape(cat)+'</span>':'')+'<h3>'+escape(name)+'</h3>'+(desc?'<p>'+escape(desc)+'</p>':'')+'<span class="rd">'+escape(u(d,'readMore'))+'</span></a>';
 }).join('')+'</div>';
}
function rows(items:Row[]=[],d:Document){
 if(!items.length)return '';
 return '<div class="rows">'+items.map(x=>{
  const name=String(x.title||x.name||'');const href=escape(safeURL(x.route||x.url));const cat=labelOf(x);const desc=String(x.description||x.text||'');
  return '<a class="row" href="'+href+'"'+(cat?' data-cat="'+escape(cat)+'"':'')+'>'+(cat?'<span class="meta"><b>'+escape(cat)+'</b></span>':'<span class="meta"></span>')+'<div><h3>'+escape(name)+'</h3>'+(desc?'<p>'+escape(desc)+'</p>':'')+'</div><span class="go">'+escape(u(d,'readMore'))+'</span></a>';
 }).join('')+'</div>';
}

function inquiry(d:Document){
 const w=(key:string)=>escape(tradeText(d.locale,key));
 const id=(name:string)=>'iq-'+name;
 // 每个控件都带显式 id，label 用 for 关联（kiln 的 .field 依赖 label 做眉标，无 for 会点不中控件）。
 const field=(text:string,control:string,controlId:string)=>'<div class="field"><label for="'+controlId+'">'+text+'</label>'+control+'</div>';
 return `<form class="form inquiry-form" data-locale="${escape(d.locale)}" ${d.product?'data-product="'+escape(d.product.id)+'" data-product-title="'+escape(d.title)+'" data-product-route="'+escape(d.route)+'"':''}>
 <div class="duo">${field(t(d,6),'<input id="'+id('name')+'" name="name" maxlength="160" autocomplete="name" required>',id('name'))}${field(t(d,7),'<input id="'+id('email')+'" name="email" type="email" maxlength="254" autocomplete="email" required>',id('email'))}</div>
 <div class="duo">${field(t(d,8),'<input id="'+id('company')+'" name="company" maxlength="200" autocomplete="organization">',id('company'))}${field(w('phone'),'<input id="'+id('phone')+'" name="phone" type="tel" maxlength="80" autocomplete="tel">',id('phone'))}</div>
 <div class="duo">${field(w('country'),'<select id="'+id('country')+'" name="country" autocomplete="country"><option value="">—</option>'+countryOptions(d.locale)+'</select>',id('country'))}${field(w('delivery'),'<input id="'+id('delivery')+'" name="target_delivery_on" type="text" inputmode="numeric" autocomplete="off" pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}" placeholder="YYYY-MM-DD">',id('delivery'))}</div>
 <div class="duo">${field(w('term'),'<select id="'+id('term')+'" name="preferred_incoterm"><option value="">—</option>'+['EXW','FCA','FOB','CFR','CIF','CPT','CIP','DAP','DPU','DDP'].map(x=>'<option>'+x+'</option>').join('')+'</select>',id('term'))}${d.product?field(w('quantity'),'<input id="'+id('quantity')+'" name="quantity" type="number" min="0.001" step="any" value="1" required>',id('quantity')):''}</div>
 <div class="field"><label for="${id('notes')}">${w('notes')}</label><textarea id="${id('notes')}" name="specification_notes" maxlength="2000" rows="3"></textarea></div>
 <div class="field"><span class="field-label" id="iq-file-label">${w('attachment')}</span><div class="file-field"><input id="iq-file" name="attachment" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" aria-labelledby="iq-file-label" data-attachment><label class="file-btn" for="iq-file">${w('chooseFile')}</label><span class="file-name" data-empty="${w('noFile')}">${w('noFile')}</span></div><span class="hint">${w('fileHint')}</span></div>
 <div class="field"><label for="${id('message')}">${t(d,9)}</label><textarea id="${id('message')}" name="message" minlength="5" maxlength="10000" rows="5" required></textarea></div>
 <label class="check" for="iq-consent"><input id="iq-consent" name="consent" type="checkbox" required> <span>${t(d,11)}</span></label><label class="trap" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>
 <div class="form-foot"><button class="btn btn-ember" type="submit">${t(d,10)}</button></div><p class="form-result" role="status" aria-live="polite"></p></form>`;
}
function inquiryList(d:Document){const w=(key:string)=>escape(tradeText(d.locale,key));return '<aside class="rail-wrap"><div class="inquiry-list"><div class="bd" data-rfq-list data-basket="'+w('basket')+'" data-empty="'+w('empty')+'" data-remove="'+w('remove')+'" data-quantity="'+w('quantity')+'"><h3>'+w('basket')+'</h3><p class="rfq-empty">'+w('empty')+'</p></div></div></aside>';}

function productLead(d:Document){
 if(!d.product)return '';
 const w=(key:string)=>tradeText(d.locale,key);
 const gallery=d.media.map((m,i)=>i===0
  ?'<div class="pd-art" id="stage"><img src="'+escape(safeURL(m.url||m.image,''))+'" alt="'+escape(m.alt_text||m.alt||d.title)+'" fetchpriority="high" decoding="async"></div>'
  :'').join('');
 const thumbs=d.media.length>1?'<div class="thumbs" data-gallery data-stage="#stage">'+d.media.map((m,i)=>'<button type="button" aria-pressed="'+(i===0?'true':'false')+'" aria-label="'+escape(m.alt_text||m.alt||d.title+(' '+String(i+1)))+'"'+(i?' data-src="'+escape(safeURL(m.url||m.image,''))+'" data-alt="'+escape(m.alt_text||m.alt||d.title)+'"':'')+'><img src="'+escape(safeURL(m.variants?.find((v:Row)=>Number(v.width)===480)?.url||m.url||m.image,''))+'" alt="" loading="lazy" decoding="async"></button>').join('')+'</div>':'';
 const facts:{label:string;value:string}[]=[
  {label:w('moq'),value:d.product.min_order_quantity?[d.product.min_order_quantity,d.product.order_unit].filter(Boolean).join(' '):''},
  {label:w('lead'),value:d.product.lead_time_days?d.product.lead_time_days+' '+w('days'):''},
  {label:w('packaging'),value:d.product.packaging_details||''},{label:w('custom'),value:d.product.customization_details||''},{label:w('sample'),value:d.product.sample_policy||''},
  {label:w('applications'),value:appsOf({applications:d.product.applications}).join(' · ')}
 ].filter(x=>x.value);
 const chips=(Array.isArray(d.product.features)?d.product.features:[]).map((f:Row|string)=>typeof f==='string'?f:(f.text||f.title||'')).filter(Boolean);
 const specs=Array.isArray(d.product.specs)?d.product.specs:[];
 return '<section class="section section--tight" style="padding-top:clamp(2.4rem,5vw,4rem)"><div class="wrap pd"><div>'
  +(gallery||'<div class="pd-art"><span class="plot">'+escape(d.product.sku||u(d,'noPhoto'))+'</span></div>')+thumbs
  +'</div><div>'+caps(labelOf({category:d.product.category_name})||t(d,0))
  +'<p class="pd-lead">'+escape([d.product.sku,(Array.isArray(d.product.specs)?d.product.specs:[]).slice(0,2).map((s:Row)=>[s.value_text??s.value_number??s.value_boolean,s.unit].filter(x=>x!=null).join(' ')).filter(Boolean).join(' · ')].filter(Boolean).join(' · '))+'</p>'
  +'<p class="lede" style="margin-top:1.2rem">'+escape(d.product.description||d.description||'')+'</p>'
  +(facts.length?'<ul class="pd-spec">'+facts.map(f=>'<li><span>'+escape(f.label)+'</span><span>'+escape(f.value)+'</span></li>').join('')+'</ul>':'')
  +(chips.length?'<div class="chips">'+chips.map(c=>'<span>'+escape(c)+'</span>').join('')+'</div>':'')
  +'<div class="btn-row product-actions" style="margin-top:1.8rem"><a class="btn btn-ember" href="#inquiry">'+t(d,4)+'</a><button type="button" class="btn" data-rfq-add data-id="'+escape(d.product.id)+'" data-title="'+escape(d.title)+'" data-route="'+escape(d.route)+'">'+escape(tradeText(d.locale,'add'))+' +</button></div><span class="rfq-feedback" role="status" aria-live="polite"></span>'
  +'</div></div></section>'
  +(specs.length?section(wrap('<div class="split"><div>'+caps(t(d,12))+h2sec(d.title)+'<div class="table-wrap" style="margin-top:2.2rem"><table class="spec-table spec-table--box"><caption>'+escape(d.title)+'</caption><tbody>'+specs.map((s:Row)=>'<tr><th scope="row">'+escape(s.name)+'</th><td>'+escape([s.value_text??s.value_number??s.value_boolean,s.unit].filter(x=>x!=null).join(' '))+'</td></tr>').join('')+'</tbody></table></div></div>'
   +(d.media[0]?'<div><div class="pd-art" style="aspect-ratio:4/3"><img src="'+escape(safeURL(d.media[0].url||d.media[0].image,''))+'" alt="'+escape(d.media[0].alt_text||d.media[0].alt||d.title)+'" loading="lazy" decoding="async"></div></div>':'')+'</div>'),{tight:true}):'');
}

function hero(d:Document){
 const slides=d.heroes.length?d.heroes:[{title:d.title,description:d.description,primary_button_text:t(d,4),primary_button_url:'/'+d.locale+'/contact'}];
 const featured=d.body.filter(b=>b.type==='product_grid').flatMap(b=>Array.isArray(b.data?.items)?b.data.items:[]).find((x:Row)=>x.media?.[0]?.url||x.image);
 const w=(key:string)=>tradeText(d.locale,key);
 return '<section class="hero" data-carousel tabindex="0" aria-roledescription="carousel">'+slides.map((s,i)=>{
  const product=!s.desktopURL&&i===0?featured:undefined;
  const media=s.desktopURL?image({url:s.desktopURL,alt:s.subtitle||s.title},i===0):product?image(product.media?.[0]||{url:product.image,alt:product.title},true):'';
  return '<article class="slide '+(i===0?'is-active':'')+(media?' has-visual':'')+'" '+(i?'hidden':'')+' data-duration="'+(Number(s.duration_ms)||6000)+'"><div class="wrap hero-in">'
   +'<div class="hero-copy">'+caps(s.subtitle||d.site.site_title||d.site.site_name)+'<'+(i?'h2':'h1')+'>'+escape(s.title)+'</'+(i?'h2':'h1')+'>'+lede(s.description)+'<div class="hero-acts">'+btn(s.primary_button_text?s.primary_button_url:'/'+d.locale+'/contact#inquiry',s.primary_button_text||t(d,4),'btn-ember')+'<a class="tlink" href="'+escape(safeURL(s.secondary_button_text?s.secondary_button_url:'/'+d.locale+'/products'))+'">'+escape(s.secondary_button_text||u(d,'allProducts'))+' →</a>'+'</div></div>'
   +(media?'<div class="hero-art hero-visual '+(product?'product-visual':'scene-visual')+'">'+media+'<span class="hero-caption">'+escape([d.site.site_name,d.site.site_title].filter(Boolean).join(' · '))+'</span></div>':'')
   +'</div></article>';
 }).join('')+'<div class="wrap hero-foot"><span class="hero-note">'+escape(d.site.site_name)+' <span aria-hidden="true">/</span> '+escape(t(d,0))+'</span>'+(slides.length>1?'<div class="hero-controls"><button type="button" data-prev aria-label="Previous slide">←</button><span data-slide-count>01 / '+String(slides.length).padStart(2,'0')+'</span><button type="button" data-pause aria-label="Pause slideshow">Ⅱ</button><button type="button" data-next aria-label="Next slide">→</button></div>':'')+'</div></section>';
}

function homeCollection(d:Document,block?:Block){
 const items:Row[]=Array.isArray(block?.data?.items)?block.data.items:[];
 if(!items.length)return '';
 const labels=[...new Set(items.slice(0,6).flatMap(appsOf))].slice(0,5);
 const filters=labels.length>1?'<div class="filters home-filters" role="group" aria-label="'+escape(tradeText(d.locale,'applications'))+'"><button type="button" data-home-filter="" aria-pressed="true">'+escape(u(d,'allProducts'))+'</button>'+labels.map(label=>'<button type="button" data-home-filter="'+escape(label)+'" aria-pressed="false">'+escape(label)+'</button>').join('')+'</div>':'';
 const grid='<div class="grid" data-home-products>'+items.slice(0,6).map((item)=>{
  const name=String(item.title||item.name||'');const href=escape(safeURL(item.route||item.url));
  const visual=image(item.media?.[0]||{url:item.image,alt:name},false,name);const cat=appsOf(item)[0]||'';
  return '<article class="card home-product" data-applications="'+escape(JSON.stringify(appsOf(item)))+'">'
   +'<a href="'+href+'" class="home-product-image" aria-label="'+escape(name)+'">'+(visual||'<span class="plot">'+escape(u(d,'noPhoto'))+'</span>')+'</a>'
   +'<div class="card-body">'+(cat?'<span class="card-cat">'+escape(cat)+'</span>':'')+'<h3><a href="'+href+'">'+escape(name)+'</a></h3>'+(item.description?'<span class="spec">'+escape(item.description)+'</span>':'')+'</div></article>';
 }).join('')+'</div>';
 return section(wrap(secHead({caps:homeWordsFor(d).collection,title:block?.data?.title||t(d,0),description:homeWordsFor(d).collectionText,action:btn('/'+d.locale+'/products',homeWordsFor(d).allProducts)})+filters+grid),{tight:true,cls:'home-collection'});
}
const homeWordsFor=(d:Document)=>homeWords[d.locale]||homeWords.en;
// 2026-10-09 S1：首页从「顺序写死在代码里」改为「按 body 数组顺序渲染」。
// 为什么必须这样改：旧实现用 d.body.find(type===...) 把产品区/案例/文章捞出来钉死在固定位置，
// 运营在后台按 ↑/↓ 调顺序对它们完全无效，也无法关掉信任带与采购流程（那两块当时由代码生成）。
// 三条统一约定（2026-10-09 L1 终审整改后）：
//  ① `data.hidden === true` 表示「显式隐藏」：该块一定不渲染，且**永不被兜底补回**；
//     缺省（含非布尔值）一律视为 false。它在两条存储路径上的分工是：
//     块表路径下 `is_enabled` 决定「是否参与装载」，`data.hidden` 决定「装载后是否展示」。
//  ② product_grid 仍走 homeCollection() 的富卡片版式（应用筛选标签），其余交给 block() 分派；
//  ③ 兜底只针对「未配置」（body 里根本没有该类型），不针对「显式隐藏」：
//     · 市场块**不再兜底** —— 它由发布器的 systemHomeBlocks() 写入系统首页；实体页没配就是没配。
//       （L1 Q2 裁定：「有轮播 ⇒ 必有市场块」与「市场块可隐藏」互相冲突，改为
//        「市场块在场时内部钩子必须完整；不在场时前端脚本安全退出」，由 trade-public.ts 的空集循环保证。）
//     · cta 仍保留一份**有边界**的兼容兜底：仅当完全没有配置任何 cta 块时，才补默认结尾区块
//       （旧页面可能从未配过 CTA）；一旦配置了（哪怕被隐藏）就绝不补回。
const isHidden=(b:Block)=>b?.data?.hidden===true;
function homepage(d:Document){
 const configured=d.body;
 const visible=configured.filter(b=>!isHidden(b));
 const body=visible.map(b=>b.type==='product_grid'?homeCollection(d,b):block(b,d)).join('');
 const ctaConfigured=configured.some(b=>b.type==='cta');
 return body+(ctaConfigured?'':closeBlock(d));
}
function closeBlock(d:Document,title?:string,text?:string,label?:string,url?:string,capsText?:string){
 return '<section class="close">'+wrap(caps(capsText||t(d,4))+h2sec(title||t(d,4),'')+lede(text||d.site.footer_description||d.site.company_description||'')+'<div class="close-acts">'+btn(url||('/'+d.locale+'/contact#inquiry'),label||t(d,4),'btn-ember')+btn('/'+d.locale+'/products',t(d,0))+'</div>')+'</section>';}

function block(b:Block,d:Document):string{const a=b.data||{};const type=b.type;const items=Array.isArray(a.items)?a.items:[];
 if(['hero','hero_banner','hero_slider'].includes(type)){const media=image(a);return '<section class="hero hero--banner'+(media?' has-visual':'')+'">'+wrap('<div class="hero-in"><div class="hero-copy">'+caps(d.site.site_name)+h2sec(a.title,'')+lede(a.text||a.description)+(a.url?'<div class="hero-acts">'+btn(a.url,a.label||t(d,4),'btn-ember')+'</div>':'')+'</div>'+(media?'<div class="hero-art">'+media+'</div>':'')+'</div>')+'</section>';}
 if(type==='rich_text')return section(wrap('<div class="prose">'+heading(a.title)+(a.html?sanitize(String(a.html),{allowedTags:['p','h2','h3','h4','strong','em','ul','ol','li','a','blockquote','table','thead','tbody','tr','td','th','br','figure','figcaption','cite','code'],allowedAttributes:{a:['href','title','rel']},allowedSchemes:['https','http','mailto']}):p(a.text||''))+'</div>'));
 if(type==='image_text')return section(wrap('<div class="split">'+(image(a)?'<div>'+image(a)+'</div>':'')+'<div>'+caps(labelOf(a))+h2sec(a.title)+lede(a.text||a.description)+(a.url?'<div class="btn-row" style="margin-top:1.6rem">'+btn(a.url,a.label||u(d,'readMore'))+'</div>':'')+'</div></div>'));
 if(['product_grid','category_grid','application_grid','feature_grid'].includes(type)){const head=String(a.title||'')===d.title?'':secHead({caps:d.site.site_name,title:a.title,description:a.description});return section(wrap(head+cards(items,d)),{tight:true});}
 if(['latest_articles','case_studies'].includes(type)){if(!items.length)return '';const head=String(a.title||'')===d.title?'':secHead({caps:a.caps||d.site.site_name,title:a.title,description:a.description,action:a.action_url?btn(a.action_url,a.action_label||u(d,'readMore')):''});return section(wrap(head+posts(items,d)),{tight:true});}
 if(type==='statistics')return items.length?section(wrap('<div class="facts">'+items.map(x=>'<div class="fact"><b>'+escape(x.value||x.year||x.title)+'</b><span>'+escape(x.label||x.text||'')+'</span></div>').join('')+'</div>')):'';
 if(type==='timeline')return items.length?section(wrap(secHead({caps:d.site.site_name,title:a.title})+'<ol class="timeline">'+items.map(x=>'<li>'+(x.year?'<span class="yr">'+escape(x.year)+'</span>':'')+'<h3>'+escape(x.title||x.label||'')+'</h3>'+(x.text||x.description?'<p>'+escape(x.text||x.description)+'</p>':'')+'</li>').join('')+'</ol>')):'';
 if(['technical_specs','comparison_table'].includes(type)){const heads=Array.isArray(a.headers)?a.headers:[];return section(wrap(heading(a.title)+'<div class="table-wrap" style="margin-top:2rem"><table class="spec-table spec-table--box">'+(heads.length?'<thead><tr>'+heads.map((h:unknown)=>'<th scope="col">'+escape(h)+'</th>').join('')+'</tr></thead>':'')+'<tbody>'+((a.rows||items) as Row[]).map((r:Row)=>'<tr>'+(Array.isArray(r)?r:[r.name,r.value]).map((v:unknown,i:number)=>i===0?'<th scope="row">'+escape(v)+'</th>':'<td>'+escape(v)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>'));}
 if(type==='faq'){const list=(items.length?items:d.faqs) as Row[];return list.length?section(wrap(h2sec(a.title||t(d,15))+'<div class="faq" style="margin-top:2rem">'+list.map((x:Row)=>'<details><summary>'+escape(x.question)+'</summary><div class="a">'+p(x.answer)+'</div></details>').join('')+'</div>')):'';}
 if(type==='video')return section(wrap(heading(a.title)+'<div class="table-wrap" style="margin-top:1.6rem"><video controls preload="metadata" src="'+escape(safeURL(a.url))+'" '+(a.poster?'poster="'+escape(safeURL(a.poster))+'" ':'')+'style="width:100%">'+escape(a.title)+'</video></div>'));
 if(type==='downloads'){const list=(items.length?items:d.documents) as Row[];return list.length?section(wrap(secHead({caps:d.site.site_name,title:a.title||t(d,13)})+'<div class="rows rows--plain">'+list.map((x:Row)=>'<a class="row" href="'+escape(safeURL(x.media_id?'/api/v1/download/'+x.media_id+'?locale='+d.locale:x.url))+'"><span class="meta"></span><div><h3>'+escape(x.title||x.name)+'</h3></div><span class="go">↓</span></a>').join('')+'</div>')):'';}
 if(type==='testimonials')return items.length?section(wrap('<div class="prose">'+items.map(x=>'<blockquote>'+p(x.quote||x.text)+'<cite>'+escape(x.author||x.name)+'</cite></blockquote>').join('')+'</div>')):'';
 // S1：cta 块的按钮文字/链接/眉标必须来自块数据（否则后台改了前台不认 —— 该缺陷由 .runtime/s1-verify.mjs 抓出）。
 if(type==='cta')return closeBlock(d,a.title||undefined,a.text||undefined,a.label||undefined,a.url||undefined,a.caps||undefined);
 if(type==='contact_form')return '<section id="inquiry" class="section section--tight">'+wrap(secHead({caps:t(d,3),title:a.title||t(d,4),description:a.text})+'<div class="split">'+(d.product?'<div>'+inquiry(d)+'</div>'+inquiryList(d):'<div>'+inquiry(d)+'</div>'+inquiryList(d))+'</div>')+'</section>';
 if(type==='search')return section(wrap('<div class="split"><div>'+secHead({caps:d.site.site_name,title:a.title||t(d,5)})+'<form class="search-form form" data-locale="'+escape(d.locale)+'"><div class="field"><label for="site-search">'+t(d,5)+'</label><input id="site-search" type="search" name="q" maxlength="150" required></div><div class="form-foot"><button class="btn btn-ember" type="submit">'+t(d,5)+'</button></div></form></div><div class="search-results" aria-live="polite"></div></div>'));
 // ── S1 新增块（2026-10-09）：把原先由 homepage() 用代码拼的四块变成可选、可排序、可隐藏的块 ──
 // trust_bar：沿用原 .creds 的 DOM（class 与 .creds-in 结构不变），故 CSS 与既有视觉零改动。
 if(type==='trust_bar'){if(!items.length)return '';return '<section class="creds" aria-label="'+escape(a.title||d.site.site_name||'')+'">'+wrap('<dl class="creds-in">'+items.slice(0,4).map((x:Row)=>'<div class="cred"><dt>'+escape(x.dt||x.label||'')+'</dt><dd>'+escape(x.dd||x.text||x.value||'')+(x.small?' <small>'+escape(x.small)+'</small>':'')+'</dd></div>').join('')+'</dl>')+'</section>';}
 // company_intro：原 .company-intro 段；文案优先取块 data，缺省回落到站点设置的公司简介。
 if(type==='company_intro'){const text=a.text||a.description||d.site.company_description||d.site.footer_description;if(!text)return '';return section(wrap(secHead({caps:a.caps||homeWordsFor(d).intro,title:a.title||homeWordsFor(d).introTitle,description:text})),{cls:'company-intro'});}
 // process_steps：原 .process 段；步骤数不再固定为 3，序号按顺序生成 01..NN。
 if(type==='process_steps'){if(!items.length)return '';return section(wrap('<div class="process"><div class="process-head"><div>'+caps(a.caps||tradeText(d.locale,'process'))+h2sec(a.title||tradeText(d.locale,'processTitle'))+'</div>'+lede(a.description||homeWordsFor(d).collectionText)+'</div><ol class="steps">'+items.map((x:Row,i:number)=>'<li class="step"><span class="idx">'+String(i+1).padStart(2,'0')+'</span><h3>'+escape(x.title||x.text||'')+'</h3></li>').join('')+'</ol></div>'),{tight:true});}
 // market_procurement：市场与采购块（DOM 钩子 [data-trade-public]/[data-trade-cards] 由 trade-public.ts 使用，勿改）。
 // 设为块类型后即可被排序/隐藏（**显式隐藏不会被补回**）；缺席时由 trade-public.ts 的空集循环安全退出。
 // L1 Q2 裁定：「有轮播 ⇒ 必有市场块」与「市场块可隐藏」冲突，故渲染层不再兜底该块。
 if(type==='market_procurement')return tradePublicSection(d);
 // capability：制造能力（S4/G4）。零 DDL、零新表 —— 一个块承载「图 + 文 + 数据 + 能力清单」，
 // 版式原语复用既有 image_text（.split）与 statistics（.facts）的结构；kiln 里没有的组件
 // （.capability / .cap-list）按纪律用附加类写在 kiln-extra，不往 kiln.css 混写。
 if(type==='capability'){
  const stats=(Array.isArray(a.stats)?a.stats:[]).filter((x:Row)=>x&&(x.value||x.label)).slice(0,4);
  const features=items.filter((x:Row)=>x&&(x.title||x.text));
  const media=image(a);
  if(!media&&!a.title&&!a.text&&!stats.length&&!features.length)return '';
  const intro=(media||a.title||a.text)?'<div class="split cap-intro">'+(media?'<div>'+media+'</div>':'')+'<div>'+caps(a.caps)+h2sec(a.title)+lede(a.text||a.description)+(a.url?'<div class="btn-row" style="margin-top:1.6rem">'+btn(a.url,a.label||u(d,'readMore'))+'</div>':'')+'</div></div>':'';
  const facts=stats.length?'<div class="facts">'+stats.map((x:Row)=>'<div class="fact"><b>'+escape(x.value||'')+'</b><span>'+escape(x.label||'')+'</span></div>').join('')+'</div>':'';
  const list=features.length?'<ul class="cap-list">'+features.map((x:Row)=>'<li>'+(x.kicker?'<span class="k">'+escape(x.kicker)+'</span>':'')+'<h3>'+escape(x.title||'')+'</h3>'+(x.text||x.description?'<p>'+escape(x.text||x.description)+'</p>':'')+'</li>').join('')+'</ul>':'';
  return section(wrap(intro+facts+list),{cls:'capability'});
 }
 // certifications：质量与认证（S4/G5）。items 由发布器从 trade_market_cards(kind='certificate')
 // 自动填充（过期 / 已撤回 / 关联页面已变更的卡片**不会**进入 items，见 publisher 的 certificateCards()）。
 // 这里再做一次**渲染期**过滤：静态产物只在「发布 / 重建」时重写，因此"到期不再展示"的生效时刻
 // = 下一次站级刷新（后台「全站重建」，或任一次内容发布都会触发）；渲染期过滤保证"重建即消失"。
 // ⚠️ 仍未做（刻意留到别的切片）：按到期时间自动排一次重建 —— 那需要新增定时机制，不在本切片范围。
 if(type==='certifications'){
  const today=new Date().toISOString().slice(0,10);
  const live=items.filter((x:Row)=>!x.valid_until||String(x.valid_until)>=today);
  if(!live.length)return '';
  return section(wrap(secHead({caps:a.caps||tradeText(d.locale,'certCaps'),title:a.title||tradeText(d.locale,'certTitle'),description:a.description})+'<div class="trade-public-grid">'+live.map((x:Row)=>'<article>'+(x.kind?'<small>'+escape(x.kind)+'</small>':'')+'<h3>'+escape(x.title||'')+'</h3>'+(x.summary?'<p>'+escape(x.summary)+'</p>':'')+(x.valid_until?'<span class="trade-expiry">'+escape(tradeText(d.locale,'marketValid'))+' '+escape(x.valid_until)+'</span>':'')+(x.source_url?'<a href="'+escape(safeURL(x.source_url))+'" rel="noopener noreferrer">'+escape(u(d,'readMore'))+'</a>':'')+'</article>').join('')+'</div>'),{tight:true});
 }
 return section(wrap(heading(a.title)+p(a.text||'')));
}

function menu(d:Document){
 const available=d.menus.filter(x=>['header','main_header','main'].includes(x.location)||x.code==='main_header');
 // 当前栏目标记：kiln 的导航高亮靠 [aria-current="page"]（.nav-links a / .nav-drawer a / .nav-cta .btn），
 // 不输出这个属性那几条规则永远不会命中。判定：精确相等，或当前路由在该栏目路径之下；
  // 语言首页（/en、/zh…）不参与前缀匹配，否则进任何页面都会把「首页」点亮。
 const current=(url:unknown)=>{const href=String(url||'').replace(/\/+$/,'');const route=d.route.replace(/\/+$/,'');if(!href)return '';if(href===route)return ' aria-current="page"';if(/^\/[a-z]{2}(-[a-z]{2})?$/i.test(href))return '';return route.startsWith(href+'/')?' aria-current="page"':'';};
 const flat=(parent:string|null,level=0):string=>level>5?'':available.filter(x=>(x.parent_id||null)===parent).map(m=>'<li'+(level?' class="sub"':'')+'><a '+(m.target==='_blank'?'target="_blank" rel="noopener noreferrer" ':'')+'href="'+escape(safeURL(m.url))+'"'+current(m.url)+'>'+escape(m.label)+'</a>'+(flat(m.id,level+1)?'<ul>'+flat(m.id,level+1)+'</ul>':'')+'</li>').join('');
 const top=(parent:string|null,level=0):string=>level>5?'':available.filter(x=>(x.parent_id||null)===parent).map(m=>'<a '+(m.target==='_blank'?'target="_blank" rel="noopener noreferrer" ':'')+'href="'+escape(safeURL(m.url))+'"'+current(m.url)+'>'+escape(m.label)+'</a>').join('');
 if(available.length)return {links:top(null),drawer:flat(null)};
 const fallback=[{label:t(d,0),url:'/'+d.locale+'/products'},{label:t(d,1),url:'/'+d.locale+'/blog'},{label:t(d,2),url:'/'+d.locale+'/g'},{label:t(d,3),url:'/'+d.locale+'/contact'}];
 return {links:fallback.map(m=>'<a href="'+escape(m.url)+'"'+current(m.url)+'>'+escape(m.label)+'</a>').join(''),drawer:fallback.map(m=>'<li><a href="'+escape(m.url)+'"'+current(m.url)+'>'+escape(m.label)+'</a></li>').join('')};
}
function defaultFooterLinks(d:Document){const title:Record<string,string>={en:'Resources',zh:'资源',de:'Ressourcen',fr:'Ressources',es:'Recursos',it:'Risorse',pt:'Recursos',ja:'リソース',ko:'리소스'};return '<h4>'+escape(title[d.locale]||title.en)+'</h4><ul><li><a href="/'+escape(d.locale)+'/search">'+t(d,5)+'</a></li><li><a href="/'+escape(d.locale)+'/contact#inquiry">'+t(d,4)+'</a></li><li><a href="/'+escape(d.locale)+'/contact">'+t(d,3)+'</a></li></ul>';}
export function schemaFor(d:Document){if(d.schema?.schema_json&&Object.keys(d.schema.schema_json).length)return {...d.schema.schema_json,...d.schema.override_json};const url=new URL(d.route,d.site.primary_domain).href;return {'@context':'https://schema.org','@graph':[
 {'@type':'Organization','@id':d.site.primary_domain+'/#organization',name:d.site.company_name||d.site.site_name,url:d.site.primary_domain},
 d.product?{'@type':'Product',name:d.title,description:d.description,sku:d.product.sku,url,image:d.media.map(m=>new URL(m.url,d.site.primary_domain).href)}:{'@type':['article','guide','case_study'].includes(d.contentType||'')?'Article':'WebPage',headline:d.title,name:d.title,description:d.description,url,dateModified:d.updatedAt,inLanguage:d.locale},
 {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:d.site.site_name,item:new URL('/'+d.locale,d.site.primary_domain).href},{'@type':'ListItem',position:2,name:d.title,item:url}]},
 ...(d.faqs.length?[{'@type':'FAQPage',mainEntity:d.faqs.map(f=>({'@type':'Question',name:f.question,acceptedAnswer:{'@type':'Answer',text:f.answer}}))}]:[])
 ]};}
// 市场与采购块：DOM 钩子（[data-trade-public]/select/[data-trade-cards]/[role=status]）由 trade-public.ts 的 JS 使用，勿改。
function tradePublicSection(d:Document){
 // S6/G7：市场块的文案全部走 9 语言表（原先只有 zh/en 两个变体，其余 7 语言一律回落英文）。
 const w=(key:string)=>tradeText(d.locale,key);
 // 版面：上半「文案 + 目的地选择」左右分栏，卡片网格在**全宽**另起一行
 // （早前版本把网格放在 .split 的右列，三列卡每张只剩约 200px，是错的）。
 const inner='<div class="split"><div>'+caps(w('marketCaps'))+h2sec(w('marketTitle'))
  +'<p class="lede" style="margin-top:1.3rem">'+escape(d.site.company_description||'')+'</p></div>'
  +'<div><div class="field"><label for="trade-market">'+escape(w('marketSelect'))+'</label><select id="trade-market" aria-label="'+escape(w('marketSelect'))+'"><option value="">'+escape(w('marketGeneral'))+'</option>'+countryOptions(d.locale)+'</select></div>'
  +'<div class="trade-entry"><a class="tlink" href="/api/v1/trade-public/portal-page">'+escape(w('marketPortal'))+' ↗</a><a class="tlink" href="/'+escape(d.locale)+'/contact?type=distributor">'+escape(w('marketPartner'))+' ↗</a></div></div></div>'
  +'<div class="trade-public-grid" data-trade-cards style="margin-top:clamp(2rem,4vw,3.2rem)"></div>'
  +'<p role="status" aria-live="polite" style="margin-top:1.2rem"></p>';
 return '<section class="section section--tight trade-section" data-trade-public data-locale="'+escape(d.locale)+'"'
  +' data-empty="'+escape(w('marketEmpty'))+'"'
  +' data-more="'+escape(w('marketMore'))+'" data-valid="'+escape(w('marketValid'))+'"'
  +' data-error="'+escape(w('marketError'))+'">'
  +wrap(inner)+'</section>';
}
// GEO 知识段：短答 + 事实表 + 来源，用 kiln 的 .pd-spec/.rows 承载（结构与语义都对齐模板内页）。
function geoSection(d:Document){
 if(!d.geo.short_answer)return '';
 const facts=(d.geo.facts||[]) as Row[];
 const refs=(d.geo.references||[]) as Row[];
 const left='<div>'+caps(d.geo.entity_name||d.title)+h2sec(tradeText(d.locale,'geoKey'))
  +'<p class="lede" style="margin-top:1.2rem">'+escape(d.geo.short_answer)+'</p>'
  +(d.geo.definition?'<p style="margin-top:1rem;color:var(--ink)">'+escape(d.geo.definition)+'</p>':'')
  +(facts.length?'<ul class="pd-spec" style="margin-top:1.8rem">'+facts.map((f:Row)=>'<li><span>'+escape(f.fact_key)+'</span><span>'+escape(f.fact_value)+'</span></li>').join('')+'</ul>':'')
  +'</div>';
 const right=refs.length?'<div>'+h2sec(t(d,16))+'<div class="rows rows--plain" style="margin-top:1.4rem">'+refs.map((r:Row)=>'<a class="row" href="'+escape(safeURL(r.source_url))+'" rel="noopener noreferrer"><span class="meta"></span><div><h3>'+escape(r.title)+'</h3>'+(r.publisher?'<p>'+escape(r.publisher)+'</p>':'')+'</div><span class="go">↗</span></a>').join('')+'</div></div>':'';
 return section(wrap('<div class="split">'+left+(right||'<div></div>')+'</div>'),{tight:true});
}
export function bodyHTML(d:Document){const home=d.route==='/'+d.locale;const nav=menu(d);const footer=d.menus.filter(m=>m.location==='footer');
 // S6/G7：统计同意条与页脚「统计偏好」的文案走 9 语言表（原先仅 zh/en，其余 7 语言回落英文）。
 const w=(key:string)=>tradeText(d.locale,key);
 // 翻页 cta（publisher 用 cta 块生成上一页/下一页）单独收成 .pager，避免渲染成两个大 CTA 区块。
 // L1 终审 P2 整改：两处旁路都在这里 ——
 //   · arrows 必须取自**过滤后**的可见集合，否则隐藏的箭头仍会生成分页链接；
 //   · hasClosing 必须用**未过滤**的集合判断「是否配置过 cta/contact_form」，
 //     否则隐藏一个普通 cta 后会补出默认结尾区块（与"显式隐藏不得被补回"冲突）。
 const configured=d.body;
 const visible=configured.filter(b=>!isHidden(b));
 const arrows=visible.filter(b=>b.type==='cta'&&['←','→'].includes(String(b.data?.label||'')));
 const content=arrows.length?visible.filter(b=>!arrows.includes(b)):visible;
 // L1 终审（第二轮）P2 整改：产品页原为 `hasClosing = d.product || ...`，`d.product` 短路使得
 // **无论 body 是否配置过 CTA**，产品页都会追加一次默认结尾 —— 显式隐藏的 CTA 因此被补回。
 // 现在统一为「未配置才补」：配置过（哪怕被隐藏）一律不补。这也顺带消除了旧写法在产品页
 // 与 body 里可见 cta 同时存在时**重复渲染两个结尾区块**的隐患。询盘提交逻辑不受影响。
 const closingConfigured=configured.some(b=>b.type==='cta'||b.type==='contact_form');
 const hasClosing=!closingConfigured;
 const crumbsTrail:{label:string;href?:string}[]=d.product?[{label:t(d,0),href:'/'+d.locale+'/products'},{label:d.title}]:[];
 const pageTitle=d.title;
 const pager=arrows.length?'<nav class="pager" aria-label="Pagination">'+arrows.map(x=>{const label=String(x.data?.label);const isNext=label==='→';return '<a href="'+escape(safeURL(x.data?.url))+'" rel="'+(isNext?'next':'prev')+'">'+escape(isNext?u(d,'next'):u(d,'previous'))+'</a>';}).join('')+'</nav>':'';
 return `${'<div data-analytics="'+escape(d.site.ga_measurement_id||'')+'" class="analytics-consent" hidden><p>'+escape(w('analyticsAsk'))+'</p><button type="button" data-analytics-choice="yes">'+escape(w('analyticsAllow'))+'</button><button type="button" data-analytics-choice="no">'+escape(w('analyticsDeny'))+'</button></div>'}<a class="skip-link" href="#content">Skip to content</a><header class="nav" id="nav" data-open="false"><div class="wrap nav-in"><a class="brand" href="/${escape(d.locale)}/"><b>${escape(d.site.site_name||'SUNS')}</b><i>${escape(d.site.site_title||'Boro 3.3')}</i></a><nav class="nav-links" aria-label="Primary">${nav.links}</nav><div class="nav-cta"><details class="language"><summary>${escape(d.locale.toUpperCase())}</summary><ul>${d.alternates.map(l=>`<li><a href="${escape(l.path)}" hreflang="${escape(l.hreflang)}">${escape(l.locale.toUpperCase())}</a></li>`).join('')}</ul></details><a class="btn nav-search" href="/${escape(d.locale)}/search"${d.route==='/'+d.locale+'/search'?' aria-current="page"':''} aria-label="${t(d,5)}"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg></a><a class="btn nav-contact" href="/${escape(d.locale)}/contact"${d.route==='/'+d.locale+'/contact'?' aria-current="page"':''}>${t(d,3)}</a><a class="btn btn-ember" href="/${escape(d.locale)}/contact#inquiry" aria-label="${escape(tradeText(d.locale,'basket'))}">${t(d,4)}<span class="rfq-count" data-rfq-count hidden></span></a><button class="nav-burger" type="button" aria-expanded="false" aria-controls="drawer" aria-label="Open menu"><i></i></button></div></div><div class="nav-drawer" id="drawer"><ul>${nav.drawer}</ul></div></header><main id="content" class="${home?'home-page':''}">${home?hero(d):pageHead({crumbs:crumbs(d,crumbsTrail),caps:labelOf({category:d.product?.category_name})||d.site.site_name,title:pageTitle,description:d.description,split:Boolean(d.product)})}
 ${d.product?productLead(d):''}
 ${home?homepage(d):content.map(b=>block(b,d)).join('')}
 ${pager}
 ${geoSection(d)}
 ${d.faqs.length&&!d.body.some(b=>b.type==='faq')?block({type:'faq',data:{}},d):''}${d.documents.length?block({type:'downloads',data:{}},d):''}${d.related.length?block({type:'product_grid',data:{title:t(d,14),items:d.related}},d):''}${d.product?block({type:'contact_form',data:{title:t(d,4)}},d):''}${hasClosing&&!home?closeBlock(d):''}
 </main><footer><div class="wrap"><div class="foot-in"><div><a class="brand" href="/${escape(d.locale)}/"><b>${escape(d.site.site_name)}</b></a><p class="foot-note">${escape(d.site.footer_description||d.site.company_description||d.heroes[0]?.description||'')}</p></div><div><h4>${t(d,0)}</h4><ul><li><a href="/${escape(d.locale)}/products">${t(d,0)}</a></li><li><a href="/${escape(d.locale)}/blog">${t(d,1)}</a></li></ul></div><div><h4>${t(d,2)}</h4><ul><li><a href="/${escape(d.locale)}/g">${t(d,2)}</a></li><li><a href="/${escape(d.locale)}/contact">${t(d,3)}</a></li></ul></div><div>${footer.length?'<h4>'+escape(t(d,3))+'</h4><ul>'+footer.map(m=>'<li><a href="'+escape(safeURL(m.url))+'">'+escape(m.label)+'</a></li>').join('')+'</ul>':defaultFooterLinks(d)}</div></div><div class="foot-base"><span>${escape(d.site.copyright_text||'© '+new Date().getFullYear()+' '+d.site.site_name)}</span><span>${escape(d.site.company_email||'')}${d.site.company_phone?' · '+escape(d.site.company_phone):''}</span><button class="tlink" type="button" data-trade-privacy>${escape(w('analyticsPrefs'))}</button></div></div></footer>
 ${(()=>{/* 产品页上下文：访客点 WhatsApp 时自动带上"他在看哪个产品 + SKU + 页面 URL"，外贸询盘可直接对货。
     用「产品名 + (SKU: x) + URL」而不是加中英文标签，是为了 9 语言通用、无需再翻 9 份文案（产品名本身已是该语言译文）。
     该后缀同时写进 data-wa-suffix，供 site.js 重建链接时补齐（两条路径必须一致，见浏览器端验收）。 */
  const ctx=d.entityType==='product_translations'&&d.title?'\n'+d.title+(d.product&&d.product.sku?' (SKU: '+d.product.sku+')':'')+'\n'+new URL(d.route,d.site.primary_domain).href:'';
  return d.channels.length?'<details class="service-widget" data-locale="'+escape(d.locale)+'" data-wa-suffix="'+escape(ctx)+'"><summary>'+t(d,3)+' ↗</summary><div>'+d.channels.map(c=>{const cfg=c.config||{};const waPhone=String(cfg.phone||'').replace(/\D/g,'');const prefill=String(c.welcome_text||'').trim().slice(0,300)+ctx;/* 与 packages/domain/src/service.ts 的 channelURL 同逻辑（此处不能 import domain，会把 pg 带进前端包） */const target=c.channel_type==='email'?'mailto:'+cfg.email:c.channel_type==='phone'?'tel:'+cfg.phone:c.channel_type==='whatsapp'?'https://wa.me/'+waPhone+(waPhone&&prefill?'?text='+encodeURIComponent(prefill):''):cfg.url;const external=/^https?:/i.test(String(target||''));return '<a href="'+escape(safeURL(target,'/'+d.locale+'/contact'))+'"'+(external?' target="_blank"':'')+' rel="noopener noreferrer">'+escape(c.name)+'</a>'+(c.welcome_text?'<p>'+escape(c.welcome_text)+'</p>':'');}).join('')+'</div></details>':'';})()}`;}
export function renderHTML(d:Document){const canonical=d.seo.canonical_url||new URL(d.route,d.site.primary_domain).href;const index=d.site.enable_indexing!==false&&d.seo.robots_index!==false;return `<!doctype html><html lang="${escape(d.locale)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(d.seo.meta_title||d.title+' | '+d.site.site_name)}</title><meta name="description" content="${escape(d.seo.meta_description||d.description)}"><meta name="robots" content="${index?'index':'noindex'},${d.seo.robots_follow===false?'nofollow':'follow'}"><link rel="canonical" href="${escape(safeURL(canonical))}">${d.alternates.map(a=>'<link rel="alternate" hreflang="'+escape(a.hreflang)+'" href="'+escape(new URL(a.path,d.site.primary_domain).href)+'">').join('')}<meta property="og:title" content="${escape(d.seo.og_title||d.title)}"><meta property="og:description" content="${escape(d.seo.og_description||d.description)}"><meta property="og:url" content="${escape(canonical)}"><meta property="og:type" content="website"><meta name="theme-color" content="#0D2D47"><meta name="twitter:card" content="summary_large_image">${(d.seo.og_image_url||d.media[0]?.url)?'<meta property="og:image" content="'+escape(new URL(d.seo.og_image_url||d.media[0].url,d.site.primary_domain).href)+'">':''}${d.site.google_site_verification?'<meta name="google-site-verification" content="'+escape(d.site.google_site_verification)+'">':''}${d.alternates.find(a=>a.locale===d.site.default_locale_code)?'<link rel="alternate" hreflang="x-default" href="'+escape(new URL(d.alternates.find(a=>a.locale===d.site.default_locale_code)!.path,d.site.primary_domain).href)+'">':''}<link rel="stylesheet" href="/assets/site.css"><script type="application/ld+json">${JSON.stringify(schemaFor(d)).replaceAll('<','\\u003c')}</script><script src="/assets/site.js" defer></script></head><body>${bodyHTML(d)}</body></html>`;}
export function systemDocument(locale:Row,context:Row,route:string,title:string,body:Block[],items:Row[]=[]):Document{return {route,locale:locale.code,localeId:locale.id,entityType:'system',entityId:locale.id,title,description:'',body,seo:{},geo:{},schema:{},site:context.site,menus:context.menus,heroes:context.heroes,channels:context.channels,faqs:[],media:[],documents:[],related:items,alternates:[],updatedAt:new Date().toISOString()};}
