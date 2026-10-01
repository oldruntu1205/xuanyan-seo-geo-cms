#!/bin/bash
# 人工审核通过后：发布产品译文草稿 → 全站重建 → 逐语言公网核验。（在**服务器本机**执行）
#
# 安全闸门（防止把测试/占位/已删除的数据推上线）：
#   待发布集合 = 「产品与译文都未删除」且「中文原文不是占位文案」的非中文草稿；
#   集合内若仍命中 PLACEHOLDER 正则即中止（确认强推用 FORCE=1）。
#
# 2026-10-01 修掉三处缺陷（当时的脚本会把历史占位产品遗留的 8 条垃圾译文推上线）：
#   ① 闸门不按产品过滤 → 已下线的历史占位产品把合法发布整批误拦（实测命中 1 条）；
#   ② 发布集合是「所有非中文草稿」→ 会把垃圾译文推上线；
#   ③ 全程不看 deleted_at → 产品已删除后，其草稿仍被算作待发布。
#   现在统一用 LIVE（未删除）+ EXCLUDE（来源非占位）约束「闸门」与「发布集合」，并打印跳过数。
#
# 用法（服务器上）：
#   bash /www/wwwroot/opctools/infrastructure/scripts/publish-translations.sh
#   FORCE=1 bash …                       # 跳过闸门强推（慎用）
#   PLACEHOLDER='自定义正则' bash …        # 覆盖占位文案正则
set -uo pipefail
APP=/www/wwwroot/opctools
API=https://www.opctools.cloud
PWFILE=/root/opctools-admin-password.txt
EMAIL=admin@opctools.cloud
PGBIN=/www/server/pgsql/bin
URL=$(grep -m1 '^DATABASE_URL=' "$APP/.env" | cut -d= -f2-)
Q() { $PGBIN/psql "$URL" -tAc "$1" | tr -d '\r'; }
PLACEHOLDER="${PLACEHOLDER:-这个是量筒|This is a graduated cylinder|Esto es una probeta|Questo è un cilindro|Ceci est une éprouvette|Dies ist ein Messzylinder}"

PW=$(head -1 "$PWFILE" | tr -d '\r\n')
TOK=$(curl -s -X POST "$API/api/cms-admin-users/login" -H 'Content-Type: application/json' \
  --data-binary "$(printf '{"email":"%s","password":"%s"}' "$EMAIL" "$PW")" | sed -E 's/.*"token":"([^"]+)".*/\1/')
[ "${#TOK}" -lt 50 ] && { echo "登录失败"; exit 3; }
AUTH=(-H "Authorization: JWT $TOK" -H "Origin: $API" -H 'Content-Type: application/json')

# 统一口径：只看未删除的产品与译文
LIVE="AND p.deleted_at IS NULL AND t.deleted_at IS NULL"
# 排除「中文原文仍是占位文案」的产品（其草稿一律不发布）
PLACEHOLDER_PRODUCTS="SELECT t2.product_id FROM product_translations t2 JOIN locales l2 ON l2.id=t2.locale_id
  WHERE l2.code='zh' AND (coalesce(t2.description,'')||coalesce(t2.short_description,'')) LIKE '%这个是量筒%'"
EXCLUDE="AND p.id NOT IN ($PLACEHOLDER_PRODUCTS)"
# 发布集合的基础条件（草稿 + 未删除 + 来源非占位）
SET="FROM product_translations t JOIN locales l ON l.id=t.locale_id JOIN products p ON p.id=t.product_id
  WHERE t.publish_status='draft' AND l.code<>'zh' $LIVE $EXCLUDE"

