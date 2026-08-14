# 📚 Katalog prac wzorcowych — ustalenia i lista produkcyjna

> Domena: **praca-magisterska.pl**. Wchodzimy od razu z realnymi produktami (bez fake doora).
> Ostatnia aktualizacja: 2026-07-31.
> Kontekst strategiczny: `tematy_struktura_strony.md` → „PLAN REALIZACJI".

---

## 1. ARCHITEKTURA SEO — najważniejsze ustalenie całego projektu

### Strony produktowe NIE rankują samodzielnie

Dowód (nie przypuszczenie): analiza **2817 fraz** z GSC obu domen za 2026-04-30..07-29.
Szukano fraz na konkretne zjawiska badawcze — wypalenie, jakość życia, satysfakcja,
depresja, motywacja, uzależnienie, cukrzyca, COVID. **Zero trafień.**

Dowód mocniejszy niż sam brak: `/tematy/<kierunek>/` zawierają po ~110 tematów
każdy (~4500 sformułowań tematycznych w indeksie). Gdyby ktokolwiek wyszukiwał
w ten sposób, te strony zbierałyby na tym wyświetlenia. Nie zbierają ani jednego.

Nikt nie wpisuje w Google „Nadmierne korzystanie z Instagrama a obraz ciała
u dziewcząt 14–18 lat". Ludzie wpisują `praca magisterska psychologia`,
`praca magisterska psychologia pdf`, `tematy prac magisterskich psychologia`.

### Model ruchu: kategoria akwizycyjna → produkt konwersyjny

```
Google → /prace/psychologia/            ← TU JEST RUCH
              ↓ linkowanie
         /prace/psychologia/<temat>/    ← TU JEST ZAKUP
              ↑ linkowanie
    /tematy/psychologia/ (384 klik.)    ← drugi kanał zasilania
```

### Trzy konsekwencje operacyjne

1. **Title strony produktu ≠ tytuł pracy.** Musi zaczynać się od frazy wyszukiwanej:
   `Praca magisterska z psychologii — wypalenie zawodowe nauczycieli (wzór, 87 stron, PDF+Word)`
   Tytuł pracy idzie do H1 lub podtytułu. To jedyna szansa na długi ogon.
2. **Kategoria `/prace/<kierunek>/` musi być mocną stroną treściową**, nie listą
   linków. Ona dźwiga cały ruch. Treść pod `prace magisterskie z <kierunek>`
   i `gotowe prace magisterskie <kierunek>`.
3. **Liczba prac nie wpływa na SEO.** Więcej prac = szerszy wybór dla kupującego,
   ani jednej frazy więcej. Stąd 6–8 na kierunek, nie 10.

### Wniosek kosztowy

Nie trzeba generować 400 prac, żeby zbudować widoczność. Widoczność budują
**kategorie i head termy** (`prace magisterskie` — 769 wyśw., poz. 43,6;
`praca magisterska` — 1379 wyśw., poz. 41,2), a prace zamieniają ten ruch
na pieniądze. Buduj kategorię do końca, zanim otworzysz następną —
jedna kategoria z 6 pracami bije 6 kategorii po jednej pracy.

---

## 2. CO SMART-EDU.AI POTRAFI WYGENEROWAĆ

`backend/src/services/generation/writer.ts` → `FABRICATION_GUARD` (zakaz bezwzględny):

> - NIGDY nie wymyślaj wyników badań: współczynników (r=, β=, F=, p<), procentów,
>   liczebności prób (n=, N=), średnich ani „wyników ankiet". Każda liczba MUSI
>   pochodzić z dostarczonego źródła (z przypisem [N]).
> - NIE opisuj fikcyjnych badań własnych. Część empiryczną realizuj jako analizę
>   danych zastanych Z DOSTARCZONYCH ŹRÓDEŁ.

Cytado oddaje do writera `CytadoChapterSource.text` = **page-tagowany pełny tekst**
publikacji (`=== STRONA X ===`), do 8 źródeł na rozdział. Model może więc podawać
realne `r`, `N`, `p` — z przypisem i numerem strony.

### Granica przebiega w jednym punkcie

