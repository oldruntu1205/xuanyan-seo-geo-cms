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
5. **体积实测（gzip 后）**：`site.css` 73,714 B → **20,402 B**（3.6x），`site.js` 17,826 B → **6,151 B**，
   `en/index.html` 26,683 B → **6,982 B**。旧皮肤 `site.css` 未压缩即 19,873 B（约 6 KB gzip）⇒
   **换肤让 CSS 传输量净增约 14 KB**（约 3.4 倍）。这是一个有意付出的代价（设计系统 126 个类 + 组件层），
   但仍**未在 prod 上量过真实首屏**（含媒体图，图片才是大头）。若要压：先按 nginx 已开的 gzip 观察，
   再考虑把 kiln 段拆成"首屏必需 + 其余延迟加载"，**不建议手工压缩本文件**（会失去与设计源的逐行可比性）。

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

## 8. 上生产记录（2026-10-02 22:00，用户授权后执行）

| 步骤 | 命令 | 结果 |
| --- | --- | --- |
| 前端部署 | `pwsh -File _deploy/sync-prod.ps1 -KeyPath ~/.ssh/id_ed25519` | 构建 exit 0；包 21.2 MB / 2208 文件（自检无 `.env`、无源码 `node_modules`）；迁移 001–029 全 applied 且**无新增**；`pm2 delete/start suns-cms suns-worker` 两进程 online、restarts 0；备份 `_backup_20261002_215728`；公网 7/8 通过 |
| （其中 `/manage`） | 部署脚本内置验收 | 首次 **000**（超时）→ 复测 **200 / 2.1s、再测 1.2s** ⇒ 是 PM2 重启后首请求预热的瞬时现象，**不是回归** |
| 全站重建 | `bash /root/rebuild-prod-site.sh`（先备份 static-site 到 `/root/suns-backups/static-site_20261002_215818.tar.gz`，3.4 MB） | 任务 `de349f68…` **completed，约 45 秒**；`static-site` 页面数 **3053 = 库里已发布文档数 3053**（零漂移）；`site.css` **73,714 字节，与本机产物同尺寸** |
| 产物切换证据 | 产物级 grep | `site.css`：`KILN` 命中 2、`--ember` 命中 26、旧皮肤 `.site-header` **归零**；`site.js`：`nav-burger`/`data-rfq-list`/`data-gallery` 齐备；`en/index.html`：`class="nav" id="nav"`/`class="creds"`/`class="foot-in"`/`home-collection` 各 1、旧皮肤标记 0、`<h1>` 恰 1 |
| 公网验收 | `bash /root/verify-prod-kiln.sh`（KILN 专项，26 条断言） | **PASS=26 FAIL=0**：CSS/JS 资源标记、9 语言首页全套标记（HTTP 200 + nav/creds/foot-in + 旧皮肤 0 + h1=1）、产品列表当前栏目高亮、产品页 `pd-art`/`pd-lead`/询盘篮、联系页 kiln 表单与文件控件、旧 `nav-toggle` 已消失 |
| 公网目视 | 无头 Chrome 截图（`.runtime/shots/live-home.png`、`live-product.png`） | 首页 8 个版式区块、产品页图廊 5 张缩略图 + 询盘表单 + 询盘篮，**均按 kiln 版式成型** |
| 询盘 API 契约回归 | prod `bash /root/verify-prod-v31.sh`（项目既有脚本，自清理） | **全 PASS**：提交 **201**（`RFQ-20261002-B7737803`）、`preferred_incoterm/specification_notes/target_delivery_on/inquiry_type` 四列落库正确、附件 bytea 与声明大小一致、未登录下载附件 **401**、同 key 幂等（行数 1）、非法 incoterm **400 而非 500**、蜜罐 **200 静默丢弃且建单 0**、测试数据清理干净（inquiries 0 / attachments 0） |
| 生产页 JS 真实执行 | 无头 Chrome `--dump-dom`（跑完 JS 后的 DOM） | 生产产品页出现 **6 处 `data-ready="1"`**，其中 `<div class="bd" data-rfq-list … data-ready="1">`、`<div class="file-field" data-ready="1">`、`<div data-analytics class="analytics-consent" data-ready="1">` 三处分别证明**询盘篮 / kiln 文件控件 / 统计同意**三个模块已执行；`data-carousel` 在产品页为 0（只有首页有轮播，符合预期）⇒ 新标记下 `site.js` 无报错执行 |

### 8.1 上生产后被数值探针抓出的真缺陷：卡片图被放大裁切（2026-10-02 已修复并重新部署）

**症状**（生产公网）：产品列表/首页/分类页的卡片图被放大约 **2.4 倍**并切掉四边内容 ——
电商摄影截图上的中文角标、文字被裁（`.runtime/shots/live-products.png` 为修复前）。

