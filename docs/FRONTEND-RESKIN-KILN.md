# 前台第三次换肤：KILN（窑火）· 2026-10-02

状态：已实施并在本机验收 · 归属：前台视觉迭代（不改功能契约）

前两次见 `FRONTEND-RESKIN.md`（2026-09-26 藏青金）与 `PREMIUM-GLASS-UI.md`（2026-09-26 浅色玻璃）。
本轮与它们**不共用一行 CSS**：旧两轮的主题文件（`premium.ts` / `trade-style.ts`）已退出引用链，
仅在文件头留了「已弃用」标注。

## 1. 背景与来源

用户判定现行公开站视觉不达标（"太丑"），指定用外部重设计产物整体替换：

- 设计源：`H:\Workbuddy\2026-10-02-18-17-59\opctools-redesign\`
- 六套候选方案（01-transmittance / 02-graduation / 03-frosted / **04-kiln** / 05-specsheet / 06-refraction），
  客户选定 **04-kiln（窑火：暗暖底 + 余烬橙 + 宽字距小型大写 + 细线网格）**
- 设计侧同时重建了素材：19 张电商详情页截图 → 白底抠图 / 平场校正成干净产品图

一项关键事实（决定了工作量分配）：**老站"丑"的主因是素材而非排版** —— 原产品图是带「包邮」「发票」
角标与品牌丝印的电商截图，主视觉是一张城市天际线风景照。故本轮是「设计系统 + 素材」两件事一起做。

## 2. 范围

**做**

- 公开站（`static-site/`，9 语言，nginx 直出）**渲染层整体换肤**：`packages/ui/src/index.ts` 的标记结构
  按 kiln 版式重写，CSS 换成 kiln 设计系统
- 行为层合并：原 SUNS 交互（轮播 / 统计同意 / 客服 / 站内搜索 / 询盘篮）与 kiln 的渐进增强
  （导航抽屉 / 分类过滤 / 成品图廊 / 文件控件回显）合到一份 `site.js`
- 19 张重建产品图的入库工具（`infrastructure/scripts/import-redesign-media.mjs`，默认 dry-run）

**不做**

- 不改后台 `/manage` 与 Payload `/admin` 皮肤（内部工具，不属于前台）
- 不改数据契约、不动 block_type 语义、不动发布链路（`publisher` / `worker` 一行未改）
- 不新增 block 类型；不引入新 npm 依赖；不引入外部字体或 CDN（沿用 kiln 的系统字体栈）

## 3. 改动清单

| 文件 | 改动 |
|---|---|
| `packages/ui/src/kiln.css` | **新增**：kiln 设计系统，与设计源 `assets/kiln.css` **逐字一致**（46,993 B，126 个类），只读基线 |
| `packages/ui/src/kiln-extra.css` | **新增**：kiln 之外的 CMS 组件层（24 KB / 106 条选择器）—— 询盘篮、首页轮播、统计同意、客服浮层、市场采购块、站内搜索、分页、语言切换、加询盘反馈、`<picture>` 补偿 |
| `packages/ui/src/styles.ts` | **改为生成物**：由 `scripts/build-css.mjs` 把上面两份 CSS 合成 `siteCSS`（保持"运行时零文件依赖"的既有约定，不引 `node:fs`） |
| `packages/ui/scripts/build-css.mjs` | **新增**：CSS 合成脚本；`package.json` 加 `css:build` |
| `packages/ui/src/index.ts` | 渲染器按 kiln 版式重写（shell / hero / 首页 / 全部 block / 产品页 / 询盘表单 / 页脚 / GEO 段） |
| `packages/ui/src/browser.ts` | 行为层合并 + **修掉 kiln.js 的一个真 bug**（见 §5.1） |
| `packages/ui/src/words.ts` | **新增**：从 index.ts 原样抽出的两张 9 语言文案表（`words` / `homeWords`），内容未改 |
| `packages/ui/src/premium.ts`、`trade-style.ts` | 加「已弃用」标注（不再被引用，未删，便于比对） |
| `infrastructure/scripts/import-redesign-media.mjs` | **新增**：19 张重建产品图入库并挂主图（默认 dry-run） |

**零数据库改动、零迁移**。发布的接口面（`renderHTML` / `bodyHTML` / `systemDocument` / `siteCSS` / `siteJS`
/ `escape` / `safeURL` / `schemaFor`）签名全部不变。

## 4. 视觉系统落地口径

- **类名沿用 kiln 原样**（`.wrap` `.section` `.card` `.grid` `.posts` `.pd` `.form` `.faq` `.creds`
  `.facts` `.rows` `.rail` `.spec-table` …），所以 `kiln.css` 能与设计源逐行对比、不产生"我们的特供版"。
- **`kiln.css` 的保真度是可校验的，且必须校验**：设计源在**外部目录**、随时可能被再次修改。
  本轮就踩到一次 —— 设计源在 `2026-10-02T13:39:50Z` 被改过（新增 4 条「当前栏目标记」规则：
  `.nav-links a[aria-current="page"]::after` 的余烬下划线、`.nav-cta .btn[aria-current="page"]`、
  `.nav-drawer a[aria-current="page"]`，以及 `.nav-links a` 改成 flex 容器），而我最初的 vendor 发生在
  `12:59:55Z` —— 若不复查，仓库里那份会**永久落后于设计源**。
  核对命令：`node .runtime/verify-css-fidelity.mjs`（当前：设计源 sha256 `BF6FA7DD…E35E`，
  与仓库 `kiln.css` **逐字节一致**；线上 `site.css` = `kiln.css` + `kiln-extra.css` 且顺序正确）。
- **`aria-current="page"` 由渲染器输出**：kiln 的导航高亮不是靠 `.active` 类，而是靠这个 ARIA 属性，
  不输出它就永远命中不了那几条规则。判定口径：路径精确相等，或当前路由在该栏目路径之下；
  **语言首页（`/en`、`/zh`…）不参与前缀匹配**，否则进任何页面都会把「首页」点亮。
  实测：`/en/products` → 2 处（主导航 + 抽屉）、`/en/contact` → 3 处（含 `.nav-cta` 的 CONTACT 按钮）、
  首页 0 处（回退菜单里本来就没有 Home 项）。
- **CSS 加载顺序是硬前提**：`kiln-extra.css` 必须排在 `kiln.css` 之后（有 4 处同权重选择器靠顺序取胜：
  `.pager` / `.nav-cta .nav-search` / `.hero--banner h2` / `.home-product-image`）。合成顺序在 `build-css.mjs` 里固定。
- **z-index 是有序列度，不是魔法数**：`60 nav（kiln） < 70 客服浮层 < 72 统计同意条 < 80 跳转链接`。
- **两处对 kiln 的有意覆盖**（写在 `kiln-extra.css` J 节，附理由）：
  1. `.card-art picture,.hero-art picture,…{display:contents}` —— 渲染器输出多档 `avif/webp` 的 `<picture>` 包装，
     多出的盒子会顶替 `img` 成为网格项，导致卡片图按固有宽度（900px）渲染再被裁掉；`display:contents` 让
     kiln 原本针对裸 `<img>` 的规则原样生效。
  2. `.hero-art{aspect-ratio:16/10}` —— kiln 给的是 1/1（配竖构图产品抠图），而 CMS 的 hero 是 16:9 摄影图，
     1/1 会在图上下留一大块空档。换回竖构图素材时删掉这一条即可。

## 5. 兼容性：为什么改了渲染器而测试没改

`tests/render.test.ts` 断言了 6 条 DOM 契约（`hero-visual product-visual`、`class="hero-caption"`、
`class="home-product-image"`、`home-collection`、`data-slide-count`、`data-pause`、每页恰好一个 `<h1>`）。
项目纪律是 **`tests/` 由 L1 产出、L2 只读**，故本轮采取的是**保留钩子**而不是改测试：新标记在原位保留
这些类名（视觉由 `kiln-extra.css` 的同名选择器接管）。结果：`tests/render.test.ts` **6/6 通过，未改一行测试**。

同理保留的还有 `site.js` 依赖的全部运行时钩子（`.inquiry-form` / `[data-rfq-list]` / `[data-rfq-add]` /
`.product-actions` 的紧邻兄弟 / `[data-home-filter]` / `[data-home-products]` / `[data-carousel]` /
`[data-trade-public]` / `.search-form` + `.search-results` / `.service-widget` / `[data-analytics]` / `.file-field`）。
钩子完备性有确定性证据：`.runtime/check-hooks.mjs` 对 90 个渲染产物做「蕴含式」扫描，204 条规则全过。

### 5.1 顺带修掉的上游缺陷（kiln.js 原版）

原版分类过滤写的是 `document.querySelector(group.getAttribute('data-empty')||'')`：没有 `data-empty` 的页面上
会以**空选择器**调用 `querySelector` 抛 `SyntaxError`，中断整个 IIFE —— 官方站 `/products` 正是这个状态，
表现为「过滤按不动、图廊与文件控件也一起失效」。本仓库版本改为先取字符串、非空才查。

## 6. 验收（本机实测，命令 + 输出）

| 检查 | 命令 | 结果 |
| --- | --- | --- |
| 全量类型检查 | `pnpm -r typecheck` | **exit 0**，6/6 工作区 |
| 单元测试 | `pnpm test` | **99 条：97 pass / 0 fail / 2 环境 skip**；`render.test.ts` **6/6** |
| 真实数据渲染 | `.runtime/render-preview.mjs`（走 `siteContext` + `published_documents` 快照，与发布链路同一套逻辑） | **90 个路由**渲染成功，产物在 `.runtime/preview/` |
| 钩子完备性 | `.runtime/check-hooks.mjs` | 90 页 / **204 条蕴含规则全过**；每页 `<h1>` 恰 1 个；90/90 页引用 `/assets/site.css`+`site.js` |
| 视觉比对 | 无头 Chrome 1440 / 500 两种宽度截图（`.runtime/shots/`） | 首页（含 hero / 凭据条 / 产品区 / 流程 / 市场块 / 页脚）、产品详情、分类页、联系页（含询盘表单 + 询盘篮）在 kiln 版式下成型；移动端（500px）单列栈叠正常、无横向溢出 |
| 行为层生效证据 | 同上截图 | 文件控件已回显「No file chosen」、统计同意条已出现、市场块 JS 已发起请求（本地无 API → 显示降级文案），说明 `site.js` 在新标记下**无报错执行** |
| **发布链路端到端**（本轮补） | `.runtime/run-site-publish.mts`：对本地运行时库投一个站级 `rebuild` 任务，直接调 publisher 的 `processPublishJob` | **`{"routes":90,"status":"completed"}`，2.2 秒**；`static-site/` 产出新皮肤：`assets/site.css` 含 `KILN`/`--ember`、**不含**旧皮肤 `.site-header`；`assets/site.js` 含 `data-rfq-list`/`nav-burger`/`data-gallery`；`en/index.html` 含 `nav`/`hero`+`hero-caption`/`home-collection`/`home-product-image`/`creds`/`steps`/`foot-in` 且 `<h1>` 恰 1 个；产品页含 `pd-art`/`pd-spec`/`inquiry-form`/`data-rfq-list` |
| 发布产物 vs 预览渲染 一致性 | 逐文件 SHA-256 对比（`.runtime/preview` ↔ `static-site`） | **89/90 路由逐字节相同**；唯一差异是 `/zh/products/page/2` 的 JSON-LD `dateModified`（发布本身刷新了该时间戳），**非皮肤差异**。同一页面的无头截图**字节完全相同**（`home-full2.png` 与 `pub-home.png` 的 SHA-256 一致） |
| CSS 保真度 | `.runtime/verify-css-fidelity.mjs` | 设计源 `kiln.css` ↔ 仓库 `kiln.css` **逐字节一致**（sha256 `BF6FA7DD…`）；线上 `site.css` 前 48,156 字符 == `kiln.css`、其余 == `kiln-extra.css`；覆盖规则的先后顺序正确（`.hero-art` 基线在 9037、覆盖在 68543） |
| 导航当前栏目标记 | 产物 HTML 扫描 + 截图 | `/en/products` → `aria-current="page"` 2 处（主导航 + 抽屉，截图可见余烬下划线）；`/en/contact` → 3 处（多出 `.nav-cta` 的 CONTACT）；首页 0 处（回退菜单无 Home 项） |



**未取得验证的边界（诚实标注）**

1. **客服浮层本机没有数据**（本地库 `customer_service_channels` 为空）→ 该组件只有代码路径，本机未见真图。
2. **市场采购块的真卡片本机没有数据**（`/api/v1/trade-public/cards` 需 CMS 在跑）→ 只验证了降级路径。
3. **分类过滤与成品图廊本机没有数据**（本地库产品无 category 标签、单图产品）→ 只验证了结构存在，
   交互未实测。
4. 截图比对是**人工目视**，不是像素级 diff（设计源的对照图在 `opctools-redesign/shots/`）。
5. `kiln.css` 体积 47 KB（`site.css` 合计 72 KB / 67 K 字符，未压缩），比旧皮肤（20 KB）大约 3 倍 ——
   **gzip 后量级正常，但尚未在 prod 上量真实传输体积**。

**顺带发现（本地开发产物的既有漂移，非本轮引入）**

本地 `static-site/` 里有 **4 个陈旧文件**（`/zh/products/e12c0b-d9ccb60c`、`e12c1-`、`e12c2-`、`e12sib-`）：
它们**不在 `published_documents` 里**，所以 publisher 的孤儿清扫（E-12）不会退役它们 —— E-12 的判据是
「库里登记过、但实体已删」，而这些文件根本不在库里（应是本地库被重置过、旧产物留在盘上）。
nginx 直出会照常返回 200。prod 侧文档口径是「`static-site/**/index.html` 数 == 已发布行数」，**无此漂移**；
清理方式：直接删这 4 个目录（本机产物，可再生）。


## 7. 回滚

```powershell
git checkout HEAD~1 -- packages/ui/src/index.ts packages/ui/src/styles.ts packages/ui/src/browser.ts
Remove-Item packages/ui/src/kiln.css, packages/ui/src/kiln-extra.css, packages/ui/src/words.ts, packages/ui/scripts/build-css.mjs
```

旧皮肤源码快照另存于 `.runtime/design-backups/2026-10-02T21-47-01-kiln/`（含 README）。
**注意**：静态产物不会自动回滚，需重新发布一次（后台「重建已发布站点」或 `sync-prod.ps1`）才换回旧皮肤。

## 8. 遗留

1. **未上生产**：本轮只动仓库与本地渲染，`static-site/` 与 prod 仍是旧皮肤，需一次全站重建才可见。
2. **19 张重建产品图未入库**：工具已就绪且默认 dry-run（`node infrastructure/scripts/import-redesign-media.mjs`），
   19/19 slug 已对照公网 sitemap 校验通过；真正写库前需确认目标环境与挂图策略（新图升为 `sort_order=0`，
   老图降为附图，不删除任何资产）。
3. **非英语 alt 未翻译**：入库脚本只写英文 alt（设计稿给的就是英文），其余 8 语言由运营在后台补；
   前台在缺失时回退到产品标题。
4. `apps/web`（Next 预览）共用同一渲染器，**未逐页复核**，其 Tailwind `globals.css` 仍是既有的死文件（旧遗留）。
