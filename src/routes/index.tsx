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
  Upload,
  Compass,
  Users,
  Baby,
  Star,
  Package,
} from "lucide-react";
import { useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { useStyles } from "@/features/catalogue/store";
import { whatsappLink, waMessage, SITE } from "@/lib/site";
import { BookingDialog } from "@/components/BookingDialog";
import { GiftFinder } from "@/features/catalogue/GiftFinder";
import { trackEvent } from "@/lib/analytics";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Rajmoti Studio — Photography, Framing & Personalised Gifts | Jetpur",
      },
      {
        name: "description",
        content:
          "Rajmoti Studio in Jetpur, Gujarat (Since 1982). Fine-art photography, baby milestones, weddings, personalized photo frames, 3D mugs, and heartfelt gifts.",
      },
    ],
  }),
  component: Home,
});

const OCCASIONS = [
  { id: "anniversary", name: "Anniversary", image: "/products/frame-sample-anniversary.jpg", link: "/products/gifts/anniversary", tag: "Most Cherished" },
  { id: "birthday", name: "Birthday", image: "/portfolio/birthday-celebration.jpg", link: "/products/gifts/birthday", tag: "Celebration" },
  { id: "wedding", name: "Wedding Keepsake", image: "/portfolio/wedding-mandap.jpg", link: "/products/gifts/wedding", tag: "Heirloom" },
  { id: "baby", name: "Baby Milestone", image: "/portfolio/baby-milestone.jpg", link: "/products/gifts/baby", tag: "Milestones" },
  { id: "couples", name: "Romantic Couple", image: "/portfolio/couple-prewedding.jpg", link: "/products/gifts/couples", tag: "Together" },
  { id: "devotional", name: "Mandir & Pooja", image: "/deities/shrinathji.jpg", link: "/products/devotional", tag: "Sacred" },
];

const RECIPIENTS = [
  { label: "For Partner & Spouse", count: "32 Gifts", link: "/products/gifts/anniversary", desc: "Express eternal appreciation" },
  { label: "For Parents & Family", count: "48 Gifts", link: "/products/gifts/family", desc: "Celebrate generations together" },
  { label: "For Baby & Children", count: "24 Gifts", link: "/products/gifts/baby", desc: "Capture fleeting first steps" },
  { label: "For Friends & Siblings", count: "28 Gifts", link: "/products/mugs", desc: "Fun mugs & pocket keepsakes" },
  { label: "For Home Mandir", count: "10 Sanctums", link: "/products/devotional", desc: "Consecrated Gujarati deity swaroops" },
];

