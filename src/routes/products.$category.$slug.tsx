import { createFileRoute } from "@tanstack/react-router";
import { Catalogue } from "@/features/catalogue/catalogue";
import { DevotionalLanding } from "@/features/catalogue/DevotionalLanding";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/products/$category/$slug")({
  head: ({ params }) => {
    const title = `${params.slug.replace(/-/g, " ").toUpperCase()} · ${params.category.toUpperCase()} — Rajmoti Studio Jetpur`;
    return {
      meta: [
        { title },
        { name: "description", content: `Personalized ${params.slug.replace(/-/g, " ")} handcrafted at Rajmoti Studio Jetpur.` },
      ],
    };
  },
  component: SlugPage,
});

function SlugPage() {
  const { category, slug } = Route.useParams();
  const cat = category.toLowerCase();

  // If devotional deity subpage (e.g. /products/devotional/dwarkadhish, /products/devotional/jalaram-bapa)
  if (cat === "devotional") {
    return (
      <div className="editorial">
        <SiteNav />
        <main>
          <DevotionalLanding selectedDeitySlug={slug} />
        </main>
        <SiteFooter />
      </div>
    );
  }

  // If occasion gifts (e.g. /products/gifts/anniversary, /products/gifts/birthday)
  if (cat === "gifts") {
    return <Catalogue initialOccasion={slug} />;
  }

  // If specific frame or product (e.g. /products/frames/anniversary-story)
  return <Catalogue initialCategory={cat} initialSearch={slug.replace(/-/g, " ")} />;
}
