import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Catalogue } from "@/features/catalogue/catalogue";
import { DevotionalLanding } from "@/features/catalogue/DevotionalLanding";
import { ProductDetailPage } from "@/features/catalogue/ProductDetailPage";
import { FrameCollageCanvas } from "@/features/catalogue/live-preview/FrameCollageCanvas";
import { ThreePhotoMug } from "@/features/catalogue/live-preview/ThreePhotoMug";
import { CoupleMagazineFlipbook } from "@/features/catalogue/live-preview/CoupleMagazineFlipbook";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/products/$category/$slug")({
  head: ({ params }) => {
    const slugPretty = params.slug.replace(/-/g, " ");
    const catPretty = params.category.replace(/-/g, " ");
    const title = `${slugPretty.charAt(0).toUpperCase() + slugPretty.slice(1)} — Rajmoti Studio Jetpur`;
    return {
      meta: [
        { title },
        {
          name: "description",
          content: `Handcrafted ${slugPretty} (${catPretty}) made with authentic materials at Rajmoti Studio in Jetpur, Gujarat.`,
        },
        { property: "og:title", content: title },
      ],
    };
  },
  component: SlugPage,
});

function SlugPage() {
  const { category, slug } = Route.useParams();
  const cat = category.toLowerCase();
  const s = slug.toLowerCase();
  const [activeStudio, setActiveStudio] = useState<string | null>(null);

  // 1. Devotional Deity Deep-Links (e.g. /products/devotional/dwarkadhish, /products/devotional/jalaram-bapa)
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

  // 2. Gifts by Occasion (e.g. /products/gifts/anniversary, /products/gifts/birthday, /products/gifts/couples, /products/gifts/family, /products/gifts/baby)
  if (cat === "gifts") {
    const occasionMap: Record<string, string> = {
      anniversary: "anniversary",
      birthday: "birthday",
      couples: "anniversary",
      family: "family",
      baby: "baby",
    };
    return <Catalogue initialOccasion={occasionMap[s] || s} />;
  }

  // 3. Dedicated Mug Product Detail Page
  if (cat === "mugs" || s.includes("mug")) {
    return (
      <>
        <ProductDetailPage
          productId="MUG-002"
          name="Thermochromic Magic Photo Mug"
          category="mugs"
          categoryLabel="Photo Drinkware"
          basePrice={349}
          description="A pure black ceramic mug at room temperature that magically reveals your photograph and caption when hot chai, coffee, or milk is poured."
          longDescription="Crafted from heavyweight grade-A gloss ceramic with an archival thermochromic crystalline coating. High-temperature sublimation ensures vibrant photographic clarity that will not peel, flake, or fade over time. Microwave-safe and crafted locally in our Jetpur studio."
          images={{
            primary: "/products/mug-sample-couple.jpg",
            angle: "/products/mug-sample-couple.jpg",
            room: "/products/frame-sample-wedding.jpg",
            detail: "/products/mug-sample-couple.jpg",
          }}
          sizes={[
            { id: "325ml", label: "325 ml (Standard)", metric: "11 oz", widthInches: 3.2, heightInches: 3.8, popular: true },
            { id: "450ml", label: "450 ml (Grande)", metric: "15 oz", widthInches: 3.4, heightInches: 4.5 },
          ]}
          finishes={[
            { id: "magic", label: "Thermochromic Magic Reveal", desc: "Solid black when cold; reveals photograph when hot liquid is poured" },
            { id: "white", label: "Classic Gloss White", desc: "Always-visible vibrant studio photograph with glossy ceramic glaze" },
            { id: "black", label: "Midnight Matte Black", desc: "Permanent matte finish with crisp framed photo window" },
          ]}
          specifications={{
            material: "Grade-A Ceramic with Heat-Activated Coating",
            printType: "High-Temperature Dye Sublimation",
            turnaround: "2–4 hours for Jetpur collection",
            origin: "Handcrafted in Jetpur, Gujarat",
          }}
          complementaryProducts={[
            { id: "FRM-001", name: "Royal Heritage Wedding Frame", price: 1499, image: "/products/frame-sample-wedding.jpg", link: "/products/frames/royal-heritage" },
            { id: "MAG-001", name: "Couple Story Keepsake Magazine", price: 1299, image: "/products/magazine-cover.jpg", link: "/products/magazines/couple-story" },
          ]}
          onOpenStudio={() => setActiveStudio("mugs")}
        />

        {/* Live 3D Mug Studio Dialog */}
        <Dialog open={activeStudio === "mugs"} onOpenChange={(open) => !open && setActiveStudio(null)}>
          <DialogContent className="max-w-3xl bg-[#FCFAF6] border-stone-300 p-6 rounded-3xl">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl font-bold text-stone-900">
                3D Rotating Photo Mug Studio
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-600">
                Rotate 360° horizontally, toggle between Cold & Hot thermal states, and fit your photo.
              </DialogDescription>
            </DialogHeader>
            <ThreePhotoMug />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // 4. Dedicated Magazine / Photobook Product Detail Page
  if (cat === "magazines" || cat === "albums" || s.includes("magazine") || s.includes("story")) {
    return (
      <>
        <ProductDetailPage
          productId="MAG-001"
          name="Couple Story Keepsake Magazine"
          category="magazines"
          categoryLabel="Albums & Magazines"
          basePrice={1299}
          description="A romantic editorial magazine featuring 8 to 20 curated photographs with custom chapter spreads, vows, meaningful dates, and a scannable song QR."
          longDescription="Printed on heavy 250 GSM velvet-matte imported art paper that feels like a luxury coffee-table publication. Saddle-stitched or hardbound with scuff-resistant soft-touch lamination on the cover. Each spread is typeset with your personal vows and milestones."
          images={{
            primary: "/products/magazine-cover.jpg",
            angle: "/products/magazine-cover.jpg",
            room: "/products/frame-sample-family.jpg",
            detail: "/products/frame-sample-wedding.jpg",
          }}
          sizes={[
            { id: "8x8", label: "8×8 in (Square)", metric: "20×20 cm", widthInches: 8, heightInches: 8, popular: true },
            { id: "8.5x11", label: "8.5×11 in (Editorial)", metric: "21×28 cm", widthInches: 8.5, heightInches: 11 },
            { id: "10x10", label: "10×10 in (Hardcover)", metric: "25×25 cm", widthInches: 10, heightInches: 10 },
          ]}
          finishes={[
            { id: "matte", label: "Velvet Soft-Touch Matte", desc: "Non-glare luxury tactile coating that resists fingerprints" },
            { id: "hardcover", label: "Bound Hardcover Keepsake", desc: "Rigid protective casing with embossed spine detailing" },
          ]}
          specifications={{
            material: "250 GSM Archival Velvet Matte Paper",
            printType: "Indigo Digital 6-Color Photographic Print",
            turnaround: "2–3 days handcrafted production",
            origin: "Handcrafted in Jetpur, Gujarat",
          }}
          complementaryProducts={[
            { id: "FRM-001", name: "Royal Heritage Teak Frame", price: 1499, image: "/products/frame-sample-wedding.jpg", link: "/products/frames/royal-heritage" },
            { id: "MUG-001", name: "Magic Reveal Couple Mug", price: 349, image: "/products/mug-sample-couple.jpg", link: "/products/mugs/magic-photo-mug" },
          ]}
          onOpenStudio={() => setActiveStudio("magazines")}
        />

        {/* Live Magazine Flipbook Dialog */}
        <Dialog open={activeStudio === "magazines"} onOpenChange={(open) => !open && setActiveStudio(null)}>
          <DialogContent className="max-w-4xl bg-[#FCFAF6] border-stone-300 p-6 rounded-3xl">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl font-bold text-stone-900">
                Interactive Couple Magazine Flipbook
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-600">
                Flip through sample pages, customize the couple song QR, and arrange your milestone photos.
              </DialogDescription>
            </DialogHeader>
            <CoupleMagazineFlipbook />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // 5. Dedicated Frame / Wall Art Product Detail Page (Default for frames, canvas, acrylic, etc.)
  return (
    <>
      <ProductDetailPage
        productId="FRM-001"
        name={s.includes("anniversary") ? "Anniversary Story Heritage Collage" : "Royal Heritage Teak Wood Frame"}
        category="frames"
        categoryLabel="Photo Frames & Collages"
        basePrice={1499}
        description="Crafted with genuine seasoned wood moulding, anti-reflective optical acrylic, and archival acid-free matting. Designed to outlast time."
        longDescription="Each frame is hand-mitred, assembled, and inspected in our Jetpur workshop. We use premium moisture-resistant backboards, heavy-duty D-ring hangers, and archival pigment inks that preserve skin tones and shadow details without yellowing."
        images={{
          primary: "/products/frame-sample-wedding.jpg",
          angle: "/products/frame-sample-wedding.jpg",
          room: "/products/frame-sample-family.jpg",
          detail: "/products/frame-sample-baby.jpg",
        }}
        sizes={[
          { id: "8x12", label: "8×12 in", metric: "20×30 cm", widthInches: 8, heightInches: 12 },
          { id: "10x10", label: "10×10 in", metric: "25×25 cm", widthInches: 10, heightInches: 10 },
          { id: "10x14", label: "10×14 in", metric: "25×35 cm", widthInches: 10, heightInches: 14 },
          { id: "12x18", label: "12×18 in", metric: "30×45 cm", widthInches: 12, heightInches: 18, popular: true },
          { id: "14x20", label: "14×20 in", metric: "35×50 cm", widthInches: 14, heightInches: 20 },
          { id: "16x24", label: "16×24 in", metric: "40×60 cm", widthInches: 16, heightInches: 24 },
          { id: "18x24", label: "18×24 in", metric: "45×60 cm", widthInches: 18, heightInches: 24 },
          { id: "20x30", label: "20×30 in", metric: "50×75 cm", widthInches: 20, heightInches: 30, popular: true },
        ]}
        finishes={[
          { id: "teak", label: "Natural Teak Finish Wood", desc: "Warm, rich timber tone with organic grain texture" },
          { id: "charcoal", label: "Matte Charcoal Black", desc: "Understated contemporary border for modern interiors" },
          { id: "gold", label: "Classic Gold Bevel Finish", desc: "Ceremonial gold bevel for wedding and anniversary portraits" },
          { id: "acrylic", label: "Floating Acrylic Standoff", desc: "Frameless optical acrylic with polished bevel edges and steel studs" },
        ]}
        specifications={{
          material: "Hand-Finished Seasoned Wood Moulding & Acrylic",
          printType: "Archival 12-Color UltraChrome Pigment",
          turnaround: "Same-Day in Jetpur for standard sizes (2–4 hrs)",
          origin: "Handcrafted in Jetpur, Gujarat",
        }}
        complementaryProducts={[
          { id: "MUG-001", name: "Magic Reveal Ceramic Mug", price: 349, image: "/products/mug-sample-couple.jpg", link: "/products/mugs/magic-photo-mug" },
          { id: "MAG-001", name: "Couple Story Keepsake Magazine", price: 1299, image: "/products/magazine-cover.jpg", link: "/products/magazines/couple-story" },
        ]}
        onOpenStudio={() => setActiveStudio("frames")}
      />

      {/* Live Frame Studio Dialog */}
      <Dialog open={activeStudio === "frames"} onOpenChange={(open) => !open && setActiveStudio(null)}>
        <DialogContent className="max-w-4xl bg-[#FCFAF6] border-stone-300 p-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-bold text-stone-900">
              Live Frame & Collage Studio
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-600">
              Switch between single, triptych, and 5-photo collage layouts. Reposition, zoom, and test room scale.
            </DialogDescription>
          </DialogHeader>
          <FrameCollageCanvas />
        </DialogContent>
      </Dialog>
    </>
  );
}
