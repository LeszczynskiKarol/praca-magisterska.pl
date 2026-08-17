// Katalog prac wzorcowych — warstwa danych dla /prace/.
//
// Liczby (stron, przypisów, pozycji bibliografii) pochodzą z `prace.json`,
// generowanego skryptem wprost z plików pracy i z gotowego PDF-a. Nie
// przepisujemy ich ręcznie: strona sprzedażowa musi mówić to samo, co dostaje
// kupujący, także po poprawce pracy.
import metryki from "./prace.json";
import podgladyJson from "./podglady.json";

/** Renderowane strony PDF-a: tytułowa, spis treści, strona z przypisami, tabela.
 *  Generuje `.prace-src/podglady.py` — nie edytować ręcznie. */
export const PODGLADY: Record<string, Partial<Record<string, string>>> =
  podgladyJson as Record<string, Partial<Record<string, string>>>;

export type Metryka = {
  productId: string;
  kierunek: string;
  slug: string;
  tytul: string;
  stron: number;
  slow: number;
  przypisy: number;
  przypisyZeStrona: number;
  pozycjeBibliografii: number;
  pozycjeZLinkiem: number;   // ile pozycji ma odnośnik do źródła (DOI, repozytorium)
  tabele: number;
  rysunki: number;
  rozdzialy: string[];
};

export type Kierunek = {
  slug: string;
  nazwa: string;          // mianownik: „Psychologia"
  dopelniacz: string;     // „z psychologii"
  przymiotnik: string;    // „psychologiczne" — do odmiany w tekście
  opis: string;
  czegoOczekujePromotor: string[];
};

export const CENA_PLN = 59;

export const KIERUNKI: Record<string, Kierunek> = {
  psychologia: {
    slug: "psychologia",
    nazwa: "Psychologia",
    dopelniacz: "z psychologii",
    przymiotnik: "psychologiczne",
    opis:
      "Prace z psychologii są oceniane przede wszystkim za warstwę metodologiczną. " +
      "Recenzent sprawdza, czy zmienne zostały zoperacjonalizowane, czy narzędzia mają " +
      "polską adaptację i podane właściwości psychometryczne, oraz czy wybrany test " +
      "statystyczny odpowiada postawionej hipotezie. Każdy z poniższych wzorów pokazuje " +
      "tę ścieżkę na konkretnym temacie.",
    czegoOczekujePromotor: [
      "operacjonalizacja zmiennych: od konstruktu teoretycznego do wskaźnika mierzalnego",
      "narzędzia z polską adaptacją i podaną rzetelnością (alfa Cronbacha)",
      "test statystyczny dobrany do hipotezy, nie odwrotnie",
      "dyskusja odnosząca wyniki do literatury, a nie powtarzająca je własnymi słowami",
      "zgodność zapisu bibliograficznego ze standardem APA",
    ],
  },
  pielegniarstwo: {
    slug: "pielegniarstwo",
    nazwa: "Pielęgniarstwo",
    dopelniacz: "z pielęgniarstwa",
    przymiotnik: "pielęgniarskie",
    opis:
      "W pielęgniarstwie obowiązuje podejście oparte na dowodach. Praca ma pokazać, " +
      "że autor potrafi dotrzeć do aktualnych badań, ocenić ich jakość i przełożyć " +
      "wnioski na praktykę opieki. Wzory poniżej prowadzą przez pełną ścieżkę: " +
      "od pytania klinicznego, przez przegląd piśmiennictwa, po implikacje dla oddziału.",
    czegoOczekujePromotor: [
      "pytanie badawcze sformułowane w schemacie PICO",
      "przegląd oparty na publikacjach z ostatnich 5–10 lat",
      "odwołania do standardów i wytycznych towarzystw naukowych",
      "wnioski przełożone na konkretne działania pielęgniarskie",
      "poprawne rozróżnienie interwencji o udowodnionej i nieudowodnionej skuteczności",
    ],
  },
  pedagogika: {
    slug: "pedagogika",
    nazwa: "Pedagogika",
    dopelniacz: "z pedagogiki",
    przymiotnik: "pedagogiczne",
    opis:
      "Prace pedagogiczne łączą warstwę teoretyczną z odniesieniem do praktyki " +
      "wychowawczej i dydaktycznej. Recenzent zwraca uwagę, czy autor odróżnia " +
      "obserwację od interpretacji i czy proponowane rozwiązania wynikają " +
      "z przywołanych badań, a nie z przekonań autora.",
    czegoOczekujePromotor: [
      "osadzenie problemu w konkretnym nurcie pedagogicznym",
      "odwołanie do podstawy programowej lub obowiązujących regulacji",
      "rozróżnienie między danymi z badań a doświadczeniem praktycznym",
      "propozycje działań możliwych do wdrożenia w realnej placówce",
      "krytyczne omówienie ograniczeń przywoływanych badań",
    ],
  },
};

