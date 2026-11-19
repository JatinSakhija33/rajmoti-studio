import { calculateVariantPriceInr } from "@/lib/pricing";
import type { Product, Variant } from "./store";

// Preserve explicit main prices. Only apply the existing feature-branch rules to supported families.
// In particular MAG-* in main means magnets, not magazines; never guess a magazine price for them.
export function giftPrice(product: Product, variant: Variant): number | null {
  if (variant.price != null && Number.isFinite(Number(variant.price))) return Number(variant.price);
  if (!["frames", "acrylic", "led", "drinkware", "canvas", "gods-collection", "magazines"].includes(product.category)) return null;
  return calculateVariantPriceInr(product.id, variant.size, variant.finish);
}
export function minimumGiftPrice(product: Product): number | null {
  const values = product.variants.flatMap(v => { const price = giftPrice(product, v); return price == null ? [] : [price]; });
  return values.length ? Math.min(...values) : null;
}
