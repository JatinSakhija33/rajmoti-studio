import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { Sparkles, MessageCircle, ArrowRight, ShieldCheck, Clock, Image as ImageIcon } from "lucide-react";
import { SITE, whatsappLink } from "@/lib/site";

export const Route = createFileRoute("/services/photo-restoration")({
  head: () => ({
    meta: [
      { title: "Archival Photo Restoration & Heritage Digitization — Rajmoti Studio Jetpur" },
      {
        name: "description",
        content:
          "Restore old, torn, faded, and black-and-white family photographs in Jetpur, Gujarat. Archival retouching, damage repair and museum print enlargement.",
      },
      { property: "og:title", content: "Archival Photo Restoration — Rajmoti Studio Jetpur" },
    ],
  }),
  component: RestorationPage,
});

function RestorationPage() {
  const whatsappUrl = whatsappLink(
    `Namaste ${SITE.name}! 📷 I have an old family photograph that needs restoration/repair. Could you please guide me on how to share the photo for an estimate? Thank you!`,
  );

  return (
    <div className="editorial bg-[#FCF9F3] text-stone-900 min-h-dvh">
      <SiteNav />
      <main>
        {/* Restoration Hero */}
        <section className="gift-intro ed-wrap pt-10">
          <div>
            <p className="ed-kicker">Rajmoti Heritage Studio · Jetpur (Est. 1982)</p>
            <h1>
              Preserve your family's
              <br />
              <em>greatest legacy.</em>
            </h1>
            <p className="ed-copy">
              Old photographs hold memories that cannot be replaced. We restore faded, cracked, water-damaged, and torn vintage prints using careful archival retouching and photographic reconstruction.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ed-button flex items-center gap-2 bg-[#25D366] text-white border-[#25D366] hover:bg-[#20b858]"
              >
                <MessageCircle size={17} /> Send Photo on WhatsApp for Quote
              </a>
            </div>
            <div className="ed-inline-facts mt-6">
              <span>Originals safely preserved</span>
              <span>High-resolution museum scan</span>
              <span>Delivered across Saurashtra</span>
            </div>
          </div>
          <figure className="gift-intro-image">
            <img
              src="/products/frame-sample-family.jpg"
              width="1536"
              height="1024"
              alt="Archival photo restoration before and after"
              className="object-cover rounded-2xl shadow-xl"
            />
            <figcaption>
              Multigenerational Saurashtra family heirloom photograph restored and framed at Rajmoti Studio
            </figcaption>
          </figure>
        </section>

        {/* What We Restore */}
        <section className="ed-wrap my-12">
          <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-10 shadow-sm">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 mb-6">
              Our Archival Restoration Capabilities
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-2xl bg-[#FAF7F1] border border-stone-200">
                <div className="size-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center mb-3">
                  <Sparkles size={20} />
                </div>
                <h3 className="font-display font-bold text-lg text-stone-900">
                  Tears, Cracks & Creases
                </h3>
                <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                  Careful pixel-level reconstruction of torn edges, folded lines, and surface cracking without altering the person's true facial anatomy.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#FAF7F1] border border-stone-200">
                <div className="size-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center mb-3">
                  <ImageIcon size={20} />
                </div>
                <h3 className="font-display font-bold text-lg text-stone-900">
                  Heritage Colorization
                </h3>
                <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                  Authentic skin-tone and traditional Gujarati garment colorization (Bandhani, Turbans, Kedia, Sarees) based on historical accuracy.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#FAF7F1] border border-stone-200">
                <div className="size-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center mb-3">
                  <ShieldCheck size={20} />
                </div>
                <h3 className="font-display font-bold text-lg text-stone-900">
                  Museum Archival Prints
                </h3>
                <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                  Printed on heavyweight acid-free fine-art rag papers with 100+ year pigment inks, mounted into genuine teak-finish frames.
                </p>
              </div>
            </div>

            {/* How to Order */}
            <div className="mt-8 pt-6 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block">
                  Simple 3-Step Process
                </span>
                <p className="text-xs text-stone-600 mt-0.5">
                  1. WhatsApp a photo of your print · 2. Receive a free estimate · 3. Approve your digital preview
                </p>
              </div>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ed-button inline-flex items-center gap-2"
              >
                Enquire Now <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
