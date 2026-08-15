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
