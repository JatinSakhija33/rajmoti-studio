import { useMemo, useState, useRef } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowUpRight,
  ArrowRight,
  Search,
  SlidersHorizontal,
  X,
  Check,
  Plus,
  Minus,
  Download,
  Layers,
  Heart,
  Package,
  Scale,
  MessageCircle,
  Upload,
  AlertCircle,
  Sparkles,
  Coffee,
  SunMedium,
  Flame,
  BookOpen,
  Smartphone,
  ShoppingBag,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { SITE, whatsappLink } from "@/lib/site";
import {
  categories,
  useProducts,
  useQuote,
  exportCatalogue,
  type Product,
  type QuoteLine,
} from "./store";
import { FrameCollageCanvas } from "./live-preview/FrameCollageCanvas";
import { ThreePhotoMug } from "./live-preview/ThreePhotoMug";
import { TranslightPreview } from "./live-preview/TranslightPreview";
import { GodsCollection } from "./live-preview/GodsCollection";
import { CoupleMagazineFlipbook } from "./live-preview/CoupleMagazineFlipbook";
import { PhoneCoverCustomizer } from "./live-preview/PhoneCoverCustomizer";
import { KeychainCustomizer } from "./live-preview/KeychainCustomizer";
import { GiftFinder } from "./GiftFinder";
import { WallSizeVisualizer } from "./WallSizeVisualizer";
import { BundleShowcase } from "./BundleShowcase";
import { CheckoutDialog } from "./CheckoutDialog";
import { calculateVariantPriceInr } from "@/lib/pricing";
import { toast } from "sonner";

const initial = {
  category: "",
  material: "",
  shape: "",
  size: "",
  printing: "",
  capacity: "",
  usage: "",
  personalisation: "",
  occasion: "",
  recipient: "",
  availability: "",
};
type Filters = typeof initial;
function normal(s: string) {
  return s
    .toLowerCase()
    .replace(/[×x]/g, "x")
    .replace(/\s+/g, "")
    .replace(/inches|inch/g, "in");
}
function getCategorySampleImage(cat: string, prodId: string): string {
  const pId = prodId.toLowerCase();
  if (cat === "drinkware" || pId.includes("mug")) return "/products/mug-sample-couple.jpg";
  if (cat === "led" || pId.includes("translight")) return "/products/translight-sample.jpg";
  if (cat === "gods-collection" || cat === "devotional" || pId.includes("deity")) return "/deities/shrinathji.jpg";
  if (cat === "magazines" || pId.includes("mag")) return "/products/magazine-cover.jpg";
  if (cat === "acrylic") return "/products/frame-sample-anniversary.jpg";
  if (cat === "canvas") return "/products/frame-sample-family.jpg";
  if (cat === "prints") return "/products/frame-sample-baby.jpg";
  return "/products/frame-sample-wedding.jpg";
}

