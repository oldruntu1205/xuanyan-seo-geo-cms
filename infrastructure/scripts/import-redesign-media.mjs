// 把 2026-10-02 重设计（04-kiln）重建过的产品抠图导入媒体库，并按 slug 挂到线上产品的主图位。
//
// 为什么需要它：老站「丑」的主因是素材而非配色 —— 线上产品图是电商详情页截图（带「包邮」「发票」角标与
// 品牌丝印）。重设计侧用白底抠图 + 平场校正重做了一批干净图（19 张，见 opctools-redesign/assets/clean）。
// 本脚本把「设计稿里哪张图属于哪个产品」这件事从模板 HTML 里**推导**出来（不手抄），再走真实上传接口入库。
//
// 用法（默认 dry-run，只打印计划，不写库、不传文件）：
//   node infrastructure/scripts/import-redesign-media.mjs                      # 推导映射 + 对照公网 sitemap 校验
//   node infrastructure/scripts/import-redesign-media.mjs --apply              # 真正上传 + 挂图 + 设 featured_media_id
//   node infrastructure/scripts/import-redesign-media.mjs --apply --publish    # 追加：逐个产品重新发布 + 站级重建
//   --source <dir>   重设计目录（默认 H:/Workbuddy/2026-10-02-18-17-59/opctools-redesign）
//   --cms-base <url> CMS 基址（默认 env CMS_BASE 或 http://localhost:3001）
//   --live <sitemap-url> 对照用的公网产品 sitemap（默认 https://www.opctools.cloud/sitemap-en-products-1.xml）
//
// 前置（仅 --apply 需要）：管理员凭据在 .runtime/demo-admin.txt，或用 CMS_EMAIL / CMS_PASSWORD 环境变量。
//
// 幂等：以 original_filename = `redesign-<源文件名>` 作唯一键。重复运行会复用已存在的资产（不重复上传），
// 挂图用 UNIQUE(product_id,media_id,media_role) 兜底。不会删除任何既有资产或既有挂图。
//
// 只做三件写操作，都可逆：
//   ① 新增 media_assets / media_variants（走 /api/v1/upload，sharp 自动出 4 档 avif+webp）
//   ② 新增 product_media（media_role='main', sort_order=0），并把该产品**已有的** product_media 行 sort_order +1
//      （把老的主图降为附图，而不是删掉；要还原就把 sort_order 减回去）
//   ③ products.featured_media_id 指向新图
//
// 边界（不要越界）：不做图片裁切/调色（素材已由设计侧处理完）；不做产品文案改编；不碰其它产品的图片。
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const value = (name, fallback) => { const i = args.indexOf('--' + name); if (i < 0) return fallback; const v = args[i + 1]; return v && !v.startsWith('--') ? v : fallback; };
const has = (name) => args.includes('--' + name);
const source = value('source', 'H:/Workbuddy/2026-10-02-18-17-59/opctools-redesign');
const base = (process.env.CMS_BASE || value('cms-base', 'http://localhost:3001')).replace(/\/$/, '');
const origin = base;
const liveSitemap = value('live', 'https://www.opctools.cloud/sitemap-en-products-1.xml');
const apply = has('apply');
const publish = has('publish');
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '../..');
const credentialFile = path.join(root, '.runtime/demo-admin.txt');

// ── 1. 从设计稿推导映射：products 列表页的卡片 = 产品主图，唯一权威来源 ──────────────
function readCards() {
  const file = path.join(source, 'en/products/index.html');
  if (!fs.existsSync(file)) throw new Error('找不到重设计产品列表页：' + file);
  const html = fs.readFileSync(file, 'utf8');
  const rows = [...html.matchAll(/<a class="card[^"]*" href="\/en\/products\/([^/"]+)\/"[^>]*>\s*<div class="card-art"><img src="\/assets\/(clean|clean-tight)\/([^"]+)"[^>]*alt="([^"]*)"/g)];
  const map = new Map();
  for (const [, slug, dir, img, alt] of rows) {
    if (map.has(slug)) continue;
    const file = path.join(source, 'assets', dir, img);
    if (!fs.existsSync(file)) throw new Error('设计稿引用的图片不存在：' + file);
    map.set(slug, { slug, dir, img, alt, file, bytes: fs.statSync(file).size });
  }
  return map;
}

// ── 2. 对照公网 sitemap 校验（只读公开数据，不需要凭据）───────────────────────────
async function liveProducts() {
  try {
    const response = await fetch(liveSitemap, { signal: AbortSignal.timeout(20000) });
    if (!response.ok) return { ok: false, reason: 'HTTP ' + response.status, set: new Set() };
    const xml = await response.text();
    return { ok: true, set: new Set([...xml.matchAll(/<loc>[^<]*\/en\/products\/([^<]+)<\/loc>/g)].map((m) => m[1])) };
  } catch (error) {
    return { ok: false, reason: error.message, set: new Set() };
  }
}

async function login() {
  if (!fs.existsSync(credentialFile) && !(process.env.CMS_EMAIL && process.env.CMS_PASSWORD)) throw new Error('缺少管理员凭据：.runtime/demo-admin.txt 或 CMS_EMAIL/CMS_PASSWORD');
  let email = process.env.CMS_EMAIL, password = process.env.CMS_PASSWORD;
  if (!email || !password) {
    const text = fs.readFileSync(credentialFile, 'utf8');
    email = email || (/email: (.+)/.exec(text)?.[1] || '').trim();
    password = password || (/password: (.+)/.exec(text)?.[1] || '').trim();
  }
  if (!email || !password) throw new Error('管理员凭据不完整');
  const response = await fetch(base + '/api/cms-admin-users/login', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify({ email, password }) });
  if (!response.ok) throw new Error('登录失败：' + response.status + ' ' + (await response.text()).slice(0, 200));
  return (await response.json()).token;
}

