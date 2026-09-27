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
| **高** | 生产库无备份任务 | 已确认 root crontab 与宝塔计划任务里**都没有** PostgreSQL 备份。上线前应加 `pg_dump` 定时任务并验证可恢复。 |
| **高** | 内存余量偏紧 | 1.96 GB 总量，常态占用约 76%（suns-cms ~290MB、suns-worker ~60MB、orangebook ~350MB）。已给 CMS/Worker 设 `max-old-space-size` 与 PM2 `max_memory_restart` 自保；若新增服务需先评估。 |
| 中 | 搜索引擎索引未开启 | `site_settings.enable_indexing=false` → `robots.txt` 为 `Disallow: /`、sitemap 为空。内容就绪后在 `/manage` 开启并「重建已发布站点」。 |
| 中 | 站点内容为空 | 当前为初始空站点（仅各语言首页骨架），`site_name` 仍是种子默认值 "SUNS Glassware"，需在 `/manage` 配置站点信息与内容。 |
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
