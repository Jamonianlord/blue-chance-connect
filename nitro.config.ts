import { defineConfig } from "nitro";

export default defineConfig({
  // Server routes directory (separate from TanStack client routes in src/routes)
  serverDir: "src",
  routesDir: "server/routes",
  
  // Cloudflare Workers preset config
  cloudflare: {
    deployConfig: true,
    nodeCompat: true,
  },
  
  // Route rules
  routeRules: {
    "/sitemap.xml": {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    },
  },
});