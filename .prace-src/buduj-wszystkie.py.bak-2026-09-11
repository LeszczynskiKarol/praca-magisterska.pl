"""Składa komplet prac wzorcowych do .prace-out/ (NIE public/ — pliki są płatne).

Zastępuje buduj-wszystkie.sh, i to nie z upodobania do Pythona.

DLACZEGO NIE BASH. Wersja powłokowa czytała tytuły z prace.json i podawała je
do build-prace.py jako argument `--tytul`. Na Windowsie argument przechodził
przez powłokę w stronicy CP1250 i docierał do Pythona rozsypany: strona
tytułowa dziesięciu z czternastu sprzedawanych prac głosiła
„Wp³yw cyberprzemocy na funkcjonowanie psychospo³eczne ofiar ￿ badania
w￿ród uczniów szkó³ ponadpodstawowych”. Ocalały tylko te prace, które
składałem pojedynczo z terminala, oraz jedna, której tytuł nie miał ani
jednej polskiej litery — co dobrze pokazuje, że nie chodziło o treść pracy,
tylko o drogę, którą tytuł do niej docierał.

Tutaj tytuł nigdy nie trafia do powłoki: subprocess dostaje listę argumentów,
którą Windows przekazuje jako UTF-16, więc polskie znaki dojeżdżają całe.

Weryfikacja po składzie (--sprawdz, domyślnie włączona) czyta pierwszą stronę
każdego PDF-a i szuka znaków, które powstają z CP1250 czytanego jako Latin-1
(„ł” → „³”, „ś” → „œ”). Bez tego ta sama regresja wróci niezauważona — bo
wróciła: przez trzy dni nikt nie spojrzał na okładkę pliku, który klienci
kupowali.

Użycie:
    python .prace-src/buduj-wszystkie.py            # wszystkie prace
    python .prace-src/buduj-wszystkie.py --tylko cyberprzemoc niewydolnosc
    python .prace-src/buduj-wszystkie.py --bez-sprawdzania
"""
import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
ZRODLA = Path(r"D:\smart-edu-autopilot\output\_PRACE-Z-NAPRAWIONYMI-PRZYPISAMI-2026-07-31\_gotowe")
OUT = ROOT / ".prace-out"
DANE = ROOT / "src" / "data" / "prace.json"

# Nazwa kierunku w mianowniku — trafia na stronę tytułową pracy.
NAZWY = {
    "psychologia": "Psychologia",
    "pielegniarstwo": "Pielęgniarstwo",
    "pedagogika": "Pedagogika",
    "prawo": "Prawo",
}

# Znaki, które powstają z polskich liter, gdy CP1250 czyta się jako Latin-1.
# „ó” celowo pominięte — jest legalną polską literą i dawałoby fałszywe alarmy.
PODEJRZANE = "³¹æêñœ¿Ÿ□�"


def sprawdz_okladke(pdf: Path) -> list[str]:
    """Zwraca listę podejrzanych znaków ze strony tytułowej (pusta = dobrze)."""
    r = subprocess.run(
        ["pdftotext", "-f", "1", "-l", "1", "-enc", "UTF-8", str(pdf), "-"],
        capture_output=True,
    )
    tekst = r.stdout.decode("utf-8", "replace")
    # „art. 94³ k.p.” to poprawny zapis numeru artykułu z indeksem górnym,
    # nie rozsypane kodowanie — cyfra przed znakiem zdejmuje podejrzenie.
    tekst = re.sub(r"\d[¹²³]", "", tekst)
    return sorted({c for c in tekst if c in PODEJRZANE})


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--tylko", nargs="*", default=None,
                    help="fragmenty slugów — składa tylko pasujące prace")
    ap.add_argument("--bez-sprawdzania", action="store_true")
    ap.add_argument("--out", default=str(OUT))
    args = ap.parse_args()

    prace = json.loads(DANE.read_text(encoding="utf-8"))
    if args.tylko:
        prace = [p for p in prace if any(t in p["slug"] or t in p["slugHtml"] for t in args.tylko)]
        if not prace:
            print("Nic nie pasuje do --tylko", file=sys.stderr)
            return 1

    bledy = []
    for p in prace:
        zrodlo = ZRODLA / f"{p['slugHtml']}.html"
        print(f"── {p['slug']}")
        if not zrodlo.exists():
            print(f"   BRAK ŹRÓDŁA: {zrodlo}")
            bledy.append(p["slug"])
            continue
        # Lista argumentów, nie linia poleceń: tytuł omija powłokę.
        wynik = subprocess.run([
            sys.executable, str(ROOT / ".prace-src" / "build-prace.py"), str(zrodlo),
            "--kierunek", NAZWY.get(p["kierunek"], p["kierunek"]),
            "--tytul", p["tytul"],
            "--out", args.out,
        ])
        if wynik.returncode != 0:
            bledy.append(p["slug"])

    if not args.bez_sprawdzania:
        print("\nKontrola stron tytułowych:")
        for p in prace:
            pdf = Path(args.out) / f"{p['slugPdf']}.pdf"
            if not pdf.exists():
                continue
            złe = sprawdz_okladke(pdf)
            if złe:
                print(f"   ✗ {p['slugPdf']}: rozsypane znaki {''.join(złe)}")
                bledy.append(p["slug"])
            else:
                print(f"   ✓ {p['slugPdf']}")

    if bledy:
        print(f"\nBŁĘDY w {len(set(bledy))} pracach: {', '.join(sorted(set(bledy)))}")
        return 1
    print(f"\nGotowe: {len(prace)} prac, okładki czyste.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
