#!/usr/bin/env python3
"""Build a portable Windows desktop release zip for ChangeBattle V2."""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import zipfile
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
RELEASE_DIR = PROJECT_ROOT / "release"
ELECTRON_PLATFORM = "win32"
ELECTRON_ARCH = "x64"
DEFAULT_UPDATE_BASE_URLS = {
    "stable": "https://65h26i.top/changebattle/",
    "beta": "https://65h26i.top/changebattle-beta/",
}
PORTABLE_EXE_NAME = "ChangeBattle V2.exe"
PORTABLE_CMD_NAME = "ChangeBattle-V2-Desk.cmd"
PORTABLE_ENV_NAME = "ChangeBattle-V2-Desk.launcher.env"

PROJECT_PATHS = [
    "apps/desktop/out",
    "apps/desktop/package.json",
    "README.md",
]
REQUIRED_DESKTOP_OUTPUTS = [
    "apps/desktop/out/main/main.js",
    "apps/desktop/out/main/formalComputeWorker.js",
    "apps/desktop/out/preload/preload.cjs",
    "apps/desktop/out/renderer/index.html",
]
REQUIRED_RENDERER_ASSETS = [
    "apps/desktop/out/renderer/aboutIcon/exchange.png",
    "apps/desktop/out/renderer/board/rest-panel-frame.png",
    "apps/desktop/out/renderer/npc/staff/buy.png",
    "apps/desktop/out/renderer/npc/staff/judge.png",
    "apps/desktop/out/renderer/npc/staff/nurse.png",
    "apps/desktop/out/renderer/npc/staff/teach.png",
    "apps/desktop/out/renderer/music/battle/trainer.ogg",
    "apps/desktop/out/renderer/music/boss/xyz.ogg",
    "apps/desktop/out/renderer/music/nonbattle/yurenu-omoi.ogg",
    "apps/desktop/out/renderer/music/rest/pokemon-center.ogg",
    "apps/desktop/out/renderer/title/spritesaurus-transition.mp4",
    "apps/desktop/out/renderer/ui/button-gold.png",
]
REQUIRED_SHOWDOWN_PATHS = [
    "sim/index.js",
    "sim/battle.js",
    "sim/teams.js",
    "data/pokedex.js",
    "lib/index.js",
]
REQUIRED_SHOWDOWN_CLIENT_PATHS = [
    "js/battle-dex-data.js",
    "js/battle-dex.js",
    "js/battle-text-parser.js",
    "js/battle-log.js",
    "js/battle-animations.js",
    "js/battle-animations-moves.js",
    "js/battle-scene-stub.js",
    "js/battle-teams.js",
    "js/battle.js",
]
FORBIDDEN_ZIP_PARTS = [
    "/debug/",
    "/.git/",
    "/node_modules/.cache/",
]


def package_version() -> str:
    data = json.loads((PROJECT_ROOT / "package.json").read_text(encoding="utf-8"))
    return str(data.get("version") or "0.0.0")


def electron_version() -> str:
    package_json = PROJECT_ROOT / "apps" / "desktop" / "node_modules" / "electron" / "package.json"
    if package_json.exists():
        data = json.loads(package_json.read_text(encoding="utf-8"))
        return str(data["version"])
    output = subprocess.check_output(
        ["pnpm", "--filter", "@changebattle-v2/desktop", "exec", "node", "-p", "require('electron/package.json').version"],
        cwd=PROJECT_ROOT,
        text=True,
    ).strip()
    return output


def git_commit(path: Path) -> str:
    if path == PROJECT_ROOT and os.environ.get("CHANGEBATTLE_COMMIT"):
        return os.environ["CHANGEBATTLE_COMMIT"]
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


def release_channel() -> str:
    channel = (os.environ.get("CHANGEBATTLE_RELEASE_CHANNEL") or "stable").strip().lower()
    if channel not in DEFAULT_UPDATE_BASE_URLS:
        raise RuntimeError(f"CHANGEBATTLE_RELEASE_CHANNEL must be stable or beta, got: {channel}")
    return channel


