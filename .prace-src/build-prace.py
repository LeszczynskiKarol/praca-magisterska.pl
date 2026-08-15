#!/usr/bin/env python3
"""Buduje pracę wzorcową (PDF + DOCX) z pary plików HTML wyprodukowanych
przez smart-edu / autopilota.

PO CO. To, co dotąd trafiało do sprzedaży, było wydrukiem z Chrome
(`Producer: Skia/PDF`, `Title: about:blank`) — bez strony tytułowej, bez spisu
treści, bez żywej paginy. Praca dyplomowa tak nie wygląda i klient to widzi.

WEJŚCIE. Dwa pliki obok siebie:
    <slug>.html          — treść (streszczenie, abstrakt, rozdziały, zakończenie)
    <slug>-biblio.html   — bibliografia, spisy tabel/rysunków, aneks
Drugi bywa wtopiony w pierwszy — wtedy wystarczy jeden.

CZEGO NIE ROBI. Nie tyka treści: nie dopisuje przypisów, nie zmienia liczb,
nie uzupełnia bibliografii. Konwersja formatu, nic więcej — inaczej nie dałoby
się powiedzieć, że PDF odpowiada zwalidowanemu HTML-owi.

Użycie:
    python .prace-src/build-prace.py <plik.html> --tytul "…" --kierunek "…" [--out KATALOG]
"""

import argparse
import html as htmlmod
import re
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent

# Konsola Windows startuje w cp1250 i wywraca się na strzałce w komunikacie.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")


# ---------------------------------------------------------------- wyciąganie

def wczytaj(sciezka: Path) -> str:
    """Treść + bibliografia w jednym stringu, w kolejności do składu."""
    tresc = sciezka.read_text(encoding="utf-8")
    biblio = sciezka.with_name(sciezka.stem + "-biblio.html")
    if biblio.exists():
        tresc += "\n" + biblio.read_text(encoding="utf-8")
    return tresc


def tytul_z_html(h: str) -> str | None:
    m = re.search(r"<h1[^>]*>(.*?)</h1>", h, re.S)
    if not m:
        return None
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", m.group(1))).strip()


def rozbij(h: str) -> tuple[str, str, str]:
    """Zwraca (streszczenie_pl, abstract_en, reszta).

    Streszczenie i abstrakt idą na osobne strony przed spisem treści — tak jak
    w pracy dyplomowej. Gdyby zostały w głównym strumieniu, wylądowałyby
    w spisie treści jako rozdziały.
    """
    def wytnij(naglowek: str) -> tuple[str, str]:
        nonlocal h
        m = re.search(
            rf"<h2[^>]*>\s*{naglowek}\s*</h2>(.*?)(?=<h2|<section|\Z)", h, re.S | re.I
        )
        if not m:
            return "", h
        h = h[: m.start()] + h[m.end():]
        return m.group(1), h

    stresz, h = wytnij("Streszczenie")
    abstr, h = wytnij("Abstract")
    return stresz, abstr, h


def splaszcz_zagniezdzone_tabele(html: str) -> str:
    """Rozbraja tabele zawierające inne tabele.

    Pipeline rysuje część schematów (np. model ekosystemowy) jako tabelę
    w tabeli — w HTML to działa, ale LaTeX nie potrafi zagnieździć longtable
    i cały skład pada na `Forbidden control sequence … \\LT@nofcols`.
    Zewnętrzną tabelę zamieniamy więc na ciąg akapitów: treść zostaje,
    ginie tylko siatka, której i tak nie da się wiernie odwzorować w druku.
    """
    wynik, zmienione = [], 0
    pozycja = 0
    for m in re.finditer(r"<table[^>]*>.*?</table>", html, re.S):
        blok = m.group(0)
        # tabela zagnieżdżona: drugie otwarcie <table> wewnątrz bloku
        if blok.count("<table") < 2:
            continue
        wiersze = []
        for kom in re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", blok, re.S):
            tekst = re.sub(r"<[^>]+>", " ", kom)
            tekst = re.sub(r"\s+", " ", tekst).strip()
            if tekst:
                wiersze.append(f"<p>{tekst}</p>")
        wynik.append(html[pozycja:m.start()])
        wynik.append("\n".join(wiersze))
        pozycja = m.end()
        zmienione += 1
    if not zmienione:
        return html
    wynik.append(html[pozycja:])
    print(f"  spłaszczono tabel zagnieżdżonych: {zmienione}")
    return "".join(wynik)


