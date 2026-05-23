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
        !/\/sklep\/[^/]+\/(anulowano|sukces)\/?$/.test(page),
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
