#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="${1:-}"
WINDOWS_HOST="${WINDOWS_HOST:-win10@172.16.10.41}"
WINDOWS_ROOT="${WINDOWS_ROOT:-D:/changeBattle}"

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

if [[ -n "$(git status --short)" ]]; then
  echo "Git worktree is not clean. Commit or stash before sending a release source package." >&2
  git status --short
  exit 1
fi

ARCHIVE="/tmp/changeBattle-src-${VERSION}.tgz"
REMOTE_ARCHIVE="${WINDOWS_ROOT}/release/changeBattle-src-${VERSION}.tgz"
COMMIT="$(git rev-parse --short HEAD)"

echo "Creating source archive from HEAD..."
git archive --format=tar.gz -o "$ARCHIVE" HEAD

echo "Uploading $ARCHIVE to ${WINDOWS_HOST}:${REMOTE_ARCHIVE}..."
scp "$ARCHIVE" "${WINDOWS_HOST}:${REMOTE_ARCHIVE}"

echo "Uploading Windows release scripts..."
scp "$ROOT_DIR/tools/windows/build-desk-release.ps1" "$ROOT_DIR/tools/windows/build-mobile-release.ps1" "${WINDOWS_HOST}:${WINDOWS_ROOT}/"

echo "Replacing Windows source tree..."
ssh "$WINDOWS_HOST" "powershell -NoProfile -ExecutionPolicy Bypass -Command \"Get-ChildItem -Force D:\\changeBattle\\changeBattle | Remove-Item -Recurse -Force; tar -xzf D:\\changeBattle\\release\\changeBattle-src-${VERSION}.tgz -C D:\\changeBattle\\changeBattle\""

echo "Writing release commit marker..."
ssh "$WINDOWS_HOST" "powershell -NoProfile -ExecutionPolicy Bypass -Command \"Set-Content -Encoding ASCII D:\\changeBattle\\changeBattle\\.changebattle-release-commit '${COMMIT}'\""

echo "Windows source is ready:"
ssh "$WINDOWS_HOST" "cd /d D:\\changeBattle\\changeBattle && node -p \"require('./package.json').version\" && git --version >NUL 2>NUL || ver"
