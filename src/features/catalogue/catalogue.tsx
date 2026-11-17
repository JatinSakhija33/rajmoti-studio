import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  Download,
  Heart,
  Plus,
  Scale,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import {
  categories,
  exportCatalogue,
  useFavourites,
  useProducts,
  useQuote,
  type Product,
  type QuoteLine,
} from "./store";
import {
  collections,
  inCollection,
  matchesDiscovery,
  sameQuoteLine,
  type BrowseSearch,
} from "./discovery";
import { ProductArt } from "./product-art";
import { ProductDetail } from "./personalizer";
import { QuoteDrawer } from "./quote-drawer";
import { Compare } from "./compare";
import { formatPrice } from "@/lib/site";
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
  availability: "",
};
type Filters = typeof initial;
function priceLabel(p: Product) {
  const prices = p.variants.flatMap((v) =>
    v.price != null && Number.isFinite(v.price) ? [v.price] : [],
  );
  return prices.length ? `From ${formatPrice(Math.min(...prices))}` : "Price on request";
}
export function Catalogue({
  productId,
  search = {},
}: {
  productId?: string;
  search?: BrowseSearch;
}) {
  const [products] = useProducts();
  const [quote, setQuote] = useQuote();
  const [favourites, setFavourites] = useFavourites();
  const [filters, setFilters] = useState<Filters>(initial);
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState("featured");
  const [shown, setShown] = useState(12);
  const [compare, setCompare] = useState<string[]>([]);
  const [comparing, setComparing] = useState(false);
  const [showQuote, setShowQuote] = useState(false);
  const navigate = useNavigate();
  const product = products.find((p) => p.id === productId);
  const currentCollection = collections.find((c) => c.id === search.collection);
  const title = search.saved
    ? "Your saved gifts."
    : currentCollection?.name ||
      (search.occasion
        ? `${search.occasion} gifts`
        : search.recipient
          ? `Gifts ${search.recipient === "Couples" ? "for couples" : search.recipient.toLowerCase()}`
          : "A little more personal.");
  function browse(next: Partial<BrowseSearch>, replace = false) {
    setShown(12);
    navigate({
      to: "/gifts",
      search: { ...search, ...next, product: undefined },
      replace,
      resetScroll: false,
    });
  }
  const open = (id?: string) =>
    navigate({ to: "/gifts", search: { ...search, product: id }, resetScroll: false });
  const update = (key: keyof Filters, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setShown(12);
  };
  const matching = useMemo(
    () =>
      products
        .filter(
          (p) =>
            matchesDiscovery(p, search) &&
            (!search.saved || favourites.includes(p.id)) &&
            (!filters.category || p.category === filters.category) &&
            (!filters.material || p.material === filters.material) &&
            (!filters.shape || p.shape === filters.shape) &&
            (!filters.size || p.variants.some((v) => v.size === filters.size)) &&
            (!filters.printing || p.printing === filters.printing) &&
            (!filters.capacity || p.photoCapacity === filters.capacity) &&
            (!filters.usage || p.usage === filters.usage) &&
            (!filters.personalisation || p.personalisation.includes(filters.personalisation)) &&
            (!filters.availability || p.availability === filters.availability),
        )
        .sort((a, b) =>
          sort === "az"
            ? a.name.localeCompare(b.name)
            : sort === "variants"
              ? b.variants.length - a.variants.length
              : 0,
        ),
    [products, search, filters, sort, favourites],
  );
  const active = Object.entries(filters).filter(([, value]) => value);
  const anyFilters =
    active.length > 0 ||
    !!(search.collection || search.occasion || search.recipient || search.q || search.saved);
  function reset() {
    setFilters(initial);
    browse({
      collection: undefined,
      occasion: undefined,
      recipient: undefined,
      q: undefined,
      saved: undefined,
    });
  }
  function toggleCompare(id: string) {
    if (compare.includes(id)) setCompare(compare.filter((v) => v !== id));
    else if (compare.length < 3) setCompare([...compare, id]);
    else toast.info("Compare up to three products at a time.");
  }
  function add(line: QuoteLine) {
    const existing = quote.findIndex((item) => sameQuoteLine(item, line));
    try {
      setQuote(
        existing >= 0
          ? quote.map((item, i) =>
              i === existing
                ? { ...item, quantity: Math.min(9999, item.quantity + line.quantity) }
                : item,
            )
          : [...quote, line],
      );
      toast.success("Saved to your quote list. Preview photos are not saved.");
      open(undefined).then(() => setShowQuote(true));
    } catch {
      toast.error(
        "Your browser could not save this selection. Please allow local storage and try again.",
      );
    }
  }
  function toggleFavourite(id: string) {
    try {
      setFavourites(
        favourites.includes(id) ? favourites.filter((v) => v !== id) : [...favourites, id],
      );
    } catch {
      toast.error("Your browser could not save this gift. Please check local storage.");
    }
  }
  return (
    <div className="editorial rs-store">
      <SiteNav />
      <main id="main-content" tabIndex={-1}>
        <div className="rs-wrap rs-breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/gifts">Photo gifts</Link>
          {search.collection && (
            <>
              <span>/</span>
              <span>{currentCollection?.name || search.collection}</span>
            </>
          )}
        </div>
        <section className="rs-catalogue-intro rs-wrap">
          <div>
            <p className="rs-eyebrow">THE RAJMOTI GIFT COLLECTION</p>
            <h1>{title}</h1>
            <p>
              {search.saved
                ? "The keepsakes you have your eye on, saved on this browser."
                : "Your favourite memories, with a place in everyday life. Find a keepsake, choose your details and make it yours."}
            </p>
          </div>
          <div className="rs-catalogue-intro-note">
            <ShoppingBag size={25} strokeWidth={1.25} />
            <span>
              Explore. Personalize. Enquire.
              <br />
              <small>Demonstration catalogue · prices & availability to confirm</small>
            </span>
          </div>
        </section>
        <section className="rs-wrap rs-catalogue-section" aria-label="Gift catalogue">
          <div className="rs-browse-pills" aria-label="Gift inspiration">
            {["Birthday", "Anniversary"].map((occasion) => (
              <button
                key={occasion}
                aria-pressed={search.occasion === occasion}
                className={search.occasion === occasion ? "active" : ""}
                onClick={() =>
                  browse({ occasion: search.occasion === occasion ? undefined : occasion })
                }
              >
                {occasion}
              </button>
            ))}
            {["For him", "For her", "Couples", "Parents"].map((recipient) => (
              <button
                key={recipient}
                aria-pressed={search.recipient === recipient}
                className={search.recipient === recipient ? "active" : ""}
                onClick={() =>
                  browse({ recipient: search.recipient === recipient ? undefined : recipient })
                }
              >
                {recipient === "Couples" ? "For couples" : recipient}
              </button>
            ))}
            <Link to="/portfolios">
              Photography services <ArrowRight size={14} />
            </Link>
          </div>
          <div className="rs-catalogue-layout">
            <aside className="rs-sidebar">
              <h2>Find your keepsake</h2>
              <button
                className={!search.collection ? "active" : ""}
                onClick={() => browse({ collection: undefined })}
              >
                All photo gifts <span>{products.length}</span>
              </button>
              {collections.map((c) => (
                <button
                  key={c.id}
                  className={search.collection === c.id ? "active" : ""}
                  onClick={() => {
                    setFilters(initial);
                    browse({ collection: c.id });
                  }}
                >
                  {c.name}
                  <span>{products.filter((p) => inCollection(p, c.id)).length}</span>
                </button>
              ))}
              <div className="rs-sidebar-help">
                <span>Not sure where to start?</span>
                <p>A little guidance can make choosing easier.</p>
                <Link to="/contact" className="rs-text-link">
                  Ask the studio <ArrowRight size={14} />
                </Link>
              </div>
              <button className="rs-download" onClick={() => exportCatalogue(products)}>
                <Download size={14} />
                Download catalogue CSV
              </button>
            </aside>
            <div className="rs-catalogue-results">
              <div className="rs-catalogue-toolbar">
                <label className="rs-search">
                  <Search size={19} />
                  <input
                    aria-label="Search product directory"
                    placeholder="Find a frame, a finish, a favourite…"
                    value={search.q || ""}
                    onChange={(e) => browse({ q: e.target.value || undefined }, true)}
                  />
                  {search.q && (
                    <button aria-label="Clear search" onClick={() => browse({ q: undefined })}>
                      <X size={16} />
                    </button>
                  )}
                </label>
                <button
                  className={`rs-filter-button ${showFilters ? "active" : ""}`}
                  aria-expanded={showFilters}
                  aria-controls="catalogue-filters"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <SlidersHorizontal size={17} />
                  Filters {active.length > 0 && `(${active.length})`}
                </button>
              </div>
              <label className="rs-mobile-collection">
                Collection
                <select
                  value={search.collection || ""}
                  onChange={(e) => {
                    setFilters(initial);
                    browse({ collection: e.target.value || undefined });
                  }}
                >
                  <option value="">All photo gifts</option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              {showFilters && (
                <div className="rs-filter-panel" id="catalogue-filters">
                  {(
                    [
                      ["category", "Product family", categories.map((c) => c.id)],
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
                        "Personalization",
                        products.flatMap((p) => p.personalisation),
                      ],
                      ["availability", "Availability", products.map((p) => p.availability)],
                    ] as [keyof Filters, string, string[]][]
                  ).map(([key, label, options]) => (
                    <label key={key}>
                      {label}
                      <select
                        aria-label={label}
                        value={filters[key]}
                        onChange={(e) => update(key, e.target.value)}
                      >
                        <option value="">All options</option>
                        {[...new Set(options)].sort().map((o) => (
                          <option key={o} value={o}>
                            {key === "category" ? categories.find((c) => c.id === o)?.name : o}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                  <button className="rs-text-link" onClick={() => setFilters(initial)}>
                    Reset detailed filters
                  </button>
                </div>
              )}
              {anyFilters && (
                <div className="rs-active-filters">
                  {(["collection", "occasion", "recipient", "saved"] as const)
                    .filter((key) => search[key])
                    .map((key) => (
                      <button key={key} onClick={() => browse({ [key]: undefined })}>
                        {key === "collection"
                          ? currentCollection?.name || search[key]
                          : key === "saved"
                            ? "Saved gifts"
                            : search[key]}
                        <X size={13} />
                      </button>
                    ))}
                  {active.map(([key, value]) => (
                    <button key={key} onClick={() => update(key as keyof Filters, "")}>
                      {key === "category" ? categories.find((c) => c.id === value)?.name : value}
                      <X size={13} />
                    </button>
                  ))}
                  <button onClick={reset}>Clear all</button>
                </div>
              )}
              <div className="rs-results-meta">
                <span role="status">
                  {matching.length} product{matching.length !== 1 ? "s" : ""}
                  {search.q && ` matching “${search.q}”`}
                </span>
                <label>
                  Sort by
                  <select
                    aria-label="Sort products"
                    value={sort}
                    onChange={(e) => {
                      setSort(e.target.value);
                      setShown(12);
                    }}
                  >
                    <option value="featured">Collection order</option>
                    <option value="az">Name A–Z</option>
                    <option value="variants">Most size options</option>
                  </select>
                </label>
              </div>
              {matching.length === 0 ? (
                <div className="rs-empty">
                  <Search size={30} strokeWidth={1.2} />
                  <h2>
                    {search.saved
                      ? "Your favourites will feel at home here."
                      : "Let’s find another little possibility."}
                  </h2>
                  <p>
                    {search.collection === "devotional"
                      ? "There are no devotional products listed in the existing catalogue. Ask the studio about a custom request."
                      : search.saved
                        ? "Tap the heart on a gift to save it here, or clear filters to see more."
                        : "Try a different search, collection or material."}
                  </p>
                  <button className="rs-button secondary" onClick={reset}>
                    Explore all photo gifts <ArrowRight size={16} />
                  </button>
                </div>
              ) : (
                <div className="rs-product-grid">
                  {matching.slice(0, shown).map((p) => (
                    <article className="rs-product-card" key={p.id}>
                      <button
                        className={`rs-favourite rs-icon ${favourites.includes(p.id) ? "selected" : ""}`}
                        aria-label={`${favourites.includes(p.id) ? "Unsave" : "Save"} ${p.name}`}
                        aria-pressed={favourites.includes(p.id)}
                        onClick={() => toggleFavourite(p.id)}
                      >
                        <Heart
                          size={18}
                          fill={favourites.includes(p.id) ? "currentColor" : "none"}
                        />
                      </button>
                      <Link
                        to="/gifts"
                        search={{ ...search, product: p.id }}
                        className="rs-product-link"
                      >
                        <ProductArt category={p.category} shape={p.shape} label />
                        <div className="rs-product-card-copy">
                          <p className="rs-eyebrow">
                            {p.material} · {p.shape}
                          </p>
                          <h2>{p.name}</h2>
                          <p>
                            {p.variants
                              .slice(0, 2)
                              .map((v) => v.size)
                              .join(" / ")}
                            {p.variants.length > 2 ? ` +${p.variants.length - 2} more` : ""}
                          </p>
                          <div className="rs-card-price">
                            <strong>{priceLabel(p)}</strong>
                            <ArrowRight size={17} />
                          </div>
                        </div>
                      </Link>
                      <button
                        className="rs-compare-toggle"
                        aria-pressed={compare.includes(p.id)}
                        onClick={() => toggleCompare(p.id)}
                      >
                        {compare.includes(p.id) ? <Check size={14} /> : <Plus size={14} />}Compare
                        <span className="sr-only"> {p.name}</span>
                      </button>
                    </article>
                  ))}
                </div>
              )}
              {shown < matching.length && (
                <div className="rs-load-more">
                  <p>
                    Showing {Math.min(shown, matching.length)} of {matching.length} products
                  </p>
                  <button className="rs-button secondary" onClick={() => setShown(shown + 12)}>
                    Discover more <Plus size={16} />
                  </button>
                </div>
              )}
              <p className="rs-catalogue-disclosure">
                The existing catalogue contains proposed product records and specifications.
                Illustrations are visual guides. Stock, materials, prices and preparation times
                require studio confirmation.
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
      {compare.length > 0 && (
        <div className="rs-compare-bar">
          <span>
            <Scale size={18} />
            {compare.length} of 3 selected
          </span>
          <button onClick={() => setCompare([])}>Clear</button>
          <button
            className="rs-button"
            disabled={compare.length < 2}
            onClick={() => setComparing(true)}
          >
            Compare <ArrowRight size={16} />
          </button>
        </div>
      )}
      <Dialog
        open={!!productId}
        onOpenChange={(value) => {
          if (!value) open(undefined);
        }}
      >
        <DialogContent className="rs-modal rs-product-modal">
          <DialogHeader className="rs-dialog-heading">
            <DialogTitle>{product?.name || "Product not found"}</DialogTitle>
            <DialogDescription>
              {product
                ? "Make it yours · choose a size, try a photo, save your selection."
                : "This product is no longer in the catalogue."}
            </DialogDescription>
            <DialogClose className="rs-detail-close rs-icon" aria-label="Close product">
              <X size={18} />
            </DialogClose>
          </DialogHeader>
          {product ? (
            <ProductDetail key={product.id} product={product} onAdd={add} />
          ) : (
            <div className="rs-empty">
              <p>Close this panel to continue browsing the collection.</p>
              <button className="rs-button" onClick={() => open(undefined)}>
                Back to gifts
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={comparing} onOpenChange={setComparing}>
        <DialogContent className="rs-modal rs-compare-modal">
          <DialogHeader>
            <DialogTitle>A closer look, side by side.</DialogTitle>
            <DialogDescription>
              Compare existing sizes and finishes. Specifications and availability require studio
              confirmation.
            </DialogDescription>
          </DialogHeader>
          <Compare products={products.filter((p) => compare.includes(p.id))} />
        </DialogContent>
      </Dialog>
      <QuoteDrawer open={showQuote} onOpenChange={setShowQuote} />
    </div>
  );
}
