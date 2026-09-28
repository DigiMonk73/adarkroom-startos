#!/bin/sh
# Assemble the playable site: copy the A Dark Room source to OUT, drop what
# the browser never loads, add the graphics layer under OUT/gfx and wire it
# into index.html. Used by the Dockerfile and by scripts/dev.sh.
set -eu

SRC=${1:?usage: build-game.sh <game-src> <out-dir>}
OUT=${2:?usage: build-game.sh <game-src> <out-dir>}
ROOT=$(cd "$(dirname "$0")/.." && pwd)

rm -rf "$OUT"
mkdir -p "$OUT/gfx"
(cd "$SRC" && tar --exclude=.git --exclude=node_modules -cf - .) | (cd "$OUT" && tar -xf -)

# Upstream's dev server, docs and translation sources (the game loads the
# compiled lang/*/strings.js).
rm -rf "$OUT/tools" "$OUT/doc" "$OUT/dev-server.js" "$OUT/package.json" \
  "$OUT/yarn.lock" "$OUT/contributing.md" "$OUT/README.md" \
  "$OUT/lang/adarkroom.pot" "$OUT/lang/babel.cfg"
find "$OUT/lang" -name '*.po' -exec rm -f {} +

cp -R "$ROOT/graphics/gfx.css" "$ROOT/graphics/js" "$OUT/gfx/"
node "$ROOT/scripts/patch-index.mjs" "$OUT/index.html"