| typ pracy magisterskiej                                   | wykonalny | materiał                                  |
| --------------------------------------------------------- | --------- | ----------------------------------------- |
| dogmatyczno-prawna                                        | ✅        | akty, orzecznictwo, doktryna              |
| projektowa / wdrożeniowa                                  | ✅        | projekt to wytwór autora                  |
| analiza danych zastanych                                  | ✅        | GUS, NFZ, Eurostat, CBOS, eKRS, GPW, NBP  |
| analiza dokumentów                                        | ✅        | podstawy programowe, standardy, strategie |
| komparatystyczna                                          | ✅        | opisy systemów w publikacjach             |
| monograficzna / teoretyczna                               | ✅        | literatura przedmiotu                     |
| przeglądowa / metaanaliza                                 | ✅        | publikacje z wynikami                     |
| historyczna, analiza tekstu                               | ✅        | źródła, teksty                            |
| studium przypadku z literatury / danych publicznych firmy | ✅        | raporty, sprawozdania                     |
| **własne badanie na ludziach z własnymi wynikami**        | ❌        | tych danych nie ma nigdzie                |

**To jeden typ z dziesięciu — nie zawężenie do przeglądów.**

### Paradoks doboru kierunków

| kierunek                          | naturalny typ pracy        | trudność wytworzenia | ruch (wyśw.) |
| --------------------------------- | -------------------------- | -------------------- | ------------ |
| prawo, administracja              | dogmatyczno-prawna         | **łatwa**            | 592 / 344    |
| finanse, rachunkowość             | analiza danych (eKRS, GPW) | **łatwa**            | 387          |
| informatyka                       | projektowa                 | **łatwa**            | 365          |
| logistyka, zarządzanie, marketing | case na danych publicznych | łatwa                | 309 / 307    |
| pielęgniarstwo                    | EBP / przegląd             | średnia              | 2302         |
| **psychologia, pedagogika**       | **badanie ankietowe**      | **najtrudniejsza**   | 2704 / 1581  |

Największy ruch jest tam, gdzie standardem jest własna ankieta — czyli tam,
gdzie pipeline (słusznie) odmawia. Tam ratunkiem jest przegląd/analiza danych
zastanych. W prawie i informatyce nie ma czego obchodzić — praca dogmatyczna
i projektowa **są** typowymi magisterkami.

---

## 3. JAK FORMUŁOWAĆ TEMATY

**Hasło encyklopedyczne to nie temat magisterski.** „Motywowanie pracowników
jako element ZZL" nie przejdzie u żadnego promotora.

Temat musi mieć:

- **populację lub materiał** (orzecznictwo SN, spółki GPW, dziewczęta 14–18 lat,
  pielęgniarki anestezjologiczne, uczniowie klas VII–VIII),
