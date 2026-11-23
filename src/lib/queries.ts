import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { studioConnected } from "@/lib/backend-mode";
import { hybridPublicCategories, hybridCategoryBySlug, hybridSubcategories, hybridPublicCounts, hybridImagePage, isPublishedId } from "@/lib/hybrid-portfolio";
import { loadPublishedPhotos, publishedCategories, publishedCounts } from "@/lib/published-portfolio";

/** Public taxonomy: only published, non-archived categories. */
export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: hybridPublicCategories,
  // Render the 385 already published Cloudflare photos immediately while
  // any optional new Supabase category records load in the background.
  initialData: publishedCategories,
  initialDataUpdatedAt: () => 0,
});

/** Admin taxonomy: everything, including hidden and archived rows. */
export const adminCategoriesQuery = queryOptions({
  queryKey: ["categories", "admin"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("display_order")
      .order("name");
    if (error) throw error;
    return data ?? [];
  },
});

export const adminSubcategoriesQuery = queryOptions({
  queryKey: ["subcategories", "admin"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("subcategories")
      .select("*")
      .order("display_order")
      .order("name");
    if (error) throw error;
    return data ?? [];
  },
});

/** How many photographs live in each category / subcategory. */
export const taxonomyCountsQuery = queryOptions({
  queryKey: ["taxonomy", "counts"],
  queryFn: hybridPublicCounts,
});

export const subcategoriesQuery = (categoryId: string) =>
  queryOptions({
    queryKey: ["subcategories", categoryId],
    queryFn: () => hybridSubcategories(categoryId),
  });

export const categoryBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: ["category", slug],
    queryFn: () => hybridCategoryBySlug(slug),
  });

/** Old portfolio URLs keep working after a slug is renamed. */
export async function lookupSlugRedirect(kind: "category" | "subcategory", oldSlug: string, categorySlug?: string) {
  let q = supabase
    .from("slug_redirects")
    .select("new_slug")
    .eq("kind", kind)
    .eq("old_slug", oldSlug);
  if (categorySlug) q = q.eq("category_slug", categorySlug);
  const { data } = await q.maybeSingle();
  return data?.new_slug ?? null;
}


/** Only the columns the public gallery actually renders — keeps payloads small. */
export const GALLERY_FIELDS =
  "id,title,description,alt_text,short_id,theme,image_url,thumbnail_url,variants,width,height,dominant_color,display_order,created_at,category_id,subcategory_id";

export const GALLERY_PAGE_SIZE = 24;

