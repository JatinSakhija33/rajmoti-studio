import { Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Menu, X, Heart, ArrowUpRight, MessageCircle } from "lucide-react";
import { useStyles } from "@/features/catalogue/store";
import { SITE, telLink, waMessage, whatsappLink } from "@/lib/site";
import "./site-nav.css";
const links = [
  { to: "/", label: "Home" },
  { to: "/portfolios", label: "Photography" },
  { to: "/gifts", label: "Products" },
  { to: "/packages", label: "Collections" },
  { to: "/about", label: "Our Studio" },
  { to: "/contact", label: "Contact" },
] as const;
export function SiteNav({ overlay = false }: { overlay?: boolean }) {
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const [styles] = useStyles();
  const enquiryUrl = whatsappLink(waMessage.booking());
  return (
    <header
      className="studio-nav"
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          setOpen(false);
          menuButton.current?.focus();
        }
      }}
    >
      <div className="ed-wrap studio-nav-inner">
        <Link
          to="/"
          className="studio-wordmark"
          aria-label="Rajmoti Studio home"
          onClick={() => setOpen(false)}
        >
          RAJMOTI<span>STUDIO · JETPUR</span>
        </Link>
        <nav className="studio-desktop-links" aria-label="Main navigation">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              activeProps={{ className: "current" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="studio-nav-actions">
          <a
            className="studio-nav-phone"
            href={telLink()}
            data-studio-contact="phone"
            aria-label={`Call Rajmoti Studio at ${SITE.whatsapp}`}
          >
            Call us · {SITE.whatsapp}
          </a>
          <Link
            to="/contact"
            aria-label={`Your saved styles, ${styles.length}`}
            className="nav-saved"
          >
            <Heart size={22} strokeWidth={1.7} />
            {styles.length > 0 && <span>{styles.length}</span>}
          </Link>
          <a
            href={enquiryUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-studio-contact="enquiry"
            className="ed-button nav-enquire"
          >
            <MessageCircle size={19} strokeWidth={1.7} />
            <span>Enquire</span>
            <ArrowUpRight size={15} />
          </a>
          <button
            ref={menuButton}
            type="button"
            className="mobile-menu-button"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            aria-controls="studio-mobile-menu"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="studio-mobile-menu" className="studio-mobile-menu" aria-label="Mobile navigation">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              activeProps={{ className: "current" }}
              onClick={() => setOpen(false)}
            >
              {l.label}
              <ArrowUpRight size={16} />
            </Link>
          ))}
          <div className="studio-mobile-contact">
            <a
              className="ed-button nav-enquire"
              href={enquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-studio-contact="enquiry"
              onClick={() => setOpen(false)}
            >
              <MessageCircle size={18} />
              Enquire
              <ArrowUpRight size={15} />
            </a>
            <a href={telLink()} data-studio-contact="phone">
              Call us · {SITE.whatsapp}
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
