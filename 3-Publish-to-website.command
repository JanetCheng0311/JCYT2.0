#!/bin/bash
# Puts your latest edits on the live website (janetcheng0311.github.io/JCYT2.0).
# This is the only step that needs the internet + your GitHub login.
cd "$(dirname "$0")" || exit 1

echo "============================================"
echo "  Publishing your changes to the website"
echo "============================================"

if git diff --quiet && git diff --cached --quiet; then
  echo "Nothing has changed since the last publish. Edit content/about.txt first."
  echo ""
  read -p "Press Enter to close."
  exit 0
fi

git add -A
git commit -m "Update site content ($(date '+%Y-%m-%d %H:%M'))"

echo ""
echo "Uploading..."
if git push; then
  echo ""
  echo "✅  Done! Your site will refresh in about 1 minute:"
  echo "    https://janetcheng0311.github.io/JCYT2.0/about.html"
else
  echo ""
  echo "❌  Upload failed. Check your internet connection and GitHub login,"
  echo "    then try again."
fi
echo ""
read -p "Press Enter to close."
