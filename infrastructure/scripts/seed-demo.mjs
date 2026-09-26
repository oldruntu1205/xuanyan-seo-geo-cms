// 本地演示环境示例数据播种脚本（SUNS SEO/GEO CMS V1.0）
// 用途：为本地演示环境创建一套「明确标注为演示数据」的多语言内容，走真实管理 API（/api/v1/records、/api/v1/publish），
//      因此版本历史、审计、发布任务、静态产物全部与手工操作一致；不直接写 SQL。
// 前置：local-demo.ps1 已把栈拉起；.runtime/demo-admin.txt 存在（首次注册的管理员凭据）。
// 运行：node infrastructure/scripts/seed-demo.mjs
// 幂等：按唯一键（sku / code / product_id+locale_id 等）先查后建，重复执行只会更新，不会重复创建。
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
// 写请求必须带 .env CORS_ORIGINS 中列出的 Origin；本地配置只列 localhost，用 127.0.0.1 会被 checkOrigin 拒绝（403）。
const base=process.env.CMS_BASE||'http://localhost:3001';
const origin=base;
const credentialFile=path.join(root,'.runtime/demo-admin.txt');
if(!fs.existsSync(credentialFile))throw new Error('缺少 .runtime/demo-admin.txt：先运行 infrastructure/scripts/local-demo.ps1 并创建演示管理员');
const credentials=fs.readFileSync(credentialFile,'utf8');
const email=/email: (.+)/.exec(credentials)?.[1]?.trim();
const password=/password: (.+)/.exec(credentials)?.[1]?.trim();
if(!email||!password)throw new Error('.runtime/demo-admin.txt 缺少 email/password');

let token='';
async function api(pathname,{method='GET',body,raw=false}={}){
 const headers={'Content-Type':'application/json',Origin:origin};
 if(token)headers.Authorization='JWT '+token;
 const response=await fetch(base+pathname,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
 const text=await response.text();
 if(raw)return {status:response.status,text};
 const payload=text?JSON.parse(text):{};
 if(!response.ok)throw new Error(method+' '+pathname+' -> '+response.status+' '+text.slice(0,300));
 return payload;
}
async function login(){
 const response=await fetch(base+'/api/cms-admin-users/login',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify({email,password})});
 if(!response.ok)throw new Error('登录失败：'+response.status+' '+await response.text());
 token=(await response.json()).token;
 if(!token)throw new Error('登录响应缺少 token');
}
// 幂等写入：先按 filter 查，命中则 PATCH（含复合主键），否则 POST。返回记录行。
async function ensure(resource,filter,data,keyColumns=['id']){
 const found=await api('/api/v1/records?resource='+resource+'&filter='+encodeURIComponent(JSON.stringify(filter)));
 if(found.rows.length){
  const existing=found.rows[0];
  const key=Object.fromEntries(keyColumns.map(c=>[c,existing[c]]));
  return (await api('/api/v1/records?resource='+resource,{method:'PATCH',body:{key,data}}));
 }
 return api('/api/v1/records?resource='+resource,{method:'POST',body:{data}});
}
async function publish(resource,id,action='publish'){return api('/api/v1/publish',{method:'POST',body:{resource,id,action}});}

