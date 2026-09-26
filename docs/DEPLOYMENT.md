# 部署与维护

## 数据所有权

冻结的业务关系表保留在 PostgreSQL `public` schema，通过参数化 SQL 服务层管理。Payload 管理账号、会话、密码与管理框架，自己的 ORM 表放在 `payload_internal` schema。

这是本实现为避免 Payload 自动建表覆盖冻结业务结构所采用的明确分工。`/manage` 使用同一 Payload 会话，并执行服务端业务权限检查；不是独立的弱认证后台。不要将 public 表交给 Payload 的 schema push 管理。

## 环境

- Node.js 22，pnpm 10.17.1；依赖版本已锁定。
- PostgreSQL 16+，Redis 7（Compose 配置）。
- Docker Compose v2；Ubuntu / OpenCloudOS 的 Docker Engine。
- 初始端口：8080 为 Nginx；3000/3001/5432/6379 在 Compose 中只绑定 127.0.0.1。

## 正式上线

1. 执行 `pnpm install --frozen-lockfile`、`pnpm run setup`。
2. 配置 `.env`：公司站点 URL、允许来源 `CORS_ORIGINS`、默认语言、部署环境；密码由 setup 生成，不使用示例凭据。
3. `docker compose up -d --build`。init 服务自动应用业务 SQL 和 Payload 迁移。迁移失败时其他服务不会提前运行。
4. 在 `/admin` 创建自己的管理员，进入 `/manage` 配置站点、语言及业务内容。
5. 将站点配置中的 primary_domain 改为实际 HTTPS 域名。设置 `DEPLOYMENT_ENV=production` 并在后台启用索引。
6. 重启采用新环境变量的容器，点击工作台「重建已发布站点」。
7. 在外层负载均衡/HTTPS 反向代理配置证书。Nginx 模板当前提供 HTTP 容器入口，不包含你的证书。使用 Cloudflare 时应在源站同时配置 HTTPS；不要将源站 IP 无限制暴露以绕开 CDN。

Node 前台可用于查看已发布内容；正式静态站点由 Nginx 直接读取静态卷，CMS 只承担 API、后台和媒体请求。

## 配置说明

| 项目 | 环境变量 / 后台配置 |
|---|---|
| 数据库 | DATABASE_URL（Compose 自动改为容器内部地址） |
| 队列 | REDIS_URL（Compose 自动指向 redis） |
| 会话签名 | PAYLOAD_SECRET，至少 32 字符 |
| 来源校验 | CORS_ORIGINS，逗号分隔完整 origin，包含协议和端口 |
| 公开地址 | NEXT_PUBLIC_SITE_URL，以及后台 primary_domain |
| 本地媒体 | STORAGE_PROVIDER=local，MEDIA_DIR |
| 对象存储 | STORAGE_PROVIDER=s3/r2，S3_ENDPOINT、S3_REGION、S3_BUCKET、AWS_ACCESS_KEY_ID、AWS_SECRET_ACCESS_KEY、MEDIA_PUBLIC_URL |
| S3 路径模式 | S3_FORCE_PATH_STYLE=true（仅某些兼容服务需要） |
| CDN 清理 | CLOUDFLARE_ZONE_ID、CLOUDFLARE_API_TOKEN，两者必须同时存在 |
| 密码重置邮件 | SMTP_HOST、SMTP_PORT、SMTP_SECURE、SMTP_FROM、SMTP_USER、SMTP_PASSWORD |
| GA4 | 后台 ga_measurement_id；访客同意后加载 |
| GSC | 后台 settings_json.google_site_verification |

对象存储的公开访问/CORS 和 CDN token 需要在你的服务商账户中配置。系统不会自动开通服务或产生付费订阅。

## 备份、回滚与升级

备份 PostgreSQL（含两个 schema）、media_data 和 static_data。媒体与静态目录在 Docker 命名卷中；本地开发写入项目 media/、static-site/。

代码升级前保留数据库备份，先在测试库应用新迁移，再更新镜像。业务迁移运行器使用事务、咨询锁和 SHA-256 校验；Payload 迁移由其自身工具管理。

`pnpm db:rollback` 只退最后一个业务迁移。全量回滚 `node infrastructure/scripts/migrate.mjs down 000` 是销毁性维护操作，应仅在可丢弃数据库使用。扩展保留，避免影响共享 schema。已被业务数据引用的种子记录可能阻止逆向删除，这是外键保护，应通过恢复备份或在维护窗口制定迁移方案处理。

## 本机无 Docker 时

本次验证使用项目内临时 PostgreSQL 16.14 与 Windows Redis 5.0.14.1 测试运行包。Redis 5 仅用于本地兼容性验证，部署配置仍为 Redis 7。

PostgreSQL 辅助脚本：

```powershell
npm install --prefix .runtime embedded-postgres@16.14.0-beta.17
node infrastructure/scripts/local-db.mjs
```

新终端读取本机临时连接（不打印密码）：

```powershell
$env:DATABASE_URL = (Get-Content .runtime/connection.json | ConvertFrom-Json).DATABASE_URL
pnpm db:migrate
pnpm auth:migrate
```

Redis 必须另行启动，将 REDIS_URL 指向它。`pnpm dev` 启动三个应用。生产不依赖 `.runtime` 目录。

## 验证边界

本机没有 Docker Engine，因此容器镜像、Linux Nginx 和 Redis 7 容器需在目标部署环境执行最终冒烟验证。真实 PostgreSQL 16、Windows Redis 队列、HTTP API、Next.js 构建与前台页面已进行本地验证。Cloudflare/R2/S3/SMTP 未提供实际账户，代码已接入，但未调用真实第三方账户。

## 故障定位

- 发布 pending：确认 Worker 与 Redis 在线，检查任务 scheduled_at。
- failed：查看 error_message、任务路由日志；修正后重试。
- 403：检查账号角色和 CORS_ORIGINS。
- 404：确认对应语言启用、翻译已发布且 Worker 完成；草稿不会公开。
- 媒体上传失败：检查目录写权限、25MB 上限或对象存储配置。
- 页面旧内容：确认发布完成，检查 CDN 清理日志；外观修改需重建。
- 迁移 checksum 不同：不要覆盖旧迁移记录；先确认文件来源，后续改动新增迁移。

## 性能边界

增量发布重新计算依赖页面并用 checksum 跳过未变化的 HTML。V1 对已发布文档使用全站依赖扫描，避免漏更列表和语言链接；超大站点可在后续增加依赖图以缩小扫描范围。每个文件原子替换，整个站点不做单事务切换。
