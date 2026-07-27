#!/bin/bash
# Module Integration Sanity (方案 B) — same-machine reproducibility check.
# Builds the demo TWICE with identical params (portrait) into separate output
# dirs, then compares SHA-256 of key engine/runtime artifacts. Identical hashes
# demonstrate byte-level reproducibility ("input unchanged => output unchanged").
set -u

SELF="$(cd "$(dirname "$0")" && pwd -P)"
PROJ="$(cd "$SELF/.." && pwd -P)"
WORK="$(cd "$PROJ/.." && pwd -P)/.build-work"
R1="$WORK/repro-1"
R2="$WORK/repro-2"

ORIENT="portrait"

do_build() {
  local dest="$1"
  bash "$SELF/build.sh" "$ORIENT" "repro" >/dev/null 2>&1
  local code=$?
  rm -rf "$dest"
  cp -R "$PROJ/build/web-mobile" "$dest"
  return $code
}

echo "=== build #1 ==="; do_build "$R1"; C1=$?
echo "exit1=$C1"
echo "=== build #2 ==="; do_build "$R2"; C2=$?
echo "exit2=$C2"

echo "=== key artifact SHA-256 comparison ==="
KEYS=(
  "index.html"
  "index.js"
  "application.js"
  "cocos-js/cc.js"
  "src/settings.json"
  "src/chunks/bundle.js"
)
ALL_MATCH=1
for k in "${KEYS[@]}"; do
  if [ -f "$R1/$k" ] && [ -f "$R2/$k" ]; then
    h1=$(shasum -a 256 "$R1/$k" | awk '{print $1}')
    h2=$(shasum -a 256 "$R2/$k" | awk '{print $1}')
    if [ "$h1" == "$h2" ]; then echo "IDENTICAL  $k  $h1";
    else echo "DIFFERENT  $k  $h1 != $h2"; ALL_MATCH=0; fi
  else
    echo "MISSING    $k"; ALL_MATCH=0
  fi
done
echo "=== $([ $ALL_MATCH -eq 1 ] && echo REPRODUCIBLE || echo NOT-REPRODUCIBLE) ==="
