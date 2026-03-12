import type { APIRoute } from "astro";
import { siteMeta } from "../lib/site";

export const GET: APIRoute = () => {
  return new Response(`User-agent: *\nAllow: /\nSitemap: ${siteMeta.site}/sitemap-index.xml\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8"
    }
  });
};
