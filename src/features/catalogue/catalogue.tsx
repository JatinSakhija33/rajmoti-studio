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
    "frames" | "mugs" | "translight" | "devotional" | "magazines" | null
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
    setFilters((f) => ({ ...f, [key]: value }));
    setShown(12);
  };
  const open = (id?: string) =>
    navigate({ to: "/gifts", search: { product: id }, resetScroll: false });
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
            <p className="ed-kicker">The Rajmoti gift collection</p>
            <h1>
              Keep a little
              <br />
              <em>of what matters.</em>
            </h1>
            <p className="ed-copy">
              From a favourite photograph to something you can hold. Find the right material, size
              and finish for your story.
            </p>
            <a className="ed-button" href="#directory">
              Explore the directory <ArrowRight size={16} />
            </a>
            <div className="ed-inline-facts">
              <span>18 product families</span>
              <span>{products.length} crafted products</span>
              <span>Made personal</span>
            </div>
          </div>
          <figure className="gift-intro-image">
            <img
              src="/editorial/gift-still-life.png"
              width="1536"
              height="1024"
              alt="Archival photo frames, acrylic blocks, albums and gift packaging"
            />
            <figcaption>
              Archival framing, acrylics & keepsake gifts handcrafted at Rajmoti Studio
            </figcaption>
          </figure>
        </section>

        {/* Visual Product Discovery Showcase */}
        <section className="ed-wrap my-10">
          <div className="bg-[#FAF7F1] border border-stone-300 rounded-3xl p-6 sm:p-10 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <p className="ed-kicker flex items-center gap-1.5 text-amber-900 font-semibold">
                  <Sparkles size={15} className="text-amber-700" /> Handcrafted in Jetpur · Interactive Showcase
                </p>
                <h2 className="text-3xl sm:text-4xl font-display text-stone-900 mt-1.5">
                  See how your keepsake will look.
                </h2>
                <p className="text-sm text-stone-600 mt-1 max-w-2xl leading-relaxed">
                  Every product is crafted by our master framers in Jetpur. Select a family below to explore realistic lighting, 360° 3D rotations, tactile page flips, and sample personalizations.
                </p>
              </div>
            </div>

            {/* Visual Product Showcase Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Card 1: Frames & Collages */}
              <div
                onClick={() => setActiveStudio("frames")}
                className="group cursor-pointer rounded-2xl bg-white border border-stone-200 hover:border-amber-700 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
              >
                <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden">
                  <img
                    src="/products/frame-sample-wedding.svg"
                    alt="Handcrafted Teak & Acrylic Frames"
                    className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-md text-amber-100 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                    Handcrafted Wood & Acrylic
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
                      Crafted frames that outlast time.
                    </h3>
                    <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                      Single, triptych, and multi-photo heritage collages in Saurashtra teak wood, charcoal matte, gold leaf, and floating acrylic.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                    <span className="text-stone-500 font-mono text-[11px]">8×12 to 20×30 in</span>
                    <span className="font-semibold text-amber-800 flex items-center gap-1">
                      Personalize & Preview <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: 3D Photo Mugs */}
              <div
                onClick={() => setActiveStudio("mugs")}
                className="group cursor-pointer rounded-2xl bg-white border border-stone-200 hover:border-amber-700 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
              >
                <div className="relative aspect-[4/3] bg-[#2E1C16] overflow-hidden flex items-center justify-center p-4">
                  <img
                    src="/products/mug-sample-couple.svg"
                    alt="3D Ceramic & Thermochromic Magic Mugs"
                    className="w-4/5 h-auto object-contain rounded-lg shadow-lg group-hover:scale-105 transition-transform duration-500"
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
                      Your memories, with every morning.
                    </h3>
                    <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                      Gloss white ceramic or thermochromic magic mugs that reveal your photograph when pouring hot chai or coffee.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                    <span className="text-stone-500 font-mono text-[11px]">Cold / Hot Thermal Switch</span>
                    <span className="font-semibold text-amber-800 flex items-center gap-1">
                      Rotate & Make Yours <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 3: Backlit LED Translight */}
              <div
                onClick={() => setActiveStudio("translight")}
                className="group cursor-pointer rounded-2xl bg-white border border-stone-200 hover:border-amber-700 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
              >
                <div className="relative aspect-[4/3] bg-[#14120E] overflow-hidden flex items-center justify-center p-3">
                  <div className="relative h-full aspect-[2/3] rounded-xs border-4 border-amber-950 shadow-[0_0_30px_rgba(255,200,100,0.35)] overflow-hidden">
                    <img
                      src="/products/translight-sample.svg"
                      alt="Backlit LED Translight"
                      className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-md text-amber-100 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                    Edge-Lit Optical Film
                  </div>
                  <div className="absolute bottom-3 right-3 bg-amber-600/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <SunMedium size={11} /> 3000K & 4000K
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-display text-xl font-bold text-stone-900 group-hover:text-amber-900 transition-colors">
                      Art that glows from within.
                    </h3>
                    <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                      Evenly diffused internal LED panel brings portraits to life in soft golden hour warmth or pure gallery white.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                    <span className="text-stone-500 font-mono text-[11px]">12×18 & 16×24 in</span>
                    <span className="font-semibold text-amber-800 flex items-center gap-1">
                      Experience Lighting <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 4: Devotional Collection */}
              <div
                onClick={() => setActiveStudio("devotional")}
                className="group cursor-pointer rounded-2xl bg-white border border-stone-200 hover:border-amber-700 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
              >
                <div className="relative aspect-[4/3] bg-[#16283D] overflow-hidden flex items-center justify-center p-3">
                  <img
                    src="/deities/shrinathji.svg"
                    alt="Sacred Devotional Art"
                    className="h-full aspect-[2/3] object-cover rounded shadow-lg group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-md text-amber-100 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                    Pavitra Darshan
                  </div>
                  <div className="absolute bottom-3 right-3 bg-amber-950/80 text-amber-200 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Flame size={11} /> 8 Sacred Deities
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-display text-xl font-bold text-stone-900 group-hover:text-amber-900 transition-colors">
                      Sacred blessings for your sanctum.
                    </h3>
                    <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                      Revered Gujarati deities including Shrinathji, Ganesha, Radha Krishna & Maa Umiya in Acrylic, Teak & Translight.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                    <span className="text-stone-500 font-mono text-[11px]">Mandir & Living Room</span>
                    <span className="font-semibold text-amber-800 flex items-center gap-1">
                      View Collection <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 5: Couple Story Magazine */}
              <div
                onClick={() => setActiveStudio("magazines")}
                className="group cursor-pointer rounded-2xl bg-white border border-stone-200 hover:border-amber-700 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between lg:col-span-2"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 h-full">
                  <div className="relative aspect-[4/3] sm:aspect-auto bg-[#1E1916] overflow-hidden flex items-center justify-center p-4">
                    <img
                      src="/products/magazine-cover.svg"
                      alt="Couple Story Editorial Magazine"
                      className="h-full max-h-[220px] aspect-[2/3] object-cover rounded shadow-2xl group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-md text-amber-100 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                      Editorial Keepsake
                    </div>
                  </div>
                  <div className="p-6 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest block mb-1">
                        8–20 Curated Photographs · Song QR
                      </span>
                      <h3 className="font-display text-2xl font-bold text-stone-900 group-hover:text-amber-900 transition-colors">
                        A love story, printed in timeless pages.
                      </h3>
                      <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                        Flip through a genuine romantic editorial magazine with chapter spreads, custom dates, vows, and an interactive QR code linked to your couple song.
                      </p>
                    </div>
                    <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                      <span className="text-stone-500 font-mono text-[11px]">Hardcover & Matte Spreads</span>
                      <span className="font-semibold text-amber-800 flex items-center gap-1">
                        Turn the Pages <ArrowRight size={13} />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="ed-wrap">
          <div className="ed-notice">
            <Layers size={18} />
            <p>
              <strong>Handcrafted in Jetpur.</strong> Every gift is tailored to your specifications, printed with archival inks, and verified with a personal digital proof on WhatsApp before production.
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
              <button className="ed-text-button" onClick={() => exportCatalogue(products)}>
                <Download size={16} /> Master catalogue CSV
              </button>
              <button className="ed-button outline" onClick={() => setShowQuote(true)}>
                Your quote list <span className="count-pill">{quote.length}</span>
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
                <div className="ed-empty">
                  <Search size={28} />
                  <h3>No matching keepsakes yet.</h3>
                  <p>Try a broader size, material or product family.</p>
                  <button className="ed-button outline" onClick={reset}>
                    Clear search & filters
                  </button>
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
                        <div className={"product-tile family-" + p.category}>
                          <span>{categories.find((c) => c.id === p.category)?.code}</span>
                          <span className="product-tile-code">{p.id}</span>
                          <span className="product-tile-caption">Product photography pending</span>
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
            </DialogTitle>
            <DialogDescription>
              Handcrafted in Jetpur. Personalize your keepsake, explore finishes, and confirm production with our master framers.
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
        </DialogContent>
      </Dialog>

      {/* Floating Shortlist / Checkout Pill */}
      {quote.length > 0 && (
        <aside
          aria-label="Order Shortlist Summary"
          className="fixed bottom-5 right-5 z-40 bg-stone-900/95 backdrop-blur-md text-amber-100 rounded-full pl-5 pr-2 py-2 shadow-2xl border border-amber-900/40 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4"
        >
          <div className="flex items-center gap-2 text-xs">
            <Package size={16} className="text-amber-400" />
            <span className="font-semibold">{quote.length} {quote.length === 1 ? "item" : "items"} in shortlist</span>
          </div>
          <button
            type="button"
            onClick={() => setShowQuote(true)}
            className="bg-amber-100 text-stone-950 font-bold text-xs px-4 py-2 rounded-full hover:bg-white transition-all shadow-xs flex items-center gap-1.5"
          >
            <span>Checkout</span>
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

            {isMug ? (
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
                  toast.success(`Added ${p.name} to your quotation shortlist.`);
                }
              }}
            >
              <Package size={16} /> Instant Checkout · ₹{(calculateVariantPriceInr(p.id, v?.size, v?.finish) * qty).toFixed(2)}
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
                toast.success(`Added ${p.name} to your quotation shortlist.`);
              }}
            >
              <Plus size={16} /> Add to Order Shortlist
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
