#!/usr/bin/env bash
# Składa komplet prac wzorcowych do .prace-out/ (NIE public/ — pliki są płatne).
# Tytuł i kierunek pochodzą z KATALOG-PRAC-lista.md — nie z nazwy pliku, bo ta
# jest slugiem roboczym autopilota i nie nadaje się na stronę tytułową.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
ZRODLA="${ZRODLA:-/d/smart-edu-autopilot/output/_PRACE-Z-NAPRAWIONYMI-PRZYPISAMI-2026-07-31/_gotowe}"
OUT="${OUT:-$ROOT/.prace-out}"   # NIE public/ — patrz build-prace.py

buduj() {  # <plik> <kierunek> <tytuł>
  python "$HERE/build-prace.py" "$ZRODLA/$1" --kierunek "$2" --tytul "$3" --out "$OUT"
}

buduj instagram-obraz-ciala-zaburzenia-odzywiania-PROD-mgr-pl.html \
  "Psychologia" \
  "Nadmierne korzystanie z Instagrama a obraz ciała i objawy zaburzeń odżywiania u dziewcząt w wieku 14–18 lat"

buduj prokrastynacja-akademicka-medycyna-PROD-mgr-pl.html \
  "Psychologia" \
  "Prokrastynacja akademicka studentów kierunków medycznych a lęk przed oceną i perfekcjonizm"

buduj stres-funkcjonariuszy-psp-PROD-mgr-pl.html \
  "Psychologia" \
  "Stres zawodowy i strategie radzenia sobie u funkcjonariuszy Państwowej Straży Pożarnej"

buduj wypalenie-zawodowe-nauczycieli-edukacji-wczesnoszkolnej-po-okresie-nauczania-mgr-pl.html \
  "Psychologia" \
  "Wypalenie zawodowe nauczycieli edukacji wczesnoszkolnej po okresie nauczania zdalnego"

buduj wypalenie-pielegniarek-anestezjologicznych-PROD-mgr-pl.html \
  "Pielęgniarstwo" \
  "Wypalenie zawodowe pielęgniarek anestezjologicznych i intensywnej opieki"

# Praca przeglądowa — jedyna bez rozdziału z badaniem własnym, więc jedyna
# bez noty o danych przykładowych. Dokończona 2026-08-14 (przypisy w R3/R4,
# bibliografia 21 → 38, streszczenie, abstrakt, wykaz skrótów).
buduj czas-ekranowy-rozwoj-mowy-mgr-pl.html \
  "Pedagogika" \
  "Wpływ czasu ekranowego na rozwój mowy dzieci w wieku 2–5 lat w świetle badań z lat 2015–2025"

echo
echo "Gotowe:"
ls -la "$OUT"
