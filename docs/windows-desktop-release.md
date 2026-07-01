# Windows Desktop Release

This document covers the ChangeBattle V2 Windows desktop portable package only.

## Artifact

```text
ChangeBattle-V2-Desk-portable-vX.Y.Z.zip
```

Players unzip it and run:

```text
ChangeBattle-V2-Desk.cmd
```

The player machine does not need Node.js, pnpm, Python, or source files.

## Windows Build Host

```text
ssh win10@172.16.10.41
```

V2 uses its own Windows root so it does not disturb the V1 release environment:

```text
D:\changeBattleV2\changeBattleV2       source tree from git archive
D:\changeBattleV2\release              source archives and portable zip output
D:\changeBattleV2\electron-runtime     Windows Electron runtime
```

The Electron runtime can be copied from the existing V1 release environment:

```powershell
Copy-Item -Recurse -Force D:\changeBattle\electron-runtime\electron D:\changeBattleV2\electron-runtime\electron
```

The release script does not download Electron. If `D:\changeBattleV2\electron-runtime\electron\electron.exe` is missing, it stops.

## First Release

From Linux:

```bash
cd /home/alexqfmm/workPlace/pokemon/changeBattleV2
git status --short
pnpm --filter @changebattle-v2/core typecheck
pnpm --filter @changebattle-v2/api typecheck
pnpm --filter @changebattle-v2/web typecheck
pnpm --filter @changebattle-v2/desktop typecheck
pnpm --filter @changebattle-v2/api test:formal-game
pnpm typecheck
git diff --check
git add <release files>
git commit -m "Add v2 desktop release pipeline"
tools/build_release_on_windows.sh 0.1.0
```

The script uploads a `git archive HEAD` source package to Windows, runs the Windows build script, and copies the zip back to:

```text
changeBattleV2/release/ChangeBattle-V2-Desk-portable-v0.1.0.zip
```

Untracked local files such as `debug/` are not included in the source archive.

`assets/` is intentionally ignored by git, so `tools/send_release_source_to_windows.sh` sends a second local assets archive:

```text
D:\changeBattleV2\release\changeBattleV2-assets-X.Y.Z.tgz
```

The Showdown runtime dependency under `packages/showdown-battle-core/vendor/showdown/node_modules/ts-chacha20` is also ignored by git, so the script sends:

```text
D:\changeBattleV2\release\changeBattleV2-showdown-node-modules-X.Y.Z.tgz
```

The Windows source tree is rebuilt from `HEAD` plus these local runtime archives before `electron-vite` runs.

## Manual Windows Build

After running `tools/send_release_source_to_windows.sh X.Y.Z`, build on Windows:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File D:\changeBattleV2\build-desk-release.ps1 -Version X.Y.Z
```

The script runs:

```text
pnpm install
pnpm --filter @changebattle-v2/core typecheck
pnpm --filter @changebattle-v2/api typecheck
pnpm --filter @changebattle-v2/web typecheck
pnpm --filter @changebattle-v2/desktop typecheck
pnpm --filter @changebattle-v2/api test:formal-game
pnpm typecheck
pnpm --filter @changebattle-v2/desktop build
python tools\package_desktop_release.py
```

## Runtime Layout

The portable package contains:

```text
ChangeBattle-V2-Desk.cmd
RELEASE-README.md
apps/desktop/package.json
apps/desktop/out/main
apps/desktop/out/preload
apps/desktop/out/renderer
runtime/electron
vendor/pokemon-showdown
```

`ChangeBattle-V2-Desk.cmd` sets:

```text
CHANGEBATTLE_PROJECT_ROOT=<portable root>
CHANGEBATTLE_SHOWDOWN_VENDOR_ROOT=<portable root>\vendor\pokemon-showdown
```

This lets the desktop main process load the bundled Showdown runtime instead of depending on source-tree paths.

## Validation

Before handing the zip to testers, unzip it on Windows and verify:

- `ChangeBattle-V2-Desk.cmd` opens the app.
- Title screen, formal game creation, rest center, and battle creation work.
- Creating a battle does not throw a Showdown vendor path error.
- Saves are written to Electron userData, not the portable folder.
