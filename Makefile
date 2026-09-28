ARCHES := x86 arm
# One s9pk holding both architectures: a sideload can't pick the wrong file,
# and StartOS keeps only its own architecture's image. The arm64 image needs
# no emulation to build (see Dockerfile), so one x86 runner builds both.
TARGETS := universal
# overrides to s9pk.mk must precede the include statement
include node_modules/@start9labs/start-sdk/s9pk.mk