// Krótki opis każdej pracy — to, co kupujący czyta przed decyzją. Mówi, o czym
// jest praca i na jakim materiale stoi, bez obiecywania wyników badań, których
// rozdział empiryczny nie zawiera.
export const OPISY: Record<string, string> = {
  "praca-mgr-psychologia-instagram":
    "Praca o związku między intensywnością korzystania z Instagrama a obrazem ciała " +
    "i objawami zaburzeń odżywiania u nastolatek. Część teoretyczna prowadzi przez teorię " +
    "porównań społecznych, mechanizm internalizacji ideału szczupłości i rolę treści " +
    "fitspiration. Rozdział badawczy pokazuje schemat korelacyjny z użyciem " +
    "standaryzowanych skal obrazu ciała i objawów zaburzeń odżywiania.",
  "praca-mgr-psychologia-prokrastynacja":
    "Praca o odwlekaniu zadań wśród studentów kierunków medycznych i o tym, jak wiąże się " +
    "ono z perfekcjonizmem dezadaptacyjnym i lękiem przed oceną. Podstawę teoretyczną " +
    "stanowią wielowymiarowe modele perfekcjonizmu Frosta oraz Hewitta i Fletta, a także " +
    "Teoria Motywacji Temporalnej. Rozdział badawczy prowadzi przez korelacje i regresję " +
    "wielokrotną na trzech standaryzowanych skalach.",
  "praca-mgr-psychologia-stres-psp":
    "Praca o stresie zawodowym strażaków i o strategiach radzenia sobie, po które sięgają " +
    "najczęściej. Omawia specyfikę stresu w służbach ratowniczych, ekspozycję na zdarzenia " +
    "traumatyczne i różnicę między radzeniem skoncentrowanym na problemie a na emocjach. " +
    "Rozdział badawczy pokazuje pomiar poziomu stresu wraz z analizą zależności od stażu " +
    "i stanowiska.",
  "praca-mgr-psychologia-wypalenie-nauczycieli":
    "Praca o wypaleniu zawodowym nauczycieli klas I–III w okresie po powrocie z nauczania " +
    "zdalnego. Prowadzi przez trójwymiarowy model wypalenia Maslach, specyfikę obciążeń " +
    "w edukacji wczesnoszkolnej i skutki izolacji dla relacji z klasą. Rozdział badawczy " +
    "pokazuje opracowanie wyników kwestionariusza MBI-ES wraz z klasyfikacją nasilenia " +
    "w trzech wymiarach.",
  "praca-mgr-pielegniarstwo-wypalenie":
    "Praca o wypaleniu zawodowym pielęgniarek anestezjologicznych i intensywnej opieki. " +
    "Omawia czynniki ryzyka charakterystyczne dla bloku operacyjnego i OIT: obciążenie " +
    "psychiczne, ekspozycję na śmierć pacjenta, presję czasu i deficyty kadrowe. Rozdział " +
    "badawczy prowadzi przez pomiar wypalenia w trzech wymiarach i analizę czynników " +
    "organizacyjnych.",
  "praca-mgr-psychologia-depresja-poporodowa":
    "Praca o tym, jak wsparcie ze strony partnera, rodziny i otoczenia wpływa na przebieg " +
    "depresji poporodowej. Część teoretyczna prowadzi przez kryteria diagnostyczne DSM-5 " +
    "i ICD-10, odróżnienie depresji poporodowej od baby blues i psychozy połogowej, " +
    "neurobiologiczne mechanizmy patogenezy oraz modele wsparcia społecznego wraz z hipotezą " +
    "buforową. Rozdział badawczy pokazuje schemat podłużny z trzema pomiarami i narzędziami " +
    "EPDS, BSSS i PSS-10.",
  "praca-mgr-pielegniarstwo-cukrzyca":
    "Praca o tym, jak edukacja prowadzona przez pielęgniarkę przekłada się na wyrównanie " +
    "metaboliczne u chorych na cukrzycę typu 2. Część teoretyczna prowadzi przez patogenezę " +
    "i kryteria rozpoznania, powikłania przewlekłe, modele edukacji terapeutycznej i pomiar " +
    "wyrównania hemoglobiną glikowaną. Rozdział badawczy pokazuje porównanie grupy objętej " +
    "edukacją z grupą kontrolną wraz z analizą adherencji terapeutycznej.",
  "praca-mgr-pedagogika-gotowosc-szkolna":
    "Praca o diagnozie gotowości szkolnej sześciolatków i o tym, jak jej poziom przekłada się " +
    "na osiągnięcia w klasie pierwszej. Omawia sfery gotowości: poznawczo-percepcyjną, " +
    "emocjonalno-społeczną i fizyczną, polskie reformy wieku szkolnego z lat 2009 i 2016 oraz " +
    "narzędzia diagnostyczne stosowane w przedszkolach. Rozdział badawczy prowadzi przez " +
    "schemat dwufalowy: diagnozę przed startem szkolnym i pomiar osiągnięć po roku nauki.",
  "praca-mgr-pielegniarstwo-niewydolnosc-serca":
    "Praca o tym, jak zaawansowana niewydolność serca odbija się na codziennym " +
    "funkcjonowaniu chorych. Część teoretyczna prowadzi przez patofizjologię, " +
    "klasyfikację czynnościową NYHA, objawy ograniczające aktywność i narzędzia " +
    "pomiaru jakości życia stosowane w kardiologii. Rozdział badawczy pokazuje " +
    "opracowanie wyników kwestionariusza MLHFQ z porównaniem klas III i IV.",
  "praca-mgr-pedagogika-cyberprzemoc":
    "Praca o tym, jak doświadczenie cyberprzemocy odbija się na funkcjonowaniu " +
    "psychospołecznym uczniów szkół ponadpodstawowych. Omawia formy i skalę zjawiska " +
    "w polskich badaniach, różnice między przemocą rówieśniczą offline a online, " +
    "skutki dla samooceny i relacji rówieśniczych oraz rolę szkoły w profilaktyce. " +
    "Rozdział badawczy prowadzi przez pomiar nasilenia doświadczeń i dobrostanu.",
  "praca-mgr-pedagogika-czas-ekranowy":
    "Praca przeglądowa o wpływie ekspozycji na ekrany na rozwój mowy dzieci w wieku " +
    "przedszkolnym, oparta na badaniach z lat 2015–2025. Pokazuje, dlaczego przekaz " +
    "z ekranu działa inaczej niż interakcja z dorosłym, jak wygląda skala zjawiska " +
    "w Polsce i za granicą oraz jak silnie ekspozycja różnicuje się według statusu " +
    "społeczno-ekonomicznego rodziny. Całość opiera się na danych z publikacji " +
    "z lat 2015–2025 — wzór pracy o charakterze przeglądowym.",
};

