// Studio-approved public photographs bundled with the website for offline gallery reads.
import photos from "./published-portfolio.json";

const categoryNames = {
  baby: "Baby & milestones",
  family: "Family",
};
const subcategoryNames = {
  "princess-theme": "Princess Theme",
  "krishna-theme": "Krishna Theme",
  "traditional-theme": "Traditional Theme",
  "boss-baby": "Boss Baby",
  "birthday-portraits": "Birthday Portraits",
  "creative-sets": "Creative Sets",
  "studio-portraits": "Studio Portraits",
  "studio-family-portrait": "Studio Family Portraits",
  "outdoor-family-portraits": "Outdoor Family Portraits",
};

const categoryId = (slug: string) => `published:${slug}`;
const subcategoryId = (category: string, slug: string) => `published:${category}:${slug}`;
const publicFields = {
  hidden: false,
  archived_at: null,
  description: null,
  seo_title: null,
  seo_description: null,
};

function nameFor(names: Record<string, string>, slug: string) {
  return names[slug];
}

export const publishedCategories = Object.entries(categoryNames).map(([slug, name]) => {
  const images = photos.filter((photo) => photo.category === slug);
  return {
    ...publicFields,
    id: categoryId(slug),
    slug,
    name,
    cover_image_url: images[0].variants.medium.url,
    subcategories: [...new Set(images.map((photo) => photo.subcategory))].map((sub, index) => ({
      ...publicFields,
      id: subcategoryId(slug, sub),
      category_id: categoryId(slug),
      slug: sub,
      name: nameFor(subcategoryNames, sub),
      display_order: index,
      cover_image_url: images.find((photo) => photo.subcategory === sub)?.variants.medium.url ?? null,
    })),
  };
});

export const publishedPhotos = photos.map((photo) => ({
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
  categories: { name: nameFor(categoryNames, photo.category), slug: photo.category },
  subcategories: { name: nameFor(subcategoryNames, photo.subcategory), slug: photo.subcategory },
}));

export const publishedCounts = {
  byCategory: Object.fromEntries(publishedCategories.map((category) => [
    category.id, publishedPhotos.filter((photo) => photo.category_id === category.id).length,
  ])),
  bySubcategory: Object.fromEntries(publishedCategories.flatMap((category) => category.subcategories.map((sub) => [
    sub.id, publishedPhotos.filter((photo) => photo.subcategory_id === sub.id).length,
  ]))),
  featuredByCategory: {} as Record<string, number>,
};
