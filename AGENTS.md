# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

**Start every task at the recipe index** — `../start-technologies/projects/start-sdk/docs/src/recipes.md`
(or <https://docs.start9.com/packaging/recipes.html>). It maps an intent to the constructs, the
reference pages, and a named production package to copy.

Keep `README.md` (technical reference for an AI support or administering agent) and
`instructions.md` (end-user docs) in sync with your changes. Upstream bumps, versions, base
images, local builds and releasing: `UPDATING.md`.

**Bugs and feature requests are GitHub issues on this repo** — file them as you find them.
Don't record work in the repo instead: no `TODO.md`, no `NOTES.md`, no `PLAN.md`.

## This repo

- **Two parts, one image.** The game is the `adarkroom` submodule, pinned to an upstream commit
  and never edited. The graphics layer is `graphics/`: an overlay loaded after the game's
  scripts that reads state through the game's `$SM` and wraps a few of its functions
  (`graphics/js/core.js` `Gfx.after`) to draw on canvases. It must never change the game's
  rules. The only edit to an upstream file is `index.html`, made at build time by
  `scripts/patch-index.mjs`, which also strips Google Analytics and the jQuery CDN tag.
- **`scripts/build-game.sh` is the one assembly path**, used by both the `Dockerfile` and
  `scripts/dev.sh`. Play-test with `scripts/dev.sh` (no Docker; serves `graphics/` live), then
  `docker build .`.
- **Every scene must fail alone.** The animation loop disables a scene that throws and logs
  `[gfx]`; `Gfx.after` swallows hook errors. A graphics bug may cost a picture, never the game.
- **"graphics off." must give back the stock game**: no canvases, no `body.gfx`, the player's
  own lights setting. Scope all CSS to `body.gfx`.
- **No volumes, by design.** Saves are the game's own browser local storage. Server-side saves
  would need a volume, a backup and a server process; nginx serves files only.
- **Ids are frozen once published:** package `adarkroom-graphics`, host `ui-multi`, interface
  `ui`, daemon and health check `webui`.
- **i18n:** every package string goes through `i18n()`, with `es_ES`, `de_DE`, `pl_PL` and
  `fr_FR` translations in `startos/i18n/dictionaries/translations.ts`. The graphics layer's
  own menu text goes through the game's `_()`.
- **Releases come from CI, not Start9's release workflows:** a new version in
  `startos/versions/current.ts` merged to `master` becomes a GitHub release with the universal s9pk
  (`scripts/release.sh`, once per version). Start9's tag-and-release workflows need a signing
  key and a registry; Start9 adds them on its fork if the package is submitted.
- **Checks** (all run by `.github/workflows/ci.yml` on every push, which then builds the
  s9pk): `npm run check && npm run lint && npm run build && node scripts/check-manifest.mjs &&
  npm run format:check`, `npm test` (unit tests: `tests/unit/`), and `npm run test:game`
  (Playwright plays the game: `tests/e2e/`; first `cd tests && npm ci && npx playwright
  install chromium`). Unset `BASE_URL`, the game tests
  assemble and serve the game themselves; CI runs them against the Docker image with
  `CHECK_IMAGE=1`, which adds the nginx header checks.
- **The game tests fail on any page error, console error, request leaving the server, or
  graphics scene that disabled itself** (`tests/e2e/fixtures.js`). A new scene or feature gets
  a spec; an upstream enemy is covered automatically by `combat.spec.js`.