echo "=== 0) 发布前闸门 ==="
DRAFTS=$(Q "SELECT count(*) $SET")
BUSY=$(Q "SELECT count(*) FROM translation_jobs WHERE status IN ('pending','processing')")
ZHSRC=$(Q "SELECT count(*) $SET AND (coalesce(t.description,'')||coalesce(t.short_description,'')) ~ '$PLACEHOLDER'")
SKIPPED=$(Q "SELECT count(*) FROM product_translations t JOIN locales l ON l.id=t.locale_id JOIN products p ON p.id=t.product_id
  WHERE t.publish_status='draft' AND l.code<>'zh' $LIVE AND p.id IN ($PLACEHOLDER_PRODUCTS)")
echo "  待发布草稿数=$DRAFTS   未完成任务数=$BUSY   待发布集合内含占位句=$ZHSRC   因占位来源被跳过=$SKIPPED"
[ "$SKIPPED" != "0" ] && echo "  提示：有 $SKIPPED 条草稿因「中文原文仍是占位文案」被跳过，不会上线（请先在 /manage 修好原文或用 retranslate-product 重译）"
[ "$BUSY" != "0" ] && { echo "  有翻译任务未完成，先等 worker 跑完"; exit 4; }

if [ "$ZHSRC" != "0" ]; then
  echo "  闸门拦截：待发布集合里仍有译文命中占位文案："
  $PGBIN/psql "$URL" -c "SELECT l.code, left(t.description,60) AS desc_first $(echo "$SET") AND (coalesce(t.description,'')||coalesce(t.short_description,'')) ~ '$PLACEHOLDER'" | sed 's/^/  /'
  [ "${FORCE:-0}" != "1" ] && { echo "  未发布任何内容。确需强推：FORCE=1 重跑本脚本"; exit 5; }
  echo "  FORCE=1：跳过闸门继续"
fi

echo "=== 1) 逐语言发布（$DRAFTS 条）==="
IDS=$(Q "SELECT t.id||' '||l.code $SET ORDER BY l.code")
while read -r ID CODE; do
  [ -z "$ID" ] && continue
  C=$(curl -s -o /tmp/pub.json -w '%{http_code}' -X POST "$API/api/v1/publish" "${AUTH[@]}" \
    --data-binary "{\"resource\":\"product_translations\",\"id\":\"$ID\",\"action\":\"publish\"}")
  echo "  $CODE -> HTTP $C $(head -c 120 /tmp/pub.json)"
done <<< "$IDS"
rm -f /tmp/pub.json

echo "=== 2) 等发布任务完成（最多 3 分钟）==="
for i in $(seq 1 18); do
  sleep 10
  B=$(Q "SELECT count(*) FROM publish_jobs WHERE entity_type='product_translations' AND status IN ('pending','processing','retrying')")
  echo "  第 $((i*10)) 秒：未完成 $B"
  [ "$B" = "0" ] && break
done
$PGBIN/psql "$URL" -c "SELECT status, count(*) FROM publish_jobs WHERE entity_type='product_translations' GROUP BY 1"

echo "=== 3) 全站重建 ==="
C=$(curl -s -o /tmp/rb.json -w '%{http_code}' -X POST "$API/api/v1/publish" "${AUTH[@]}" --data-binary '{"resource":"site"}')
echo "  rebuild HTTP $C $(head -c 120 /tmp/rb.json)"; rm -f /tmp/rb.json
for i in $(seq 1 20); do
  sleep 6
  B=$(Q "SELECT count(*) FROM publish_jobs WHERE job_type='rebuild' AND status IN ('pending','processing','retrying')")
  [ "$B" = "0" ] && { echo "  重建完成（第 $((i*6)) 秒）"; break; }
done

echo "=== 4) 逐语言公网核验（仅未删除的已发布译文）==="
ROWS=$(Q "SELECT l.code||' '||t.path FROM product_translations t JOIN locales l ON l.id=t.locale_id JOIN products p ON p.id=t.product_id
  WHERE t.publish_status='published' AND t.path IS NOT NULL $LIVE ORDER BY l.code")
while read -r CODE PATH; do
  [ -z "$PATH" ] && continue
  BODY=$(curl -s -m 20 "$API$PATH")
  NAMEOK=$(printf '%s' "$BODY" | grep -c "home-product\|product-detail\|<h1>")
  PH=$(printf '%s' "$BODY" | grep -c -- "这个是量筒")
  echo "  $CODE $PATH -> HTTP $(curl -s -m 20 -o /dev/null -w '%{http_code}' "$API$PATH")  结构标记=$NAMEOK  占位残留=$PH"
done <<< "$ROWS"

echo "=== 5) 快照数（product_translations 已发布数）==="
$PGBIN/psql "$URL" -c "SELECT count(*) AS published_snapshots FROM published_documents WHERE entity_type='product_translations'"
