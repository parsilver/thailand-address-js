#!/usr/bin/env bash
# Packs packages/core into <dest-dir> exactly as the release publishes it, and
# checks the tarball holds what consumers import. release.yml publishes the
# file this prints; ci.yml runs the same script on every PR, so the release's
# pack step cannot break unseen again (v0.1.0 failed because npm pack does not
# create its --pack-destination).
#
# Usage: scripts/pack-core.sh <dest-dir>   (packages/core must be built first)
set -euo pipefail

[ $# -eq 1 ] || { echo "usage: $0 <dest-dir>" >&2; exit 2; }
mkdir -p "$1"
dest="$(cd "$1" && pwd)"
cd "$(dirname "$0")/../packages/core"

file="$(npm pack --pack-destination "$dest" --json | node -e '
  let s = ""
  process.stdin.on("data", (d) => (s += d)).on("end", () => console.log(JSON.parse(s)[0].filename))
')"
tgz="$dest/$file"
[ -f "$tgz" ] || { echo "::error::npm pack reported $file but $tgz does not exist" >&2; exit 1; }

contents="$(tar -tzf "$tgz")"
for f in package/package.json package/README.md package/dist/index.js package/dist/index.d.ts package/schema/schema.json; do
  grep -qx "$f" <<<"$contents" || { echo "::error::$f is missing from $tgz" >&2; exit 1; }
done
echo "$tgz"
