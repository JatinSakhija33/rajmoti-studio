/**
 * PUBLIC PHOTO READ ROUTER
 *
 * Cloudflare Pages is the source of truth for the 385 already published,
 * consented photographs. Supabase is used for new CMS records, bookings and
 * admin data. No "copy images to Supabase" step is required to keep these
 * published photos on the site in live mode.
 *
 * Important: these Cloudflare assets are PUBLIC and immutable per deployment.
 * Hiding/removing a previously published image requires a new build that
 * removes its files, NOT just hiding a database row.
 */
import { supabase } from "@/integrations/supabase/client";
import { studioConnected } from "@/lib/backend-mode";
import { loadPublishedPhotos, publishedCategories, publishedCounts } from "@/lib/published-portfolio";

export const isPublishedId = (id: string) => id.startsWith("published:");
export const publishedCategory = (slug: string) =>
  publishedCategories.find((c) => c.slug === slug) ?? null;

export async function hybridPublicCategories() {
  if (!studioConnected) return publishedCategories;
  try {
    const { data, error } = await supabase.from("categories")
      .select("*").eq("hidden", false).is("archived_at", null)
      .order("display_order").order("name");
    if (error) return publishedCategories;
    // The bundled category owns its public ID so all static images remain
    // reachable even when a new Supabase project has empty business tables.
    const staticSlugs = new Set(publishedCategories.map((c) => c.slug));
    return [...publishedCategories, ...(data ?? []).filter((c) => !staticSlugs.has(c.slug))];
  } catch {
    return publishedCategories;
  }
}

export async function hybridCategoryBySlug(slug: string) {
  const bundled = publishedCategory(slug);
  if (bundled) return bundled;
  if (!studioConnected) return null;
  const { data, error } = await supabase.from("categories")
    .select("*, subcategories(*)").eq("slug", slug)
    .eq("hidden", false).is("archived_at", null).maybeSingle();
  if (error) throw error;
  return data;
}

export async function hybridSubcategories(categoryId: string) {
  if (isPublishedId(categoryId)) {
    return publishedCategories.find((c) => c.id === categoryId)?.subcategories ?? [];
  }
  const { data, error } = await supabase.from("subcategories")
    .select("*").eq("category_id", categoryId).order("display_order");
  if (error) throw error;
  return data ?? [];
}

export const CLOUD_GALLERY_COUNT = 385;
export const CLOUD_VARIANTS_COUNT = 1155;
export const cloudflarePublishedCounts = publishedCounts;

/**
 * Fetch a single page of published photos from the bundled manifest and
 * append any NEW Supabase-managed images for the same taxonomy slug.
 * Supabase schema/network failures must never hide Cloudflare public photos.
 * New Supabase records with /portfolio/ URLs are intentionally excluded
 * to avoid duplicates after a separate metadata import.
 */
export async function hybridImagePage(
  categoryId: string,
  subcategoryId: string | undefined,
  page: number,
  pageSize: number,
  fields: string
) {
  const start = page * pageSize;
  if (!isPublishedId(categoryId)) {
    let q = supabase.from("images").select(fields)
      .eq("hidden", false).eq("category_id", categoryId)
      .order("display_order").order("created_at", { ascending: false })
      .order("id").range(start, start + pageSize - 1);
    if (subcategoryId) q = q.eq("subcategory_id", subcategoryId);
    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
  }

  const categorySlug = categoryId.slice("published:".length);
  const subSlug = subcategoryId?.startsWith(`published:${categorySlug}:`)
    ? subcategoryId.slice(`published:${categorySlug}:`.length)
    : undefined;
  const allStatic = (await loadPublishedPhotos()).filter(
    (photo) => photo.category_id === categoryId &&
      (!subcategoryId || photo.subcategory_id === subcategoryId)
  );
  const bundledPage = allStatic.slice(start, start + pageSize);
  if (bundledPage.length === pageSize || !studioConnected) return bundledPage;

  try {
    const { data: remoteCategory, error: categoryError } =
      await supabase.from("categories").select("id")
        .eq("slug", categorySlug).eq("hidden", false).maybeSingle();
    if (categoryError || !remoteCategory) return bundledPage;

    let remoteSubId: string | undefined;
    if (subSlug) {
      const { data: remoteSub, error: subError } =
        await supabase.from("subcategories").select("id")
          .eq("category_id", remoteCategory.id).eq("slug", subSlug)
          .eq("hidden", false).maybeSingle();
      if (subError || !remoteSub) return bundledPage;
      remoteSubId = remoteSub.id;
    }

    const offset = Math.max(0, start - allStatic.length);
    const extraSlots = pageSize - bundledPage.length;
    let q = supabase.from("images").select(fields)
      .eq("hidden", false).eq("category_id", remoteCategory.id)
      .not("image_url", "like", "%/portfolio/%")
      .order("display_order").order("created_at", { ascending: false })
      .order("id").range(offset, offset + extraSlots - 1);
    if (remoteSubId) q = q.eq("subcategory_id", remoteSubId);
    const { data, error } = await q;
    // Database read errors do not erase existing publicly bundled assets.
    return error ? bundledPage : [...bundledPage, ...(data ?? [])];
  } catch {
    return bundledPage;
  }
}

export async function hybridPublicCounts() {
  const base = {
    byCategory: { ...publishedCounts.byCategory } as Record<string, number>,
    bySubcategory: { ...publishedCounts.bySubcategory } as Record<string, number>,
    featuredByCategory: {} as Record<string, number>,
  };
  if (!studioConnected) return base;
  try {
    const [categories, subs, images] = await Promise.all([
      supabase.from("categories").select("id,slug"),
      supabase.from("subcategories").select("id,slug,category_id"),
      supabase.from("images").select("category_id,subcategory_id,featured,image_url").limit(1000),
    ]);
    if (categories.error || subs.error || images.error) return base;
    const catSlugs = new Map((categories.data ?? []).map((x) => [x.id, x.slug]));
    const subSlugs = new Map((subs.data ?? []).map((x) => [x.id, x]));
    for (const image of images.data ?? []) {
      if (image.image_url?.includes("/portfolio/")) continue; // already in manifest
      if (!image.category_id) continue;
      const slug = catSlugs.get(image.category_id);
      const cId = slug && publishedCategory(slug) ? `published:${slug}` : image.category_id;
      base.byCategory[cId] = (base.byCategory[cId] ?? 0) + 1;
      if (image.featured) base.featuredByCategory[cId] = (base.featuredByCategory[cId] ?? 0) + 1;
      if (image.subcategory_id) {
        const sub = subSlugs.get(image.subcategory_id);
        const sId = sub && slug && publishedCategory(slug)
          ? `published:${slug}:${sub.slug}` : image.subcategory_id;
        base.bySubcategory[sId] = (base.bySubcategory[sId] ?? 0) + 1;
      }
    }
  } catch {
    // Published static counts remain accurate for existing Cloudflare assets.
  }
  return base;
}
