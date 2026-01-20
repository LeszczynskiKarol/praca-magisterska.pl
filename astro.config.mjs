import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://www.praca-magisterska.pl",
  integrations: [tailwind(), sitemap()],
  markdown: {
    shikiConfig: {
      theme: "github-light",
    },
  },
});
