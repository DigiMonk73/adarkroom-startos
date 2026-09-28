# A Dark Room — graphics edition (for StartOS)

[A Dark Room](https://github.com/doublespeakgames/adarkroom) with a graphics
layer on top, plus the StartOS wrapper that will package it.

## What the graphics add

- **The room** — a stone hearth whose fire follows the game's five fire
  levels. The fire is the only light: a new game starts in near-black, and
  each stoke pushes the dark back (with a shower of sparks). The builder
  appears by the hearth as her story advances, the woodpile tracks your wood,
  and frost creeps in while the room is cold.
- **The village** — a dusk scene under the grey, windblown sky. Huts and every
  other building appear as you build them, the cabin's windows glow with the
  fire, chimneys smoke, and villagers walk the snow as the population grows.
- **The world** — the ASCII map drawn as pixel-art tiles, with a camera that
  follows the wanderer, the game's own fog of war, a minimap, landmark names
  on hover, and click-to-move.
- **Combat** — every enemy gets a pixel-art sprite generated from its name
  (47 enemy types); hits flash and shake, the loser falls.

"graphics off." in the menu returns to the original text game. Saves are the
same either way.

| | |
|---|---|
| ![The room before the fire is lit](docs/screenshots/room-dark.png) | ![The room with a roaring fire](docs/screenshots/room.png) |
| ![The village](docs/screenshots/village.png) | ![The world map](docs/screenshots/world.png) |
| ![A fight](docs/screenshots/combat.png) | ![Every enemy sprite](docs/screenshots/enemies.png) |

## How it works

The layer is an overlay: it never edits the game's logic. It reads state
through the game's `$SM` and wraps a few of its functions (`Room.onFireChange`,
`World.drawMap`, `Events.startCombat`/`damage`/`winFight`/`loseFight`) to draw
on canvases behind or over the text UI. Scenes are drawn in code — there are
no image assets.

At build time `scripts/patch-index.mjs` adds the layer to the game's
`index.html` and removes its two outside calls (Google Analytics and jQuery
from Google's CDN), so a self-hosted copy works offline and phones nobody.

The upstream game is pinned in `game.env`. To take a newer upstream, bump
`GAME_COMMIT`; the patch script fails loudly if `index.html` has changed
shape.

```
graphics/
  gfx.css          styles, all scoped to body.gfx
  js/core.js       toggle, animation loop, canvas and hook helpers
  js/room.js       hearth, fire and light
  js/village.js    village scene
  js/world.js      tile map, camera, minimap
  js/combat.js     fighter sprites and hit effects
scripts/
  dev.sh           fetch the pinned game, assemble, serve on :8080
  build-game.sh    assemble game + graphics into a directory
  patch-index.mjs  wire the layer into index.html
  serve.mjs        zero-dependency static server (serves graphics/ live)
game.env           upstream repo and commit
```

## Play it locally

Needs `git` and Node 18+.

```
./scripts/dev.sh          # then open http://localhost:8080
PORT=3000 ./scripts/dev.sh
```

Edits under `graphics/` show on a browser reload.

## StartOS package

The `startos/` wrapper still targets the old SDK (`@start9labs/start-sdk`
0.3.6) and does not work as is: the game listens on 8080 but the wrapper
binds and health-checks 8081. The next step is to port it to start-sdk 2.x
(following [BTCTX-StartOS](https://github.com/DigiMonk73/BTCTX-StartOS)) and
build the image from `game.env` plus this overlay instead of the `adarkroom`
submodule.
