// 本地演示环境·产品示意图生成与上传（SUNS SEO/GEO CMS V1.0）
// 用途：生成本地演示用的矢量风格产品示意图（不是实拍图），走真实媒体上传接口入库，挂到演示产品并重新发布。
// 前置：local-demo.ps1 已把栈拉起；.runtime/demo-admin.txt 存在；.runtime/shots 之外的临时文件写到 .runtime/demo-media。
// 运行：node infrastructure/scripts/seed-demo-media.mjs            生成 + 上传 + 挂图 + 发布
//       node infrastructure/scripts/seed-demo-media.mjs --generate-only   只生成 PNG，不上传
//       CHROME_PATH=... CMS_BASE=... node infrastructure/scripts/seed-demo-media.mjs
// 幂等：先软删除上一次同名演示资产并摘掉产品挂图，再重新上传，不会在媒体库堆积重复资产。
// 依赖：本机 Chrome/Edge（无头截图用），不新增 npm 依赖。二进制 PNG 不入版本库，按需生成。
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const staging=path.join(root,'.runtime/demo-media');
const credentialFile=path.join(root,'.runtime/demo-admin.txt');
const base=(process.env.CMS_BASE||'http://localhost:3001').replace(/\/$/,'');
const origin=base;
const generateOnly=process.argv.includes('--generate-only');

const ink='#183c33',accent='#d0e875';
const frame=(art)=>`<!doctype html><html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1200px;height:1200px;background:transparent;overflow:hidden;position:relative}
svg{position:absolute;inset:0;width:1200px;height:1200px}
</style></head><body>
<svg viewBox="0 0 1200 1200" fill="none" xmlns="http://www.w3.org/2000/svg">
 <defs>
  <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#e4ece2"/><stop offset="1" stop-color="#cbd8cb"/></linearGradient>
  <linearGradient id="liquid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${accent}" stop-opacity=".55"/><stop offset="1" stop-color="${accent}" stop-opacity=".18"/></linearGradient>
 </defs>
 <g transform="translate(600,600) scale(1.45) translate(-410,-410)">${art}</g>
</svg></body></html>`;

// 画稿保持在中央安全区：前台卡片用 .card img{aspect-ratio:4/3;object-fit:cover}，正方形图上下各裁 12.5%
const artwork={tumbler:`
  <ellipse cx="410" cy="716" rx="215" ry="30" fill="${ink}" opacity=".10"/>
  <path d="M285 190h250v430a125 30 0 0 1-250 0z" fill="url(#glass)" stroke="${ink}" stroke-width="6"/>
  <path d="M313 190h194v420a97 24 0 0 1-194 0z" fill="#ffffff" opacity=".55" stroke="${ink}" stroke-width="4" stroke-opacity=".45"/>
  <ellipse cx="410" cy="190" rx="125" ry="30" fill="#ffffff" stroke="${ink}" stroke-width="6"/>
  <ellipse cx="410" cy="190" rx="97" ry="23" fill="url(#liquid)" stroke="${ink}" stroke-width="3" stroke-opacity=".5"/>
  <path d="M330 300c-18 60-18 180 0 250" stroke="${accent}" stroke-width="8" stroke-linecap="round" opacity=".9"/>
  <path d="M498 320c14 50 14 150 0 210" stroke="#ffffff" stroke-width="10" stroke-linecap="round" opacity=".8"/>`,
jar:`
  <ellipse cx="410" cy="706" rx="200" ry="28" fill="${ink}" opacity=".10"/>
  <rect x="275" y="470" width="270" height="220" rx="26" fill="url(#glass)" stroke="${ink}" stroke-width="6"/>
  <rect x="296" y="492" width="228" height="176" rx="18" fill="url(#liquid)" stroke="${ink}" stroke-width="3" stroke-opacity=".45"/>
  <rect x="292" y="418" width="236" height="60" rx="14" fill="#ffffff" stroke="${ink}" stroke-width="6"/>
  <rect x="316" y="404" width="188" height="20" rx="10" fill="#d5dccf" stroke="${ink}" stroke-width="4"/>
  <path d="M520 448h74a16 16 0 0 1 16 16v28a16 16 0 0 1-16 16h-74" fill="none" stroke="${ink}" stroke-width="8" stroke-linecap="round"/>
  <path d="M275 560h270" stroke="${accent}" stroke-width="8" opacity=".85"/>`,
teapot:`
  <ellipse cx="410" cy="726" rx="215" ry="30" fill="${ink}" opacity=".10"/>
  <path d="M300 640c-40-90-24-190 40-236 60-42 151-42 211 0 64 46 80 146 40 236-22 50-70 78-146 78s-123-28-145-78z" fill="url(#glass)" stroke="${ink}" stroke-width="6"/>
  <path d="M340 660c-26-70-16-146 26-182 44-32 108-32 148 0 42 36 52 112 26 182" fill="url(#liquid)" stroke="${ink}" stroke-width="3" stroke-opacity=".4"/>
  <path d="M330 430c40-34 132-34 172 0 14 12 16 30 4 44H326c-12-14-10-32 4-44z" fill="#ffffff" stroke="${ink}" stroke-width="6"/>
  <circle cx="416" cy="418" r="20" fill="${accent}" stroke="${ink}" stroke-width="5"/>
  <path d="M596 520c56 6 92 40 100 92" fill="none" stroke="${ink}" stroke-width="10" stroke-linecap="round"/>
  <path d="M262 520c-56 6-92 44-98 96" fill="none" stroke="${ink}" stroke-width="14" stroke-linecap="round"/>`};