/** A cover from the published portfolio when a category has no selected cover. */
export const photographyCoverQuery = (categoryId: string) =>
  queryOptions({
    queryKey: ["images", "cover", categoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("images")
        .select("image_url,thumbnail_url,variants")
        .eq("hidden", false)
        .eq("category_id", categoryId)
        .order("featured", { ascending: false })
        .order("display_order")
        .order("created_at", { ascending: false })
        .order("id")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

/** Public single-photo page — resolved by the short, non-guessable public id. */
export const photoByShortIdQuery = (shortId: string) =>
  queryOptions({
    queryKey: ["photo", shortId],
    queryFn: async () => {
      if (/^[a-f0-9]{20}$/.test(shortId)) {
        const publishedPhoto = (await loadPublishedPhotos()).find((photo) => photo.short_id === shortId);
        if (publishedPhoto) return publishedPhoto;
      }
      const { data, error } = await supabase
        .from("images")
        .select(`${GALLERY_FIELDS}, categories(name,slug), subcategories(name,slug)`)
        .eq("short_id", shortId)
        .eq("hidden", false)
        .maybeSingle();
      if (error) throw error;
      return data as
        | (Record<string, any> & {
            title: string | null;
            alt_text: string | null;
            description: string | null;
            width: number | null;
            height: number | null;
          })
        | null;
    },
  });


export const imagesByCategoryQuery = (categoryId: string, subcategoryId?: string) =>
  queryOptions({
    queryKey: ["images", categoryId, subcategoryId ?? "all"],
    queryFn: async () => {
      if (!isPublishedId(categoryId)) {
        let q = supabase.from("images").select(GALLERY_FIELDS)
          .eq("hidden", false).eq("category_id", categoryId)
          .order("display_order").order("created_at", { ascending: false })
          .order("id");
        if (subcategoryId) q = q.eq("subcategory_id", subcategoryId);
        const { data, error } = await q;
        if (error) throw error;
        return data ?? [];
      }
      const all: any[] = [];
      for (let page = 0; page < 50; page++) {
        const batch = await hybridImagePage(categoryId, subcategoryId, page, 100, GALLERY_FIELDS);
        all.push(...batch);
        if (batch.length < 100) break;
      }
      return all;
    },
  });

/** Paged gallery reads: existing Cloudflare assets + new Supabase CMS images. */
export const imagesByCategoryInfiniteQuery = (categoryId: string, subcategoryId?: string) =>
  infiniteQueryOptions({
    queryKey: ["images", "paged", categoryId, subcategoryId ?? "all"],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      hybridImagePage(categoryId, subcategoryId, pageParam as number, GALLERY_PAGE_SIZE, GALLERY_FIELDS),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < GALLERY_PAGE_SIZE ? undefined : allPages.length,
  });

export const featuredImagesQuery = queryOptions({
  queryKey: ["images", "featured"],
  queryFn: async () => {
    // Bundled first-in-manifest photos remain visible after switching to
    // Supabase, even before the old database/schema is restored.
    const published = (await loadPublishedPhotos()).slice(0, 12);
    if (!studioConnected) return published;
    try {
      const { data, error } = await supabase.from("images")
        .select(GALLERY_FIELDS).eq("hidden", false).eq("featured", true)
        .order("display_order").limit(12);
      if (error) return published;
      const live = data ?? [];
      const seen = new Set(live.map((row) => row.short_id));
      return [...live, ...published.filter((row) => !seen.has(row.short_id))].slice(0, 12);
    } catch {
      return published;
    }
  },
});

export const packagesQuery = queryOptions({
  queryKey: ["packages"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("packages")
      .select("*, package_features(*), categories(name, slug)")
      .order("display_order");
    if (error) throw error;
    return data ?? [];
  },
});

export const testimonialsQuery = queryOptions({
  queryKey: ["testimonials"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .eq("featured", true)
      .order("display_order");
    if (error) throw error;
    return data ?? [];
  },
});

export const inquiriesQuery = queryOptions({
  queryKey: ["inquiries"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("inquiries")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});

export const allImagesQuery = queryOptions({
  queryKey: ["images", "all"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("images")
      .select("*, categories(name, slug), subcategories(name, slug)")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    return data ?? [];
  },
});

export const mapsEmbedQuery = queryOptions({
  queryKey: ["settings", "maps_embed_url"],
  queryFn: async () => {
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "maps_embed_url")
      .maybeSingle();
    const v = data?.value;
    return typeof v === "string" ? v : "";
  },
});

export const settingsQuery = queryOptions({
  queryKey: ["settings", "all"],
  queryFn: async () => {
    const { data, error } = await supabase.from("settings").select("*");
    if (error) throw error;
    return data ?? [];
  },
});

export const siteContentQuery = queryOptions({
  queryKey: ["site_content", "all"],
  queryFn: async () => {
    const { data, error } = await supabase.from("site_content").select("*");
    if (error) throw error;
    const map: Record<string, any> = {};
    for (const row of data ?? []) map[(row as any).section_key] = (row as any).data ?? {};
    return map;
  },
});

/** Studio Google Business profile URL, configured once in Admin → Settings. */
export const googleProfileQuery = queryOptions({
  queryKey: ["settings", "google_profile_share_url"],
  queryFn: async (): Promise<string> => {
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "google_profile_share_url")
      .maybeSingle();
    const v = data?.value;
    return typeof v === "string" ? v : "";
  },
});
