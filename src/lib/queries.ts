import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Public taxonomy: only published, non-archived categories. */
export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("hidden", false)
      .is("archived_at", null)
      .order("display_order")
      .order("name");
    if (error) throw error;
    return data ?? [];
  },
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
  queryFn: async () => {
    const { data, error } = await supabase
      .from("images")
      .select("category_id,subcategory_id,featured");
    if (error) throw error;
    const byCategory: Record<string, number> = {};
    const bySubcategory: Record<string, number> = {};
    const featuredByCategory: Record<string, number> = {};
    for (const row of data ?? []) {
      if (row.category_id) {
        byCategory[row.category_id] = (byCategory[row.category_id] ?? 0) + 1;
        if (row.featured) featuredByCategory[row.category_id] = (featuredByCategory[row.category_id] ?? 0) + 1;
      }
      if (row.subcategory_id) bySubcategory[row.subcategory_id] = (bySubcategory[row.subcategory_id] ?? 0) + 1;
    }
    return { byCategory, bySubcategory, featuredByCategory };
  },
});

export const subcategoriesQuery = (categoryId: string) =>
  queryOptions({
    queryKey: ["subcategories", categoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subcategories")
        .select("*")
        .eq("category_id", categoryId)
        .order("display_order");
      if (error) throw error;
      return data ?? [];
    },
  });

export const categoryBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: ["category", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*, subcategories(*)")
        .eq("slug", slug)
        .eq("hidden", false)
        .is("archived_at", null)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
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

/** Public single-photo page — resolved by the short, non-guessable public id. */
export const photoByShortIdQuery = (shortId: string) =>
  queryOptions({
    queryKey: ["photo", shortId],
    queryFn: async () => {
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
      let q = supabase
        .from("images")
        .select(GALLERY_FIELDS)
        .eq("hidden", false)
        .eq("category_id", categoryId)
        .order("display_order")
        .order("created_at", { ascending: false })
        .order("id");
      if (subcategoryId) q = q.eq("subcategory_id", subcategoryId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

/** Paged gallery reads — the grid only fetches what the visitor scrolls to. */
export const imagesByCategoryInfiniteQuery = (categoryId: string, subcategoryId?: string) =>
  infiniteQueryOptions({
    queryKey: ["images", "paged", categoryId, subcategoryId ?? "all"],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const from = (pageParam as number) * GALLERY_PAGE_SIZE;
      let q = supabase
        .from("images")
        .select(GALLERY_FIELDS)
        .eq("hidden", false)
        .eq("category_id", categoryId)
        // Deterministic tiebreakers: every row shares display_order = 0 and bulk
        // uploads share created_at, so without `id` the range windows overlap and
        // photographs silently vanish between pages.
        .order("display_order")
        .order("created_at", { ascending: false })
        .order("id")
        .range(from, from + GALLERY_PAGE_SIZE - 1);
      if (subcategoryId) q = q.eq("subcategory_id", subcategoryId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < GALLERY_PAGE_SIZE ? undefined : allPages.length,
  });


export const featuredImagesQuery = queryOptions({
  queryKey: ["images", "featured"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("images")
      .select(GALLERY_FIELDS)
      .eq("hidden", false)
      .eq("featured", true)
      .order("display_order")
      .limit(12);
    if (error) throw error;
    return data ?? [];
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
