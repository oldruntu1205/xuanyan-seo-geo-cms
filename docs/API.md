# API 与数据约定

## 公共接口

| 方法 | 路径 | 用途 |
|---|---|---|
| GET | /api/v1/health | 数据库连接健康 |
| GET | /api/v1/document?path=/en/example | 已发布快照，草稿返回 404 |
| GET | /api/v1/catalog?locale=en&kind=products&page=1 | 已发布列表，每页 24 |
| GET | /api/v1/search?locale=en&q=glass | 已发布全文搜索 |
| GET | /api/v1/resolve?path=/en/old | 301/302 或 404 |
| GET | /api/v1/download/:mediaId?locale=en | 记录下载并跳转公开资源 |
| GET | /api/v1/service?locale=en&country=US | 国家/语言/营业时间匹配的客服 |
| POST | /api/v1/inquiries | 联系 / RFQ，必须包含允许的 Origin |
| POST | /api/v1/chat | V1 预留，501 |

询盘示例：

```json
{
  "key": "a0331a8a-a216-4a0d-b7b6-e42a05b2f314",
  "locale": "en",
  "name": "Customer",
  "email": "customer@example.com",
  "company": "Company",
  "message": "Please quote the requested products.",
  "consent": true,
  "inquiry_type": "rfq",
  "items": [{"product_id": "e8182b26-dc6a-4e30-9586-1b498867a204", "quantity": 10}]
}
```

UUID 为示例，需要替换成实际已发布产品。重试同次提交使用相同 key；新询盘生成新 key。可附带 UTM 和 source_url。

## 管理接口

使用 Payload 登录会话 Cookie；写请求还要求允许的 Origin。每次请求在服务端检查账号和权限，不依赖界面隐藏按钮。

| 方法 | 路径 | 参数 |
|---|---|---|
| GET | /api/v1/meta | 当前账号和可见资源 |
| GET | /api/v1/dashboard | 概览与近期任务 |
| GET | /api/v1/records?resource=products | page、search、JSON filter |
| POST | /api/v1/records?resource=products | {data:{...}} |
| PATCH | /api/v1/records?resource=products | {key:{id},data:{...}} |
| DELETE | /api/v1/records?resource=products | {key:{id}} |
| POST | /api/v1/upload | multipart/form-data 字段 file |
| POST | /api/v1/publish | {resource,id,action,scheduledAt?} |
| POST | /api/v1/publish | {resource:"site"} 重建 |
| POST | /api/v1/jobs | {id,action:"retry"或"cancel"} |
| POST | /api/v1/restore | {id:版本ID} |

发布 resource 支持 content_item_translations、product_translations、taxonomy_term_translations。action 为 publish/unpublish/rebuild；scheduledAt 为带时区 ISO 日期。

修改时可提交 `_expectedUpdatedAt` 做乐观并发检查。复合主键关联表需要在 key 中提供完整字段。资源名称为白名单，SQL 值均参数化；客户端无法指定任意表名。

401 未登录，403 无权限/来源不匹配，400 数据约束错误，409 唯一冲突/记录版本冲突，413 上传过大，429 超出频率限制，503 服务失败。

## 数据设计补充

001–010 为业务基线；011 添加发布快照、跨类型路径注册、幂等提交和限流；012 添加运行索引、初始站点、权限映射与同意时间。所有脚本均有对应 rollback。

迁移执行记录位于 public.schema_migrations。账号 migration 的代码和 snapshot 位于 apps/cms/src/migrations，表位于 payload_internal。

媒体上传生成 AVIF/WebP，每种格式四个目标宽度（不放大原图）。内容的 body 为区块数组；产品规格值三种类型只能填一种。软删除覆盖内容、产品、翻译、媒体、询盘等主体；关联表按外键规则清理。

## AI 设置与自动翻译（需登录）

- `GET /api/v1/translation-targets?entityType=content_item_translations&entityId=<uuid>`：列出可用目标语言及已有内容状态。
- `GET /api/v1/translation-jobs`：翻译任务、状态与是否已配置服务（含 `config.reason` 说明不可用原因）；不会返回密钥。
- `POST /api/v1/translation-jobs`：`{entityType,entityId,targetLocaleIds,overwriteDraft?}`，异步提交任务。
- `PATCH /api/v1/translation-jobs`：`{id,action:"retry"|"approve"}`。
- `GET /api/v1/llm-settings`：仅管理员可用。返回 `{provider,model,url,enabled,configured,hasSavedKey,hasEnvKey,keySource,keyFingerprint,keyProblem,urlProblem,updatedAt,updatedBy}`。密钥本身永不回显，`keyFingerprint` 仅用于确认当前生效的是哪一把密钥。
- `PUT /api/v1/llm-settings`：仅管理员可用，体为 `{model,url,enabled,apiKey?,clearKey?}`。`apiKey` 留空表示保留已保存的密钥，`clearKey:true` 表示删除。写入前校验模型名与接口地址（仅 HTTPS，本机可用 `http://localhost`），并串行化读改写以避免并发保存互相覆盖；每次变更写 `audit_logs`（记录 `keyAction: kept|replaced|cleared|none`，不记录密钥）。
- `POST /api/v1/llm-test`：仅管理员可用，体可选 `{model?,url?,apiKey?}`。缺省字段回落到已保存配置；**允许用尚未保存的凭据试跑，任何情况下都不写库**。成功返回 `{ok,model,endpoint,durationMs,sample,usage,keySource,fromUnsavedInput}`。

