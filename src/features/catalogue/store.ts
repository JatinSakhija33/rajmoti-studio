import seed from "./seed.json";
import extras from "./gift-extras.json";
import { useCataloguePrices } from "./catalogue-prices";
import { useSharedCatalogue } from "./shared-catalogue";
import type { GiftDesign } from "./gift-design";
import { useSyncExternalStore } from "react";
type SeedProduct = (typeof seed.products)[number];
export type Product = Omit<SeedProduct, "variants"> & { variants: (Omit<SeedProduct["variants"][number], "price"> & { price: number | null })[] };
export type Variant = Product["variants"][number];
export type QuoteLine = {
  productId: string;
  variantId: string;
  quantity: number;
  personalisation: string;
  packaging: string;
  orderType: string;
  design?: GiftDesign;
  quoteOnly?: boolean;
};
export type SavedStyle = { id: string; title: string; image: string };
export const categories = [...seed.categories, ...extras.categories];
export const keys = {
  catalogue: "rajmoti:editorial:catalogue:v2",
  quote: "rajmoti:editorial:quote:v2",
  styles: "rajmoti:editorial:styles:v2",
};
export function read<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}
export function write(key: string, data: unknown) {
  localStorage.setItem(key, JSON.stringify(data));
  window.dispatchEvent(new Event("rajmoti-demo-change"));
}
const subscribe = (listener: () => void) => {
  window.addEventListener("rajmoti-demo-change", listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener("rajmoti-demo-change", listener);
    window.removeEventListener("storage", listener);
  };
};
export function useLocal<T>(key: string, fallback: T): [T, (data: T) => void] {
  const raw = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(key),
    () => null,
  );
  let value = fallback;
  try {
    value = raw ? JSON.parse(raw) : fallback;
  } catch {}
  return [value, (v: T) => write(key, v)];
}
export const seedProducts: Product[] = [...seed.products, ...extras.products];

export function useProducts(): [Product[], (products: Product[]) => void] {
  const [local, setLocal] = useLocal<Product[]>(keys.catalogue, seedProducts);
  const { data } = useCataloguePrices();
  const publishedProducts = useSharedCatalogue();
  const products = new Map(seedProducts.map((product) => [product.id, product]));
  local.forEach((product) => products.set(product.id, product));
  // Server-published changes override browser-local drafts across devices.
  publishedProducts.forEach((product) => products.set(product.id, product));
  const prices = data?.prices;
  return [[...products.values()].map((product) => prices ? {
    ...product,
    variants: product.variants.map((variant) => {
      if (!Object.hasOwn(prices, variant.id)) return variant;
      const paise = prices[variant.id];
      return { ...variant, price: paise === null ? null : paise / 100 };
    }),
  } : product), setLocal];
}
export function useQuote() {
  return useLocal<QuoteLine[]>(keys.quote, []);
}
export function useStyles() {
  return useLocal<SavedStyle[]>(keys.styles, []);
}
export function exportCatalogue(products: Product[]) {
  const fields = [
    "Product ID",
    "Category",
    "Product",
    "Type",
    "Material",
    "Shape",
    "Variant ID",
    "Size",
    "Metric",
    "Thickness",
    "Finish",
    "Photo capacity",
    "Printing",
    "Orientation",
    "Personalisation",
    "Order types",
    "Packaging",
    "Availability",
    "Price",
    "Preparation",
    "Collection / delivery",
    "Record status",
  ];
  const values = products.flatMap((p) =>
    p.variants.map((v) => [
      p.id,
      categories.find((c) => c.id === p.category)?.name,
      p.name,
      p.type,
      p.material,
      p.shape,
      v.id,
      v.size,
      v.metric,
      v.thickness,
      v.finish,
      p.photoCapacity,
      p.printing,
      p.orientation.join(" / "),
      p.personalisation.join(" / "),
      p.orderTypes.join(" / "),
      p.packaging.join(" / "),
      p.availability,
      v.price ?? "On request",
      p.production,
      p.delivery.join(" / "),
      "DEMONSTRATION — proposed specifications",
    ]),
  );
  const csv =
    "\uFEFF" +
    [fields, ...values]
      .map((row) => row.map((v) => '"' + String(v ?? "").replaceAll('"', '""') + '"').join(","))
      .join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "Rajmoti_Demonstration_Product_Catalogue.csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
