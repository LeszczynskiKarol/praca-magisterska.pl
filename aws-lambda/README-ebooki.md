# Jak dodawać nowe ebooki kierunkowe

Źródłem prawdy o produktach jest plik [`products.json`](./products.json). Edytuj tylko ten plik — nie trzeba już grzebać w kodzie każdej lambdy.

## Krok po kroku — dodawanie nowego kierunku

1. **Przygotuj PDF** o nazwie np. `Jak-napisac-prace-magisterska-z-{kierunek}.pdf`.
2. **Wrzuć PDF na S3** do bucketu `praca-magisterska-ebooks`:

   ```bash
   aws s3 cp "Jak-napisac-prace-magisterska-z-{kierunek}.pdf" \
     s3://praca-magisterska-ebooks/ebooks/kierunki/jak-napisac-prace-magisterska-z-{kierunek}.pdf
   ```

3. **Dodaj produkt do `products.json`**:

   ```json
   {
     "id": "ebook-magisterska-{kierunek}",
     "name": "Jak napisać pracę magisterską z {kierunek}",
     "price": 3900,
     "currency": "pln",
     "s3Key": "ebooks/kierunki/jak-napisac-prace-magisterska-z-{kierunek}.pdf",
     "fileName": "Jak-napisac-prace-magisterska-z-{kierunek}.pdf",
     "emailSubject": "🎓 Twój przewodnik jest gotowy",
     "category": "Ebook kierunkowy"
   }
   ```

4. **Stwórz landing page** w Astro:

   ```
   src/pages/sklep/jak-napisac-prace-magisterska-z-{kierunek}/index.astro
   ```

   Najprościej skopiować istniejący landing psychologii i zamienić teksty.
   Ważne: w Astro ustaw `ebook.id` na dokładnie taki sam `id` jaki wpisałeś w `products.json`.

5. **Dodaj produkt do GA4 na stronach sukcesu** (opcjonalne, dla poprawności śledzenia):
   - `src/pages/sklep/sukces.astro`
   - `src/pages/sklep/praca-magisterska-ebook/sukces.astro`

6. **Zdeployuj** (`deploy.sh` automatycznie skopiuje `products.json` do każdej lambdy):

   ```bash
   ./deploy.sh test   # testy z karty 4242 4242 4242 4242
   # lub
   ./deploy.sh prod   # produkcja
   ```

## Ceny

- Ebooki kierunkowe (magisterka): **3900** (= 39 zł)
- Istniejące produkty pozostają bez zmian:
  - licencjacka: **2900** (= 29 zł)
  - magisterska ogólna: **3900** (= 39 zł)

## Architektura

Trzy lambdy korzystają z tego samego `products.json`:

- `create-checkout` — tworzy sesję Stripe na podstawie `id` i `price`
- `webhook-handler` — po opłaceniu wysyła email z linkiem do pliku wskazywanego przez `s3Key`
- `get-download` — generuje presigned URL do pobrania właściwego pliku

Dzięki temu dodanie nowego kierunku wymaga tylko:
- uploadu PDF,
- jednej pozycji w `products.json`,
- landing page w Astro.

Stare produkty i ich `id` **nie zmieniają się** — zachowana jest pełna kompatybilność wsteczna.
