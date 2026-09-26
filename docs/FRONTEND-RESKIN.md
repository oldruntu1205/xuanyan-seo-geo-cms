# 前台视觉改版（Marketing Reskin）

状态：已实施 · 日期：2026-09-26 · 归属：V1.0 之后的前台视觉迭代（不在冻结的 V1.0 功能范围内）

## 1. 背景与目标

原前台是「深绿网格底 + 极简技术风」。本次按 JupiterX / Surveyor 一类**传统企业营销站**的版式语言做整体换肤：
照片驱动的全屏 Hero、结构化区块头、卡片化内容、深色统计与 CTA 通栏、深色多栏页脚。

参考站：<https://jupiterx.artbees.net/surveyor/>（Artbees 的 JupiterX 商业 WordPress 主题 demo）。
**仅参考版式结构与设计语言**，不使用其任何 HTML / CSS / 图片 / 字体 / 文案。

## 2. 范围

**做**

- 前台视觉系统整体替换（配色、字体、层级、间距、圆角、阴影、交互态）
- 渲染器结构的最小增强：`banner` 区块改为媒体 + 文案两栏；顶栏增加联系电话
- 网格卡片支持**内置图标集**（`items[].icon`），实现参考站那种「图标服务网格」
- 中文排版独立参数（字号 / 行高 / 字距）
- 演示用横幅图接入媒体库并挂到 `hero_slides`（中英双语）

**不做**

- 不新增 block 类型（`newsletter` 订阅需新后端端点，已排除）
- 不做多主题 / 可切换皮肤（本次是硬替换，不是 token 主题层）
- 不改后台 `/manage` 与 Payload `/admin` 皮肤（内部工具，不属于前台）
- 不动数据契约、不动 block_type 语义、不动发布链路
- 不清理 `apps/web/src/app/globals.css`（Tailwind，全仓无人 import，属死文件；列为遗留项）

## 3. 改动清单

| 文件 | 改动 |
|---|---|
| `packages/ui/src/styles.ts` | 整份 CSS 重写（新增设计 token、版式规则、交互态、中文覆盖、`.header-phone` / `.banner` / `.banner-media` / `.banner-copy` / `.card-icon`） |
| `packages/ui/src/index.ts` | ① `block()` 的 `hero/hero_banner/hero_slider` 分支改为 `banner-media` + `banner-copy` 两栏；② `bodyHTML()` 顶栏 `header-tools` 增加 `company_phone` 电话链接；③ 新增内置图标集 `icons` 与 `iconSVG()`，`cards()` 渲染 `item.icon` |

**零数据库改动**：`content_blocks.block_type` 是 `text NOT NULL` 且无 CHECK 约束；`site_settings.company_phone` 与 `hero_slides.overlay_opacity / text_position / duration_ms / desktop_media_id` 均已存在。

> 与仓库既有的「单行极简」写法不同，本次 `styles.ts` 采用**一行一条规则**的可读格式。原因：换肤后样式表体积约为原来的 2 倍，单行巨型字符串会显著抬高后续维护成本。功能上无差异。

## 4. 视觉系统

### 4.1 设计 token（`:root`）

| 变量 | 值 | 用途 |
|---|---|---|
| `--ink` | `#0d1b2a` | 正文 |
| `--ink-soft` | `#243a52` | 正文（浅底次级） |
| `--paper` | `#ffffff` | 主背景 |
| `--surface` | `#f2f5f8` | 交替区块底 |
| `--surface-2` | `#e7edf4` | 图片占位底 |
| `--line` | `#dde4ec` | 描边 |
| `--brand` | `#10365e` | 主色 |
| `--brand-700` | `#0b2745` | 深色区块底（统计 / CTA） |
| `--brand-900` | `#071628` | 最深底（Hero 兜底 / 页脚 / 页面标题） |
| `--accent` | `#c8963e` | 强调色（按钮底、装饰线） |
| `--accent-600` | `#a97c2b` | 按钮 hover |
| `--accent-ink` | `#86611d` | **文字用**强调色（浅底上的小字） |
| `--accent-tint` | `#faf4e8` | 强调色浅底 |
| `--muted` | `#5a6b7f` | 次要文字 |

配色主题为「深藏青 + 琥珀金」：B2B 工程/制造行业的经典组合，与参考站「深色照片 + 暖色 CTA」的结构一致但色相不同（参考站为品牌橙）。琥珀亦与硼硅玻璃的常见色相符。

