import { createFileRoute } from "@tanstack/react-router";
import { Catalogue } from "@/features/catalogue/catalogue";
import { canonicalFor } from "@/lib/seo";
export const Route = createFileRoute("/gifts")({
  validateSearch: (s: Record<string, unknown>) => ({
    product: typeof s.product === "string" ? s.product : undefined,
    variant: typeof s.variant === "string" ? s.variant : undefined,
  }),
  head: () => ({
    meta: [{ title: "Photo gifts & product directory — Rajmoti Studio" }, canonicalFor("/gifts").ogUrl],
    links: canonicalFor("/gifts").links,
  }),
  component: Page,
});
function Page() {
  const { product, variant } = Route.useSearch();
  return <Catalogue productId={product} preferredVariantId={variant} />;
}
