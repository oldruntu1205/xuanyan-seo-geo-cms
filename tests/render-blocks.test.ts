// 首页/内页板块的「显式隐藏」与「未配置」语义 —— 断言由 L1 终审（S1 回执）指定。
//
// 背景（为什么这些断言必须存在）：S1 把首页从「顺序写死」改为「按 body 顺序渲染」后，
// 渲染层出现两类旁路，L1 在终审里点名要求用断言锁住：
//   · 兜底补回：先过滤 hidden、再在过滤后的集合里判断"是否缺少该块"，于是「显式隐藏」
//     被误判成「未配置」，市场块/结尾 CTA 会被重新补出来 —— 直接违背"任何块可隐藏"。
//   · 内页旁路：翻页 CTA 在过滤前被提取，隐藏的箭头仍生成分页链接；普通 CTA 被隐藏后
//     又补出默认结尾区块。
// 本文件只用纯渲染断言（不连数据库）。凡需要数据库的部分（真实旧版实体首页走发布链路、
// 保存→重读→发布、块表全禁用不复活）由 tests/integration.ts 承担，见该文件的同名小节。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderHTML, systemDocument, siteJS } from '../packages/ui/src/index';

type Block = { type: string; data: Record<string, unknown> };
const ctx = () => ({
  site: {
    site_name: 'OPCTools', site_title: 'Industrial glassware', primary_domain: 'https://example.test',
    enable_indexing: false, company_description: 'Borosilicate glassware manufacturer.',
    company_email: 'sales@example.test', company_phone: '+86 555 0000',
  },
  menus: [], heroes: [], channels: [],
});
const locale = { id: 'x', code: 'en' };
const home = (body: Block[]) => renderHTML(systemDocument(locale as never, ctx() as never, '/en', 'Industrial glassware', body as never));
const inner = (body: Block[]) => renderHTML(systemDocument(locale as never, ctx() as never, '/en/about', 'About', body as never));

const market = (extra: Record<string, unknown> = {}): Block => ({ type: 'market_procurement', data: { ...extra } });
const cta = (extra: Record<string, unknown> = {}): Block => ({ type: 'cta', data: { title: 'Talk to us', label: 'Contact our team', url: '/en/contact', ...extra } });
const products = (extra: Record<string, unknown> = {}): Block => ({ type: 'product_grid', data: { title: 'Products', items: [{ title: 'Cup', route: '/en/products/cup', media: [{ url: '/media/cup.png' }] }], ...extra } });
const steps = (): Block => ({ type: 'process_steps', data: { title: 'How we work', items: [{ title: 'Explore' }, { title: 'Share' }, { title: 'Discuss' }] } });

// 板块出现顺序（section 的 class 序列）——用来断言"顺序由数据决定"
const sectionOrder = (html: string) => [...html.matchAll(/<section class="([^"]*)"/g)].map((m) => m[1]);
const countH1 = (html: string) => (html.match(/<h1>/g) || []).length;

test('显式隐藏市场块：内容消失，且不被兜底补回', () => {
  const shown = home([products(), market()]);
  assert.match(shown, /data-trade-public/, '未隐藏时应渲染市场块');
  const hidden = home([products(), market({ hidden: true })]);
  assert.doesNotMatch(hidden, /data-trade-public/, '隐藏后不得出现市场块');
  assert.doesNotMatch(hidden, /data-trade-cards/, '隐藏后不得出现市场卡片容器');
  assert.match(hidden, /home-collection/, '其余板块必须保留');
});

test('显式隐藏 cta：结尾区块消失，且不被兜底补回', () => {
  const shown = home([products(), cta()]);
  assert.match(shown, /class="close"/, '未隐藏时应渲染结尾 CTA');
  const hidden = home([products(), cta({ hidden: true })]);
  assert.doesNotMatch(hidden, /class="close"/, '隐藏后不得补出默认结尾区块');
  assert.doesNotMatch(hidden, /Talk to us/, '隐藏后其文案也不得出现');
  assert.match(hidden, /home-collection/);
});

test('取消隐藏：顺序与内容恢复到与未隐藏时一致', () => {
  const order: Block[] = [products(), market(), steps(), cta()];
  const baseline = sectionOrder(home(order));
  const toggled = sectionOrder(home(order.map((b) => ({ ...b, data: { ...b.data, hidden: true } }))));
  const restored = sectionOrder(home(order.map((b) => ({ ...b, data: { ...b.data, hidden: false } }))));
  assert.deepEqual(restored, baseline, '取消隐藏后顺序应与基线一致');
  assert.notDeepEqual(toggled, baseline, '全部隐藏时不该与基线相同（否则说明隐藏没生效）');
});