**文字色分两个变量**是刻意的：`--accent`（`#c8963e`）在浅底上做小字对比度不足，浅底文字必须用 `--accent-ink`。

### 4.2 字体

- 正文/标题：`'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, 'Microsoft YaHei', 'PingFang SC', 'Noto Sans SC', sans-serif`
- 标识（`.wordmark`）与页脚站名保留 `Georgia, serif` 作为企业识别
- 标题由原来的 serif 改为**粗无衬线**，贴合参考站观感
- 图标使用 Unicode 字符（`☎` `↗` `→` `↓`）与内置内联 SVG，**无外部字体 / 图标 CDN 依赖**

### 4.4 内置图标集

网格类区块（`product_grid` / `category_grid` / `application_grid` / `case_studies` / `latest_articles` / `feature_grid`）的每个 `items[]` 项可加 `icon` 字段，渲染为卡片顶部的图标方块；**不带 `icon` 时自动回退为原来的序号**（`01` `02` …），因此对既有内容完全向后兼容。

数据里存的是**图标名**（如 `flask`），不是 SVG 片段、也不是图片 URL。这是刻意的安全选择：`items` 是 jsonb，若能塞裸 SVG 就等于给内容编辑开了注入口子；存名字由渲染器映射到内置的 18 个线性图标，样式统一且无法注入。

可用名字（18 个，24×24 viewBox，stroke 风格，`currentColor`）：

| | | | | | |
|---|---|---|---|---|---|
| `flask` | `factory` | `flame` | `shield` | `ruler` | `truck` |
| `globe` | `leaf` | `sliders` | `layers` | `check` | `clock` |
| `box` | `chat` | `chart` | `thermometer` | `award` | `droplet` |

用法（区块 `data.items[]`）：

```json
{ "icon": "flask", "title": "Laboratory ware", "description": "Beakers, cylinders…", "url": "/en/products" }
```

名字拼错时静默回退为序号，不会渲染空白。对照表见 `.runtime/shots/reskin/icons.png`（由 `.runtime/reskin-preview.mjs` 的 `icons.html` 生成）。

样式：`.card-icon` 为 52×52 的 `--accent-tint` 方块 + `--accent-ink` 图标（对比度 5.12:1）。

### 4.3 中文排版（关键）

静态快照由 `renderHTML()` 输出 `<html lang="zh">`，因此可用 `html[lang=zh]` 做语言级覆盖：

- `letter-spacing: 0`（中文不吃英文的负字距）
- 标题 `line-height: 1.35`（英文为 1.14）
- `p, li` 行高 `1.9`
- 标题字号整体降一档（中文同字号视觉更大）

## 5. 演示素材与授权

图片经 Openverse 检索 Wikimedia Commons，全部为**可商用**许可，且**刻意排除了 Share-Alike（CC BY-SA）**：

