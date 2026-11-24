import seed from "../../src/features/catalogue/seed.json";
import extras from "../../src/features/catalogue/gift-extras.json";
import supplierProducts from "../../src/features/catalogue/supplier-products.json";

export const catalogueProducts = [...seed.products, ...extras.products, ...supplierProducts];
const products = new Map(catalogueProducts.map((product) => [
  product.id, new Set(product.variants.map(({ id }) => id)),
]));
const variantIds = new Set(catalogueProducts.flatMap((product) => product.variants.map(({ id }) => id)));
const priceIsValid = (value) => value === null ||
  (Number.isSafeInteger(value) && value >= 1 && value <= 100000000);
const priceKey = "catalogue-prices/v1/variant-prices.json";

export function catalogueStore(env) {
  return env.CATALOGUE_STORE || env.STUDIO_PRIVATE_FILES || null;
}

export async function readCataloguePrices(store) {
  const object = store && await store.get(priceKey);
  if (!object) return { revision: null, prices: {} };
  const data = await object.json();
  const prices = Object.fromEntries(Object.entries(data).filter(([id, value]) =>
    variantIds.has(id) && priceIsValid(value)));
  return { revision: object.httpEtag, prices };
}

export function validatePriceChanges(productId, changes) {
  const variants = products.get(productId);
  if (!variants || !changes || typeof changes !== "object" || Array.isArray(changes)) return false;
  const entries = Object.entries(changes);
  return entries.length > 0 && entries.length <= variants.size &&
    entries.every(([id, price]) => variants.has(id) && priceIsValid(price));
}

export async function writeCataloguePrices(store, revision, changes) {
  const current = await readCataloguePrices(store);
  if (revision !== current.revision) return null;
  const prices = { ...current.prices, ...changes };
  const onlyIf = new Headers(revision ? { "If-Match": revision } : { "If-None-Match": "*" });
  const saved = await store.put(priceKey, JSON.stringify(prices), { onlyIf });
  return saved ? { revision: saved.httpEtag, prices } : null;
}
