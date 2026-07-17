::: {.center}
**UNIWERSYTET \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_**

Wydział Geografii — Kierunek: Geografia
:::

\vspace{1.5cm}

::: {.center}
**Szymon Kaczmarek**

nr albumu 000000
:::

\vspace{1cm}

::: {.center}
**Zmiany użytkowania ziemi w strefie podmiejskiej miasta X w latach 2000–2024 — analiza z wykorzystaniem narzędzi GIS**
:::

\vspace{1cm}

::: {.center}
Praca magisterska

napisana pod kierunkiem

dr. hab. \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_, prof. uczelni
:::

\vspace{1.5cm}

::: {.center}
Poznań, 2026
:::

::: {.note}
**Jak korzystać z tego wzoru.** To kompletny szkielet pracy magisterskiej z geografii w schemacie **analizy przestrzennej GIS**: publiczne dane przestrzenne (CORINE, BDOT10k, ortofotomapy) → analiza zmian w oprogramowaniu GIS → macierz przejść i mapy → interpretacja procesów (suburbanizacja). Kartografia jest tu materiałem dowodowym pracy, nie ilustracją. Niebieskie adnotacje — usuń w swojej pracy. Wyniki liczbowe są przykładowe. Pełne poradniki: praca-magisterska.pl/poradniki/
:::

\newpage

# Streszczenie

Celem pracy jest identyfikacja kierunków i natężenia zmian użytkowania ziemi w strefie podmiejskiej miasta X w latach 2000–2024 oraz ich interpretacja w kontekście procesów suburbanizacji. Analizę przeprowadzono w oprogramowaniu QGIS na podstawie danych CORINE Land Cover (poziomy 2000, 2012, 2024), zweryfikowanych i uszczegółowionych na podstawie ortofotomap z krajowego geoportalu oraz Bazy Danych Obiektów Topograficznych; kontekst demograficzny zapewniły dane Banku Danych Lokalnych GUS. Zmiany ujęto w macierzach przejść między kategoriami użytkowania dla dwóch podokresów oraz zobrazowano na mapach zmian. W badanym okresie powierzchnia terenów zabudowanych wzrosła o 64%, w przeważającej części kosztem gruntów ornych, przy wyraźnej koncentracji przyrostu wzdłuż głównych osi komunikacyjnych i przyspieszeniu procesu w drugim podokresie. Uzyskany obraz odpowiada modelowi suburbanizacji pasmowej; pracę zamykają wnioski dla polityki przestrzennej gmin strefy.

**Słowa kluczowe:** użytkowanie ziemi, suburbanizacja, GIS, CORINE Land Cover, strefa podmiejska.

::: {.anno}
[Streszczenie pracy GIS-owej: cel, obszar i okres, źródła danych z nazwami (CORINE, BDOT10k, BDL), metoda (macierze przejść), wynik liczbowy z wzorcem przestrzennym i rama interpretacyjna (suburbanizacja). Nazwy zbiorów danych są tu tym, czym normy w pracy technicznej.]
:::

\newpage

# Spis treści

::: {.note}
Wykaz skrótów \dotfill 3

Wstęp — cel, zakres i układ pracy \dotfill 4

Rozdział 1. Podstawy teoretyczne \dotfill 6

\hphantom{xx}1.1. Użytkowanie ziemi jako przedmiot badań geograficznych \dotfill 6

\hphantom{xx}1.2. Suburbanizacja — pojęcie, modele, skutki przestrzenne \dotfill 11

\hphantom{xx}1.3. Źródła danych o pokryciu i użytkowaniu terenu \dotfill 16

Rozdział 2. Obszar badań \dotfill 21

\hphantom{xx}2.1. Delimitacja strefy podmiejskiej \dotfill 21

\hphantom{xx}2.2. Charakterystyka fizycznogeograficzna i społeczno-gospodarcza \dotfill 24

Rozdział 3. Materiały i metody \dotfill 28

\hphantom{xx}3.1. Dane źródłowe i ich przygotowanie \dotfill 28

\hphantom{xx}3.2. Procedura analizy zmian w środowisku GIS \dotfill 31

\hphantom{xx}3.3. Weryfikacja danych i ocena dokładności \dotfill 34

Rozdział 4. Zmiany użytkowania ziemi w latach 2000–2024 \dotfill 36

\hphantom{xx}4.1. Struktura użytkowania w przekrojach czasowych \dotfill 36

\hphantom{xx}4.2. Macierze przejść — kierunki zmian \dotfill 40

\hphantom{xx}4.3. Rozkład przestrzenny zmian — mapy i strefy koncentracji \dotfill 45

\hphantom{xx}4.4. Zmiany a procesy demograficzne \dotfill 50

Rozdział 5. Dyskusja i wnioski \dotfill 53

Bibliografia i źródła danych · Spis map, rycin i tabel \dotfill 58
:::

\newpage

# Rozdział 3. Materiały i metody

## 3.1. Dane źródłowe i ich przygotowanie

Podstawę analizy stanowiły trzy grupy danych. Dane o pokryciu terenu pozyskano z programu CORINE Land Cover dla poziomów czasowych 2000, 2012 i 2024 (poziom szczegółowości 3). Ich weryfikację i uszczegółowienie w strefach zmian przeprowadzono na podstawie ortofotomap udostępnianych przez krajowy geoportal oraz warstw Bazy Danych Obiektów Topograficznych (BDOT10k). Kontekst demograficzny (ludność, migracje, pozwolenia na budowę w gminach strefy) zaczerpnięto z Banku Danych Lokalnych GUS. Wszystkie warstwy sprowadzono do układu PL-1992 i przycięto do granic obszaru badań; analizy wykonano w oprogramowaniu QGIS.