const demoLocales=['en','zh'];
const L=(en,zh)=>({en,zh});
const texts={
 about:L('About SUNS Glassware','关于 SUNS 玻璃器皿'),
 aboutExcerpt:L('Company overview, capability scope and material rationale.','公司简介、能力范围与材料说明。'),
 drinkware:L('Drinkware','饮用器皿'),
 storage:L('Storage & Preservation','储物与保鲜'),
};
const aboutBody={
 en:[
  {type:'rich_text',data:{title:'Glassware engineered for repeatable results',html:'<p>This page is <strong>demo content</strong> created for the local SUNS CMS evaluation environment. Replace it with your own copy before any public launch.</p><h2>What we work with</h2><ul><li>Borosilicate 3.3 and soda-lime glass bodies, hand-blown or machine-pressed.</li><li>Capacities from 80&nbsp;ml tumblers to 1&nbsp;500&nbsp;ml carafes and storage jars.</li><li>Lid systems: glass, bamboo, stainless steel and silicone-gasket closures.</li></ul>'}},
  {type:'product_grid',data:{title:'Catalog starting points',description:'The products below are demo records seeded by infrastructure/scripts/seed-demo.mjs.'}},
  {type:'cta',data:{title:'Need a quotation or a sample?',text:'Send the target capacity, closure type and order quantity.',label:'Request a quote',url:'/en/contact'}},
 ],
 zh:[
  {type:'rich_text',data:{title:'为可复现的使用体验而设计的玻璃器皿',html:'<p>本页是本地 SUNS CMS 演示环境的<strong>示例内容</strong>，正式上线前请替换为你自己的文案。</p><h2>我们的材料范围</h2><ul><li>高硼硅 3.3 与钠钙玻璃本体，支持手工吹制或机器压制成型。</li><li>容量覆盖 80&nbsp;毫升水杯到 1&nbsp;500&nbsp;毫升水壶与储物罐。</li><li>盖体方案：玻璃盖、竹盖、不锈钢盖与硅胶密封圈结构。</li></ul>'}},
  {type:'product_grid',data:{title:'产品目录起点',description:'以下产品是由 infrastructure/scripts/seed-demo.mjs 写入的演示记录。'}},
  {type:'cta',data:{title:'需要报价或样品？',text:'请提供目标容量、盖体类型与采购数量。',label:'索取报价',url:'/zh/contact'}},
 ],
};
const products=[
 {sku:'SUNS-DW-240',model:'DW-240',capacity:[240,'ml'],weight:[310,'g'],dims:[85,85,120],
  terms:['drinkware'],
  en:{name:'Double-Wall Borosilicate Tumbler 240 ml',slug:'double-wall-tumbler-240',short:'Two walls, one vacuum gap: hot drinks stay warm, cold drinks stay cold, and the outer surface stays comfortable.',description:'The double-wall body is pressed from borosilicate 3.3 tubing, then annealed to relieve stress before the rim is fire-polished. The vacuum gap removes condensation on the outside and keeps the outer wall close to room temperature.',features:['Borosilicate 3.3 body, thermal-shock resistant','Vacuum gap between inner and outer wall','Fire-polished rim, no sharp edge','Fits standard 240 ml cup holders'],applications:['Hot tea and coffee service','Cold brew and iced drinks','Office and hospitality tables']},
  zh:{name:'双层高硼硅玻璃杯 240 毫升',slug:'shuangceng-gaopenggui-beizi-240',short:'双层结构形成真空隔热层：热饮保温、冷饮保冷，外壁不烫手也不结露。',description:'双层杯体由高硼硅 3.3 玻璃管压制而成，成型后退火消除内应力，杯口再经火抛光处理。中间真空层可避免外壁结露，并使外壁温度接近室温。',features:['高硼硅 3.3 玻璃本体，耐温差冲击','内外壁之间为真空隔热层','杯口火抛光，无锐边','适配标准 240 毫升杯架'],applications:['热茶与咖啡出品','冷萃与冰饮','办公与酒店桌面']}},
 {sku:'SUNS-JR-750',model:'JR-750',capacity:[750,'ml'],weight:[520,'g'],dims:[100,100,160],
  terms:['storage'],
  en:{name:'Airtight Storage Jar 750 ml',slug:'airtight-storage-jar-750',short:'A silicone-gasket clamp lid keeps dry goods sealed while the glass body stays fully transparent.',description:'A borosilicate body paired with a stainless-steel clamp and food-grade silicone gasket. The straight wall lets contents settle evenly and makes the jar easy to clean; the gasket is replaceable without tools.',features:['Replaceable food-grade silicone gasket','Stainless-steel clamp, no plastic hinge','Straight wall for even filling','Freezer and dishwasher safe'],applications:['Dry goods and grains','Coffee and tea storage','Pantry and laboratory samples']},
  zh:{name:'密封储物罐 750 毫升',slug:'mifeng-chuwuguan-750',short:'硅胶密封圈配合卡扣盖，干燥物料保持密封，罐体通透可见内容物。',description:'高硼硅玻璃罐体搭配不锈钢卡扣与食品级硅胶密封圈。直筒壁设计便于物料均匀堆叠，也便于清洗；密封圈免工具即可更换。',features:['食品级硅胶密封圈，可更换','不锈钢卡扣，无塑料铰链','直筒壁设计，装填均匀','可冷冻、可洗碗机清洗'],applications:['干货与谷物','咖啡与茶叶储存','厨房储物与实验室取样']}},
 {sku:'SUNS-TP-500',model:'TP-500',capacity:[500,'ml'],weight:[430,'g'],dims:[120,90,140],
  terms:['drinkware'],
  en:{name:'Glass Teapot with Infuser 500 ml',slug:'glass-teapot-infuser-500',short:'A wide-mouth borosilicate pot with a removable stainless infuser, so leaf expansion is visible and cleaning is simple.',description:'The pot wall is blown from borosilicate 3.3 and the handle is attached with a heat-resistant bond. The infuser lifts out as one piece; the spout is cut and polished to give a clean pour without dripping.',features:['Removable stainless-steel infuser basket','Heat-resistant handle joint','Drip-reduced polished spout','Wide mouth for easy cleaning'],applications:['Loose-leaf tea service','Cold brewing','Tabletop food service']},
  zh:{name:'玻璃茶壶（带滤网）500 毫升',slug:'boli-chahu-lvwang-500',short:'大口径高硼硅壶身配可拆不锈钢滤网，茶叶舒展可见，清洗方便。',description:'壶体由高硼硅 3.3 玻璃吹制，把手采用耐热连接工艺装配。滤网可整体取出；壶嘴经切割与抛光，出水干净不易滴漏。',features:['可整体取出的不锈钢滤网','耐热把手连接工艺','抛光壶嘴，减少滴漏','大口径，便于清洗'],applications:['散茶冲泡','冷泡茶','餐饮桌面出品']}},
];
const faqs=[
 {code:'demo-moq',en:{q:'What is the minimum order quantity for a demo product?',a:'This is seeded demo content: no minimum order quantity is defined. Replace this answer with your own commercial terms.'},
  zh:{q:'演示产品的最小起订量是多少？',a:'本条为播种的演示内容，未定义最小起订量。正式使用时请替换为你自己的商务条款。'}},
 {code:'demo-material',en:{q:'Which glass types are covered by this demo catalog?',a:'Borosilicate 3.3 and soda-lime glass are referenced by the seeded demo products. Confirm the actual specification with your supplier.'},
  zh:{q:'这套演示目录涉及哪些玻璃材质？',a:'播种的演示产品引用了高硼硅 3.3 与钠钙玻璃。实际规格请与供应商确认。'}},
];

