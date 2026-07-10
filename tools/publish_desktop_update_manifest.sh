#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="${1:-}"
UPDATE_HOST="${CHANGEBATTLE_UPDATE_HOST:-ubuntu@119.45.240.157}"
REMOTE_TMP_DIR="${CHANGEBATTLE_UPDATE_REMOTE_TMP_DIR:-/tmp/changebattle-update-manifest}"
CHANNEL="${CHANGEBATTLE_RELEASE_CHANNEL:-stable}"

if [[ "$CHANNEL" != "stable" && "$CHANNEL" != "beta" ]]; then
  echo "CHANGEBATTLE_RELEASE_CHANNEL must be stable or beta, got: $CHANNEL" >&2
  exit 1
fi

if [[ "$CHANNEL" == "beta" ]]; then
  DEFAULT_UPDATE_WEB_ROOT="/home/ubuntu/webApp/changebattle-beta"
  DEFAULT_OFFICIAL_SITE_URL="https://65h26i.top/changebattle-beta/"
else
  DEFAULT_UPDATE_WEB_ROOT="/home/ubuntu/webApp/changebattle"
  DEFAULT_OFFICIAL_SITE_URL="https://65h26i.top/changebattle/"
fi

UPDATE_WEB_ROOT="${CHANGEBATTLE_UPDATE_WEB_ROOT:-$DEFAULT_UPDATE_WEB_ROOT}"
OFFICIAL_SITE_URL="${CHANGEBATTLE_OFFICIAL_SITE_URL:-$DEFAULT_OFFICIAL_SITE_URL}"
export CHANGEBATTLE_RELEASE_CHANNEL="$CHANNEL"
export CHANGEBATTLE_OFFICIAL_SITE_URL="$OFFICIAL_SITE_URL"

cd "$ROOT_DIR"

if [[ -z "$VERSION" ]]; then
  VERSION="$(node -p "require('./package.json').version")"
fi

mkdir -p "$ROOT_DIR/release/changebattle"
PREVIOUS_LATEST_JSON="$ROOT_DIR/release/changebattle/previous-latest-$CHANNEL.json"
rm -f "$PREVIOUS_LATEST_JSON"
if curl -fsSL "${OFFICIAL_SITE_URL%/}/latest.json" -o "$PREVIOUS_LATEST_JSON"; then
  export CHANGEBATTLE_PREVIOUS_LATEST_JSON="$PREVIOUS_LATEST_JSON"
  echo "Fetched previous latest.json for $CHANNEL link inheritance."
else
  rm -f "$PREVIOUS_LATEST_JSON"
  unset CHANGEBATTLE_PREVIOUS_LATEST_JSON
  echo "Previous latest.json unavailable; download mirrors must be supplied explicitly if needed."
fi

node tools/generate_desktop_update_manifest.mjs "$VERSION" --channel "$CHANNEL" --official-site-url "$OFFICIAL_SITE_URL"

LOCAL_DIR="$ROOT_DIR/release/changebattle"
if [[ ! -f "$LOCAL_DIR/latest.json" || ! -f "$LOCAL_DIR/index.html" ]]; then
  echo "Generated update files are missing in $LOCAL_DIR" >&2
  exit 1
fi

echo "Preparing update directory on $UPDATE_HOST..."
ssh "$UPDATE_HOST" "rm -rf '$REMOTE_TMP_DIR' && mkdir -p '$REMOTE_TMP_DIR'"

echo "Uploading latest.json and index.html..."
scp "$LOCAL_DIR/latest.json" "$LOCAL_DIR/index.html" "${UPDATE_HOST}:${REMOTE_TMP_DIR}/"
if [[ -d "$LOCAL_DIR/image" ]]; then
  echo "Uploading download page screenshots..."
  tar -C "$LOCAL_DIR" -czf "$REMOTE_TMP_DIR-image.tar.gz" image
  scp "$REMOTE_TMP_DIR-image.tar.gz" "${UPDATE_HOST}:${REMOTE_TMP_DIR}/image.tar.gz"
  rm -f "$REMOTE_TMP_DIR-image.tar.gz"
  ssh "$UPDATE_HOST" "cd '$REMOTE_TMP_DIR' && tar -xzf image.tar.gz"
fi
if [[ -d "$LOCAL_DIR/manifests" ]]; then
  echo "Uploading file manifests..."
  tar -C "$LOCAL_DIR" -czf "$REMOTE_TMP_DIR-manifests.tar.gz" manifests
  scp "$REMOTE_TMP_DIR-manifests.tar.gz" "${UPDATE_HOST}:${REMOTE_TMP_DIR}/manifests.tar.gz"
  rm -f "$REMOTE_TMP_DIR-manifests.tar.gz"
  ssh "$UPDATE_HOST" "cd '$REMOTE_TMP_DIR' && tar -xzf manifests.tar.gz"
fi
if [[ -d "$LOCAL_DIR/files" ]]; then
  echo "Uploading incremental files..."
  tar -C "$LOCAL_DIR" -czf "$REMOTE_TMP_DIR-files.tar.gz" files
  scp "$REMOTE_TMP_DIR-files.tar.gz" "${UPDATE_HOST}:${REMOTE_TMP_DIR}/files.tar.gz"
  rm -f "$REMOTE_TMP_DIR-files.tar.gz"
  ssh "$UPDATE_HOST" "cd '$REMOTE_TMP_DIR' && tar -xzf files.tar.gz"
fi

echo "Publishing update metadata to $UPDATE_WEB_ROOT..."
ssh "$UPDATE_HOST" "sudo mkdir -p '$UPDATE_WEB_ROOT' && if [ -d '$REMOTE_TMP_DIR/image' ]; then sudo mkdir -p '$UPDATE_WEB_ROOT/image' && sudo cp -a '$REMOTE_TMP_DIR/image/.' '$UPDATE_WEB_ROOT/image/'; fi && if [ -d '$REMOTE_TMP_DIR/manifests' ]; then sudo mkdir -p '$UPDATE_WEB_ROOT/manifests' && sudo cp -a '$REMOTE_TMP_DIR/manifests/.' '$UPDATE_WEB_ROOT/manifests/'; fi && if [ -d '$REMOTE_TMP_DIR/files' ]; then sudo mkdir -p '$UPDATE_WEB_ROOT/files' && sudo cp -a '$REMOTE_TMP_DIR/files/.' '$UPDATE_WEB_ROOT/files/'; fi && sudo install -m 0644 '$REMOTE_TMP_DIR/latest.json' '$UPDATE_WEB_ROOT/latest.json' && sudo install -m 0644 '$REMOTE_TMP_DIR/index.html' '$UPDATE_WEB_ROOT/index.html'"

echo "Published:"
echo "  ${OFFICIAL_SITE_URL%/}/latest.json"
echo "  $OFFICIAL_SITE_URL"
