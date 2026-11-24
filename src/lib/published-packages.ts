// Public package names, prices and inclusions verified at
// https://rajmotistudio.lovable.app/packages on 2026-11-24.
export type PublicPackage = {
  slug: string;
  name: string;
  description: string | null;
  price: number | null;
  currency: string;
  duration: string | null;
  categories: { name: string; slug: string } | null;
  package_features: { feature: string; display_order: number }[];
};

const baby = { name: "Baby Photography", slug: "baby" };
export const publishedPackages = [
  {
    slug: "baby-photoshoot-msw6oc0y",
    name: "Baby Photoshoot",
    description: "A baby session with an edited reel, one edited photograph and all the photos taken.",
    price: 3500, currency: "INR", duration: "60 mins",
    categories: baby, package_features: [],
  },
  {
    slug: "baby-essence",
    name: "New Born",
    description: "A studio session with one theme and five hand-edited photographs delivered digitally.",
    price: 2500, currency: "INR", duration: "Up to 90 mins",
    categories: baby, package_features: [],
  },
  {
    slug: "baby-heritage",
    name: "Fully 1 Year Package",
    description: "A year of portraits to remember how much they’ve grown.",
    price: 12500, currency: "INR", duration: "60 mins each",
    categories: baby,
    package_features: [
      { feature: "12 monthly baby photoshoots, each with a different theme", display_order: 0 },
      { feature: "Complimentary family and first birthday shoots", display_order: 1 },
      { feature: "Cinematic birthday reel", display_order: 2 },
    ],
  },
  {
    slug: "maternity-classic",
    name: "Maternity Classic",
    description: "A maternity portrait session with an online gallery.",
    price: 4000, currency: "INR", duration: null,
    categories: { name: "Maternity Photography", slug: "maternity" },
    package_features: [
      { feature: "Indoor or outdoor location", display_order: 0 },
      { feature: "Wardrobe consultation", display_order: 1 },
    ],
  },
  {
    slug: "family-portrait",
    name: "Family Portrait",
    description: "Photograph your family in the studio or at a location you choose.",
    price: 2500, currency: "INR", duration: null,
    categories: { name: "Family Portraits", slug: "family" },
    package_features: [{ feature: "Framed signature print", display_order: 0 }],
  },
  {
    slug: "wedding-legacy",
    name: "Wedding Legacy",
    description: null,
    price: 145000, currency: "INR", duration: null,
    categories: { name: "Wedding Photography", slug: "wedding" },
    package_features: [
      { feature: "Full-day coverage", display_order: 0 },
      { feature: "Two photographers", display_order: 1 },
    ],
  },
  {
    slug: "studio-cinematic-reel",
    name: "Studio Cinematic Reel",
    description: "A directed reel filmed in Rajmoti Studio and edited to music.",
    price: 3500, currency: "INR", duration: "60 mins",
    categories: null, package_features: [],
  },
  {
    slug: "outdoor-cinematic-reel",
    name: "Outdoor Cinematic Reel",
    description: "A cinematic reel filmed on location, with movement and scenery.",
    price: 6500, currency: "INR", duration: "120 mins",
    categories: null, package_features: [],
  },
] satisfies PublicPackage[];