const FEATURED_BESTSELLERS = [
  {
    id: "royal-heritage",
    name: "Royal Heritage Wedding Frame",
    price: 1499,
    mrp: 1949,
    image: "/products/frame-sample-wedding.jpg",
    category: "Handcrafted Frames",
    link: "/products/frames/royal-heritage",
    badge: "Bestseller",
    rating: "4.9",
    reviews: 64,
  },
  {
    id: "magic-photo-mug",
    name: "Thermochromic Magic Photo Mug",
    price: 349,
    mrp: 449,
    image: "/products/mug-sample-couple.jpg",
    category: "Ceramic Drinkware",
    link: "/products/mugs/magic-photo-mug",
    badge: "Heat Reveal",
    rating: "4.8",
    reviews: 92,
  },
  {
    id: "dwarkadhish",
    name: "Shri Dwarkadhish Mandir Murti",
    price: 899,
    mrp: 1199,
    image: "/deities/shrinathji.jpg",
    category: "Devotional Sanctum",
    link: "/products/devotional/dwarkadhish",
    badge: "Sacred Darshan",
    rating: "5.0",
    reviews: 47,
  },
  {
    id: "couple-story",
    name: "Couple Story Keepsake Magazine",
    price: 1299,
    mrp: 1699,
    image: "/products/magazine-cover.jpg",
    category: "Editorial Photobook",
    link: "/products/magazines/couple-story",
    badge: "20 Pages",
    rating: "4.9",
    reviews: 38,
  },
];

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
    a: "Rajmoti Studio is based in Jetpur, Gujarat, PIN 360370. For our exact location and directions, please contact us on WhatsApp or use our verified Google Maps business profile.",
  },
  {
    q: "What photo frame sizes and materials are available?",
    a: "Rajmoti Studio crafts photo framing and personalized gifts in standard and custom sizes: 8×12, 10×14, 10×10 square, 12×18, 14×20, 16×24, 18×24, and 20×30 inches. Available materials include Natural Teak Finish Wood, Matte Charcoal Black, Cast Acrylic with standoff studs, and Inner Sparkle inlays.",
  },
  {
    q: "Can I customize gifts with my own photographs?",
    a: "Yes. Every keepsake can be personalized. You can preview your photos directly in your browser using our client-side personalizer, or share high-resolution files with us over WhatsApp for professional retouching and typography.",
  },
  {
    q: "How does payment and fulfillment work?",
    a: "We offer two clear fulfilment options. For Studio Pickup in Jetpur, you can pay online or at our counter. For Home Delivery across Gujarat, 100% online prepayment via UPI (9429070317@apl · Pankaj Laxmichand Sakhija) is verified prior to dispatch. We do not offer cash on delivery.",
  },
  {
    q: "How fast can I receive my personalized gift in Jetpur?",
    a: "For standard photo frames, ceramic mugs, and keychains, we support Same-Day Studio Pickup in Jetpur within 2 to 4 hours when ordered before 2:00 PM.",
  },
  {
    q: "Do you offer photo restoration for old family photographs?",
    a: "Yes. We specialize in delicate digital restoration for vintage, torn, or faded family portraits, preserving genuine facial likeness while removing stains and tears.",
  },
];

