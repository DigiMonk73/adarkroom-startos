#!/bin/sh
# Play the graphics build locally, without Docker or StartOS: assembles the
# adarkroom submodule plus graphics/ into build/game and serves it on
# http://localhost:8080 (set PORT to change). Files under graphics/ are
# served live: edit, reload.
set -eu

ROOT=$(cd "$(dirname "$0")/.." && pwd)
[ -f "$ROOT/adarkroom/index.html" ] || git -C "$ROOT" submodule update --init adarkroom

"$ROOT/scripts/build-game.sh" "$ROOT/adarkroom" "$ROOT/build/game"
exec node "$ROOT/scripts/serve.mjs" "$ROOT/build/game"
