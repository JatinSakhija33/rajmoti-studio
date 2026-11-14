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

export function Catalogue({ productId }: { productId?: string }) {
  const [products] = useProducts();
  const [quote, setQuote] = useQuote();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<Filters>(initial);
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
        return { ...f, category: value, occasion: "", usage: "" };
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

        {/* 4 Hero Signature Collection Cards */}
        <section className="ed-wrap my-10">
          <div className="bg-[#FAF7F1] border border-stone-300 rounded-3xl p-6 sm:p-10 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <p className="ed-kicker flex items-center gap-1.5 text-amber-900 font-semibold text-xs tracking-wider uppercase">
                  <Sparkles size={14} className="text-amber-700" /> Signature Live Studios
                </p>
                <h2 className="text-3xl sm:text-4xl font-display text-stone-900 mt-1">
                  Customise & preview before your order.
                </h2>
                <p className="text-sm text-stone-600 mt-1 max-w-2xl leading-relaxed">
                  Try our interactive preview tools: drag photos into multi-layout frames, rotate 3D ceramic mugs, explore backlit translights, or flip through a personalized couple magazine.
                </p>
              </div>
            </div>

            {/* Visual Product Showcase Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1: Frames & Collages */}
              <div
                onClick={() => setActiveStudio("frames")}
                className="group cursor-pointer rounded-2xl bg-white border border-stone-200 hover:border-amber-700 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
              >
                <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden">
                  <img
                    src="/products/frame-sample-wedding.jpg"
                    alt="Frame & Collage Studio"
                    className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-md text-amber-100 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                    Single, Triptych & Multi-Grid
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      Open Frame Studio <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-display text-xl font-bold text-stone-900 group-hover:text-amber-900 transition-colors">
                      Frame & Collage Studio
                    </h3>
                    <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                      Single, triptych, 4-grid & family-5 collages. Available in teak finish, charcoal matte, gold finish, and acrylic.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                    <span className="text-stone-500 font-mono text-[11px]">8×12 to 20×30 in</span>
                    <span className="font-semibold text-amber-800 flex items-center gap-1">
                      Open studio <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: 3D Photo Mugs */}
              <div
                onClick={() => setActiveStudio("mugs")}
                className="group cursor-pointer rounded-2xl bg-white border border-stone-200 hover:border-amber-700 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
              >
                <div className="relative aspect-[4/3] bg-stone-900 overflow-hidden flex items-center justify-center">
                  <img
                    src="/products/mug-sample-couple.jpg"
                    alt="3D Photo Mug Studio"
                    className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-md text-amber-100 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                    Ceramic & Magic Reveal
                  </div>
                  <div className="absolute bottom-3 right-3 bg-amber-950/80 text-amber-200 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Coffee size={11} /> 360° Rotatable
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-display text-xl font-bold text-stone-900 group-hover:text-amber-900 transition-colors">
                      3D Photo Mug Studio
                    </h3>
                    <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                      Rotatable 3D ceramic mugs with Cold / Hot thermochromic magic reveal switch that shows your photo when hot chai is poured.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                    <span className="text-stone-500 font-mono text-[11px]">Cold / Hot Thermal Switch</span>
                    <span className="font-semibold text-amber-800 flex items-center gap-1">
                      Open studio <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 3: Devotional Photos */}
              <div
                onClick={() => setActiveStudio("devotional")}
                className="group cursor-pointer rounded-2xl bg-white border border-stone-200 hover:border-amber-700 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
              >
                <div className="relative aspect-[4/3] bg-[#16283D] overflow-hidden flex items-center justify-center">
                  <img
                    src="/deities/shrinathji.jpg"
                    alt="Devotional Photos"
                    className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-md text-amber-100 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                    Devotional Photos
                  </div>
                  <div className="absolute bottom-3 right-3 bg-amber-950/80 text-amber-200 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Flame size={11} /> 8 Sacred Deities
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-display text-lg font-bold text-stone-900 group-hover:text-amber-900 transition-colors">
                      Devotional Photos
                    </h3>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                      Cherished images for home and devotion. 8 sacred Gujarati deities in acrylic, frame & LED translight.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                    <span className="text-stone-500 font-mono text-[11px]">Mandir & Living Room</span>
                    <span className="font-semibold text-amber-800 flex items-center gap-1">
                      Explore deities <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 4: Albums & Magazines */}
              <div
                onClick={() => setActiveStudio("magazines")}
                className="group cursor-pointer rounded-2xl bg-white border border-stone-200 hover:border-amber-700 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
              >
                <div className="relative aspect-[4/3] bg-[#1E1916] overflow-hidden flex items-center justify-center p-3">
                  <img
                    src="/products/magazine-cover.jpg"
                    alt="Albums & Magazines"
                    className="h-full max-h-[190px] aspect-[2/3] object-cover rounded shadow-2xl group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-md text-amber-100 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                    Albums & Magazines
                  </div>
                  <div className="absolute bottom-3 right-3 bg-amber-950/80 text-amber-200 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <BookOpen size={11} /> Tactile Flip
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-display text-lg font-bold text-stone-900 group-hover:text-amber-900 transition-colors">
                      Albums & Magazines
                    </h3>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                      More than photos. A story to return to. Curated 8–20 photo magazines with dedication quotes & song QR.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                    <span className="text-stone-500 font-mono text-[11px]">8–20 Curated Photos</span>
                    <span className="font-semibold text-amber-800 flex items-center gap-1">
                      Flip preview <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
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
              <p className="ed-kicker">A thoughtful choice, down to the detail</p>
              <h2>Find your keepsake.</h2>
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
                  <div className="mt-5 flex flex-wrap justify-center gap-3">
                    <button className="ed-button" onClick={reset}>
                      Reset All Filters
                    </button>
                    <a className="ed-button outline" href="#gift-finder">
                      Use 3-Tap Gift Finder
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
