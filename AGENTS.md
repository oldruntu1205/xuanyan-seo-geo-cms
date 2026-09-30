# AGENTS.md · SUNS / 玄砚 SEO·GEO 多语言 CMS

> 本文件是**项目级**规矩，只写本项目特有的东西；分层路由（L1–L4）的通用规矩见 `~/.dsh/AGENTS.md`，冲突时以本文件为准，**「跨工作区纪律」除外（不得放宽）**。
> 收尾期（2026-09-30 起）的状态与全部欠账见 [docs/待验收与遗留清单.md](docs/待验收与遗留清单.md) —— **开工前先看它**。

## 1. 项目背景

| 项 | 值 |
| --- | --- |
| 产品 | SUNS / 玄砚 —— SEO·GEO 多语言（9 语言）静态 CMS：后台管理 + 后台发布 Worker + nginx 直出静态产物 |
| 技术栈 | pnpm 10 monorepo（7 个工作区）/ Node 22 / TypeScript / Next.js + Payload CMS / PostgreSQL 16+ / Redis + BullMQ |
| 开发工作区 | `H:\suns-New-code`（本目录，git 仓库） |
| prod | `https://www.opctools.cloud`（`43.132.209.126`，OpenCloudOS 9.6，2 核 / 1.96 GB） |
| prod 布局 | 项目根 `/www/wwwroot/opctools`；PM2 `suns-cms`(3001) / `suns-worker`；静态产物 `static-site/` 由 nginx 直出（不过 Node）；PG 18 库/用户均 `suns`；Redis 6379 |
| 关键目录 | `apps/{cms,web,worker}`、`packages/{domain,ui,publisher,seo,geo,schema,media,i18n}`、`database/`（001–026 + `rollback/`）、`infrastructure/`、`tests/`、`.runtime/`（本机运行时与取证脚本，**不进 git**） |
| 全量部署与踩坑记录 | [`_deploy/DEPLOY-PROD.md`](_deploy/DEPLOY-PROD.md)（第 7 / 14 / 15.4 节是"别再踩"清单） |
| 远端仓库 | **私有 `https://github.com/oldruntu1205/xuanyan-seo-geo-cms`**（`origin`，跟踪 `main`）。**push 走 HTTPS + gh 凭据**（`gh auth setup-git`，令牌存系统 keyring）：本机代理 TUN 会拦 GitHub 的 22 端口（`Connection closed by 198.18.0.131`），SSH 若要可用必须改走 `ssh.github.com:443` 并把公钥登记到账号。push 后 GitHub Actions 会跑 `.github/workflows/ci.yml`（含 `pnpm db:verify`，是对验证链最硬的独立验收） |

## 2. 命令段（L3 全靠这里，均为 2026-09-30 实测）

| 用途 | 命令 | 期望结果 |
| --- | --- | --- |
| 类型检查 | `pnpm -r typecheck` | exit 0，6/6 工作区 |
| 单元测试 | `pnpm test` | exit 0，17/17 pass |
| 生产构建 | `pwsh -File _deploy/build-prod.ps1` | 退出码 0；**构建必须在开发机**（prod 只有 1.96 GB，构建会 OOM 并波及同机站点） |
| 数据库全量验证 | 先起本地运行时库（见下），再 `node infrastructure/scripts/verify.mjs --local-runtime` | ✅ 2026-09-30 绿灯（exit 0）：建临时库 → **Payload bootstrap（auth:migrate）** → 业务迁移 001–026（含「025 必须 applied + enum 含 client」两道断言）→ `verify.sql` → `tests/integration.ts` → 全量回滚 → 重迁移（再断言）→ 删库。⚠️ 新增前置：需 `PAYLOAD_SECRET` 与已安装的 CMS 依赖；Payload 若索要交互确认，脚本**立即失败**而非自动确认 |
| 数据库迁移 | `pnpm db:migrate` / `node infrastructure/scripts/migrate.mjs status` | 生产 `up` 由 `sync-prod.ps1` 自动执行 |
| 本地全栈演示 | `pwsh -File infrastructure/scripts/local-demo.ps1`（停止：`local-demo-stop.ps1`） | 起嵌入式 PG(55432) + Redis(6379) + 迁移 + cms(3001)/web(3000)/worker + 健康检查。⚠️ 是 **.ps1**，用 `node` 跑会抛 `ERR_UNKNOWN_FILE_EXTENSION` |
| 部署 prod | `pwsh -File _deploy/sync-prod.ps1`（`-SkipBuild` 复用现有 `.next`） | 构建 → 打包 → 上传 → 迁移 → PM2 重启 → 公网验收；前端产物改动**必须重建全站**才可见 |
| 测试目录（L2 只读） | `tests/` | — |

**本机数据库口径（极易踩）**：`.env` 的 `DATABASE_URL` 指向 `localhost:5432`（Docker 路径），但**本机无 Docker**，5432 被机器级 `C:/pg` 占用 → 照 README 直接 `pnpm db:verify` 会 `28P01` 认证失败。本项目自己的运行时库是 **`.runtime/pg-data`（127.0.0.1:55432）**，连接串在 `.runtime/connection.json`，命令行用 `--local-runtime` 让脚本读它。

```powershell
# 起本地运行时库（用完可 pg_ctl stop）
& .runtime/node_modules/@embedded-postgres/windows-x64/native/bin/pg_ctl.exe start `
  -D .runtime/pg-data -l .runtime/logs/postgres.log -o "-p 55432 -h 127.0.0.1" -w
