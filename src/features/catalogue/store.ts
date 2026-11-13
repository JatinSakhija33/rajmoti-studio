import seed from "./seed.json";
import { useSyncExternalStore } from "react";
export type Product = (typeof seed.products)[number];
export type Variant = Product["variants"][number];
export type QuoteLine = {
  productId: string;
  variantId: string;
  quantity: number;
  personalisation: string;
  packaging: string;
  orderType: string;
};
export type SavedStyle = { id: string; title: string; image: string };
export const categories = seed.categories;
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
export function useProducts() {
  return useLocal<Product[]>(keys.catalogue, seed.products);
}
export function getProducts() {
  return read<Product[]>(keys.catalogue, seed.products);
}
export const seedProducts = seed.products;
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
      "Not confirmed",
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
