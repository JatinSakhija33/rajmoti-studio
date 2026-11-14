import { createFileRoute } from "@tanstack/react-router";
import { Catalogue } from "@/features/catalogue/catalogue";

export const Route = createFileRoute("/products/")({
  validateSearch: (s: Record<string, unknown>) => ({
    product: typeof s.product === "string" ? s.product : undefined,
    category: typeof s.category === "string" ? s.category : undefined,
    occasion: typeof s.occasion === "string" ? s.occasion : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Products & Personalized Photo Keepsakes — Rajmoti Studio Jetpur" },
      {
        name: "description",
        content:
          "Handcrafted photo frames, 3D ceramic mugs, illuminated LED translights, and sacred devotional murtis made with care in Jetpur, Gujarat.",
      },
      { property: "og:title", content: "Products & Personalized Photo Keepsakes — Rajmoti Studio Jetpur" },
      {
        property: "og:description",
        content:
          "Explore handcrafted frames, 3D mugs, devotional sanctums, and editorial magazines crafted at Rajmoti Studio Jetpur.",
      },
      { property: "og:image", content: "https://rajmotistudio.in/products/frame-sample-wedding.jpg" },
    ],
  }),
  component: Page,
});

function Page() {
  const { product, category, occasion } = Route.useSearch();
  return <Catalogue productId={product} initialCategory={category} initialOccasion={occasion} />;
}