def desktop_update_manifest_urls() -> str:
    explicit = (os.environ.get("CHANGEBATTLE_UPDATE_MANIFEST_URLS") or "").strip()
    if explicit:
        return explicit
    base_url = DEFAULT_UPDATE_BASE_URLS[release_channel()]
    return base_url.rstrip("/") + "/latest.json"


def portable_package_name(version: str) -> str:
    channel = release_channel()
    channel_part = "-debug" if channel == "beta" else ""
    return f"ChangeBattle-V2-Desk-portable{channel_part}-v{version}"


def copy_path(src: Path, dst: Path) -> None:
    if not src.exists():
        return
    if dst.exists():
        if dst.is_dir():
            shutil.rmtree(dst)
        else:
            dst.unlink()
    if src.is_dir():
        shutil.copytree(src, dst, ignore=ignore_project_path)
    else:
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)


def ignore_project_path(_dir: str, names: list[str]) -> set[str]:
    ignored = {"__pycache__", ".pytest_cache", ".vite", "node_modules"}
    ignored.update(name for name in names if name.endswith((".pyc", ".tsbuildinfo")))
    return ignored


def ignore_showdown_path(_dir: str, names: list[str]) -> set[str]:
    ignored = {"__pycache__", ".pytest_cache", ".git"}
    ignored.update(name for name in names if name.endswith((".map", ".d.ts", ".tsbuildinfo", ".pyc")))
    return ignored


def validate_desktop_outputs(stage_dir: Path) -> None:
    missing = [relative for relative in [*REQUIRED_DESKTOP_OUTPUTS, *REQUIRED_RENDERER_ASSETS] if not (stage_dir / relative).exists()]
    if missing:
        raise RuntimeError("Desktop build output is incomplete; missing:\n" + "\n".join(missing))


def validate_showdown_vendor(showdown_root: Path) -> None:
    missing = [relative for relative in REQUIRED_SHOWDOWN_PATHS if not (showdown_root / relative).exists()]
    if missing:
        raise RuntimeError(f"Showdown vendor is incomplete at {showdown_root}; missing:\n" + "\n".join(missing))


def validate_showdown_client_vendor(showdown_client_root: Path) -> None:
    missing = [relative for relative in REQUIRED_SHOWDOWN_CLIENT_PATHS if not (showdown_client_root / relative).exists()]
    if missing:
        raise RuntimeError(f"Showdown client playback vendor is incomplete at {showdown_client_root}; missing:\n" + "\n".join(missing))


def copy_showdown_vendor(showdown_root: Path, dst_root: Path) -> None:
    validate_showdown_vendor(showdown_root)
    copy_path(showdown_root / "package.json", dst_root / "package.json")
    for dirname in ["sim", "data", "lib", "config"]:
        src = showdown_root / dirname
        if src.exists():
            shutil.copytree(src, dst_root / dirname, ignore=ignore_showdown_path)
    module_src = resolve_ts_chacha20_package(showdown_root)
    module_dst = dst_root / "node_modules" / "ts-chacha20"
    module_dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copytree(module_src, module_dst, ignore=ignore_showdown_path)


def resolve_ts_chacha20_package(showdown_root: Path) -> Path:
    local_vendor_module = showdown_root / "node_modules" / "ts-chacha20"
    if (local_vendor_module / "package.json").exists():
        return local_vendor_module

    workspace_module = PROJECT_ROOT / "packages" / "showdown-battle-core" / "node_modules" / "ts-chacha20"
    if (workspace_module / "package.json").exists():
        return workspace_module

    pnpm_modules = sorted((PROJECT_ROOT / "node_modules" / ".pnpm").glob("ts-chacha20@*/node_modules/ts-chacha20"))
    for module_src in pnpm_modules:
        if (module_src / "package.json").exists():
            return module_src

    output = subprocess.check_output(
        [
            "node",
            "-e",
            (
                "const {createRequire}=require('module');"
                "const path=require('path');"
                "const root=process.cwd();"
                "const req=createRequire(path.join(root,'packages/showdown-battle-core/package.json'));"
                "console.log(req.resolve('ts-chacha20/package.json'));"
            ),
        ],
        cwd=PROJECT_ROOT,
        text=True,
    ).strip()
    module_src = Path(output).parent
    if not (module_src / "package.json").exists():
        raise RuntimeError("Cannot resolve ts-chacha20 package for portable Showdown vendor.")
    return module_src