**根因**（不是 `<picture>` 包装层 —— 那层 `display:contents` 早已生效、实测 picture 是 0×0）：
kiln 的 `.card-art / .home-product-image / .pd-art / .thumbs button` 都写成
`aspect-ratio + display:grid + place-items:center` 却**没有声明列/行**，那条 **auto 轨道**由内容的
max-content 决定：图片固有宽 800/1200 把轨道撑开，于是 `img{width:66%}` 解析成「轨道宽 × 66%」
= **528**（实测），而卡片本体只有 430，超出部分被 `overflow:hidden` 裁掉。
kiln 原版不暴露是因为它的素材是「透明底 + 产品居中」的抠图，放大裁切后主体仍在；
换成满幅电商摄影就会切掉内容。

**修法**（不动 66%/72% 观感参数，只把基准拉回容器）：
1. 四处容器加 `grid-template-columns:{columns,rows}:minmax(0,1fr)`；
2. `.home-product-image picture` 由「grid 铺满」改回 `display:contents` —— 那种写法让 picture 自己成为
   **嵌套 grid**，内层 auto 轨道又按固有宽撑开（实测 792 = 1200×0.66），外层轨道修复管不到；
3. `.pd-art img / .thumbs button img` 加 `max-width/height:100%` 兜底。

**证据**

| 检查 | 修复前 | 修复后 |
| --- | --- | --- |
| `.home-product-image img`（容器 430） | 792（=1200×0.66） | **284（=430×0.66）fit** |
| `.card-art img`（容器 430） | 528（=800×0.66） | **284 fit** |
| `.pd-art img`（容器 623，kiln 用 72%） | — | **447（=623×0.72）fit** |
| 卡片图落位探针（`.runtime/run-card-probe.mjs`） | — | **PROD VERDICT clean，30/30** |
| 生产内容溢出探针（8 页 × 5 宽度） | OVERFLOW 10/40（报警元素全部是被放大的卡片图） | **clean，35/35，且再无任何元素越界** |
| **宽覆盖复核**（修复后铺开，9 语言） | — | **溢出探针 19 页 × 5 宽度 = 95 组合 clean**（9 语言首页、en/de/ja 列表页、en 产品详情、en/de/ja 联系页、en/zh 博客、en 搜索页）；**卡片图探针 91 张全部 fit/ratio-ok**（9 语言首页 `.home-product-image`、3 语言列表页 `.card-art` 各 24 张、产品详情 `.pd-art` 447=623×0.72、`natural=800` 证明确实是已加载的真图） |
| 目视 | `.runtime/shots/live-products.png`（满幅放大） | `.runtime/shots/live-products-fixed2.png`（284/430，左右留暗边） |

**流程教训（值得记）**
1. **本地演示图看不出这个缺陷**：本地素材是「产品居中」的演示图，放大裁切后主体仍在；
   生产素材是满幅电商截图，切掉的是文字与角标。⇒ **版式类缺陷必须在生产内容上验，不能只验本地**。
2. **数值探针先报了我「想当成假阳性」的结论**：辅助判据（逐元素最右）报了 10 处，我一度按
   设计侧「祖先裁剪会假阳性」的经验准备放过 —— 拉出元素与裁剪祖先链、再对上截图才发现是真缺陷。
   ⇒ **假阳性的判据是「元素是否真的伸出内容区」，不是「有没有被裁剪」**；被 `overflow:hidden` 裁剪
   只能说明症状被藏住，不能说明没问题。
3. **取证时踩了自己的坑**：核验线上 CSS 时读到的是几小时前为「部署前基线」存下的那份文件
   （里面还是旧皮肤规则），差点据此得出"线上 CSS 没有修复"的错误结论。
   ⇒ 取线上资产一律**新取到新文件名**，不要复用早前为别的目的存下的副本。
4. 部署脚本内嵌公网验收再次出现 **000 瞬时项**（这次是 `/en`，上次是 `/manage`），复测即 200
   —— **PM2 重启后首请求预热**，判据是「复测两次 + 其它端点同批 200」。



### 8.2 图片入库链路：本地端到端首验（2026-10-02，生产待授权）

这条链路的「按 slug 找产品 → 挂主图」分支在此前**从未真正执行过**（本地库没有那 19 个 slug、生产还没跑）。
本轮起了本地 CMS（`pnpm --filter @suns/cms dev` + `.runtime/connection.json` 的 `DATABASE_URL`，health 200），
造一个 `slug=latex-rubber-gloves` 的探针产品，然后真跑：