def na_markdown(fragment: str) -> str:
    """HTML → markdown przez pandoc. Osobno, żeby dało się złożyć dokument
    z kawałków (streszczenie, abstrakt, korpus) bez zgadywania granic."""
    if not fragment.strip():
        return ""
    p = subprocess.run(
        ["pandoc", "-f", "html", "-t", "markdown-raw_html-native_divs-native_spans",
         "--wrap=none"],
        input=fragment, capture_output=True, text=True, encoding="utf-8", check=True,
    )
    return p.stdout


# ---------------------------------------------------------------- porządki

def posprzataj(md: str) -> str:
    """Naprawia to, co pandoc przenosi wiernie, a co w składzie przeszkadza."""
    # Odsyłacz [19, s. 8] jest linkiem do kotwicy #bib-19. W PDF-ie kotwica
    # działa, ale pandoc zapisuje ją jako [[19, s. 8]](#bib-19) — zostawiamy
    # sam odsyłacz, bo hyperref i tak nie ma dokąd skoczyć po rozbiciu plików.
    md = re.sub(r"\[\\?\[(\d+[^\]]*?)\\?\]\]\(#bib-\d+\)", r"[\1]", md)
    md = re.sub(r"\[\[(\d+[^\]]*?)\]\]\(#bib-\d+\)", r"[\1]", md)

    # Numeracja pozycji bibliografii: pandoc robi listę numerowaną, a wpisy
    # zaczynają się od własnego „[1] ". Zostaje jedno albo drugie, nie oba.
    md = re.sub(r"^(\d+)\.\s+\\?\[\d+\\?\]\s+", r"\1. ", md, flags=re.M)

    # Nagłówki: <h1> pracy → tytuł na stronie tytułowej (już go mamy), więc
    # cała hierarchia jedzie o stopień w górę: h2 → \section, h3 → \subsection.
    # Jedno przejście, nie kaskada podmian — inaczej ### zrobione z #### wpada
    # pod następną regułę i wszystkie poziomy zlewają się do \section
    # (płaski spis treści, zaobserwowane przy pierwszym składzie).
    md = re.sub(r"^#\s+.*$", "", md, count=1, flags=re.M)
    md = re.sub(r"^(#{2,6})(\s)", lambda m: "#" * (len(m.group(1)) - 1) + m.group(2),
                md, flags=re.M)

    # Pola do wpisania przez kupującego („[DO UZUPEŁNIENIA: nazwa województwa]")
    # pipeline zostawia świadomie. Złożone zwykłym pismem czytają się jak
    # niedokończona praca, więc wyróżniamy je wizualnie.
    md = re.sub(r"\\?\[DO UZUPEŁNIENIA:?\s*([^\]]+?)\\?\]",
                r"**[do uzupełnienia: \1]**", md)

    # „Rozdział 4. Tytuł" — kropka po numerze zostaje, ale LaTeX-owy titlesec
    # nie dokleja własnej numeracji (\section bez numeru w header-praca.tex).
    md = re.sub(r"\n{3,}", "\n\n", md)
    return md.strip()


