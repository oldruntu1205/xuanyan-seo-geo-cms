#!/bin/bash
# SUNS 生产部署（在 prod 服务器上执行，由 _deploy/sync-prod.ps1 调用）
#
# 用法：/www/wwwroot/opctools/infrastructure/scripts/prod-deploy.sh <tar.gz 路径>
#
# 为什么需要这个脚本（每一步都是踩过的坑）：
#   1. .next 是 Windows 构建产物，required-server-files.json/js 里写死了构建机绝对路径
#      （H:\suns-New-code），不修正则运行时找不到应用目录。
#   2. Next 会把 serverExternalPackages 复制进 .next/node_modules/<pkg>-<hash>/。这些副本
#      是构建机（Windows）trace 出来的，在 Linux 上解析不到自身的传递依赖 —— 实测 sharp
#      缺 detect-libc 导致所有 /admin /api 路由 500。必须换成指向 pnpm 真实包的软链。
#   3. 服务器只跑不构建：依赖用 pnpm install 装 Linux 平台二进制，Node 产物由开发机提供。
set -euo pipefail

ARCHIVE="${1:?用法: prod-deploy.sh <tar.gz 路径>}"
APP=/www/wwwroot/opctools
RUN_USER=www
NODE_BIN=/usr/local/bin/node
PNPM_BIN=/usr/local/bin/pnpm

[ -f "$ARCHIVE" ] || { echo "[deploy] 归档不存在: $ARCHIVE" >&2; exit 1; }

ts=$(date +%Y%m%d_%H%M%S)
echo "[deploy] ===== 1/7 备份当前 .next 与 nginx 配置 ====="
if [ -d "$APP/apps/cms/.next" ]; then
  mkdir -p "$APP/_backup_$ts"
  cp -a "$APP/apps/cms/.next" "$APP/_backup_$ts/.next" || echo "[deploy] 警告：.next 备份失败（继续）"
fi

echo "[deploy] ===== 2/7 解压覆盖（.env / media / static-site 不在包内，自动保留）====="
# 上一轮部署把 .next/node_modules/<pkg>-<hash> 换成了软链；tar 会「穿透」软链去写目标文件，
# 而目标是 pnpm 存储里的硬链接，跨设备 link() 会报 Invalid cross-device link 且解压不完整。
# 先删掉这些软链，让本轮 tar 干净写入构建机副本，再由第 5 步统一重建软链。
find "$APP/apps/cms/.next/node_modules" -maxdepth 1 -type l -delete 2>/dev/null || true
if ! tar -xzf "$ARCHIVE" -C "$APP"; then
  echo "[deploy] 解压失败（tar 非零退出）—— 已中止，未重启服务" >&2
  exit 1
fi

echo "[deploy] ===== 3/7 修正 .next 内的构建机绝对路径 ====="
python3 - "$APP" <<'PY'
import pathlib, re, sys
app = pathlib.Path(sys.argv[1])
pat = re.compile(r"[A-Za-z]:\\+[^\"']*suns-New-code")
total = 0
for name in ("required-server-files.json", "required-server-files.js"):
    p = app / "apps/cms/.next" / name
    if not p.exists():
        print(f"  [skip] {name} 不存在")
        continue
    s = p.read_text(encoding="utf-8")
    s2, n = pat.subn(str(app), s)
    p.write_text(s2, encoding="utf-8")
    print(f"  {name}: replaced {n}")
    total += n
if total == 0:
    print("  [warn] 未替换任何路径，请确认包是否为开发机构建产物")
PY

echo "[deploy] ===== 4/7 安装依赖（Linux 平台二进制）====="
su -s /bin/bash "$RUN_USER" -c "cd $APP && export HOME=/home/www PATH=/usr/local/bin:/usr/bin:/bin && $PNPM_BIN install --frozen-lockfile" 2>&1 | tail -3

echo "[deploy] ===== 5/7 修复 .next/node_modules 的外部包软链 ====="
python3 - "$APP" <<'PY'
import pathlib, re, sys, os
app = pathlib.Path(sys.argv[1])
nx = app / "apps/cms/.next/node_modules"
pnpm_root = app / "node_modules/.pnpm/node_modules"
if not nx.exists():
    print("  [skip] 无 .next/node_modules")
    sys.exit(0)
