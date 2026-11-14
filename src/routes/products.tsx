import { createFileRoute } from "@tanstack/react-router";
import { Catalogue } from "@/features/catalogue/catalogue";

export const Route = createFileRoute("/products")({
  validateSearch: (s: Record<string, unknown>) => ({
    product: typeof s.product === "string" ? s.product : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Products & Personalized Photo Keepsakes — Rajmoti Studio Jetpur" },
      {
        name: "description",
        content:
          "Handcrafted photo frames, 3D photo mugs, illuminated LED translights, and devotional murtis made with care in Jetpur.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  const { product } = Route.useSearch();
  return <Catalogue productId={product} />;
}