const plan=[
 {sku:'SUNS-DW-240',png:'img-tumbler.png',art:artwork.tumbler,alt:{en:'Double-wall borosilicate tumbler, 240 ml, illustration',zh:'双层高硼硅玻璃杯 240 毫升示意图'}},
 {sku:'SUNS-JR-750',png:'img-storage-jar.png',art:artwork.jar,alt:{en:'Airtight glass storage jar with clamp lid, 750 ml, illustration',zh:'卡扣密封玻璃储物罐 750 毫升示意图'}},
 {sku:'SUNS-TP-500',png:'img-teapot.png',art:artwork.teapot,alt:{en:'Glass teapot with removable stainless infuser, 500 ml, illustration',zh:'带可拆不锈钢滤网的玻璃茶壶 500 毫升示意图'}},
];

function findBrowser(){
 if(process.env.CHROME_PATH)return process.env.CHROME_PATH;
 const candidates=['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Google/Chrome/Application/chrome.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'];
 const found=candidates.find(p=>fs.existsSync(p));
 if(!found)throw new Error('找不到 Chrome/Edge：请设 CHROME_PATH 环境变量指向浏览器可执行文件');
 return found;
}
function generate(){
 const chrome=findBrowser();
 fs.mkdirSync(staging,{recursive:true});
 for(const item of plan){
  const html=path.join(staging,item.png.replace('.png','.html'));
  fs.writeFileSync(html,frame(item.art));
  const shot=path.join(staging,item.png);
  const result=spawnSync(chrome,['--headless=new','--disable-gpu','--hide-scrollbars','--no-first-run','--no-default-browser-check','--default-background-color=00000000',
   '--user-data-dir='+path.join(staging,'chrome-profile'),'--virtual-time-budget=4000','--window-size=1200,1200','--screenshot='+shot,'file:///'+html.replaceAll('\\','/')],{stdio:'ignore'});
  if(result.status!==0||!fs.existsSync(shot))throw new Error('生成失败：'+item.png+'（浏览器退出码 '+result.status+'）');
  console.log('generated',item.png,fs.statSync(shot).size+' bytes');
 }
}

