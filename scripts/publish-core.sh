#!/usr/bin/env bash
# Publishes the one core tarball in <dir> to npm. release.yml calls it for the
# real publish; ci.yml calls it with --dry-run on every PR, from the same
# relative layout (a pkg/ directory beside the working directory), so the two
# run the identical npm command.
#
# The path handed to npm is absolute: npm reads a bare relative "pkg/x.tgz" as a
# GitHub user/repo shorthand and tries git over ssh (the v0.1.0 publish failed
# that way).
#
# Usage: scripts/publish-core.sh <dir> [npm publish flags, e.g. --provenance or --dry-run]
set -euo pipefail

[ $# -ge 1 ] || { echo "usage: $0 <dir> [npm publish flags]" >&2; exit 2; }
dir="$1"
shift

shopt -s nullglob
tarballs=("$dir"/*.tgz)
[ "${#tarballs[@]}" -eq 1 ] || {
  echo "::error::expected exactly one .tgz in $dir, found ${#tarballs[@]}" >&2
  exit 1
}
tgz="$(cd "$(dirname "${tarballs[0]}")" && pwd)/$(basename "${tarballs[0]}")"

echo "publishing $tgz $*"
npm publish "$tgz" --access public "$@"