function api(token) {
  const headers = { Origin: origin, Authorization: 'JWT ' + token };
  return async (pathname, { method = 'GET', body } = {}) => {
    const response = await fetch(base + pathname, { method, headers: { ...headers, ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
    const text = await response.text();
    if (!response.ok) throw new Error(method + ' ' + pathname + ' -> ' + response.status + ' ' + text.slice(0, 300));
    return text ? JSON.parse(text) : {};
  };
}

const recordQuery = (resource, filter, extra = '') => '/api/v1/records?resource=' + resource + (filter ? '&filter=' + encodeURIComponent(JSON.stringify(filter)) : '') + extra;

async function main() {
  const cards = readCards();
  const live = await liveProducts();
  console.log('设计稿产品卡：' + cards.size + ' 个；图片目录：' + path.join(source, 'assets'));
  console.log('公网 sitemap：' + (live.ok ? live.set.size + ' 个产品' : '取不到（' + live.reason + '），跳过对照'));
  const missing = [...cards.keys()].filter((slug) => live.ok && !live.set.has(slug));
  if (missing.length) console.log('⚠ 线上找不到的 slug（' + missing.length + '）：' + missing.join(', '));
  const uploadable = [...cards.values()].filter((x) => x.dir === 'clean');
  console.log('待上传图片：' + uploadable.length + ' 张（clean/ 900² 统一画布；clean-tight/ 是给 hero 用的保比例版，产品主图不用）');
  for (const item of uploadable) console.log('  ' + item.slug.padEnd(72) + ' <- ' + item.img + '  ' + Math.round(item.bytes / 1024) + ' KB');
  if (!apply) { console.log('\n[dry-run] 未写任何数据。确认无误后加 --apply 执行。'); return; }

  const token = await login();
  const call = api(token);
  let uploaded = 0, reused = 0, linked = 0;
  for (const item of uploadable) {
    const filename = 'redesign-' + item.img;
    const existing = (await call(recordQuery('media_assets', { original_filename: filename }, '&limit=1'))).rows[0];
    let media = existing;
    if (media) { reused++; console.log('reuse   ' + filename + ' -> ' + String(media.id).slice(0, 8)); }
    else {
      const form = new FormData();
      form.append('file', new Blob([fs.readFileSync(item.file)], { type: 'image/png' }), filename);
      const response = await fetch(base + '/api/v1/upload', { method: 'POST', headers: { Origin: origin, Authorization: 'JWT ' + token }, body: form });
      const text = await response.text();
      if (!response.ok) throw new Error('上传失败 ' + filename + ' -> ' + response.status + ' ' + text.slice(0, 200));
      media = JSON.parse(text); uploaded++;
      console.log('upload  ' + filename + ' -> ' + String(media.id).slice(0, 8) + ' ' + media.width + 'x' + media.height);
      // alt 只写英文：设计稿的 alt 是英文；其它语言由运营在后台补，前台在缺失时回退到产品标题（见 packages/ui/src/index.ts 的 image()）。
      const en = (await call(recordQuery('locales', { code: 'en' }, '&limit=1'))).rows[0];
      if (en && item.alt) await call('/api/v1/records?resource=media_asset_translations', { method: 'POST', body: { data: { media_id: media.id, locale_id: en.id, alt_text: item.alt } } });
    }
    const translations = (await call(recordQuery('product_translations', { slug: item.slug }))).rows;
    if (!translations.length) { console.log('  ⚠ 库里没有 slug=' + item.slug + ' 的产品，跳过挂图'); continue; }
    const productId = translations[0].product_id;
    const links = (await call(recordQuery('product_media', { product_id: productId }))).rows;
    if (links.some((row) => row.media_id === media.id)) console.log('  = 已挂过，跳过');
    else {
      for (const row of links) await call('/api/v1/records?resource=product_media', { method: 'PATCH', body: { key: { id: row.id }, data: { sort_order: Number(row.sort_order || 0) + 1 } } });
      await call('/api/v1/records?resource=product_media', { method: 'POST', body: { data: { product_id: productId, media_id: media.id, media_role: 'main', sort_order: 0 } } });
      await call('/api/v1/records?resource=products', { method: 'PATCH', body: { key: { id: productId }, data: { featured_media_id: media.id } } });
      linked++;
      console.log('  + 主图已挂上（原 ' + links.length + ' 行 sort_order 已 +1）');
    }
    if (publish) {
      for (const row of translations) await call('/api/v1/publish', { method: 'POST', body: { resource: 'product_translations', id: row.id, action: 'publish' } });
      console.log('  ↑ 已提交 ' + translations.length + ' 个语言版本的重新发布');
    }
  }
  console.log('\n完成：上传 ' + uploaded + ' · 复用 ' + reused + ' · 新挂主图 ' + linked);
  if (publish) { await new Promise((resolve) => setTimeout(resolve, 4000)); await call('/api/v1/publish', { method: 'POST', body: { resource: 'site' } }); console.log('站级重建已提交。'); }
  else console.log('提示：没有提交发布。前台要看到新图，需要重新发布这些产品（或加 --publish）。');
}

await main();
