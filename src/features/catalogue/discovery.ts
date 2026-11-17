import type { Product, QuoteLine } from "./store";

export const collections = [
  {
    id: "frames",
    name: "Photo frames",
    detail: "A place for your favourite faces",
    families: ["frames", "canvas"],
  },
  { id: "prints", name: "Photo prints", detail: "Little moments, in print", families: ["prints"] },
  {
    id: "albums",
    name: "Albums & books",
    detail: "Your story, page by page",
    families: ["albums"],
  },
  {
    id: "collages",
    name: "Photo collages",
    detail: "More memories in one frame",
    families: ["collage"],
  },
  {
    id: "acrylic",
    name: "Acrylic keepsakes",
    detail: "A different way to display",
    families: ["acrylic"],
  },
  {
    id: "gifts",
    name: "Personalized gifts",
    detail: "Everyday things. Personal meaning.",
    families: [
      "led",
      "drinkware",
      "textiles",
      "keychains",
      "magnets",
      "crystal",
      "wooden",
      "games",
      "stationery",
      "tech",
      "wearables",
      "surprise",
      "corporate",
    ],
  },
  {
    id: "devotional",
    name: "Devotional gifts",
    detail: "For the moments of reflection",
    families: ["devotional"],
  },
] as const;

export type BrowseSearch = {
  product?: string;
  collection?: string;
  occasion?: string;
  recipient?: string;
  q?: string;
  saved?: boolean;
};

export function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[×x]/g, "x")
    .replace(/inches|inch/g, "in")
    .replace(/\s+/g, "");
}

export function inCollection(p: Product, collection?: string) {
  if (!collection) return true;
  if (collection === "collages") return /collage/i.test(`${p.name} ${p.type}`);
  if (collection === "devotional")
    return /devotional|religious|spiritual|temple/i.test(`${p.name} ${p.type}`);
  const selected = collections.find((c) => c.id === collection);
  return selected
    ? (selected.families as readonly string[]).includes(p.category)
    : p.category === collection;
}

export function matchesDiscovery(p: Product, search: BrowseSearch) {
  const haystack = [
    p.name,
    p.id,
    p.type,
    p.material,
    p.shape,
    p.category,
    p.description,
    ...p.occasions,
    ...p.recipients,
    ...p.variants.flatMap((v) => [v.id, v.size, v.metric || "", v.finish]),
  ].join(" ");
  // The source catalogue has no gender restrictions; either gift edit shows its existing gift choices.
  const recipient = search.recipient;
  const recipientMatch =
    !recipient ||
    (["For him", "For her"].includes(recipient)
      ? p.occasions.some((o) => ["Birthday", "Anniversary", "Family"].includes(o))
      : p.recipients.includes(recipient));
  return (
    inCollection(p, search.collection) &&
    (!search.q || normalize(haystack).includes(normalize(search.q))) &&
    (!search.occasion || p.occasions.includes(search.occasion)) &&
    recipientMatch
  );
}

export function sameQuoteLine(a: QuoteLine, b: QuoteLine) {
  return (
    a.productId === b.productId &&
    a.variantId === b.variantId &&
    a.personalisation === b.personalisation &&
    a.packaging === b.packaging &&
    a.orderType === b.orderType &&
    JSON.stringify(a.design || null) === JSON.stringify(b.design || null)
  );
}

export function validQuantity(value: number) {
  return Number.isInteger(value) && value >= 1 && value <= 9999;
}

export function validatePreviewFiles(
  files: Pick<File, "type" | "size">[],
  current: Pick<File, "type" | "size">[] = [],
) {
  if (current.length + files.length > 5) return "Choose up to 5 photos in total.";
  if (files.some((f) => !["image/jpeg", "image/png", "image/webp"].includes(f.type)))
    return "Please choose JPG, PNG or WebP photos. Convert HEIC photos to JPG first.";
  if (files.some((f) => f.size <= 0 || f.size > 10 * 1024 * 1024))
    return "Each photo must be between 1 byte and 10 MB.";
  if ([...current, ...files].reduce((n, f) => n + f.size, 0) > 25 * 1024 * 1024)
    return "Keep the combined photo size under 25 MB.";
  return "";
}
