# SUNS 生产部署记录（prod）

> 部署日期：2026-09-27 ｜ 目标：`https://www.opctools.cloud`

## 1. 交付概览

| 项 | 值 |
|---|---|
| 域名 | `www.opctools.cloud`、`opctools.cloud`（DNSPod → 43.132.209.126，TTL 600） |
| 服务器 | `43.132.209.126`（OpenCloudOS 9.6，2 核 / 1.96 GB 内存 / 40 GB 磁盘） |
| 项目根 | `/www/wwwroot/opctools` |
| 部署形态 | 原生 Node + PM2（**未使用 Docker**：该机 docker daemon 未运行，且 1.9G 内存无法承载服务器端构建） |
| 运行范围 | CMS（3001）+ Worker；公开页面由 nginx 直出静态产物，**不经过 Node** |
| 管理员 | `admin@opctools.cloud`（密码见 `/root/opctools-admin-password.txt`，600 root 私有） |

## 2. 服务器组件

| 组件 | 路径 / 标识 | 说明 |
|---|---|---|
| 站点代码 + 产物 | `/www/wwwroot/opctools` | 属主 www:www |
| Next 产物 | `apps/cms/.next` | **开发机构建**，服务器不再构建 |
| 静态发布产物 | `/www/wwwroot/opctools/static-site` | nginx root，9 语言 HTML + assets + sitemap |
| 媒体目录 | `/www/wwwroot/opctools/media` | 本地存储，AVIF/WebP 各 4 档 |
| 环境变量 | `/www/wwwroot/opctools/.env` | 600 www:www，含 DB 密码与 PAYLOAD_SECRET |
| PM2 配置 | `/www/wwwroot/opctools/ecosystem.config.cjs` | 由 www 用户加载 |
| PM2 进程 | `suns-cms`(3001)、`suns-worker` | `pm2 save` 已执行，systemd `pm2-www` 已 enabled（开机自启） |
| nginx vhost | `/www/server/panel/vhost/nginx/opctools.cloud.conf` | 手工放置，**不在宝塔站点列表内**，面板不会覆盖它 |
| TLS 证书 | `/www/server/panel/vhost/cert/opctools.cloud/` | Let's Encrypt，acme.sh 签发，有效期至 2026-12-26 |
| 证书续期 | root crontab `26 2,8,14,20 * * *` | acme.sh `--cron`，续期后自动 `nginx -s reload` |
| CMS 日志 | `/www/wwwlogs/opctools/cms.{out,err}.log` | — |
| Worker 日志 | `/www/wwwlogs/opctools/worker.{out,err}.log` | — |
| 站点访问日志 | `/www/wwwlogs/opctools.cloud.{log,error.log}` | — |
| 数据库 | PostgreSQL 18，库/用户均 `suns` | 宝塔 PG（`/www/server/pgsql`），`payload_internal` schema 存 Payload 表 |
| 队列 | Redis 8.0.5 `127.0.0.1:6379` | 宝塔 Redis，无密码 |
| Node / pnpm | v22.20.0 / 10.17.1 | 宝塔 node，`/usr/local/bin/{node,pnpm}` 软链 |

## 3. 部署流程

### 一键（推荐）

```powershell
pwsh -File _deploy/sync-prod.ps1              # 构建 → 打包 → 上传 → 服务器部署 → 公网验收
pwsh -File _deploy/sync-prod.ps1 -SkipBuild   # 复用现有 .next
```

前置：SSH 私钥。Windows 下必须先复制 `BTC.pem` 到临时目录并 `icacls /inheritance:r /grant 当前用户:F`，否则 OpenSSH 报 `UNPROTECTED PRIVATE KEY`。

### 分步

```powershell
# 开发机
pwsh -File _deploy/build-prod.ps1        # 用生产变量构建（NEXT_PUBLIC_* 会被内联，必须生产值）
python _deploy/pack-prod.py              # 白名单打包 + 安全自检（禁止 .env / node_modules 入库）

# 上传后在服务器执行
/tmp/prod-deploy.sh /tmp/suns-prod-<时间戳>.tar.gz
```

### 构建为什么必须在开发机

`next build` 需要约 1.5 GB 峰值内存，该机总内存仅 1.96 GB 且与 myworkbuddy 等站点共存 —— 服务器端构建会 OOM 并波及同机生产服务。故采用「开发机构建产物 + 服务器只 `pnpm install` 装 Linux 平台二进制」。

## 4. 验收结果（2026-09-27 实测）

| 检查项 | 结果 |
|---|---|
| `https://www.opctools.cloud/` | 302 → `/en` ✓ |
| 9 语言首页（en/zh/de/fr/es/it/pt/ja/ko） | 全部 200 ✓ |
| `/admin`（Payload 后台） | 200 ✓ |
| `/manage`（业务管理台） | 200 ✓ |
| `/api/v1/health` | 200 `{"ok":true}` ✓ |
| `/robots.txt`、`/sitemap.xml` | 200（当前 `Disallow: /`，索引未开启，见遗留项） ✓ |
| `http://` → `https://` | 301 ✓ |
| 证书链 | Let's Encrypt，CN=www.opctools.cloud，含 apex ✓ |
| 媒体上传（600×600 PNG） | 生成 AVIF + WebP 各 1920/1280/768/480 共 8 个变体 ✓ |
| 媒体读取 `/media/<key>` | 200 `image/png`；变体 200 `image/webp` ✓ |
| 静态发布（全站重建） | Worker 消费队列，9 语言 + assets + sitemap 共 51 个文件 ✓ |
| PM2 开机自启 | systemd `pm2-www` enabled，dump 已保存 ✓ |
| 业务/账号迁移 | 14 个业务迁移 + Payload initial_auth 全部 applied，74 张业务表 ✓ |
| 错误日志 | cms/worker/nginx 三处均无新错误 ✓ |

## 5. 回滚

1. **代码/产物回滚**：`prod-deploy.sh` 每次部署前把旧 `.next` 备份到 `/www/wwwroot/opctools/_backup_<时间戳>/`。
   ```bash
   rm -rf /www/wwwroot/opctools/apps/cms/.next
   cp -a /www/wwwroot/opctools/_backup_<时间戳>/.next /www/wwwroot/opctools/apps/cms/.next
   su -s /bin/bash www -c "export HOME=/home/www PATH=/usr/local/bin:/usr/bin:/bin; pm2 restart suns-cms"
   ```
2. **数据库回滚**：`node infrastructure/scripts/migrate.mjs down`（只退最后一个业务迁移）。**生产回滚前必须先备份**。
3. **停用整个站点**：
   ```bash
   mv /www/server/panel/vhost/nginx/opctools.cloud.conf{,.disabled} && nginx -s reload
   su -s /bin/bash www -c "export HOME=/home/www PATH=/usr/local/bin:/usr/bin:/bin; pm2 delete suns-cms suns-worker && pm2 save"
   ```
4. nginx 配置部署前备份：`/www/wwwroot/opctools/_server_backup/nginx_20260927_1516/`

## 6. 遗留风险与待办

