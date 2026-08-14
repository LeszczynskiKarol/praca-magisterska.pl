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
        !/\/poradniki\/od-czego-zaczac-mgr\/?$/.test(page) &&
        // Kategorie prac bez własnej treści (kierunek z jedną pracą) renderują
        // się jako stub z noindex i przekierowaniem — nie zgłaszamy ich w mapie.
        !/\/prace\/(pedagogika|pielegniarstwo)\/?$/.test(page),
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
