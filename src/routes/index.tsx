import { useQuery } from "@tanstack/react-query";
import { siteContentQuery } from "@/lib/queries";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  Heart,
  Check,
  MessageCircle,
  Sparkles,
  Calendar,
  MapPin,
  Clock,
  ShieldCheck,
  ChevronDown,
  Gift,
  Layers,
} from "lucide-react";
import { useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { useStyles } from "@/features/catalogue/store";
import { whatsappLink, waMessage } from "@/lib/site";
import { BookingDialog } from "@/components/BookingDialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Rajmoti Studio — Photography, Framing & Personalised Gifts | Jetpur",
      },
      {
        name: "description",
        content:
          "Rajmoti Studio in Jetpur, Gujarat (Since 1982). Baby photoshoots, maternity, family, wedding photography, personalized photo framing & thoughtful photo gifts.",
      },
    ],
  }),
  component: Home,
});

const PHOTOGRAPHY_CATEGORIES = [
  {
    slug: "baby",
    name: "Their little beginnings",
    label: "Baby & Milestones",
    text: "Tiny fingers, peaceful yawns, and joyful first-year cake smash milestones.",
    image: "/portfolio/baby-milestone.jpg",
    serviceId: "baby",
  },
  {
    slug: "maternity",
    name: "Before we meet",
    label: "Maternity & Motherhood",
    text: "Graceful, unhurried portraits celebrating the quiet beauty before your baby arrives.",
    image: "/portfolio/maternity-grace.jpg",
    serviceId: "maternity",
  },
  {
    slug: "family",
    name: "Together, as you are",
    label: "Heritage Family",
    text: "Natural poses, candid smiles, and meaningful family milestones.",
    image: "/portfolio/family-heritage.jpg",
    serviceId: "family",
  },
  {
    slug: "wedding",
    name: "A day. A lifetime.",
    label: "Weddings & Mandap",
    text: "Authentic ceremonies, candid moments, and timeless wedding memories.",
    image: "/portfolio/wedding-mandap.jpg",
    serviceId: "wedding",
  },
  {
    slug: "birthday",
    name: "Laughter in every candle",
    label: "Birthday & Cake Smash",
    text: "Fun themed setups, pastel balloon arches, and messy milestone laughter.",
    image: "/portfolio/birthday-celebration.jpg",
    serviceId: "birthday",
  },
  {
    slug: "couple",
    name: "Two souls. One story.",
    label: "Couple Stories",
    text: "Cinematic outdoor sets and fine-art pre-wedding memories.",
    image: "/portfolio/couple-prewedding.jpg",
    serviceId: "couple",
  },
];

const LOCAL_FAQS = [
  {
    q: "Where is Rajmoti Studio located?",
    a: "Rajmoti Studio is based in Jetpur, Gujarat, PIN 360370. For our exact location and directions, please contact us on WhatsApp or use our verified business listing.",
  },
  {
    q: "What photo frame sizes are available?",
    a: "Rajmoti Studio offers photo framing and personalized print products in several sizes, including 8×12, 10×14, 10×10 square, 12×18, 14×20, 16×24, 18×24 and 20×30 inches. Available sizes, materials, finishes and orientations depend on the selected product. Choose a product to view its actual options and owner-configured price.",
  },
  {
    q: "Can I customize photo gifts with my own photographs?",
    a: "Yes. We offer personalized photo frames, collages, mugs, keychains and other photo gifts. You can explore available designs and sizes on our website and discuss your preferred photographs, names, dates and customization requirements with us through WhatsApp.",
  },
  {
    q: "How does payment and collection work?",
    a: "You can collect your order from Rajmoti Studio in Jetpur and pay online or at the studio. For an approved home-delivery order, full online payment must be verified before dispatch. Cash on delivery is not available. Delivery locations, charges and availability are confirmed by the studio.",
  },
  {
    q: "How can I book a baby or maternity photoshoot?",
    a: "Explore our baby and maternity photography portfolios, then send us your preferred session and date through the booking enquiry or WhatsApp. We will confirm availability, package details and any preparation instructions directly with you.",
  },
  {
    q: "Do you offer old photo restoration?",
    a: "Yes. Rajmoti Studio provides photo restoration services for old, faded and damaged photographs. We aim to preserve the original person's recognizable features while repairing visible damage and improving the photograph where possible. The results depend on the condition of the source photograph. Framing and printing options can be discussed with the studio.",
  },
];

