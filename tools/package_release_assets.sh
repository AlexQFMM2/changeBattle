#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT="${1:-$ROOT_DIR/release/changeBattleV2-assets.tgz}"

cd "$ROOT_DIR"

REQUIRED_PATHS=(
  "assets/board/rest-panel-frame.png"
  "assets/title/spritesaurus-transition.mp4"
  "assets/ui/button-gold.png"
  "assets/npc/staff/buy.png"
  "assets/npc/staff/judge.png"
  "assets/npc/staff/nurse.png"
  "assets/npc/staff/teach.png"
  "assets/music/battle/trainer.ogg"
  "assets/music/boss/xyz.ogg"
  "assets/music/nonbattle/yurenu-omoi.ogg"
  "assets/music/rest/pokemon-center.ogg"
)

for REQUIRED_PATH in "${REQUIRED_PATHS[@]}"; do
  if [[ ! -e "$REQUIRED_PATH" ]]; then
    echo "Required release asset is missing: $REQUIRED_PATH" >&2
    exit 1
  fi
done

mkdir -p "$(dirname "$OUTPUT")"
tar --exclude='.DS_Store' -czf "$OUTPUT" assets
sha256sum "$OUTPUT" | tee "$OUTPUT.sha256"

cat <<EOF

Release assets archive ready:
  $OUTPUT
  $OUTPUT.sha256

Configure GitHub repository secrets:
  CHANGEBATTLE_RELEASE_ASSETS_URL     URL to this .tgz on your server
  CHANGEBATTLE_RELEASE_ASSETS_SHA256  $(cut -d' ' -f1 "$OUTPUT.sha256")

Optional, only if the URL requires auth:
  CHANGEBATTLE_RELEASE_ASSETS_AUTHORIZATION
EOF
