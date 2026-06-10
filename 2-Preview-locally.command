#!/bin/bash
# Shows your website on THIS computer only (nobody else can see it).
# Lets you check your edits before publishing. Close this window to stop.
cd "$(dirname "$0")" || exit 1
PORT=8123
echo "============================================"
echo "  Local preview — only on this computer"
echo "  Opening: http://localhost:$PORT/about.html"
echo "  (Close this window when you're done.)"
echo "============================================"
# open the browser a moment after the server starts
( sleep 1; open "http://localhost:$PORT/about.html" ) &
# serve this folder; Ctrl+C or closing the window stops it
python3 -m http.server "$PORT"
