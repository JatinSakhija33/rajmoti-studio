import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, Heart, ArrowUpRight, MessageCircle } from "lucide-react";
import { whatsappLink, waMessage, telLink, SITE } from "@/lib/site";
import { useStyles } from "@/features/catalogue/store";

const links = [
  { to: "/", label: "Home" },
  { to: "/portfolios", label: "Photography" },
  { to: "/gifts", label: "Photo Gifts" },
  { to: "/packages", label: "Collections" },
  { to: "/about", label: "Our Studio" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteNav({ overlay = false }: { overlay?: boolean }) {
  const [open, setOpen] = useState(false);
  const [styles] = useStyles();

  return (
    <header className={`studio-nav ${overlay ? "studio-nav-overlay" : ""}`}>
      <div className="ed-wrap studio-nav-inner">
        <Link to="/" className="studio-wordmark" aria-label="Rajmoti Studio home">
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
            className="studio-nav-phone hidden lg:inline-flex"
            href={telLink()}
            aria-label={"Call Rajmoti Studio at " + SITE.whatsapp}
          >
            Call us · {SITE.whatsapp}
          </a>

          <Link
            to="/contact"
            aria-label={`Your saved styles, ${styles.length}`}
            className="nav-saved"
          >
            <Heart size={18} />
            {styles.length > 0 && <span>{styles.length}</span>}
          </Link>

          <a
            className="ed-button nav-enquire"
            href={whatsappLink(waMessage.booking())}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle size={15} />
            <span>Enquire</span>
            <ArrowUpRight size={13} />
          </a>

          <button
            className="mobile-menu-button md:hidden"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 top-[65px] z-50 bg-[#29251F]/40 backdrop-blur-sm md:hidden animate-fade-in-up"
          onClick={() => setOpen(false)}
        >
          <nav
            className="studio-mobile-menu bg-[#FAF7F1] border-b border-[#EAE4DC] p-6 shadow-2xl flex flex-col gap-4"
            aria-label="Mobile navigation drawer"
            onClick={(e) => e.stopPropagation()}
          >
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                activeOptions={{ exact: l.to === "/" }}
                activeProps={{ className: "text-[#B49A72] font-semibold" }}
                className="flex items-center justify-between text-base py-2 border-b border-stone-200/50 text-stone-800"
                onClick={() => setOpen(false)}
              >
                <span>{l.label}</span>
                <ArrowUpRight size={16} className="text-stone-400" />
              </Link>
            ))}

            <div className="pt-2 flex flex-col gap-3">
              <a
                href={whatsappLink(waMessage.general())}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] text-white font-semibold text-sm shadow-sm"
              >
                <MessageCircle size={17} />
                <span>Chat on WhatsApp</span>
              </a>

              <a
                href={telLink()}
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-sm font-medium"
              >
                Call studio: {SITE.whatsapp}
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
