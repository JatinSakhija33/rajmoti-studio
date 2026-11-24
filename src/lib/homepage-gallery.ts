/** Eight real, published studio photographs chosen for the homepage hero. */
export const homeHeroSlides = [
  {
    id: "dac390d7fe8c318b8b42", slug: "baby", category: "Baby photography",
    eyebrow: "Little beginnings", headline: "A little magic in every frame.",
    alt: "Smiling child in a burgundy dress with a star wand on a dark studio set.",
    src: "/portfolio/baby/dac390d7fe8c318b8b42-large-dac390d7fe8c.webp",
    medium: "/portfolio/baby/dac390d7fe8c318b8b42-medium-1318af2147a1.webp",
    portrait: false,
  },
  {
    id: "9ea4868277a6b703a682", slug: "maternity", category: "Maternity photography",
    eyebrow: "Before we meet", headline: "A beautiful chapter begins.",
    alt: "Expecting parent posed for an elegant indoor maternity portrait.",
    src: "/portfolio/maternity/9ea4868277a6b703a682-large-5f2f001efd44.webp",
    medium: "/portfolio/maternity/9ea4868277a6b703a682-medium-7b857711de2b.webp",
    portrait: true,
  },
  {
    id: "8078c206caa42114f4da", slug: "family", category: "Family photography",
    eyebrow: "Together, always", headline: "Everyone you hold close.",
    alt: "Family members holding their young child together.",
    src: "/portfolio/family/8078c206caa42114f4da-large-03fae45dbaa3.webp",
    medium: "/portfolio/family/8078c206caa42114f4da-medium-468c12018025.webp",
    portrait: false,
  },
  {
    id: "9fe70fc2384d5b306ce4", slug: "baby", category: "Newborn photography",
    eyebrow: "The gentlest days", headline: "Tiny details. Forever cherished.",
    alt: "Sleeping baby in a cream outfit on a purple set with teddy bears.",
    src: "/portfolio/baby/9fe70fc2384d5b306ce4-large-9fe70fc2384d.webp",
    medium: "/portfolio/baby/9fe70fc2384d5b306ce4-medium-4ae69613274a.webp",
    portrait: false,
  },
  {
    id: "d3a075faa9a40668261a", slug: "maternity", category: "Maternity photography",
    eyebrow: "An unforgettable season", headline: "The story before hello.",
    alt: "Expecting parent in a vertical studio maternity portrait.",
    src: "/portfolio/maternity/d3a075faa9a40668261a-large-c250eefabb20.webp",
    medium: "/portfolio/maternity/d3a075faa9a40668261a-medium-9b8da7f8a81d.webp",
    portrait: true,
  },
  {
    id: "e7cdfae606f1d6ac329f", slug: "family", category: "Family photography",
    eyebrow: "Generations of love", headline: "A family story that lasts.",
    alt: "Three generations of a family posing together in the studio.",
    src: "/portfolio/family/e7cdfae606f1d6ac329f-large-4e803ce5fbc1.webp",
    medium: "/portfolio/family/e7cdfae606f1d6ac329f-medium-b314d4c57a74.webp",
    portrait: false,
  },
  {
    id: "afa9cf7f87386eeedd29", slug: "maternity", category: "Maternity photography",
    eyebrow: "Quiet anticipation", headline: "Made of love, made to remember.",
    alt: "Expecting couple photographed outdoors for a maternity portrait.",
    src: "/portfolio/maternity/afa9cf7f87386eeedd29-large-d6e034a68ab2.webp",
    medium: "/portfolio/maternity/afa9cf7f87386eeedd29-medium-a9e1a51f5056.webp",
    portrait: true,
  },
  {
    id: "f539e908d6b8d45de2e1", slug: "baby", category: "Baby photography",
    eyebrow: "Growing up beautifully", headline: "Little moments. Lasting stories.",
    alt: "Child in a Little Krishna costume with a flute on a floral festive set.",
    src: "/portfolio/baby/f539e908d6b8d45de2e1-large-f539e908d6b8.webp",
    medium: "/portfolio/baby/f539e908d6b8d45de2e1-medium-f1cea78cebbb.webp",
    portrait: false,
  },
] as const;

/** Interleave categories so the scrolling gallery begins with all three disciplines. */
export function interleaveGalleryPhotos<T extends { category_id: string }>(photos: readonly T[]): T[] {
  const baby = photos.filter((photo) => photo.category_id === "published:baby");
  const maternity = photos.filter((photo) => photo.category_id === "published:maternity");
  const family = photos.filter((photo) => photo.category_id === "published:family");
  const mixed: T[] = [];
  const max = Math.max(baby.length, maternity.length, family.length);
  for (let index = 0; index < max; index += 1) {
    if (baby[index]) mixed.push(baby[index]);
    if (maternity[index]) mixed.push(maternity[index]);
    if (family[index]) mixed.push(family[index]);
  }
  const seen = new Set(mixed);
  return [...mixed, ...photos.filter((photo) => !seen.has(photo))];
}
