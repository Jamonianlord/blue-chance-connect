const BASE_URL = "https://1chance.fun";

const PUBLIC_ROUTES = [
  { path: "/", priority: 1.0 },
  { path: "/terms", priority: 0.5 },
  { path: "/privacy", priority: 0.5 },
  { path: "/login", priority: 0.5 },
  { path: "/signup", priority: 0.5 },
];

export default async function (_request: Request) {
  const today = new Date().toISOString().split("T")[0];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PUBLIC_ROUTES.map(
  (route) => `  <url>
    <loc>${BASE_URL}${route.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${route.priority}</priority>
  </url>`
).join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