async function main(){
 generate();
 console.log('示意图输出目录：'+staging);
 if(generateOnly){console.log('--generate-only：跳过上传。');return;}
 if(!fs.existsSync(credentialFile))throw new Error('缺少 .runtime/demo-admin.txt（或用 CMS_EMAIL/CMS_PASSWORD 环境变量）');
 const credentials=fs.readFileSync(credentialFile,'utf8');
 const email=process.env.CMS_EMAIL||/email: (.+)/.exec(credentials)?.[1]?.trim();
 const password=process.env.CMS_PASSWORD||/password: (.+)/.exec(credentials)?.[1]?.trim();
 if(!email||!password)throw new Error('缺少管理员凭据');
 const login=await fetch(base+'/api/cms-admin-users/login',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify({email,password})});
 if(!login.ok)throw new Error('登录失败：'+login.status+' '+await login.text());
 const token=(await login.json()).token;
 const headers={Origin:origin,Authorization:'JWT '+token};
 const api=async(pathname,{method='GET',body}={})=>{
  const response=await fetch(base+pathname,{method,headers:{...headers,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
  const text=await response.text();
  if(!response.ok)throw new Error(method+' '+pathname+' -> '+response.status+' '+text.slice(0,300));
  return text?JSON.parse(text):{};
 };
 const locales=Object.fromEntries((await api('/api/v1/records?resource=locales')).rows.map(r=>[r.code,r.id]));
 const demoNames=new Set(plan.map(p=>p.png));
 // 幂等：清掉上一次上传的同名演示资产（软删除资产 + 摘掉产品挂图），避免媒体库堆积重复项
 for(const asset of (await api('/api/v1/records?resource=media_assets&limit=100')).rows.filter(r=>demoNames.has(r.original_filename))){
  for(const link of (await api('/api/v1/records?resource=product_media&filter='+encodeURIComponent(JSON.stringify({media_id:asset.id})))).rows)
   await api('/api/v1/records?resource=product_media',{method:'DELETE',body:{key:{id:link.id}}});
  await api('/api/v1/records?resource=media_assets',{method:'DELETE',body:{key:{id:asset.id}}});
  console.log('cleaned previous asset',asset.original_filename,String(asset.id).slice(0,8));
 }
 for(const item of plan){
  const bytes=fs.readFileSync(path.join(staging,item.png));
  const form=new FormData();
  form.append('file',new Blob([bytes],{type:'image/png'}),item.png);
  const upload=await fetch(base+'/api/v1/upload',{method:'POST',headers,body:form});
  const text=await upload.text();
  if(!upload.ok)throw new Error('upload '+item.png+' -> '+upload.status+' '+text.slice(0,300));
  const media=JSON.parse(text);
  console.log('uploaded',item.png,'->',String(media.id).slice(0,8),media.object_key,media.width+'x'+media.height);
  for(const [code,localeId] of Object.entries(locales)){
   if(!item.alt[code])continue;
   const existing=await api('/api/v1/records?resource=media_asset_translations&filter='+encodeURIComponent(JSON.stringify({media_id:media.id,locale_id:localeId})));
   if(existing.rows.length)await api('/api/v1/records?resource=media_asset_translations',{method:'PATCH',body:{key:{id:existing.rows[0].id},data:{alt_text:item.alt[code]}}});
   else await api('/api/v1/records?resource=media_asset_translations',{method:'POST',body:{data:{media_id:media.id,locale_id:localeId,alt_text:item.alt[code]}}});
  }
  const product=(await api('/api/v1/records?resource=products&filter='+encodeURIComponent(JSON.stringify({sku:item.sku})))).rows[0];
  if(!product)throw new Error('找不到产品 '+item.sku+'（先运行 seed-demo.mjs）');
  const link=await api('/api/v1/records?resource=product_media&filter='+encodeURIComponent(JSON.stringify({product_id:product.id,media_id:media.id,media_role:'main'})));
  if(!link.rows.length)await api('/api/v1/records?resource=product_media',{method:'POST',body:{data:{product_id:product.id,media_id:media.id,media_role:'main',sort_order:0}}});
  await api('/api/v1/records?resource=products',{method:'PATCH',body:{key:{id:product.id},data:{featured_media_id:media.id}}});
  const translations=await api('/api/v1/records?resource=product_translations&filter='+encodeURIComponent(JSON.stringify({product_id:product.id})));
  for(const row of translations.rows)await api('/api/v1/publish',{method:'POST',body:{resource:'product_translations',id:row.id,action:'publish'}});
  console.log('linked',item.sku,'-> main image; published',translations.rows.length,'translations');
 }
 await new Promise(resolve=>setTimeout(resolve,4000));
 await api('/api/v1/publish',{method:'POST',body:{resource:'site'}});
 console.log('全站重建已提交；等待 Worker 产出静态文件后查看 http://localhost:3000'+'/'+(locales.zh?'zh':'en')+'/products');
}
await main();
