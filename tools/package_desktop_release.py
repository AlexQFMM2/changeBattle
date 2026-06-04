#!/usr/bin/env python3
"""Build a Windows-friendly desktop release zip.

This package is a source-runtime desktop release: it bundles the built Electron
app, data/assets, and Pokemon Showdown, then uses Windows scripts to install
Node/pnpm if needed and launch Electron.
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import zipfile
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SHOWDOWN = Path("/home/alexqfmm/workPlace/pokemon/pokemonShowdowm/pokemon-showdown")
RELEASE_DIR = PROJECT_ROOT / "release"
STAGE_DIR = RELEASE_DIR / "changeBattle-desk-win"
ZIP_PATH = RELEASE_DIR / "changeBattle-desk-win.zip"

PROJECT_PATHS = [
    "apps/desktop/out",
    "apps/desktop/package.json",
    "apps/desktop/index.html",
    "apps/desktop/electron.vite.config.ts",
    "apps/desktop/scripts",
    "packages",
    "data",
    "assets",
    "package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    "tsconfig.json",
    "README.md",
    "rule.md",
    "plan.md",
]

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
    ignored = {"__pycache__", ".pytest_cache", "node_modules", "dist", "dist-electron"}
    ignored.update(name for name in names if name.endswith(".pyc"))
    return ignored


def ignore_showdown_dist(_dir: str, names: list[str]) -> set[str]:
    return {name for name in names if name.endswith((".map", ".d.ts", ".tsbuildinfo"))}


def copy_path(src: Path, dst: Path) -> None:
    if not src.exists():
        return
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


def package_version() -> str:
    data = json.loads((PROJECT_ROOT / "package.json").read_text(encoding="utf-8"))
    return str(data.get("version") or "0.0.0")


def git_commit(path: Path) -> str:
    try:
        return subprocess.check_output(
            ["git", "-C", str(path), "rev-parse", "--short", "HEAD"],
            text=True,
            stderr=subprocess.DEVNULL,
        ).strip()
    except Exception:
        return "unknown"


def write_text(path: Path, text: str, newline: str = "\n") -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text.replace("\r\n", "\n").replace("\r", "\n"), encoding="utf-8", newline=newline)


def write_windows_scripts(stage_dir: Path) -> None:
    cmd = r"""@echo off
setlocal
set "APP_DIR=%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%APP_DIR%ChangeBattle-Desk.ps1"
pause
"""
    ps1 = r"""$ErrorActionPreference = "Stop"
$AppDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $AppDir

function Get-NodeMajor {
  $node = Get-Command node -ErrorAction SilentlyContinue
  if (-not $node) { return 0 }
  $version = (& node -v).TrimStart("v")
  return [int]($version.Split(".")[0])
}

$nodeMajor = Get-NodeMajor
if ($nodeMajor -lt 20) {
  Write-Host "ChangeBattle Desk needs Node.js 20+." -ForegroundColor Yellow
  $answer = Read-Host "Install Node.js LTS with winget now? (Y/N)"
  if ($answer -match "^[Yy]") {
    winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
  } else {
    throw "Node.js 20+ is required."
  }
}

corepack enable
corepack prepare pnpm@10.33.0 --activate

if (-not (Test-Path "apps\desktop\node_modules\electron")) {
  pnpm install
}

$env:CHANGEBATTLE_PROJECT_ROOT = $AppDir
$env:SHOWDOWN_PATH = Join-Path $AppDir "vendor\pokemon-showdown"
pnpm --dir "apps\desktop" exec electron .
"""
    write_text(stage_dir / "ChangeBattle-Desk.cmd", cmd, newline="\r\n")
    write_text(stage_dir / "ChangeBattle-Desk.ps1", ps1, newline="\r\n")


def write_release_notes(stage_dir: Path, showdown_root: Path) -> None:
    text = f"""# ChangeBattle Desk Windows Release

Version: {package_version()}

## Start

1. Unzip this package.
2. Double-click `ChangeBattle-Desk.cmd`.
3. If Node.js 20+ is missing, allow the script to install Node.js LTS with `winget`.
4. The first launch runs `pnpm install`; later launches reuse the installed dependencies.

## Runtime Requirements

- Windows 10/11 x64.
- Node.js 20+.
- No Python is required.
- Pokemon Showdown is bundled in `vendor/pokemon-showdown`.

## Notes

- This is the first desktop Windows source-runtime release, not a fully self-contained `.exe` installer.
- Saves are stored by Electron under the app user-data directory.
- If startup fails after moving the folder, delete `node_modules` and run `ChangeBattle-Desk.cmd` again.

## Build Info

- ChangeBattle commit: `{git_commit(PROJECT_ROOT)}`
- Pokemon Showdown commit: `{git_commit(showdown_root)}`
"""
    write_text(stage_dir / "RELEASE-README.md", text)


def zip_dir(src_dir: Path, zip_path: Path) -> None:
    if zip_path.exists():
        zip_path.unlink()
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
        for path in sorted(src_dir.rglob("*")):
            if path.is_file():
                zf.write(path, path.relative_to(src_dir.parent))


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
    write_windows_scripts(STAGE_DIR)
    write_release_notes(STAGE_DIR, showdown_root)
    zip_dir(STAGE_DIR, ZIP_PATH)

    size_mb = ZIP_PATH.stat().st_size / 1024 / 1024
    print(f"wrote {ZIP_PATH}")
    print(f"size: {size_mb:.1f} MiB")
    if not args.keep_stage:
        shutil.rmtree(STAGE_DIR)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