def copy_showdown_client_vendor(showdown_client_root: Path, dst_root: Path) -> None:
    validate_showdown_client_vendor(showdown_client_root)
    copy_path(showdown_client_root / "README.md", dst_root / "README.md")
    shutil.copytree(showdown_client_root / "js", dst_root / "js", ignore=ignore_showdown_path)


def normalize_showdown_client_root(path_value: str) -> Path:
    root = Path(path_value).expanduser().resolve()
    if (root / "battle.js").exists() and root.name.lower() == "js":
        return root.parent
    return root


def copy_electron_runtime(runtime_root: Path, dst_root: Path) -> None:
    if not (runtime_root / "electron.exe").exists():
        raise RuntimeError(f"Electron runtime missing: {runtime_root / 'electron.exe'}")
    dst_root.mkdir(parents=True, exist_ok=True)
    for child in runtime_root.iterdir():
        copy_path(child, dst_root / child.name)


def write_launcher_env(stage_dir: Path) -> None:
    text = f"""# ChangeBattle V2 portable launcher environment.
CHANGEBATTLE_DESKTOP_VERSION={package_version()}
CHANGEBATTLE_RELEASE_CHANNEL={release_channel()}
CHANGEBATTLE_UPDATE_MANIFEST_URLS={desktop_update_manifest_urls()}
"""
    write_text(stage_dir / PORTABLE_ENV_NAME, text)


def copy_launcher_outputs(launcher_output_root: Path, stage_dir: Path) -> None:
    required = {
        PORTABLE_EXE_NAME: stage_dir / PORTABLE_EXE_NAME,
        "app-icon.ico": stage_dir / "resources" / "app-icon.ico",
        "app-icon.png": stage_dir / "resources" / "app-icon.png",
    }
    missing = [str(launcher_output_root / name) for name in required if not (launcher_output_root / name).exists()]
    if missing:
        raise RuntimeError("Desktop launcher output is incomplete; missing:\n" + "\n".join(missing))
    for name, dst in required.items():
        copy_path(launcher_output_root / name, dst)


