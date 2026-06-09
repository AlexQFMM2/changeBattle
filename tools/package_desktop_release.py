#!/usr/bin/env python3
"""Build a portable Windows desktop release zip.

The release bundles the Windows Electron runtime, the built app, data/assets,
and Pokemon Showdown. Users can unzip and run ChangeBattle-Desk.cmd without
Node, npm, pnpm, or Python installed on the target machine.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import shutil
import subprocess
import urllib.request
import zipfile
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SHOWDOWN = Path("/home/alexqfmm/workPlace/pokemon/pokemonShowdowm/pokemon-showdown")
RELEASE_DIR = PROJECT_ROOT / "release"
ELECTRON_CACHE_DIR = RELEASE_DIR / "electron-cache"
ELECTRON_PLATFORM = "win32"
ELECTRON_ARCH = "x64"

PROJECT_PATHS = [
    "apps/desktop/out",
    "apps/desktop/package.json",
    "data",
    "assets",
    "README.md",
    "plan.md",
]

NPC_ASSET_FIELDS = ["front_asset", "front_gif_asset", "back_asset", "avatar_asset"]

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
    ignored = {"__pycache__", ".pytest_cache", "node_modules", "dist", "dist-electron", "pokemon-green", "battle-effects-pack"}
    if Path(_dir).as_posix().endswith("assets/battle"):
        ignored.add("stage")
    ignored.update(name for name in names if name.endswith(".pyc"))
    return ignored


def ignore_showdown_dist(_dir: str, names: list[str]) -> set[str]:
    return {name for name in names if name.endswith((".map", ".d.ts", ".tsbuildinfo"))}


def copy_path(src: Path, dst: Path) -> None:
    if not src.exists():
        return
    if dst.exists():
        if dst.is_dir():
            shutil.rmtree(dst)
        else:
            dst.unlink()
    if src.is_dir():
        shutil.copytree(src, dst, ignore=ignore_runtime_dirs)
    else:
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)


def validate_npc_asset_paths(stage_dir: Path) -> None:
    csv_path = stage_dir / "data" / "npc_trainers.csv"
    if not csv_path.exists():
        return
    problems: list[str] = []
    with csv_path.open("r", encoding="utf-8", newline="") as f:
        for row in csv.DictReader(f):
            for field in NPC_ASSET_FIELDS:
                relative = (row.get(field) or "").strip()
                if not relative:
                    continue
                if not relative.isascii():
                    problems.append(f"non-ASCII NPC asset path: {relative}")
                elif not (stage_dir / Path(relative)).exists():
                    problems.append(f"missing NPC asset: {relative}")
    if problems:
        sample = "\n".join(problems[:20])
        extra = "" if len(problems) <= 20 else f"\n... and {len(problems) - 20} more"
        raise RuntimeError(f"NPC asset validation failed:\n{sample}{extra}")


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


def electron_version() -> str:
    package_json = PROJECT_ROOT / "apps" / "desktop" / "node_modules" / "electron" / "package.json"
    if package_json.exists():
        data = json.loads(package_json.read_text(encoding="utf-8"))
        return str(data["version"])
    output = subprocess.check_output(
        ["pnpm", "--filter", "@changebattle/desktop", "exec", "node", "-p", "require('electron/package.json').version"],
        cwd=PROJECT_ROOT,
        text=True,
    ).strip()
    return output


def git_commit(path: Path) -> str:
    if path == PROJECT_ROOT and os.environ.get("CHANGEBATTLE_COMMIT"):
        return os.environ["CHANGEBATTLE_COMMIT"]
    if path != PROJECT_ROOT and os.environ.get("SHOWDOWN_COMMIT"):
        return os.environ["SHOWDOWN_COMMIT"]
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


def electron_zip_name(version: str) -> str:
    return f"electron-v{version}-{ELECTRON_PLATFORM}-{ELECTRON_ARCH}.zip"


def electron_download_url(version: str) -> str:
    mirror = os.environ.get("ELECTRON_MIRROR", "https://github.com/electron/electron/releases/download/")
    if not mirror.endswith("/"):
        mirror += "/"
    return f"{mirror}v{version}/{electron_zip_name(version)}"


def ensure_electron_zip(version: str) -> Path:
    ELECTRON_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    zip_path = ELECTRON_CACHE_DIR / electron_zip_name(version)
    if zip_path.exists() and zip_path.stat().st_size > 0:
        return zip_path
    url = electron_download_url(version)
    print(f"downloading {url}")
    with urllib.request.urlopen(url) as response, zip_path.open("wb") as out:
        shutil.copyfileobj(response, out)
    return zip_path


def extract_electron_runtime(version: str, runtime_dir: Path) -> None:
    runtime_override = os.environ.get("ELECTRON_RUNTIME_PATH")
    if runtime_override:
        override_path = Path(runtime_override).expanduser().resolve()
        if not (override_path / "electron.exe").exists():
            raise RuntimeError(f"Electron runtime override is missing electron.exe: {override_path}")
        runtime_dir.mkdir(parents=True, exist_ok=True)
        for path in override_path.iterdir():
            copy_path(path, runtime_dir / path.name)
        return

    local_dist = PROJECT_ROOT / "apps" / "desktop" / "node_modules" / "electron" / "dist"
    if (local_dist / "electron.exe").exists():
        runtime_dir.mkdir(parents=True, exist_ok=True)
        for path in local_dist.iterdir():
            copy_path(path, runtime_dir / path.name)
        return

    electron_zip = ensure_electron_zip(version)
    with zipfile.ZipFile(electron_zip) as zf:
        zf.extractall(runtime_dir)
    electron_exe = runtime_dir / "electron.exe"
    if not electron_exe.exists():
        raise RuntimeError(f"Electron runtime is missing electron.exe in {electron_zip}")


def write_windows_scripts(stage_dir: Path) -> None:
    cmd = r"""@echo off
