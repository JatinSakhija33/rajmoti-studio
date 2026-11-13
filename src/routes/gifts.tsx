import { createFileRoute } from "@tanstack/react-router";
import { Catalogue } from "@/features/catalogue/catalogue";
export const Route = createFileRoute("/gifts")({
  validateSearch: (s: Record<string, unknown>) => ({
    product: typeof s.product === "string" ? s.product : undefined,
  }),
  head: () => ({ meta: [{ title: "Photo gifts & product directory — Rajmoti Studio" }] }),
  component: Page,
});
function Page() {
  const { product } = Route.useSearch();
  return <Catalogue productId={product} />;
}