// Tytuł do <title> — pełny nie mieści się w wyniku wyszukiwania obok frazy
// „Praca magisterska z psychologii" i dopisku o formacie (razem ~160 znaków,
// Google ucina ~60). Skracamy ręcznie, bo automatyczne cięcie gubi sens tematu.
export const TYTULY_KROTKIE: Record<string, string> = {
  "praca-mgr-psychologia-instagram": "Instagram a obraz ciała nastolatek",
  "praca-mgr-psychologia-prokrastynacja": "prokrastynacja studentów medycyny",
  "praca-mgr-psychologia-stres-psp": "stres zawodowy strażaków",
  "praca-mgr-psychologia-wypalenie-nauczycieli": "wypalenie nauczycieli",
  "praca-mgr-pielegniarstwo-wypalenie": "wypalenie pielęgniarek z OIT",
  "praca-mgr-pedagogika-czas-ekranowy": "czas ekranowy a rozwój mowy dzieci",
  "praca-mgr-psychologia-depresja-poporodowa": "wsparcie a depresja poporodowa",
  "praca-mgr-pielegniarstwo-cukrzyca": "edukacja pielęgniarska w cukrzycy",
  "praca-mgr-pedagogika-gotowosc-szkolna": "gotowość szkolna sześciolatków",
  "praca-mgr-pielegniarstwo-niewydolnosc-serca": "jakość życia w niewydolności serca",
  "praca-mgr-pedagogika-cyberprzemoc": "cyberprzemoc a funkcjonowanie ofiar",
};

