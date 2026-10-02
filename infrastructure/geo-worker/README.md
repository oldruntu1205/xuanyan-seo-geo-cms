# GEO 地区 Worker 部署（美国 / 法兰克福）

> 目标：把 `apps/worker/src/geo-region.ts` 部署到**目标地区的机器**上，让它声明 `GEO_WORKER_REGION_CODE`、
> 每 30 秒写心跳、只认领**本地区**的采样任务。机制与边界见 `docs/V3-GEO-监测本地升级记录.md`。
>
> 为什么必须是目标地区的机器：采样要回答「**该市场的买家问 AI 同一个问题，答案里有没有我们的品牌**」，
> 答案可能随**请求出站位置**变化。代码只认「声明的地区」（`geoWorkerIdentity()` 读 `GEO_WORKER_REGION_CODE`，
> 心跳写 `geo_worker_heartbeats`，认领 SQL 里写死 `r.code=$1`），**不做出口 IP 核验**。

## 0. 前置事实（2026-10-02 实测，别凭印象）

| 项 | 事实 |
| --- | --- |
| prod PG 监听 | **仅 `127.0.0.1:5432`**（未对外）⇒ 地区 Worker 必须通过 **SSH 隧道**（或 VPN）访问数据库 |
| 认领过滤 | `claimGeoSampleJob(regionCode)` 的 SQL：`… AND r.code=$1 AND r.is_enabled AND t.is_enabled AND m.is_enabled AND p.is_enabled` |
| 地区代码规则 | `^[a-z0-9][a-z0-9_-]{1,39}$`（小写、2–40 位）→ `us`、`de` 合法 |
| 心跳要求 | `geo_worker_heartbeat` 会校验 `geo_regions` 里存在且 `is_enabled=true`，否则抛「Worker 地区未启用」 |
| 密钥 | ① 专用模型密钥（`credential_source='profile'`）用 **`GEO_MONITOR_SECRET`**（≥32 字符）解密；<br>② 复用站点密钥（`site_default`）需要 **`PAYLOAD_SECRET`**（与 prod 相同）才能解出 `runtime_settings['translation.llm']` 里的 key |
| Node | worker 用 tsx 直跑 TS 源码，**无需构建**；prod 在 Node 22 上运行 |

## 1. 在 prod 侧准备（一次性）

```bash
# 1) 建地区行（后台「GEO 监测中心 → 模型与地区」也能建，二选一）
#    code=us / de，display_name 如「美国（弗吉尼亚）」「德国（法兰克福）」
# 2) 建一个**只允许端口转发**的隧道账户（不要直接用 root）
useradd -m -s /bin/bash geotunnel && mkdir -p /home/geotunnel/.ssh && chmod 700 /home/geotunnel/.ssh
# 把两台 VPS 各自的公钥写进 authorized_keys（**不要**用同一把钥匙给两地，便于单独吊销）
cat >> /home/geotunnel/.ssh/authorized_keys <<'EOF'
from="<VPS1_IP>",no-agent-forwarding,no-pty,no-X11-forwarding,permitopen="127.0.0.1:5432" ssh-ed25519 AAAA...geo-us
from="<VPS2_IP>",no-agent-forwarding,no-pty,no-X11-forwarding,permitopen="127.0.0.1:5432" ssh-ed25519 AAAA...geo-de
EOF
chown -R geotunnel:geotunnel /home/geotunnel/.ssh && chmod 600 /home/geotunnel/.ssh/authorized_keys
```

> `permitopen="127.0.0.1:5432"` 是关键：即使密钥泄露，也只能转发到本机数据库那一个端口。

## 2. 打包并上传（在本机开发机执行）

```powershell
# 只打源码与锁文件（依赖在 VPS 上用 npmjs 现装），产物约几 MB
python _deploy/pack-geo-worker.py
# 然后上传（示例）
scp _deploy/dist/geo-worker-*.tar.gz root@<VPS1_IP>:/tmp/
scp infrastructure/geo-worker/bootstrap.sh root@<VPS1_IP>:/tmp/
```

## 3. 在 VPS 上引导（每台一条命令）

```bash
sudo bash /tmp/bootstrap.sh /tmp/geo-worker-<stamp>.tar.gz us     # 法兰克福那台换成 de
```

脚本会：装 Node 22 + pnpm → 建 `sunsgeo` 用户与 `/opt/suns-geo` → 解包 →
`pnpm install --frozen-lockfile --filter @suns/worker...`（**不装 CMS 那套 Next.js 依赖**）→
写 `/opt/suns-geo/.env.geo`（600）→ 装 `suns-geo-worker.service` 与 `geo-tunnel.service` 并启动。
**`.env.geo` 里的两个密钥由你填**（脚本不会代填，也不该经手）。

```ini
# /opt/suns-geo/.env.geo（模板由脚本生成）
DATABASE_URL=postgresql://suns:<PG_PASSWORD>@127.0.0.1:15432/suns   # 指向本地隧道端口
GEO_WORKER_REGION_CODE=us
GEO_WORKER_ID=vps-us-1
GEO_MONITOR_SECRET=<与 prod 相同的值，≥32 字符>
PAYLOAD_SECRET=<与 prod 相同的值（仅当模型用 site_default 密钥时需要）>
GEO_WORKER_CONCURRENCY=3
NODE_ENV=production
```

## 4. 验收（三条，缺一不可）

```bash
systemctl status suns-geo-worker geo-tunnel --no-pager      # 两个服务都 active
journalctl -u suns-geo-worker -n 20 --no-pager              # 应看到 "GEO regional worker online: us (…)"
```

```sql
-- 在 prod 库上查心跳（应每 30 秒刷新一次）
SELECT r.code, w.worker_id, w.last_seen_at
FROM geo_worker_heartbeats w JOIN geo_regions r ON r.id=w.region_id
WHERE w.last_seen_at > now() - interval '2 minutes' ORDER BY r.code, w.worker_id;
```

后台「GEO 监测中心 → 在线 Worker」也应显示两台；然后对 `us`/`de` 地区各建一个**采样目标**并手动提交一次，
观察 `geo_samples` 里 `region_code` 是否为 `us`/`de`、以及费用是否落到对应日/月窗口。

## 5. 注意与坑

- **不要**在同一台机器上声明多个地区来"假装"多地区：代码不核验出口 IP，能跑，但趋势里写的是假地区，
  比不跑更糟（`docs/V3-GEO-监测本地升级记录.md` 已把这条列为边界）。
- 隧道断了心跳会消失（2 分钟窗口），后台会显示离线；`geo-tunnel.service` 用 `autossh` 自动重连。
- 任务失败或 Worker 中断**可能已在供应商侧计费**却没有完整 token 用量 —— 后台会明确记失败，需人工对账。
- 日/月预算窗口按 **UTC** 结算，两侧时区不影响账。