```

## 3. 高风险清单（本项目只有这些 diff 才值得花 L1 终审）

1. **数据库迁移**：`database/*.sql` 与 `database/rollback/*`
   - **已应用的迁移（001–026）一律不许改**：生产 `schema_migrations` 里登记了 sha256，改动会让 `migrate.mjs` 抛 `Applied migration changed` 并**中止发布**；要改就新增 `027+`。
   - 回滚脚本会删数据（`025` 的 down 留空，PG 不支持删 enum 值）。
2. **部署与 prod 配置**：`_deploy/**`、`infrastructure/nginx/**`、`infrastructure/cron/**`、`.env*`
   - prod nginx vhost 是**手工放置**的，`prod-deploy.sh` 只备份不部署 —— 改完必须 `nginx -t && nginx -s reload`，并同步仓库副本。
3. **鉴权 / 权限**：`payload_internal` 里的 `cms_admin_users` 角色、`role_permissions`、`client` 角色、门户邀请令牌（只存 SHA-256）、CSP。
4. **对外 API 契约**：`/api/v1/**`（含 `trade-public`、门户 `portal`）、公开站 `site.js`/`site.css` 的 DOM 契约（改 `packages/ui` 会同时影响 nginx 直出的静态页）。
5. **触发器与并发**：`inquiries` 的 BEFORE INSERT SLA 触发器（动线上询盘写入路径）、报价不可变版本状态机、BI 的 `REPEATABLE READ` 事务。
6. **不可逆操作**：`migrate.mjs down`、`pg_restore`、`pm2 delete`、覆盖 prod `static-site/`。执行前必须警告 + 列影响 + 等授权。

低风险（后台文案、CSS、`field-meta.ts` 标签、`.runtime` 取证脚本、内部重构）→ 自审 + `pnpm test` 兜底即可。

## 4. 本项目的 L1–L4 配比（收尾期，2026-09-30 定）

**前提**：项目的瓶颈已从"产量"转为"定位 + 回归保护"。所以：

| 层 | 收尾期只干这些 | 本项目的具体落法 |
| --- | --- | --- |
| **L1** Codex | ① 出**可执行断言**（不是业务代码）② 高风险 diff 终审 ③ 疑难攻坚 | 只喂「最小失败包 + 片段 + 行号」。本机 `codex` **没有 CLI**，走**人工搬运**到 Codex 桌面端；需要攻坚档时按 `H:\DualAgent\设置方案\README.md` 第 4 节一行命令切 `model_reasoning_effort=high`，用完切回 |
| **L2** 会话主模型 | 按断言实现、修 bug（**≤3 轮**）、机械重构 | **不许改 `tests/`**；3 轮不绿就停手打失败包 |
| **L3** DSH 本体 | 侦察、取证、量基线、跑测试、部署、定时巡检 | 复用既有脚本：`.runtime/smoke-rfq.mjs`、`verify-prod-v31.sh`、`verify-prod-v32.sh`、`verify-client-e2e.mjs`、`verify-backup-restore.sh`、`.runtime/rebuild-prod-site.sh` |
| **L4** 本地 14B | 短输入（≤1.5K token）逐项变换：重命名、格式化、样板 | 调用器 `H:\DualAgent\tools\local14b.ps1`。**计数/去重/提取/排序一律用正则或 shell 算**，不要交给任何模型 |

三类活的标准路径：

| 活 | 第一步（L3，零模型成本） | 何时升级 L1 | 验收 |
| --- | --- | --- | --- |
| **Bug 修复** | 最小复现（`node -e` / curl / SQL）+ 日志铁证 | 复现不了 / **同一错误栈第 2 次** / 边界不清 | `pnpm test` Exit 0 |
| **功能优化** | 先量 **before 基线**（查询条数、响应 ms、包体、文件数） | 要动对外契约或权限 | L3 量 after：**无数字对比不叫优化** |
| **流程优化** | 把现状读成状态机（状态 × 事件 × 权限 × 幂等） | **必出 SPEC**（几乎总命中第 3 节高风险清单） | `verify.mjs` + 对应 e2e 脚本 |
| **机械清理** | 正则列出全部命中点 | 一般不需要 | 正则复查 + `typecheck` |

## 5. 本项目专属踩坑（写在代码里的教训）

- **改了 `packages/ui` / `packages/publisher`** → nginx 直出的公开页**不会自动跟随**，必须触发一次全站重建（`.runtime/rebuild-prod-site.sh`，或后台「重建已发布站点」）。
- **新增数据库字段** → 必须在 `apps/cms/.../manage/field-meta.ts` 补 `fieldLabels`，否则后台直接暴露英文列名；可枚举字段补 `fieldChoices`。
- **前台轮播**：每张图在每个语言下都要有 `hero_slide_translations` 记录（SQL 是内连接），漏填 = 该图在公开站**完全不显示**。
- **SSH 里跑 SQL 一律 `psql -f -` + heredoc**，内联引号会**静默返回错误结果**（已被误判过两次）。
- **不要用工作区路径正则批量杀 node 进程**：会连带杀掉正在跑的 `next build`。
- **停进程用 PM2 或精确 PID**：`pkill -f "next-server"` 会匹配到执行它的 shell 自身，并误杀同机其他站点。
- **SSH「无 banner 即断」先查本机代理/VPN（TUN 模式）**，再查服务器。
- **`.next` 跨平台搬运**有 4 处写死构建机绝对路径 + `serverExternalPackages` 软链问题，`prod-deploy.sh` 已自动化，不要手工搬。

## 6. 交付纪律（兜底）

- 交付四要素：**改了什么 → 怎么验证 → 怎么回滚 → 遗留风险**。
- **没有测试 Exit 0 就不算完成**；代码落盘 ≠ 生产上线（本项目所有 V2/V3 记录都强调这一点）。
- 不可逆操作前：警告 + 列影响 + 等明确授权。
- 一个功能一个会话；会话阶段做完（≥1500 事件或磁盘 ≥1.5 MB）就收尾换新会话。
