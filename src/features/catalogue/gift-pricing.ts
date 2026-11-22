import type { Product, Variant } from "./store";

// Public prices come only from explicit catalogue variant prices.
export function giftPrice(_product: Product, variant: Variant): number | null {
  return typeof variant.price === "number" && Number.isFinite(variant.price) && variant.price > 0 ? variant.price : null;
}

export function minimumGiftPrice(product: Product): number | null {
  const prices = product.variants.flatMap(variant => {
    const price = giftPrice(product, variant);
    return price === null ? [] : [price];
  });
  return prices.length ? Math.min(...prices) : null;
}
