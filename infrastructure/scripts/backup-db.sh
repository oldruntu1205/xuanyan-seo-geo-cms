#!/bin/bash
# SUNS 生产库备份（服务器侧，由 /etc/cron.d/suns-backup 每夜调用）
#
# 为什么需要它：DEPLOY-PROD.md 第 6 节的最高优先级遗留项就是「生产库无备份任务」。
# V3.1 起 RFQ 附件以 bytea 存进数据库，故数据库备份是附件唯一的数据保障。
#
# 设计要点（都可测）：
#   1. pg_dump 自定义格式 + 压缩：单库体积小（约 0.5MB 级），可用 pg_restore 选择性恢复。
#   2. 写完立刻用 pg_restore -l 校验条目数 > 0，失败则删掉半成品并退出非零 —— 宁可不留坏备份。
#   3. 保留策略：最近 14 天 + 至少最近 7 份；先算保留集合再删，避免把新备份删掉。
#   4. 每次同时留一份 .env（600）：恢复时没有它连不上库；不含任何回显。
set -uo pipefail

APP="${APP:-/www/wwwroot/opctools}"
ENV_FILE="$APP/.env"
DEST="${DEST:-/root/suns-backups/db}"
LOG="${LOG:-/var/log/suns-backup.log}"
PGBIN="${PGBIN:-/www/server/pgsql/bin}"
KEEP_DAYS=14
KEEP_MIN=7

ts=$(date +%Y%m%d_%H%M%S)
mkdir -p "$DEST"
chmod 700 "$DEST"

log() { echo "$(date '+%F %T') $*" >> "$LOG"; }

[ -f "$ENV_FILE" ] || { log "ERROR 缺少 $ENV_FILE"; exit 1; }
URL=$(grep -m1 '^DATABASE_URL=' "$ENV_FILE" | cut -d= -f2-)
[ -n "$URL" ] || { log "ERROR .env 里没有 DATABASE_URL"; exit 1; }

OUT="$DEST/suns-$ts.dump"
TMP="$OUT.part"

# --- 1) 导出 ---
if ! "$PGBIN/pg_dump" --dbname="$URL" --format=custom --compress=6 --no-owner --no-privileges --file="$TMP" 2>>"$LOG"; then
  log "ERROR pg_dump 失败，已丢弃半成品"
  rm -f "$TMP"
  exit 1
fi

# --- 2) 校验（条目数 + 可读性）---
ENTRIES=$("$PGBIN/pg_restore" --list "$TMP" 2>/dev/null | grep -c '^[0-9]')
if [ "${ENTRIES:-0}" -lt 1 ]; then
  log "ERROR 备份校验失败（pg_restore -l 条目数=$ENTRIES），已丢弃"
  rm -f "$TMP"
  exit 1
fi

mv "$TMP" "$OUT"
chmod 600 "$OUT"
SIZE=$(du -h "$OUT" | cut -f1)
TABLES=$(grep -c '^[0-9].*TABLE DATA' <("$PGBIN/pg_restore" --list "$OUT") || true)
log "OK $(basename "$OUT") size=$SIZE entries=$ENTRIES tableData=$TABLES"

# --- 3) 附带 .env（600）---
cp -f "$ENV_FILE" "$DEST/env-$ts.bak"
chmod 600 "$DEST/env-$ts.bak"

# --- 3b) 媒体文件（nginx 直出的图片，磁盘上不可再生；体积很小）---
MEDIA_SRC="$APP/media"
MEDIA_OUT="$DEST/media-$ts.tar.gz"
if [ -d "$MEDIA_SRC" ]; then
  if tar -czf "$MEDIA_OUT.part" -C "$APP" media 2>>"$LOG"; then
    mv "$MEDIA_OUT.part" "$MEDIA_OUT"; chmod 600 "$MEDIA_OUT"
    log "OK $(basename "$MEDIA_OUT") size=$(du -h "$MEDIA_OUT" | cut -f1) files=$(tar -tzf "$MEDIA_OUT" | wc -l)"
  else
    log "WARN media 打包失败，已丢弃半成品"; rm -f "$MEDIA_OUT.part"
  fi
fi

# --- 4) 保留策略：按时间保最近 KEEP_MIN 份，并删除超过 KEEP_DAYS 的 ---
prune() {
  local pattern="$1" min="$2" days="$3" i f
  local -a all
  mapfile -t all < <(ls -1t $pattern 2>/dev/null)
  for i in "${!all[@]}"; do
    f="${all[$i]}"
    [ "$i" -lt "$min" ] && continue
    if [ -n "$(find "$f" -mtime +"$days" 2>/dev/null)" ]; then rm -f "$f" && log "prune $(basename "$f")"; fi
  done
}
prune "$DEST/suns-*.dump" "$KEEP_MIN" "$KEEP_DAYS"
prune "$DEST/env-*.bak" "$KEEP_MIN" "$KEEP_DAYS"
prune "$DEST/media-*.tar.gz" "$KEEP_MIN" "$KEEP_DAYS"

# 日志超过 5MB 截断（同机 mem-guard 的做法，避免长期堆积）
if [ -f "$LOG" ] && [ "$(stat -c %s "$LOG")" -gt 5242880 ]; then tail -c 1048576 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"; fi

exit 0
