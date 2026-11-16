import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { MapPin, Clock, ArrowRight, ShieldCheck, Phone, MessageCircle, Sparkles, HelpCircle, CheckCircle2 } from "lucide-react";
import { HYPERLOCAL_CITIES, getCityData } from "@/lib/hyperlocal-seo";
import { SITE, whatsappLink } from "@/lib/site";
import { STUDIO, absUrl, breadcrumbJsonLd, localBusinessJsonLd } from "@/lib/seo";

export const Route = createFileRoute("/locations/$city/")({
  head: ({ params }) => {
    const city = getCityData(params.city);
    const title = city.isPhysicalStudioLocation
      ? `Photography Studio, Frames & Personalized Gifts in ${city.name} — Rajmoti Studio`
      : `Personalized Photo Gifts & Framing for ${city.name} — Rajmoti Studio Jetpur`;

    const description = city.isPhysicalStudioLocation
      ? `Rajmoti Studio in ${city.name}, Gujarat (Est. 1982). Custom photo frames, 3D magic reveal mugs, archival photo printing, and fine-art family photography with 2–4h studio pickup.`
      : `Handcrafted personalized gifts, custom photo frames & prints delivered to ${city.name} from Rajmoti Studio Jetpur (${city.distanceFromJetpurStudio}). Live 3D preview & fast dispatch.`;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:url", content: absUrl(`/locations/${city.slug}`) },
      ],
    };
  },
  component: CityHubPage,
});

