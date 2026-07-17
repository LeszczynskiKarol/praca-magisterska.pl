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

# Strona promo na końcu każdego wzoru — poza formalnym oświadczeniem do podpisu.
BUILD_SRC="$SRC"
if [[ "$(basename "$SRC")" != wzor-oswiadczenia* ]]; then
  BUILD_SRC="$(mktemp --suffix=.md)"
  cat "$SRC" > "$BUILD_SRC"
  printf '\n\n' >> "$BUILD_SRC"
  cat "$HERE/promo-page.md" >> "$BUILD_SRC"
  trap 'rm -f "$BUILD_SRC"' EXIT
fi

echo "→ DOCX: $OUT.docx"
pandoc "$BUILD_SRC" \
  --reference-doc="$HERE/reference.docx" \
  --lua-filter="$HERE/center.lua" \
  -o "$DEST/$OUT.docx"

echo "→ PDF:  $OUT.pdf"
pandoc "$BUILD_SRC" \
  --pdf-engine=xelatex \
  -H "$HERE/header.tex" \
  --lua-filter="$HERE/center.lua" \
  -V lang=pl \
  -o "$DEST/$OUT.pdf"

echo "✓ Gotowe:"
ls -la "$DEST/$OUT.docx" "$DEST/$OUT.pdf"