::: {.anno}
[Warsztat geografa: nazwane zbiory danych z poziomami czasowymi, procedura ujednolicenia (układ współrzędnych!), narzędzie. Wszystkie wymienione źródła są publiczne i bezpłatne — praca GIS-owa nie wymaga zakupu danych.]
:::

## 3.3. Weryfikacja danych i ocena dokładności

Ze względu na generalizację danych CORINE (minimalna jednostka kartowania 25 ha) przeprowadzono weryfikację klas użytkowania w 120 losowo rozmieszczonych punktach kontrolnych, porównując klasyfikację z ortofotomapą z odpowiedniego okresu. Zgodność ogólna wyniosła 89%, przy najniższej zgodności dla klas przejściowych (tereny budowy). Wpływ generalizacji na wyniki omówiono w ograniczeniach pracy; dla stref najintensywniejszych zmian analizę uzupełniono ręczną wektoryzacją zabudowy na podstawie ortofotomap.

::: {.anno}
[Ocena dokładności odróżnia analizę GIS od „kolorowania map”: losowe punkty kontrolne, zgodność ogólna, wskazanie słabych klas. Znajomość ograniczeń własnych danych (minimalna jednostka CORINE!) to pierwsza rzecz, o którą zapyta recenzent-geograf.]
:::

# Rozdział 4. Zmiany użytkowania ziemi w latach 2000–2024

## 4.2. Macierze przejść — kierunki zmian

Macierz przejść dla całego okresu wskazuje, że dominującym kierunkiem zmian była konwersja gruntów ornych w tereny zabudowy mieszkaniowej luźnej (58% powierzchni wszystkich zmian). Powierzchnia terenów zabudowanych wzrosła z 1 840 ha do 3 020 ha (+64%), przy czym tempo przyrostu w podokresie 2012–2024 było o połowę wyższe niż w latach 2000–2012.

| Kierunek zmiany | Powierzchnia [ha] | Udział w zmianach |
|---|---|---|
| Grunty orne → zabudowa mieszkaniowa | 685 | 58% |
| Grunty orne → tereny przemysłowo-usługowe | 214 | 18% |
| Łąki i pastwiska → zabudowa | 142 | 12% |
| Grunty orne → lasy (sukcesja/zalesienia) | 96 | 8% |
| Pozostałe kierunki | 47 | 4% |

::: {.anno}
[Macierz przejść (skąd → dokąd) to analityczne serce pracy o zmianach użytkowania. W pełnej pracy towarzyszą jej mapy: struktura w każdym przekroju czasowym + mapa zmian z lokalizacją konwersji. Każda mapa z pełnym wyposażeniem kartograficznym (skala, legenda, źródło, układ).]
:::

## 4.3. Rozkład przestrzenny zmian — mapy i strefy koncentracji

Przyrost zabudowy koncentruje się w trzech pasmach wzdłuż dróg wylotowych z miasta, sięgając w podokresie 2012–2024 dalej od granic miasta niż w podokresie wcześniejszym (mediana odległości nowej zabudowy od centrum wzrosła z 9,2 do 12,6 km). Układ pasmowy, rosnący zasięg i przyspieszenie procesu odpowiadają modelowi suburbanizacji pasmowej rozwijającej się wzdłuż korytarzy transportowych.

# Rozdział 5. Dyskusja i wnioski

Uzyskany obraz zmian jest spójny z wynikami badań stref podmiejskich innych dużych miast Polski, zarówno co do dominującego kierunku konwersji, jak i pasmowego wzorca przestrzennego. Wnioski: (1) proces suburbanizacji w strefie X przyspiesza i rozlewa się na gminy drugiego pierścienia; (2) konwersja dotyka w największym stopniu gruntów ornych wysokich klas bonitacyjnych w pasmach komunikacyjnych, co powinno być przesłanką dla polityki przestrzennej gmin; (3) metodycznie — połączenie CORINE z weryfikacją ortofotomapową równoważy dostępność danych z wymogami dokładności w skali strefy podmiejskiej. Ograniczenia: generalizacja CORINE, nieciągłość metodyczna między poziomami czasowymi oraz analiza pokrycia terenu jako przybliżenia użytkowania.

# Bibliografia i źródła danych

**Literatura**

1. Liszewski S. (red.), *Geografia urbanistyczna*, Warszawa 2012.
2. Lisowski A., Grochowski M., *Procesy suburbanizacji. Uwarunkowania, formy i konsekwencje*, Warszawa 2008.

**Źródła danych**

1. CORINE Land Cover 2000, 2012, 2024 — Copernicus Land Monitoring Service.
2. Baza Danych Obiektów Topograficznych (BDOT10k) i ortofotomapy — geoportal krajowy (data pobrania).
3. Bank Danych Lokalnych GUS (kategorie: ludność, budownictwo), stan na 2026 r.

::: {.anno}
[Bibliografia z osobną sekcją źródeł danych przestrzennych — z poziomami czasowymi i datami pobrania. Spis map jest w pracy geograficznej odrębny od spisu rycin; mapy własne podpisuj „opracowanie własne na podstawie [dane]”.]
:::