async function main(){
 await login();
 const locales=await api('/api/v1/records?resource=locales');
 const localeId=Object.fromEntries(locales.rows.map(r=>[r.code,r.id]));
 for(const code of demoLocales)if(!localeId[code])throw new Error('语言未启用：'+code);
 const taxonomies=await api('/api/v1/records?resource=taxonomies&filter='+encodeURIComponent(JSON.stringify({code:'product_category'})));
 const taxonomyId=taxonomies.rows[0]?.id;
 if(!taxonomyId)throw new Error('缺少 product_category 分类体系');
 const summary={terms:0,products:0,pages:0,faqs:0,published:[]};

 const termIds={};
 for(const [code,termLocale] of [['drinkware',texts.drinkware],['storage',texts.storage]]){
  const term=await ensure('taxonomy_terms',{taxonomy_id:taxonomyId,code},{taxonomy_id:taxonomyId,code,sort_order:code==='drinkware'?1:2,is_enabled:true});
  termIds[code]=term.id;summary.terms++;
  for(const locale of demoLocales){
   const name=termLocale[locale];
   const slug=locale==='en'?code:(code==='drinkware'?'yinyong-qimin':'chucun-baoxian');
   const translation=await ensure('taxonomy_term_translations',{term_id:term.id,locale_id:localeId[locale]},
    {term_id:term.id,locale_id:localeId[locale],name,slug,path:'/'+locale+'/products/'+slug,description:''});
   summary.published.push(await publish('taxonomy_term_translations',translation.id));
  }
 }

 const productIds={};
 for(const product of products){
  const row=await ensure('products',{sku:product.sku},{sku:product.sku,model:product.model,status:'active',brand:'SUNS',material_code:'borosilicate',
   capacity_value:product.capacity[0],capacity_unit:product.capacity[1],weight_value:product.weight[0],weight_unit:product.weight[1],
   dimension_unit:'mm',length_value:product.dims[0],width_value:product.dims[1],height_value:product.dims[2]});
  productIds[product.sku]=row.id;summary.products++;
  for(const code of product.terms)await ensure('product_term_links',{product_id:row.id,term_id:termIds[code]},{product_id:row.id,term_id:termIds[code],is_primary:code===product.terms[0],sort_order:0},['product_id','term_id']);
  for(const locale of demoLocales){
   const content=product[locale];
   const translation=await ensure('product_translations',{product_id:row.id,locale_id:localeId[locale]},
    {product_id:row.id,locale_id:localeId[locale],name:content.name,slug:content.slug,path:'/'+locale+'/products/'+content.slug,
     short_description:content.short,description:content.description,features:content.features,applications:content.applications});
   summary.published.push(await publish('product_translations',translation.id));
  }
 }

 const page=await ensure('content_items',{content_type:'page'},{content_type:'page',status:'draft',sort_order:10});
 summary.pages++;
 for(const locale of demoLocales){
  const translation=await ensure('content_item_translations',{content_item_id:page.id,locale_id:localeId[locale]},
   {content_item_id:page.id,locale_id:localeId[locale],title:texts.about[locale],slug:'about',path:'/'+locale+'/about',
    excerpt:texts.aboutExcerpt[locale],body:aboutBody[locale]});
  for(const faq of faqs){
   const faqRow=await ensure('faq_items',{code:faq.code},{code:faq.code,status:'published',sort_order:1});
   await ensure('faq_item_translations',{faq_id:faqRow.id,locale_id:localeId[locale]},{faq_id:faqRow.id,locale_id:localeId[locale],question:faq[locale].q,answer:faq[locale].a});
   await ensure('content_faq_links',{content_item_id:page.id,faq_id:faqRow.id},{content_item_id:page.id,faq_id:faqRow.id,sort_order:1},['content_item_id','faq_id']);
  }
  summary.published.push(await publish('content_item_translations',translation.id));
 }
 summary.faqs=faqs.length;

 await new Promise(resolve=>setTimeout(resolve,3000));
 await api('/api/v1/publish',{method:'POST',body:{resource:'site'}});
 console.log('已创建/更新：分类 '+summary.terms+' 个，产品 '+summary.products+' 个，页面 '+summary.pages+' 个，FAQ '+summary.faqs+' 条；发布任务 '+summary.published.length+' 个 + 全站重建 1 个。');
 console.log('等待 Worker 产出静态文件后可访问：/'+demoLocales[0]+'/about、/'+demoLocales[0]+'/products、/'+demoLocales[0]+'/products/double-wall-tumbler-240');
}
await main();