function CityHubPage() {
  const { city: citySlug } = Route.useParams();
  const city = getCityData(citySlug);

  if (!city) {
    throw notFound();
  }

  const jsonLd = [
    city.isPhysicalStudioLocation ? localBusinessJsonLd() : null,
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Locations", path: "/locations" },
      { name: city.name, path: `/locations/${city.slug}` },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: city.faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: f.a,
        },
      })),
    },
  ].filter(Boolean);

  const whatsappInquiryUrl = whatsappLink(
    `Namaste ${SITE.name}! 🙏 I am inquiring from ${city.name} about your personalized photo gifts, custom frames, or studio services. Please share available options.`,
  );

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
          <Link to="/locations" className="hover:text-amber-900 transition-colors">Locations</Link>
          <span>/</span>
          <span className="text-stone-900 font-semibold">{city.name}</span>
        </nav>

        {/* City Hero */}
        <div className="bg-white rounded-3xl border border-stone-300 p-6 sm:p-10 mb-10 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/80 text-amber-950 text-xs font-semibold uppercase tracking-wider">
              <MapPin size={13} className="text-amber-800" />
              {city.isPhysicalStudioLocation ? "Physical Studio Location · Gujarat" : `Serving ${city.name} from Jetpur`}
            </span>
            <span className="text-xs font-mono text-stone-500">
              {city.distanceFromJetpurStudio}
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-950 tracking-tight leading-tight">
            {city.isPhysicalStudioLocation
              ? `Personalized Gifts, Framing & Photography in ${city.name}`
              : `Handcrafted Photo Gifts & Custom Framing for ${city.name}`}
          </h1>

          <p className="text-stone-600 text-sm sm:text-base mt-4 leading-relaxed max-w-3xl">
            {city.overviewHero}
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-6 pt-6 border-t border-stone-100 text-xs">
            {city.isPhysicalStudioLocation ? (
              <>
                <span className="flex items-center gap-1.5 font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  <Clock size={14} /> 2–4 Hour Counter Pickup
                </span>
                <span className="flex items-center gap-1.5 text-stone-700">
                  <ShieldCheck size={14} className="text-amber-800" /> 40+ Years Heritage (Est. 1982)
                </span>
                <span className="flex items-center gap-1.5 text-stone-700">
                  <MapPin size={14} className="text-amber-800" /> Kanakia Plot / Natraj Lodge area, MG Road
                </span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1.5 font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  <Clock size={14} /> {city.transitSummary}
                </span>
                <span className="flex items-center gap-1.5 text-stone-700">
                  <ShieldCheck size={14} className="text-amber-800" /> Handcrafted in nearby Jetpur Studio
                </span>
              </>
            )}
          </div>
        </div>

        {/* Dedicated Local Services Grid */}
        <section aria-labelledby="services-heading" className="mb-12">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-900">
              {city.isPhysicalStudioLocation ? "Jetpur Studio Disciplines" : `Available for ${city.name}`}
            </p>
            <h2 id="services-heading" className="font-display text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
              Explore Services &amp; Products
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Select a specialized category below for live product visualizers, pricing, and fulfillment timelines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.values(city.services).map((srv) => (
              <div
                key={srv.slug}
                className="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col justify-between shadow-xs hover:border-amber-700 hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono uppercase bg-stone-100 text-stone-700 px-2 py-0.5 rounded">
                      {srv.turnaroundTime.split(";")[0]}
                    </span>
                    <span className="text-xs font-semibold text-amber-900">{srv.kicker}</span>
                  </div>
                  <h3 className="font-display text-xl font-bold text-stone-900 mt-1">
                    {srv.h1}
                  </h3>
                  <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                    {srv.heroIntro}
                  </p>

                  <div className="mt-4 pt-3 border-t border-stone-100 space-y-2">
                    {srv.differentiators.slice(0, 2).map((diff, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <CheckCircle2 size={13} className="text-emerald-750 mt-0.5 shrink-0" />
                        <div>
                          <strong className="text-stone-900">{diff.title}:</strong>{" "}
                          <span className="text-stone-600">{diff.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between gap-2">
                  <Link
                    to="/locations/$city/$service"
                    params={{ city: city.slug, service: srv.slug }}
                    className="text-xs font-semibold text-amber-900 hover:text-amber-800 flex items-center gap-1 group"
                  >
                    <span>View Full {srv.name} Guide</span>
                    <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/products"
                    className="text-[11px] font-medium text-stone-500 hover:text-stone-900"
                  >
                    Browse Catalog →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Local Pickup & Studio Information Box */}
        <section className="bg-stone-900 text-amber-100 rounded-3xl p-6 sm:p-10 mb-12 shadow-lg">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 block mb-1">
                Studio Address &amp; Contact
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
                Visit Rajmoti Studio Jetpur
              </h2>
              <p className="text-stone-300 text-xs sm:text-sm mt-2 leading-relaxed">
                Operating continuously since 1982 in Jetpur, Saurashtra. We welcome walk-in visits for passport photos, framing consultations, and urgent same-day gift collections.
              </p>

              <div className="mt-6 space-y-3 text-xs text-stone-200">
                <div className="flex items-start gap-2.5">
                  <MapPin size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block">Physical Studio Address:</strong>
                    <span>Kanakia Plot, near Natraj Lodge area, MG Road, Jetpur, Gujarat 360370</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Phone size={15} className="text-amber-400 shrink-0" />
                  <div>
                    <strong className="text-white">Direct Phone:</strong>{" "}
                    <a href={`tel:${STUDIO.phone}`} className="hover:underline text-amber-200">{STUDIO.phone}</a>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <MessageCircle size={15} className="text-emerald-400 shrink-0" />
                  <div>
                    <strong className="text-white">WhatsApp Consultation:</strong>{" "}
                    <a href={whatsappInquiryUrl} target="_blank" rel="noopener noreferrer" className="hover:underline text-emerald-200">
                      Chat directly with Pankajbhai (+91 94290 70317)
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mt-7">
                <a
                  href={STUDIO.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-full text-xs font-semibold bg-amber-400 text-stone-950 hover:bg-amber-300 transition-colors shadow-sm inline-flex items-center gap-1.5"
                >
                  <MapPin size={13} /> Open Google Maps Directions
                </a>
                <a
                  href={whatsappInquiryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-full text-xs font-semibold border border-amber-400/40 text-amber-100 hover:bg-white/10 transition-colors inline-flex items-center gap-1.5"
                >
                  <MessageCircle size={13} className="text-emerald-400" /> WhatsApp Enquiry
                </a>
              </div>
            </div>

            {/* Coverage Areas Tag Cloud */}
            <div className="bg-stone-800/80 rounded-2xl p-6 border border-stone-700">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-3">
                Covered Neighborhoods in {city.name}:
              </h3>
              <div className="flex flex-wrap gap-2">
                {city.coverageAreas.map((area, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-stone-300"
                  >
                    {area}
                  </span>
                ))}
              </div>

              <div className="mt-6 pt-5 border-t border-stone-700 text-xs text-stone-400">
                <p>
                  <strong>Postal PIN Codes:</strong> {city.pinCodes.join(", ")}
                </p>
                <p className="mt-1">
                  <strong>Standard Delivery:</strong> {city.transitSummary}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Hyperlocal FAQs Section */}
        <section aria-labelledby="faqs-heading" className="mb-12">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1">
              <HelpCircle size={13} /> Common Questions
            </p>
            <h2 id="faqs-heading" className="font-display text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
              Frequently Asked Questions for {city.name}
            </h2>
          </div>

          <div className="space-y-3">
            {city.faqs.map((faq, idx) => (
              <details
                key={idx}
                className="group bg-white rounded-2xl border border-stone-200 p-4 transition-all open:border-amber-700 open:shadow-xs"
              >
                <summary className="font-display font-bold text-sm text-stone-900 cursor-pointer list-none flex justify-between items-center">
                  <span>{faq.q}</span>
                  <span className="text-stone-400 group-open:rotate-180 transition-transform text-lg ml-2">↓</span>
                </summary>
                <p className="text-xs text-stone-600 mt-3 pt-3 border-t border-stone-100 leading-relaxed">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
