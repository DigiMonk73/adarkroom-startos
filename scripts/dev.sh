#!/bin/sh
# Play the graphics build locally. Fetches the pinned upstream game into
# .cache/, assembles it into build/game and serves it on http://localhost:8080
# (set PORT to change). Files under graphics/ are served live: edit, reload.
set -eu

ROOT=$(cd "$(dirname "$0")/.." && pwd)
. "$ROOT/game.env"
SRC="$ROOT/.cache/adarkroom"

if [ ! -d "$SRC/.git" ]; then
  git init -q "$SRC"
  git -C "$SRC" remote add origin "$GAME_REPO"
fi
if [ "$(git -C "$SRC" rev-parse -q --verify HEAD 2>/dev/null || true)" != "$GAME_COMMIT" ]; then
  git -C "$SRC" fetch -q --depth 1 origin "$GAME_COMMIT"
  git -C "$SRC" checkout -q --detach FETCH_HEAD
fi

"$ROOT/scripts/build-game.sh" "$SRC" "$ROOT/build/game"
exec node "$ROOT/scripts/serve.mjs" "$ROOT/build/game"
