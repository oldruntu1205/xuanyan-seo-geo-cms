// S3/G2 分类主图 —— 渲染与卡片形状的**版本化**断言（L1 终审 2026-10-09 指定）。
//
// 为什么需要这个文件：`.runtime/s3-verify.mjs` 的渲染断言只是**本轮证据**，不能是唯一回归保护。
// 需要数据库的部分（装配 SQL、当前语言 ALT、缺译文、软删除、SET NULL、产品图库优先、发布快照）
// 在 `tests/integration.ts` 的 A23–A28；本文件只做纯渲染与纯函数断言（不连数据库），
// 与 `tests/render-blocks.test.ts` 同一体例。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderHTML, systemDocument } from '../packages/ui/src/index';
import { autoBlockItems } from '../packages/publisher/src/index';

type Row = Record<string, any>;

const ctx = () => ({
  site: {
    site_name: 'OPCTools', site_title: 'Industrial glassware', primary_domain: 'https://example.test',
    enable_indexing: false, company_description: 'x', company_email: 'a@example.test', company_phone: '+86 555',
  },
  menus: [], heroes: [], channels: [],
});
const locale = { id: 'x', code: 'en' };

// 形状 = documents.ts 装配出的**分类译文快照**：media[0] = media_assets 行 + 当前语言 alt_text + url/variants
const snapshot = (media: Row[]): Row => ({
  route: '/en/s3-verify/glass-reactor', locale: 'en', localeId: 'l', entityType: 'taxonomy_term_translations',
  entityId: 't', groupId: 'g', title: 'Glass reactor', description: 'd', body: [], seo: {}, geo: {}, schema: {},
  media, documents: [], related: [], faqs: [],
  alternates: [{ path: '/en/s3-verify/glass-reactor', locale: 'en', hreflang: 'en' }], updatedAt: '2026-10-09T00:00:00.000Z',
});
const image = (extra: Row = {}): Row => ({ id: 'm1', url: '/media/s3-verify/a%20shot.png', object_key: 's3-verify/a shot.png', storage_provider: 'local', width: 800, height: 600, alt_text: '分类主图 EN ALT', variants: [], ...extra });
const page = (items: Row[]) => renderHTML(systemDocument(locale as never, ctx() as never, '/en/categories', 'Categories', [{ type: 'category_grid', data: { title: 'Categories', items } }] as never));

test('分类主图：有图时渲染 <img>，ALT 用当前语言的图片描述（不是标题兜底）', () => {
  const html = page([{ route: '/en/s3-verify/glass-reactor', title: 'Glass reactor', media: [image()] }]);
  assert.match(html, /src="\/media\/s3-verify\/a%20shot\.png"/, '分类卡必须渲染出分类主图');
  assert.match(html, /alt="分类主图 EN ALT"/, 'ALT 必须来自当前语言的图片描述');
  assert.doesNotMatch(html, /card--plot/, '有图时不得走占位');
});

test('分类主图：无图时走占位且不产生空 src（不断图）', () => {
  const html = page([{ route: '/en/s3-verify/no-image', title: 'No image', media: [] }]);
  assert.match(html, /card--plot/, '无图必须走占位');
  assert.match(html, /class="plot"/, '占位文案必须存在');
  assert.doesNotMatch(html, /src=""/, '不得渲染空 src');
});

test('分类主图：经发布快照进入自动分类卡（publisher 的 cardOf 形状），并一路渲成 <img>', () => {
  const items = autoBlockItems('category_grid', '/xx', [], [], [snapshot([image()])] as never) as Row[];
  assert.equal(items?.[0]?.route, '/en/s3-verify/glass-reactor', '卡片路由必须来自分类快照');
  assert.equal(items?.[0]?.title, 'Glass reactor', '卡片标题必须来自分类快照');
  assert.equal((items?.[0]?.media as Row[])?.[0]?.url, '/media/s3-verify/a%20shot.png', '卡片必须带上分类主图');
  const html = page(items);
  assert.match(html, /src="\/media\/s3-verify\/a%20shot\.png"/, '快照 → items → HTML 全链路必须出图');
});

test('分类主图：自身路由被排除（分类页不把自己列进自己的分类列表）', () => {
  const items = autoBlockItems('category_grid', '/en/s3-verify/glass-reactor', [], [], [snapshot([image()])] as never);
  assert.deepEqual(items, [], '分类页列自身时必须排除');
});
