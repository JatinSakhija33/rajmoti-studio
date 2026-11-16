import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import {
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  Package,
  Heart,
  MessageCircle,
  Eye,
  Gift,
  Truck,
  RotateCw,
} from "lucide-react";
import { getCityData, getCityServiceData } from "@/lib/hyperlocal-seo";
import { SITE, whatsappLink } from "@/lib/site";
import { STUDIO, absUrl, breadcrumbJsonLd, localBusinessJsonLd } from "@/lib/seo";

export const Route = createFileRoute("/locations/$city/$service")({
  head: ({ params }) => {
    const service = getCityServiceData(params.city, params.service);
    const city = getCityData(params.city);

    if (!service) {
      return {
        meta: [{ title: `Services in ${city.name} — Rajmoti Studio` }],
      };
    }

    return {
      meta: [
        { title: service.metaTitle },
        { name: "description", content: service.metaDescription },
        { property: "og:title", content: service.metaTitle },
        { property: "og:description", content: service.metaDescription },
        { property: "og:url", content: absUrl(`/locations/${city.slug}/${service.slug}`) },
        { property: "og:type", content: "website" },
      ],
      links: [{ rel: "canonical", href: absUrl(`/locations/${city.slug}/${service.slug}`) }],
    };
  },
  component: LocalServiceLandingPage,
});