NOTA_RAMKA = r"""
\begin{nota}
\small\textbf{Charakter danych w tym rozdziale.} Wyniki, liczebność próby
i wartości statystyczne przedstawione poniżej mają charakter \emph{przykładowy}.
Ilustrują sposób opracowania, prezentacji i interpretacji materiału badawczego —
nie pochodzą z badania przeprowadzonego przez autora wzoru. Przed złożeniem
pracy należy zastąpić je wynikami własnego badania, zachowując strukturę
i logikę wywodu.
\end{nota}
"""

# Strona redakcyjna składa się z trzech części, bo akapit o danych
# przykładowych pojawia się TYLKO w pracach, które faktycznie mają rozdział
# z badaniem własnym. Praca przeglądowa (np. o czasie ekranowym) żadnych
# zmyślonych wyników nie zawiera i twierdzenie, że zawiera, byłoby nieprawdą
# działającą na niekorzyść produktu.

STRONA_REDAKCYJNA_GLOWA = r"""
\thispagestyle{empty}
\vspace*{2cm}
\noindent\textbf{\large O tym dokumencie}
\vspace{10pt}

\noindent Niniejszy dokument jest \textbf{wzorem pracy dyplomowej} przeznaczonym
do adaptacji. Warstwa teoretyczna opiera się na publikacjach wskazanych
w bibliografii — każde twierdzenie merytoryczne ma przypis z numerem strony
źródła, co pozwala zweryfikować je samodzielnie i wykorzystać w dalszej pracy.
"""

STRONA_REDAKCYJNA_BADANIE = r"""
\vspace{8pt}
\noindent Rozdział badawczy zawiera \textbf{dane przykładowe}: liczebność próby,
statystyki opisowe i wyniki testów ilustrują metodę opracowania materiału,
lecz nie pochodzą z przeprowadzonego badania. Wymagają zastąpienia wynikami
własnymi.
"""

STRONA_REDAKCYJNA_STOPA = r"""
\vspace{8pt}
\noindent Zakup nie przenosi autorskich praw majątkowych. Dokument służy jako
materiał pomocniczy — wzór struktury, aparatu naukowego i sposobu prowadzenia
wywodu.

\vfill
\noindent\footnotesize\textcolor{annoGray}{praca-magisterska.pl}
\clearpage
"""


def strona_redakcyjna(z_badaniem: bool, dla_pdf: bool) -> str:
    if dla_pdf:
        srodek = STRONA_REDAKCYJNA_BADANIE if z_badaniem else ""
        return STRONA_REDAKCYJNA_GLOWA + srodek + STRONA_REDAKCYJNA_STOPA
    czesci = [MD_REDAKCYJNA_GLOWA]
    if z_badaniem:
        czesci.append(MD_REDAKCYJNA_BADANIE)
    czesci.append(MD_REDAKCYJNA_STOPA)
    return "\n".join(czesci)


# Ten sam komunikat co w ramce, ale składnią, którą rozumie DOCX — tcolorbox
# jest surowym LaTeX-em i przy konwersji do Worda zniknąłby bez śladu.
NOTA_MD = """
> **Charakter danych w tym rozdziale.** Wyniki, liczebność próby i wartości
> statystyczne przedstawione poniżej mają charakter *przykładowy*. Ilustrują
> sposób opracowania, prezentacji i interpretacji materiału badawczego — nie
> pochodzą z badania przeprowadzonego przez autora wzoru. Przed złożeniem pracy
> należy zastąpić je wynikami własnego badania, zachowując strukturę i logikę
> wywodu.
"""


MD_REDAKCYJNA_GLOWA = """
## O tym dokumencie {-}

Niniejszy dokument jest **wzorem pracy dyplomowej** przeznaczonym do adaptacji.
Warstwa teoretyczna opiera się na publikacjach wskazanych w bibliografii — każde
twierdzenie merytoryczne ma przypis z numerem strony źródła, co pozwala
zweryfikować je samodzielnie i wykorzystać w dalszej pracy.
"""