| 优先级 | 事项 | 说明 |
|---|---|---|
| ~~高~~ **已解决** | ~~生产库无备份任务~~ | **2026-09-29 解决**：新增 `infrastructure/scripts/backup-db.sh` + `/etc/cron.d/suns-backup`（每日 03:37 备份 PostgreSQL + `.env` + `media`；保留 14 天且至少最近 7 份；日志 `/var/log/suns-backup.log`）。已实测 crond 真触发 + 完整恢复演练（见第 15 节）。 |
| **高** | 内存余量偏紧 | 1.96 GB 总量，常态占用约 76%（suns-cms ~290MB、suns-worker ~60MB、orangebook ~350MB）。已给 CMS/Worker 设 `max-old-space-size` 与 PM2 `max_memory_restart` 自保；若新增服务需先评估。 |
| 中 | 搜索引擎索引未开启 | `site_settings.enable_indexing=false` → `robots.txt` 为 `Disallow: /`、sitemap 为空。内容就绪后在 `/manage` 开启并「重建已发布站点」。 |
| 中 | 站点内容仍很少 | **2026-09-29：`site_name` 已改为「玄砚」并重建上线**（第 15 节）。当前仍只有 1 个产品（SKU `690020260928001`「量筒」，状态 `draft`，仅 zh 译文已发布）与 1 篇文章；`site_setting_translations` 为空 → 各语言标题走全局名（页面标题会是「玄砚 | 玄砚」，需要时再补各语言 site_title）。 |
| 中 | SMTP 未配置 | 密码重置邮件不可用（`SMTP_*` 为空），日志有 "No email adapter provided" 警告。 |
| 中 | 翻译 worker 无密钥 | V2.0 自动翻译需在后台配置 DeepSeek key（`/manage` → 自动翻译 → LLM 设置），未配置时相关接口返回明确的不可用原因。 |
| 低 | 停在 prod 的服务 | 按要求已停 btc5m 与 eth_option_bot（ig_option_bot 本就未运行）。它们的 nginx vhost（`python_backend.conf`、`python_eth_option_bot.conf`）仍指向 8000/5001，访问会 502 —— 用户决定是否一并停用配置。 |
| 低 | 遗留文件 | `/root/suns-prod-release-20260927.tar.gz`（13:13，顶层目录 `suns-cms/`）是本次部署前已存在于服务器的包，未使用，可自行处置。 |

## 7. 本次部署踩坑记录（下次务必复用）

1. **`.next` 跨平台搬运**：Windows 构建产物里有 4 处写死的构建机绝对路径（`required-server-files.json` 的 `outputFileTracingRoot`/`root`/`repoRoot`/`appDir`）。上传后必须用正则改成服务器路径 —— `prod-deploy.sh` 已自动化。
2. **`.next/node_modules/<pkg>-<hash>` 依赖残缺（最隐蔽）**：Next 把 `serverExternalPackages`（pg/sharp 等）复制进 `.next/node_modules`，这些副本是**构建机 trace** 出来的，在 pnpm 隔离结构下解析不到自身传递依赖。实测 sharp 缺 `detect-libc`，导致 `/admin`、`/manage`、`/api/*` 全部 500（`/en` 因是静态文件反而 200，极具迷惑性）。修法：把 `<pkg>-<hash>` 目录换成指向 `node_modules/.pnpm/<pkg>@x/node_modules/<pkg>` 的软链，并在 PM2 env 里设 `NODE_PATH=<项目根>/node_modules/.pnpm/node_modules` 兜底。
3. **PG 缺 pgcrypto**：宝塔的 PostgreSQL 用 `--without-openssl --prefix=/www/server/pgsql` 编译，不带 contrib。服务器上正好有 `/usr/local/src/postgresql-18.0.tar.gz`，用 PGXS 就地编译：
   ```bash
   cd /usr/local/src/postgresql-18.0/contrib/pgcrypto
   make USE_PGXS=1 PG_CONFIG=/www/server/pgsql/bin/pg_config \
        PG_CPPFLAGS="-DUSE_OPENSSL" SHLIB_LINK="-lz -lcrypto"
   make USE_PGXS=1 PG_CONFIG=/www/server/pgsql/bin/pg_config install
   ```
   关键点：宝塔 PG 未开 OpenSSL，**必须显式 `-DUSE_OPENSSL` 并链接 `-lcrypto`**，否则 `CREATE EXTENSION pgcrypto` 会在创建 `digest()` 时报 `could not load library`。另外 `make clean` 也要带 `USE_PGXS=1 PG_CONFIG=...`，否则不生效、静默复用旧 `.o`。项目实际只用核心内置的 `gen_random_uuid()`，pgcrypto 仅为满足 `001_extensions.sql` 的 `CREATE EXTENSION`。
4. **PM2 别包 pnpm**：`pm2 start pnpm -- --filter @suns/cms start` 时，PM2 只追踪 pnpm 包装进程（~85MB），真正的 `next-server` 是子进程 → `max_memory_restart` 失效，重启还会留下占住 3001 的孤儿进程。改为 `interpreter:/usr/local/bin/node` + `script: node_modules/next/dist/bin/next`。
5. **`pkill -f "next-server"` 是自杀命令**：模式会匹配到执行它的那个 shell 自身（命令行里含该字符串），导致脚本中途被杀；而且它会误杀同机的 myworkbuddy `next-server`。**本次已实际误杀 orangebook 一次**（PM2 自动拉起，中断数十秒）。停进程请用 PM2 或精确 PID。
6. **`pnpm` 不在服务器 PATH**：宝塔 node 的 bin 目录没进 PATH，且 Node 未带 corepack。用 `npm i -g pnpm@10.17.1` 后软链到 `/usr/local/bin/pnpm`。
7. **`.env` 与 `.env.example` 变量名不一致**：代码实际读 `MEDIA_DIR` / `STORAGE_PROVIDER`，而仓库现有 `.env` 写的是 `MEDIA_ROOT` / `MEDIA_STORAGE_PROVIDER`（都被忽略，靠默认值恰好一致）。生产 `.env` 已改用正确变量名。
8. **打包遍历要剪枝**：pnpm 的 `node_modules` 里有坏 junction（如 `@suns/geo`），`pathlib.rglob` 会直接抛 `FileNotFoundError`；必须用 `os.walk` + `dirnames` 过滤。
9. **`try { return promise } catch {}` 不捕获拒绝（2026-09-27 修复）**：`apps/cms/src/server/api.ts:60` 原为 `return v2Api(...)`，而 `try { return p } catch {}` 只在 `return await p` 时才把拒绝交给 catch。后果：v2/v21/V3 路由里抛出的所有 `DomainError`/`ZodError` 逃出错误映射，全部变成 **HTTP 500 空响应**。实测证据：生产 `cms.err.log` 有 14 条 `status: 404` 的 DomainError 变成 500，且 catch 分支标记 `API failure` 出现 **0 次**；`node -e` 直接复现两种写法差异。排查同类问题的判据：**看日志里有没有 catch 分支自己的标记**——没有标记就说明 catch 根本没执行，别去怀疑 instanceof。
10. **`/unsubscribe` 必须由 CMS 提供并在 nginx 反代白名单内（2026-09-27 修复）**：生产不跑 `apps/web`（打包也排除 `apps/web/.next`），公开产物里没有该页，`location /` 的 `@resolve` 兜底只回 CMS 的 404。修法两步：① `apps/cms/src/app/unsubscribe/route.ts`（镜像 `apps/web` 的同名路由，加 `X-Content-Type-Options: nosniff`）；② nginx 的 `location ~ ^/(admin|manage|api|media|graphql|_next|unsubscribe)(/|$)`。**nginx vhost 是手工放置的，`prod-deploy.sh` 只备份、不部署** —— 改完必须 `nginx -t && nginx -s reload`，并同步仓库副本 `_deploy/nginx/opctools.cloud.conf` 与 `infrastructure/nginx/default.conf`。

