/**
 * Cinematic Reels — data access + storage helpers.
 *
 * Reels reuse the existing architecture: the `packages` table stays the single
 * source of truth for pricing, `categories` for service taxonomy, and the
 * centralised WhatsApp utility in `@/lib/site` for every enquiry message.
 */
import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ReelRow = Database["public"]["Tables"]["reels"]["Row"];

export type Reel = ReelRow & {
  categories?: { name: string; slug: string } | null;
  packages?: { name: string; slug: string; price: number | null; currency: string } | null;
};

export const REEL_BUCKET = "reels";
/** Matches the gallery pipeline: long-lived signed links, never raw paths. */
export const REEL_URL_TTL = 60 * 60 * 24 * 365 * 10;

const REEL_FIELDS =
  "id,short_id,title,description,video_url,poster_url,aspect_ratio,category_id,package_id,location,featured,published,display_order,created_at";

const REEL_SELECT = `${REEL_FIELDS}, categories(name,slug), packages(name,slug,price,currency)`;

/** Public showcase — only published reels, in curated order. */
export const publishedReelsQuery = queryOptions({
  queryKey: ["reels", "published"],
  queryFn: async (): Promise<Reel[]> => {
    const { data, error } = await supabase
      .from("reels")
      .select(REEL_SELECT)
      .eq("published", true)
      .order("display_order")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as Reel[];
  },
});

export const reelByShortIdQuery = (shortId: string) =>
  queryOptions({
    queryKey: ["reel", shortId],
    queryFn: async (): Promise<Reel | null> => {
      const { data, error } = await supabase
        .from("reels")
        .select(REEL_SELECT)
        .eq("short_id", shortId)
        .eq("published", true)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as Reel | null;
    },
  });

/** Admin list — every reel, published or not. */
export const adminReelsQuery = queryOptions({
  queryKey: ["reels", "admin"],
  queryFn: async (): Promise<Reel[]> => {
    const { data, error } = await supabase
      .from("reels")
      .select(`*, categories(name,slug), packages(name,slug,price,currency)`)
      .order("display_order")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as Reel[];
  },
});

/** The two canonical cinematic packages, read from the shared packages table. */
export const CINEMATIC_SLUGS = ["studio-cinematic-reel", "outdoor-cinematic-reel"] as const;

export type CinematicPackage = Database["public"]["Tables"]["packages"]["Row"] & {
  package_features?: { id: string; label: string }[] | null;
};

export const cinematicPackagesQuery = queryOptions({
  queryKey: ["packages", "cinematic"],
  queryFn: async (): Promise<CinematicPackage[]> => {
    const { data, error } = await supabase
      .from("packages")
      .select("*, package_features(*)")
      .in("slug", CINEMATIC_SLUGS as unknown as string[])
      .order("price");
    if (error) throw error;
    return (data ?? []) as unknown as CinematicPackage[];
  },
});

export function isStudioPackage(slug: string) {
  return slug === "studio-cinematic-reel";
}

/* -------------------------------------------------------------------------- */
/* Presentation helpers                                                        */
/* -------------------------------------------------------------------------- */

/** Aspect ratio as a CSS value; guards against odd CMS input. */
export function aspectValue(ratio?: string | null): string {
  const r = (ratio ?? "9:16").trim();
  return /^\d+\s*:\s*\d+$/.test(r) ? r.replace(/\s/g, "").replace(":", " / ") : "9 / 16";
}

/** Never surface camera filenames such as VID_1234 to a visitor. */
export function publicReelTitle(reel: { title?: string | null; categories?: { name: string } | null }) {
  const raw = (reel.title ?? "").trim();
  const looksTechnical =
    !raw ||
    /^(vid|mvi|dsc|img|mov|clip|movie|reel)[\s_-]*\d+$/i.test(raw) ||
    !/[a-z]{3,}/i.test(raw.replace(/\.(mp4|mov|webm|m4v)$/i, ""));
  if (looksTechnical) return reel.categories?.name ? `${reel.categories.name} Cinematic Reel` : "Cinematic Reel";
  return raw.replace(/\.(mp4|mov|webm|m4v)$/i, "");
}

/* -------------------------------------------------------------------------- */
/* Storage (admin only)                                                        */
/* -------------------------------------------------------------------------- */

export function reelVideoPath(reelId: string, ext: string) {
  return `${reelId}/web.${ext}`;
}

/**
 * Uploads an already web-optimised video (H.264 MP4 / WebM). Heavy transcoding
 * is intentionally left outside the app — the Worker runtime cannot do it and
 * browser-side video encoding is not acceptable for visitors.
 */
export async function uploadReelVideo(reelId: string, file: File) {
  const ext = (file.name.split(".").pop() ?? "mp4").toLowerCase();
  const path = reelVideoPath(reelId, ext === "webm" ? "webm" : "mp4");
  const { error } = await supabase.storage
    .from(REEL_BUCKET)
    .upload(path, file, { upsert: true, cacheControl: "31536000", contentType: file.type || "video/mp4" });
  if (error) throw new Error(error.message);
  const { data, error: signErr } = await supabase.storage
    .from(REEL_BUCKET)
    .createSignedUrl(path, REEL_URL_TTL);
  if (signErr || !data?.signedUrl) throw new Error(signErr?.message ?? "Could not create a link for this video");
  return { path, url: data.signedUrl };
}
