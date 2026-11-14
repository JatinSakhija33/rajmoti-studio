import { createFileRoute } from "@tanstack/react-router";
import { Catalogue } from "@/features/catalogue/catalogue";
import { DevotionalLanding } from "@/features/catalogue/DevotionalLanding";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/products/$category/")({
  head: ({ params }) => {
    const cat = params.category.toLowerCase();
    const titles: Record<string, string> = {
      devotional: "Sacred Gujarati Mandir Murtis & Swaroops — Rajmoti Studio Jetpur",
      frames: "Handcrafted Photo Frames & Heritage Collages — Rajmoti Studio Jetpur",
      mugs: "3D Ceramic & Magic Reveal Photo Mugs — Rajmoti Studio Jetpur",
      gifts: "Personalized Photo Keepsakes & Gifts — Rajmoti Studio Jetpur",
      magazines: "Couple Story Magazines & Editorial Photobooks — Rajmoti Studio Jetpur",
      "phone-covers": "Impact-Resistant Custom Photo Mobile Covers — Rajmoti Studio Jetpur",
    };
    const title = titles[cat] || `${params.category.toUpperCase()} — Rajmoti Studio Jetpur`;
    return {
      meta: [
        { title },
        { name: "description", content: `Explore handcrafted ${params.category} made with care at Rajmoti Studio in Jetpur, Gujarat.` },
        { property: "og:title", content: title },
      ],
    };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { category } = Route.useParams();
  const cat = category.toLowerCase();

  if (cat === "devotional") {
    return (
      <div className="editorial">
        <SiteNav />
        <main>
          <DevotionalLanding />
        </main>
        <SiteFooter />
      </div>
    );
  }

  const categoryMap: Record<string, string> = {
    frames: "frames",
    mugs: "drinkware",
    drinkware: "drinkware",
    gifts: "",
    magazines: "magazines",
    "phone-covers": "keychains",
    accessories: "keychains",
  };

  return <Catalogue initialCategory={categoryMap[cat] ?? cat} />;
}
