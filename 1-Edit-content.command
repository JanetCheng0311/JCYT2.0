#!/bin/bash
# Opens your editable content files in TextEdit (plain words).
cd "$(dirname "$0")" || exit 1
echo "Opening your content files in TextEdit..."
open -e content/about.txt
echo "When you're done editing, save the file, then double-click"
echo "\"3-Publish-to-website.command\" to put the changes online."
sleep 1
