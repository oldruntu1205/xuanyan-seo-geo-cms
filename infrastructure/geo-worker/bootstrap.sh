#!/usr/bin/env bash
# GEO 地区 Worker 引导脚本（在**目标地区的 VPS**上以 root 运行）
#   sudo bash bootstrap.sh /tmp/geo-worker-<stamp>.tar.gz us
#
# 做四件事：装运行时 → 解包到 /opt/suns-geo → 装依赖（只装 worker 这条链）→ 装并启动两个 systemd 服务
#   · suns-geo-worker : 地区采样 Worker（tsx 直跑 apps/worker/src/geo-region.ts）
#   · geo-tunnel      : autossh 隧道，把 prod 的 127.0.0.1:5432 映射到本机 127.0.0.1:15432
#
# ⚠️ 密钥不由本脚本填写：脚本只生成 /opt/suns-geo/.env.geo 模板并 chmod 600，
#    由你手工填入 GEO_MONITOR_SECRET / PAYLOAD_SECRET / DATABASE_URL 密码，再 systemctl restart。
set -euo pipefail

ARCHIVE="${1:?用法: bootstrap.sh <geo-worker tar.gz> <region-code>}"
REGION="${2:?用法: bootstrap.sh <geo-worker tar.gz> <region-code>（如 us / de）}"
APP=/opt/suns-geo
RUN_USER=sunsgeo
PROD_SSH_HOST="${PROD_SSH_HOST:-43.132.209.126}"
PROD_SSH_USER="${PROD_SSH_USER:-geotunnel}"
TUNNEL_LOCAL_PORT="${TUNNEL_LOCAL_PORT:-15432}"

[ -f "$ARCHIVE" ] || { echo "找不到归档：$ARCHIVE" >&2; exit 1; }
case "$REGION" in
  [a-z0-9]*) ;;
  *) echo "region code 必须是小写开头（^[a-z0-9][a-z0-9_-]{1,39}$）" >&2; exit 1;;
esac

echo "== 1/5 运行时（Node 22 + pnpm）=="
if ! command -v node >/dev/null || [ "$(node -v | cut -c2-3)" -lt 20 ]; then
  if command -v apt-get >/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - >/dev/null
    apt-get install -y nodejs >/dev/null
  else
    curl -fsSL https://rpm.nodesource.com/setup_22.x | bash - >/dev/null
    yum install -y nodejs >/dev/null
  fi
fi
node -v
corepack enable >/dev/null 2>&1 || true
corepack prepare pnpm@10.17.1 --activate >/dev/null 2>&1 || npm i -g pnpm@10.17.1 >/dev/null
pnpm -v

echo "== 2/5 用户与目录 =="
id -u "$RUN_USER" >/dev/null 2>&1 || useradd -m -s /bin/bash "$RUN_USER"
mkdir -p "$APP"
tar -xzf "$ARCHIVE" -C "$APP"
chown -R "$RUN_USER:$RUN_USER" "$APP"

echo "== 3/5 依赖（只装 worker 这条链，不装 CMS 的 Next.js）=="
su -s /bin/bash "$RUN_USER" -c "cd $APP && pnpm install --frozen-lockfile --filter @suns/worker..." 2>&1 | tail -5

echo "== 4/5 环境模板（请手工填密钥后 restart）=="
if [ ! -f "$APP/.env.geo" ]; then
cat > "$APP/.env.geo" <<EOF
# 由 bootstrap.sh 生成：把 <...> 换成真实值（密钥与 prod 保持一致）
DATABASE_URL=postgresql://suns:<PG_PASSWORD>@127.0.0.1:${TUNNEL_LOCAL_PORT}/suns
GEO_WORKER_REGION_CODE=${REGION}
GEO_WORKER_ID=vps-${REGION}-1
GEO_MONITOR_SECRET=<与 prod 相同的 GEO_MONITOR_SECRET，至少 32 字符>
PAYLOAD_SECRET=<与 prod 相同的 PAYLOAD_SECRET（仅当模型复用站点密钥时需要）>
GEO_WORKER_CONCURRENCY=3
NODE_ENV=production
EOF
fi
chmod 600 "$APP/.env.geo"; chown "$RUN_USER:$RUN_USER" "$APP/.env.geo"

echo "== 5/5 systemd（worker + autossh 隧道）=="
command -v autossh >/dev/null || { command -v apt-get >/dev/null && apt-get install -y autossh >/dev/null || yum install -y autossh >/dev/null; }

cat > /etc/systemd/system/geo-tunnel.service <<EOF
[Unit]
Description=autossh tunnel to prod PostgreSQL (${PROD_SSH_USER}@${PROD_SSH_HOST}:5432 -> 127.0.0.1:${TUNNEL_LOCAL_PORT})
After=network-online.target
Wants=network-online.target

[Service]
User=${RUN_USER}
Environment=AUTOSSH_GATETIME=0
ExecStart=/usr/bin/autossh -M 0 -N -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -o ExitOnForwardFailure=yes -o StrictHostKeyChecking=accept-new -i /home/${RUN_USER}/.ssh/id_ed25519 -L 127.0.0.1:${TUNNEL_LOCAL_PORT}:127.0.0.1:5432 ${PROD_SSH_USER}@${PROD_SSH_HOST}
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

cat > /etc/systemd/system/suns-geo-worker.service <<EOF
[Unit]
Description=SUNS GEO regional sampling worker (region=${REGION})
After=network-online.target geo-tunnel.service
Wants=network-online.target geo-tunnel.service

[Service]
User=${RUN_USER}
WorkingDirectory=${APP}/apps/worker
EnvironmentFile=${APP}/.env.geo
ExecStart=/usr/bin/env node ${APP}/apps/worker/node_modules/tsx/dist/cli.mjs src/geo-region.ts
Restart=always
RestartSec=10
StandardOutput=append:/var/log/suns-geo-worker.log
StandardError=append:/var/log/suns-geo-worker.log

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now geo-tunnel.service
systemctl enable --now suns-geo-worker.service

echo
echo "== 完成（还差两步人工）=="
echo "1) 生成隧道密钥并把公钥登记到 prod 的 ~geotunnel/.ssh/authorized_keys（已带 permitopen 限制）："
echo "     sudo -u ${RUN_USER} ssh-keygen -t ed25519 -N '' -f /home/${RUN_USER}/.ssh/id_ed25519"
echo "     sudo -u ${RUN_USER} cat /home/${RUN_USER}/.ssh/id_ed25519.pub   # 贴到 prod"
echo "2) 填 ${APP}/.env.geo 的三个 <...>，然后："
echo "     systemctl restart geo-tunnel suns-geo-worker && systemctl status --no-pager suns-geo-worker geo-tunnel"
echo "3) 验收：journalctl -u suns-geo-worker -n 20 --no-pager  应出现 'GEO regional worker online: ${REGION}'"