- **ramy czasowe** tam, gdzie mają znaczenie (lata 2015–2025, „po 2020 roku"),
- **relację między zmiennymi** albo jasny problem badawczy.

Zawężenie musi iść w stronę **materiału publicznego** (orzecznictwo, sprawozdania
finansowe, decyzje UODO, dane BIP) — inaczej rozdział badawczy nie ma na czym stanąć.

⚠️ Unikać zawężeń typu „na przykładzie przedszkola X w Warszawie" / „w firmie Y" —
zapraszają model do opisania badania w konkretnej placówce, czyli prosto pod
`FABRICATION_GUARD`.

---

## 4. LISTA TEMATÓW

### Status realizacji

| #   | temat                                                                                 | kierunek    | status                      |
| --- | ------------------------------------------------------------------------------------- | ----------- | --------------------------- |
| 14  | Wypalenie zawodowe nauczycieli edukacji wczesnoszkolnej po okresie nauczania zdalnego | psychologia | 🔄 run puszczony 2026-07-31 |

### PRAWO (dogmatyczne — najłatwiejsze źródłowo)

1. Obowiązek alimentacyjny wobec pełnoletniego dziecka kontynuującego naukę w świetle orzecznictwa SN z lat 2015–2025
2. Kryteria kwalifikacji mobbingu i rozkład ciężaru dowodu w orzecznictwie sądów pracy
3. Przesłanki orzeczenia rozwodu z winy wyłącznej małżonka w praktyce sądów apelacyjnych
4. Odpowiedzialność administratora za naruszenie ochrony danych osobowych w decyzjach Prezesa UODO 2019–2025
5. Zadośćuczynienie za krzywdę osób najbliższych po nowelizacji art. 446(2) k.c.
6. Przestępstwo uporczywego nękania (art. 190a k.k.) — znamiona i problemy dowodowe

### PIELĘGNIARSTWO (2302 wyśw.)

7. ✅ Obciążenie opiekunów nieformalnych osób z chorobą Alzheimera — analiza badań 2018–2025
8. ✅ Wypalenie zawodowe pielęgniarek anestezjologicznych i intensywnej opieki
9. Profilaktyka odleżyn u pacjentów OIT — skuteczność interwencji pielęgniarskich
10. ✅ Jakość życia pacjentów dializowanych otrzewnowo i hemodializowanych — analiza porównawcza
11. ✅ Adherencja terapeutyczna pacjentów po zawale serca w pierwszym roku po hospitalizacji
12. ✅ Rola pielęgniarki w opiece nad pacjentem geriatrycznym z zespołem kruchości (frailty)

### PSYCHOLOGIA (2704 wyśw. — buduj tę kategorię do końca)

13. ✅ Nadmierne korzystanie z Instagrama a obraz ciała i objawy zaburzeń odżywiania u dziewcząt 14–18 lat
14. ✅ Wypalenie zawodowe nauczycieli edukacji wczesnoszkolnej po okresie nauczania zdalnego
15. ✅ Prokrastynacja akademicka studentów kierunków medycznych a lęk przed oceną i perfekcjonizm
16. ✅ Depresja poporodowa u kobiet po porodzie przedwczesnym — czynniki ryzyka i formy wsparcia
17. ✅ Stres zawodowy i strategie radzenia sobie u funkcjonariuszy Państwowej Straży Pożarnej
18. ✅ Poczucie samotności młodych dorosłych 18–25 lat a intensywność korzystania z komunikatorów

### PEDAGOGIKA (1581 wyśw.)

19. ✅ Cyberprzemoc rówieśnicza wśród uczniów klas VII–VIII a rola nauczyciela-wychowawcy
20. ✅ Funkcjonowanie społeczne uczniów z zespołem Aspergera w szkole ogólnodostępnej
21. ✅ Wpływ czasu ekranowego na rozwój mowy dzieci 2–5 lat — badania 2015–2025
22. ✅ Gotowość szkolna dzieci sześcioletnich a odroczenie obowiązku szkolnego
23. ✅ Wsparcie rodzin wychowujących dziecko z niepełnosprawnością sprzężoną

### ZARZĄDZANIE / MARKETING / LOGISTYKA

24. Pozafinansowe narzędzia motywowania specjalistów IT pokolenia Z w modelu pracy hybrydowej
25. Wpływ kultury organizacyjnej typu klanowego na retencję pracowników w małych firmach usługowych
26. Przywództwo transformacyjne a zaangażowanie pracowników w organizacjach po fuzji
27. Skuteczność influencer marketingu w segmencie kosmetyków naturalnych na rynku polskim
28. Wpływ komunikacji ESG na decyzje zakupowe konsumentów pokolenia Z w branży odzieżowej
29. Greenwashing w komunikacji marketingowej marek modowych
30. Zakłócenia łańcuchów dostaw w branży motoryzacyjnej po 2020 roku
31. Logistyka ostatniej mili w aglomeracjach — rozwiązania ograniczające emisję

### FINANSE I RACHUNKOWOŚĆ

32. Ocena kondycji finansowej spółek deweloperskich notowanych na GPW w latach 2019–2024
33. Wpływ zmiany WIBOR na WIRON na koszt obsługi kredytów hipotecznych
34. Analiza rentowności spółek z sektora e-commerce notowanych na NewConnect
35. Leasing operacyjny a finansowy w sprawozdaniach spółek po wdrożeniu MSSF 16

### ADMINISTRACJA / INFORMATYKA

36. Realizacja prawa dostępu do informacji publicznej przez gminy — orzecznictwo sądów administracyjnych
37. Budżet obywatelski jako instrument partycypacji w miastach wojewódzkich
38. Projekt i implementacja systemu rezerwacji wizyt dla gabinetu fizjoterapii (REST API)
39. Analiza podatności aplikacji webowych na ataki wstrzykiwania kodu
40. Zastosowanie modeli uczenia maszynowego do wykrywania transakcji fraudowych

---

## 5. TEMATY DO DOPISANIA NA LISTY `/tematy/`

Tematy spoza istniejących list `/tematy/<kierunek>/` trzeba tam dopisać przy
publikacji produktu — inaczej znika kanał linkowania (patrz sekcja 1).

| temat                                       | gdzie dopisać                                                   |
| ------------------------------------------- | --------------------------------------------------------------- |
| 13 (Instagram a zaburzenia odżywiania)      | `/tematy/psychologia/` sekcja „Psychologia kliniczna"           |
| 14 (wypalenie nauczycieli wczesnoszkolnych) | `/tematy/psychologia/` sekcja „Psychologia pracy i organizacji" |

## 6. WYKLUCZONE

Pokrycie źródłowe w OpenAlex (publikacje od 2015) zbyt niskie, żeby bibliografia
się obroniła:

- terapia ręki — **90** prac
- metoda Weroniki Sherborne — **70** prac

Dla porównania: edukacja włączająca 63 223, upadki seniorów 50 709, lęk
przedoperacyjny 45 624, SI+autyzm 25 747, wypalenie nauczycieli 24 418,
szczepienia/rodzice 6 332, perfekcjonizm–depresja 5 049, prokrastynacja 2 519,
Montessori 1 399, bajkoterapia 392.

## 7. DO ZROBIENIA TECHNICZNIE

Stan na 2026-08-14.

| zadanie                                                                  | stan |
| ------------------------------------------------------------------------ | ---- |
| szablon strony produktu                                                  | ✅   |
| hub `/prace/` + kategorie                                                | ✅   |
| `get-download` — `contentType` dla DOCX (dziś hardkod `application/pdf`) | ✅   |
| licznik pobrań z DynamoDB `praca-magisterska-orders`                     | ⬜   |
| `products.json` — kategoria „Praca wzorcowa", cena 5900                  | ✅   |
| linkowanie z list `/tematy/` do produktów                                | ✅   |
| stopka z nr zamówienia w PDF + informacja o braku przeniesienia praw     | 🟡   |

🟡 Informacja o braku przeniesienia praw jest w PDF-ie (strona redakcyjna „O tym
dokumencie") i na stronach produktowych. Numeru zamówienia w stopce nie ma —
wymagałby generowania PDF-a per zamówienie, dziś pliki są statyczne w S3.

### Weryfikacja danych GSC (2026-08-14, okres 2026-05-14..08-13, obie domeny)

Liczby z sekcji 1 i 2 potwierdzone, wszystkie lekko w górę — katalog jest wiarygodny:

| kierunek       | katalog (IV–VII) | pomiar (V–VIII) |
| -------------- | ---------------- | --------------- |
| psychologia    | 2704             | 2662            |
| pielęgniarstwo | 2302             | 2274            |
| pedagogika     | 1581             | 1808            |
| prawo          | 592              | 662             |
| finanse        | 387              | 453             |
| informatyka    | 365              | 416             |

Teza „zero fraz na zjawiska badawcze" — potwierdzona na 3099 frazach. Osiemnaście
pozornych trafień to zapytania narzędzi SEO (`-site:instagram.com`), 0 kliknięć.

**Czego katalog nie przewidział — uzasadnienie architektury URL:**

- „gotowe prace magisterskie" i „prace magisterskie" obsługiwała **strona główna
  z pozycji 50–60**, czyli w praktyce nikt. Hub `/prace/` wchodzi na puste miejsce.
- `/tematy/psychologia/` stoi na „prace magisterskie psychologia" na pozycji 6,4,
  ale zbiera **1 kliknięcie ze 188 wyświetleń** (CTR 0,5%). Lista tematów nie
  odpowiada na intencję „pokaż gotowe prace" — stąd osobny podhub `/prace/<kierunek>/`
  zamiast rozbudowy istniejącej strony.
- `/tematy/<kierunek>/przykladowa-praca/` rankuje na frazach zakupowych
  („praca magisterska z psychologii pdf" — poz. 6,7, 16 klik). To stamtąd prowadzi
  baner do katalogu, nie odwrotnie.

### Incydent bezpieczeństwa naprawiony 2026-08-14

Bucket `praca-magisterska-ebooks` miał policy `PublicReadForAll` na `/*` — **35
płatnych plików** (23 ebooki + 12 plików prac) było do pobrania bez podpisu, HTTP 200
na goły adres. Presigned URL-e z lambd nie chroniły niczego. Policy zawężona do
`*-preview.pdf` (26 podglądów linkowanych ze stron ebooków). Zweryfikowane: podglądy
200, płatne 403, presigned 200. Kopia starej policy: `.aws-backup/` (poza repo).