function Home() {
  const { data: content = {} } = useQuery(siteContentQuery);
  const candidate = content.hero?.images?.[0] || content.hero?.fallback_image;
  const customHero = candidate && !candidate.startsWith("/demo/") ? candidate : null;
  const [styles] = useStyles();

  // Booking Modal State
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedService, setSelectedService] = useState("baby");

  const openBooking = (serviceId = "baby") => {
    setSelectedService(serviceId);
    setBookingOpen(true);
    trackEvent("page_view", { serviceId });
  };

  return (
    <div className="editorial bg-[#FCFAF6] text-stone-900">
      <SiteNav />

      <main>
        {/* 1. SECTION 1: PREMIUM EMOTION-DRIVEN HERO */}
        <section className="ed-wrap home-hero pt-8 pb-12 sm:pb-16">
          <div className="home-hero-copy">
            <p className="ed-kicker flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-700" /> Jetpur, Gujarat · Since 1982
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-stone-950 leading-[1.1]">
              Every Memory Deserves
              <br />
              <em>Something Beautiful.</em>
            </h1>
            <p className="ed-copy text-stone-600 max-w-xl text-sm sm:text-base leading-relaxed mt-3">
              Personalized Gifts, Beautiful Prints & Fine-Art Photography crafted around your most cherished family moments. Hand-finished with patience and 40+ years of studio trust.
            </p>
            <div className="ed-actions flex flex-wrap items-center gap-3 mt-6">
              <Link
                to="/products"
                onClick={() => trackEvent("select_occasion", { occasion: "hero_explore_gifts" })}
                className="ed-button flex items-center gap-2 bg-[#29251F] text-amber-100 hover:bg-stone-900 shadow-md py-3 px-6 rounded-xl text-sm font-bold"
              >
                <span>Explore Personalized Gifts</span>
                <Gift size={16} />
              </Link>
              <button
                type="button"
                onClick={() => openBooking("baby")}
                className="ed-button outline flex items-center gap-2 border-stone-300 text-stone-800 hover:bg-stone-100 py-3 px-5 rounded-xl text-sm font-semibold"
              >
                <span>Book Photography</span>
                <Calendar size={15} />
              </button>
              <a
                className="ed-text-button text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1.5 ml-1"
                href={whatsappLink(waMessage.booking())}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle size={15} /> WhatsApp Us Directly
              </a>
            </div>
            <div className="hero-signature mt-6 pt-4 border-t border-stone-200 text-xs text-stone-500 font-mono flex items-center gap-2">
              <span className="signature-line w-8 h-px bg-amber-800/40 inline-block" />
              Direct studio craftsmanship in Jetpur. Preserved for generations.
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
                alt="Rajmoti Studio fine-art family heirloom portrait in Jetpur"
                className="rounded-3xl shadow-xl border border-stone-200 object-cover"
              />
            </picture>
            <div className="photo-note text-xs bg-stone-900/85 text-amber-100 backdrop-blur-xs p-3 rounded-xl shadow-lg border border-amber-900/20">
              Your Favourite Moment.
              <br />
              <em className="text-amber-300">Turned into a lasting keepsake.</em>
            </div>
          </figure>
        </section>

        {/* Heritage Trust Ribbon */}
        <div className="ed-wrap py-3 border-y border-stone-200/80 bg-[#FAF7F1] flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-stone-600">
          <span>Est. 1982 in Jetpur</span>
          <span>Archival 12-Color Pigment Inks</span>
          <span>Hand-Finished Wood & Optical Acrylic</span>
          <span>Verified Prepayment & Jetpur Pickup</span>
        </div>

        {/* 2. SECTION 2: SHOP BY OCCASION */}
        <section className="ed-wrap py-12 sm:py-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8">
            <div>
              <p className="ed-kicker flex items-center gap-1.5 text-amber-900 uppercase font-semibold text-xs tracking-wider">
                <Sparkles size={14} className="text-amber-700" /> Milestone Celebrations
              </p>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-stone-900 mt-1">
                Shop by Occasion
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 mt-1">
                Every milestone has its story. Find the keepsake made to celebrate it.
              </p>
            </div>
            <Link
              to="/products"
              className="text-xs font-semibold text-amber-900 hover:text-stone-950 flex items-center gap-1"
            >
              <span>View All Occasions</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {OCCASIONS.map((occ) => (
              <Link
                key={occ.id}
                to={occ.link}
                onClick={() => trackEvent("select_occasion", { occasion: occ.id })}
                className="group relative aspect-[3/4] rounded-2xl overflow-hidden border border-stone-200 shadow-2xs hover:shadow-lg transition-all"
              >
                <img
                  src={occ.image}
                  alt={occ.name}
                  className="size-full object-cover group-hover:scale-106 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/20 to-transparent flex flex-col justify-end p-3.5 text-white">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-amber-300 mb-0.5">
                    {occ.tag}
                  </span>
                  <h3 className="font-display font-bold text-sm leading-tight text-white group-hover:text-amber-200 transition-colors">
                    {occ.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 3. SECTION 3: SHOP BY RECIPIENT */}
        <section className="ed-wrap py-10 bg-white rounded-3xl border border-stone-200 p-6 sm:p-10 my-6 shadow-xs">
          <div className="mb-6">
            <p className="ed-kicker text-amber-900 text-xs font-semibold uppercase tracking-wider">
              Thoughtful Gifting
            </p>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-stone-900 mt-1">
              Shop by Recipient
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Curated gift collections tailored to the people you love most.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {RECIPIENTS.map((rec, i) => (
              <Link
                key={i}
                to={rec.link}
                onClick={() => trackEvent("select_recipient", { recipient: rec.label })}
                className="group p-4 rounded-2xl border border-stone-200 hover:border-amber-800 bg-[#FAF7F1] hover:bg-white transition-all flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-mono font-bold text-amber-900 uppercase tracking-wider block mb-1">
                    {rec.count}
                  </span>
                  <h3 className="font-display font-bold text-stone-900 text-base group-hover:text-amber-900 transition-colors">
                    {rec.label}
                  </h3>
                  <p className="text-xs text-stone-500 mt-1 leading-snug">{rec.desc}</p>
                </div>
                <div className="mt-4 pt-2.5 border-t border-stone-200/60 flex items-center justify-between text-xs font-semibold text-amber-900">
                  <span>Explore Gifts</span>
                  <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 4. SECTION 4: SMART GIFT FINDER (4 QUESTIONS) */}
        <section className="ed-wrap my-12">
          <GiftFinder />
        </section>

        {/* 5. SECTION 5: PERSONALIZED BESTSELLERS */}
        <section className="ed-wrap py-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8">
            <div>
              <p className="ed-kicker flex items-center gap-1.5 text-amber-900 uppercase font-semibold text-xs tracking-wider">
                <Heart size={14} className="text-red-600 fill-red-600" /> Cherished by Saurashtra Families
              </p>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-stone-900 mt-1">
                Personalized Bestsellers
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 mt-1">
                Our most frequently ordered keepsakes, handcrafted in Jetpur with archival precision.
              </p>
            </div>
            <Link
              to="/products"
              className="text-xs font-semibold text-amber-900 hover:text-stone-950 flex items-center gap-1"
            >
              <span>See Full Catalogue (110 Products)</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURED_BESTSELLERS.map((item) => (
              <div
                key={item.id}
                className="group bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-xl hover:border-amber-800 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="size-full object-cover group-hover:scale-104 transition-transform duration-500"
                    />
                    <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-stone-900/85 text-amber-100 backdrop-blur-xs">
                      {item.badge}
                    </span>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center gap-1 text-xs text-amber-700 font-semibold mb-1">
                      <Star size={12} className="fill-amber-500 text-amber-500" />
                      <span>{item.rating}</span>
                      <span className="text-stone-400 font-normal">({item.reviews} reviews)</span>
                    </div>
                    <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block">
                      {item.category}
                    </span>
                    <h3 className="font-display font-bold text-stone-900 text-base mt-0.5 group-hover:text-amber-900 transition-colors">
                      {item.name}
                    </h3>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <div className="pt-3 border-t border-stone-100 flex items-baseline justify-between mb-3">
                    <div>
                      <span className="text-[10px] text-stone-400 block font-medium">All-inclusive:</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-display font-bold text-stone-950">₹{item.price}</span>
                        <span className="text-xs text-stone-400 font-mono line-through">₹{item.mrp}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                      Save ₹{item.mrp - item.price}
                    </span>
                  </div>

                  <Link
                    to={item.link}
                    onClick={() => trackEvent("view_item", { itemId: item.id, itemName: item.name, price: item.price })}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#29251F] text-amber-100 hover:bg-stone-900 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 text-center shadow-2xs"
                  >
                    <span>Personalize & Order</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. SECTION 6: CREATE YOUR OWN GIFT (PHOTO UPLOAD CALLOUT) */}
        <section className="ed-wrap my-10">
          <div className="rounded-3xl bg-gradient-to-r from-[#29251F] via-[#383129] to-[#29251F] text-amber-100 p-8 sm:p-12 relative overflow-hidden shadow-xl border border-amber-900/30">
            <div className="max-w-2xl relative z-10 space-y-3">
              <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-amber-400 block">
                IN-BROWSER CREATOR STUDIO
              </span>
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-white leading-tight">
                Upload Your Favourite Photo.
                <br />
                <em>We'll Help Turn It Into Something Beautiful.</em>
              </h2>
              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed max-w-xl">
                Fit your family portrait or wedding photo in real-time, test print-safe margins, inspect resolution sharpness, and preview living room wall scale with zero external uploads.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-3">
                <Link
                  to="/products/frames/royal-heritage"
                  className="py-3 px-6 rounded-xl bg-amber-100 text-stone-950 hover:bg-white text-xs font-bold shadow-md flex items-center gap-2 transition-all hover:scale-102"
                >
                  <Upload size={14} />
                  <span>Try Photo Personalizer</span>
                </Link>
                <a
                  href={whatsappLink("Namaste Rajmoti Studio! 🖼️ I have a photo and would like advice on framing size and finish.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-5 rounded-xl border border-amber-300/30 text-amber-200 hover:bg-white/10 text-xs font-semibold flex items-center gap-2 transition-colors"
                >
                  <MessageCircle size={15} />
                  <span>Send Photo for Framing Advice</span>
                </a>
              </div>
            </div>

            <div className="absolute right-[-40px] bottom-[-40px] opacity-15 pointer-events-none hidden md:block">
              <Upload size={280} className="text-amber-100" />
            </div>
          </div>
        </section>

        {/* 7. SECTION 7: FINE-ART PHOTOGRAPHY SERVICES */}
        <section className="ed-wrap py-12 sm:py-16">
          <div className="ed-section-heading mb-8">
            <div>
              <p className="ed-kicker flex items-center gap-1.5 text-amber-900 uppercase font-semibold text-xs tracking-wider">
                <CameraIcon size={14} className="text-amber-700" /> Professional Studio Sessions
              </p>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-stone-900 mt-1">
                Fine-Art Studio Photography
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 mt-1">
                Every chapter deserves a place. Handcrafted sessions photographed in Jetpur.
              </p>
            </div>
            <Link to="/portfolios" className="ed-text-button text-xs font-semibold text-amber-900 hover:text-stone-950 flex items-center gap-1">
              See all collections <ArrowUpRight size={15} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PHOTOGRAPHY_CATEGORIES.map((c, i) => (
              <div
                key={c.slug}
                className="group rounded-3xl bg-white border border-stone-200 hover:border-amber-800 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
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

        {/* 8. SECTION 8: WHY CHOOSE RAJMOTI STUDIO? */}
        <section className="ed-wrap py-12 bg-white rounded-3xl border border-stone-200 p-8 sm:p-12 my-6 shadow-xs">
          <div className="max-w-2xl mb-8">
            <p className="ed-kicker text-amber-900 text-xs font-semibold uppercase tracking-wider">
              Studio Provenance
            </p>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-stone-900 mt-1">
              Why Families in Saurashtra Choose Rajmoti
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              We are not a dropshipping reseller. We are an authentic photography lab with over four decades of crafting heirlooms in Jetpur.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-[#FAF7F1] border border-stone-200/80 space-y-2">
              <ShieldCheck size={22} className="text-amber-800" />
              <h3 className="font-display font-bold text-stone-900 text-base">40+ Years of Heritage</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Founded in 1982 in Jetpur. Three generations of family milestones, weddings, and memories preserved with archival care.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FAF7F1] border border-stone-200/80 space-y-2">
              <Layers size={22} className="text-amber-800" />
              <h3 className="font-display font-bold text-stone-900 text-base">In-House Production</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Every frame, canvas wrap, and 3D mug is printed and assembled directly in our Jetpur workshop with precision quality checks.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FAF7F1] border border-stone-200/80 space-y-2">
              <Sparkles size={22} className="text-amber-800" />
              <h3 className="font-display font-bold text-stone-900 text-base">Archival Pigment Printing</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                12-color archival pigment inks on acid-free photographic paper, guaranteed to resist fading and yellowing for decades.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FAF7F1] border border-stone-200/80 space-y-2">
              <Clock size={22} className="text-amber-800" />
              <h3 className="font-display font-bold text-stone-900 text-base">Same-Day Jetpur Service</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Need an urgent gift? Order standard frames or mugs before 2 PM and collect ready-to-gift keepsakes in 2 to 4 hours.
              </p>
            </div>
          </div>
        </section>

        {/* 9. SECTION 9: REAL CUSTOMER STORIES */}
        <section className="ed-wrap py-12">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="ed-kicker text-amber-900 uppercase font-semibold text-xs tracking-wider">
              Heartfelt Memories
            </p>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-stone-900 mt-1">
              Cherished in Gujarati Homes
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Real stories from families across Jetpur, Rajkot, Gondal, and Saurashtra.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-2xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex text-amber-500 mb-2">★★★★★</div>
                <p className="text-xs sm:text-sm text-stone-700 italic leading-relaxed">
                  "For our 25th anniversary, we framed our original wedding photograph in the Natural Teak Wood frame. The print clarity and finish brought back all the emotions of that day."
                </p>
              </div>
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                <div>
                  <strong className="text-stone-900 block">Pankaj &amp; Geeta S.</strong>
                  <span className="text-stone-400">Jetpur, Gujarat</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                  Verified Order
                </span>
              </div>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-2xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex text-amber-500 mb-2">★★★★★</div>
                <p className="text-xs sm:text-sm text-stone-700 italic leading-relaxed">
                  "The thermochromic magic mug was an instant hit for my sister’s birthday. As soon as hot chai was poured, her baby's picture appeared with crisp colors. Truly memorable!"
                </p>
              </div>
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                <div>
                  <strong className="text-stone-900 block">Dhaval Patel</strong>
                  <span className="text-stone-400">Rajkot</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                  Verified Order
                </span>
              </div>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-2xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex text-amber-500 mb-2">★★★★★</div>
                <p className="text-xs sm:text-sm text-stone-700 italic leading-relaxed">
                  "We ordered the Backlit LED Translight of Shri Dwarkadhish for our new home mandir. The warm aura and even lighting create a deeply peaceful divine presence."
                </p>
              </div>
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                <div>
                  <strong className="text-stone-900 block">Bhavik Vaishnav</strong>
                  <span className="text-stone-400">Junagadh</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                  Verified Order
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 10. SECTION 10: LOCAL STUDIO GUIDE, FAQS & LOCATION */}
        <section className="ed-wrap ed-section py-12">
          <div className="ed-section-heading mb-6">
            <div>
              <p className="ed-kicker">Studio Guidance &amp; FAQ</p>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-stone-900 mt-1">
                Everything You Need to Know
              </h2>
            </div>
            <p className="ed-copy narrow text-xs text-stone-500">
              Verified operational details, framing materials, and ordering procedures at Rajmoti Studio Jetpur.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {LOCAL_FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-2"
              >
                <h3 className="font-display text-base font-bold text-stone-900">{faq.q}</h3>
                <p className="text-xs text-stone-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Local Studio Identity Banner */}
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
                Photography, photo printing, personalized frames and thoughtful photo gifts in Jetpur, Gujarat 360370. For directions, visiting hours, or custom orders, contact us on WhatsApp.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <a
                href="https://maps.app.goo.gl/nYgKFSidpihg1Nft6"
                target="_blank"
                rel="noopener noreferrer"
                className="ed-button flex items-center justify-center gap-2 bg-amber-100 text-stone-950 hover:bg-white text-xs py-3 px-5 font-bold shadow-xs whitespace-nowrap rounded-xl"
              >
                <ArrowRight size={15} />
                <span>Get Directions (Google Maps)</span>
              </a>
              <a
                href={whatsappLink(waMessage.general())}
                target="_blank"
                rel="noopener noreferrer"
                className="ed-button flex items-center justify-center gap-2 bg-[#25D366] text-white border-[#25D366] hover:bg-[#20b858] text-xs py-3 px-5 shadow-xs whitespace-nowrap rounded-xl"
              >
                <MessageCircle size={16} />
                <span>WhatsApp Our Desk</span>
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

function CameraIcon(props: React.SVGProps<SVGSVGElement> & { size?: number }) {
  const s = props.size || 16;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}
