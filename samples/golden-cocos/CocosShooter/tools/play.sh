#!/bin/bash
# Round A — one-command local playtest for the golden sample.
#
# This is a DEVELOPER CONVENIENCE for eyeballing the built game in a browser.
# It is NOT part of the product verification loop: in the product, the Verifier
# Agent drives the built web-mobile bundle headlessly through Playwright (no
# human, no manual server). Here we simply build both orientations, stage them
# into an isolated, git-ignored play dir, serve each on its own port, and open a
# browser so a human can try them.
#
# Usage:
#   bash tools/play.sh            # build both, serve, open browser
#   bash tools/play.sh --serve    # (re)serve already-built copies, no rebuild
#   bash tools/play.sh --stop     # stop the playtest servers and exit
#
# Notes:
# - Cocos web-mobile locks orientation: a LANDSCAPE build shown in a PORTRAIT
#   browser window is rotated 90deg by the engine (and vice-versa). For a clean
#   look, view the landscape build (8081) in a landscape-shaped window.
# - Fixed aspect ratio + letterbox: the game never stretches to fill the window;
#   mismatched window aspect shows black bars. That is intended.
set -u

SELF="$(cd "$(dirname "$0")" && pwd -P)"
PROJ="$(cd "$SELF/.." && pwd -P)"
WORK="$(cd "$PROJ/.." && pwd -P)/.build-work"
PLAY="$WORK/play"
PORT_PORTRAIT=8080
PORT_LANDSCAPE=8081
PIDS="$PLAY/.pids"

stop_servers() {
  if [ -f "$PIDS" ]; then
    while read -r pid; do
      [ -n "$pid" ] && kill "$pid" 2>/dev/null || true
    done < "$PIDS"
    rm -f "$PIDS"
  fi
  # Belt and suspenders: free the ports even if the pid file is stale.
  for port in "$PORT_PORTRAIT" "$PORT_LANDSCAPE"; do
    lsof -ti:"$port" 2>/dev/null | xargs kill -9 2>/dev/null || true
  done
  echo "playtest servers stopped (ports $PORT_PORTRAIT / $PORT_LANDSCAPE freed)"
}

serve_one() {
  local dir="$1" port="$2"
  ( cd "$dir" && python3 -m http.server "$port" --bind 127.0.0.1 >/dev/null 2>&1 ) &
  echo $! >> "$PIDS"
}

open_browser() {
  local url="$1"
  if command -v open >/dev/null 2>&1; then open "$url" >/dev/null 2>&1 || true; fi
}

case "${1:-}" in
  --stop)
    stop_servers
    exit 0
    ;;
esac

# --- stop any previous playtest servers before (re)starting -----------------
stop_servers

# --- build both orientations unless --serve was requested -------------------
if [ "${1:-}" != "--serve" ]; then
  echo "=== building portrait + landscape (fixed-ratio, letterboxed) ==="
  bash "$SELF/build.sh" portrait play-portrait || { echo "portrait build FAILED"; exit 1; }
  rm -rf "$PLAY/portrait"; mkdir -p "$PLAY"
  cp -R "$PROJ/build/web-mobile" "$PLAY/portrait"

  bash "$SELF/build.sh" landscape play-landscape || { echo "landscape build FAILED"; exit 1; }
  rm -rf "$PLAY/landscape"
  cp -R "$PROJ/build/web-mobile" "$PLAY/landscape"
fi

if [ ! -f "$PLAY/portrait/index.html" ] || [ ! -f "$PLAY/landscape/index.html" ]; then
  echo "no staged builds under $PLAY — run without --serve first"
  exit 1
fi

# --- serve each on its own port ---------------------------------------------
mkdir -p "$PLAY"; : > "$PIDS"
serve_one "$PLAY/portrait"  "$PORT_PORTRAIT"
serve_one "$PLAY/landscape" "$PORT_LANDSCAPE"
sleep 1

echo
echo "=== playtest ready ==="
echo "  portrait  (竖版): http://127.0.0.1:${PORT_PORTRAIT}/"
echo "  landscape (横版): http://127.0.0.1:${PORT_LANDSCAPE}/   <- 用横向窗口观看"
echo
echo "stop with:  bash tools/play.sh --stop"

open_browser "http://127.0.0.1:${PORT_PORTRAIT}/"