fixed = 0
for entry in sorted(nx.iterdir()):
    name = entry.name
    # <pkg>-<16位hash> 形式；@scope 目录单独处理
    m = re.match(r"^(.+)-[0-9a-f]{16}$", name)
    if not m:
        continue
    pkg = m.group(1)
    # 首选应用自己声明的依赖：apps/cms/node_modules/<pkg> 由 pnpm 软链到 lockfile 锁定的那个版本。
    # 次选 .pnpm 里同名包 —— 注意不能只靠 glob，机器上可能存在多个版本（实测 sharp 有 0.34.5/0.35.4，
    # 取错版本会让运行期用的是与 lockfile 不一致的包）。
    app_dep = app / "apps/cms/node_modules" / pkg
    if app_dep.exists():
        target = app_dep.resolve()
    else:
        candidates = list((app / "node_modules/.pnpm").glob(f"{pkg.replace('/', '+')}@*/node_modules/{pkg}"))
        if not candidates:
            candidates = [p for p in pnpm_root.glob(pkg) if p.exists()]
        if not candidates:
            print(f"  [warn] {name}: 找不到 pnpm 对应包，保留原样")
            continue
        target = candidates[0].resolve()
    if entry.is_symlink() and pathlib.Path(os.readlink(entry)).resolve() == target:
        continue
    if entry.is_symlink() or entry.is_dir():
        if entry.is_symlink():
            entry.unlink()
        else:
            import shutil; shutil.rmtree(entry)
    entry.symlink_to(target)
    print(f"  {name} -> {target}")
    fixed += 1
print(f"  修复 {fixed} 个外部包链接")
PY

echo "[deploy] ===== 6/8 属主与权限 ====="
chown -R "$RUN_USER:$RUN_USER" "$APP/apps" "$APP/packages" "$APP/database" "$APP/infrastructure" "$APP/media" "$APP/static-site" 2>/dev/null || true
chown "$RUN_USER:$RUN_USER" "$APP/ecosystem.config.cjs" 2>/dev/null || true
[ -f "$APP/.env" ] && chown "$RUN_USER:$RUN_USER" "$APP/.env" && chmod 600 "$APP/.env"

# 迁移必须在「新代码生效」之前完成：新版本的查询可能依赖新列/新表。
# 此时 PM2 仍跑着旧进程（内存里的旧代码），所以这一步失败中止也是安全的失败状态。
echo "[deploy] ===== 7/8 应用数据库迁移（幂等，只跑未应用的）====="
su -s /bin/bash "$RUN_USER" -c "cd $APP && export HOME=/home/www PATH=/usr/local/bin:/usr/bin:/bin && $NODE_BIN infrastructure/scripts/migrate.mjs up" 2>&1 | tail -20
su -s /bin/bash "$RUN_USER" -c "cd $APP && export HOME=/home/www PATH=/usr/local/bin:/usr/bin:/bin && $NODE_BIN infrastructure/scripts/migrate.mjs status" 2>&1 | tail -8

echo "[deploy] ===== 8/8 重启 PM2 进程 ====="
su -s /bin/bash "$RUN_USER" -c "export HOME=/home/www PATH=/usr/local/bin:/usr/bin:/bin; pm2 delete suns-cms suns-worker >/dev/null 2>&1; pm2 start $APP/ecosystem.config.cjs" 2>&1 | tail -3

echo "[deploy] 等待就绪..."
for i in $(seq 1 20); do
  sleep 2
  code=$(curl -s -m 5 -o /dev/null -w '%{http_code}' http://127.0.0.1:3001/api/v1/health || echo 000)
  [ "$code" = "200" ] && { echo "[deploy] CMS 健康检查通过（第 ${i} 次）"; break; }
  [ "$i" = "20" ] && { echo "[deploy] 健康检查失败：/api/v1/health -> $code"; exit 1; }
done

su -s /bin/bash "$RUN_USER" -c "export HOME=/home/www PATH=/usr/local/bin:/usr/bin:/bin; pm2 save" >/dev/null 2>&1

# 只保留最近 3 次 .next 备份（每次约 63MB），避免长期部署把磁盘堆满
ls -1dt "$APP"/_backup_* 2>/dev/null | tail -n +4 | while read -r old; do
  rm -rf "$old" && echo "[deploy] 清理旧备份: $old"
done

echo "[deploy] 完成。备份目录：$APP/_backup_$ts"
