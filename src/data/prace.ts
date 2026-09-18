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
  prawo: {
    slug: "prawo",
    nazwa: "Prawo",
    dopelniacz: "z prawa",
    przymiotnik: "prawnicze",
    opis:
      "Praca prawnicza stoi na materiale normatywnym i orzecznictwie, a nie na badaniu " +
      "ankietowym. Recenzent sprawdza, czy autor rozróżnia przepis, jego wykładnię " +
      "i stanowisko doktryny, czy powołuje orzeczenia sygnaturą, i czy z analizy " +
      "wyprowadza wniosek, zamiast streszczać kolejne wyroki. Wzór poniżej pokazuje " +
      "tę ścieżkę na przesłankach odpowiedzialności cywilnej.",
    czegoOczekujePromotor: [
      "rozdzielenie warstw: przepis, wykładnia, stanowisko doktryny, praktyka orzecznicza",
      "orzeczenia powołane sygnaturą, z datą i sądem, a nie samą tezą",
      "aktualny stan prawny z zaznaczeniem nowelizacji istotnych dla tematu",
      "analiza prowadząca do wniosku, nie relacja z kolejnych wyroków",
      "poprawny zapis aktów prawnych wraz z promulgatorem (Dz. U.)",
    ],
  },
  administracja: {
    slug: "administracja",
    nazwa: "Administracja",
    dopelniacz: "z administracji",
    przymiotnik: "administracyjne",
    opis:
      "Praca z administracji łączy analizę przepisów ustrojowych z oceną tego, jak działa " +
      "konkretny organ. Recenzent sprawdza, czy autor odróżnia zadanie jednostki samorządu " +
      "od kompetencji organu, czy powołuje ustawy z aktualnym promulgatorem i czy ocenia " +
      "praktykę — rozstrzygnięcia nadzorcze i orzecznictwo sądów administracyjnych — zamiast " +
      "przepisywać ustawę. Wzory poniżej pokazują tę ścieżkę na organie wykonawczym gminy, " +
      "nadzorze wojewody i odpowiedzialności dyscyplinarnej urzędników.",
    czegoOczekujePromotor: [
      "rozróżnienie zadań jednostki samorządu i kompetencji jej organów",
      "ustawy ustrojowe powołane w aktualnym brzmieniu, z promulgatorem (Dz. U.)",
      "orzecznictwo sądów administracyjnych i rozstrzygnięcia nadzorcze, a nie sam przepis",
      "ocena praktyki działania organu, nie tylko opis procedury",
      "wnioski de lege ferenda wyprowadzone z analizy, a nie dopisane na końcu",
    ],
  },
  logistyka: {
    slug: "logistyka",
    nazwa: "Logistyka",
    dopelniacz: "z logistyki",
    przymiotnik: "logistyczne",
    opis:
      "Praca z logistyki jest oceniana za to, czy autor potrafi przełożyć proces na mierzalne " +
      "wskaźniki. Recenzent sprawdza, czy przepływ materiałów jest odróżniony od przepływu " +
      "informacji, czy koszt, czas i poziom obsługi klienta są ujęte razem, a nie każdy osobno, " +
      "i czy efekty wdrożeń pochodzą z danych, a nie z deklaracji dostawców technologii. Wzory " +
      "poniżej pokazują tę ścieżkę na współpracy z dostawcami, dostawach ostatniej mili " +
      "i cyfryzacji łańcucha dostaw.",
    czegoOczekujePromotor: [
      "proces logistyczny opisany mierzalnymi wskaźnikami: koszt, czas, poziom obsługi",
      "rozróżnienie przepływu materiałów i przepływu informacji w łańcuchu dostaw",
      "efekty wdrożeń poparte danymi ze źródeł, nie deklaracjami dostawców technologii",
      "koszty zewnętrzne i ograniczenia wdrożeń, nie wyłącznie korzyści",
      "rekomendacje wyprowadzone z analizy, dopasowane do skali i branży przedsiębiorstwa",
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
  "praca-mgr-prawo-blad-medyczny":
    "Praca o roszczeniach pacjenta po błędzie medycznym: kiedy przysługuje odszkodowanie, " +
    "kiedy zadośćuczynienie i czym te dwa świadczenia się różnią. Prowadzi przez przesłanki " +
    "odpowiedzialności cywilnej — zdarzenie sprawcze, szkodę, związek przyczynowy i winę — " +
    "oraz przez kryteria, którymi sądy ustalają wysokość świadczenia. Rozdział analityczny " +
    "stoi na przepisach i orzecznictwie, bez badania ankietowego: to wzór pracy prawniczej " +
    "opartej na materiale normatywnym.",
  "praca-mgr-prawo-mobbing":
    "Praca o mobbingu w miejscu pracy: co musi zajść, by zachowanie spełniło ustawową " +
    "definicję z art. 94(3) Kodeksu pracy, kiedy odpowiada pracodawca i po jakie środki " +
    "ochrony może sięgnąć pracownik. Prowadzi przez przesłanki — uporczywość, długotrwałość, " +
    "skutek w postaci zaniżonej oceny przydatności zawodowej — oraz przez rozkład ciężaru " +
    "dowodu. Rozdział analityczny omawia praktykę stosowania przepisów antymobbingowych " +
    "w orzecznictwie, bez badania ankietowego.",
  "praca-mgr-prawo-rodo":
    "Praca o ochronie danych osobowych pod rządami RODO: jakie prawa ma osoba, której " +
    "dane dotyczą — dostęp, sprostowanie, usunięcie, przenoszenie, sprzeciw — i co po " +
    "drugiej stronie musi zrobić administrator. Omawia podstawy przetwarzania, obowiązek " +
    "informacyjny, zgłaszanie naruszeń i rolę inspektora ochrony danych. Rozdział " +
    "analityczny opiera się na rozporządzeniu, ustawie krajowej i decyzjach organu " +
    "nadzorczego, bez badania ankietowego.",
  "praca-mgr-prawo-rozwod":
    "Praca o rozwodzie z orzekaniem o winie: czym jest wina w rozkładzie pożycia na gruncie " +
    "art. 57 k.r.o., jakie zachowania sądy uznają za zawinione i jak się tę winę dowodzi. " +
    "Omawia skutki orzeczenia o winie dla alimentów między byłymi małżonkami, podziału majątku " +
    "i władzy rodzicielskiej, sprzeciw małżonka niewinnego z art. 56 § 3 k.r.o. oraz wyrok ETPC " +
    "w sprawie H.W. przeciwko Francji. Opiera się na przepisach, orzecznictwie i piśmiennictwie, " +
    "bez badania ankietowego.",
  "praca-mgr-prawo-zachowek":
    "Praca o zachowku w polskim prawie spadkowym: kto jest uprawniony, jak ustala się substrat " +
    "zachowku i dolicza darowizny, jak oblicza się należną kwotę i kiedy roszczenie się przedawnia. " +
    "Omawia zmiany wprowadzone ustawą o fundacji rodzinnej, obniżenie zachowku ze względu na " +
    "zasady współżycia społecznego i rozłożenie świadczenia na raty z art. 997(1) k.c. Opiera się " +
    "na przepisach, orzecznictwie Trybunału Konstytucyjnego i piśmiennictwie, bez badania ankietowego.",
  "praca-mgr-prawo-obrona-konieczna":
    "Praca o obronie koniecznej w polskim prawie karnym: przesłanki z art. 25 § 1 k.k., przekroczenie " +
    "granic obrony i jego skutki, a przede wszystkim art. 25 § 2a k.k. dodany nowelizacją z 2018 roku, " +
    "który wyłącza karalność przekroczenia granic przy odpieraniu wdarcia się do mieszkania, domu " +
    "lub na ogrodzony teren. Omawia genezę zmiany, jej wykładnię, granice konstytucyjne i konwencyjne " +
    "oraz krytykę w doktrynie. Opiera się na przepisach, orzecznictwie i piśmiennictwie, bez badania ankietowego.",
  "praca-mgr-administracja-wojt":
    "Praca o wójcie, burmistrzu i prezydencie miasta jako organie wykonawczym gminy: pozycja ustrojowa " +
    "organu po reformie z 2002 roku, zakres kompetencji (wykonywanie budżetu, gospodarowanie mieniem, " +
    "decyzje administracyjne, kierowanie urzędem i rola zastępcy), odpowiedzialność polityczna, nadzorcza, " +
    "antykorupcyjna, cywilna i karna oraz relacje z radą gminy — raport o stanie gminy, absolutorium, " +
    "wotum zaufania, referendum odwoławcze i spór o kadencyjność. Opiera się na przepisach, orzecznictwie " +
    "sądów administracyjnych i piśmiennictwie, bez badania ankietowego.",
  "praca-mgr-administracja-nadzor-wojewody":
    "Praca o nadzorze wojewody nad działalnością samorządu terytorialnego: podstawy konstytucyjne " +
    "z art. 171 Konstytucji RP, kryterium legalności jako jedyne dopuszczalne kryterium ingerencji, " +
    "pozycja ustrojowa wojewody i rozgraniczenie jego właściwości od regionalnych izb obrachunkowych, " +
    "pełny katalog środków nadzorczych (wstrzymanie wykonania uchwały, rozstrzygnięcie nadzorcze " +
    "stwierdzające nieważność, wskazanie naruszenia nieistotnego, zarządzenie zastępcze, rozwiązanie " +
    "organu stanowiącego, zarząd komisaryczny) oraz sądowa kontrola aktów nadzoru jako gwarancja " +
    "samodzielności gminy. Opiera się na przepisach, orzecznictwie sądów administracyjnych " +
    "i Trybunału Konstytucyjnego oraz piśmiennictwie, bez badania ankietowego.",
  "praca-mgr-administracja-odpowiedzialnosc-dyscyplinarna":
    "Praca o odpowiedzialności dyscyplinarnej członków korpusu służby cywilnej: ustrojowe podstawy " +
    "służby cywilnej i status prawny urzędnika, przewinienie dyscyplinarne jako naruszenie obowiązków " +
    "i problem jego niedookreśloności, odgraniczenie odpowiedzialności dyscyplinarnej od porządkowej, " +
    "karnej i majątkowej, ustrój komisji dyscyplinarnych i Wyższej Komisji Dyscyplinarnej, katalog kar " +
    "i zasada proporcjonalności, przebieg postępowania wyjaśniającego i dyscyplinarnego, przedawnienie " +
    "i zatarcie ukarania oraz sądowa kontrola orzeczeń w świetle standardu rzetelnego procesu. " +
    "Opiera się na przepisach, orzecznictwie Trybunału Konstytucyjnego, Sądu Najwyższego i sądów " +
    "administracyjnych oraz piśmiennictwie, bez badania ankietowego.",
  "praca-mgr-logistyka-integracja-dostawcow":
    "Praca o integracji dostawców w łańcuchu dostaw: teoretyczne podstawy współpracy " +
    "międzyorganizacyjnej, modele i mechanizmy integracji (od relacji transakcyjnych po partnerstwo " +
    "strategiczne, VMI i wspólne planowanie), korzyści i koszty integracji oraz bariery jej " +
    "wdrażania. Zawiera rozdział z badaniem własnym metodą wywiadów pogłębionych (IDI) i analizy " +
    "dokumentów oraz aneks z dyspozycjami do wywiadu i protokołem analizy.",
  "praca-mgr-logistyka-ostatnia-mila":
    "Praca o logistyce ostatniej mili w dostawach miejskich: miejsce ostatniego odcinka w systemie " +
    "dystrybucji i jego udział w kosztach, źródła nieefektywności w warunkach rozwoju handlu " +
    "elektronicznego (nieudane dostawy, puste przebiegi, rozdrobnienie przesyłek), koszty zewnętrzne " +
    "transportu dostawczego w miastach, rozwiązania techniczne i organizacyjne (automaty paczkowe, " +
    "mikrohuby, rowery towarowe, pojazdy elektryczne) oraz regulacje miejskie i ekonomika wdrożeń. " +
    "Opiera się na literaturze przedmiotu, danych zastanych i studiach przypadków, bez badania ankietowego.",
  "praca-mgr-logistyka-cyfryzacja":
    "Praca o cyfryzacji łańcucha dostaw: odróżnienie cyfryzacji od informatyzacji i ramy Logistyki 4.0, " +
    "warstwa systemowa (ERP, WMS, TMS) i technologie gromadzenia oraz wymiany danych (RFID, IoT, EDI), " +
    "zaawansowane narzędzia — analityka i uczenie maszynowe w prognozowaniu popytu, rozproszony rejestr, " +
    "cyfrowy bliźniak — oraz metodyka oceny efektów wdrożenia, bariery i przyczyny niepowodzeń projektów. " +
    "Opiera się na literaturze przedmiotu, danych zastanych i studiach przypadków, bez badania ankietowego.",
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
  "praca-mgr-prawo-blad-medyczny": "odszkodowanie za błąd medyczny",
  "praca-mgr-prawo-mobbing": "mobbing w miejscu pracy",
  "praca-mgr-prawo-rodo": "ochrona danych osobowych w RODO",
  "praca-mgr-prawo-rozwod": "rozwód z orzekaniem o winie",
  "praca-mgr-prawo-zachowek": "zachowek w prawie spadkowym",
  "praca-mgr-prawo-obrona-konieczna": "obrona konieczna po nowelizacji",
  "praca-mgr-administracja-wojt": "kompetencje wójta i burmistrza",
  "praca-mgr-administracja-nadzor-wojewody": "nadzór wojewody nad samorządem",
  "praca-mgr-administracja-odpowiedzialnosc-dyscyplinarna": "odpowiedzialność dyscyplinarna urzędników",
  "praca-mgr-logistyka-integracja-dostawcow": "integracja dostawców w łańcuchu dostaw",
  "praca-mgr-logistyka-ostatnia-mila": "logistyka ostatniej mili w miastach",
  "praca-mgr-logistyka-cyfryzacja": "cyfryzacja łańcucha dostaw",
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
