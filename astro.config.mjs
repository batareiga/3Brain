import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://batareiga.github.io",
  base: "/3Brain",
  integrations: [sitemap()],
  trailingSlash: "always"
});
