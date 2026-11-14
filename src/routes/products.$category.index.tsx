import { createFileRoute } from "@tanstack/react-router";
import { Catalogue } from "@/features/catalogue/catalogue";
import { DevotionalLanding } from "@/features/catalogue/DevotionalLanding";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/products/$category/")({
  head: ({ params }) => {
    const cat = params.category.toLowerCase();
    const metaMap: Record<string, { title: string; desc: string }> = {
      devotional: {
        title: "Sacred Gujarati Mandir Murtis & Swaroops — Rajmoti Studio Jetpur",
        desc: "Consecrated Gujarati deity artwork in Cast Acrylic, Teak Frames and Backlit LED Translights. Reverently handcrafted in Jetpur.",
      },
      frames: {
        title: "Handcrafted Photo Frames & Heritage Collages — Rajmoti Studio Jetpur",
        desc: "Single, triptych, and multi-photo wall frames crafted with Saurashtra teak wood finish and charcoal matte borders. 8×12 to 20×30 in.",
      },
      mugs: {
        title: "3D Ceramic & Thermochromic Magic Photo Mugs — Rajmoti Studio Jetpur",
        desc: "Gloss white and heat-sensitive magic reveal ceramic photo mugs handcrafted in Jetpur. Ready within 2 to 4 hours.",
      },
      gifts: {
        title: "Personalized Photo Keepsakes & Gifts — Rajmoti Studio Jetpur",
        desc: "Cherished anniversary, birthday, couple and family photo gifts crafted with authentic materials at Rajmoti Studio.",
      },
      magazines: {
        title: "Couple Story Magazines & Editorial Photobooks — Rajmoti Studio Jetpur",
        desc: "8–20 curated photographs printed on heavy editorial matte paper with vows, dedication dates, and scannable music QR.",
      },
      acrylic: {
        title: "Diamond-Polished Floating Acrylic Photo Blocks — Rajmoti Studio Jetpur",
        desc: "Crystal-clear optical depth and diamond-polished edges with floating wall standoff studs. High-impact modern photographic displays.",
      },
      canvas: {
        title: "Fine Art Stretched Canvas Photo Wraps — Rajmoti Studio Jetpur",
        desc: "Museum-grade cotton canvas stretched over seasoned pine stretcher bars. Archival pigment printing that resists fading for decades.",
      },
      translight: {
        title: "Backlit Illuminated LED Translights — Rajmoti Studio Jetpur",
        desc: "Evenly diffused optical illumination that brings photographs and sacred murtis to life with warm internal LED glow.",
      },
      keychains: {
        title: "Double-Sided Customized Photo Keychains — Rajmoti Studio Jetpur",
        desc: "Carry your favorite people everywhere. High-gloss acrylic and wood photo keychains crafted with precision.",
      },
      "phone-covers": {
        title: "Impact-Resistant Custom Photo Mobile Phone Cases — Rajmoti Studio Jetpur",
        desc: "Dual-layer shock-absorbing phone covers with edge-to-edge photo printing for popular iPhone, Samsung, and OnePlus models.",
      },
      albums: {
        title: "Handcrafted Flush Mount Wedding & Family Photo Albums — Rajmoti Studio Jetpur",
        desc: "Heavyweight lay-flat panoramic spreads and luxury cover options for wedding and milestone photography in Saurashtra.",
      },
      printing: {
        title: "Archival Fine Art Photo Printing & Enlargements — Rajmoti Studio Jetpur",
        desc: "Professional photographic paper printing from 4×6 pocket prints to 20×30 wall enlargements with color-calibrated studio proofing.",
      },
    };

    const info = metaMap[cat] || {
      title: `${params.category.toUpperCase()} — Rajmoti Studio Jetpur`,
      desc: `Explore handcrafted ${params.category} made with care at Rajmoti Studio in Jetpur, Gujarat.`,
    };

    return {
      meta: [
        { title: info.title },
        { name: "description", content: info.desc },
        { property: "og:title", content: info.title },
        { property: "og:description", content: info.desc },
      ],
    };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { category } = Route.useParams();
  const cat = category.toLowerCase();

  // Sacred Devotional Sanctum Journey
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

  // Map semantic category route to catalogue store category
  const categoryMap: Record<string, string> = {
    frames: "frames",
    mugs: "drinkware",
    drinkware: "drinkware",
    gifts: "",
    magazines: "magazines",
    acrylic: "acrylic",
    canvas: "canvas",
    translight: "led",
    led: "led",
    keychains: "keychains",
    "phone-covers": "keychains",
    albums: "albums",
    printing: "prints",
    prints: "prints",
  };

  return <Catalogue initialCategory={categoryMap[cat] ?? cat} />;
}
