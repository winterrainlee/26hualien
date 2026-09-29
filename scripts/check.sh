#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT"

echo "Regenerating derived data..."
python3 scripts/build_map.py
python3 scripts/build_notes.py

echo "Checking JavaScript syntax..."
node --check map-data.js
node --check notes.js
node --check neighbor-labels.js
node --check app.js

echo "Checking generated files are committed and current..."
if ! git diff --exit-code -- map-data.js neighbor-labels.js notes.js; then
  echo >&2
  echo "Generated files are out of date." >&2
  echo "Run the build scripts and commit map-data.js, neighbor-labels.js, and notes.js." >&2
  exit 1
fi

echo "Building deployable site..."
python3 scripts/build_site.py _site

echo "All checks passed."