MD_REDAKCYJNA_BADANIE = """
Rozdział badawczy zawiera **dane przykładowe**: liczebność próby, statystyki
opisowe i wyniki testów ilustrują metodę opracowania materiału, lecz nie
pochodzą z przeprowadzonego badania. Wymagają zastąpienia wynikami własnymi.
"""

MD_REDAKCYJNA_STOPA = """
Zakup nie przenosi autorskich praw majątkowych. Dokument służy jako materiał
pomocniczy — wzór struktury, aparatu naukowego i sposobu prowadzenia wywodu.

*praca-magisterska.pl*
"""


def wstaw_note(md: str, dla_pdf: bool) -> tuple[str, bool]:
    """Wkleja notę na początku rozdziału z badaniem własnym.

    Rozdział rozpoznajemy po nagłówku, bo nazywa się różnie w każdej pracy
    („Badania własne", „Badanie własne — …", „Metodologia i wyniki badań
    własnych"). Jeśli nie znajdziemy — sygnalizujemy, zamiast po cichu wypuścić
    plik bez noty.
    """
    # `bada\w*`, nie `badan\w*` — nagłówki mają zarówno „badania własne", jak
    # i „badań własnych"; wariant z „ń" nie pasował do `badan` i praca o stresie
    # funkcjonariuszy PSP wyszła bez noty mimo 33 zdań ze zmyśloną statystyką.
    wzor = re.compile(r"^(#\s+.*?bada\w*\s+własn\w*.*)$", re.M | re.I)
    m = wzor.search(md)
    if not m:
        return md, False
    nota = NOTA_RAMKA if dla_pdf else NOTA_MD
    return md[: m.end()] + "\n" + nota + md[m.end():], True


def strona_tytulowa(tytul: str, kierunek: str, typ: str) -> str:
    """Strona tytułowa z polami do uzupełnienia przez kupującego.

    Świadomie w formie placeholderów w nawiasach — praca jest wzorem do
    adaptacji, a nie dokumentem konkretnej osoby; wpisanie tam zmyślonej
    uczelni i nazwiska promotora byłoby fabrykacją innego rodzaju.
    """
    t = htmlmod.unescape(tytul)
    return rf"""
\begin{{titlepage}}
\centering
\thispagestyle{{empty}}
{{\large [Nazwa uczelni]\par}}
\vspace{{4pt}}
{{\normalsize [Wydział]\par}}
\vspace{{2.2cm}}
{{\large [Imię i nazwisko]\par}}
\vspace{{4pt}}
{{\normalsize nr albumu: [nr]\par}}
\vspace{{2.4cm}}
{{\LARGE\bfseries {t}\par}}
\vspace{{2.4cm}}
{{\normalsize Kierunek: {kierunek}\par}}
\vspace{{1.6cm}}
{{\normalsize {typ} napisana pod kierunkiem\par}}
\vspace{{4pt}}
{{\normalsize [tytuł naukowy, imię i nazwisko promotora]\par}}
\vfill
{{\normalsize [Miejscowość] {chr(32)}[rok]\par}}
\end{{titlepage}}
\clearpage
"""


# ---------------------------------------------------------------- budowanie

