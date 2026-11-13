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
          "Rajmoti Studio in Jetpur, Gujarat (Est. 1982). Baby photoshoots, maternity, family, wedding photography, teak collage frames, diamond acrylics & 3D photo mugs.",
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
    text: "Three generations in one frame. Natural poses, joyful laughter, and lasting legacy.",
    image: "/portfolio/family-heritage.jpg",
    serviceId: "family",
  },
  {
    slug: "wedding",
    name: "A day. A lifetime.",
    label: "Weddings & Mandap",
    text: "Authentic Gujarati ceremonies: Lagan, Pithi, Mandap and candid couple moments.",
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
    text: "Cinematic golden hour outdoor sets and fine-art pre-wedding memories.",
    image: "/portfolio/couple-prewedding.jpg",
    serviceId: "couple",
  },
];

const LOCAL_FAQS = [
  {
    q: "Where is Rajmoti Studio located in Jetpur?",
    a: "Rajmoti Studio is situated near Rajmoti Cinema on Station Road in Jetpur, Gujarat (PIN: 360370). We have been serving families across Jetpur, Gondal, Dhoraji, and Rajkot district since 1982.",
  },
  {
    q: "What frame sizes and finishes do you manufacture?",
    a: "We handcraft frames from 8×12 inches up to 20×30 inches in genuine Saurashtra Teak wood, matte charcoal, royal gold leaf, diamond-polished floating acrylic blocks, and edge-lit LED translights.",
  },
  {
    q: "Can I customize a photo gift with my own photos before ordering?",
    a: "Yes! You can preview multi-photo collage frames, rotate 3D ceramic mugs, test thermochromic magic reveal effects, and inspect LED translight illumination directly on our website. Our master framers confirm every crop and finish with you on WhatsApp (+91 94290 70317) before final crafting.",
  },
  {
    q: "How does payment and studio collection work?",
    a: "For Studio Collection in Jetpur, you can pay online via UPI or choose 'Pay at Studio' to settle your balance in Cash or UPI when collecting your finished keepsake at our counter. For Home Delivery across Gujarat & India, 100% online prepayment via UPI is required before dispatch.",
  },
  {
    q: "How do I book a baby or maternity photoshoot?",
    a: "You can click 'Plan a Session' on our website to choose your preferred date and service, or message us directly on WhatsApp (+91 94290 70317). Our private indoor studio is temperature-controlled and paced gently with breaks for feeding and settling.",
  },
  {
    q: "Do you offer old photo restoration and heritage framing?",
    a: "Yes. Photo restoration is one of our specialty studio disciplines. We digitize vintage, faded, or torn ancestral photographs, delicately repair scratches while strictly preserving original facial identity, and frame them in archival teak.",
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
              A family studio. Three generations of memories.
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
          <span>Photographing 3 generations since 1982</span>
          <span>Archival prints, teak wood & diamond acrylic</span>
          <span>Studio & workshop near Rajmoti Cinema, Jetpur</span>
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
              Explore 18 product families crafted in our Jetpur workshop: multi-photo teak collages,
              3D ceramic & thermochromic magic mugs, edge-lit LED translights, and couple photobooks.
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

        {/* Local Studio Contact & Hours Banner */}
        <section className="ed-wrap mb-14">
          <div className="rounded-3xl bg-[#29251F] text-amber-100 p-8 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#B49A72] block">
                VISIT RAJMOTI STUDIO IN JETPUR
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
                Near Rajmoti Cinema, Station Road
              </h2>
              <p className="text-xs text-stone-300 max-w-lg leading-relaxed">
                Jetpur, Gujarat 360370. Serving families across Saurashtra for over 40 years. Open Monday to Saturday: 9:00 AM – 8:00 PM · Sunday: 10:00 AM – 6:00 PM.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <a
                href={whatsappLink(waMessage.booking())}
                target="_blank"
                rel="noopener noreferrer"
                className="ed-button flex items-center justify-center gap-2 bg-[#25D366] text-white border-[#25D366] hover:bg-[#20b858] text-xs py-3 px-5 shadow-xs whitespace-nowrap"
              >
                <MessageCircle size={16} />
                <span>WhatsApp: +91 94290 70317</span>
              </a>
              <button
                type="button"
                onClick={() => openBooking("family")}
                className="ed-button bg-amber-100 text-stone-950 hover:bg-white text-xs py-3 px-5 font-bold shadow-xs whitespace-nowrap"
              >
                Plan a Studio Visit
              </button>
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
