#!/usr/bin/env bash
# Składa komplet prac wzorcowych do .prace-out/ (NIE public/ — pliki są płatne).
#
# Lista prac pochodzi z src/data/prace.json, generowanego przez zbierz-metadane.py.
# Wcześniej tytuły i kierunki były wpisane tutaj na sztywno, czyli dwa miejsca do
# aktualizacji przy każdej nowej pracy — i przy jednej z takich aktualizacji
# wszystkie wpisy dostały literalne „\n” zamiast łamania linii, co po cichu
# przekazywało `\n` jako osobny argument. Teraz źródło prawdy jest jedno.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
ZRODLA="${ZRODLA:-/d/smart-edu-autopilot/output/_PRACE-Z-NAPRAWIONYMI-PRZYPISAMI-2026-07-31/_gotowe}"
OUT="${OUT:-$ROOT/.prace-out}"
DANE="$ROOT/src/data/prace.json"

# Nazwa kierunku w mianowniku — trafia na stronę tytułową pracy.
nazwa_kierunku() {
  case "$1" in
    psychologia)    echo "Psychologia" ;;
    pielegniarstwo) echo "Pielęgniarstwo" ;;
    pedagogika)     echo "Pedagogika" ;;
    prawo)          echo "Prawo" ;;
    *)              echo "$1" ;;
  esac
}

# Jedna praca = jedna linia: <plik-html><TAB><kierunek><TAB><tytuł>
python -c "
import json, sys
for p in json.load(open(sys.argv[1], encoding='utf-8')):
    print(p['slugHtml'] + '\t' + p['kierunek'] + '\t' + p['tytul'])
" "$DANE" | while IFS=$'\t' read -r PLIK KIERUNEK TYTUL; do
  echo "── $PLIK"
  python "$HERE/build-prace.py" "$ZRODLA/$PLIK.html" \
    --kierunek "$(nazwa_kierunku "$KIERUNEK")" \
    --tytul "$TYTUL" \
    --out "$OUT"
done

echo
echo "Gotowe:"
ls -la "$OUT"