def zbuduj(zrodlo: Path, tytul: str, kierunek: str, typ: str, out: Path) -> None:
    surowy = splaszcz_zagniezdzone_tabele(wczytaj(zrodlo))
    stresz_html, abstr_html, korpus_html = rozbij(surowy)

    stresz = posprzataj(na_markdown(stresz_html))
    abstr = posprzataj(na_markdown(abstr_html))
    korpus = posprzataj(na_markdown(korpus_html))

    def zloz(dla_pdf: bool) -> str:
        tresc, ma_note = wstaw_note(korpus, dla_pdf)
        czesci = [
            strona_tytulowa(tytul, kierunek, typ) if dla_pdf
            else f"# {htmlmod.unescape(tytul)}\n\n*{typ} — kierunek: {kierunek}*\n",
            strona_redakcyjna(ma_note, dla_pdf),
        ]
        lam = "\n\n\\clearpage\n" if dla_pdf else "\n\n"
        if stresz:
            czesci.append("# Streszczenie {-}\n\n" + stresz + lam)
        if abstr:
            czesci.append("# Abstract {-}\n\n" + abstr + lam)
        if dla_pdf:
            czesci.append("\\tableofcontents\n\\clearpage\n")
        czesci.append(tresc)
        return "\n\n".join(czesci)

    # Informacyjnie: praca przeglądowa nie ma rozdziału z badaniem własnym
    # i to jest poprawny stan, nie usterka — stąd komunikat, nie ostrzeżenie.
    _, ma_badanie = wstaw_note(korpus, True)
    print(f"  rozdział z badaniem własnym: {'jest — nota wstawiona' if ma_badanie else 'brak — bez noty'}")

    out.mkdir(parents=True, exist_ok=True)
    baza = out / zrodlo.stem.replace("-PROD", "").replace("-DEV", "")

    def przez_pandoc(md: str, args: list[str]) -> None:
        with tempfile.NamedTemporaryFile(
            "w", suffix=".md", delete=False, encoding="utf-8"
        ) as fh:
            fh.write(md)
            tmp = Path(fh.name)
        try:
            subprocess.run(["pandoc", str(tmp), *args], check=True)
        finally:
            tmp.unlink(missing_ok=True)

    print(f"→ PDF:  {baza.name}.pdf")
    przez_pandoc(zloz(dla_pdf=True), [
        "--pdf-engine=xelatex",
        "-H", str(HERE / "header-praca.tex"),
        # 12 pt — regulaminowy stopień pisma pracy dyplomowej. Domyślne
        # 10 pt pandoca ścisnęło pierwszy skład do 53 stron zamiast ~85.
        "-V", "fontsize=12pt",
        # 1,5 wiersza — również regulaminowe. Ustawiane tu, a nie w headerze:
        # patrz komentarz przy setspace w header-praca.tex.
        "-V", "linestretch=1.5",
        "-V", "lang=pl", "-V", "toc-title=Spis treści",
        "--top-level-division=section",
        "-o", str(baza.with_suffix(".pdf")),
    ])

    print(f"→ DOCX: {baza.name}.docx")
    przez_pandoc(zloz(dla_pdf=False), [
        "--toc", "--toc-depth=2",
        "--reference-doc", str(HERE.parent / ".wzory-src" / "reference.docx"),
        "-o", str(baza.with_suffix(".docx")),
    ])

    for p in (baza.with_suffix(".pdf"), baza.with_suffix(".docx")):
        print(f"  {p.name}  {p.stat().st_size // 1024} KB")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("zrodlo", type=Path)
    ap.add_argument("--tytul", default=None)
    ap.add_argument("--kierunek", required=True)
    ap.add_argument("--typ", default="Praca magisterska")
    # NIE public/ — `public/` trafia do `dist/`, a deploy.sh robi
    # `aws s3 sync dist/ s3://$S3_BUCKET`, czyli udostępnia wszystko publicznie.
    # Darmowe wzory leżą tam celowo; prace wzorcowe są płatne i idą do prywatnego
    # bucketu (`praca-magisterska-ebooks`) serwowanego przez presigned URL.
    ap.add_argument("--out", type=Path, default=Path(".prace-out"))
    a = ap.parse_args()

    if "public" in a.out.parts:
        print(f"STOP: {a.out} leży w public/ — te pliki są płatne, a public/ "
              f"jedzie na S3 publicznie przy deployu.", file=sys.stderr)
        return 1

    tytul = a.tytul or tytul_z_html(a.zrodlo.read_text(encoding="utf-8"))
    if not tytul:
        print("Brak tytułu: nie ma <h1> w pliku, podaj --tytul", file=sys.stderr)
        return 1

    zbuduj(a.zrodlo, tytul, a.kierunek, a.typ, a.out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
