import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://www.praca-magisterska.pl",
  integrations: [
    tailwind(),
    sitemap({
      filter: (page) =>
        !/\/sklep\/(anulowano|sukces)\/?$/.test(page) &&
        !/\/sklep\/[^/]+\/(anulowano|sukces)\/?$/.test(page) &&
        !/\/sklep\/praca-licencjacka-ebook\/?$/.test(page) &&
        !/\/poradniki\/od-czego-zaczac-mgr\/?$/.test(page),
        // Prawo miało jedną pracę i /prace/prawo/ było stubem z noindex,
        // wykluczonym stąd, żeby nie zgłaszać w mapie strony z noindex.
        // 18.08.2026 doszły mobbing i RODO — kategoria jest pełna i wraca.
        // UWAGA: kierunek poniżej progu MIN_PRAC_NA_KATEGORIE renderuje się jako
        // stub z noindex i przekierowaniem i wtedy trzeba go tu wykluczyć.
        // Pielęgniarstwo i pedagogika miały taki wpis do 2026-08-15 — po dojściu
        // drugiej pracy stały się pełnymi kategoriami i wróciły do mapy.
    }),
  ],
  markdown: {
    shikiConfig: {
      theme: "github-light",
    },
  },
  vite: {
    server: {
      allowedHosts: ["dev.torweb.pl"],
    },
    define: {
      "import.meta.env.API_URL": JSON.stringify(
        process.env.API_URL || "http://localhost:4000",
      ),
    },
  },
});