| 检查 | 结果 |
| --- | --- |
| `--apply --only latex-rubber-gloves` | upload **900×900** → 8 条变体行 + 9 个文件落盘 → en alt「Latex rubber gloves」→ `product_media(main, sort_order=0)` → `products.featured_media_id` 指向新图 |
| 链条逐环核验（`.runtime/check-import-chain.mjs`） | **PASS=15 / FAIL=0**（资产行、宽高、sha256、主文件大小==file_size、8 条变体、变体文件全落盘、variant_name 规范、alt、featured、挂图行、行数） |
| 幂等 | 复跑同一条：**复用 1 / 新挂 0**，同名资产仍 1 行、变体总数不翻倍 |
| 回滚（本轮新增 `--revert`） | 摘主图 + 把当时被 +1 的行减回 + 清 `featured_media_id` + 软删资产；核验 **PASS=5 / FAIL=0**；两轮「导入→回滚」循环均可重复 |
| 写入前安全门 | `--precheck` 只读预检（19 个 slug 能否解析到产品 + `en` 语言可读性）；`--apply` 默认先跑预检，**有未命中就在写任何数据之前中止**（要跳过须显式 `--force`）。实测拦停后库里零变化 |

**两个上生产才会炸的点（已修/已写进脚本头）**

1. **`Origin` 必须落在 `CORS_ORIGINS` 白名单里**。`.env` 写的是 `http://localhost:3001`，
   用 `--cms-base http://127.0.0.1:3001` 上传直接 **403「请求来源未获许可」**（登录能过、上传被拒，极易误判）。
   ⇒ 打生产建议 **`CMS_BASE=https://www.opctools.cloud` 直连**（公网可达，**不需要 SSH 隧道**）；
   走隧道则本地地址必须与白名单**逐字符一致**。脚本遇到 403 会直接打印这条提示。
2. **变体档位不是"4 个宽度"**：`media_variants.width` 记的是**实际输出宽度**，源图 900px 时 1280/1920 两档
   按 `withoutEnlargement` 都输出 900 ⇒ 8 行 / **3 个不同宽度**。（我的第一版断言按"4 个宽度"写，假红了一次。）

配套取证脚本（都在 `.runtime/`，不进 git）：`probe-import-target.mjs`（造/清探针产品）、
`check-import-chain.mjs`（15 条链条断言）、`check-import-revert.mjs`（5 条回滚断言）、
`cleanup-import-probe.mjs`（按 object_key 前缀清残留行与文件）。**探针已彻底清场**：
本地库回到导入前（同名资产 0 行、变体 216 行、alt 38 行），`media/` 无残留文件。

**验收脚本自身的一个夹具缺陷（已修，值得记）**：v1 用 `set -o pipefail` + `echo "$大字符串" | grep -q 模式`，
`grep -q` 命中即退出会让 `echo` 收到 SIGPIPE，管线状态变成 141 ⇒ **文件里明明存在的模式被判成 no**
（命中位置越靠前越容易触发：`KILN` 在文件头，于是三个"存在性"断言全假红）。
一律改成文件级 `grep -c -- 模式 文件`，不给管道留机会。**这是"验收脚本假红"这一类问题的通用形态。**

### 8.3 图片入库：生产执行记录（2026-10-09，用户授权后执行）

**前置复核**（距上次已 6 天）：生产健康 200；设计源 19 张 clean 图仍在；只读预检 `slug 命中 19/19`、
`en 语言可读=yes`、`Origin` 被生产接受、**零写入**。

| 步骤 | 结果 |
| --- | --- |
| 金丝雀 `--only latex-rubber-gloves --publish` | 上传 `redesign-gloves.png` → `e4283098`（900²）；老图 5 行降为附图；8 个语言版本重发；站级重建入队 |
| 金丝雀公网确认 | `/en/ /de/ /it/products/latex-rubber-gloves` 均含新图 `c8206e38`；主图位实测 `<div class="pd-art" id="stage"><img src="/media/c8206e38….png" alt="Latex rubber gloves" fetchpriority="high">` |
| 全量入库 `--apply` | **上传 17 · 复用 2 · 新挂主图 18**（复用 = 金丝雀的 gloves + 一次网络中断后重跑时已在库的 reactor-open ⇒ 幂等生效） |
| 全量发布 `--apply --publish` | **上传 0 · 复用 19 · 新挂 0**；19 × 8 语言版本重发 + 站级重建 |
| 发布队列 | **162 个任务全 completed、0 failed**；站级重建 4 分钟内跑完（按 `static_routes.checksum` 只重写内容变了的 **328 页**，全站仍 3053 页） |
| **端到端验收** `.runtime/verify-import-prod.mjs` | **PASS=209 / FAIL=0**（19 条 × 11 项）：资产 900² / 变体 8 / en alt / 挂图 main+sort_order=0 / `featured_media_id` / 老图降级未删除 / 新图 `/media/…` HTTP 200 / **公网 en+de+ja 三语言页面都含新图** |

**两个过程坑（值得记）**

