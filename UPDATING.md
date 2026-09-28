# Updating

This package has two moving parts: the upstream game, and the graphics layer
that lives in this repository (`graphics/`).

## Determining the upstream version

The upstream is [doublespeakgames/adarkroom](https://github.com/doublespeakgames/adarkroom).
It publishes no releases or images; it is tracked by commit on its `main`
branch. The pin is the commit of the `adarkroom` submodule:

```sh
git -C adarkroom fetch origin main
git -C adarkroom log --oneline HEAD..origin/main   # what is new upstream
```

## Applying the bump

1. Move the submodule and record it:

   ```sh
   git -C adarkroom checkout <commit>
   git add adarkroom
   ```

2. Run the tests (`npm test`, `npm run test:game`) and play-test with
   `scripts/dev.sh` (below). `scripts/patch-index.mjs` stops
   the build if upstream's `index.html` no longer has the pieces it edits;
   update the patterns there if so. If upstream renamed a function the
   graphics layer wraps (`Room.onFireChange`, `World.drawMap`,
   `Events.startCombat`, `damage`, `winFight`, `loseFight`) or a state key it
   reads, the affected scene stops drawing and logs `[gfx]` in the browser
   console: fix the layer to match.
3. Raise the package version (next section).

## The package version

`startos/versions/current.ts` holds `version: '<upstream>:<revision>'`.
`<upstream>` is the game's content version (1.4.0, the release that added The
Executioner); upstream has no version tags, so it changes only when upstream
ships a new content release. Everything else, including graphics-layer
changes and upstream commits within 1.4, raises the revision
(`1.4.0:0` → `1.4.0:1`), with release notes in all five locales.

The `up` migration is empty (the package keeps no data), so edit
`current.ts` in place. `down` stays `IMPOSSIBLE`, as in Start9's template.

## Base images

The `Dockerfile` pins `nginx:<minor>-alpine` (serves the game) and
`node:<major>-alpine` (only assembles the site at build time). Bump the nginx
minor when a new stable line comes out, check `docker run` still serves the
game, and raise the revision.

## Playing it locally

No Docker or StartOS needed; Node 18+ and git:

```sh
./scripts/dev.sh          # http://localhost:8080 (PORT=… to change)
```

It assembles `adarkroom/` plus `graphics/` into `build/game` exactly as the
image does, and serves `graphics/` live, so edits show on a browser reload.

## Building the package

Needs Docker (with the containerd image store, for the arm64 image), Node 22,
`make`, `jq` and [start-cli](https://docs.start9.com/packaging/environment-setup.html).
start-cli packs only inside a packaging workspace (a directory above the
repository holding `.startos/`):

```sh
git submodule update --init
npm ci
start-cli s9pk init-workspace ..   # once
make                               # adarkroom-graphics_x86_64.s9pk and _aarch64.s9pk
make x86 install                   # build for x86 and install on the workspace's device
```

`make universal` builds one `adarkroom-graphics.s9pk` with both architectures.
Sideloading it in StartOS (**Sideload** in the top bar) works too.

## Continuous integration

`.github/workflows/ci.yml` runs on every push: the package checks and unit
tests, then the game tests (Playwright) against the Docker image, then
Start9's standard s9pk build. Each run's **Artifacts** hold
`adarkroom-graphics_x86_64.s9pk` and `adarkroom-graphics_aarch64.s9pk`
(kept 14 days) to sideload; a failed game test leaves a `playwright-report`
artifact with screenshots and traces.

## Releasing

On each push to `master`, Start9's **Tag and Release** workflow tags the
version and makes a GitHub release with the s9pks when that version is new.
It stays off until these exist on this repository:

- **Secret `DEV_KEY`**: the package signing key, an Ed25519 PEM
  (`openssl genpkey -algorithm ed25519 -out adarkroom-dev.key.pem`). Keep the
  key offline; every release must be signed by the same one.
- **Variable `REFERENCE_REGISTRY`**: the registry that counts as already
  released, e.g. `https://community-registry.start9.com`. Leave
  `RELEASE_REGISTRY` unset to only make GitHub releases.

To list the package on Start9's community registry, email
<submissions@start9.com>: Start9 forks this repository into Start9-Community,
and from then on changes go to their fork as pull requests
([Publishing](https://docs.start9.com/packaging/publishing.html)).