test('顺序由数据决定：交换两个块，输出顺序随之改变', () => {
  // 用标记定位而不是 section class：product_grid 与 process_steps 都是 section--tight，
  // 用 class 找会命中同一个（该断言最初就是这么写错的）。
  const a = home([products(), steps(), cta()]);
  const b = home([steps(), products(), cta()]);
  assert.ok(a.indexOf('home-collection') < a.indexOf('class="process"'), '产品区应在流程之前');
  assert.ok(b.indexOf('class="process"') < b.indexOf('home-collection'), '交换后流程应在产品区之前');
});

test('市场块缺席：不产生该板块，且浏览器脚本仍可解析（缺元素的空集循环）', () => {
  const html = home([products(), cta()]);
  assert.doesNotMatch(html, /data-trade-public/);
  assert.doesNotThrow(() => new Function(siteJS), 'site.js 必须始终可解析');
  // trade-public.ts 以 querySelectorAll('[data-trade-public]:not([data-ready])') 起手：
  // 元素缺席时循环体不执行 ⇒ 不会抛错。真正的"无异常"由 L3 用无头浏览器复验。
});

test('内页隐藏普通 cta：不出现替代结尾区块', () => {
  const shown = inner([{ type: 'rich_text', data: { title: 'Body', text: 'hello' } }, cta()]);
  assert.match(shown, /class="close"/);
  const hidden = inner([{ type: 'rich_text', data: { title: 'Body', text: 'hello' } }, cta({ hidden: true })]);
  assert.doesNotMatch(hidden, /class="close"/, '内页同样不得补出默认结尾');
});

test('内页隐藏翻页 cta：分页链接随之消失', () => {
  const prev: Block = { type: 'cta', data: { title: 'Previous page', label: '←', url: '/en/products' } };
  const next: Block = { type: 'cta', data: { title: 'Next page', label: '→', url: '/en/products/page/3' } };
  const both = inner([products(), prev, next]);
  assert.match(both, /class="pager"/);
  assert.match(both, /href="\/en\/products"/);
  assert.match(both, /href="\/en\/products\/page\/3"/);
  const oneHidden = inner([products(), prev, { ...next, data: { ...next.data, hidden: true } }]);
  assert.match(oneHidden, /class="pager"/, '还剩一个箭头时分页区仍在');
  assert.match(oneHidden, /href="\/en\/products"/);
  assert.doesNotMatch(oneHidden, /page\/3/, '被隐藏的箭头不得生成链接');
  const allHidden = inner([products(), { ...prev, data: { ...prev.data, hidden: true } }, { ...next, data: { ...next.data, hidden: true } }]);
  assert.doesNotMatch(allHidden, /class="pager"/, '全部隐藏后分页区应消失');
});

test('data.hidden 仅在严格 true 时生效（缺省/非布尔一律视为未隐藏）', () => {
  for (const value of [undefined, null, false, 0, '', 'true', 1]) {
    const html = home([products(), market(value === undefined ? {} : { hidden: value })]);
    assert.match(html, /data-trade-public/, `hidden=${JSON.stringify(value)} 不应被当作隐藏`);
  }
  assert.doesNotMatch(home([products(), market({ hidden: true })]), /data-trade-public/);
});

test('回归：九语言各恰好一个 h1，空列表不渲染空板块，安全链接与自定义按钮文案生效', () => {
  const codes = ['en', 'zh', 'de', 'fr', 'es', 'it', 'pt', 'ja', 'ko'];
  for (const code of codes) {
    const doc = systemDocument({ id: 'x', code } as never, ctx() as never, '/' + code, 'Title', [products(), market(), cta()] as never);
    const html = renderHTML(doc);
    assert.equal(countH1(html), 1, `${code}: 必须恰好 1 个 h1`);
    assert.match(html, /data-trade-public/, `${code}: 市场块应渲染`);
  }
  const empty = home([{ type: 'product_grid', data: { title: 'Empty', items: [] } }, { type: 'case_studies', data: { title: 'Cases', items: [] } }, cta()]);
  assert.doesNotMatch(empty, /home-collection/, '空产品列表不应渲染产品区外壳');
  assert.doesNotMatch(empty, /Cases/, '空案例列表不应渲染该板块');
  const unsafe = home([cta({ url: 'javascript:alert(1)', label: 'X' })]);
  assert.ok(!unsafe.includes('javascript:'), '危险链接必须被 safeURL 中和');
  const custom = home([{ type: 'cta', data: { title: 'Custom title', label: 'Custom label', url: '/en/custom', caps: 'CUSTOM CAPS' } }]);
  assert.match(custom, /Custom title/);
  assert.match(custom, /Custom label/);
  assert.match(custom, /href="\/en\/custom"/);
  assert.match(custom, /CUSTOM CAPS/);
});