export function Catalogue({
  productId,
  initialCategory = "",
  initialOccasion = "",
  initialSearch = "",
}: {
  productId?: string;
  initialCategory?: string;
  initialOccasion?: string;
  initialSearch?: string;
}) {
  const [products] = useProducts();
  const [quote, setQuote] = useQuote();
  const navigate = useNavigate();
  const [q, setQ] = useState(initialSearch);
  const [filters, setFilters] = useState<Filters>({
    ...initial,
    category: initialCategory,
    occasion: initialOccasion,
  });
  const [sort, setSort] = useState("featured");
  const [showFilters, setShowFilters] = useState(false);
  const [shown, setShown] = useState(12);
  const [compare, setCompare] = useState<string[]>([]);
  const [comparing, setComparing] = useState(false);
  const [showQuote, setShowQuote] = useState(false);
  const [activeStudio, setActiveStudio] = useState<
    "frames" | "mugs" | "translight" | "devotional" | "magazines" | "covers" | "keychains" | null
  >(null);
  const activeProduct = products.find((p) => p.id === productId);
  const lastProduct = useRef<Product | undefined>(undefined);
  if (activeProduct) lastProduct.current = activeProduct;
  const product = productId ? activeProduct : lastProduct.current;
  const matching = useMemo(
    () =>
      products
        .filter((p) => {
          const term = normal(q);
          const hay = normal(
            [
              p.name,
              p.id,
              p.material,
              p.shape,
              p.type,
              categories.find((c) => c.id === p.category)?.name,
              p.printing,
              ...p.variants.flatMap((v) => [v.size, v.metric || "", v.thickness, v.id]),
            ].join(" "),
          );
          return (
            (!q || hay.includes(term)) &&
            (!filters.category || p.category === filters.category) &&
            (!filters.material || p.material === filters.material) &&
            (!filters.shape || p.shape === filters.shape) &&
            (!filters.size || p.variants.some((v) => v.size === filters.size)) &&
            (!filters.printing || p.printing === filters.printing) &&
            (!filters.capacity || p.photoCapacity === filters.capacity) &&
            (!filters.usage || p.usage === filters.usage) &&
            (!filters.personalisation || p.personalisation.includes(filters.personalisation)) &&
            (!filters.occasion || p.occasions.includes(filters.occasion)) &&
            (!filters.recipient || p.recipients.includes(filters.recipient)) &&
            (!filters.availability || p.availability === filters.availability)
          );
        })
        .sort((a, b) =>
          sort === "az"
            ? a.name.localeCompare(b.name)
            : sort === "variants"
              ? b.variants.length - a.variants.length
              : 0,
        ),
    [products, q, filters, sort],
  );
  const update = (key: keyof Filters, value: string) => {
    setFilters((f) => {
      // Prevent mutually exclusive zero-result combinations
      if (key === "category") {
        if (value === "gods-collection" || value === "corporate") {
          return { ...f, category: value, occasion: "", recipient: "", usage: "" };
        }
        return { ...f, category: value };
      }
      if (key === "occasion") {
        if (f.category === "gods-collection" || f.category === "corporate") {
          return { ...f, category: "", [key]: value };
        }
        return { ...f, [key]: value };
      }
      return { ...f, [key]: value };
    });
    setShown(12);
  };
  const open = (id?: string) =>
    navigate({ to: "/products", search: { product: id }, resetScroll: false });
  function toggleCompare(id: string) {
    setCompare((list) => {
      if (list.includes(id)) return list.filter((x) => x !== id);
      if (list.length === 3) {
        toast.info("Compare up to three products at a time.");
        return list;
      }
      return [...list, id];
    });
  }
  function add(line: QuoteLine) {
    const existing = quote.findIndex(
      (x) =>
        x.productId === line.productId &&
        x.variantId === line.variantId &&
        x.personalisation === line.personalisation &&
        x.packaging === line.packaging &&
        x.orderType === line.orderType,
    );
    const next = [...quote];
    if (existing >= 0)
      next[existing] = {
        ...line,
        quantity: Math.min(9999, quote[existing].quantity + line.quantity),
      };
    else next.push(line);
    setQuote(next);
    toast.success("Added to your gift shortlist — confirm final details with the studio");
    open(undefined);
  }
  const active = Object.entries(filters).filter(([, v]) => v);
  const reset = () => {
    setFilters(initial);
    setQ("");
    setShown(12);
  };
  return (
    <div className="editorial">
      <SiteNav />
      <main>
        <section className="gift-intro ed-wrap">
          <div>
            <p className="ed-kicker">Rajmoti Studio · Jetpur</p>
            <h1>
              Made personal.
              <br />
              <em>Made to keep.</em>
            </h1>
            <p className="ed-copy">
              A beautiful home for your photographs, favorite people and meaningful moments. Explore handcrafted frames, rotatable 3D mugs, devotional sanctums, and editorial magazines.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <button
                type="button"
                className="ed-button"
                onClick={() => setActiveStudio("frames")}
              >
                Explore Frames <ArrowRight size={16} />
              </button>
              <a className="ed-button outline" href="#gift-finder">
                Find a Gift
              </a>
              <button
                type="button"
                className="ed-button outline"
                onClick={() => setActiveStudio("devotional")}
              >
                Devotional Collection
              </button>
              <Link
                to="/same-day"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold bg-[#FAF4ED] text-amber-900 border border-amber-800/30 hover:bg-amber-100 transition-colors"
              >
                <Sparkles size={13} className="text-amber-600" />
                Same-Day in Jetpur (2–4 hrs)
              </Link>
            </div>
            <div className="ed-inline-facts mt-6">
              <span>Personalized keepsakes</span>
              <span>{products.length} catalogue items</span>
              <span>Personal proofing on WhatsApp</span>
            </div>
          </div>
          <figure className="gift-intro-image">
            <img
              src="/products/frame-sample-wedding.jpg"
              width="1536"
              height="1024"
              alt="Handcrafted archival frames, acrylic blocks and keepsakes"
              className="object-cover rounded-2xl shadow-xl"
            />
            <figcaption>
              Authentic keepsake photography handcrafted at Rajmoti Studio Jetpur
            </figcaption>
          </figure>
        </section>

        {/* 1. FIVE LARGE VISUAL ENTRY CARDS */}
        <section className="ed-wrap my-10">
          <div className="mb-6">
            <p className="ed-kicker flex items-center gap-1.5 text-amber-900 font-semibold text-xs tracking-wider uppercase">
              <Sparkles size={14} className="text-amber-700" /> Curated Studio Departments
            </p>
            <h2 className="text-3xl sm:text-4xl font-display text-stone-900 mt-1">
              Explore by Department
            </h2>
            <p className="text-sm text-stone-600 mt-1 max-w-2xl leading-relaxed">
              Every item is handcrafted in our Jetpur workshop with authentic Saurashtra materials. Choose a department below or preview live with your own photos.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {/* Card 1: Personalized Gifts */}
            <div className="group rounded-2xl bg-white border border-stone-200 hover:border-amber-700 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between">
              <Link to="/products/gifts" className="block relative aspect-[4/3] bg-stone-900 overflow-hidden">
                <img
                  src="/products/mug-sample-couple.jpg"
                  alt="Personalized Gifts"
                  className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2.5 left-2.5 bg-stone-900/80 backdrop-blur-md text-amber-100 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                  Personalized Gifts
                </div>
              </Link>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <Link to="/products/gifts" className="font-display text-lg font-bold text-stone-900 group-hover:text-amber-900 transition-colors block">
                    Personalized Gifts
                  </Link>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    Anniversary, birthday, couples, keepsakes, magic mugs & keychains.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <Link to="/products/gifts" className="font-semibold text-amber-800 flex items-center gap-1 hover:underline">
                    View gifts <ArrowRight size={13} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setActiveStudio("mugs")}
                    className="text-[11px] font-medium text-stone-500 hover:text-stone-900"
                  >
                    Mug 3D
                  </button>
                </div>
              </div>
            </div>

            {/* Card 2: Devotional Photos */}
            <div className="group rounded-2xl bg-white border border-stone-200 hover:border-amber-700 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between">
              <Link to="/products/devotional" className="block relative aspect-[4/3] bg-[#16283D] overflow-hidden">
                <img
                  src="/deities/shrinathji.jpg"
                  alt="Devotional Photos"
                  className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2.5 left-2.5 bg-stone-900/80 backdrop-blur-md text-amber-100 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                  Devotional Photos
                </div>
              </Link>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <Link to="/products/devotional" className="font-display text-lg font-bold text-stone-900 group-hover:text-amber-900 transition-colors block">
                    Devotional Photos
                  </Link>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    Pavitra Gujarati deities in Acrylic, Teak Frame & LED Translight.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <Link to="/products/devotional" className="font-semibold text-amber-800 flex items-center gap-1 hover:underline">
                    Sacred Sanctum <ArrowRight size={13} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setActiveStudio("devotional")}
                    className="text-[11px] font-medium text-stone-500 hover:text-stone-900"
                  >
                    Darshan
                  </button>
                </div>
              </div>
            </div>

            {/* Card 3: Frames & Prints */}
            <div className="group rounded-2xl bg-white border border-stone-200 hover:border-amber-700 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between">
              <Link to="/products/frames" className="block relative aspect-[4/3] bg-stone-100 overflow-hidden">
                <img
                  src="/products/frame-sample-wedding.jpg"
                  alt="Frames & Prints"
                  className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2.5 left-2.5 bg-stone-900/80 backdrop-blur-md text-amber-100 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                  Frames & Prints
                </div>
              </Link>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <Link to="/products/frames" className="font-display text-lg font-bold text-stone-900 group-hover:text-amber-900 transition-colors block">
                    Frames & Prints
                  </Link>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    Single, triptych, 4-grid & family-5 collages. 8×12 to 20×30 in.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <Link to="/products/frames" className="font-semibold text-amber-800 flex items-center gap-1 hover:underline">
                    View Frames <ArrowRight size={13} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setActiveStudio("frames")}
                    className="text-[11px] font-medium text-stone-500 hover:text-stone-900"
                  >
                    Frame Studio
                  </button>
                </div>
              </div>
            </div>

            {/* Card 4: Magazines & Albums */}
            <div className="group rounded-2xl bg-white border border-stone-200 hover:border-amber-700 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between">
              <Link to="/products/magazines" className="block relative aspect-[4/3] bg-[#1E1916] overflow-hidden flex items-center justify-center p-2">
                <img
                  src="/products/magazine-cover.jpg"
                  alt="Magazines & Albums"
                  className="h-full aspect-[2/3] object-cover rounded shadow-lg group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2.5 left-2.5 bg-stone-900/80 backdrop-blur-md text-amber-100 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                  Magazines & Albums
                </div>
              </Link>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <Link to="/products/magazines" className="font-display text-lg font-bold text-stone-900 group-hover:text-amber-900 transition-colors block">
                    Magazines & Albums
                  </Link>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    8–20 curated photographs with vows, custom dates & song QR code.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <Link to="/products/magazines" className="font-semibold text-amber-800 flex items-center gap-1 hover:underline">
                    Flipbooks <ArrowRight size={13} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setActiveStudio("magazines")}
                    className="text-[11px] font-medium text-stone-500 hover:text-stone-900"
                  >
                    Page Flip
                  </button>
                </div>
              </div>
            </div>

            {/* Card 5: Customized Accessories */}
            <div className="group rounded-2xl bg-white border border-stone-200 hover:border-amber-700 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between">
              <Link to="/products/phone-covers" className="block relative aspect-[4/3] bg-stone-100 overflow-hidden flex items-center justify-center">
                <img
                  src="/products/frame-sample-family.jpg"
                  alt="Customized Accessories"
                  className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2.5 left-2.5 bg-stone-900/80 backdrop-blur-md text-amber-100 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                  Accessories
                </div>
              </Link>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <Link to="/products/phone-covers" className="font-display text-lg font-bold text-stone-900 group-hover:text-amber-900 transition-colors block">
                    Customized Accessories
                  </Link>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    Phone covers, acrylic keychains, and pocket keepsakes.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <Link to="/products/phone-covers" className="font-semibold text-amber-800 flex items-center gap-1 hover:underline">
                    Accessories <ArrowRight size={13} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setActiveStudio("covers")}
                    className="text-[11px] font-medium text-stone-500 hover:text-stone-900"
                  >
                    Case Studio
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. FEATURED GIFTS SPOTLIGHT */}
        <section className="ed-wrap my-10">
          <div className="bg-[#FAF7F1] border border-stone-300 rounded-3xl p-6 sm:p-10 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
              <div>
                <p className="ed-kicker flex items-center gap-1 text-amber-900 font-semibold text-xs tracking-wider uppercase">
                  <Heart size={14} className="text-amber-700" /> Handpicked by Pankajbhai
                </p>
                <h2 className="text-2xl sm:text-3xl font-display text-stone-900 mt-1">
                  Featured Keepsakes
                </h2>
                <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-xl">
                  Our most cherished items, ordered time and again by families in Jetpur and Saurashtra.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("directory");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="text-xs font-semibold text-amber-900 hover:text-amber-800 flex items-center gap-1 self-start sm:self-auto"
              >
                Shop All Catalogue ({products.length}) <ArrowRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Featured 1 */}
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between">
                <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                  <img
                    src="/products/frame-sample-wedding.jpg"
                    alt="Royal Heritage Wedding Frame"
                    className="size-full object-cover"
                  />
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-stone-900/80 text-amber-100">
                    Bestseller
                  </span>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-display font-bold text-stone-900 text-base">Royal Heritage Wedding Frame</h3>
                    <p className="text-xs text-stone-600 mt-1">Hand-finished teak border with anti-reflective archival acrylic.</p>
                    <div className="mt-2 text-xs font-mono text-stone-500">12×18 in · From ₹1,499</div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveStudio("frames")}
                      className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-[#29251F] text-amber-100 hover:bg-stone-800 transition-colors text-center"
                    >
                      Customise
                    </button>
                    <button
                      type="button"
                      onClick={() => open("wooden-frame-12x18")}
                      className="py-1.5 px-3 rounded-lg text-xs font-medium border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors"
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>

              {/* Featured 2 */}
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between">
                <div className="relative aspect-[4/3] overflow-hidden bg-stone-900">
                  <img
                    src="/products/mug-sample-couple.jpg"
                    alt="Thermochromic Magic Photo Mug"
                    className="size-full object-cover"
                  />
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-950/80 text-amber-200">
                    Magic Heat Reveal
                  </span>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-display font-bold text-stone-900 text-base">Thermochromic Magic Mug</h3>
                    <p className="text-xs text-stone-600 mt-1">Pitch black when cold; reveals your couple photograph when hot chai is poured.</p>
                    <div className="mt-2 text-xs font-mono text-stone-500">325 ml · ₹349</div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveStudio("mugs")}
                      className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-[#29251F] text-amber-100 hover:bg-stone-800 transition-colors text-center"
                    >
                      3D Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => open("magic-photo-mug")}
                      className="py-1.5 px-3 rounded-lg text-xs font-medium border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors"
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>

              {/* Featured 3 */}
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between">
                <div className="relative aspect-[4/3] overflow-hidden bg-[#16283D]">
                  <img
                    src="/deities/shrinathji.jpg"
                    alt="Shri Dwarkadhish Mandir Murti"
                    className="size-full object-cover"
                  />
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-900/80 text-amber-100">
                    Sacred Darshan
                  </span>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-display font-bold text-stone-900 text-base">Shri Dwarkadhish Mandir Murti</h3>
                    <p className="text-xs text-stone-600 mt-1">Consecrated high-gloss cast acrylic with Gujarati mantra inscription.</p>
                    <div className="mt-2 text-xs font-mono text-stone-500">8×12 in · ₹899</div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-2">
                    <Link
                      to="/products/devotional/dwarkadhish"
                      className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-[#29251F] text-amber-100 hover:bg-stone-800 transition-colors text-center"
                    >
                      View Sanctum
                    </Link>
                    <button
                      type="button"
                      onClick={() => setActiveStudio("devotional")}
                      className="py-1.5 px-3 rounded-lg text-xs font-medium border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors"
                    >
                      Preview
                    </button>
                  </div>
                </div>
              </div>

              {/* Featured 4 */}
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between">
                <div className="relative aspect-[4/3] overflow-hidden bg-[#1E1916] flex items-center justify-center p-2">
                  <img
                    src="/products/magazine-cover.jpg"
                    alt="Couple Story Keepsake Magazine"
                    className="h-full aspect-[2/3] object-cover rounded shadow"
                  />
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-stone-900/80 text-amber-100">
                    Editorial Keepsake
                  </span>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-display font-bold text-stone-900 text-base">Couple Story Keepsake Magazine</h3>
                    <p className="text-xs text-stone-600 mt-1">8–20 curated photos with vows, milestone dates and scanned song QR.</p>
                    <div className="mt-2 text-xs font-mono text-stone-500">20 Pages · From ₹1,299</div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveStudio("magazines")}
                      className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-[#29251F] text-amber-100 hover:bg-stone-800 transition-colors text-center"
                    >
                      Flipbook
                    </button>
                    <Link
                      to="/products/magazines/couple-story"
                      className="py-1.5 px-3 rounded-lg text-xs font-medium border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. GIFTS BY OCCASION */}
        <section className="ed-wrap my-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <p className="ed-kicker">Find gifts by milestone</p>
              <h2 className="text-2xl font-display text-stone-900">Gifts by Occasion</h2>
            </div>
            <p className="text-xs text-stone-500">Filter catalogue to celebrate moments that matter</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "", label: "All Occasions" },
              { id: "anniversary", label: "Anniversary & Couples" },
              { id: "birthday", label: "Birthday & Milestones" },
              { id: "wedding", label: "Wedding & Reception" },
              { id: "griha-pravesh", label: "Griha Pravesh (Housewarming)" },
              { id: "baby", label: "Baby Milestones" },
            ].map((occ) => {
              const isSelected = filters.occasion === occ.id;
              return (
                <button
                  key={occ.id}
                  type="button"
                  onClick={() => {
                    update("occasion", occ.id);
                    const el = document.getElementById("directory");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-[#29251F] text-amber-100 font-bold shadow-xs ring-1 ring-amber-400"
                      : "bg-[#FAF7F1] text-stone-700 border border-stone-300 hover:border-amber-700 hover:bg-stone-100"
                  }`}
                >
                  {occ.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* 4. PRODUCTS BY MATERIAL */}
        <section className="ed-wrap my-10">
          <div className="mb-4">
            <p className="ed-kicker">Master Craftsmanship</p>
            <h2 className="text-2xl font-display text-stone-900">Products by Material</h2>
            <p className="text-xs text-stone-600 mt-1">Physical materials verified and finished by hand at Rajmoti Studio Jetpur.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {[
              {
                id: "wood",
                name: "Handcrafted Wood",
                desc: "Natural teak finish & matte charcoal wood borders",
                filter: "wood",
              },
              {
                id: "acrylic",
                name: "Cast Acrylic",
                desc: "High-gloss polished edges with clean standoff studs",
                filter: "acrylic",
              },
              {
                id: "canvas",
                name: "Fine Art Canvas",
                desc: "Textured museum-grade cotton canvas stretched over pine bars",
                filter: "canvas",
              },
              {
                id: "ceramic",
                name: "Ceramic & Magic",
                desc: "Gloss ceramic tableware with thermochromic heat reveals",
                filter: "ceramic",
              },
              {
                id: "translight",
                name: "LED Backlit Film",
                desc: "Evenly diffused optical illumination for divine sanctums",
                filter: "translight",
              },
            ].map((mat) => (
              <button
                key={mat.id}
                type="button"
                onClick={() => {
                  update("material", mat.filter);
                  const el = document.getElementById("directory");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  filters.material === mat.filter
                    ? "bg-[#29251F] text-amber-100 border-[#29251F] shadow-md ring-1 ring-amber-400"
                    : "bg-white text-stone-800 border-stone-200 hover:border-amber-700 hover:shadow-xs"
                }`}
              >
                <div>
                  <h3 className="font-display font-bold text-sm">{mat.name}</h3>
                  <p className={`text-[11px] mt-1 line-clamp-2 ${filters.material === mat.filter ? "text-stone-300" : "text-stone-500"}`}>
                    {mat.desc}
                  </p>
                </div>
                <span className={`text-[10px] font-semibold mt-3 flex items-center gap-1 ${filters.material === mat.filter ? "text-amber-300" : "text-amber-900"}`}>
                  Filter Material →
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* 5. SAME-DAY IN JETPUR BANNER */}
        <section className="ed-wrap my-8">
          <div className="bg-gradient-to-r from-[#29251F] to-[#1E1916] text-amber-100 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-md border border-amber-900/40">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-2">
                <Sparkles size={12} /> Jetpur Express Keepsakes
              </span>
              <h3 className="text-2xl font-display font-bold text-white">Need a personalized gift today in Jetpur?</h3>
              <p className="text-xs sm:text-sm text-stone-300 mt-1 leading-relaxed">
                Forgot an anniversary or birthday? We print, assemble and box custom ceramic photo mugs, teak collage frames, and acrylic murtis right here in our Jetpur workshop within 2 to 4 hours.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                to="/same-day"
                className="px-5 py-2.5 rounded-full text-xs font-bold bg-amber-500 text-stone-950 hover:bg-amber-400 transition-colors text-center shadow"
              >
                Explore Same-Day Items (2–4 hrs)
              </Link>
              <a
                href={whatsappLink(SITE.whatsappNumber, "Hello Rajmoti Studio, I need an urgent same-day gift today in Jetpur. What options are ready?")}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-full text-xs font-semibold bg-white/10 text-amber-100 hover:bg-white/20 transition-colors text-center border border-white/20"
              >
                WhatsApp Urgent Query
              </a>
            </div>
          </div>
        </section>

        {/* 6. CUSTOMER-APPROVED COMPLETED SHOWCASE */}
        <section className="ed-wrap my-10">
          <div className="mb-6">
            <p className="ed-kicker">Crafted in Jetpur</p>
            <h2 className="text-2xl sm:text-3xl font-display text-stone-900">Finished Keepsakes Showcase</h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">Real completed products made for our clients in Rajkot, Jetpur, Junagadh and across Saurashtra.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-stone-900 shadow-md">
              <img
                src="/products/frame-sample-wedding.jpg"
                alt="Framed Wedding Heirloom"
                className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-end p-3.5">
                <span className="text-[10px] text-amber-300 font-mono">Living Room · 16×24 in</span>
                <p className="text-xs font-bold text-white mt-0.5">Royal Heritage Wedding Frame</p>
                <p className="text-[10px] text-stone-300 italic mt-0.5">"The teak finish and crystal clarity exceeded our expectations."</p>
              </div>
            </div>
            <div className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-stone-900 shadow-md">
              <img
                src="/products/mug-sample-couple.jpg"
                alt="Magic Reveal Mug"
                className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-end p-3.5">
                <span className="text-[10px] text-amber-300 font-mono">Anniversary Gift · Jetpur</span>
                <p className="text-xs font-bold text-white mt-0.5">Magic Reveal Chai Mug</p>
                <p className="text-[10px] text-stone-300 italic mt-0.5">"Poured morning chai and our proposal photo appeared like magic!"</p>
              </div>
            </div>
            <div className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-stone-900 shadow-md">
              <img
                src="/deities/shrinathji.jpg"
                alt="Dwarkadhish Mandir Murti"
                className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-end p-3.5">
                <span className="text-[10px] text-amber-300 font-mono">Home Sanctum · Virpur</span>
                <p className="text-xs font-bold text-white mt-0.5">Shri Dwarkadhish Bitu Acrylic</p>
                <p className="text-[10px] text-stone-300 italic mt-0.5">"Brings serene temple atmosphere directly into our puja ghar."</p>
              </div>
            </div>
            <div className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-stone-900 shadow-md">
              <img
                src="/products/magazine-cover.jpg"
                alt="Couple Magazine"
                className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-end p-3.5">
                <span className="text-[10px] text-amber-300 font-mono">Coffee Table Keepsake · Rajkot</span>
                <p className="text-xs font-bold text-white mt-0.5">Couple Story Editorial Magazine</p>
                <p className="text-[10px] text-stone-300 italic mt-0.5">"The matte paper feel and custom song QR made our anniversary unforgettable."</p>
              </div>
            </div>
          </div>
        </section>

        {/* 3-Tap Gift Finder Section */}
        <section id="gift-finder" className="ed-wrap my-8">
          <GiftFinder onSelectProduct={open} onOpenStudio={setActiveStudio} />
        </section>

        {/* Wall Size Comparison Visualizer */}
        <section className="ed-wrap my-8">
          <WallSizeVisualizer onSelectSize={(sz) => update("size", sz)} />
        </section>

        {/* Curated Milestone Gift Bundles */}
        <section id="curated-bundles" className="ed-wrap my-8">
          <BundleShowcase />
        </section>

        <div className="ed-wrap">
          <div className="ed-notice">
            <Layers size={18} />
            <p>
              <strong>Personalized Photo Products.</strong> Available sizes, materials and finishes depend on the selected product. Options and details are confirmed with you on WhatsApp.
            </p>
          </div>
        </div>
        <section id="directory" className="ed-wrap directory-section">
          <div className="ed-section-heading">
            <div>
              <p className="ed-kicker">Complete Studio Inventory</p>
              <h2>Shop All Products</h2>
              <p className="text-xs text-stone-500 mt-0.5">Filter by size, material, finish or recipient to find your exact keepsake</p>
            </div>
            <div className="ed-actions">
              <button className="ed-button outline" onClick={() => setShowQuote(true)}>
                <ShoppingBag size={16} /> Your Bag <span className="count-pill">{quote.length}</span>
              </button>
            </div>
          </div>
          <div className="catalogue-layout">
            <aside className="category-sidebar">
              <h3>Browse by family</h3>
              <button
                className={!filters.category ? "active" : ""}
                onClick={() => update("category", "")}
              >
                All products <span>{products.length}</span>
              </button>
              {categories.map((c, i) => (
                <button
                  key={c.id}
                  className={filters.category === c.id ? "active" : ""}
                  onClick={() => update("category", c.id)}
                >
                  <span className="category-index">{String(i + 1).padStart(2, "0")}</span>
                  <span>{c.name}</span>
                  <span>{products.filter((p) => p.category === c.id).length}</span>
                </button>
              ))}
            </aside>
            <div className="catalogue-results">
              {/* Curated Collection Quick Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-2 no-scrollbar text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setFilters(initial);
                    setQ("");
                  }}
                  className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-all ${
                    !filters.occasion && !filters.category && !q
                      ? "bg-stone-900 text-white font-bold"
                      : "bg-stone-100 hover:bg-stone-200 text-stone-700"
                  }`}
                >
                  All Keepsakes
                </button>
                <Link
                  to="/same-day"
                  className="px-3 py-1.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold whitespace-nowrap border border-amber-300 flex items-center gap-1 transition-all"
                >
                  <Sparkles size={12} className="text-amber-700" />
                  Same-Day in Jetpur (2–4 hrs)
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    update("occasion", "anniversary");
                  }}
                  className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-all ${
                    filters.occasion === "anniversary"
                      ? "bg-amber-900 text-white font-bold"
                      : "bg-stone-100 hover:bg-stone-200 text-stone-700"
                  }`}
                >
                  Anniversary & Couples
                </button>
                <button
                  type="button"
                  onClick={() => {
                    update("category", "gods-collection");
                  }}
                  className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-all ${
                    filters.category === "gods-collection"
                      ? "bg-amber-900 text-white font-bold"
                      : "bg-stone-100 hover:bg-stone-200 text-stone-700"
                  }`}
                >
                  Mandir & Devotional
                </button>
                <button
                  type="button"
                  onClick={() => {
                    update("occasion", "birthday");
                  }}
                  className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-all ${
                    filters.occasion === "birthday"
                      ? "bg-amber-900 text-white font-bold"
                      : "bg-stone-100 hover:bg-stone-200 text-stone-700"
                  }`}
                >
                  Birthday & Baby
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQ("mug");
                  }}
                  className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-all ${
                    q === "mug"
                      ? "bg-amber-900 text-white font-bold"
                      : "bg-stone-100 hover:bg-stone-200 text-stone-700"
                  }`}
                >
                  Gifts under ₹499
                </button>
              </div>

              <div className="catalogue-toolbar">
                <label className="ed-search">
                  <Search size={18} />
                  <input
                    aria-label="Search product directory"
                    placeholder="Search products, codes, materials or sizes…"
                    value={q}
                    onChange={(e) => {
                      setQ(e.target.value);
                      setShown(12);
                    }}
                  />
                  {q && (
                    <button aria-label="Clear search" onClick={() => setQ("")}>
                      <X size={16} />
                    </button>
                  )}
                </label>
                <button
                  className="ed-button outline"
                  aria-expanded={showFilters}
                  onClick={() => setShowFilters((v) => !v)}
                >
                  <SlidersHorizontal size={17} /> Filters{" "}
                  {active.length > 0 && `(${active.length})`}
                </button>
              </div>
              <div className="mobile-category">
                <label>
                  Product family
                  <select
                    value={filters.category}
                    onChange={(e) => update("category", e.target.value)}
                  >
                    <option value="">All product families</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {showFilters && (
                <div className="filter-panel">
                  {(
                    [
                      ["material", "Material", products.map((p) => p.material)],
                      ["shape", "Shape", products.map((p) => p.shape)],
                      [
                        "size",
                        "Size / capacity",
                        products.flatMap((p) => p.variants.map((v) => v.size)),
                      ],
                      ["printing", "Printing method", products.map((p) => p.printing)],
                      ["capacity", "Photo capacity", products.map((p) => p.photoCapacity)],
                      ["usage", "Usage", products.map((p) => p.usage)],
                      [
                        "personalisation",
                        "Personalisation",
                        products.flatMap((p) => p.personalisation),
                      ],
                      ["occasion", "Occasion", products.flatMap((p) => p.occasions)],
                      ["recipient", "Recipient", products.flatMap((p) => p.recipients)],
                      ["availability", "Availability", products.map((p) => p.availability)],
                    ] as [keyof Filters, string, string[]][]
                  ).map(([key, label, options]) => (
                    <label key={key}>
                      {label}
                      <select value={filters[key]} onChange={(e) => update(key, e.target.value)}>
                        <option value="">All</option>
                        {[...new Set(options)].sort().map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                    </label>
                  ))}
                  <button className="ed-text-button" onClick={reset}>
                    Reset all filters
                  </button>
                </div>
              )}
              {active.length > 0 && (
                <div className="filter-chips">
                  {active.map(([k, v]) => (
                    <button key={k} onClick={() => update(k as keyof Filters, "")}>
                      {k === "category" ? categories.find((c) => c.id === v)?.name : v}
                      <X size={12} />
                    </button>
                  ))}
                </div>
              )}
              <div className="results-meta">
                <span aria-live="polite">
                  {matching.length} product{matching.length !== 1 ? "s" : ""} ·{" "}
                  {matching.reduce((n, p) => n + p.variants.length, 0)} proposed variants
                </span>
                <label>
                  Sort{" "}
                  <select
                    aria-label="Sort products"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                  >
                    <option value="featured">Directory order</option>
                    <option value="az">Name A–Z</option>
                    <option value="variants">Most size options</option>
                  </select>
                </label>
              </div>
              {matching.length === 0 ? (
                <div className="ed-empty p-8 sm:p-12 text-center bg-stone-50 rounded-3xl border border-stone-200">
                  <Search size={36} className="mx-auto text-amber-800 mb-3" />
                  <h3 className="font-display text-2xl font-bold text-stone-900">
                    No matching keepsakes with these filters.
                  </h3>
                  <p className="text-sm text-stone-600 mt-1 max-w-md mx-auto leading-relaxed">
                    Some filter combinations are mutually exclusive. Reset filters below to view our complete collection or explore popular choices.
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-2.5">
                    <button
                      className="ed-button"
                      onClick={() => {
                        setFilters((prev) => ({ ...prev, occasion: "", material: "", usage: "" }));
                      }}
                    >
                      Clear Conflicting Filter
                    </button>
                    <button className="ed-button outline" onClick={reset}>
                      View Entire Collection
                    </button>
                    <a className="ed-button outline" href="#gift-finder">
                      Explore Related Gifts (Gift Finder)
                    </a>
                    <a
                      className="ed-button outline border-emerald-600 text-emerald-800 hover:bg-emerald-50 flex items-center gap-1.5"
                      href={whatsappLink(SITE.whatsappNumber, "Hello Rajmoti Studio, I tried filtering products but got zero results. Can you help me find what I am looking for?")}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircle size={14} className="text-emerald-700" />
                      Ask Rajmoti Studio on WhatsApp
                    </a>
                  </div>
                  <div className="mt-8 pt-6 border-t border-stone-200 text-left">
                    <p className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-4">
                      Popular Keepsakes to Explore
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div
                        onClick={() => setActiveStudio("frames")}
                        className="cursor-pointer bg-white rounded-xl border border-stone-200 p-3 hover:border-amber-700 hover:shadow-md transition-all"
                      >
                        <img
                          src="/products/frame-sample-wedding.jpg"
                          alt="Wedding Frame"
                          className="w-full aspect-[4/3] object-cover rounded-lg mb-2"
                        />
                        <h4 className="font-bold text-xs text-stone-900">Royal Heritage Wedding Frame</h4>
                        <span className="text-[11px] text-amber-800 font-semibold mt-1 block">Open Studio →</span>
                      </div>
                      <div
                        onClick={() => setActiveStudio("mugs")}
                        className="cursor-pointer bg-white rounded-xl border border-stone-200 p-3 hover:border-amber-700 hover:shadow-md transition-all"
                      >
                        <img
                          src="/products/mug-sample-couple.jpg"
                          alt="Magic Reveal Mug"
                          className="w-full aspect-[4/3] object-cover rounded-lg mb-2"
                        />
                        <h4 className="font-bold text-xs text-stone-900">Thermochromic Magic Mug</h4>
                        <span className="text-[11px] text-amber-800 font-semibold mt-1 block">Open Studio →</span>
                      </div>
                      <div
                        onClick={() => setActiveStudio("devotional")}
                        className="cursor-pointer bg-white rounded-xl border border-stone-200 p-3 hover:border-amber-700 hover:shadow-md transition-all"
                      >
                        <img
                          src="/deities/shrinathji.jpg"
                          alt="Shri Dwarkadhish & Shrinathji"
                          className="w-full aspect-[4/3] object-cover rounded-lg mb-2"
                        />
                        <h4 className="font-bold text-xs text-stone-900">Pavitra Gujarati Mandir Murti</h4>
                        <span className="text-[11px] text-amber-800 font-semibold mt-1 block">Explore Deities →</span>
                      </div>
                      <div
                        onClick={() => setActiveStudio("magazines")}
                        className="cursor-pointer bg-white rounded-xl border border-stone-200 p-3 hover:border-amber-700 hover:shadow-md transition-all"
                      >
                        <img
                          src="/products/magazine-cover.jpg"
                          alt="Couple Magazine"
                          className="w-full aspect-[4/3] object-cover rounded-lg mb-2"
                        />
                        <h4 className="font-bold text-xs text-stone-900">Couple Keepsake Magazine</h4>
                        <span className="text-[11px] text-amber-800 font-semibold mt-1 block">Flip Preview →</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="product-grid">
                  {matching.slice(0, shown).map((p, i) => (
                    <article className="product-card" key={p.id}>
                      <button
                        className={"compare-toggle " + (compare.includes(p.id) ? "selected" : "")}
                        onClick={() => toggleCompare(p.id)}
                        aria-label={`Compare ${p.name}`}
                        aria-pressed={compare.includes(p.id)}
                      >
                        {compare.includes(p.id) ? <Check size={15} /> : <Plus size={15} />}
                      </button>
                      <button className="product-card-main" onClick={() => open(p.id)}>
                        <div className={"product-tile relative overflow-hidden group/tile family-" + p.category}>
                          <img
                            src={getCategorySampleImage(p.category, p.id)}
                            alt={p.name}
                            className="size-full object-cover transition-transform duration-500 group-hover/tile:scale-105"
                          />
                          <div className="absolute top-2 left-2 bg-stone-900/80 backdrop-blur-xs text-amber-100 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {categories.find((c) => c.id === p.category)?.code || p.category}
                          </div>
                          <div className="absolute bottom-2 right-2 bg-stone-900/75 text-stone-300 text-[9px] font-mono px-1.5 py-0.5 rounded">
                            {p.id}
                          </div>
                        </div>
                        <div className="product-card-copy">
                          <p className="ed-kicker">
                            {p.material} · {p.shape}
                          </p>
                          <h3>{p.name}</h3>
                          <div className="product-size-list mt-1.5 flex flex-wrap gap-1">
                            {p.variants.map((v) => (
                              <span
                                key={v.id}
                                className="text-[10px] bg-stone-100/90 text-stone-700 px-1.5 py-0.5 rounded border border-stone-200"
                              >
                                {v.size}
                              </span>
                            ))}
                          </div>
                          <div className="product-card-bottom">
                            <span>Price on request</span>
                            <ArrowUpRight size={18} />
                          </div>
                        </div>
                      </button>
                    </article>
                  ))}
                </div>
              )}
              {shown < matching.length && (
                <div className="load-more">
                  <button className="ed-button outline" onClick={() => setShown((n) => n + 12)}>
                    Show more products <Plus size={16} />
                  </button>
                  <span>
                    Showing {Math.min(shown, matching.length)} of {matching.length}
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>
        <section className="ed-wrap ed-material-section">
          <p className="ed-kicker">Details make the difference</p>
          <h2>Choose how your memory feels.</h2>
          <div className="material-grid">
            {[
              {
                name: "Acrylic",
                body: "Explore clear surfaces, depth and polished edges. Confirm the thickness and mounting before production.",
              },
              {
                name: "Wood",
                body: "Warm grain and a tactile finish. Ask to see a sample of the proposed frame or engraved surface.",
              },
              {
                name: "Paper & linen",
                body: "Compare paper finish, binding and cover texture in person before choosing your album.",
              },
            ].map((m) => (
              <article key={m.name}>
                <h3>{m.name}</h3>
                <p>{m.body}</p>
              </article>
            ))}
          </div>
          <p className="ed-footnote">
            Archival museum inks, acid-free mounts, and premium cast acrylics sourced for lasting durability.
          </p>
        </section>
      </main>
      <SiteFooter />
      {compare.length > 0 && (
        <div className="compare-bar">
          <span>
            <Scale size={18} /> {compare.length} of 3 selected
          </span>
          <button onClick={() => setCompare([])}>Clear</button>
          <button
            className="ed-button"
            disabled={compare.length < 2}
            onClick={() => setComparing(true)}
          >
            Compare variants <ArrowRight size={16} />
          </button>
        </div>
      )}
      <Dialog open={!!productId} onOpenChange={(v) => !v && open(undefined)}>
        <DialogContent className="ed-modal product-modal">
          <DialogHeader>
            <DialogTitle>{product?.name || "Product not found"}</DialogTitle>
            <DialogDescription>
              Custom photo gifts, tailored framing & archival printing in Jetpur
            </DialogDescription>
          </DialogHeader>
          {product ? (
            <ProductDetail
              key={product.id}
              product={product}
              onAdd={add}
              onCheckout={(line) => {
                add(line);
                open(undefined);
                setShowQuote(true);
              }}
            />
          ) : (
            <p>This product code is not in the directory. Close this panel to continue browsing.</p>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={comparing} onOpenChange={setComparing}>
        <DialogContent className="ed-modal compare-modal">
          <DialogHeader>
            <DialogTitle>Compare the details.</DialogTitle>
            <DialogDescription>
              Select a variant in each column to compare sizes, finishes and materials.
            </DialogDescription>
          </DialogHeader>
          <Compare products={products.filter((p) => compare.includes(p.id))} />
        </DialogContent>
      </Dialog>
      <CheckoutDialog
        open={showQuote}
        onOpenChange={setShowQuote}
        quote={quote}
        onClearQuote={() => setQuote([])}
        onRemoveLine={(i) => setQuote(quote.filter((_, j) => j !== i))}
      />
      {/* Dedicated Interactive Studio Dialog */}
      <Dialog open={!!activeStudio} onOpenChange={(v) => !v && setActiveStudio(null)}>
        <DialogContent className="ed-modal max-w-5xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {activeStudio === "frames" && "Interactive Frame & Collage Studio"}
              {activeStudio === "mugs" && "3D Rotating Photo Mug Studio"}
              {activeStudio === "translight" && "Backlit LED Translight Studio"}
              {activeStudio === "devotional" && "God's Devotional Collection"}
              {activeStudio === "magazines" && "Personalised Couple Story Magazine Studio"}
              {activeStudio === "covers" && "Custom Photo Phone Covers (200+ Models)"}
              {activeStudio === "keychains" && "Double-Sided Custom Photo Keychains"}
            </DialogTitle>
            <DialogDescription>
              Personalize your keepsake, explore finishes, and discuss options directly with Rajmoti Studio on WhatsApp.
            </DialogDescription>
          </DialogHeader>

          {activeStudio === "frames" && (
            <div className="space-y-4">
              <FrameCollageCanvas size="12×18 in" finish="teak" />
              <div className="flex justify-end pt-2">
                <a
                  href={whatsappLink("Namaste Rajmoti Studio! 🖼️ I customised a multi-photo collage frame in your Live Studio. Please guide me on framing finish and production timeline.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ed-button flex items-center gap-2 bg-[#25D366] text-white border-[#25D366] hover:bg-[#20b858]"
                >
                  <MessageCircle size={17} /> Order Custom Frame on WhatsApp
                </a>
              </div>
            </div>
          )}

          {activeStudio === "mugs" && (
            <div className="space-y-4">
              <ThreePhotoMug mugType="magic" />
              <div className="flex justify-end pt-2">
                <a
                  href={whatsappLink("Namaste Rajmoti Studio! ☕ I designed a 3D Photo Mug in your Live Studio (Thermochromic Magic / Ceramic). Could you please confirm pricing and delivery?")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ed-button flex items-center gap-2 bg-[#25D366] text-white border-[#25D366] hover:bg-[#20b858]"
                >
                  <MessageCircle size={17} /> Order Custom Mug on WhatsApp
                </a>
              </div>
            </div>
          )}

          {activeStudio === "translight" && (
            <div className="space-y-4">
              <TranslightPreview size="12×18 in" />
              <div className="flex justify-end pt-2">
                <a
                  href={whatsappLink("Namaste Rajmoti Studio! 💡 I am interested in ordering a Backlit LED Translight Frame (12×18 / 16×24). Could you please share the specifications and pricing?")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ed-button flex items-center gap-2 bg-[#25D366] text-white border-[#25D366] hover:bg-[#20b858]"
                >
                  <MessageCircle size={17} /> Order Translight on WhatsApp
                </a>
              </div>
            </div>
          )}

          {activeStudio === "devotional" && (
            <div className="space-y-4">
              <GodsCollection />
            </div>
          )}

          {activeStudio === "magazines" && (
            <div className="space-y-4">
              <CoupleMagazineFlipbook />
            </div>
          )}

          {activeStudio === "covers" && (
            <div className="space-y-4">
              <PhoneCoverCustomizer />
            </div>
          )}

          {activeStudio === "keychains" && (
            <div className="space-y-4">
              <KeychainCustomizer />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Floating Bag / Checkout Pill */}
      {quote.length > 0 && (
        <aside
          aria-label="Your Bag Summary"
          className="fixed bottom-5 right-5 z-40 bg-stone-900/95 backdrop-blur-md text-amber-100 rounded-full pl-5 pr-2 py-2 shadow-2xl border border-amber-900/40 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4"
        >
          <div className="flex items-center gap-2 text-xs">
            <ShoppingBag size={16} className="text-amber-400" />
            <span className="font-semibold">{quote.length} {quote.length === 1 ? "item" : "items"} in your bag</span>
          </div>
          <button
            type="button"
            onClick={() => setShowQuote(true)}
            className="bg-amber-100 text-stone-950 font-bold text-xs px-4 py-2 rounded-full hover:bg-white transition-all shadow-xs flex items-center gap-1.5"
          >
            <span>Review Bag</span>
            <ArrowRight size={13} />
          </button>
        </aside>
      )}

      {/* Floating Discreet WhatsApp Help */}
      {quote.length === 0 && (
        <a
          href={whatsappLink(SITE.whatsappNumber, "Hello Rajmoti Studio, I have a question about personalizing a product.")}
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-5 right-5 z-40 bg-[#128C7E] hover:bg-[#075E54] text-white px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 text-xs font-bold transition-all hover:scale-105 border border-white/20"
        >
          <MessageCircle size={15} />
          <span>Chat with us</span>
        </a>
      )}
    </div>
  );
}
function ProductDetail({
  product: p,
  onAdd,
  onCheckout,
}: {
  product: Product;
  onAdd: (line: QuoteLine) => void;
  onCheckout?: (line: QuoteLine) => void;
}) {
  const [variantId, setVariant] = useState(p.variants[0]?.id || "");
  const [qty, setQty] = useState(1);
  const [personalisation, setPersonalisation] = useState(p.personalisation[0]);
  const [packaging, setPackaging] = useState(p.packaging[0]);
  const [orderType, setOrderType] = useState(p.orderTypes[0]);
  const [customText, setCustomText] = useState("");

  const v = p.variants.find((v) => v.id === variantId) || p.variants[0];
  const isCover = p.category === "tech" || p.name.toLowerCase().includes("phone cover") || p.id === "TEC-001";
  const isMug = p.category === "drinkware" || p.name.toLowerCase().includes("mug");
  const isTranslight = p.category === "led" || p.name.toLowerCase().includes("translight") || p.name.toLowerCase().includes("light");
  const isGod = p.category === "gods-collection" || p.name.toLowerCase().includes("god") || p.name.toLowerCase().includes("shrine");
  const isMagazine = p.category === "magazines" || p.category === "albums" || p.name.toLowerCase().includes("magazine");

  const mugType = v?.finish?.toLowerCase().includes("black")
    ? "black"
    : (v?.finish?.toLowerCase().includes("magic") || p.id === "MUG-002" || p.id === "MUG-003")
    ? "magic"
    : "white";

  const frameFinish = v?.finish?.toLowerCase().includes("acrylic")
    ? "acrylic"
    : v?.finish?.toLowerCase().includes("charcoal")
    ? "charcoal"
    : v?.finish?.toLowerCase().includes("gold")
    ? "gold"
    : "teak";

  const whatsappInquiryUrl = whatsappLink(
    `Namaste ${SITE.name}! 🎁 I am interested in ordering:
Product: ${p.name}
Selected Size: ${v?.size || "Standard"} (${v?.finish || "Studio Finish"})
Quantity: ${qty}
Personalisation: ${customText ? `"${customText}"` : personalisation}
Packaging: ${packaging}
Order Type: ${orderType}
Could you please confirm the exact pricing and delivery estimate? Thank you!`,
  );

  return (
    <>
      <div className="product-detail-grid">
        <div className="space-y-4">
          <div className="border border-stone-200 rounded-xl overflow-hidden bg-white shadow-sm p-2 sm:p-3">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-100 text-xs">
              <span className="font-semibold text-stone-800 flex items-center gap-1.5">
                <Sparkles size={13} className="text-amber-700" /> Interactive Studio Preview
              </span>
              <span className="text-[11px] text-stone-500">{v?.size || "Custom size"}</span>
            </div>

            {isCover ? (
              <PhoneCoverCustomizer />
            ) : isMug ? (
              <ThreePhotoMug mugType={mugType} />
            ) : isTranslight ? (
              <TranslightPreview size={v?.size || "12×18 in"} />
            ) : isGod ? (
              <GodsCollection />
            ) : isMagazine ? (
              <CoupleMagazineFlipbook />
            ) : (
              <FrameCollageCanvas
                size={v?.size || "12×18 in"}
                finish={frameFinish}
                customText={customText}
              />
            )}
          </div>

          <div className="product-info-note">
            <strong>Studio Craftsmanship Guarantee</strong>
            <p>
              Every frame, acrylic, and print is handcrafted in Jetpur. We confirm material, finish, crop, and
              proof with you on WhatsApp (+91 94290 70317) before final production.
            </p>
          </div>
        </div>

        <div className="product-config">
          <p className="ed-kicker">
            {p.id} · {categories.find((c) => c.id === p.category)?.name}
          </p>
          <p className="text-sm text-stone-700">{p.description}</p>

          <label>
            Size & Material Variant
            <select value={variantId} onChange={(e) => setVariant(e.target.value)}>
              {p.variants.map((v) => (
                <option value={v.id} key={v.id}>
                  {v.size}
                  {v.thickness !== "Not specified" ? ` · ${v.thickness}` : ""} · {v.finish}
                </option>
              ))}
            </select>
          </label>
          {v.metric && <span className="ed-footnote">{v.metric}</span>}

          <div className="config-two">
            <label>
              Quantity
              <input
                type="number"
                min="1"
                max="9999"
                step="1"
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
              />
            </label>
            <label>
              Order type
              <select value={orderType} onChange={(e) => setOrderType(e.target.value)}>
                {p.orderTypes.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Personalisation Style
            <select value={personalisation} onChange={(e) => setPersonalisation(e.target.value)}>
              {p.personalisation.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>

          <label>
            Custom Text or Names (optional)
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="e.g. Aarav · 24 Nov 2026 or Special Dedication"
              className="w-full border border-stone-300 rounded p-2 text-xs mt-1"
            />
          </label>

          <label>
            Packaging
            <select value={packaging} onChange={(e) => setPackaging(e.target.value)}>
              {p.packaging.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>

          <div className="detail-price">
            <strong>Transparent Studio Pricing</strong>
            <span>Verified by studio owner. Pay at studio or via UPI upon order confirmation.</span>
          </div>

          {/* Action Buttons: Instant Checkout, WhatsApp & Shortlist */}
          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              className="ed-button flex items-center justify-center gap-2 bg-stone-900 text-amber-100 hover:bg-stone-800 transition-colors shadow-xs"
              disabled={!Number.isInteger(qty) || qty < 1 || qty > 9999 || p.availability === "Discontinued"}
              onClick={() => {
                const line: QuoteLine = {
                  productId: p.id,
                  variantId,
                  quantity: qty,
                  personalisation: customText ? `${personalisation}: "${customText}"` : personalisation,
                  packaging,
                  orderType,
                };
                if (onCheckout) {
                  onCheckout(line);
                } else {
                  onAdd(line);
                  toast.success(`Added ${p.name} to your bag.`);
                }
              }}
            >
              <ShoppingBag size={16} /> Instant Checkout · ₹{(calculateVariantPriceInr(p.id, v?.size, v?.finish) * qty).toFixed(2)}
            </button>

            <a
              href={whatsappInquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ed-button flex items-center justify-center gap-2 bg-[#25D366] text-white border-[#25D366] hover:bg-[#20b858]"
            >
              <MessageCircle size={17} /> Order on WhatsApp
            </a>

            <button
              className="ed-button outline flex items-center justify-center gap-2"
              disabled={!Number.isInteger(qty) || qty < 1 || qty > 9999 || p.availability === "Discontinued"}
              onClick={() => {
                onAdd({
                  productId: p.id,
                  variantId,
                  quantity: qty,
                  personalisation: customText ? `${personalisation}: "${customText}"` : personalisation,
                  packaging,
                  orderType,
                });
                toast.success(`Added ${p.name} to your bag.`);
              }}
            >
              <Plus size={16} /> Add to Bag
            </button>
          </div>
        </div>
      </div>
      <h3 className="spec-heading">The specification directory</h3>
      <dl className="spec-grid">
        {Object.entries({
          "Product code": p.id,
          "Variant code": v.id,
          Material: p.material,
          Thickness: v.thickness,
          Shape: p.shape,
          Size: v.size,
          Metric: v.metric || "Not applicable / to confirm",
          "Photo capacity": p.photoCapacity,
          "Printing method": p.printing,
          Orientation: p.orientation.join(" / "),
          Finish: v.finish,
          Usage: p.usage,
          Availability: p.availability,
          Preparation: p.production,
          "Collection / delivery": p.delivery.join(" / "),
          Status: v.status,
        }).map(([k, val]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{val}</dd>
          </div>
        ))}
      </dl>
      <details className="variant-directory">
        <summary>All proposed variants ({p.variants.length})</summary>
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Size</th>
              <th>Metric</th>
              <th>Thickness</th>
              <th>Finish</th>
            </tr>
          </thead>
          <tbody>
            {p.variants.map((v) => (
              <tr key={v.id}>
                <td>{v.id}</td>
                <td>{v.size}</td>
                <td>{v.metric || "—"}</td>
                <td>{v.thickness}</td>
                <td>{v.finish}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </>
  );
}
function Compare({ products }: { products: Product[] }) {
  const [selected, setSelected] = useState<Record<string, string>>({});
  const rows = [
    "Material",
    "Shape",
    "Size",
    "Thickness",
    "Finish",
    "Printing",
    "Photo capacity",
    "Personalisation",
    "Packaging",
    "Availability",
    "Price",
  ];
  return (
    <div className="comparison-scroll">
      <table className="comparison-table">
        <thead>
          <tr>
            <th>Detail</th>
            {products.map((p) => (
              <th key={p.id}>
                {p.name}
                <select
                  aria-label={`Variant for ${p.name}`}
                  value={selected[p.id] || p.variants[0].id}
                  onChange={(e) => setSelected({ ...selected, [p.id]: e.target.value })}
                >
                  {p.variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.size} · {v.finish}
                    </option>
                  ))}
                </select>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((key) => (
            <tr key={key}>
              <th>{key}</th>
              {products.map((p) => {
                const v = p.variants.find((v) => v.id === (selected[p.id] || p.variants[0].id))!;
                const data: Record<string, string> = {
                  Material: p.material,
                  Shape: p.shape,
                  Size: v.size,
                  Thickness: v.thickness,
                  Finish: v.finish,
                  Printing: p.printing,
                  "Photo capacity": p.photoCapacity,
                  Personalisation: p.personalisation.join(", "),
                  Packaging: p.packaging.join(", "),
                  Availability: p.availability,
                  Price: "To be quoted",
                };
                return <td key={p.id}>{data[key]}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
