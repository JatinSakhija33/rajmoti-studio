import { createFileRoute } from "@tanstack/react-router";
import { Catalogue } from "@/features/catalogue/catalogue";
export const Route = createFileRoute("/gifts")({
  validateSearch: (s: Record<string, unknown>) => ({
    product: typeof s.product === "string" ? s.product : undefined,
    collection: typeof s.collection === "string" ? s.collection : undefined,
    occasion: typeof s.occasion === "string" ? s.occasion : undefined,
    recipient: typeof s.recipient === "string" ? s.recipient : undefined,
    q: typeof s.q === "string" ? s.q : undefined,
    saved: s.saved === true || s.saved === "true" || undefined,
  }),
  head: () => ({ meta: [{ title: "Photo gifts & product directory — Rajmoti Studio" }] }),
  component: Page,
});
function Page() {
  const search = Route.useSearch();
  return <Catalogue productId={search.product} search={search} />;
}
