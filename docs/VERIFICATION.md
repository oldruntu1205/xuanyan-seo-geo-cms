# V1.0 验证记录

验证日期：2026-09-26。本记录区分已实际运行的检查和需要部署账户/环境的检查。

## 已通过

| 检查 | 结果 |
|---|---|
| 全项目 TypeScript | domain、CMS、UI、web、publisher、worker 通过 |
| Next.js 生产构建 | CMS、web 通过；Worker 类型构建通过 |
| PostgreSQL 16.14 正向迁移 | 001–012 全部执行成功 |
| PostgreSQL 全量 rollback | 012→001 全部执行成功 |
| rollback 后重新迁移 | 成功；再次执行 up 为无变更 |
| 数据约束 | UUID、外键、跨类型 URL 唯一性、路径安全、301 循环防护通过 |
| 数据库运行逻辑 | search_vector、updated_at、软删除释放路径通过 |
| 业务集成 | CRUD、权限、草稿隔离、版本恢复通过 |
| 发布语义 | 定时快照不受后续草稿改动影响，取消、失败和下线通过 |
| 增量文件写入 | 未改变的 HTML 文件修改时间保持不变 |
| 真实 HTTP 登录 | 首个管理员、登录 Cookie、业务权限元信息通过 |
| Redis / BullMQ | 真实队列处理产品发布和下线通过 |
| 前台实际页面 | 产品 SSR、JSON-LD、canonical，以及浏览器首页加载通过 |
| 媒体 | PNG 上传，8 个 AVIF/WebP 文件版本，公开读取通过 |
| 询盘 | RFQ、重复 key 幂等、错误 Origin 拒绝通过 |
| 搜索 | 仅已发布产品参与检索通过 |
| 渲染单测 | HTML/URL 转义、路径穿越拒绝、HTML 清洗、浏览器 JS 解析，共 4 项通过 |

数据库原始摘要：`database-verification.json`。HTTP 联调摘要：`http-verification.json`。生产构建记录：`production-build.log`。

测试使用临时账户及数据，HTTP 验证脚本在结束后删除本次创建的账户、产品、询盘和媒体；没有给交付项目设置默认管理员密码。

## 尚未在当前环境验证

- Docker 镜像 / Linux Nginx / Redis 7 容器：本机没有 Docker Engine。交付了 Compose、Dockerfile、Nginx 模板和 CI 配置。
- Redis 本机实测版本为 Windows 移植版 5.0.14.1；BullMQ 给出建议升级到 6.2+ 的提示。部署固定使用 Redis 7。
- Cloudflare 清理、R2/S3 上传和 SMTP 发信：未配置你的实际账户，未向外部账户发送请求。
- 正式域名、TLS 证书、站点真实内容和图片：需要上线时配置/录入。

## 已知实现边界

- 每个静态文件独立原子替换，跨页面发布不提供整站原子切换。
- 增量发布通过依赖重新计算 + checksum 跳过不变文件；目前依赖扫描覆盖全站。
- PostgreSQL simple FTS 对中文不提供专门的中文分词。
- AI 客服接口、CRM/ERP 与自动 AI 写作不在冻结 V1.0 的实现范围；AI chat 为明确的 501 预留响应。

复现方法见 README 与 DEPLOYMENT。源码汇编由 `node infrastructure/scripts/export-source.mjs` 生成。