## 8. 2026-09-27 V3.0 同步记录（AI Agent / GEO 监测 / 完整 CRM / 营销自动化 / BI）

| 项 | 内容 |
|---|---|
| 数据库 | 迁移 `017`~`021` 已应用（共 21 个业务迁移）。**016~021 的 sha256 已写入生产 `schema_migrations`** —— 此后**不要修改这些文件**，任何改动会让 `migrate.mjs` 直接报 `Applied migration changed` 中止发布；要改就新增 `022`。 |
| 新增环境变量 | `GEO_MONITOR_SECRET`、`MARKETING_UNSUBSCRIBE_SECRET` 已写入生产 `.env`（各 96 位十六进制，600 www:www）；**CMS 与 Worker 必须一致**（worker 靠 `dotenv` 读 `../../.env`，依赖 PM2 的 `cwd=apps/worker`）。`MARKETING_DELIVERY_URL/TOKEN` 未配置 → 营销 `configured()` 恒为 false，发送总开关默认关闭。 |
| 新增后台入口 | `/manage` 首页新增：客户与商机（`inquiry_desk`）、营销自动化、经营报表、GEO 监测中心、AI Agent；旧「增长研究 → GEO」「协作与增长 → 变化与趋势」改为引导到 GEO 监测中心。 |
| 验收 | 带管理员会话直连 127.0.0.1:3001 验证 5 个新接口全部 200；错误映射 404/400/401 正确；公网 9 语言 + `/admin` `/manage` + `/unsubscribe` 全通过。验收脚本：`/tmp/verify-v3-hotfix.sh`（口令在服务器本机读取，token 不回显）。 |
| 备份 | DB `/root/suns-backups/suns-20260927_221019.dump`（`pg_restore -l` 769 项可读）、`.env` `/root/suns-backups/env-*.bak`、nginx `/www/wwwroot/opctools/_server_backup/nginx_20260927_222058/`、`.next` `/www/wwwroot/opctools/_backup_20260927_221931/`。 |

**回滚**：代码/产物用 `_backup_20260927_221931/.next` 覆盖 `apps/cms/.next` 后 `pm2 restart suns-cms`；nginx 用 `_server_backup/nginx_20260927_222058/` 覆盖后 `nginx -s reload`；数据库用 `pg_restore` 恢复 dump（注意 `migrate.mjs down` 会**不可逆删除** CRM/营销/GEO/BI 全部数据，且 019 的 down 必须由 migrate.mjs 按倒序执行，手工单跑会被 020 的外键挡住）。

## 9. 2026-09-28 /manage 首页改版（玄砚响应式工作台）

| 项 | 内容 |
|---|---|
| 改动 | `/manage` 首页从「dashboard 卡片」改为交互式响应式工作台：按「内容与多语 / 搜索与 GEO / 客户与经营 / 协作与发布」切换功能区，入口直达既有业务页并沿用后台权限；品牌统一为「玄砚」。新增 `HomeDashboard.tsx` + `home-dashboard.css`，`page.tsx` 接入，`layout.tsx` 元数据改品牌。 |
| 部署前修复 | ① 构建报 `TS2739`：`page.tsx` 的 `dashboard` 状态是 `Row\|null`，与 `HomeDashboard` 的 `DashboardData` 不兼容 —— 改为从 `HomeDashboard` 导出 `DashboardData` 并给状态声明该类型（不加 `as any`）；② `build-prod.ps1` 构建失败仍以退出码 0 结束，导致 `sync-prod.ps1` 的 `$LASTEXITCODE` 检查失效、会拿失败/陈旧的 `.next` 继续部署 —— 已补两处 `if ($LASTEXITCODE -ne 0) { throw }`。 |
| 构建 | `pwsh -File _deploy/build-prod.ps1`：TypeScript 通过、5/5 静态页、`BUILD_ID=Kt4XEB1MJnww2YXI7eyMg`（与 prod 上线值一致）。 |
| 本地验证 | 无头 Chrome + CDP（`.runtime/verify-homepage-ui.mjs`）：登录 200；品牌「玄砚」、英雄区标题/CTA 正常；4 个功能区切换后面板内容确实变化；工具卡跳转进入「页面与文章」；移动端 390px 无横向溢出；**0 控制台错误 / 0 运行时异常**。截图 `.runtime/shots/home-dashboard/`。 |
| 部署 | `pwsh -File _deploy/sync-prod.ps1 -SkipBuild`（打包 2137 文件 / 20.3MB；迁移 021 全部 applied 无新增；健康检查第 1 次通过；公网 8 项验收全 200）。 |
| 备份 | `.next` → `/www/wwwroot/opctools/_backup_20260928_001544/`。 |
| prod 验证 | ① `BUILD_ID` 一致，`.next/static` 内含 `.xy-home-hero` 的 CSS（`040jyuup42nd9.css`）与新首页文案的 JS（`087t79b08ogv4.js`）；② 管理员登录 200；③ `/api/v1/meta` + `/api/v1/dashboard` 均 200，按前端 `showPrimary` 同款逻辑推导：**16/16 入口可见、4 个功能区全部会渲染、指标条 4 项全显示、最近发布 4 条**；④ 重启后 `cms.err.log` 无新错误。脚本：`.runtime/verify-prod-homepage.sh`、`.runtime/check-home-visibility.mjs`。 |
| 已知非阻塞项 | **curl 用 `payload-token` cookie 访问 `/api/v1/*` 恒定 401，而同一 token 用 `Authorization: JWT` 200**；本地对照实验结论相同（非 prod 故障、非本次引入），浏览器路径正常（本地真实 Chrome 已验证 meta+dashboard 均 200）。故 prod 契约验证改用 Bearer。若后续要写服务器侧巡检脚本，请用 Bearer 而非 cookie。 |
| 回滚 | `rm -rf /www/wwwroot/opctools/apps/cms/.next && cp -a /www/wwwroot/opctools/_backup_20260928_001544/.next /www/wwwroot/opctools/apps/cms/.next`，再 `su -s /bin/bash www -c "export HOME=/home/www PATH=/usr/local/bin:/usr/bin:/bin; pm2 restart suns-cms"`。 |

## 10. 2026-09-28 公开站首页改版（编辑式首页，packages/ui）

