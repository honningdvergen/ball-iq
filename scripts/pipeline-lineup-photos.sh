#!/bin/bash
# pipeline-lineup-photos.sh — the full photo-quality pipeline, in dependency order.
# Each stage is resumable (all writers skip ids already done), so a crash or a
# usage limit costs at most the stage in flight, never the run.
set -uo pipefail
cd /Users/alexanderbrynolsen/ball-iq
export PATH="/Users/alexanderbrynolsen/.nvm/versions/node/v25.9.0/bin:$PATH"

echo "=== [1/5] $(date +%H:%M) photo fetch for the widened core pool (--all --core) ==="
node scripts/fetch-mystery-photos.mjs --all --core || exit 1

echo "=== [2/5] $(date +%H:%M) face detection on the new photos ==="
node scripts/build-player-faces.mjs || exit 1

echo "=== [3/5] $(date +%H:%M) rebuild lineup payload ==="
node scripts/build-lineup-data.mjs || exit 1

echo "=== [4/5] $(date +%H:%M) photo re-pick — the long stage ==="
node scripts/repick-player-photos.mjs || exit 1

echo "=== [5/5] $(date +%H:%M) final rebuild + verify ==="
node scripts/build-lineup-data.mjs || exit 1
node scripts/verify-lineup-page.mjs || echo "(page verify failed — check the local server on :8899)"
node scripts/verify-lineup-prefill.mjs || echo "(prefill verify failed)"
echo "=== PIPELINE COMPLETE $(date +%H:%M) ==="