| 本地文件 | 原始作品 | 作者 | 许可 | 来源 |
|---|---|---|---|---|
| `hero-1-glassworks-1920.jpg` | Trélon Interior of glass factories in Atelier Musée du Verre | Pierre André Leclercq | CC BY 4.0 | [curid=179333428](https://commons.wikimedia.org/w/index.php?curid=179333428) |
| `hero-2-glassblowing-1920.jpg` | Glassblowing Workshop, University for the Creative Arts (Farnham Campus), Surrey — 2025-09 | Mertbiol | **CC0 1.0** | [curid=174928472](https://commons.wikimedia.org/w/index.php?curid=174928472) |
| `hero-3-lab-glassware-1920.jpg` | Laboratory Glassware | Michael Pereckas | CC BY 2.0 | [curid=18369414](https://commons.wikimedia.org/w/index.php?curid=18369414) |
| `banner-equipment-1920.jpg` | Equipment and glassware | Belikov Maxim | CC BY 4.0 | [curid=113354324](https://commons.wikimedia.org/w/index.php?curid=113354324) |

CC BY 要求署名：上线正式环境时**必须在站点保留署名**（建议放页脚或「图片来源」页），或替换为自有实拍图后移除。
CC0 无署名义务。

图片以 1920px 宽度接入；未单独上传移动端版本 —— 媒体管线会自动生成 1920/1280/768/480 × AVIF/WebP 共 8 个变体，`image()` 已输出 `srcset`。

替换为实拍图时只需在媒体库换文件，**不需要改代码**。

## 6. 验收记录

| 检查 | 方法与结果 |
|---|---|
| 类型检查 | `pnpm -r typecheck` — 6 个包全过 |
| 渲染回归测试 | `pnpm test`（`tests/*.test.ts`）— 4/4 通过，含「渲染输出可抓取且无可执行输入」 |
| 全 block 类型渲染 | 离屏渲染覆盖 `hero_slides / banner / feature_grid / image_text / statistics / rich_text / timeline / case_studies / latest_articles / technical_specs / comparison_table / testimonials / faq / video / cta / contact_form / search / downloads / product-lead / knowledge / service-widget / footer`，15/15 标记齐全 |
| 图标集 | 经真实渲染路径断言：18 个图标名逐个命中（21/21 含 3 个服务项卡片），**18 个图标逐个目检形状与标签相符、无畸形** |
| 图标回退 | 断言无效名字 `no-such-icon-at-all` 回退为序号且不输出 `card-icon` → PASS |
| 向后兼容 | 线上既有商品网格（无 `icon` 数据）仍渲染 3 个序号、0 个图标 |
| 桌面版式 | `/zh` `/en` 1440px 与离屏全区块页 1440px 截图走查，无破版 |
| 移动版式 | 390px 全区块页截图走查，**无横向溢出、无截断、无重叠** |
| 中文排版覆盖 | 确认 `html[lang=zh]` 规则生效，中文页与英文页字号/行高不同 |
| 对比度（WCAG AA） | 15 组关键前景/背景组合计算，**15/15 ≥ 4.5:1**（统计数字大字号按 3:1 判定） |
| 外部依赖 | 无外部字体 / 图标 CDN |

初版曾有一处不达标（按钮 hover 白字在 `--accent-600` 上仅 3.75），已改为深色字，现为 4.57。

**验证脚本**（均在 `.runtime/`，gitignore，不属于交付物，可重复运行）：

- `.runtime/reskin-upload.mjs` — 走真实 `/api/v1/upload` 上传素材
- `.runtime/reskin-seed-hero.mjs` — 建 `hero_slides` + 中英翻译 + 图片 ALT
- `.runtime/reskin-preview.mjs` — 离屏渲染全 block 类型页面（含 siteCSS 内联），供截图走查
- `.runtime/contrast.mjs` / `contrast2.mjs` — 对比度计算

## 7. 已知边界与遗留

1. **`hero_note` 文案硬编码**在渲染器里（`SUNS / GLASS & PRECISION`），不在数据模型内。换品牌需要改代码。建议后续移到 `site_settings`。
2. **`apps/web/src/app/globals.css` 是死文件**（Tailwind，全仓无 import）；真正生效的是 `/assets/site.css` → `packages/ui/siteCSS`。换肤时不要被它误导，建议后续清理。
3. **后台区块编辑器没有图标选择器**：`/manage` 的 `BlockEditor` 对 jsonb 字段给的是原始 JSON 文本域，编辑者需要自己记住图标名。建议后续加一个图标名下拉。数据层无需改动。
4. **无 `newsletter` 订阅区块**（需新后端端点）。
5. **媒体上传接口对畸形 multipart 请求返回 503 而非 400**：`apps/cms/src/server/api.ts` 的 upload 分支用 `new Request(url,{headers,body}).formData()`，解析失败会抛异常并被兜底 catch 转成「服务暂时不可用」。实测：Node `fetch + FormData` 正常，PowerShell `Invoke-RestMethod -Form` 触发 503。建议在该分支加 try/catch 返回 400。**本轮未修**（超出换肤范围）。
6. 上传接口有 Origin 校验，只接受 `.env` `CORS_ORIGINS` 中列出的来源（本地为 `localhost`，用 `127.0.0.1` 必 403）。脚本化调用统一用 `Origin: http://localhost:3001` + `Authorization: JWT <token>`。

## 8. 回滚

改动仅两个源文件 + 一组演示数据，且**不涉及数据库结构**：

```bash
git revert <reskin-commit>          # 代码回滚
node infrastructure/scripts/local-demo.ps1   # 重新发布后前台即恢复旧皮肤
```

演示素材（4 张图 + 2 条 hero slide）如需单独撤销，在后台「外观 / 客服」里禁用或删除对应记录即可，不影响代码。
