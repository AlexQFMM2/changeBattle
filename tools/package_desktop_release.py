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
SHOWDOWN_VENDOR_SOURCE = PROJECT_ROOT / "packages" / "showdown-battle-core" / "vendor" / "showdown"
SHOWDOWN_VENDOR_DESTINATION = Path("vendor") / "pokemon-showdown"
SHOWDOWN_RUNTIME_REQUIRED = [
    "sim/index.js",
    "sim/battle-stream.js",
    "node_modules/ts-chacha20/package.json",
    "node_modules/ts-chacha20/build/src/chacha20.js",
]
REQUIRED_DESKTOP_OUTPUTS = [
    "apps/desktop/out/main/main.js",
    "apps/desktop/out/main/formalComputeWorker.js",
    "apps/desktop/out/preload/preload.cjs",
    "apps/desktop/out/renderer/index.html",
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


def validate_desktop_outputs(stage_dir: Path) -> None:
    missing = [relative for relative in REQUIRED_DESKTOP_OUTPUTS if not (stage_dir / relative).exists()]
    if missing:
        raise RuntimeError("Desktop build output is incomplete; missing:\n" + "\n".join(missing))


def copy_showdown_runtime(stage_dir: Path) -> None:
    missing = [relative for relative in SHOWDOWN_RUNTIME_REQUIRED if not (SHOWDOWN_VENDOR_SOURCE / relative).exists()]
    if missing:
        raise RuntimeError("Showdown runtime source is incomplete; missing:\n" + "\n".join(missing))
    destination = stage_dir / SHOWDOWN_VENDOR_DESTINATION
    copy_path(SHOWDOWN_VENDOR_SOURCE, destination)
    copy_path(
        SHOWDOWN_VENDOR_SOURCE / "node_modules" / "ts-chacha20",
        destination / "node_modules" / "ts-chacha20",
    )
    staged_missing = [relative for relative in SHOWDOWN_RUNTIME_REQUIRED if not (destination / relative).exists()]
    if staged_missing:
        raise RuntimeError("Staged Showdown runtime is incomplete; missing:\n" + "\n".join(staged_missing))


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
set "CHANGEBATTLE_PROJECT_ROOT=%APP_ROOT%"
if "%CHANGEBATTLE_DESKTOP_VERSION%"=="" set "CHANGEBATTLE_DESKTOP_VERSION={package_version()}"
set "CHANGEBATTLE_PORTABLE_ROOT=%APP_ROOT%"
set "CHANGEBATTLE_PORTABLE_UPDATE_ENABLED=1"
if "%CHANGEBATTLE_RELEASE_CHANNEL%"=="" set "CHANGEBATTLE_RELEASE_CHANNEL={release_channel()}"
if "%CHANGEBATTLE_UPDATE_MANIFEST_URLS%"=="" set "CHANGEBATTLE_UPDATE_MANIFEST_URLS={desktop_update_manifest_urls()}"
start "ChangeBattle V2 Desk" /D "%APP_ROOT%" "%ELECTRON_EXE%" "%DESKTOP_APP%"
"""
    write_text(stage_dir / PORTABLE_CMD_NAME, cmd, newline="\r\n")


def write_release_notes(stage_dir: Path, electron_runtime_version: str) -> None:
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
- Battle sessions use the public ChangeBattle Battle API by default.
- Public assets are loaded from the ChangeBattle CDN.
- Electron is bundled in `runtime/electron`.

## Saves

Electron stores profile data under the app user-data directory, not inside this portable folder.

## Build Info

- ChangeBattle V2 commit: `{git_commit(PROJECT_ROOT)}`
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
        f"{prefix}/vendor/pokemon-showdown/sim/battle-stream.js",
        f"{prefix}/vendor/pokemon-showdown/node_modules/ts-chacha20/package.json",
        f"{prefix}/vendor/pokemon-showdown/node_modules/ts-chacha20/build/src/chacha20.js",
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
    parser.add_argument("--keep-stage", action="store_true")
    args = parser.parse_args()

    version = package_version()
    runtime_version = electron_version()
    electron_runtime_root = Path(args.electron_runtime_path).expanduser().resolve()
    launcher_output_root = Path(args.launcher_output_path).expanduser().resolve()

    RELEASE_DIR.mkdir(parents=True, exist_ok=True)
    package_name = portable_package_name(version)
    stage_dir = RELEASE_DIR / package_name
    zip_path = RELEASE_DIR / f"{package_name}.zip"
    if stage_dir.exists():
        shutil.rmtree(stage_dir)
    stage_dir.mkdir(parents=True, exist_ok=True)

    for relative in PROJECT_PATHS:
        copy_path(PROJECT_ROOT / relative, stage_dir / relative)
    copy_showdown_runtime(stage_dir)
    validate_desktop_outputs(stage_dir)
    subprocess.check_call(["node", "tools/smoke_portable_showdown_runtime.mjs", str(stage_dir)], cwd=PROJECT_ROOT)
    copy_electron_runtime(electron_runtime_root, stage_dir / "runtime" / "electron")
    write_launcher_env(stage_dir)
    copy_launcher_outputs(launcher_output_root, stage_dir)
    write_windows_scripts(stage_dir)
    write_release_notes(stage_dir, runtime_version)
    manifest_command = ["node", "tools/generate_desktop_file_manifest.mjs", version, "--portable-root", str(stage_dir)]
    previous_file_manifest = os.environ.get("CHANGEBATTLE_PREVIOUS_FILE_MANIFEST")
    if previous_file_manifest:
        manifest_command.extend(["--previous-manifest", previous_file_manifest])
    subprocess.check_call(manifest_command, cwd=PROJECT_ROOT)
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