setlocal
set "APP_DIR=%~dp0"
set "APP_ROOT=%APP_DIR:~0,-1%"
set "ELECTRON_EXE=%APP_ROOT%\runtime\electron\electron.exe"
set "DESKTOP_APP=%APP_ROOT%\apps\desktop"
if not exist "%ELECTRON_EXE%" (
  echo Electron runtime is missing: %ELECTRON_EXE%
  echo Please use the complete ChangeBattle Desk portable package.
  pause
  exit /b 1
)
if not exist "%DESKTOP_APP%\out\main\main.js" (
  echo Desktop app build is missing: %DESKTOP_APP%\out\main\main.js
  echo Please use the complete ChangeBattle Desk portable package.
  pause
  exit /b 1
)
set "CHANGEBATTLE_PROJECT_ROOT=%APP_ROOT%"
set "SHOWDOWN_PATH=%APP_ROOT%\vendor\pokemon-showdown"
start "ChangeBattle Desk" "%ELECTRON_EXE%" "%DESKTOP_APP%"
"""
    write_text(stage_dir / "ChangeBattle-Desk.cmd", cmd, newline="\r\n")


def write_release_notes(stage_dir: Path, showdown_root: Path, electron_runtime_version: str) -> None:
    text = f"""# ChangeBattle Desk Windows Release

Version: {package_version()}

## Start

1. Unzip this package.
2. Double-click `ChangeBattle-Desk.cmd`.

## Runtime Requirements

- Windows 10/11 x64.
- No Node.js, npm, pnpm, or Python is required.
- Pokemon Showdown is bundled in `vendor/pokemon-showdown`.
- Electron is bundled in `runtime/electron`.

## Notes

- This is a portable Electron desktop release, not an installer.
- Saves are stored by Electron under the app user-data directory.

## Build Info

- ChangeBattle commit: `{git_commit(PROJECT_ROOT)}`
- Pokemon Showdown commit: `{git_commit(showdown_root)}`
- Electron runtime: `{electron_runtime_version}-{ELECTRON_PLATFORM}-{ELECTRON_ARCH}`
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
    runtime_version = electron_version()
    stage_dir = RELEASE_DIR / f"ChangeBattle-Desk-portable-v{package_version()}"
    zip_path = RELEASE_DIR / f"ChangeBattle-Desk-portable-v{package_version()}.zip"
    if stage_dir.exists():
        shutil.rmtree(stage_dir)
    stage_dir.mkdir(parents=True, exist_ok=True)

    for relative in PROJECT_PATHS:
        copy_path(PROJECT_ROOT / relative, stage_dir / relative)
    validate_npc_asset_paths(stage_dir)
    copy_showdown(showdown_root, stage_dir / "vendor" / "pokemon-showdown")
    extract_electron_runtime(runtime_version, stage_dir / "runtime" / "electron")
    write_windows_scripts(stage_dir)
    write_release_notes(stage_dir, showdown_root, runtime_version)
    zip_dir(stage_dir, zip_path)

    size_mb = zip_path.stat().st_size / 1024 / 1024
    print(f"wrote {zip_path}")
    print(f"size: {size_mb:.1f} MiB")
    if not args.keep_stage:
        shutil.rmtree(stage_dir)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