上游错误会分级为可执行的中文提示：密钥无效/余额不足/模型不存在 → 400，限流 → 429，上游 5xx → 502，出网超时 → 504。上游 401/403 **不会**原样返回（业务管理页把 401 当作会话过期并强制退出登录）。

译文写入草稿并进入“待校对”，不会自动发布。DeepSeek JSON 输出接口要求 `response_format:{type:"json_object"}`；详见 [DeepSeek 官方文档](https://api-docs.deepseek.com/guides/json_mode/)。任务完成后 `translation_jobs.result_data.metrics` 记录模型、批次数、耗时与 token 用量。

## V2.0 工作台接口（需登录）

所有 `v2` 路由沿用 Payload 会话、Origin 检查、资源权限和参数校验。数据结构由 `apps/cms/src/server/v2-api.ts` 的 Zod 契约定义。

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| GET | `/api/v1/v2/seo?entityType=&id=` | 草稿 SEO 诊断与修复资源 |
| GET | `/api/v1/v2/preview?entityType=&id=` | 当前草稿 HTML、公开快照、差异和历史发布 |
| POST | `/api/v1/v2/rollback` | `{jobId}`：从已完成发布快照生成新发布任务 |
| GET/POST/DELETE | `/api/v1/v2/translation-terms` | 术语表读取、保存、删除 |
| GET | `/api/v1/v2/translation-memory` | 已审核翻译记忆 |
| GET | `/api/v1/v2/translation-compare?id=` | 原文与译文对照 |
| POST | `/api/v1/v2/translation-batch` | `{ids}` 批量标记已校对，逐项返回成功和失败 |
| GET/POST | `/api/v1/v2/keywords` | 最新关键词主题簇 / 导入 Search Console CSV |
| GET/POST | `/api/v1/v2/competitors` | 指定 HTTPS 页面列表 / 受限采集 |
| GET | `/api/v1/v2/competitor-history?id=` | 已采集标题、摘要和标题层级的历史 |
| GET/POST | `/api/v1/v2/geo` | 固定提示词与样本 / 保存提示词 |
| POST | `/api/v1/v2/geo-sample` | `{id}`：运行一次 DeepSeek 抽样 |
| GET/PATCH | `/api/v1/v2/inquiries` | 询盘与备注 / 状态、负责人、跟进时间、备注 |
| GET | `/api/v1/v2/assistant-context` | 当前账号可读取的文章和产品名称 |
| GET | `/api/v1/v2/assistant-history` | 当前账号的建议记录 |
| POST | `/api/v1/v2/assistant-suggest` | 对指定内容提供写作、翻译或 SEO 建议 |
| GET | `/api/v1/v2/ai-writing-history` | 当前账号的 AI 写作模型和 token 记录 |

`014_v2_workflows.sql` 新增各工作流记录及询盘下次跟进时间，回滚脚本为 `database/rollback/014_v2_workflows.down.sql`。CSV 导入数据标为运营提供，不能当作已通过 Google 身份验证；GEO 链接来自模型输出，未经独立验证。

## V2.1 协作与增长接口

全部位于 `/api/v1/v2/`，沿用已有登录、Origin 和角色权限检查。Zod 请求结构见 `apps/cms/src/server/v21-api.ts`。

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| POST | `v21-terms-review` | 审批或退回术语 |
| GET/POST/PATCH | `v21-tasks` | 任务列表、批量分配、状态和负责人更新 |
| POST | `v21-competitor-alert` | 标记结构变化已查看 |
| POST | `v21-geo-schedule` | 启用、暂停或调整固定采样 |
| GET | `v21-geo-trend?id=` | 相同配置样本的日趋势和最近差异 |
| GET/POST | `v21-outreach` | 合作对象列表及保存 |
| GET | `v21-outreach-detail?id=` | 草稿、回复与链接 |
| POST | `v21-outreach-draft`、`v21-outreach-review`、`v21-outreach-reply`、`v21-outreach-link` | 外联记录与人工审核 |
| GET/POST | `v21-crm-settings` | 管理员读取和保存脱敏的 CRM 配置 |
| GET | `v21-crm` | 同步任务、冲突和已关联线索 |
| POST | `v21-crm-queue`、`v21-crm-retry`、`v21-crm-resolve` | 手动排队、重试失败任务、处理冲突 |

本地 SQL 迁移为 `015_v21_collaboration.sql`，回滚脚本为 `database/rollback/015_v21_collaboration.down.sql`。外部 CRM 请求与响应契约、分页和冲突策略见 [V2.1 本地升级说明](V2.1-LOCAL-UPGRADE.md)。
