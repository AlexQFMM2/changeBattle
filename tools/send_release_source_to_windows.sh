#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="${1:-}"
WINDOWS_HOST="${WINDOWS_HOST:-win10@172.16.10.41}"
WINDOWS_ROOT="${WINDOWS_ROOT:-D:/changeBattleV2}"

if [[ -z "$VERSION" ]]; then
  read -r -p "Release version: " VERSION
fi

if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Version must look like X.Y.Z, got: $VERSION" >&2
  exit 1
fi

cd "$ROOT_DIR"

PACKAGE_VERSION="$(node -p "require('./package.json').version")"
if [[ "$PACKAGE_VERSION" != "$VERSION" ]]; then
  echo "package.json version is $PACKAGE_VERSION, expected $VERSION" >&2
  exit 1
fi

TRACKED_STATUS="$(git status --short --untracked-files=no)"
if [[ -n "$TRACKED_STATUS" ]]; then
  echo "Tracked git worktree is not clean. Commit tracked release changes before sending a release source package." >&2
  git status --short
  exit 1
fi

REQUIRED_PATHS=(
  "apps/desktop/package.json"
  "apps/desktop/electron.vite.config.ts"
  "assets/board/rest-panel-frame.png"
  "assets/title/spritesaurus-transition.mp4"
  "assets/ui/button-gold.png"
  "packages/showdown-battle-core/vendor/showdown/sim/index.js"
  "packages/showdown-battle-core/vendor/showdown/node_modules/ts-chacha20/package.json"
  "packages/showdown-battle-core/vendor/showdown-client/js/battle.js"
  "packages/showdown-battle-core/vendor/showdown-client/js/battle-scene-stub.js"
)
for REQUIRED_PATH in "${REQUIRED_PATHS[@]}"; do
  if [[ ! -e "$REQUIRED_PATH" ]]; then
    echo "Required release path is missing: $REQUIRED_PATH" >&2
    exit 1
  fi
done

ARCHIVE="/tmp/changeBattleV2-src-${VERSION}.tgz"
ASSETS_ARCHIVE="/tmp/changeBattleV2-assets-${VERSION}.tgz"
SHOWDOWN_NODE_MODULES_ARCHIVE="/tmp/changeBattleV2-showdown-node-modules-${VERSION}.tgz"
REMOTE_ARCHIVE="${WINDOWS_ROOT}/release/changeBattleV2-src-${VERSION}.tgz"
REMOTE_ASSETS_ARCHIVE="${WINDOWS_ROOT}/release/changeBattleV2-assets-${VERSION}.tgz"
REMOTE_SHOWDOWN_NODE_MODULES_ARCHIVE="${WINDOWS_ROOT}/release/changeBattleV2-showdown-node-modules-${VERSION}.tgz"
COMMIT="$(git rev-parse --short HEAD)"

echo "Creating source archive from HEAD..."
git archive --format=tar.gz -o "$ARCHIVE" HEAD

echo "Creating assets archive from local assets/..."
tar --exclude='.DS_Store' -czf "$ASSETS_ARCHIVE" assets

echo "Creating Showdown node_modules archive from local vendor..."
tar --exclude='.DS_Store' -czf "$SHOWDOWN_NODE_MODULES_ARCHIVE" packages/showdown-battle-core/vendor/showdown/node_modules/ts-chacha20

echo "Preparing Windows directories..."
ssh "$WINDOWS_HOST" "powershell -NoProfile -ExecutionPolicy Bypass -Command \"New-Item -ItemType Directory -Force D:\\changeBattleV2\\release, D:\\changeBattleV2\\changeBattleV2 | Out-Null\""

echo "Uploading $ARCHIVE to ${WINDOWS_HOST}:${REMOTE_ARCHIVE}..."
scp "$ARCHIVE" "${WINDOWS_HOST}:${REMOTE_ARCHIVE}"

echo "Uploading $ASSETS_ARCHIVE to ${WINDOWS_HOST}:${REMOTE_ASSETS_ARCHIVE}..."
scp "$ASSETS_ARCHIVE" "${WINDOWS_HOST}:${REMOTE_ASSETS_ARCHIVE}"

echo "Uploading $SHOWDOWN_NODE_MODULES_ARCHIVE to ${WINDOWS_HOST}:${REMOTE_SHOWDOWN_NODE_MODULES_ARCHIVE}..."
scp "$SHOWDOWN_NODE_MODULES_ARCHIVE" "${WINDOWS_HOST}:${REMOTE_SHOWDOWN_NODE_MODULES_ARCHIVE}"

echo "Uploading Windows release script..."
scp "$ROOT_DIR/tools/windows/build-desk-release.ps1" "${WINDOWS_HOST}:${WINDOWS_ROOT}/build-desk-release.ps1"

echo "Replacing Windows source tree..."
ssh "$WINDOWS_HOST" "powershell -NoProfile -ExecutionPolicy Bypass -Command \"Get-ChildItem -Force D:\\changeBattleV2\\changeBattleV2 -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force; tar -xzf D:\\changeBattleV2\\release\\changeBattleV2-src-${VERSION}.tgz -C D:\\changeBattleV2\\changeBattleV2\""

echo "Installing local assets on Windows source tree..."
ssh "$WINDOWS_HOST" "powershell -NoProfile -ExecutionPolicy Bypass -Command \"Remove-Item -Recurse -Force D:\\changeBattleV2\\changeBattleV2\\assets -ErrorAction SilentlyContinue; tar -xzf D:\\changeBattleV2\\release\\changeBattleV2-assets-${VERSION}.tgz -C D:\\changeBattleV2\\changeBattleV2\""

echo "Installing local Showdown node_modules on Windows source tree..."
ssh "$WINDOWS_HOST" "powershell -NoProfile -ExecutionPolicy Bypass -Command \"Remove-Item -Recurse -Force D:\\changeBattleV2\\changeBattleV2\\packages\\showdown-battle-core\\vendor\\showdown\\node_modules -ErrorAction SilentlyContinue; tar -xzf D:\\changeBattleV2\\release\\changeBattleV2-showdown-node-modules-${VERSION}.tgz -C D:\\changeBattleV2\\changeBattleV2\""

echo "Writing release commit marker..."
ssh "$WINDOWS_HOST" "powershell -NoProfile -ExecutionPolicy Bypass -Command \"Set-Content -Encoding ASCII D:\\changeBattleV2\\changeBattleV2\\.changebattle-release-commit '${COMMIT}'\""

echo "Windows source is ready:"
ssh "$WINDOWS_HOST" "cd /d D:\\changeBattleV2\\changeBattleV2 && node -p \"require('./package.json').version\""
