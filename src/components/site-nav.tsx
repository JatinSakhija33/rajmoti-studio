import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Aperture, ArrowRight, Camera, Heart, Menu, Search, ShoppingBag, X } from "lucide-react";
import { useFavourites, useQuote } from "@/features/catalogue/store";
import { collections } from "@/features/catalogue/discovery";
import { QuoteDrawer } from "@/features/catalogue/quote-drawer";

export function SiteNav({ overlay = false }: { overlay?: boolean }) {
  const [open, setOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [quote] = useQuote();
  const [favourites] = useFavourites();
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setOpen(false);
    setSearchOpen(false);
    const main = document.querySelector("main");
    if (main && !main.id) {
      main.id = "main-content";
      main.tabIndex = -1;
    }
  }, [location.pathname, location.searchStr]);
  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);
  useEffect(() => {
    if (!open && !searchOpen) return;
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open, searchOpen]);
  return (
    <>
      <a href="#main-content" className="rs-skip">
        Skip to content
      </a>
      <header className="rs-nav">
        <div className="rs-nav-main rs-wrap">
          <button
            className="rs-icon rs-menu-toggle"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            aria-controls="store-mobile-menu"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
          <Link to="/" className="rs-brand" aria-label="Rajmoti Studio home">
            <Aperture size={35} strokeWidth={1.25} />
            <span>
              rajmoti<span>STUDIO · PHOTOS & KEEPSAKES</span>
            </span>
          </Link>
          <nav className="rs-main-links" aria-label="Main navigation">
            <Link to="/gifts" activeProps={{ className: "current" }}>
              Shop photo gifts
            </Link>
            <Link to="/gifts" search={{ occasion: "Birthday" }}>
              Birthday
            </Link>
            <Link to="/gifts" search={{ occasion: "Anniversary" }}>
              Anniversary
            </Link>
            <Link to="/portfolios" activeProps={{ className: "current" }}>
              Photography
            </Link>
            <Link to="/about" activeProps={{ className: "current" }}>
              Our studio
            </Link>
          </nav>
          <div className="rs-nav-tools">
            <button
              className="rs-icon"
              aria-label="Search products"
              aria-expanded={searchOpen}
              aria-controls="store-search"
              onClick={() => setSearchOpen(!searchOpen)}
            >
              <Search size={21} />
            </button>
            <Link
              to="/gifts"
              search={{ saved: true }}
              className="rs-icon rs-nav-favourites"
              aria-label={`Saved gifts, ${favourites.length}`}
            >
              <Heart size={21} />
              {favourites.length > 0 && <span className="rs-count">{favourites.length}</span>}
            </Link>
            <button
              className="rs-icon"
              aria-label={`Open quote list, ${quote.length} selections`}
              onClick={() => setQuoteOpen(true)}
            >
              <ShoppingBag size={21} />
              <span className="rs-count">{quote.length}</span>
            </button>
          </div>
        </div>
        <nav className="rs-category-nav" aria-label="Shop collections">
          <div className="rs-wrap">
            {collections.map((c) => (
              <Link key={c.id} to="/gifts" search={{ collection: c.id }}>
                {c.name}
              </Link>
            ))}
            <Link to="/portfolios">
              <Camera size={14} />
              Studio sessions
            </Link>
          </div>
        </nav>
        {searchOpen && (
          <form
            id="store-search"
            className="rs-nav-search rs-wrap"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ to: "/gifts", search: { q: query.trim() || undefined } });
              setSearchOpen(false);
            }}
          >
            <Search size={20} />
            <input
              ref={searchRef}
              aria-label="Search the gift collection"
              placeholder="Try photo frames, acrylic, albums…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className="rs-button">
              Search <ArrowRight size={15} />
            </button>
            <button
              type="button"
              className="rs-icon"
              aria-label="Close search"
              onClick={() => setSearchOpen(false)}
            >
              <X size={18} />
            </button>
          </form>
        )}
        {open && (
          <nav
            id="store-mobile-menu"
            className="rs-mobile-menu rs-wrap"
            aria-label="Mobile navigation"
          >
            <Link to="/gifts">
              All photo gifts <ArrowRight size={17} />
            </Link>
            <Link to="/gifts" search={{ saved: true }}>
              <Heart size={15} />
              Saved gifts ({favourites.length})
            </Link>
            {collections.map((c) => (
              <Link key={c.id} to="/gifts" search={{ collection: c.id }}>
                {c.name}
              </Link>
            ))}
            <div className="rs-mobile-edits">
              {["Birthday", "Anniversary"].map((occasion) => (
                <Link key={occasion} to="/gifts" search={{ occasion }}>
                  {occasion} gifts
                </Link>
              ))}
              <Link to="/gifts" search={{ recipient: "For him" }}>
                Gifts for him
              </Link>
              <Link to="/gifts" search={{ recipient: "For her" }}>
                Gifts for her
              </Link>
              <Link to="/gifts" search={{ recipient: "Couples" }}>
                For couples
              </Link>
            </div>
            <Link to="/portfolios">Photography & sessions</Link>
            <Link to="/stories">Our stories</Link>
            <Link to="/packages">Session collections</Link>
            <Link to="/about">Our studio</Link>
            <Link to="/contact">Get in touch</Link>
          </nav>
        )}
      </header>
      <QuoteDrawer open={quoteOpen} onOpenChange={setQuoteOpen} />
    </>
  );
}