def write_windows_scripts(stage_dir: Path) -> None:
    cmd = rf"""@echo off
setlocal
set "APP_DIR=%~dp0"
set "APP_ROOT=%APP_DIR:~0,-1%"
set "LAUNCHER_ENV=%APP_ROOT%\{PORTABLE_ENV_NAME}"
set "ELECTRON_EXE=%APP_ROOT%\runtime\electron\electron.exe"
set "DESKTOP_APP=%APP_ROOT%\apps\desktop"
set "SHOWDOWN_VENDOR=%APP_ROOT%\vendor\pokemon-showdown"
set "SHOWDOWN_CLIENT_VENDOR=%APP_ROOT%\vendor\showdown-client\js"
if exist "%LAUNCHER_ENV%" (
  for /f "usebackq eol=# tokens=1,* delims==" %%A in ("%LAUNCHER_ENV%") do (
    if not "%%A"=="" set "%%A=%%B"
  )
)
if not exist "%ELECTRON_EXE%" (
  echo Electron runtime is missing: %ELECTRON_EXE%
  echo Please use the complete ChangeBattle V2 Desk portable package.
  pause
  exit /b 1
)
if not exist "%DESKTOP_APP%\out\main\main.js" (
  echo Desktop app build is missing: %DESKTOP_APP%\out\main\main.js
  echo Please use the complete ChangeBattle V2 Desk portable package.
  pause
  exit /b 1
)
if not exist "%SHOWDOWN_VENDOR%\sim\index.js" (
  echo Pokemon Showdown vendor is missing: %SHOWDOWN_VENDOR%\sim\index.js
  echo Please use the complete ChangeBattle V2 Desk portable package.
  pause
  exit /b 1
)
if not exist "%SHOWDOWN_CLIENT_VENDOR%\battle.js" (
  echo Pokemon Showdown client playback vendor is missing: %SHOWDOWN_CLIENT_VENDOR%\battle.js
  echo Please use the complete ChangeBattle V2 Desk portable package.
  pause
  exit /b 1
)
set "CHANGEBATTLE_PROJECT_ROOT=%APP_ROOT%"
if "%CHANGEBATTLE_DESKTOP_VERSION%"=="" set "CHANGEBATTLE_DESKTOP_VERSION={package_version()}"
set "CHANGEBATTLE_PORTABLE_ROOT=%APP_ROOT%"
set "CHANGEBATTLE_PORTABLE_UPDATE_ENABLED=1"
if "%CHANGEBATTLE_RELEASE_CHANNEL%"=="" set "CHANGEBATTLE_RELEASE_CHANNEL={release_channel()}"
if "%CHANGEBATTLE_UPDATE_MANIFEST_URLS%"=="" set "CHANGEBATTLE_UPDATE_MANIFEST_URLS={desktop_update_manifest_urls()}"
set "CHANGEBATTLE_SHOWDOWN_VENDOR_ROOT=%SHOWDOWN_VENDOR%"
set "CHANGEBATTLE_SHOWDOWN_CLIENT_VENDOR_ROOT=%SHOWDOWN_CLIENT_VENDOR%"
start "ChangeBattle V2 Desk" /D "%APP_ROOT%" "%ELECTRON_EXE%" "%DESKTOP_APP%"
"""
    write_text(stage_dir / PORTABLE_CMD_NAME, cmd, newline="\r\n")


def write_release_notes(stage_dir: Path, showdown_root: Path, electron_runtime_version: str) -> None:
    text = f"""# ChangeBattle V2 Desk Windows Release

Version: {package_version()}
Channel: {release_channel()}
Update manifest: {desktop_update_manifest_urls()}

## Start

1. Unzip this package.
2. Double-click `{PORTABLE_EXE_NAME}`.

If the launcher fails, use `{PORTABLE_CMD_NAME}` as a fallback/debug entry.

## Runtime Requirements

- Windows 10/11 x64.
- No Node.js, npm, pnpm, or Python is required on the player machine.
- Pokemon Showdown vendor is bundled in `vendor/pokemon-showdown`.
- Pokemon Showdown client playback vendor is bundled in `vendor/showdown-client`.
- Electron is bundled in `runtime/electron`.

## Saves

Electron stores profile data under the app user-data directory, not inside this portable folder.

## Build Info

- ChangeBattle V2 commit: `{git_commit(PROJECT_ROOT)}`
- Showdown vendor source: `{showdown_root}`
- Electron runtime: `{electron_runtime_version}-{ELECTRON_PLATFORM}-{ELECTRON_ARCH}`
"""
    write_text(stage_dir / "RELEASE-README.md", text)


def zip_dir(src_dir: Path, zip_path: Path) -> None:
    if zip_path.exists():
        zip_path.unlink()
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
        for path in sorted(src_dir.rglob("*")):
            if not path.is_file():
                continue
            relative = path.relative_to(src_dir.parent).as_posix()
            if any(part in f"/{relative}" for part in FORBIDDEN_ZIP_PARTS):
                raise RuntimeError(f"Forbidden path in release zip: {relative}")
            zf.write(path, relative)


