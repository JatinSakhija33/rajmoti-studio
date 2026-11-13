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
              <span>{products.length} product concepts</span>
              <span>Made personal</span>
            </div>
          </div>
          <figure className="gift-intro-image">
            <img
              src="/editorial/gift-still-life.png"
              width="1536"
              height="1024"
              alt="Illustrative photo frame, acrylic block, album and gift packaging"
            />
            <figcaption>
              Illustrative concept photography · actual products to be confirmed
            </figcaption>
          </figure>
        </section>
        <div className="ed-wrap">
          <div className="ed-notice">
            <Layers size={18} />
            <p>
              <strong>A catalogue to explore.</strong> All records and variant specifications below
              are demonstrations. Stock, materials, prices and preparation times require studio
              confirmation. No orders or payments are placed here.
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
                          <p className="product-size-list">
                            {p.variants
                              .slice(0, 3)
                              .map((v) => v.size)
                              .join(" / ")}
                            {p.variants.length > 3 ? ` +${p.variants.length - 3} more` : ""}
                          </p>
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
            Material descriptions guide your selection; no supplier or durability claims are
            verified in this demo.
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
            <ProductDetail key={product.id} product={product} onAdd={add} />
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
      <Dialog open={showQuote} onOpenChange={setShowQuote}>
        <DialogContent className="ed-modal">
          <DialogHeader>
            <DialogTitle>Your quotation shortlist</DialogTitle>
            <DialogDescription>Saved on this browser. No order has been placed.</DialogDescription>
          </DialogHeader>
          {quote.length === 0 ? (
            <div className="ed-empty">
              <Package />
              <p>Open a product, choose a variant and add it here.</p>
            </div>
          ) : (
            <>
              <div className="quote-lines">
                {quote.map((line, i) => {
                  const p = products.find((p) => p.id === line.productId);
                  const v = p?.variants.find((v) => v.id === line.variantId);
                  return (
                    <article key={i}>
                      <div>
                        <strong>{p?.name || line.productId}</strong>
                        <p>
                          {v?.size} · Qty {line.quantity} · {line.personalisation}
                        </p>
                        <small>
                          {line.packaging} · {line.orderType} · Price to confirm
                        </small>
                      </div>
                      <button
                        aria-label={`Remove ${p?.name}`}
                        onClick={() => setQuote(quote.filter((_, j) => j !== i))}
                      >
                        <X size={18} />
                      </button>
                    </article>
                  );
                })}
              </div>
              <Link to="/contact" className="ed-button" onClick={() => setShowQuote(false)}>
                Proceed to Studio Enquiry <ArrowRight size={16} />
              </Link>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
function ProductDetail({
  product: p,
  onAdd,
}: {
  product: Product;
  onAdd: (line: QuoteLine) => void;
}) {
  const [variantId, setVariant] = useState(p.variants[0]?.id || "");
  const [qty, setQty] = useState(1);
  const [personalisation, setPersonalisation] = useState(p.personalisation[0]);
  const [packaging, setPackaging] = useState(p.packaging[0]);
  const [orderType, setOrderType] = useState(p.orderTypes[0]);
  const [customText, setCustomText] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resolutionWarning, setResolutionWarning] = useState("");

  const v = p.variants.find((v) => v.id === variantId)!;
  const dims = (v?.size || "").match(/^(\d+)×(\d+) in$/);
  const w = dims ? Number(dims[1]) : 0;
  const h = dims ? Number(dims[2]) : 0;

  const onPhotoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    const img = new Image();
    img.src = url;
    img.onload = () => {
      if (img.naturalWidth < 1200 || img.naturalHeight < 1200) {
        setResolutionWarning(
          `Resolution advisory: This photo is ${img.naturalWidth}×${img.naturalHeight}px. For best print fidelity on ${v.size}, a camera original (1500px+) is recommended.`,
        );
      } else {
        setResolutionWarning("");
      }
    };
  };

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
        <div>
          {/* Visual Product Stage with Bleed Boundary */}
          <div className="size-stage relative overflow-hidden bg-[#FAF7F1] border border-stone-300 rounded-2xl flex items-center justify-center min-h-[260px] p-4">
            <div className="size-guide">
              <span>{v.size} Preview Stage</span>
            </div>

            {previewUrl ? (
              <div
                className="relative rounded shadow-md overflow-hidden bg-stone-200"
                style={{
                  width: dims ? Math.min((w / 30) * 100, 95) + "%" : "80%",
                  height: dims ? Math.min((h / 30) * 100, 95) + "%" : "200px",
                }}
              >
                <img
                  src={previewUrl}
                  alt="Customer customization preview"
                  className="size-full object-cover"
                />
                {/* Print Bleed & Safe Zone Overlay */}
                <div className="absolute inset-2 border border-dashed border-amber-400/90 pointer-events-none flex items-end justify-center pb-1">
                  <span className="text-[9px] font-bold tracking-wider uppercase bg-[#29251F]/70 text-white px-1.5 py-0.5 rounded">
                    Safe Print Boundary
                  </span>
                </div>
              </div>
            ) : dims ? (
              <div
                className="selected-size"
                style={{
                  width: Math.min((w / 30) * 100, 95) + "%",
                  height: Math.min((h / 30) * 100, 95) + "%",
                }}
              >
                <span>{v.size}</span>
              </div>
            ) : (
              <div className="nondimensional">
                <Layers size={36} />
                <span>{v.size}</span>
              </div>
            )}
          </div>

          {/* Client-Side Photo Uploader for Instant Simulation */}
          <div className="mt-3 p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-stone-800">Preview with your photograph</span>
              <label className="cursor-pointer text-xs font-semibold text-[#8B6D3F] hover:underline flex items-center gap-1">
                <Upload size={13} /> Choose photo
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={onPhotoSelected}
                />
              </label>
            </div>
            {previewUrl ? (
              <p className="text-[11px] text-emerald-700">✓ Photo loaded in browser memory for preview</p>
            ) : (
              <p className="text-[11px] text-stone-500">
                Processed locally on your device. Never uploaded until you submit an order.
              </p>
            )}

            {resolutionWarning && (
              <div className="flex items-start gap-1.5 text-amber-900 bg-amber-50 p-2 rounded border border-amber-200 text-[11px]">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{resolutionWarning}</span>
              </div>
            )}
          </div>

          <div className="product-info-note mt-3">
            <strong>Studio Craftsmanship Guarantee</strong>
            <p>
              Every frame, acrylic, and print is handcrafted in Jetpur. We confirm material, finish, crop, and
              proof with you before final production.
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

          {/* Action Buttons: WhatsApp & Shortlist */}
          <div className="flex flex-col gap-2 pt-2">
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
