#!/usr/bin/env python3
"""Renderuje podglądy stron prac do użycia na stronach sprzedażowych.

Mockup rysowany „z głowy" pokazywałby coś, czego klient nie dostanie. Tu idą
prawdziwe strony z tego samego PDF-a, który trafia do kupującego.

Co jest pokazywane i dlaczego akurat to: strona tytułowa (dowód, że dokument
wygląda jak praca dyplomowa), spis treści (widać strukturę i zakres), strona
treści z przypisami (sedno produktu — powołania z numerem strony) i strona
z tabelą. Cztery strony z ~65 to za mało, żeby z podglądu cokolwiek napisać,
a wystarczy, żeby ocenić jakość.

Użycie: python .prace-src/podglady.py [--szerokosc 900]
"""

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
PDFY = ROOT / ".prace-out"
CEL = ROOT / "public" / "prace-podglad"
DANE = ROOT / "src" / "data" / "prace.json"


def strony_do_pokazania(pdf: Path) -> dict[str, int]:
    """Znajduje numery stron po zawartości, nie na sztywno — spis treści
    i pierwsza tabela wypadają w innym miejscu w każdej pracy."""
    txt = subprocess.run(
        ["pdftotext", str(pdf), "-"], capture_output=True
    ).stdout.decode("utf8", "replace")
    strony = txt.split("\f")

    wybor = {"tytulowa": 1}

    for i, s in enumerate(strony, 1):
        # „Spis tre" bez końcówki — pdftotext gubi polskie znaki i zwraca
        # „Spis treci", więc pełna fraza nigdy się nie dopasowywała.
        if "Spis tre" in s and "spis" not in wybor:
            wybor["spis"] = i
            break

    # Strona z największą liczbą przypisów — najlepiej pokazuje aparat naukowy.
    najlepsza, ile = None, 0
    for i, s in enumerate(strony, 1):
        if i <= wybor.get("spis", 3) + 1:
            continue
        n = len(re.findall(r"\[\d+,\s*s\.\s*\d+\]", s))
        if n > ile:
            najlepsza, ile = i, n
    if najlepsza:
        wybor["przypisy"] = najlepsza

    # Strona z tabelą — szukamy podpisu „Tabela N."
    for i, s in enumerate(strony, 1):
        if re.search(r"Tabela\s+\d+[.\d]*\.", s) and i != wybor.get("przypisy"):
            wybor["tabela"] = i
            break

    return wybor


def renderuj(pdf: Path, strona: int, wyjscie: Path, szerokosc: int) -> None:
    """Renderuje stronę do WebP.

    Format ma znaczenie: 24 podglądy w PNG ważyły 4,2 MB, a landing ładuje
    kilka z nich od razu. WebP przy jakości 82 daje ~5× mniej przy tekście
    nadal czytelnym w powiększeniu.
    """
    tmp = wyjscie.with_suffix("")
    subprocess.run(
        ["pdftoppm", "-png", "-r", "150", "-f", str(strona), "-l", str(strona),
         "-scale-to-x", str(szerokosc), "-scale-to-y", "-1",
         str(pdf), str(tmp)],
        check=True,
    )
    png = next(tmp.parent.glob(f"{tmp.name}-*.png"), None)
    if png is None:
        raise FileNotFoundError(f"pdftoppm nie zapisał pliku dla {pdf.name} s.{strona}")

    from PIL import Image

    with Image.open(png) as im:
        im.convert("RGB").save(wyjscie, "WEBP", quality=82, method=6)
    png.unlink()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--szerokosc", type=int, default=900)
    a = ap.parse_args()

    CEL.mkdir(parents=True, exist_ok=True)
    dane = json.loads(DANE.read_text(encoding="utf-8"))
    podglady: dict[str, dict[str, str]] = {}

    for praca in dane:
        # nazwa PDF-a = slug z .prace-out, odtwarzany z productId przez mapę niżej
        pdf = PDFY / f"{praca['slugPdf']}.pdf"
        if not pdf.exists():
            print(f"  ! brak PDF-a dla {praca['slug']}", file=sys.stderr)
            continue

        wybor = strony_do_pokazania(pdf)
        wynik = {}
        for etykieta, nr in wybor.items():
            plik = CEL / f"{praca['slug']}-{etykieta}.webp"
            renderuj(pdf, nr, plik, a.szerokosc)
            wynik[etykieta] = f"/prace-podglad/{plik.name}"
            print(f"  {praca['slug']:<40} {etykieta:<10} s.{nr:>3} → {plik.stat().st_size // 1024} KB")
        podglady[praca["productId"]] = wynik

    (ROOT / "src" / "data" / "podglady.json").write_text(
        json.dumps(podglady, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"\nzapisano src/data/podglady.json ({len(podglady)} prac)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
