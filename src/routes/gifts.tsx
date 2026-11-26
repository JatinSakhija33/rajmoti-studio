import { createFileRoute } from "@tanstack/react-router";
import { Catalogue } from "@/features/catalogue/catalogue";
import searchPages from "@/lib/search-pages.json";
import { searchPageHead } from "@/lib/seo";
export const Route = createFileRoute("/gifts")({
  validateSearch: (s: Record<string, unknown>) => ({
    product: typeof s.product === "string" ? s.product : undefined,
    variant: typeof s.variant === "string" ? s.variant : undefined,
  }),
  head: () => searchPageHead(searchPages.pages.find((page) => page.path === "/gifts")!),
  component: Page,
});
function Page() {
  const { product, variant } = Route.useSearch();
  return <Catalogue productId={product} preferredVariantId={variant} />;
}
