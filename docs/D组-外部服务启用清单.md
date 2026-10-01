# D 组 · 外部服务启用清单

> 用途：D 组全部是「**代码已就绪、只差配置/凭据**」。本清单把**代码实际读什么**、**需要你提供什么**、**怎么启用**、**怎么验证**、**有什么风险**写清楚，避免反复试错。
> 口径：所有事实均在当前工作区代码里核对过（附文件:行号）；生产侧现状为 2026-10-01 **只读抽查**结果。
> ⚠️ 凭据一律**不要发给我**，请直接写进服务器 `/www/wwwroot/opctools/.env`（或对应后台设置页），写完告诉我，我来做重启与验证。

## 生产侧现状（2026-10-01 抽查，只读）

| 项 | 实际值 | 结论 |
| --- | --- | --- |
| CRM 配置（`runtime_settings` 里 `crm.*`） | **0 行**；`integration_connections` **0 行** | 从未配置/启用 → 同步关闭，符合台账「未配置真实 CRM 时不要开启同步」 |
| `SMTP_HOST` / `SMTP_FROM` | 空 | 密码重置邮件不可用（D-1） |
| `MARKETING_DELIVERY_URL` / `_TOKEN` | 空 | `configured()` 恒 false，发送总开关默认关闭（D-3） |
| `STORAGE_PROVIDER` | 已配置（本地） | 媒体走本地磁盘，未用对象存储 |
| `S3_BUCKET` / `S3_ENDPOINT` | 空 | 同上（D-4） |
| `CLOUDFLARE_ZONE_ID` / `_API_TOKEN` | 空 | 发布后不做 CDN 清理（D-4） |
| GA4 | 未见测量 ID 配置 | 前台不注入统计（D-4） |

**好消息**：现在这些全部是"关闭"状态且**默认安全**（不配置＝不调用），不会误发邮件/误清缓存。

---

## D-1｜SMTP（后台密码重置邮件）

