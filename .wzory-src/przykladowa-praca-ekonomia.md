::: {.center}
**UNIWERSYTET EKONOMICZNY \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_**

Wydział Ekonomii — Kierunek: Ekonomia
:::

\vspace{1.5cm}

::: {.center}
**Jan Kowalski**

nr albumu 000000
:::

\vspace{1cm}

::: {.center}
**Determinanty stopy bezrobocia w Polsce w latach 2010–2024 — analiza ekonometryczna**
:::

\vspace{1cm}

::: {.center}
Praca magisterska

napisana pod kierunkiem

dr. hab. \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_, prof. UE
:::

\vspace{1.5cm}

::: {.center}
\[Miasto\], 2026
:::

::: {.note}
**Jak korzystać z tego wzoru.** To kompletny szkielet pracy magisterskiej z ekonomii opartej na **analizie danych wtórnych i modelu ekonometrycznym** z przykładową treścią i komentarzami. Niebieskie adnotacje opisują funkcję każdej części — usuń je w swojej pracy. Zwróć uwagę na źródła danych (GUS, Eurostat, NBP), specyfikację i estymację modelu oraz jego weryfikację statystyczną — to cechy charakterystyczne prac ekonomicznych. Pełne poradniki: praca-magisterska.pl/poradniki/
:::

\newpage

# Streszczenie

Praca dotyczy determinant stopy bezrobocia w Polsce w latach 2010–2024. Celem pracy jest identyfikacja i oszacowanie siły wpływu wybranych czynników makroekonomicznych na stopę bezrobocia. Wykorzystano dane wtórne Głównego Urzędu Statystycznego, Eurostatu i NBP oraz metodę ekonometryczną — model regresji wielorakiej estymowany metodą najmniejszych kwadratów (MNK). Wykazano istotny statystycznie wpływ tempa wzrostu PKB oraz poziomu inflacji na stopę bezrobocia. Wyniki potwierdzają zależność opisaną prawem Okuna i mają znaczenie dla prowadzenia polityki gospodarczej.

**Słowa kluczowe:** bezrobocie, ekonometria, model regresji, polityka gospodarcza, prawo Okuna.

::: {.anno}
[W pracy ekonomicznej streszczenie wskazuje przedmiot, okres i zasięg danych, metodę (model ekonometryczny) oraz najważniejszy wynik. Dołącz wersję angielską (Abstract), jeśli wymaga jej uczelnia.]
:::

\newpage

# Spis treści

::: {.note}
Wstęp \dotfill 4

Rozdział 1. Bezrobocie w teorii ekonomii \dotfill 6

\hphantom{xx}1.1. Pojęcie, rodzaje i pomiar bezrobocia \dotfill 6

\hphantom{xx}1.2. Teoretyczne determinanty bezrobocia \dotfill 10

\hphantom{xx}1.3. Przegląd badań empirycznych \dotfill 13

Rozdział 2. Metodyka badania i charakterystyka danych \dotfill 16

\hphantom{xx}2.1. Cel, hipotezy i zmienne modelu \dotfill 16

\hphantom{xx}2.2. Źródła i charakterystyka danych \dotfill 18

\hphantom{xx}2.3. Specyfikacja modelu ekonometrycznego \dotfill 21

Rozdział 3. Wyniki estymacji i ich interpretacja \dotfill 24

\hphantom{xx}3.1. Estymacja modelu \dotfill 24

\hphantom{xx}3.2. Weryfikacja statystyczna i ekonomiczna modelu \dotfill 28

\hphantom{xx}3.3. Interpretacja wyników \dotfill 33

Zakończenie \dotfill 37

Bibliografia · Spis tabel i wykresów \dotfill 39
:::

\newpage

# Wstęp

::: {.anno}
[Akapit 1 — znaczenie problemu ekonomicznego i jego aktualność.]
:::

Bezrobocie jest jednym z kluczowych problemów makroekonomicznych, wpływającym na dobrobyt społeczny i decyzje polityki gospodarczej. Zrozumienie jego determinant pozwala skuteczniej projektować instrumenty rynku pracy.

::: {.anno}
[Akapit 2 — cel pracy i podejście badawcze (ilościowe, ekonometryczne).]
:::

Celem pracy jest identyfikacja determinant stopy bezrobocia w Polsce oraz oszacowanie siły ich wpływu z wykorzystaniem modelu ekonometrycznego opartego na danych statystyki publicznej.

::: {.anno}
[Akapit 3 — zakres czasowy, źródła danych i struktura pracy.]
:::

Badanie obejmuje lata 2010–2024 i opiera się na danych GUS, Eurostatu i NBP. Praca składa się z części teoretycznej, rozdziału metodycznego oraz analizy wyników estymacji modelu.

