"""Ostatnia strona wzoru (PDF + DOCX): oferta dobrana do kierunku.

Zastępuje stały promo-page.md (do 2026-10-06 strona prowadziła głównie do smart-edu.ai;
w 90 dni dała 2 rejestracje i 0 zł, a PDF-y pobrano 747 razy). Kierunek bierzemy
z nazwy pliku źródłowego (przykladowa-praca-<kierunek>.md):

  1. kierunek ma prace w katalogu  → do 3 prac z linkami + ebook kierunkowy
  2. kierunek ma tylko ebook       → ebook kierunkowy + odnośnik do /prace/
  3. wzór poradnikowy (wzor-*.md)  → ebook ogólny z darmowym podglądem rozdziału
                                     o metodologii + odnośnik do /prace/

Smart-edu zostaje jednym zdaniem na końcu. Linki mają utm_source=wzor-pdf
i utm_content=<kierunek|nazwa wzoru>, żeby w GA4 było widać, które PDF-y sprzedają.

Użycie (wywołuje build-wzor.sh):  python promo-kierunek.py <plik-zrodlowy.md>
"""
import io
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "..", "src", "data")
SITE = "https://www.praca-magisterska.pl"
CENA_PRACY = 59
MAKS_PRAC = 3
PROG_KATEGORII = 3  # = MIN_PRAC_NA_KATEGORIE w src/data/prace.ts


def utm(sciezka, content):
    return f"{SITE}{sciezka}?utm_source=wzor-pdf&utm_medium=pdf&utm_content={content}"


def odmien(n, poj, mnogi, dop):
    if n == 1:
        return poj
    if 2 <= n % 10 <= 4 and not 12 <= n % 100 <= 14:
        return mnogi
    return dop


def main():
    zrodlo = os.path.basename(sys.argv[1])
    m = re.match(r"przykladowa-praca-([a-z-]+)\.md$", zrodlo)
    kierunek = m.group(1) if m else None
    content = kierunek or os.path.splitext(zrodlo)[0]

    prace = json.load(io.open(os.path.join(DATA, "prace.json"), encoding="utf-8"))
    ebooki = json.load(io.open(os.path.join(DATA, "ebooki.json"), encoding="utf-8"))
    ogolny = ebooki["_ogolny"]
    cena_k = ebooki["_cenaKierunkowy"]
    ebook_k = ebooki["kierunki"].get(kierunek) if kierunek else None
    prace_k = [p for p in prace if p["kierunek"] == kierunek]
    url_kat = f"/prace/{kierunek}/" if len(prace_k) >= PROG_KATEGORII else "/prace/"

    out = [
        "```{=latex}\n\\newpage\n```\n",
        '```{=openxml}\n<w:p><w:r><w:br w:type="page"/></w:r></w:p>\n```\n',
        "::: {.center}\n**O tym wzorze**\n:::\n",
        "Wzór przygotowała redakcja serwisu **praca-magisterska.pl**. Możesz swobodnie "
        "wykorzystać jego strukturę, tabele i przypisy we własnej pracy. Pamiętaj tylko, "
        "żeby treść dostosować do wymagań swojego promotora i uczelni.\n",
    ]

    if prace_k:
        lista = "\n".join(
            f"- [{p['tytul']}]({utm(f'/prace/{kierunek}/{p['slug']}/', content)}) — "
            f"{p['stron']} {odmien(p['stron'], 'strona', 'strony', 'stron')}, "
            f"{p['przypisy']} {odmien(p['przypisy'], 'przypis', 'przypisy', 'przypisów')}"
            for p in prace_k[:MAKS_PRAC]
        )
        reszta = len(prace_k) - MAKS_PRAC
        wiecej = (
            f"\n\nWszystkie prace z tego kierunku ({len(prace_k)}): "
            f"**[praca-magisterska.pl{url_kat}]({utm(url_kat, content)})**"
            if reszta > 0 else ""
        )
        out.append(
            "::: {.promo}\n"
            "**Ten wzór to szkielet. Tak wygląda praca napisana w całości.**\n\n"
            "Kompletne prace magisterskie na konkretnych tematach, z przypisami wskazującymi "
            f"numer strony w źródle i pełną bibliografią. {CENA_PRACY} zł za pracę, PDF + Word, "
            "pobierasz od razu po płatności:\n\n"
            f"{lista}{wiecej}\n"
            ":::\n"
        )
        if ebook_k:
            out.append(
                f"Wolisz napisać pracę samodzielnie? Przewodnik **[„{ebook_k['tytul']}”]"
                f"({utm(ebook_k['href'], content)})** prowadzi przez dobór metody, narzędzia, "
                f"analizę wyników i pisanie kolejnych rozdziałów ({cena_k} zł).\n"
            )
    elif ebook_k:
        out.append(
            "::: {.promo}\n"
            f"**„{ebook_k['tytul']}” — przewodnik do tego wzoru**\n\n"
            "Wzór pokazuje układ pracy. Przewodnik pokazuje, jak wypełnić każdy rozdział treścią: "
            "dobór metody i narzędzi, analiza wyników, typowe uwagi recenzentów. "
            f"PDF + EPUB, {cena_k} zł, dostęp od razu po płatności.\n\n"
            f"**[praca-magisterska.pl{ebook_k['href']}]({utm(ebook_k['href'], content)})**\n"
            ":::\n"
        )
        out.append(
            "Chcesz zobaczyć kompletną pracę z przypisami i bibliografią? Zajrzyj do "
            f"[katalogu gotowych prac wzorcowych]({utm('/prace/', content)}) ({CENA_PRACY} zł za pracę).\n"
        )
    else:
        out.append(
            "::: {.promo}\n"
            f"**„{ogolny['tytul']}” — ebook, {ogolny['stron']} stron**\n\n"
            "Ten wzór daje gotowy układ. Ebook prowadzi krok po kroku przez każdą część pracy: "
            "wybór tematu, rozdział teoretyczny, metodologię, analizę wyników, zakończenie "
            f"i obronę. Szablony, checklisty i rozdział o etycznym korzystaniu z AI, {ogolny['cena']} zł.\n\n"
            f"Rozdział o metodologii badań przejrzysz za darmo: "
            f"**[praca-magisterska.pl{ogolny['href']}]({utm(ogolny['href'], content)}#podglad)**\n"
            ":::\n"
        )
        out.append(
            "Chcesz zobaczyć, jak wygląda cała praca? Zajrzyj do "
            f"[katalogu gotowych prac wzorcowych]({utm('/prace/', content)}) z przypisami "
            f"i bibliografią ({CENA_PRACY} zł za pracę).\n"
        )

    out.append(
        "Generator [Smart-Edu.ai](https://www.smart-edu.ai/pl/masters-thesis"
        "?utm_source=praca-magisterska.pl&utm_medium=cta&utm_content=wzor-pdf) przygotuje "
        "pierwszą wersję tekstu z pomocą sztucznej inteligencji, jeśli wolisz zacząć od szkicu.\n"
    )
    out.append(
        "::: {.center}\n*Darmowe poradniki, wzory i ponad 2500 tematów prac:* "
        f"**[www.praca-magisterska.pl]({SITE})**\n:::\n"
    )
    sys.stdout.reconfigure(encoding="utf-8", newline="\n")
    sys.stdout.write("\n".join(out))


if __name__ == "__main__":
    main()
