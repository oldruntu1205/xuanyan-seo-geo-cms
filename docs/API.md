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