# Rozdział 2. Metodyka badania i charakterystyka danych

## 2.1. Cel, hipotezy i zmienne modelu

**Cel:** oszacowanie wpływu wybranych czynników makroekonomicznych na stopę bezrobocia.

**Hipotezy:**

- **H1:** Tempo wzrostu PKB jest ujemnie powiązane ze stopą bezrobocia.
- **H2:** Poziom inflacji istotnie wpływa na stopę bezrobocia.

**Zmienne modelu:** zmienna objaśniana — stopa bezrobocia rejestrowanego; zmienne objaśniające — dynamika PKB, stopa inflacji (CPI), przeciętne wynagrodzenie.

## 2.2. Źródła i charakterystyka danych

::: {.anno}
[Cecha prac ekonomicznych: opieranie się na DANYCH WTÓRNYCH ze statystyki publicznej. Zawsze podaj źródło (GUS, Eurostat, NBP, OECD), zakres czasowy i częstotliwość (dane roczne/kwartalne) oraz ewentualne przekształcenia (np. urealnienie, logarytmowanie).]
:::

W badaniu wykorzystano dane wtórne o częstotliwości rocznej z lat 2010–2024, pochodzące z Banku Danych Lokalnych GUS, bazy Eurostat oraz statystyk NBP.

## 2.3. Specyfikacja modelu ekonometrycznego

Przyjęto model regresji wielorakiej w postaci liniowej, estymowany klasyczną metodą najmniejszych kwadratów (MNK):

$$U_t = \beta_0 + \beta_1 \cdot PKB_t + \beta_2 \cdot CPI_t + \beta_3 \cdot W_t + \varepsilon_t$$

gdzie U — stopa bezrobocia, PKB — dynamika PKB, CPI — inflacja, W — wynagrodzenie, ε — składnik losowy.

::: {.anno}
[Specyfikacja modelu to serce pracy ekonometrycznej: postać funkcyjna, zmienne i metoda estymacji. Uzasadnij dobór zmiennych teorią ekonomii i przeglądem badań.]
:::

# Rozdział 3. Wyniki estymacji i ich interpretacja

## 3.1. Estymacja modelu

Parametry modelu oszacowano metodą MNK. Wyniki przedstawia tabela 1.

Tabela 1. Wyniki estymacji modelu (zmienna objaśniana: stopa bezrobocia)

| Zmienna | Oszacowanie | Błąd std. | p |
|---------|:--:|:--:|:--:|
| Stała | 12,4 | 1,8 | < 0,001 |
| Dynamika PKB | −0,82 | 0,21 | < 0,01 |
| Inflacja (CPI) | −0,31 | 0,14 | < 0,05 |
| Wynagrodzenie | −0,05 | 0,06 | 0,41 |

*R² = 0,86; skoryg. R² = 0,82. Źródło: obliczenia własne.*

## 3.2. Weryfikacja statystyczna i ekonomiczna modelu

::: {.anno}
[Po estymacji następuje WERYFIKACJA modelu: istotność parametrów (test t), dopasowanie (R²), istotność łączna (test F) oraz badanie założeń MNK (autokorelacja — test Durbina–Watsona, heteroskedastyczność, normalność reszt). To wyróżnik pracy ekonometrycznej.]
:::

Model charakteryzuje się wysokim dopasowaniem (skoryg. R² = 0,82). Parametry przy dynamice PKB i inflacji są istotne statystycznie, a ich znaki zgodne z teorią ekonomii. Zmienna wynagrodzenia okazała się nieistotna i może zostać usunięta z modelu.

# Zakończenie

Przeprowadzona analiza ekonometryczna potwierdziła hipotezy badawcze: dynamika PKB i inflacja istotnie wpływają na stopę bezrobocia w Polsce, przy czym kierunek zależności PKB–bezrobocie jest zgodny z prawem Okuna. Wyniki mają znaczenie dla polityki gospodarczej. Ograniczeniem badania jest roczna częstotliwość danych i ograniczona liczba obserwacji, co wyznacza kierunek dalszych analiz (np. modele dla danych kwartalnych).

# Bibliografia

::: {.anno}
[W ekonomii stosuje się najczęściej styl Harvard lub APA. Powołuj się na literaturę teoretyczną, badania empiryczne i źródła danych. Sprawdź wytyczne uczelni.]
:::

1. Kufel, T. (2011). *Ekonometria. Rozwiązywanie problemów z wykorzystaniem programu GRETL*. Warszawa: PWN.
2. Maddala, G. S. (2008). *Ekonometria*. Warszawa: PWN.
3. Snowdon, B., Vane, H. (2003). *Współczesne nurty teorii makroekonomii*. Warszawa: PWN.