1. **Node 的 `fetch` 默认走本机 Clash 代理**（环境里 `HTTPS_PROXY=http://127.0.0.1:7897` +
   `NODE_USE_ENV_PROXY=1`）。小请求（预检、单张小图）能过，**大图上传会被对端掐断**
   （`UND_ERR_SOCKET: other side closed`，socket 指向 `127.0.0.1:7897`）。
   ⇒ 打生产批量上传前先清掉 `http_proxy/HTTPS_PROXY/NODE_USE_ENV_PROXY`（直连实测 health 200 / 0.375s）。
   脚本幂等，中断重跑不产生重复资产（实测已入库的那张走 `reuse` 分支）。
2. **判据写错会造成假红**：页面 URL 用的是媒体的 **`object_key`**（`/media/<uuid>.png|jpg`），不是资产 **id**。
   我一开始用"资产 id 是否出现在页面里"当判据，得到"新图 0 处"的错误结论，**差点把正确的链路判成故障**。
   正确判据：先取 `object_key`，再核页面。

**素材观感说明**：19 张全部是 RGBA 带透明通道（实测 PNG `color type=6`）。列表页上棉签袋、吸头盒等
**看着像"浅色底块"的其实是产品本体**（浅色物体落在深色卡片上），与设计稿模板渲染一致，不是抠图残留。

**生产侧观察（供后续排查参考）**：站级重建期间 worker 单进程 RSS 涨到 606MB（`suns-worker` 的
`max_memory_restart` 阈值 367MB 却未触发重启），`free` 显示 1963MB 里已用 1842MB；重启 worker 后降到 ~30MB。

## 9. 上生产后暴露的**内容**缺口（代码与皮肤都没问题，但站还"没做完"）

换肤把版式问题解决了，剩下的观感问题全部来自**内容字段为空**。公网实测证据：

1. **产品图仍是电商详情页截图**：产品页主图带「包邮」「13% 增值税发票 专业定制 破損包赔」角标与品牌丝印
   —— 这正是本轮重设计已经重建、但**尚未入库**的那 19 张图。工具与映射已就绪（见 §8.2 与脚本头部 runbook）。
2. **品牌名是 CMS 默认值**：导航字标、页脚、hero 说明位都是「玄砚·企业智慧营销CMS系统」，
   而重设计采用的站点字标是 **OPCTOOLS**（域名派生）。`site_settings` / `site_setting_translations` 需人工填。
3. **首页 hero 是演示种子内容**：标题「你好，标题」、正文「说明文字说明文字…」、配图是**纽约城市天际线**
   —— 重设计的诊断里就点名了这张风景照，它至今还在线上。
4. **产品结构化字段全空**：prod 库 `products.min_order_quantity` 有值 **0 行**、`lead_time_days` **0 行**、
   `product_spec_values` **0 行** ⇒ kiln 的 `.pd-spec`（起订量/交期/包装/定制/样品/应用）与
   `.spec-table`（规格表）**在所有产品页都不渲染**。⚠️ 这**不是换肤回归**：部署前备份的旧皮肤同一页面
   同样 grep 不到 `sourcing-facts`（=0），两版都空。这是既有的内容欠账，但换肤后它更显眼
   （重设计稿里每页都有规格表）。
5. 市场采购块无卡片（`/api/v1/trade-public/cards` 无数据）、流程步骤无描述文案（本就没有）、
   联系邮箱是 `655673@qq.com`（非企业域名）。

## 10. 遗留

1. ~~未上生产~~ → **已上生产（2026-10-02 22:00），见 §8**。prod `static-site/` 3053 页已全部是新皮肤。
   回滚 = `/root/suns-backups/static-site_20261002_215818.tar.gz` 解回 + `_backup_20261002_215728` 的 `.next`。
2. **19 张重建产品图未入库**（本轮用户只授权了部署）：**链路已本地端到端验过（见 §8.2，链条 15/15、幂等、回滚 5/5）**，
   工具已就绪并带写入前安全门（`--precheck` / `--only` 金丝雀 / `--force` / `--revert`），
   19/19 slug 已对照公网 sitemap 校验通过。策略：新图升为 `sort_order=0`、老图降为附图、**不删任何资产**。
   执行口径（一条命令，无需隧道）：`$env:CMS_BASE='https://www.opctools.cloud'` + 管理员凭据。
   ⚠️ 这是当前"看起来还没做完"的**头号原因**（见 §9 第 1 条）。
3. **非英语 alt 未翻译**：入库脚本只写英文 alt（设计稿给的就是英文），其余 8 语言由运营在后台补；
   前台在缺失时回退到产品标题。
4. `apps/web`（Next 预览）共用同一渲染器，**未逐页复核**，其 Tailwind `globals.css` 仍是既有的死文件（旧遗留）。
5. **品牌与首页内容仍是 CMS 默认/种子值**（见 §9 第 2、3 条）—— 这部分只能由业务侧填，代码侧无动作。

