#!/usr/bin/env python3
"""Build a Windows-friendly CLI release zip."""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import zipfile
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SHOWDOWN = Path("/home/alexqfmm/workPlace/pokemon/pokemonShowdowm/pokemon-showdown")
RELEASE_DIR = PROJECT_ROOT / "release"
STAGE_DIR = RELEASE_DIR / "changeBattle-cli-win"
ZIP_PATH = RELEASE_DIR / "changeBattle-cli-win.zip"

PROJECT_PATHS = [
    "changeBattle-cli",
    "core",
    "data",
    "assets",
    "showdown-adapter",
    "README.md",
    "plan.md",
    "ChangeBattle.cmd",
    "ChangeBattle.ps1",
    "start_game_cli",
    "start_game_cli.cmd",
    "start_game_cli.ps1",
    "install_windows.cmd",
    "install_windows.ps1",
]

SOURCE_ASSET_DIRS = {
    "pokemon-showdown",
    "pokemon-pack",
    "pokemon-custom",
    "items-pack",
    "items",
}
SHOWDOWN_DIST_DIRS = [
    "sim",
    "data",
    "lib",
    "config",
]
SHOWDOWN_NODE_MODULES = [
    "ts-chacha20",
]


def ignore_runtime_dirs(_dir: str, names: list[str]) -> set[str]:
    ignored = {"__pycache__", ".pytest_cache"}
    if Path(_dir).as_posix().endswith("assets"):
        ignored.update(SOURCE_ASSET_DIRS)
    ignored.update(name for name in names if name.endswith(".pyc"))
    return ignored


def ignore_showdown_dist(_dir: str, names: list[str]) -> set[str]:
    ignored = set()
    for name in names:
        if name.endswith((".map", ".d.ts", ".tsbuildinfo")):
            ignored.add(name)
    return ignored


def copy_path(src: Path, dst: Path) -> None:
    if src.is_dir():
        shutil.copytree(src, dst, ignore=ignore_runtime_dirs)
    else:
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)


def copy_showdown(showdown_root: Path, dst_root: Path) -> None:
    if not (showdown_root / "dist" / "sim" / "index.js").exists():
        raise RuntimeError(f"Showdown is not built: {showdown_root / 'dist' / 'sim' / 'index.js'}")
    dst_root.mkdir(parents=True, exist_ok=True)
    for name in ["package.json", "LICENSE", "pokemon-showdown"]:
        src = showdown_root / name
        if src.exists():
            shutil.copy2(src, dst_root / name)
    dist_dst = dst_root / "dist"
    dist_dst.mkdir(parents=True, exist_ok=True)
    for dirname in SHOWDOWN_DIST_DIRS:
        src = showdown_root / "dist" / dirname
        if src.exists():
            shutil.copytree(src, dist_dst / dirname, ignore=ignore_showdown_dist)
    modules_dst = dst_root / "node_modules"
    modules_dst.mkdir(parents=True, exist_ok=True)
    for module_name in SHOWDOWN_NODE_MODULES:
        src = showdown_root / "node_modules" / module_name
        if not src.exists():
            raise RuntimeError(f"Showdown dependency is missing: {src}")
        shutil.copytree(src, modules_dst / module_name, ignore=ignore_runtime_dirs)


def zip_dir(src_dir: Path, zip_path: Path) -> None:
    if zip_path.exists():
        zip_path.unlink()
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
        for path in sorted(src_dir.rglob("*")):
            if path.is_file():
                zf.write(path, path.relative_to(src_dir.parent))


def normalize_windows_scripts(stage_dir: Path) -> None:
    for relative in [
        "start_game_cli.cmd",
        "install_windows.cmd",
        "ChangeBattle.cmd",
        "start_game_cli.ps1",
        "install_windows.ps1",
        "ChangeBattle.ps1",
    ]:
        path = stage_dir / relative
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8")
        text = text.replace("\r\n", "\n").replace("\r", "\n")
        path.write_text(text, encoding="utf-8", newline="\r\n")


def git_commit(path: Path) -> str:
    try:
        return subprocess.check_output(
            ["git", "-C", str(path), "rev-parse", "--short", "HEAD"],
            text=True,
            stderr=subprocess.DEVNULL,
        ).strip()
    except Exception:
        return "unknown"


def write_release_notes(stage_dir: Path, showdown_root: Path) -> None:
    text = f"""# ChangeBattle CLI Windows Release

## 启动方式

1. 解压本 zip。
2. 双击 `ChangeBattle.cmd`。
3. 如果提示缺少 Python/Node，输入 `Y` 允许脚本通过 `winget` 安装依赖。
4. 安装/检查完成后会自动启动游戏。

也可以手动分步执行：

1. 双击 `install_windows.cmd` 检查/安装 Python 3.10+ 与 Node.js 20+。
2. 双击 `start_game_cli.cmd`，或在 PowerShell 中执行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\\start_game_cli.ps1
```

## 说明

- 本包内置 `vendor/pokemon-showdown` 的已构建 simulator，不需要执行 `npm install`。
- `ChangeBattle.cmd` 是推荐总入口：检查环境、询问安装、安装后启动游戏。
- `install_windows.cmd` 会优先检查本机环境，版本够就跳过；缺 Python/Node 时会尝试用 `winget` 自动安装。
- 存档会写入 `saves/save.json`，debug 日志写入 `debug/`。
- 本包是 CLI 文字版，不包含 Electron 桌面 UI。

## Build Info

- ChangeBattle commit: `{git_commit(PROJECT_ROOT)}`
- Pokemon Showdown commit: `{git_commit(showdown_root)}`
"""
    (stage_dir / "RELEASE-README.md").write_text(text, encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--showdown-path", default=os.environ.get("SHOWDOWN_PATH") or str(DEFAULT_SHOWDOWN))
    parser.add_argument("--keep-stage", action="store_true")
    args = parser.parse_args()

    showdown_root = Path(args.showdown_path).expanduser().resolve()
    if STAGE_DIR.exists():
        shutil.rmtree(STAGE_DIR)
    STAGE_DIR.mkdir(parents=True, exist_ok=True)

    for relative in PROJECT_PATHS:
        copy_path(PROJECT_ROOT / relative, STAGE_DIR / relative)
    copy_showdown(showdown_root, STAGE_DIR / "vendor" / "pokemon-showdown")
    write_release_notes(STAGE_DIR, showdown_root)
    normalize_windows_scripts(STAGE_DIR)
    zip_dir(STAGE_DIR, ZIP_PATH)

    size_mb = ZIP_PATH.stat().st_size / 1024 / 1024
    print(f"wrote {ZIP_PATH}")
    print(f"size: {size_mb:.1f} MiB")
    if not args.keep_stage:
        shutil.rmtree(STAGE_DIR)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
