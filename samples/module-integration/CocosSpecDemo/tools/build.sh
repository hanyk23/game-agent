#!/bin/bash
# Module Integration Sanity (方案 B) — headless Cocos 3.8.7 web-mobile build.
#
# Byte-for-byte the golden recipe, retargeted at this demo project:
#   - realpath-normalized project/home/engine paths (no /tmp symlink)
#   - --no-sandbox, and NOT --disable-gpu
#   - writable engine copy so the sandboxed subprocess can write its cache
#   - trust exit code 36 == success (34 = build failed, 32 = bad params)
#   - orientation injected via packages.web-mobile.orientation
#
# Usage: build.sh <portrait|landscape|auto> [outLabel]
set -u

ORIENT="${1:-portrait}"
LABEL="${2:-$ORIENT}"

BIN="/Applications/Cocos/Creator/3.8.7/CocosCreator.app/Contents/MacOS/CocosCreator"
SELF="$(cd "$(dirname "$0")" && pwd -P)"
PROJ="$(cd "$SELF/.." && pwd -P)"                 # .../CocosSpecDemo (realpath)
WORK="$(cd "$PROJ/.." && pwd -P)/.build-work"     # sibling scratch (git-ignored)
HOME_DIR="$WORK/home"
UDATA="$WORK/userdata"
ENGINE_SRC="/Applications/Cocos/Creator/3.8.7/CocosCreator.app/Contents/Resources/resources/3d/engine"
ENGINE="$WORK/engine"

PKGS="{\"web-mobile\":{\"orientation\":\"${ORIENT}\"}}"

mkdir -p "$HOME_DIR" "$UDATA"
# Writable engine copy (APFS copy-on-write) so the sandboxed subprocess can
# write its compile cache; only needed when the install dir is not writable.
if [ ! -d "$ENGINE" ]; then
  cp -cR "$ENGINE_SRC" "$ENGINE" 2>/dev/null || cp -R "$ENGINE_SRC" "$ENGINE"
fi

rm -rf "$PROJ/build" "$PROJ/temp"

echo "=== Headless build: platform=web-mobile orientation=${ORIENT} label=${LABEL} ==="
echo "PROJECT=$PROJ"
date
"$BIN" \
  --home "$HOME_DIR" \
  --user-data-dir="$UDATA" \
  --no-sandbox \
  --engine "$ENGINE" \
  --project "$PROJ" \
  --build "platform=web-mobile;packages=${PKGS}" \
  > "$WORK/build-${LABEL}.log" 2>&1
CODE=$?
date
echo "=== EXIT_CODE=${CODE} (36=success 34=build-failed 32=bad-params) ==="
echo "index.html present: $([ -f "$PROJ/build/web-mobile/index.html" ] && echo yes || echo no)"
exit "$CODE"
