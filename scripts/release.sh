#!/bin/sh
# Publish the GitHub release for a package version with its s9pks attached,
# once per version: when the version's release is already out, do nothing, so
# CI can run this on every push to master and a release appears exactly when
# startos/versions/current.ts gets a new version.
#
# Usage: scripts/release.sh <version> <commit> <s9pk>...
# Env:   GH_TOKEN and GH_REPO for gh; TITLE (the package title) and
#        RELEASE_NOTES (what's new, shown at the top of the release).
set -eu

usage='usage: release.sh <version> <commit> <s9pk>...'
VERSION=${1:?$usage}
COMMIT=${2:?$usage}
shift 2
[ $# -gt 0 ] || { echo "release.sh: no s9pk files given" >&2; exit 1; }
for f in "$@"; do
  [ -s "$f" ] || { echo "release.sh: $f is missing or empty" >&2; exit 1; }
done

# Start9's tag format (their extract-version action): 1.4.0:0 -> v1.4.0_0
TAG="v$(printf '%s' "$VERSION" | tr ':' '_')"

# A draft left by an interrupted run is finished over; a published release stays.
if draft=$(gh release view "$TAG" --json isDraft --jq .isDraft 2>/dev/null); then
  if [ "$draft" = false ]; then
    echo "$TAG is already released; nothing to do."
    exit 0
  fi
  echo "Removing the unfinished draft of $TAG"
  gh release delete "$TAG" --yes --cleanup-tag
fi

NOTES=$(mktemp)
trap 'rm -f "$NOTES"' EXIT
{
  echo "## What's new"
  echo
  printf '%s\n' "${RELEASE_NOTES:-}"
  echo
  echo "## Install"
  echo
  echo "Download the file for your server, then in StartOS choose **Sideload** and pick it."
  echo
  for f in "$@"; do
    name=$(basename "$f")
    case "$name" in
      *_x86_64.s9pk) echo "- \`$name\`: most servers and PCs (Intel or AMD)" ;;
      *_aarch64.s9pk) echo "- \`$name\`: ARM, such as a Raspberry Pi" ;;
      *) echo "- \`$name\`" ;;
    esac
  done
  echo
  echo "## SHA256"
  echo
  echo '```'
  for f in "$@"; do
    (cd "$(dirname "$f")" && sha256sum "$(basename "$f")")
  done
  echo '```'
} > "$NOTES"

# Upload everything to a draft first, so a release is never public half-uploaded.
gh release create "$TAG" "$@" --draft --target "$COMMIT" \
  --title "${TITLE:-A Dark Room (Graphics)} $VERSION" --notes-file "$NOTES"
gh release edit "$TAG" --draft=false --latest
echo "Released $TAG"
