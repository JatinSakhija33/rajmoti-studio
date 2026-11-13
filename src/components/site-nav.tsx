import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, Heart, ArrowUpRight } from "lucide-react";
import { useStyles } from "@/features/catalogue/store";
const links = [
  { to: "/portfolios", label: "Photography" },
  { to: "/stories", label: "Our stories" },
  { to: "/gifts", label: "Photo gifts" },
  { to: "/packages", label: "Collections" },
  { to: "/about", label: "The studio" },
] as const;
export function SiteNav({ overlay = false }: { overlay?: boolean }) {
  const [open, setOpen] = useState(false);
  const [styles] = useStyles();
  return (
    <header className="studio-nav">
      <div className="ed-wrap studio-nav-inner">
        <Link to="/" className="studio-wordmark" aria-label="Rajmoti Studio home">
          RAJMOTI<span>STUDIO · JETPUR</span>
        </Link>
        <nav className="studio-desktop-links" aria-label="Main navigation">
          {links.map((l) => (
            <Link key={l.to} to={l.to} activeProps={{ className: "current" }}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="studio-nav-actions">
          <Link
            to="/contact"
            aria-label={`Your saved styles, ${styles.length}`}
            className="nav-saved"
          >
            <Heart size={18} />
            {styles.length > 0 && <span>{styles.length}</span>}
          </Link>
          <Link to="/contact" className="ed-button nav-enquire">
            Plan your session <ArrowUpRight size={15} />
          </Link>
          <button
            className="mobile-menu-button"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="studio-mobile-menu" aria-label="Mobile navigation">
          {links.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)}>
              {l.label}
              <ArrowUpRight size={16} />
            </Link>
          ))}
          <Link to="/contact" onClick={() => setOpen(false)}>
            Plan your session
          </Link>
        </nav>
      )}
    </header>
  );
}
