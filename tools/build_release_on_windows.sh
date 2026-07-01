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

tools/send_release_source_to_windows.sh "$VERSION"

echo "Building release on Windows..."
ssh "$WINDOWS_HOST" "powershell -NoProfile -ExecutionPolicy Bypass -File D:\\changeBattleV2\\build-desk-release.ps1 -Version $VERSION"

mkdir -p "$ROOT_DIR/release"
echo "Downloading release zip..."
scp "${WINDOWS_HOST}:${WINDOWS_ROOT}/release/ChangeBattle-V2-Desk-portable-v${VERSION}.zip" "$ROOT_DIR/release/"

echo "Release copied to:"
ls -lh "$ROOT_DIR/release/ChangeBattle-V2-Desk-portable-v${VERSION}.zip"