| 项 | 内容 |
|---|---|
| 改动 | `packages/ui/src/index.ts`（+31/−6）：新增 `homepage()` 编辑式首页渲染（intro / proof / collection / craft 四段 + 9 语言文案 `homeWords`）、无内容时的默认页脚 `defaultFooterLinks`、hero 视觉优先级与轮播 caption 调整、`<main class="home-page">`；`packages/ui/src/premium.ts`（+75）：`.home-page / .home-intro / .home-proof / .home-collection / .home-craft` 等样式与 4 档响应式断点。`styles.ts`、`browser.ts`、`packages/publisher` 未变。 |
| 影响面 | **不只是后台**：`packages/ui` 被 `packages/publisher`（静态站生成器）引用 → 决定 nginx 直出的公开页面 HTML 与 `/assets/site.css`；同时影响 CMS 预览（`v2-api.ts` 的 `renderHTML`）与 `apps/web`（prod 不跑）。 |
| ⚠️ 关键 | **改代码后必须跑一次全站重建**，否则公开页面仍是旧版（静态产物不会自动跟随）。触发方式：`POST /api/v1/publish {"resource":"site"}`（带 Bearer + `Origin`，非 GET 必须带 Origin），worker 消费 `publish_jobs`。脚本：`.runtime/rebuild-prod-site.sh`。 |
| 本地验证 | worker 为 `tsx watch`（自动热载）→ 本地重建后 `static-site/{en,zh,ja}/index.html` 均含 `home-page/home-intro/home-proof`，`assets/site.css` 含 `.home-page`；无头 Chrome 实渲染 en/zh：四段全出、本地化文案正确、3 个产品卡、底色 `rgb(248,247,241)` 生效、**无横向溢出（1440/390）、0 控制台错误、0 异常**。脚本：`.runtime/verify-public-home-ui.mjs`（strict/lenient 两档）。 |
| 构建/部署 | `BUILD_ID=-SLGJFzMqP6hNT_sYiv9f`；`pwsh -File _deploy/sync-prod.ps1 -SkipBuild`，备份 `/www/wwwroot/opctools/_backup_20260928_003556/`，迁移无新增，健康检查第 1 次通过，公网 8 项 200。 |
| static-site 备份 | `/root/suns-backups/static-site_20260928_003622.tar.gz`（20K，重建前状态）。 |
| prod 验证 | 重建后 `en/zh/ja/index.html` 含 `home-page/home-intro/home-proof`，`assets/site.css` 含 29 处 `.home-page`；**公网真实浏览器验证**（en/zh + 390px）通过：无溢出、0 报错 0 异常；PM2 `suns-cms` 235MB / `suns-worker` 59MB，restarts=0，部署后 cms/worker 错误日志为空。 |
| 内容依赖（重要） | prod 当前 `home-collection`/`home-craft` **不输出**——前者需产品数据（prod 产品数 0），后者需「首页轮播」第二张（`heroes[1]`）；hero 区也只有文字没有图片。即**新版首页在 prod 目前只呈现 hero + intro + proof + CTA**，要完整效果需先在 `/manage` 配置「首页轮播（2 张以上）+ 产品 + 站点信息」，再跑一次全站重建。另站点名仍是种子默认值 "SUNS Glassware"（第 6 节遗留项）。 |
| 回滚 | 代码/产物：用 `_backup_20260928_003556/.next` 覆盖 `apps/cms/.next` 后 `pm2 restart suns-cms`（worker 走源码，需 `pm2 restart suns-worker` 才回退）。公开产物：`tar -xzf /root/suns-backups/static-site_20260928_003622.tar.gz -C /www/wwwroot/opctools` 覆盖 `static-site`（无需 reload nginx）。 |

## 11. 2026-09-28 热修：客服渠道表单的 jsonb 报错（用户实测反馈）