export const PRACE = (metryki as Metryka[]).map((m) => ({
  ...m,
  opis: OPISY[m.productId] ?? "",
  tytulKrotki: TYTULY_KROTKIE[m.productId] ?? m.tytul,
  cena: CENA_PLN,
  url: `/prace/${m.kierunek}/${m.slug}/`,
  podglad: PODGLADY[m.productId] ?? {},
}));

export type Praca = (typeof PRACE)[number];

/** Odmiana rzeczownika przez liczebnik: 1 praca, 2–4 prace, 5+ prac.
 *  Reguła nie jest prostym „<5", bo 12–14 idą jak 5+, a 22–24 jak 2–4. */
export function odmien(n: number, poj: string, mnogi: string, dopelniacz: string): string {
  if (n === 1) return poj;
  const dziesiatki = n % 100;
  const jednosci = n % 10;
  if (jednosci >= 2 && jednosci <= 4 && !(dziesiatki >= 12 && dziesiatki <= 14)) return mnogi;
  return dopelniacz;
}

export function praceKierunku(kierunek: string): Praca[] {
  return PRACE.filter((p) => p.kierunek === kierunek);
}

/** Ile prac musi mieć kierunek, żeby dostał własną stronę kategorii.
 *  Kategoria z jedną–dwiema pracami powiela opis produktu i konkuruje z nim
 *  o tę samą frazę, nie wnosząc treści. Prace takich kierunków są dostępne
 *  z huba i mają własne strony produktowe — znika tylko pośrednik.
 *
 *  Próg podniesiony z 2 na 3 dnia 2026-08-17, w tym samym commicie, w którym
 *  pielęgniarstwo i pedagogika dostały trzecią pracę — inaczej obie kategorie
 *  cofnęłyby się do stubów z noindex dzień po tym, jak Google zaczął je
 *  odkrywać. Przy kolejnym podniesieniu progu zrobić tak samo. */
export const MIN_PRAC_NA_KATEGORIE = 3;

/** Kierunki z własną stroną kategorii. */
export function kierunkiZKategoria(): Kierunek[] {
  return Object.values(KIERUNKI).filter(
    (k) => praceKierunku(k.slug).length >= MIN_PRAC_NA_KATEGORIE
  );
}

export function maKategorie(kierunek: string): boolean {
  return praceKierunku(kierunek).length >= MIN_PRAC_NA_KATEGORIE;
}

/** Wszystkie kierunki, które mają choć jedną pracę — do list i nawigacji. */
export function kierunkiZPracami(): Kierunek[] {
  return Object.values(KIERUNKI).filter((k) => praceKierunku(k.slug).length > 0);
}