def validate_zip(zip_path: Path, package_name: str) -> None:
    prefix = package_name
    required = [
        f"{prefix}/{PORTABLE_EXE_NAME}",
        f"{prefix}/{PORTABLE_CMD_NAME}",
        f"{prefix}/{PORTABLE_ENV_NAME}",
        f"{prefix}/RELEASE-README.md",
        f"{prefix}/resources/app-icon.ico",
        f"{prefix}/resources/app-icon.png",
        f"{prefix}/update-manifest.json",
        f"{prefix}/apps/desktop/out/main/main.js",
        f"{prefix}/apps/desktop/out/main/formalComputeWorker.js",
        f"{prefix}/apps/desktop/out/preload/preload.cjs",
        f"{prefix}/apps/desktop/out/renderer/index.html",
        f"{prefix}/runtime/electron/electron.exe",
        f"{prefix}/vendor/pokemon-showdown/sim/index.js",
        f"{prefix}/vendor/pokemon-showdown/node_modules/ts-chacha20/package.json",
        f"{prefix}/vendor/showdown-client/js/battle.js",
        f"{prefix}/vendor/showdown-client/js/battle-scene-stub.js",
    ]
    with zipfile.ZipFile(zip_path) as zf:
        names = set(zf.namelist())
    missing = [name for name in required if name not in names]
    if missing:
        raise RuntimeError("Desktop zip validation failed; missing:\n" + "\n".join(missing))
    forbidden = [name for name in names if "/debug/" in name or "/.git/" in name or "changeBattle/" in name]
    if forbidden:
        raise RuntimeError("Desktop zip contains forbidden paths:\n" + "\n".join(forbidden[:20]))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--electron-runtime-path", default=os.environ.get("ELECTRON_RUNTIME_PATH", r"D:\changeBattleV2\electron-runtime\electron"))
    parser.add_argument("--launcher-output-path", default=os.environ.get("CHANGEBATTLE_DESKTOP_LAUNCHER_OUTPUT") or str(PROJECT_ROOT / "release" / "desktop-launcher"))
    parser.add_argument("--showdown-path", default=os.environ.get("CHANGEBATTLE_SHOWDOWN_VENDOR_ROOT") or os.environ.get("SHOWDOWN_PATH") or str(PROJECT_ROOT / "packages" / "showdown-battle-core" / "vendor" / "showdown"))
    parser.add_argument("--showdown-client-path", default=os.environ.get("CHANGEBATTLE_SHOWDOWN_CLIENT_VENDOR_ROOT") or str(PROJECT_ROOT / "packages" / "showdown-battle-core" / "vendor" / "showdown-client"))
    parser.add_argument("--keep-stage", action="store_true")
    args = parser.parse_args()

    version = package_version()
    runtime_version = electron_version()
    electron_runtime_root = Path(args.electron_runtime_path).expanduser().resolve()
    launcher_output_root = Path(args.launcher_output_path).expanduser().resolve()
    showdown_root = Path(args.showdown_path).expanduser().resolve()
    showdown_client_root = normalize_showdown_client_root(args.showdown_client_path)

    RELEASE_DIR.mkdir(parents=True, exist_ok=True)
    package_name = portable_package_name(version)
    stage_dir = RELEASE_DIR / package_name
    zip_path = RELEASE_DIR / f"{package_name}.zip"
    if stage_dir.exists():
        shutil.rmtree(stage_dir)
    stage_dir.mkdir(parents=True, exist_ok=True)

    for relative in PROJECT_PATHS:
        copy_path(PROJECT_ROOT / relative, stage_dir / relative)
    validate_desktop_outputs(stage_dir)
    copy_showdown_vendor(showdown_root, stage_dir / "vendor" / "pokemon-showdown")
    copy_showdown_client_vendor(showdown_client_root, stage_dir / "vendor" / "showdown-client")
    copy_electron_runtime(electron_runtime_root, stage_dir / "runtime" / "electron")
    write_launcher_env(stage_dir)
    copy_launcher_outputs(launcher_output_root, stage_dir)
    write_windows_scripts(stage_dir)
    write_release_notes(stage_dir, showdown_root, runtime_version)
    subprocess.check_call(
        ["node", "tools/generate_desktop_file_manifest.mjs", version, "--portable-root", str(stage_dir)],
        cwd=PROJECT_ROOT,
    )
    zip_dir(stage_dir, zip_path)
    validate_zip(zip_path, package_name)

    size_mb = zip_path.stat().st_size / 1024 / 1024
    print(f"wrote {zip_path}")
    print(f"size: {size_mb:.1f} MiB")
    if not args.keep_stage:
        shutil.rmtree(stage_dir)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
