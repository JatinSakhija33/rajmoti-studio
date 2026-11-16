import { mkdirSync, writeFileSync } from "node:fs";

const candidate =
  process.env.VITE_PUBLIC_SITE_URL ||
  process.env.CF_PAGES_URL ||
  "https://rajmotistudio.in";

let origin = "https://rajmotistudio.in";
try {
  const u = new URL(candidate);
  if (
    u.protocol === "https:" &&
    u.hostname !== "localhost" &&
    !u.hostname.includes("127.0.0.1") &&
    !u.hostname.includes("YOUR-") &&
    u.hostname !== "YOUR-DOMAIN.example"
  ) {
    origin = u.origin;
  }
} catch {
  origin = "https://rajmotistudio.in";
}

const routes = [
  // Primary Hubs
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/products", priority: "0.95", changefreq: "daily" },
  { path: "/products/gifts", priority: "0.9", changefreq: "weekly" },
  { path: "/products/frames", priority: "0.9", changefreq: "weekly" },
  { path: "/products/mugs", priority: "0.85", changefreq: "weekly" },
  { path: "/products/devotional", priority: "0.9", changefreq: "weekly" },
  { path: "/products/magazines", priority: "0.85", changefreq: "weekly" },
  { path: "/products/phone-covers", priority: "0.8", changefreq: "weekly" },
  { path: "/same-day", priority: "0.85", changefreq: "daily" },
  { path: "/services/photo-restoration", priority: "0.8", changefreq: "monthly" },

  // P0 Core Market Hyperlocal Pages (Jetpur & Jetpur-Navagadh)
  { path: "/locations", priority: "0.8", changefreq: "weekly" },
  { path: "/locations/jetpur", priority: "0.9", changefreq: "weekly" },
  { path: "/locations/jetpur/personalized-gifts", priority: "0.95", changefreq: "weekly" },
  { path: "/locations/jetpur/photo-frames", priority: "0.95", changefreq: "weekly" },
  { path: "/locations/jetpur/photo-printing", priority: "0.9", changefreq: "weekly" },
  { path: "/locations/jetpur/photography-studio", priority: "0.9", changefreq: "weekly" },

  // P1 Nearby Expansion Pages (Virpur, Dhoraji, Gondal)
  { path: "/locations/virpur/devotional-photo-gifts", priority: "0.8", changefreq: "monthly" },
  { path: "/locations/dhoraji/personalized-gifts", priority: "0.8", changefreq: "monthly" },
  { path: "/locations/gondal/personalized-gifts", priority: "0.8", changefreq: "monthly" },

  // Studio Portfolios
  { path: "/portfolios", priority: "0.85", changefreq: "weekly" },
  { path: "/portfolios/baby", priority: "0.8", changefreq: "weekly" },
  { path: "/portfolios/maternity", priority: "0.8", changefreq: "weekly" },
  { path: "/portfolios/family", priority: "0.8", changefreq: "weekly" },
  { path: "/portfolios/wedding", priority: "0.8", changefreq: "weekly" },

  // Institutional Pages
  { path: "/packages", priority: "0.75", changefreq: "monthly" },
  { path: "/stories", priority: "0.7", changefreq: "monthly" },
  { path: "/cinematic-reels", priority: "0.7", changefreq: "monthly" },
  { path: "/about", priority: "0.7", changefreq: "monthly" },
  { path: "/contact", priority: "0.8", changefreq: "monthly" },
];

mkdirSync("public", { recursive: true });

const robots = [
  "User-agent: *",
  "Allow: /",
  "Disallow: /admin",
  "Disallow: /auth",
  "Disallow: /reset-password",
  "Disallow: /desk",
  "Disallow: /track",
  "Disallow: /api",
  "",
  `Sitemap: ${origin}/sitemap.xml`,
];
writeFileSync("public/robots.txt", robots.join("\n") + "\n");

const esc = (s) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
const today = new Date().toISOString().split("T")[0];

const sitemapDoc = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${routes
  .map(
    (r) => `  <url>
    <loc>${esc(origin + r.path)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

writeFileSync("public/sitemap.xml", sitemapDoc);
console.log("Generated comprehensive SEO sitemap.xml & robots.txt for", origin);
