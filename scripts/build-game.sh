#!/bin/sh
# Assemble a playable game: copy the upstream A Dark Room source to OUT, add
# the graphics layer under OUT/gfx and wire it into index.html.
set -eu

SRC=${1:?usage: build-game.sh <game-src> <out-dir>}
OUT=${2:?usage: build-game.sh <game-src> <out-dir>}
ROOT=$(cd "$(dirname "$0")/.." && pwd)

rm -rf "$OUT"
mkdir -p "$OUT/gfx"
(cd "$SRC" && tar --exclude=.git --exclude=node_modules -cf - .) | (cd "$OUT" && tar -xf -)
cp -R "$ROOT/graphics/gfx.css" "$ROOT/graphics/js" "$OUT/gfx/"
node "$ROOT/scripts/patch-index.mjs" "$OUT/index.html"
