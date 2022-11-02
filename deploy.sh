#!/bin/bash

# Copies a built version to a given output directory.

set -e

destdir="$1"
if [[ -z "$destdir" ]]; then
    echo "usage: $0 destdir"
    exit 1
fi

(cd viz && npm run bundle)
cp viz/{Inter-Bold.ttf,Inter-Regular.ttf,bundle.js,bundle.js.map} "$destdir"
cp viz/viz.html "$destdir/index.html"
