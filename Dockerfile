# A Dark Room with the graphics layer, served as static files by nginx.
# Build context is the repository root, with the adarkroom submodule checked
# out (git submodule update --init).

# The site is plain files, the same for every architecture: assemble it once,
# natively on the build machine, so the arm64 image needs no emulation.
FROM --platform=$BUILDPLATFORM node:22-alpine AS site
WORKDIR /src
COPY adarkroom/ adarkroom/
COPY graphics/ graphics/
COPY scripts/build-game.sh scripts/patch-index.mjs scripts/
RUN sh scripts/build-game.sh adarkroom /site

FROM nginx:1.28-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=site /site /usr/share/nginx/html
