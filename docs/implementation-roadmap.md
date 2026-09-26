# V1.0 实施状态

- [x] Monorepo、PostgreSQL 迁移、账号迁移、开发与部署配置。
- [x] 业务后台：内容、翻译、产品、规格、分类、FAQ、媒体、版本和权限。
- [x] SEO/GEO、JSON-LD、canonical、hreflang、Sitemap、Robots、301。
- [x] 发布快照、BullMQ Worker、定时、取消、重试、路由日志与增量文件写入。
- [x] 响应式前台、Page Builder、Hero、菜单、客服、联系 / RFQ、下载记录。
- [x] 真实 PostgreSQL 正向 / 回滚 / 重建验证，HTTP 与 Redis 队列联调。
- [x] 使用、API、部署和验证说明。

上线环境仍需提供域名与证书，并按需配置 Cloudflare、对象存储和 SMTP。当前 Windows 主机没有 Docker Engine，容器部署测试需要在目标环境进行。详情见 VERIFICATION.md。
