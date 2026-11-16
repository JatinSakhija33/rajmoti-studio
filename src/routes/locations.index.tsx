import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { MapPin, Clock, ArrowRight, ShieldCheck, Sparkles, Phone, MessageCircle } from "lucide-react";
import { HYPERLOCAL_CITIES } from "@/lib/hyperlocal-seo";
import { SITE, whatsappLink } from "@/lib/site";
import { STUDIO, absUrl, breadcrumbJsonLd, localBusinessJsonLd } from "@/lib/seo";

export const Route = createFileRoute("/locations/")({
  head: () => ({
    meta: [
      { title: "Local Studio & Delivery Coverage in Jetpur & Saurashtra — Rajmoti Studio" },
      {
        name: "description",
        content:
          "Rajmoti Studio physical studio location, counter pickup hours & delivery coverage in Jetpur, Navagadh, Virpur, Dhoraji, and Gondal. Personalized gifts, frames & photography.",
      },
      { property: "og:title", content: "Local Studio & Delivery Coverage — Rajmoti Studio Jetpur" },
      { property: "og:url", content: absUrl("/locations") },
    ],
  }),
  component: LocationsIndexPage,
});

function LocationsIndexPage() {
  const jsonLd = [
    localBusinessJsonLd(),
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Locations", path: "/locations" },
    ]),
  ];

  return (
    <div className="min-h-screen bg-[#FCFAF6] text-stone-900 flex flex-col justify-between">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteNav />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-10 w-full">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="text-xs text-stone-500 mb-6 flex items-center gap-1.5">
          <Link to="/" className="hover:text-amber-900 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-stone-900 font-semibold">Local Coverage</span>
        </nav>

        {/* Hero Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/70 text-amber-950 text-xs font-semibold uppercase tracking-wider mb-3">
            <MapPin size={13} className="text-amber-800" /> Physical Studio in Jetpur · Gujarat
          </div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-950 tracking-tight leading-tight">
            Our Studio Location &amp; Local Service Coverage
          </h1>
          <p className="text-stone-600 text-sm sm:text-base mt-3 leading-relaxed">
            Rajmoti Studio operates from our physical workshop on MG Road in <strong>Jetpur, Gujarat</strong>. We specialize in personalized photo gifts, handcrafted framing, archival photo restoration, and fine art family portraiture for Jetpur, Navagadh, and neighboring Saurashtra communities.
          </p>
        </div>

        {/* P0 CORE MARKET: JETPUR HEADQUARTERS */}
        <section aria-labelledby="core-market-heading" className="mb-14">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
              P0 — Core Market
            </span>
            <span className="text-xs text-stone-500">Physical Studio &amp; Instant Counter Pickup</span>
          </div>

          <div className="bg-white rounded-3xl border border-stone-300 p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-stone-200">
              <div>
                <h2 id="core-market-heading" className="font-display text-2xl sm:text-3xl font-bold text-stone-900">
                  Jetpur &amp; Navagadh (Studio Hub)
                </h2>
                <p className="text-stone-600 text-sm mt-1 max-w-xl">
                  {HYPERLOCAL_CITIES.jetpur.overviewHero}
                </p>
                <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-stone-700">
                  <span className="flex items-center gap-1 font-semibold text-emerald-800">
                    <Clock size={14} /> 2–4 Hour Counter Pickup
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={14} className="text-amber-800" /> MG Road, Jetpur (PIN 360370)
                  </span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck size={14} className="text-amber-800" /> Operating Since 1982
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
                <Link
                  to="/locations/jetpur"
                  className="w-full sm:w-auto text-center px-5 py-2.5 rounded-full text-xs font-semibold bg-[#29251F] text-amber-100 hover:bg-stone-800 transition-colors shadow-2xs"
                >
                  Explore Jetpur Hub →
                </Link>
                <a
                  href={STUDIO.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto text-center px-4 py-2.5 rounded-full text-xs font-medium border border-stone-300 bg-stone-50 text-stone-700 hover:bg-stone-100 transition-colors flex items-center justify-center gap-1.5"
                >
                  Google Maps <ArrowRight size={13} />
                </a>
              </div>
            </div>

            {/* 4 Dedicated Jetpur Service Gateways */}
            <div className="mt-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
                Dedicated Jetpur Service Pages:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.values(HYPERLOCAL_CITIES.jetpur.services).map((srv) => (
                  <Link
                    key={srv.slug}
                    to="/locations/jetpur/$service"
                    params={{ service: srv.slug }}
                    className="p-4 rounded-2xl border border-stone-200 bg-stone-50/70 hover:bg-white hover:border-amber-700 hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-amber-800 block mb-1">
                        Jetpur Focus
                      </span>
                      <h4 className="font-display text-base font-bold text-stone-900 group-hover:text-amber-900 transition-colors">
                        {srv.name}
                      </h4>
                      <p className="text-xs text-stone-600 mt-1.5 line-clamp-2 leading-relaxed">
                        {srv.metaDescription}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-amber-900 flex items-center gap-1 mt-4 group-hover:translate-x-1 transition-transform">
                      View Service Page →
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* P1 NEARBY EXPANSION: VIRPUR, DHORAJI, GONDAL */}
        <section aria-labelledby="nearby-expansion-heading" className="mb-14">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-300">
              P1 — Nearby Expansion
            </span>
            <span className="text-xs text-stone-500">Confirmed Delivery &amp; Proximity Transit</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Virpur */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase bg-stone-100 px-2 py-0.5 rounded text-stone-700">
                    12 km from Studio
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800">20-Min Highway</span>
                </div>
                <h3 className="font-display text-xl font-bold text-stone-900">Virpur (Dham)</h3>
                <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                  Sacred Sant Shri Jalaram Bapa mandir photo frames, illuminated LED translights, and personalized family keepsakes with 24-hour delivery or easy counter pickup in Jetpur.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-stone-100 flex flex-col gap-2">
                <Link
                  to="/locations/virpur/devotional-photo-gifts"
                  className="text-xs font-semibold text-amber-900 hover:text-amber-850 flex items-center justify-between"
                >
                  <span>Devotional Keepsakes for Virpur</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            {/* Dhoraji */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase bg-stone-100 px-2 py-0.5 rounded text-stone-700">
                    15 km from Studio
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800">1-Day Transit</span>
                </div>
                <h3 className="font-display text-xl font-bold text-stone-900">Dhoraji</h3>
                <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                  Custom photo framing, 3D ceramic mugs, and anniversary collages. Serving Dhoraji families with in-browser fitting and direct WhatsApp proofing.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-stone-100 flex flex-col gap-2">
                <Link
                  to="/locations/dhoraji/personalized-gifts"
                  className="text-xs font-semibold text-amber-900 hover:text-amber-850 flex items-center justify-between"
                >
                  <span>Personalized Gifts for Dhoraji</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            {/* Gondal */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase bg-stone-100 px-2 py-0.5 rounded text-stone-700">
                    30 km from Studio
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800">1–2 Day Courier</span>
                </div>
                <h3 className="font-display text-xl font-bold text-stone-900">Gondal</h3>
                <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                  Bespoke wedding frames, memory magazines, and personalized photo gifts delivered safely along the NH-27 highway corridor.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-stone-100 flex flex-col gap-2">
                <Link
                  to="/locations/gondal/personalized-gifts"
                  className="text-xs font-semibold text-amber-900 hover:text-amber-850 flex items-center justify-between"
                >
                  <span>Personalized Gifts for Gondal</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* P2 VALIDATION & GEOGRAPHIC HONESTY POLICY */}
        <section className="bg-amber-50/60 border border-amber-200 rounded-2xl p-6 text-xs text-stone-700 leading-relaxed">
          <div className="flex items-center gap-2 mb-2 font-bold text-amber-950">
            <ShieldCheck size={16} className="text-amber-800" />
            <span>Factual Geographic Commitment &amp; Delivery Transparency</span>
          </div>
          <p>
            Unlike automated e-commerce networks that generate thousands of fake city landing pages, Rajmoti Studio only publishes location pages for communities where we provide genuine fulfillment, confirmed delivery logistics, or close proximity to our Jetpur physical counter. Smaller surrounding villages (P2) and Upleta are evaluated based on real order volume and courier reliability before launching dedicated pages.
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
