#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="${1:-}"

if [[ -z "$VERSION" ]]; then
  read -r -p "Release version: " VERSION
fi

cd "$ROOT_DIR"

tools/build_release_on_windows.sh "$VERSION"
tools/publish_desktop_update_manifest.sh "$VERSION"