function Home() {
  const { data: content = {} } = useQuery(siteContentQuery);
  const candidate = content.hero?.images?.[0] || content.hero?.fallback_image;
  const customHero = candidate && !candidate.startsWith("/demo/") ? candidate : null;
  const [styles, setStyles] = useStyles();
  const saved = styles.some((s) => s.id === "demo-family-story");

  // Booking Modal State
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedService, setSelectedService] = useState("baby");

  const openBooking = (serviceId = "baby") => {
    setSelectedService(serviceId);
    setBookingOpen(true);
  };

  return (
    <div className="editorial">
      <SiteNav />
      <main>
        {/* Hero Section */}
        <section className="ed-wrap home-hero">
          <div className="home-hero-copy">
            <p className="ed-kicker flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-700" /> Jetpur, Gujarat · Since 1982
            </p>
            <h1>
              Little moments.
              <br />
              <em>Lasting stories.</em>
            </h1>
            <p className="ed-copy">
              Handcrafted portraiture, baby milestones, weddings, and heirloom photo gifts. Made with
              patience, archival care, and 40+ years of family trust in Jetpur.
            </p>
            <div className="ed-actions">
              <button
                type="button"
                onClick={() => openBooking("baby")}
                className="ed-button flex items-center gap-2"
              >
                <span>Plan a Session</span>
                <Calendar size={15} />
              </button>
              <Link to="/gifts" className="ed-button outline flex items-center gap-2">
                <span>Personalized Gifts</span>
                <Gift size={15} />
              </Link>
              <a
                className="ed-text-button"
                href={whatsappLink(waMessage.booking())}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle size={16} /> WhatsApp Studio
              </a>
            </div>
            <div className="hero-signature">
              <span className="signature-line" />
              A family studio. Cherished memories since 1982.
            </div>
          </div>
          <figure className="home-hero-image">
            <picture>
              <source
                media="(max-width: 700px)"
                srcSet={customHero || "/editorial/family-hero.png"}
              />
              <img
                src={customHero || "/editorial/family-hero.png"}
                width="1536"
                height="1024"
                fetchPriority="high"
                alt="Rajmoti Studio fine-art family portrait in Jetpur"
              />
            </picture>
            <div className="photo-note">
              The everyday.
              <br />
              <em>Made unforgettable.</em>
            </div>
          </figure>
        </section>

        {/* Heritage Trust Line */}
        <div className="ed-wrap heritage-line">
          <span>Est. 1982</span>
          <span>Photography · Photo Prints · Personalized Frames & Gifts</span>
          <span>Based in Jetpur, Gujarat</span>
        </div>

        {/* Photography Categories: Image-Led Grid */}
        <section className="ed-wrap ed-section">
          <div className="ed-section-heading">
            <div>
              <p className="ed-kicker">Fine-Art Studio Photography</p>
              <h2>Every chapter deserves a place.</h2>
            </div>
            <Link to="/portfolios" className="ed-text-button">
              See all collections <ArrowUpRight size={17} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PHOTOGRAPHY_CATEGORIES.map((c, i) => (
              <div
                key={c.slug}
                className="group rounded-2xl bg-white border border-stone-200 hover:border-amber-800 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
              >
                <Link
                  to="/portfolios/$category"
                  params={{ category: c.slug }}
                  className="block relative aspect-[4/5] bg-stone-100 overflow-hidden"
                >
                  <img
                    src={c.image}
                    alt={c.label}
                    width="1200"
                    height="1500"
                    loading="lazy"
                    className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-md text-amber-100 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                    0{i + 1} / {c.label}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      Explore Gallery <ArrowRight size={13} />
                    </span>
                  </div>
                </Link>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-display text-xl font-bold text-stone-900 group-hover:text-amber-900 transition-colors">
                      {c.name}
                    </h3>
                    <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">{c.text}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => openBooking(c.serviceId)}
                      className="text-xs font-semibold text-amber-900 hover:text-stone-950 flex items-center gap-1"
                    >
                      <Calendar size={13} />
                      <span>Plan Session</span>
                    </button>
                    <Link
                      to="/portfolios/$category"
                      params={{ category: c.slug }}
                      className="text-xs text-stone-500 hover:text-stone-900 flex items-center gap-1"
                    >
                      <span>View Gallery</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Personalized Gift Suite Callout */}
        <section className="gift-feature ed-wrap my-12">
          <div>
            <p className="ed-kicker">Off your phone. Into your hands.</p>
            <h2>
              Memories you
              <br />
              <em>can touch & feel.</em>
            </h2>
            <p className="ed-copy">
              Explore personalized photo frames, collages, ceramic & magic mugs, backlit LED translights, and photobooks. Available finishes and sizes vary by product.
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              <Link to="/gifts" className="ed-button flex items-center gap-2">
                <span>Explore Gift Catalogue</span>
                <ArrowRight size={16} />
              </Link>
              <a
                href={whatsappLink("Namaste Rajmoti Studio! 🖼️ I would like to inquire about custom photo frames and personalised gifts.")}
                target="_blank"
                rel="noopener noreferrer"
                className="ed-button outline flex items-center gap-2"
              >
                <MessageCircle size={15} /> WhatsApp Catalogue
              </a>
            </div>
          </div>
          <figure>
            <img
              src="/editorial/gift-still-life.png"
              width="1536"
              height="1024"
              loading="lazy"
              alt="Photo frames, canvas prints and personalised gifts at Rajmoti Studio Jetpur"
            />
          </figure>
        </section>

        {/* Local Jetpur AEO / FAQ Section */}
        <section className="ed-wrap ed-section py-12">
          <div className="ed-section-heading">
            <div>
              <p className="ed-kicker">Local Studio Guide & FAQ</p>
              <h2>Everything you need to know about Rajmoti Studio.</h2>
            </div>
            <p className="ed-copy narrow">
              Authentic studio facts, location details, framing materials, and ordering procedures in Jetpur.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {LOCAL_FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-2"
              >
                <h3 className="font-display text-base font-bold text-stone-900">
                  {faq.q}
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Local Studio Contact & Location Banner */}
        <section className="ed-wrap mb-14">
          <div className="rounded-3xl bg-[#29251F] text-amber-100 p-8 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#B49A72] block">
                LOCAL STUDIO IN JETPUR
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
                Visit Rajmoti Studio in Jetpur
              </h2>
              <p className="text-xs text-stone-300 max-w-lg leading-relaxed">
                Photography, photo printing, personalized frames and thoughtful photo gifts in Jetpur, Gujarat 360370. For directions, visiting hours or enquiries, please contact us on WhatsApp.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <a
                href="https://maps.app.goo.gl/nYgKFSidpihg1Nft6"
                target="_blank"
                rel="noopener noreferrer"
                className="ed-button flex items-center justify-center gap-2 bg-amber-100 text-stone-950 hover:bg-white text-xs py-3 px-5 font-bold shadow-xs whitespace-nowrap"
              >
                <ArrowRight size={15} />
                <span>Get Directions</span>
              </a>
              <a
                href={whatsappLink(waMessage.general())}
                target="_blank"
                rel="noopener noreferrer"
                className="ed-button flex items-center justify-center gap-2 bg-[#25D366] text-white border-[#25D366] hover:bg-[#20b858] text-xs py-3 px-5 shadow-xs whitespace-nowrap"
              >
                <MessageCircle size={16} />
                <span>WhatsApp Our Studio</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Booking Dialog Modal */}
      <BookingDialog
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        defaultService={selectedService}
      />

      <SiteFooter />
    </div>
  );
}