- **代码接线**：[`apps/cms/src/payload.config.ts:15`](../apps/cms/src/payload.config.ts#L15) —— `email: process.env.SMTP_HOST ? nodemailerAdapter({…}) : undefined`（适配器 `@payloadcms/email-nodemailer`）。**没配 `SMTP_HOST` 就完全没有邮件适配器**，所以日志出现 `No email adapter provided`。
- **需要的变量**（服务器 `.env`）：`SMTP_HOST`、`SMTP_PORT`（默认 587）、`SMTP_SECURE`（465 端口用 true）、`SMTP_FROM`（发件人，须是**已验证的发件域**）、`SMTP_USER`、`SMTP_PASSWORD`。
- **怎么启用**：把上面 6 个值填进 `/www/wwwroot/opctools/.env` → 重启 `suns-cms`（`su -s /bin/bash www -c 'PM2_HOME=/home/www/.pm2 pm2 restart suns-cms --update-env'`）。
- **怎么验证**：① 后台 `/manage` 或用 API 触发一次密码重置；② 收件箱能收到重置信；③ `error.log` 不再出现 `No email adapter provided`。
- **风险/注意**：发件域没做 SPF/DKIM 会进垃圾箱；建议**先发给自己**验证；别用个人邮箱当 `SMTP_FROM`。

## D-2｜CRM 通用 HTTPS 接口

- **代码**：[`packages/domain/src/crm-sync.ts`](../packages/domain/src/crm-sync.ts)；配置**不入 `.env`**，而是存库 `runtime_settings['crm.generic_https']`，令牌用 `PAYLOAD_SECRET` 派生密钥做 **AES-256-GCM** 加密。
- **配置入口**：后台「**客户与商机 → 外部同步**」（API：`POST /api/v1/v2/v21-crm-settings {endpoint,enabled,token}`）。
- **需要的**：一个**公开 HTTPS 根地址** + **16–500 字符无空格令牌**。
  ⚠️ 硬性约束（代码 `baseURL()` + `pinnedPublicAddress()`）：**必须 https、不能带端口/账号/查询参数/锚点、域名必须能解析且解析结果全是公网 IP**；请求**硬编码 443** 并**钉死**解析结果。
- **对接契约**（对方要实现）：
  - `GET {endpoint}/leads?limit=100[&cursor=…]` → `{items:[{externalId,name,email,company,phone,message,status,updatedAt}], nextCursor?}`（单页 ≤100，最多拉 1000 条）
  - `POST {endpoint}/leads/upsert` → 返回记录，或 **409 `{record:{…}}`** 表示并发冲突
- **怎么验证**：配置后点「**从 CRM 拉取**」→ 看「最近同步任务」与冲突列表；失败会写 `error_message` 并按 2^n 分钟退避重试（上限 5 次）。
- **风险/注意**：启用后 worker **每 15 分钟**自动拉取 + 推送本地变更（`scheduleCrmSync`）。**强烈建议先用测试 CRM 或临时 mock 验证一遍**再指真实 CRM；冲突不会自动覆盖，需人工在后台处理（三个动作已验收：保留本地并推送 / 采用 CRM 记录 / 导入为新询盘）。
- **本地边界（我实测过）**：本机**无法**演练"真实 push/pull"，因为公网域名+443 的约束挡住了 localhost。要演练得有一台公网 HTTPS 的 mock。

## D-3｜营销投递（发送邮件/触达）

- **代码**：[`packages/domain/src/marketing.ts:13`](../packages/domain/src/marketing.ts#L13) 的 `configured()` 要求 `MARKETING_DELIVERY_URL` 是 **https、无端口、无用户名密码**；`:59-60` 用 `httpsRequest` **硬编码 443** 且钉死解析。
- **需要的变量**：`MARKETING_DELIVERY_URL`、`MARKETING_DELIVERY_TOKEN`、`MARKETING_UNSUBSCRIBE_SECRET`（`.env.example` 已列）。
- **怎么启用**：填 `.env` → 重启 `suns-cms` + `suns-worker`。
- **怎么验证**：后台营销区的投递状态变为"已配置"；发送前仍受**审核 + 频率上限 + 退订规则 + 独立营销同意**约束（代码里有 `recordMarketingConsent` 与退订链接）。
- **风险/注意**：这是**对外发信**，误发成本高。建议先指向一个**测试投递端点**，用一条测试受众跑通再切真实。

## D-4｜CDN 清理 / 对象存储 / GA4

**(a) Cloudflare CDN 清理**
- 代码：[`packages/publisher/src/index.ts:51-56`](../packages/publisher/src/index.ts#L51-L56) —— 发布后按 URL 批量清缓存（**每批 30 条**，写 `cdn_purge_logs`）；`ZONE_ID` 与 `API_TOKEN` **必须同时提供**，缺一个就跳过（只给一个会抛错）。
- 变量：`CLOUDFLARE_ZONE_ID`、`CLOUDFLARE_API_TOKEN`（权限：Zone → Cache Purge）。
- 验证：发布一次 → 查 `cdn_purge_logs` 与线上页面是否立刻变新；或看 worker 日志。

**(b) 对象存储（R2 / S3）**
- 代码：[`apps/cms/src/server/media.ts:10-12`](../apps/cms/src/server/media.ts#L10-L12) —— `STORAGE_PROVIDER != local` 时用 `@aws-sdk/client-s3`；**必须有 `S3_BUCKET` 且 `MEDIA_PUBLIC_URL` 非空**，否则直接 `503 对象存储尚未配置`。
- 变量：`STORAGE_PROVIDER`、`S3_BUCKET`、`S3_ENDPOINT`、`S3_REGION`、`S3_FORCE_PATH_STYLE`、`MEDIA_PUBLIC_URL`；**凭据未在代码里显式读取 → 走 AWS 默认凭据链**，即需要 `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` 环境变量（或实例角色）。
- 验证：后台上传一张图 → 返回的 URL 能打开（`MEDIA_PUBLIC_URL` 前缀正确）；再查 `media_assets.storage_provider/bucket`。
- 风险：切到对象存储后**已有本地媒体不会自动迁移**（历史 `media_assets` 仍指向本地文件），要保留旧文件目录；先小范围试。

**(c) GA4**
- 代码：前台由 [`packages/ui/src/browser.ts:5`](../packages/ui/src/browser.ts#L5) 读取页面里的 `[data-analytics]` 容器后注入（另有 `index.ts:110`、`trade-public.ts:5` 同类）。
- 需要的：GA4 测量 ID（配置在**站点设置**里，不在 `.env`）。
- 验证：线上首页出现 `data-analytics` 容器 + 网络请求含 `gtag/js`；GA4 实时报表能看到自己这次访问。
- 注意：会引入第三方 Cookie/同意逻辑，需与现有「分析同意」开关一致（站点已有 `data-analytics-choice`）。

## D-5｜Search Console

- 现状：**第一版按 CSV 导入**（[`packages/domain/src/growth.ts:24`](../packages/domain/src/growth.ts#L24) 的 `importKeywords`，入口在 [`apps/cms/src/server/v2-api.ts:69`](../apps/cms/src/server/v2-api.ts#L69)）。
- 结论：**这不是缺陷，是既定路径**（台账原文："第一版走 CSV 导入"）。关键词来源靠人工导出 CSV。
- 若要接 OAuth：需要 Google Cloud 项目 + OAuth 客户端 + 已备案/可达的回调域名，**属于新功能**，建议单独立项而不是收尾期硬塞。

---

## 建议的启用顺序（按风险从低到高）

| 序 | 项 | 理由 |
| --- | --- | --- |
| 1 | **D-1 SMTP** | 影响面小、可只发给自己验证；能立刻恢复「忘记密码」这条后台自救路径 |
| 2 | **D-4(a) Cloudflare 清理** | 纯运维收益、无对外副作用；只影响缓存新鲜度 |
| 3 | **D-4(c) GA4** | 只新增统计，不改变业务行为 |
| 4 | **D-4(b) 对象存储** | 涉及媒体持久化，建议在低峰切换并保留本地目录 |
| 5 | **D-3 营销投递** | **对外发信**，务必先用测试端点 |
| 6 | **D-2 CRM** | 会开启每 15 分钟的自动双向同步，风险最高，最后做且先验测试 CRM |

## 我能在你给凭据之前先做的事

- 为 D-1 准备"配置后一键验证"脚本（触发重置 + 检查日志）。
- 为 D-4(a) 准备"清缓存是否生效"的验证脚本（发布 → 查 `cdn_purge_logs` → 比对线上响应头）。
- 为 D-2/D-3 准备**公网 HTTPS mock 的部署说明**（这样你能在不碰真实 CRM/投递的前提下先把链路验通）。
- D-5 的 CSV 导入我可以跑一次真实样本，确认导入链路可用。
