import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = (process.env.VITE_PUBLIC_SITE_URL || "https://rajmotistudio.lovable.app").replace(/\/$/, "");

type Entry = { path: string; changefreq?: string; priority?: string };

const STATIC: Entry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/portfolios", changefreq: "weekly", priority: "0.9" },
  { path: "/cinematic-reels", changefreq: "weekly", priority: "0.9" },
  { path: "/gifts", changefreq: "monthly", priority: "0.8" },
  { path: "/packages", changefreq: "monthly", priority: "0.8" },
  { path: "/about", changefreq: "yearly", priority: "0.6" },
  { path: "/contact", changefreq: "yearly", priority: "0.7" },
  { path: "/book", changefreq: "monthly", priority: "0.7" },
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: Entry[] = [...STATIC];

        try {
          const supabase = createClient(
            process.env["VITE_SUPABASE_URL"]!,
            process.env["VITE_SUPABASE_PUBLISHABLE_KEY"]!,
            { auth: { persistSession: false } },
          );
          const { data: cats } = await supabase
            .from("categories")
            .select("slug, hidden, archived_at, subcategories(slug, hidden, archived_at)")
            .order("display_order");

          for (const c of cats ?? []) {
            if ((c as any).hidden || (c as any).archived_at) continue;
            entries.push({ path: `/portfolios/${c.slug}`, changefreq: "weekly", priority: "0.9" });
            for (const s of ((c as any).subcategories ?? []) as any[]) {
              if (s.hidden || s.archived_at) continue;
              entries.push({
                path: `/portfolios/${c.slug}/${s.slug}`,
                changefreq: "weekly",
                priority: "0.7",
              });
            }
          }
          const { data: reels } = await supabase
            .from("reels")
            .select("short_id")
            .eq("published", true);
          for (const r of reels ?? []) {
            entries.push({ path: `/reel/${r.short_id}`, changefreq: "monthly", priority: "0.6" });
          }
        } catch {
          // fall back to static routes only
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
