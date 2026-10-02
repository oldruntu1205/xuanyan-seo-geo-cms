#!/usr/bin/env python3
"""GEO 地区 Worker 打包（供上传到美国/法兰克福 VPS）。

产出：_deploy/dist/geo-worker-<UTC 时间戳>.tar.gz

内容（只带源码与锁文件，依赖由 VPS 现装 —— 与 prod 部署同样的「本机不构建、目标机只装运行时依赖」口径）：
  - 根 package.json / pnpm-workspace.yaml / pnpm-lock.yaml（.npmrc 若存在）
  - apps/worker/ 全量源码（入口 apps/worker/src/geo-region.ts）
  - apps/cms/package.json、apps/web/package.json —— **只带清单**，保持 workspace 图完整，
    这样 `pnpm install --filter @suns/worker...` 才不会被判成 lockfile 过期；它们的重依赖不会被安装
  - packages/ 全量源码（@suns/domain 及被它引用的包）
  - infrastructure/geo-worker/（bootstrap.sh 与 README，便于目标机上自查）

硬性排除：node_modules / .git / .runtime / media / static-site / _deploy / apps/*/.next / 数据库迁移
（Worker 不跑迁移，也不渲染页面）。

用法：python _deploy/pack-geo-worker.py
"""
import os
import sys
import tarfile
import time
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = Path(__file__).resolve().parent / "dist"

EXCLUDE_ANY_DIRS = {"node_modules", ".git", ".runtime", ".turbo", ".next", "dist", "coverage"}
EXCLUDE_SUFFIXES = (".log", ".tsbuildinfo", ".tar.gz", ".zip")
EXCLUDE_NAMES = {".env", ".env.local", ".env.production", ".DS_Store", "Thumbs.db"}
ROOT_FILES = ["package.json", "pnpm-workspace.yaml", "pnpm-lock.yaml", ".npmrc"]
WORKSPACE_MANIFESTS = ["apps/cms/package.json", "apps/web/package.json"]
INCLUDE_DIRS = ["apps/worker", "packages", "infrastructure/geo-worker"]


def keep_dir(rel: Path) -> bool:
    """下钻判据：只有「某条 include 路径的前缀目录」才继续遍历。

    ⚠️ 不能拿 included() 判目录 —— `apps`、`packages` 本身不在 include 列表里，
    用文件判据剪枝会把整棵树剪掉（首版就踩了这个坑，靠归档自检才拦住）。
    """
    posix = rel.as_posix()
    if any(component in EXCLUDE_ANY_DIRS for component in rel.parts):
        return False
    if rel.name in EXCLUDE_NAMES:
        return False
    targets = list(INCLUDE_DIRS) + [str(Path(m).parent) for m in WORKSPACE_MANIFESTS]
    # 两个方向都要放行：① 当前目录是某个 include 的**父目录**（往下走）；
    # ② 当前目录在某个 include **里面**（继续深入其子目录）。
    return any(d == posix or d.startswith(posix + "/") or posix.startswith(d + "/") for d in targets)


def included(rel: Path) -> bool:
    posix = rel.as_posix()
    parts = rel.parts
    if any(component in EXCLUDE_ANY_DIRS for component in parts):
        return False
    if rel.name in EXCLUDE_NAMES or rel.name.endswith(EXCLUDE_SUFFIXES):
        return False
    if posix in ROOT_FILES or posix in WORKSPACE_MANIFESTS:
        return True
    return any(posix.startswith(d + "/") for d in INCLUDE_DIRS)


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    stamp = time.strftime("%Y%m%d-%H%M%S", time.gmtime())
    archive = OUT_DIR / f"geo-worker-{stamp}.tar.gz"

    kept = total_bytes = 0
    with tarfile.open(archive, "w:gz") as tar:
        for dirpath, dirnames, filenames in os.walk(ROOT):
            here = Path(dirpath)
            rel_dir = here.relative_to(ROOT)
            dirnames[:] = sorted(d for d in dirnames if keep_dir(rel_dir / d))
            for name in sorted(filenames):
                rel = (rel_dir / name) if rel_dir.parts else Path(name)
                if not included(rel):
                    continue
                tar.add(here / name, arcname=rel.as_posix())
                kept += 1
                total_bytes += (here / name).stat().st_size

    print(f"[pack] 归档：{archive}")
    print(f"[pack] 文件：{kept} 个，原始 {total_bytes / 1048576:.2f} MB，压缩后 {archive.stat().st_size / 1048576:.2f} MB")

    # 自检：不得带 node_modules / .env；入口与锁文件必须在
    with tarfile.open(archive) as tar:
        names = tar.getnames()
    bad = [n for n in names if "/node_modules/" in n or Path(n).name == ".env"]
    if bad:
        raise SystemExit(f"[pack] 致命错误：归档包含敏感/冗余文件 {bad[:5]}")
    for required in ["apps/worker/src/geo-region.ts", "pnpm-lock.yaml", "package.json"]:
        if required not in names:
            raise SystemExit(f"[pack] 致命错误：缺少必需文件 {required}")
    print("[pack] 自检：ok（无 node_modules/.env，入口与锁文件齐备）")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
