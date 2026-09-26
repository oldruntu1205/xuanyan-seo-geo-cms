# SUNS · SEO/GEO 多语言静态 CMS V1.0

项目目录：`H:\suns-New-code`。包含可运行前台、管理后台、发布 Worker、PostgreSQL 迁移和部署文件。

## 目录

```text
apps/
  cms/                 Payload 账号、业务管理 /manage、动态 API
  web/                 Next.js 多语言公开页面，读取已发布快照
  worker/              PostgreSQL 任务出队、BullMQ 重试和静态发布
packages/
  domain/              数据访问、权限、版本、发布快照
  ui/                  前台与静态发布共用 HTML/CSS/交互
  publisher/           HTML、增量写入、Sitemap、Robots、CDN
  seo/ geo/ schema/ media/ i18n/
database/
  001_extensions.sql
  002_core_system.sql
  003_content.sql
  004_product.sql
  005_seo_geo.sql
  006_media_appearance.sql
  007_publishing.sql
  008_leads_integrations.sql
  009_indexes_constraints.sql
  010_seed.sql
  011_runtime.sql
  012_operational_defaults.sql
  rollback/            每次迁移对应的逆向脚本
  verify.sql
infrastructure/
  scripts/             安全初始化、版本化迁移、独立数据库验证
  docker/              前台、后台、Worker 镜像
  nginx/               静态页面与动态 API 路由
tests/                 渲染、数据库集成、HTTP 与队列校验
docs/                  部署、操作、API 和验证记录
docker-compose.yml
.env.example
```

## 一次启动全部服务

需要 Node.js 22、pnpm 10 和 Docker Compose。

```powershell
cd H:\suns-New-code
pnpm install --frozen-lockfile
pnpm run setup
docker compose up -d --build
```

`setup` 只在 `.env` 不存在时生成独立随机密钥。Compose 自动等待 PostgreSQL、执行业务与账号迁移，再启动服务。首次启动 Worker 自动生成空站点，不包含虚构产品和公司资料。

访问：

- 网站：`http://localhost:8080/en`
- 首次创建管理员：`http://localhost:8080/admin`
- 业务管理：`http://localhost:8080/manage`
- Next.js 页面预览：`http://localhost:3000/en`

首次管理员没有默认邮箱或密码，请自行创建。已创建的首位账号自动获得 `super_admin` 权限。

## 本地开发

```powershell
docker compose up -d postgres redis
pnpm db:migrate
pnpm auth:migrate
pnpm dev
```

后台端口 3001，前台端口 3000。管理配置修改后，在工作台点击「重建已发布站点」。页面、产品或分类翻译须点击「发布」，任务完成后才能公开访问。

## 验证

```powershell
pnpm typecheck
pnpm build
pnpm test
pnpm db:verify
```

数据库验证会建立名称以 `suns_verify_` 开头的独立数据库，执行正向迁移、约束验证、发布集成、全量回滚、重新迁移后删除该临时数据库；不会在业务库中执行回滚。连接用户需要创建数据库的权限。

当前机器的验证结果见 `docs/VERIFICATION.md` 和同目录 JSON 记录。

## 迁移操作

```powershell
pnpm db:migrate
node infrastructure/scripts/migrate.mjs status
pnpm db:rollback
```

`db:rollback` 默认回退最后一个业务迁移。回滚会删除相应模块数据，请先备份。不要修改已执行迁移的内容，运行器会校验 SHA-256；后续变化请新增迁移。账号表使用 Payload 自己的 migration，独立放在 `payload_internal` schema。

## 功能与配置

已实现九种语言、内容与产品、分类、FAQ、SEO/GEO/JSON-LD、Page Builder、Hero、菜单、媒体、客服、询盘、版本、角色权限、定时发布、增量文件写入、发布日志和 301。

- 本地媒体默认可用；R2/S3、Cloudflare CDN、SMTP、GA4 使用你自己的配置，未配置时不调用这些服务。
- 默认禁止搜索引擎索引。正式上线时设置站点域名、启用索引，并设置 `DEPLOYMENT_ENV=production` 后重建。
- AI 客服仅预留接口，符合原 V1.0 边界；ERP、CRM、自动 AI 写作不在本版本范围内。

详细操作见 `docs/OPERATIONS.md`；部署见 `docs/DEPLOYMENT.md`；数据/API 约定见 `docs/API.md`。
