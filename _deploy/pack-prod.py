#!/usr/bin/env python3
"""SUNS 生产包打包（剪枝遍历，供上传到 prod 43.132.209.126）。

产出：_deploy/dist/suns-prod-<UTC 时间戳>.tar.gz
内容：服务器运行 CMS + Worker 所需源码、数据库迁移、基础设施脚本，
      以及开发机上构建好的 apps/cms/.next（Next 产物，服务器不构建）。

硬性排除（安全与体积）：
  - .env / .env.*（除 .env.example）—— 生产密钥只在服务器上存在
  - node_modules / .git / .runtime / media / static-site
  - _deploy 自身、日志
  - apps/cms/.next 下的 cache / dev / diagnostics / types（本机构建缓存与 dev 产物，约 750MB）
  - apps/web、apps/worker 的 .next（生产不跑 web；worker 用 tsx 直接跑源码）

注意：必须用剪枝遍历（os.walk + dirnames 过滤），因为 pnpm 的 node_modules 里存在
坏 junction（如 @suns/geo），pathlib.rglob 会直接抛 FileNotFoundError。

用法：python _deploy/pack-prod.py
"""
import os
import sys
import tarfile
import time
from pathlib import Path

# Windows 控制台默认 GBK，中文输出会乱码
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = Path(__file__).resolve().parent / "dist"

EXCLUDE_TOP_DIRS = {".git", ".runtime", "node_modules", "_deploy", "media", "static-site"}
EXCLUDE_ANY_DIRS = {"node_modules", ".git", ".runtime", ".turbo"}
EXCLUDE_SUFFIXES = (".log", ".tsbuildinfo", ".tar.gz", ".zip")
EXCLUDE_NAMES = {".env", ".env.local", ".env.production", ".DS_Store", "Thumbs.db"}

# apps/cms/.next 下这些子目录不参与上传（构建期缓存 / dev 产物，运行期用不到）
NEXT_DROP_SUBDIRS = {"cache", "dev", "diagnostics", "types", "turbopack"}


def excluded(rel: Path) -> bool:
    posix = rel.as_posix()

    # apps/cms/.next：保留运行时必需的 server/static/manifests，只丢缓存与 dev 产物
    if posix.startswith("apps/cms/.next/"):
        return posix[len("apps/cms/.next/"):].split("/")[0] in NEXT_DROP_SUBDIRS
    if posix.startswith("apps/web/.next") or posix.startswith("apps/worker/.next"):
        return True

    parts = rel.parts
    if parts and parts[0] in EXCLUDE_TOP_DIRS:
        return True
    if any(component in EXCLUDE_ANY_DIRS for component in parts):
        return True

    name = rel.name
    if name in EXCLUDE_NAMES:
        return True
    if name != ".env.example" and name.startswith(".env."):
        return True
    if name.endswith(EXCLUDE_SUFFIXES):
        return True
    return False


def assert_safe(archive: Path) -> str:
    """打包后自检：确认没有把 .env、node_modules 或大块缓存带进去。"""
    with tarfile.open(archive) as tar:
        names = tar.getnames()
    bad = [
        n for n in names
        if Path(n).name == ".env"
        # 源码树与顶层 node_modules 一律禁止；apps/cms/.next/node_modules 是 Next 运行时依赖，必须保留
        or (n.startswith("node_modules/") or "/node_modules/" in n) and "/.next/node_modules/" not in n
        or "/.next/cache/" in n
        or "/.next/dev/" in n
    ]
    if bad:
        raise SystemExit(f"[pack] 致命错误：归档包含敏感/冗余文件 {bad[:5]}")
    return f"ok ({len(names)} entries, no .env / source node_modules / .next cache)"


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    stamp = time.strftime("%Y%m%d-%H%M%S", time.gmtime())
    archive = OUT_DIR / f"suns-prod-{stamp}.tar.gz"

    kept = skipped = 0
    total_bytes = 0
    with tarfile.open(archive, "w:gz") as tar:
        for dirpath, dirnames, filenames in os.walk(ROOT):
            here = Path(dirpath)
            rel_dir = here.relative_to(ROOT)
            # 剪枝：被排除的目录直接不进入（避免坏 junction 与无谓遍历）
            keep = []
            for d in sorted(dirnames):
                rel_d = (rel_dir / d) if rel_dir.parts else Path(d)
                if excluded(rel_d):
                    skipped += 1
                else:
                    keep.append(d)
            dirnames[:] = keep

            for f in sorted(filenames):
                rel = (rel_dir / f) if rel_dir.parts else Path(f)
                if excluded(rel):
                    skipped += 1
                    continue
                tar.add(here / f, arcname=rel.as_posix())
                kept += 1
                total_bytes += (here / f).stat().st_size

    print(f"[pack] 归档：{archive}")
    print(f"[pack] 文件：{kept} 个（跳过 {skipped} 个目录/文件），原始 {total_bytes / 1048576:.1f} MB，压缩后 {archive.stat().st_size / 1048576:.1f} MB")
    print(f"[pack] 自检：{assert_safe(archive)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