| 项 | 内容 |
|---|---|
| 现象 | 在「高级管理 → 客服渠道 → 新建」提交后，页面顶部红条显示 `Expected property name or '}' in JSON at position 1 (line 1 column 2)`，完全不知道哪里要改（该通知会一直保留到下一次操作，所以切到「站点翻译」页也还能看到，容易误判成那一页的问题——实测 `site_setting_translations` **没有** jsonb 字段，不可能产生此错）。 |
| 根因 | `customer_service_channels.config` 是 `jsonb NOT NULL DEFAULT '{}'`，CMS 把所有 jsonb 字段一律渲染成自由文本域，提交时 `submit()` 里做**裸 `JSON.parse`**（旧 [page.tsx:88](apps/cms/src/app/(console)/manage/page.tsx#L88)）。用户按 JS 字面量写 `{email:"a@b.com"}`（键没引号）即抛 V8 原始 SyntaxError。服务端 `catch` 会把未知异常统一转成 503 通用文案，所以这种原始消息**只可能来自浏览器端**（定位判据）。 |
| 修法 | ① 新增 `parseJsonField()`：jsonb 解析失败时抛中文提示，并点名字段（`「联系方式」不是合法 JSON：字段名缺少英文双引号…`），原因经 `jsonErrorReason()` 从 V8 消息翻译（缺引号／内容没写完／结尾多内容／非法字符），弹窗保持打开可当场改；② 补 `labels`：`config:'联系方式'`、`channel_type:'渠道类型'`（原先显示原始列名）；③ `customer_service_channels.config` 改为**结构化输入**——按 `channel_type` 决定键（`email→email`、`phone|whatsapp→phone`、其余含 `ai_chat/wechat/line/messenger/contact_form→url`，与 `packages/ui` 公开站渲染一致），并保留「高级：直接编辑 JSON」回退。 |
| 验证 | `tsc --noEmit` 通过；本地无头 Chrome 复跑用户路径（`.runtime/verify-channel-form.mjs`）：结构化输入保存成功（提示「已保存。站点级配置不会随单条内容发布…」）；高级 JSON 填 `{email:"x@y.com"}` → 提示「「联系方式」不是合法 JSON：字段名缺少英文双引号…」且弹窗保持打开；0 控制台错误、0 异常；测试数据已清理。 |
| 部署 | `BUILD_ID=8l5jBVAPtJigVsa0S8JXc`；备份 `_backup_20260928_011545/`；prod 只读核验：chunk `0e50qd2xcr_ls.js` 含新文案、`/api/v1/records?resource=customer_service_channels` 200、`config` 类型 jsonb、`/manage` 与 `/en` 200。 |
| 注意 | 客服渠道属 schema 级配置（见 `registry.ts` 的 `rebuildRequired`），**保存后必须点「重新生成已发布页面」**，公开站的客服入口才会出现；按语言的客服欢迎语在「站点翻译」的 `customer_service_welcome`。 |
| 回滚 | 用 `_backup_20260928_011545/.next` 覆盖 `apps/cms/.next` 后 `pm2 restart suns-cms`。纯前端改动：无迁移、无数据变更。 |

## 12. 2026-09-28 后台可用性改造：字段中文化 + 图片就地上传 + 资源页指引

| 项 | 内容 |
|---|---|
| 背景（用户实测反馈） | ① 列表与表单里到处都是 `duration_ms`、`text_position`、`overlay_opacity` 这类英文列名，新手不知道是什么、该填什么；② 新建「首页轮播」必须先到「图片与文件」上传图片，且**没有任何提示**，操作路径反直觉。 |
| 盘点（先量化再动手） | 数据库实际有 **250 个字段**，而 `page.tsx` 的 `labels` 只有 **67** 条 → **183 个字段没有中文标签**；列表对没有 `views` 的资源直接 `slice(0,7)`，于是把 `duration_ms/text_position/overlay_opacity` 顶到表头。 |
| 改动 | ① 新增 [field-meta.ts](apps/cms/src/app/(console)/manage/field-meta.ts)：`fieldLabels`（250 列全量中文）、`tableFieldLabels`（同名列在不同表的覆盖，如 roles.code=角色标识）、`fieldHints`（易误解字段一句话说明）、`fieldChoices`/`tableChoices`（文本字段的可选值，含 channel_type 中文选项）、`resourceGuides`（资源页指引＋分步＋是否需图片）；② [page.tsx](apps/cms/src/app/(console)/manage/page.tsx)：`field()` 重写为可读实现——标签走 `labelFor`、说明走 `hintFor`、有选项的渲染成下拉、时间字段用 `datetime-local`（`toLocalInput`）、媒体字段（`*_media_id`）增加「＋ 直接上传新图片」（`uploadAndSelect`：上传→自动选中→显示预览）、需要图片的资源在顶部显示「去「图片与文件」上传」按钮；③ 列表：为 hero_slides / customer_service_channels / locales / menus / faq / seo_metadata 等补 `views`，表头与单元格统一走 `labelFor`，单元格对枚举值显示中文（`center`→`居中`）；④ 资源页顶部渲染 `resourceGuides` 的中文步骤。 |
| 验证 | `tsc --noEmit` 通过；本地无头 Chrome 端到端复跑「高级管理 → 首页轮播 → 新建」（`.runtime/verify-hero-form.mjs`）：资源页出现 5 步中文指引；表头全中文；表单为「桌面端大图／展示时长（毫秒）／文案位置（下拉：左侧/居中/右侧）／图片压暗程度」且各带说明；**在字段内直接上传 PNG → 提示「已上传并选中：xy-test-hero.png，保存后生效」→ 显示预览 → 保存成功**；列表行显示文件名与「居中」；0 控制台错误、0 异常；测试数据已清理（轮播仍 4 条、测试图片 0 张）。 |
| 覆盖率校验 | `.runtime/check-label-coverage.mjs` 逐个比对数据库真实列名：**250/250 全中文，缺失 0**（首轮漏了 `author_id/auto_generated/document_type/is_hierarchical/is_primary/is_system/target_translation_id` 共 7 个，已补并二次发布）。 |
| 部署 | `BUILD_ID=j_dYYACQ_Hg-ljarip_3P`（前一次 `qY7BXjjxuoQ4KR7CnpVMo`）；备份 `_backup_20260928_024114/`；prod 只读核验：chunk `3ciabj3oeb5rk.js`/`2dtv6q-4iu5ir.js` 含全部新文案，`hero_slides` 接口 200，`/manage`、`/en`、`/admin` 均 200。 |
| 后续约定（写给下一个人） | 新增数据库字段后**必须**在 `field-meta.ts` 补 `fieldLabels`，否则后台会直接暴露英文列名；媒体字段以 `_media_id` 结尾即自动获得「直接上传新图片」；可枚举的 text 字段请补 `fieldChoices`/`tableChoices`，否则用户会看到英文取值（如 `center`、`ai_chat`）。 |
| 回滚 | 用 `_backup_20260928_024114/.next` 覆盖 `apps/cms/.next` 后 `pm2 restart suns-cms`。纯前端改动：无迁移、无数据变更。 |

## 13. 2026-09-28 修「加了两张轮播只显示一张」

| 项 | 内容 |
|---|---|
| 现象 | 用户在生产给首页加了两张轮播图，公开站只显示第一张。 |
| 根因（prod 数据实测） | 公开站取轮播的 SQL（`packages/domain/src/documents.ts:11`）是 `hero_slides h JOIN hero_slide_translations t ON t.hero_slide_id=h.id AND t.locale_id=$1` —— **内连接**：每张图在每个语言下都要有一条文字记录。prod 实测：第 1 张有 `zh,en` 文字（能显示），**第 2 张一条文字都没有 → 在任何语言下都被过滤掉**（已发布快照里 `heroes` 只有 1 条）。这与是否重建无关，也不是轮播脚本问题（`site.js` 的轮播逻辑正常，`slides.length<2` 会直接不启动）。 |
| 修法（都属“别再让用户踩坑”） | ① **列表直接标出来**：首页轮播列表的「桌面端大图」列显示 `blide-1.jpg（文字：zh/en）` 或 `（未填文字：公开站不会显示）`；② **资源页顶部橙色警示**：列出漏填的图（`⚠ 有 N 张轮播还没填任何语言的文字（第 X 张），公开站不会显示它们`）+「去「轮播翻译」补文字」直达按钮；③ **保存提醒**：保存轮播后提示「每张轮播都要在『轮播翻译』里至少填一种语言」；④ **引用名称兜底**（`packages/domain/src/reference-labels.ts` 新增 `fallbackLabel`）：没有文字的轮播以前在「轮播翻译」的下拉里只显示「记录 #xxxx」，现在显示「第 N 张 · 图片文件名」，否则用户根本认不出该补哪张图；⑤ 指引文案补上这条规则。 |
| 验证 | 本地端到端（`.runtime/verify-hero-lang-warning.mjs`）：建一张无文字轮播 → 出现警示且列表标注「未填文字：公开站不会显示」→ 补一条翻译后 → 该行变「（文字：zh）」、警示不再包含它；`tsc`（domain + cms）通过；实测 `reference-labels` 对无文字轮播返回「第 1 张 · blide-1.jpg」，浏览器里「轮播翻译」的下拉选项全部可读、无「记录 #xxxx」。测试数据已清理。 |
| 部署 | `BUILD_ID=qbO1piAtQcd3cW51j-_3i`；备份 `_backup_20260928_030202/`；prod 只读核验：新文案在 `3c3d-py1l8kir.js`，domain 兜底名称已随 PM2 重启生效，`/manage`、`/en` 200。 |
| 待用户操作 | 第 2 张轮播需要在「轮播翻译」里补文字（选「第 2 张 · 6971042b…」+ 选语言 + 填标题/副标题），然后回「首页轮播」点「重新生成已发布页面」。另：第 1 张目前只有 `zh,en` 两种语言的文字，其余 7 个启用语言看不到它；其标题仍是测试文案「你好，标题 / 这里是副标题」。 |

## 14. 2026-09-29 V3.1 同步（采购导向首页 / 产品采购资料 / 多产品 RFQ + 私有附件）

| 项 | 内容 |
|---|---|
| 来源 | 本轮是 Codex 在本地落盘的一版（[V3.1 外贸获客体验升级](docs/V3.1-外贸获客体验升级.md)，2026-09-28 03:33 完成）：当时只有 TypeScript 编译通过，**本地库与生产库都未升级**。本次核查后同步 prod。 |
| 代码面 | `packages/ui`（`index.ts`/`trade.ts`/`rfq-browser.ts`/`trade-style.ts`/`browser.ts`/`styles.ts`）、`packages/publisher/src/index.ts`、`packages/domain`（`documents.ts`/`workflow.ts`/`reference-labels.ts`）、`apps/cms`（`server/api.ts` 新增 `trade-product`、`rfq-attachment` 路由；`page.tsx`/`field-meta.ts`/`ProductTradeEditor.tsx`/`V2Workspaces.tsx` 及 CSS）。 |
| 数据库 | `022_trade_conversion.sql` 于 **2026-09-29 19:49:52 +08 应用**。纯增量：products 加 `min_order_quantity`/`lead_time_days`；product_translations 加 `order_unit`/`packaging_details`/`customization_details`/`sample_policy`；inquiries 加 `target_delivery_on`/`specification_notes`/`preferred_incoterm`；新表 `inquiry_attachments`（bytea ≤5MB，CHECK `octet_length(content)=file_size`，FK ON DELETE CASCADE）。回滚脚本会删除新增数据，须先备份。 |
| 部署前修复 | `tests/render.test.ts` 两条断言自 9/28 改版起就失效（旧契约：hero caption 必须是指向产品的链接、容器类名 `section-intro`）；线上自 9/28 00:35 起已是 `<div class="hero-caption">` 编号标签 + `home-collection` 产品卡。已按新契约改写断言（保留原测试意图），`pnpm test` 恢复 **17/17**。属陈旧断言，非 V3.1 回归。 |
| 本地验证 | `pnpm -r typecheck` 6/6、`pnpm test` 17/17；本机嵌入式 PG（`.runtime/connection.json`，55432）先备份再应用 022，结构核对 9 列 + 表 + 5 个 CHECK + 索引齐全；以生产产物 `next start` 真跑 `.runtime/smoke-rfq.mjs` **12/12**（201 提交、交付字段落库、明细快照取自已发布译文、附件 bytea 大小自校验、未登录下载 401、同 key 幂等、未发布产品 400、伪装 PNG 400、非法 incoterm 400、过去日期 400、重复产品 400、测试数据清理）；构建 `BUILD_ID=ZtdkK9swIClRCKGwBeZ-l`（此前本地 `.next` 仍是上一轮的 `qbO1piAtQcd3cW51j-_3i`，**不可用 `-SkipBuild` 复用**）。 |
| 部署 | `pwsh -File _deploy/sync-prod.ps1 -SkipBuild`：打包 2145 文件 / 20.4MB（自检无 `.env`/源码 `node_modules`/`.next` cache）；`.next` 备份 `_backup_20260929_194948/`；构建机路径修正 4+4 处、外部包软链修 8 个；健康检查第 1 次通过；8 项公网验收全 200。 |
| DB 备份 | 部署前补做 `/root/suns-backups/suns-20260929_194929.dump`（`pg_restore -l` 961 条目可读，600 root）。生产仍**没有**定时备份任务（第 6 节遗留项未解决）。 |
| 全站重建 | `.runtime/rebuild-prod-site.sh`：先备份 `/root/suns-backups/static-site_20260929_195008.tar.gz`，rebuild 任务 6 秒完成。`en/zh/ja/index.html` 含 `class="home-page"`/`home-intro`/`home-proof`/`home-craft`（zh 另有 `home-collection`），`assets/site.css` 41 处 `.home-page`；公网 `/en` 200 且标记一致。公开脚本已带询价单能力：`site.js` 含 `data-rfq`(4)/`rfq-count`(1)/`询价`(2)，`site.css` 含 `.rfq`(14)。 |
| prod V3.1 验证 | `.runtime/verify-prod-v31.sh`（在服务器本机跑，口令不回显、测试数据即时清理）**6/6 PASS**：提交 201、新增列落库（FOB / specification_notes / target_delivery_on）、附件 bytea 与声明大小一致、未登录下载附件 401、同 key 幂等、非法 incoterm 400（非 500）、蜜罐 200 且 0 建单；同一 IP 连打第 7 次起返回 **429**，证明限流在 prod 生效。 |
| 日志/资源 | 重启后 `cms.err.log` 最后一条仍是 2026-09-27 的旧记录，`worker.err.log` 为空；PM2 `suns-cms` ~247MB / `suns-worker` ~15MB，restarts=0（同机 orangebook ~421MB）。 |
| 遗留（需用户操作） | ① prod **没有已发布的产品译文**（`published_documents` 里 product_translations = 0，products 仅 1 条）→ 公开站询价单选不到产品，强行提交会 400 `Product is unavailable`；需在 `/manage` 补齐产品资料并逐语言「发布」后重建。② 站点名仍是种子默认 "SUNS Glassware"、索引未开。③ 产品采购资料（MOQ/交期/包装等）须逐语言重新发布后才会进入公开页快照。 |
| 踩坑（新增，务必复用） | **不要用工作区路径正则批量杀 node 进程**：`Get-CimInstance Win32_Process` 按 `suns-New-code\apps\(cms\|web\|worker)` 过滤会把**正在跑的 `next build`** 一并杀掉（本次实测构建被误杀退出码 1；`build-prod.ps1` 的退出码守卫拦住了陈旧产物部署，是守卫生效）。停进程前先打印清单、按 PID 排除当前构建。另：**SSH 里嵌套引号写 SQL 会静默给出错误结果**（本次 `information_schema.columns` 查询因引号嵌套返回 0，一度误判「022 表不存在」）——一律用 `psql -f -` + heredoc 传 SQL。 |
| 回滚 | 代码/产物：`rm -rf /www/wwwroot/opctools/apps/cms/.next && cp -a /www/wwwroot/opctools/_backup_20260929_194948/.next /www/wwwroot/opctools/apps/cms/.next`，再 `su -s /bin/bash www -c "export HOME=/home/www PATH=/usr/local/bin:/usr/bin:/bin; pm2 restart suns-cms"`（worker 走源码，需另行 `pm2 restart suns-worker`）。公开产物：`tar -xzf /root/suns-backups/static-site_20260929_195008.tar.gz -C /www/wwwroot/opctools`。数据库：`pg_restore` 恢复 `suns-20260929_194929.dump`（`migrate.mjs down` 会删新增数据，不首选）。 |

## 15. 2026-09-29 生产库备份落地 + 品牌改「玄砚」+ 产品多语言机翻草稿

### 15.1 数据库备份（第 6 节最高优先级遗留项，已解决）

| 项 | 内容 |
|---|---|
| 起因 | 生产此前**没有任何** DB 备份任务；V3.1 起 RFQ 附件以 bytea 存库，数据库成为附件唯一数据源，风险升级。 |
| 实现 | 新增 `infrastructure/scripts/backup-db.sh`（仓库内为唯一来源）+ `infrastructure/cron/suns-backup.cron`；服务器 `/etc/cron.d/suns-backup` 每日 **03:37** 执行。内容 = `pg_dump`（custom 格式，压缩）+ `.env`（600）+ `media/` tar；保留 **14 天且至少最近 7 份**；日志 `/var/log/suns-backup.log`（超 5MB 自动截断）。 |
| 安全设计 | 备份全部 `600 root` 存 `/root/suns-backups/db/`（含明文 `.env`，故不给 www 读）；`--no-owner --no-privileges` 便于灾难恢复到任意新库；写完立即 `pg_restore -l` 校验条目数，**校验不过就丢弃半成品并退出非零**，绝不留下坏备份。 |
| 实测（2026-09-29 20:41） | 手工运行 exit 0：`suns-20260929_204140.dump` 468K / **966 条目 / 123 张表数据**；`media-*.tar.gz` 5.1M / 28 文件；`env-*.bak` 1.5K。 |
| crond 真触发 | 临时装 `/etc/cron.d/suns-backup-test`（每分钟 `date >> marker`），实测 **20:45:01 / 20:46:01 / 20:47:01 三次准时触发**后删除临时项 —— 证明 cron.d 被 crond 正常读取。 |
| 恢复演练（关键，脚本 `.runtime/verify-backup-restore.sh`） | `suns` 角色**没有 CREATEDB**（`permission denied to create database`），改用本机 trust 的 `postgres` superuser 建临时库；备份是 600 root，演练时拷贝一份给 postgres 读。`pg_restore --single-transaction` 退出码 **0**、stderr 空；源库 vs 恢复库计数全部一致（**115 张 public 表 / 22 条迁移 / products 1 / product_translations 1 / published_documents 47 / media_assets 3 / inquiry_attachments 存在**）；抽样行可读（`690020260928001 | 量筒`）；临时库已 DROP。 |
| 自动化纳入部署 | `prod-deploy.sh` 新增 `6b/8 同步数据库备份定时任务（幂等）`：每次部署用仓库内 cron 文件覆盖 `/etc/cron.d/suns-backup`，避免服务器侧配置漂移（与仓库 `git diff` 核对为 **+9 行、0 删除**）。 |
| 恢复操作（灾难时） | `pg_restore --dbname="<连接串>" /root/suns-backups/db/suns-<时间戳>.dump`（`--no-owner` 已写入 dump）；media 用 `tar -xzf media-<时间戳>.tar.gz -C /www/wwwroot/opctools`；`.env` 用 `env-<时间戳>.bak`（600）。 |

### 15.2 站点品牌改「玄砚」并上线

| 项 | 内容 |
|---|---|
| 改动 | `site_settings.site_name`：`SUNS Glassware` → **玄砚**（经 `PATCH /api/v1/records?resource=site_settings` 写入，HTTP 200，`audit_logs` 已记 update）。 |
| 上线 | 全站重建（先备份 `/root/suns-backups/static-site_20260929_205140.tar.gz`）；核验 `zh/index.html` 含「玄砚」**2 处**、含 `SUNS Glassware` **0 处**、标题 `<title>玄砚 | 玄砚</title>`。 |
| 遗留 | `site_setting_translations` 为空 → 各语言站点标题都回落到全局名，标题呈「玄砚 \| 玄砚」。需要时补各语言 `site_title`（属内容决策，未擅自填写）。 |

### 15.3 产品多语言机翻（草稿态，待人工审核）

| 项 | 内容 |
|---|---|
| 现状 | 产品仅 1 条（SKU `690020260928001`「量筒」，`status=draft`）；译文 9 条：**zh 已发布**，en/de/fr/es/it/pt/ja/ko 为**机翻草稿**（`publish_status=draft`），8 个 `translation_jobs` 状态停在 **`review`** —— 平台设计上机翻不自动上线。 |
| 机翻质量实测 | 产品名翻译正确：Graduated cylinder / Messzylinder / Probeta / Éprouvette graduée / Cilindro graduato / メスシリンダー / 메스실린더 / Proveta。**但描述是中文占位句的直接翻译**（zh 原文「这个是量筒啊这个是量筒啊」）。 |
| 处理决定（用户 2026-09-29 拍板） | **先修中文原文再重跑翻译**，故本轮**未发布任何译文**（避免占位文案进 8 个语言的公开页与 sitemap）。 |
| 已备脚本 | `.runtime/retranslate-product.sh`（改完 zh 原文后 `overwriteDraft=true` 重跑并等 worker 完成，打印新草稿供审核）；`.runtime/publish-translations.sh`（审核通过后逐语言发布 → 全站重建 → 逐语言公网核验，且带**占位文案熔断**：命中 `这个是量筒｜This is a graduated cylinder｜…` 即中止，除非 `FORCE=1`）。 |
| 待用户操作 | 在 `/manage` 修改产品中文名称/描述（真实参数、包装、定制、样品政策等），然后运行上述重跑 + 发布脚本；`Published` 后各语言产品页才会出现（当前只有 zh 有已发布快照）。 |

### 15.4 本轮新增踩坑（务必复用）

1. **SSH「无 banner 即断」多半是客户端代理问题，不是服务器**：本轮 SSH 反复 `kex_exchange_identification: Connection closed`（TCP 可连、站点 200、服务器 sshd `active`、无 fail2ban），我最初误判为服务端 MaxStartups/fail2ban。实际原因是**本机代理开了 TUN 模式**，关掉即恢复。以后按此排序排查：先查本机代理/VPN → 再看服务器侧。
2. **跨层引号写 SQL 会「静默返回错误结果」而不是报错**：本轮两次因此误判（`information_schema.columns` 返回 0 被读成「022 的表不存在」；`publish_status='draft'` 查询返回 0 行被读成「草稿消失」）。**结论：凡 SSH 里跑 SQL，一律 `psql -f -` + heredoc 传，不要内联引号**。
3. **不要用整段正则替换改脚本**：本轮用 PowerShell `-replace` 批量替换 `"$DUMP"` 时，把 `install ... "$DUMP" "$WORK"` 一并替换成自我拷贝；另一次 edit 的 `old_string` 多吃了两行，把 `prod-deploy.sh` 的「执行迁移」命令删掉（已用 `git diff` 核对修复为 +9/-0）。改脚本一律精确 edit + 改完 `git diff` 复核。
4. **读日志不要凭肉眼截断**：我曾在截断的 rebuild 日志里把 `ja` 段当成 `zh`，误报「产品区消失」；实际 `zh/index.html` 含「量筒」与 `home-collection`。核验要看具体文件/查询结果，不看日志尾部推断。

## 16. 2026-09-29 V3.2–V3.4 同步（报价协作 / 市场内容与服务时限 / 获客漏斗与门户）

来源：Codex 于 2026-09-29 20:09–20:30 在本地落盘（记录见 [V3.2–V3.4 外贸业务升级](docs/V3.2-V3.4-外贸业务升级.md)），当时只做了本地库迁移与编译检查。本轮由我核查后同步 prod。

| 项 | 内容 |
|---|---|
| 迁移 | `023_trade_operations.sql` 于 **2026-09-29 21:16 应用**。新增 6 张表：`trade_quotes`（不可变版本 + 状态机）、`trade_quote_events`、`trade_portal_grants`（令牌只存 SHA-256）、`trade_market_cards`、`trade_service_rules`、`trade_visits`；`inquiries` 加 `first_response_at`、`response_due_at`、`visit_id`；两个函数 + 三个触发器（含 **`inquiries` 的 BEFORE INSERT SLA 触发器**，动到线上询盘写入路径）。回滚脚本 `023_trade_operations.down.sql`（会删本轮业务数据）。 |
| 代码面 | `packages/domain/src/trade-operations.ts`、`apps/cms/src/server/trade-api.ts`（`/api/v1/trade/*`）、`apps/cms/.../manage/TradeDesk.tsx` + `trade-desk.css`（后台「外贸业务」五区）、`packages/ui/src/trade-public.ts`（原产地下拉 + 市场卡片 + 访问采集）、`trade-portal.ts`（客户/渠道门户）。**未引入新环境变量**，worker 本轮无改动。 |
| 公开接口 | `GET /api/v1/trade-public/cards`（限流 120/min，支持 `cf-ipcountry`）、`POST .../visit`（同源 + 60/min）、`GET .../portal-page`（CSP `default-src 'none'`、no-store）、`GET .../portal` 与 `POST .../decision`（Bearer 邀请令牌 + 60/min）。 |
| 本地验收 | `pnpm -r typecheck` 6/6、`pnpm test` 17/17；本机 023 已应用并核对 6 表/3 列/2 触发器；以生产产物 `next start` 真跑：`.runtime/smoke-rfq.mjs` **12/12**（证明 023 触发器未破坏询盘链路）、`cards` 200、`portal-page` 200、未登录 `trade/workspace` 401、`visit` 正确载荷 `{"ok":true}` 且落库（`.runtime/check-trade-tables.mjs` 实证）。构建 `BUILD_ID=rGabWh6CuiM1WMKYowG_v`。 |
| 部署 | 部署前跑 `backup-db.sh`（`suns-20260929_211552.dump` 476K / 966 条目）；`sync-prod.ps1 -SkipBuild`（2156 文件 / 20.5MB 自检通过）；`.next` 备份 `_backup_20260929_211610/`；**新增的 `6b/8 备份 cron 幂等同步`步骤首次在生产生效**；健康检查一次通过；8 项公网验收全 200。 |
| 生产核验 | `.runtime/verify-prod-v32.sh`：**18/18 PASS** —— 023 结构 6 项、`cards` 200、`visit` 200、未登录 `trade/workspace` 401、假令牌门户 401「邀请无效或已过期」、**询盘写入回归 201 且新列正确为 NULL、测试数据已清理**、`/manage` 200、构建产物含五个新功能区文案。 |
| 全站重建 | 先备份 `/root/suns-backups/static-site_20260929_211634.tar.gz`，重建后：`site.js` 含 `data-trade-public` / `data-trade-cards` / `data-analytics-choice` / `suns_trade_visit` / `suns_analytics_v2`，`site.css` 含 `.trade-public-grid` / `.trade-entry` / `.trade-expiry`；**zh 与 en 首页已挂载** `data-trade-public`（市场/服务卡片区，无卡片时显示空状态）。PM2 `suns-cms` ~252MB、`suns-worker` 正常，重启后 cms/worker 错误日志无新增。 |
| 未验收（需业务侧） | ① **多人审核**：报价提交审核需两个账号（管理员不能审核自己编制的报价），prod 目前只有 `admin@opctools.cloud`；② **客户/渠道邀请**的端到端查看与确认；③ **证书/案例/服务承诺/首响时限**等真实资料需运营在 `/manage` 填写（本轮未预置任何虚构证明）。④ 报价流程依赖 RFQ，而 prod 目前产品译文未全部发布（第 15.3 节），需先补齐产品再走报价。 |
| 另一轮未完成 | Codex 在 2026-09-29 20:35 之后开始规划**宣传页扩展**（演示工作台 6→12 功能区），会话结束于规划阶段，工作区 `玄砚企业智慧营销CMS系统-交互宣传页.html` 未被修改 —— 此轮**未落盘**，不在本次同步范围。 |
| 回滚 | 代码/产物：`rm -rf /www/wwwroot/opctools/apps/cms/.next && cp -a /www/wwwroot/opctools/_backup_20260929_211610/.next /www/wwwroot/opctools/apps/cms/.next` 后 `pm2 restart suns-cms suns-worker`；公开产物：`tar -xzf /root/suns-backups/static-site_20260929_211634.tar.gz -C /www/wwwroot/opctools`；数据库：`pg_restore` 恢复 `suns-20260929_211552.dump`（`023.down.sql` 会删除本轮报价/邀请/卡片/规则/会话数据，不首选）。 |

## 17. 2026-09-30 后台易用性改造（AI 驱动向导 + client 角色 + 新手模式）

> 目标：把「小白客户」的教育成本降到接近零。核心思路 = AI 生成草稿 → 人工审核 → 一键发布，而非让用户填字段。完整设计见 `docs/后台易用性改造方案.md`。

| 项 | 内容 |
|---|---|
| 迁移 | `024_add_client_role.sql` 于 2026-09-30 11:39 应用。新增 `client` 角色 + 11 权限（content/product/media/appearance 读写 + leads.read + publishing.read/write）。**决策：给 client `publishing.write` 自助发布**（AI 一键发布闭环的前提；rebuildSite 仅重渲染、无破坏性）。 |
| 代码面 | ① AI 发文章：`AIWriting.tsx` 加「发布上线/保存草稿」双按钮，打通 save→requestPublish；② AI 发产品：新增 `packages/domain/src/ai-product.ts`（`generateProduct`/`saveProductDraft`）+ `ProductWizard.tsx` + `/ai-product` 路由；③ 新手模式：新增 `ClientHome.tsx`（5 任务卡）+ `page.tsx` 按角色/模式切导航；④ 手动切换：顶栏「新手/完整模式」按钮（`localStorage xy-mode-<userId>` 记忆）；⑤ 询盘简化：`V2Workspaces.tsx` 新询盘置顶 + 快速回复模板。 |
| 角色接入 | `AdminUsers.ts` role select 加 `client`；`registry.ts` roleGroups 加 `client`。 |
| 本地验证 | `pnpm -r typecheck` 6/6、`verify-client-role.ts` 权限断言 ALL PASS、`next build` 成功。 |
| 部署 | 部署前手动 `backup-db.sh`（`suns-20260930_113845.dump` 500K/1016 条目/129 表数据）；`sync-prod.ps1` 全流程（构建 571ms→打包 2164 文件 20.6MB→上传→迁移 024→PM2 重启→健康检查第 1 次通过）；公网 8 项验收全 200。 |
| prod 核验 | `roles` 表 client 存在，`role_permissions` 11 条与本地一致；`.next` 备份 `_backup_20260930_113942/`。 |
| 回滚 | 代码/产物：`cp -a /www/wwwroot/opctools/_backup_20260930_113942/.next /www/wwwroot/opctools/apps/cms/.next` 后 `pm2 restart suns-cms suns-worker`；迁移：`migrate.mjs down`（`024.down.sql` 删 client 角色与权限关联）。 |
| 遗留（需用户操作） | ① **LLM key 已配置**（`runtime_settings.translation.llm` enabled=true、hasKey=true、model=deepseek-flash，且 `.env` 有 `TRANSLATION_API_KEY` 双源）；② client 看询盘是「看全站」（单站点场景，多租户隔离未做）。 |

### 17.1 后续两次修复（端到端实测暴露）

创建 client 用户 + 无头浏览器端到端时，暴露了两个「client 角色接入 Payload」的遗漏，均已修复并重新部署：

| 项 | 内容 |
|---|---|
| `025_add_client_role_enum.sql` | **根因**：Payload 的 `role` select 字段在 DB 是 enum `enum_cms_admin_users_role`，固定 6 个旧值，不含 `client`；生产 `PAYLOAD_SCHEMA_PUSH=false` 不会自动同步 → 创建 client 用户报 `invalid input value for enum ... "client"`。修法：`ALTER TYPE ... ADD VALUE IF NOT EXISTS 'client'`（down 留空注释，Postgres 不支持删 enum 值）。 |
| `026_add_product_run_link.sql` | **根因**：`ai_writing_runs.saved_translation_id` 外键指向 `content_item_translations`（文章），而 AI 产品 `saveProductDraft` 把**产品**翻译 id 写进去 → 外键 23503，表现为「字段格式、必填值或关联记录不符合数据约束」。修法：加列 `saved_product_translation_id`（引用 `product_translations`），`ai-product.ts` 的 runId 关联改用该列。 |
| 端到端验证 | 无头 Chrome + CDP 走完整流程，**全绿**：client 登录 200 → 新手模式 5 任务卡（发文章/发产品/改首页/看询盘/我的内容）→ 发文章（AI 生成「How to Choose the Right Laboratory Glassware」→ 一键发布 published）→ 发产品（AI 生成「Borosilicate Glass Graduated Cylinder 100ml」→ 一键发布 published）。截图 `.runtime/shots/client-e2e/`。 |
| 测试数据 | 端到端产生的测试产品/文章/生成记录已清理（`DELETE FROM products/content_items/ai_writing_runs WHERE created_at > now()-interval '45 min'`）。 |
| 测试账号 | `client-demo@opctools.cloud`（role=client，密码已单独告知用户）已创建，供用户体验新手模式；如需删除：`/admin` 或 SQL 删 `payload_internal.cms_admin_users` + `public.users` 对应行。 |
| 回滚补充 | 025/026 的 down：`026` 删 `saved_product_translation_id` 列；`025` 无法删 enum 值（留空）。其余同第 17 节。 |


