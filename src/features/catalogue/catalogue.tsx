import { GiftCustomizer } from "./GiftCustomizer";
import { GiftDiscovery, giftSample } from "./GiftDiscovery";
import { giftPrice, minimumGiftPrice } from "./gift-pricing";
import { rememberCartPhotos, type GiftDraft } from "./gift-design";
import { GiftCart } from "./GiftCart";
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
  Layers,
  Heart,
  Package,
  Scale,
  ShoppingBag,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import searchPages from "@/lib/search-pages.json";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import {
  categories,
  useProducts,
  useQuote,
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
export function Catalogue({ productId, preferredVariantId }: { productId?: string; preferredVariantId?: string }) {
  const [products] = useProducts();
  const [quote, setQuote] = useQuote();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<Filters>(initial);
  const [budget, setBudget] = useState<number | null>(null);
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
            (budget == null || (minimumGiftPrice(p) != null && minimumGiftPrice(p)! <= budget)) &&
            (!filters.category || p.category === filters.category || (filters.category === "magazines" && p.category === "albums")) &&
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
    [products, q, filters, sort, budget],
  );
  const update = (key: keyof Filters, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setShown(12);
  };
  const open = (id?: string) => {
    const variant = products.find((p) => p.id === id)?.variants
      .find((v) => v.size === filters.size)?.id;
    return navigate({ to: "/gifts", search: { product: id, variant }, resetScroll: false });
  };
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
        x.orderType === line.orderType &&
        Boolean(x.quoteOnly) === Boolean(line.quoteOnly) &&
        JSON.stringify(x.design || null) === JSON.stringify(line.design || null),
    );
    const next = [...quote];
    if (existing >= 0)
      next[existing] = {
        ...line,
        quantity: Math.min(9999, quote[existing].quantity + line.quantity),
      };
    else next.push(line);
    setQuote(next);
    toast.success(line.quoteOnly ? "Product added to your quote shortlist." : "Your gift design was saved to the cart.");
    open(undefined);
  }
  const active = Object.entries(filters).filter(([, v]) => v);
  const reset = () => {
    setFilters(initial);
    setQ("");
    setBudget(null);
    setShown(12);
  };
  return (
    <div className="editorial gift-store">
      <SiteNav />
      <main>
        <section className="gift-intro ed-wrap">
          <div>
            <p className="ed-kicker">The Rajmoti gift collection</p>
            <h1>
              Personalised photo gifts
              <br />
              <em>in Jetpur.</em>
            </h1>
            <p className="ed-copy">
              Turn a favourite photograph into a custom mug, wooden frame, acrylic print or keychain.
              Ask Rajmoti Studio for a quote, or try a design with your own photo.
            </p>
            <a className="ed-button" href="#directory">
              Explore the directory <ArrowRight size={16} />
            </a>

          </div>
          <figure className="gift-intro-image">
            <img
              src="/editorial/gift-still-life.webp"
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
              <strong>Make it personal.</strong> Upload a photograph to explore your design. Sample
              artwork illustrates the possibilities; materials and preparation times need studio
              confirmation. Items without a confirmed price are available by quotation.
            </p>
          </div>
        </div>
        <section className="ed-wrap ed-section">
          <h2>Explore popular personalised gifts</h2>
          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
            {searchPages.products.map((item) => <li key={item.slug}>
              <Link to="/gifts/$productSlug" params={{ productSlug: item.slug }} className="ed-text-button">{item.heading} <ArrowRight size={15} /></Link>
            </li>)}
          </ul>
        </section>
        <GiftDiscovery onCategory={value => { update("category", value); document.getElementById("directory")?.scrollIntoView({ behavior: "smooth" }); }} onOccasion={value => update("occasion", value)} onRecipient={value => update("recipient", value)} onBudget={value => { setBudget(value); setShown(12); }} onProduct={id => open(id)} />
        <section id="directory" className="ed-wrap directory-section">
          <div className="ed-section-heading">
            <div>
              <p className="ed-kicker">A thoughtful choice, down to the detail</p>
              <h2>Find your keepsake.</h2>
            </div>
            <div className="ed-actions">
              <button className="ed-button outline" onClick={() => setShowQuote(true)}>
                Your cart <span className="count-pill">{quote.length}</span>
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
                  <span>{products.filter((p) => p.category === c.id || (c.id === "magazines" && p.category === "albums")).length}</span>
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
                      <select aria-label={label} value={filters[key]} onChange={(e) => update(key, e.target.value)}>
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
                  {matching.slice(0, shown).map((p) => {
                    const illustratedProduct = p.imageKind === "Illustrative product image" ? p.image : undefined;
                    const image = illustratedProduct || (!p.id.startsWith("SHP-") ? giftSample(p.category, p.id) : "");
                    return <article className="product-card" key={p.id}>
                      <button
                        className={"compare-toggle " + (compare.includes(p.id) ? "selected" : "")}
                        onClick={() => toggleCompare(p.id)}
                        aria-label={`Compare ${p.name}`}
                        aria-pressed={compare.includes(p.id)}
                      >
                        {compare.includes(p.id) ? <Check size={15} /> : <Plus size={15} />}
                      </button>
                      <button className="product-card-main" onClick={() => open(p.id)}>
                        {image && (
                          <div className={"gift-product-photograph gift-family-" + p.category}>
                            <img src={image} alt="" loading="lazy" />
                            <small>{illustratedProduct ? "Illustrative product image" : "Sample artwork"}</small>
                          </div>
                        )}
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
                            <span>{minimumGiftPrice(p) == null ? "Price on request" : `From ₹${minimumGiftPrice(p)}`}</span>
                            <ArrowUpRight size={18} />
                          </div>
                        </div>
                      </button>
                    </article>;
                  })}
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
            Material and finish details are confirmed by the studio before an order.
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
        <DialogContent className="ed-modal product-modal gift-product-modal">
          <DialogHeader>
            <DialogTitle>{product?.name || "Product not found"}</DialogTitle>
            <DialogDescription>
              Choose your original variant and personalize it with the interactive preview.
            </DialogDescription>
          </DialogHeader>
          {product ? (
            <ProductDetail key={product.id + ":" + (preferredVariantId ?? "")} product={product} preferredVariantId={preferredVariantId} onAdd={add} />
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
              Select a variant in each column. Every specification is proposed, not confirmed
              inventory.
            </DialogDescription>
          </DialogHeader>
          <Compare products={products.filter((p) => compare.includes(p.id))} size={filters.size} />
        </DialogContent>
      </Dialog>
      {quote.length > 0 && <div className="gift-cart-pill"><button className="ed-button" onClick={() => setShowQuote(true)}><ShoppingBag size={17}/>Your cart <span>{quote.length}</span></button></div>}
      <GiftCart open={showQuote} onOpenChange={setShowQuote} />
    </div>
  );
}
function ProductDetail({
  product: p,
  preferredVariantId,
  onAdd,
}: {
  product: Product;
  preferredVariantId?: string;
  onAdd: (line: QuoteLine) => void;
}) {
  const [variantId, setVariant] = useState(
    p.variants.find((v) => v.id === preferredVariantId)?.id ?? p.variants[0]?.id ?? "",
  );
  const [qty, setQty] = useState(1);
  const [draft, setDraft] = useState<GiftDraft | undefined>();
  const [personalisation, setPersonalisation] = useState(p.personalisation[0]);
  const [packaging, setPackaging] = useState(p.packaging[0]);
  const [orderType, setOrderType] = useState(p.orderTypes[0]);
  const v = p.variants.find((v) => v.id === variantId)!;
  const unavailable = !Number.isInteger(qty) || qty < 1 || qty > 9999 ||
    p.availability === "Discontinued";
  const selection = { productId: p.id, variantId, quantity: qty, personalisation, packaging, orderType };
  const dims = (v?.size || "").match(/^(\d+)×(\d+) in$/);
  const w = dims ? Number(dims[1]) : 0;
  const h = dims ? Number(dims[2]) : 0;
  return (
    <>
      <div className="product-detail-grid">
        <div>
          <GiftCustomizer product={p} variant={v} onChange={setDraft} />
          <div className="product-info-note">
            <strong>Before we make it</strong>
            <p>
              We confirm the material, size, finish, artwork, price and delivery with you. The
              listed options are proposed catalogue records.
            </p>
          </div>
        </div>
        <div className="product-config">
          <p className="ed-kicker">
            {p.id} · {categories.find((c) => c.id === p.category)?.name}
          </p>
          <p>{p.description}</p>
          <label>
            Proposed size / variant
            <select aria-label="Proposed size / variant" value={variantId} onChange={(e) => setVariant(e.target.value)}>
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
            Personalisation
            <select aria-label="Personalisation" value={personalisation} onChange={(e) => setPersonalisation(e.target.value)}>
              {p.personalisation.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label>
            Packaging
            <select aria-label="Packaging" value={packaging} onChange={(e) => setPackaging(e.target.value)}>
              {p.packaging.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <div className="detail-price">
            <strong>{giftPrice(p,v) == null ? "Price on request" : `₹${giftPrice(p,v)}`}</strong>
            <span>Existing variant pricing is confirmed again by the order server.</span>
          </div>
          <button className="ed-button" disabled={unavailable}
            onClick={() => onAdd({ ...selection, quoteOnly: true })}>
            Add to quote shortlist <Plus size={16} />
          </button>
          <button className="ed-text-button" disabled={unavailable}
            onClick={() => {
              if (!draft || (draft.design.kind !== "devotional" &&
                (!draft.files.length || draft.design.photoSlots.some((slot) => slot.source !== "upload")))) {
                toast.error("Upload your own photo for each design slot before saving a design.");
                return;
              }
              rememberCartPhotos(draft);
              onAdd({ ...selection, design: draft.design });
            }}>
            Save design & add to cart
          </button>
          <small>You can request a quote without a photo. Uploaded previews remain on this device until you submit an order.</small>
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
function Compare({ products, size }: { products: Product[]; size: string }) {
  const [selected, setSelected] = useState<Record<string, string>>({});
  const variantFor = (p: Product) =>
    p.variants.find((v) => v.id === selected[p.id]) ??
    p.variants.find((v) => v.size === size) ??
    p.variants[0];
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
                  value={variantFor(p).id}
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
                const v = variantFor(p);
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
                  Price: giftPrice(p, v) == null ? "Price on request" : "₹" + giftPrice(p, v)?.toLocaleString("en-IN"),
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
