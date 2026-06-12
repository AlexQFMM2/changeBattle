#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="${1:-}"
WINDOWS_HOST="${WINDOWS_HOST:-win10@172.16.10.41}"
WINDOWS_ROOT="${WINDOWS_ROOT:-D:/changeBattle}"
WINDOWS_ROOT_CMD="${WINDOWS_ROOT//\//\\}"

if [[ -z "$VERSION" ]]; then
  read -r -p "Release version: " VERSION
fi

if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Version must look like X.Y.Z, got: $VERSION" >&2
  exit 1
fi

cd "$ROOT_DIR"

echo "==> Sync source to Windows"
"$ROOT_DIR/tools/send_release_source_to_windows.sh" "$VERSION"

echo "==> Build Desk release on Windows"
ssh "$WINDOWS_HOST" "powershell -NoProfile -ExecutionPolicy Bypass -File ${WINDOWS_ROOT_CMD}\\build-desk-release.ps1 -Version ${VERSION}"

echo "==> Build Mobile release on Windows"
ssh "$WINDOWS_HOST" "powershell -NoProfile -ExecutionPolicy Bypass -File ${WINDOWS_ROOT_CMD}\\build-mobile-release.ps1 -Version ${VERSION}"

echo "==> Download release artifacts"
mkdir -p "$ROOT_DIR/release"
scp "${WINDOWS_HOST}:${WINDOWS_ROOT}/release/ChangeBattle-Desk-portable-v${VERSION}.zip" "$ROOT_DIR/release/ChangeBattle-Desk-portable-v${VERSION}.zip"
scp "${WINDOWS_HOST}:${WINDOWS_ROOT}/release/ChangeBattle-Mobile-v${VERSION}.apk" "$ROOT_DIR/release/ChangeBattle-Mobile-v${VERSION}.apk"

echo "==> Done"
ls -lh "$ROOT_DIR/release/ChangeBattle-Desk-portable-v${VERSION}.zip" "$ROOT_DIR/release/ChangeBattle-Mobile-v${VERSION}.apk"