function LocalServiceLandingPage() {
  const { city: citySlug, service: serviceSlug } = Route.useParams();
  const city = getCityData(citySlug);
  const service = getCityServiceData(citySlug, serviceSlug);

  if (!service) {
    throw notFound();
  }

  const jsonLd = [
    localBusinessJsonLd(),
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Locations", path: "/locations" },
      { name: city.name, path: `/locations/${city.slug}` },
      { name: service.name, path: `/locations/${city.slug}/${service.slug}` },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: `${service.name} in ${city.name}`,
      serviceType: service.name,
      description: service.metaDescription,
      provider: {
        "@type": "PhotographyBusiness",
        name: STUDIO.name,
        telephone: STUDIO.phone,
        url: STUDIO.mapsUrl,
      },
      areaServed: {
        "@type": "Place",
        name: `${city.name}, Gujarat`,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: service.faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: f.a,
        },
      })),
    },
  ];

  const whatsappInquiryUrl = whatsappLink(
    `Namaste ${SITE.name}! 🙏 I am inquiring about "${service.name} in ${city.name}". Could you please guide me on available options, customisation, and delivery/pickup timelines? Thank you!`,
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
        <nav aria-label="Breadcrumb" className="text-xs text-stone-500 mb-6 flex flex-wrap items-center gap-1.5">
          <Link to="/" className="hover:text-amber-900 transition-colors">Home</Link>
          <span>/</span>
          <Link to="/locations" className="hover:text-amber-900 transition-colors">Locations</Link>
          <span>/</span>
          <Link to="/locations/$city" params={{ city: city.slug }} className="hover:text-amber-900 transition-colors">
            {city.name}
          </Link>
          <span>/</span>
          <span className="text-stone-900 font-semibold">{service.name}</span>
        </nav>

        {/* Hero Section */}
        <div className="bg-white rounded-3xl border border-stone-300 p-6 sm:p-10 mb-10 shadow-xs relative overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/80 text-amber-950 text-xs font-semibold uppercase tracking-wider">
              <MapPin size={13} className="text-amber-800" />
              {city.name} · {city.district}
            </span>
            <span className="text-xs font-mono text-stone-500">
              {city.isPhysicalStudioLocation ? "Physical Studio Presence" : `${city.distanceFromJetpurStudio}`}
            </span>
          </div>

          <p className="text-xs font-bold uppercase tracking-wider text-amber-900 mb-1">
            {service.kicker}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-950 tracking-tight leading-tight">
            {service.h1}
          </h1>

          <p className="text-stone-600 text-sm sm:text-base mt-4 leading-relaxed max-w-3xl">
            {service.heroIntro}
          </p>

          {/* Quick Trust Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-stone-100 text-xs">
            <div className="flex items-center gap-2 text-stone-700">
              <Clock size={16} className="text-emerald-700 shrink-0" />
              <div>
                <strong className="block text-stone-900">Fast Turnaround</strong>
                <span className="text-[11px] text-stone-500">{service.turnaroundTime.split(";")[0]}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-stone-700">
              <Eye size={16} className="text-amber-700 shrink-0" />
              <div>
                <strong className="block text-stone-900">Live 3D Fitting</strong>
                <span className="text-[11px] text-stone-500">In-browser preview before buy</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-stone-700">
              <ShieldCheck size={16} className="text-amber-700 shrink-0" />
              <div>
                <strong className="block text-stone-900">Since 1982</strong>
                <span className="text-[11px] text-stone-500">40+ years portrait heritage</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-stone-700">
              <MessageCircle size={16} className="text-emerald-700 shrink-0" />
              <div>
                <strong className="block text-stone-900">WhatsApp Proofing</strong>
                <span className="text-[11px] text-stone-500">Confirm directly with owner</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-8">
            <a
              href="#featured-products"
              className="px-6 py-2.5 rounded-full text-xs font-semibold bg-[#29251F] text-amber-100 hover:bg-stone-800 transition-colors shadow-sm inline-flex items-center gap-1.5"
            >
              <Package size={14} /> View Products &amp; Pricing
            </a>
            <Link
              to="/products"
              className="px-5 py-2.5 rounded-full text-xs font-semibold border border-stone-300 bg-white text-stone-800 hover:bg-stone-50 transition-colors inline-flex items-center gap-1.5"
            >
              <Eye size={14} /> Open Live Personalizer
            </Link>
            <a
              href={whatsappInquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-full text-xs font-semibold border border-emerald-300 bg-emerald-50 text-emerald-950 hover:bg-emerald-100 transition-colors inline-flex items-center gap-1.5"
            >
              <MessageCircle size={14} className="text-emerald-700" /> WhatsApp Pankajbhai
            </a>
          </div>
        </div>

        {/* Why Choose Rajmoti in this Location (Competitive Advantage) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-[#FAF7F1] border border-amber-200/80 rounded-2xl p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block mb-1">
                Local Shopping Advantage
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-stone-900">
                Why {city.name} Residents Choose Rajmoti Studio
              </h2>
              <p className="text-xs sm:text-sm text-stone-700 mt-3 leading-relaxed">
                {service.whyLocalAdvantage}
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-amber-200/60 text-xs text-stone-600">
              <strong className="text-stone-900 block mb-1">Regional Context:</strong>
              <p className="text-[11px] leading-relaxed">{service.localCompetitorContext}</p>
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-7">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
              Craftsmanship Commitments
            </span>
            <h3 className="font-display text-xl font-bold text-stone-900 mb-4">
              Our 4 Pillars of Excellence
            </h3>
            <div className="space-y-3.5">
              {service.differentiators.map((diff, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs">
                  <CheckCircle2 size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-stone-950 block">{diff.title}</strong>
                    <span className="text-stone-600 leading-relaxed">{diff.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Interactive Preview Studio Callout */}
        <section className="bg-stone-900 text-amber-100 rounded-3xl p-6 sm:p-8 mb-12 shadow-md flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="max-w-xl">
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 block mb-1">
              In-Browser Personalization Studio
            </span>
            <h3 className="font-display text-2xl font-bold text-white">
              Try before you buy with interactive 3D tools.
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 mt-1 leading-relaxed">
              Test your photo on rotatable 3D magic mugs, simulate illuminated LED translights, or compare frame sizes against real wall spaces right on your smartphone.
            </p>
          </div>
          <Link
            to="/products"
            className="shrink-0 px-6 py-3 rounded-full text-xs font-bold bg-amber-400 text-stone-950 hover:bg-amber-300 transition-colors shadow-sm inline-flex items-center gap-2"
          >
            <Sparkles size={14} /> Open Live Studio Tools <ArrowRight size={14} />
          </Link>
        </section>

        {/* Featured Products Grid */}
        <section id="featured-products" aria-labelledby="products-heading" className="mb-14">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Verified Catalogue SKUs
              </p>
              <h2 id="products-heading" className="font-display text-2xl sm:text-3xl font-bold text-stone-900 mt-0.5">
                Popular Options for {city.name}
              </h2>
            </div>
            <Link
              to="/products"
              className="text-xs font-semibold text-amber-900 hover:text-amber-800 flex items-center gap-1 self-start sm:self-auto"
            >
              Browse Full Catalog →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {service.featuredProductLinks.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-stone-200 p-5 flex flex-col justify-between shadow-xs hover:border-amber-700 hover:shadow-lg transition-all"
              >
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-mono uppercase bg-amber-50 text-amber-900 px-2 py-0.5 rounded border border-amber-200/60">
                      {item.badge || "Verified"}
                    </span>
                    <span className="font-display font-bold text-sm text-stone-950">
                      ₹{item.price}
                    </span>
                  </div>
                  <h3 className="font-display text-base font-bold text-stone-900 leading-snug">
                    {item.name}
                  </h3>
                  <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between gap-2">
                  <Link
                    to={item.link as string}
                    className="flex-1 py-2 px-3 text-center text-xs font-semibold rounded-lg bg-[#29251F] text-amber-100 hover:bg-stone-800 transition-colors shadow-2xs"
                  >
                    Customise &amp; Order
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Gifting Packaging & Add-ons Banner */}
        <section className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 mb-12 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block mb-1">
                Thoughtful Gifting Touch
              </span>
              <h3 className="font-display text-2xl font-bold text-stone-900">
                Premium Unboxing Experience Available
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 mt-1 leading-relaxed">
                Add our signature handcrafted gift packaging to any product for a memorable celebration:
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-stone-700">
                <span className="flex items-center gap-1.5 font-medium">
                  <Gift size={14} className="text-amber-800" /> Handcrafted Studio Gift Box (+₹49)
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Heart size={14} className="text-amber-800" /> Wax-Sealed Calligraphy Card (+₹29)
                </span>
              </div>
            </div>

            <Link
              to="/products"
              className="shrink-0 px-5 py-2.5 rounded-full text-xs font-semibold bg-[#29251F] text-amber-100 hover:bg-stone-800 transition-colors shadow-2xs text-center"
            >
              Order With Gift Packaging →
            </Link>
          </div>
        </section>

        {/* Pickup, Delivery & Studio Location Details */}
        <section className="bg-[#FAF7F1] border border-stone-300 rounded-3xl p-6 sm:p-8 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block mb-1">
                Fulfillment Logistics
              </span>
              <h3 className="font-display text-2xl font-bold text-stone-900">
                How We Deliver to {city.name}
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed">
                {city.isPhysicalStudioLocation
                  ? "Orders can be collected directly from our Jetpur counter or dispatched for local home delivery across Jetpur and Navagadh. Standard items are ready in 2 to 4 hours."
                  : `Orders for ${city.name} are carefully packaged with shatterproof optical acrylic and bubble protection at our Jetpur studio, reaching your doorstep within 1 to 2 business days.`}
              </p>

              <div className="mt-4 space-y-2 text-xs text-stone-700">
                <p>
                  <strong>Studio Location:</strong> Kanakia Plot, near Natraj Lodge area, MG Road, Jetpur
                </p>
                <p>
                  <strong>Pickup Availability:</strong> Ready in 2–4 hours after WhatsApp proof confirmation
                </p>
                <p>
                  <strong>Customer Support:</strong> Direct WhatsApp support with Pankajbhai at +91 94290 70317
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 p-5 flex flex-col justify-between">
              <div>
                <h4 className="font-display font-bold text-base text-stone-900">
                  Ready to personalize your order?
                </h4>
                <p className="text-xs text-stone-600 mt-1">
                  Upload your photo into our live preview studio or message us on WhatsApp for advice.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-stone-100">
                <a
                  href={whatsappInquiryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 text-center text-xs font-semibold rounded-lg bg-emerald-800 text-white hover:bg-emerald-900 transition-colors flex items-center justify-center gap-1.5"
                >
                  <MessageCircle size={13} /> Chat on WhatsApp
                </a>
                <Link
                  to="/products"
                  className="py-2 px-3 text-xs font-semibold rounded-lg border border-stone-300 text-stone-800 hover:bg-stone-50 transition-colors"
                >
                  Browse Catalogue
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Frequently Asked Questions */}
        <section aria-labelledby="service-faqs-heading" className="mb-12">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1">
              <HelpCircle size={13} /> Clear Information
            </p>
            <h2 id="service-faqs-heading" className="font-display text-2xl sm:text-3xl font-bold text-stone-900 mt-0.5">
              Frequently Asked Questions: {service.name} in {city.name}
            </h2>
          </div>

          <div className="space-y-3">
            {service.faqs.map((faq, idx) => (
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
