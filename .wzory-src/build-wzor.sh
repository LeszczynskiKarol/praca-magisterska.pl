#!/usr/bin/env bash
# Buduje wzór do pobrania (DOCX + PDF) z jednego źródła Markdown.
# Użycie: ./build-wzor.sh <plik-zrodlowy.md> <nazwa-wyjsciowa-bez-rozszerzenia>
# Wynik trafia do public/downloads/
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
SRC="$1"
OUT="$2"
DEST="$ROOT/public/downloads"
mkdir -p "$DEST"

echo "→ DOCX: $OUT.docx"
pandoc "$SRC" \
  --reference-doc="$HERE/reference.docx" \
  --lua-filter="$HERE/center.lua" \
  -o "$DEST/$OUT.docx"

echo "→ PDF:  $OUT.pdf"
pandoc "$SRC" \
  --pdf-engine=xelatex \
  -H "$HERE/header.tex" \
  --lua-filter="$HERE/center.lua" \
  -V lang=pl \
  -o "$DEST/$OUT.pdf"

echo "✓ Gotowe:"
ls -la "$DEST/$OUT.docx" "$DEST/$OUT.pdf"
