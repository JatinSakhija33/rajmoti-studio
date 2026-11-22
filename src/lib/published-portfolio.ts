// Studio-approved public photographs shipped with the site for offline gallery reads.
import taxonomy from "./published-portfolio-taxonomy.json";

const categoryId = (slug: string) => `published:${slug}`;
const subcategoryId = (category: string, slug: string) => `published:${category}:${slug}`;
const publicFields = {
  hidden: false,
  archived_at: null,
  description: null,
  seo_title: null,
  seo_description: null,
};

export const publishedCategories = taxonomy.map((category) => ({
  ...publicFields,
  id: categoryId(category.slug),
  slug: category.slug,
  name: category.name,
  cover_image_url: category.cover,
  subcategories: category.subcategories.map((sub, index) => ({
    ...publicFields,
    id: subcategoryId(category.slug, sub.slug),
    category_id: categoryId(category.slug),
    slug: sub.slug,
    name: sub.name,
    display_order: index,
    cover_image_url: sub.cover,
  })),
}));

export const publishedCounts = {
  byCategory: Object.fromEntries(taxonomy.map((category) => [categoryId(category.slug), category.count])),
  bySubcategory: Object.fromEntries(taxonomy.flatMap((category) => category.subcategories.map((sub) => [
    subcategoryId(category.slug, sub.slug), sub.count,
  ]))),
  featuredByCategory: {} as Record<string, number>,
};

async function readPublishedPhotos() {
  const { default: photos } = await import("./published-portfolio.json");
  return photos.map((photo) => {
    const category = publishedCategories.find((item) => item.slug === photo.category);
    const subcategory = category?.subcategories.find((item) => item.slug === photo.subcategory);
    return {
      id: photo.id,
      short_id: photo.id,
      title: photo.title,
      description: null,
      alt_text: photo.alt,
      theme: photo.tags[0] ?? null,
      image_url: photo.variants.large.url,
      thumbnail_url: photo.variants.thumbnail.url,
      variants: photo.variants,
      width: photo.variants.large.width,
      height: photo.variants.large.height,
      dominant_color: null,
      category_id: categoryId(photo.category),
      subcategory_id: subcategoryId(photo.category, photo.subcategory),
      categories: { name: category?.name, slug: photo.category },
      subcategories: { name: subcategory?.name, slug: photo.subcategory },
    };
  });
}

let photoCatalog: Awaited<ReturnType<typeof readPublishedPhotos>> | undefined;

export async function loadPublishedPhotos() {
  photoCatalog ??= await readPublishedPhotos();
  return photoCatalog;
}
