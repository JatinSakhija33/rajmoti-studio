import { Link } from "@tanstack/react-router";
import { MessageCircle, Phone } from "lucide-react";
import { telLink, whatsappLink } from "@/lib/site";

type Crumb = { label: string; to?: string; params?: Record<string, string> };

type Props = {
  eyebrow?: string;
  title: string;
  description?: string | null;
  /** Large editorial cover behind the heading. */
  coverUrl?: string | null;
  /** "48 photographs" style meta line. */
  meta?: string;
  crumbs?: Crumb[];
  whatsappMessage?: string;
};

/**
 * Editorial masthead used across every portfolio surface: a quiet cover,
 * the breadcrumb trail, and the two next actions a visitor actually wants.
 */
export function PortfolioHero({
  eyebrow,
  title,
  description,
  coverUrl,
  meta,
  crumbs = [],
  whatsappMessage,
}: Props) {
  return (
    <header className="relative overflow-hidden bg-onyx text-cream">
      {coverUrl && (
        <>
          <img
            src={coverUrl}
            alt=""
            aria-hidden
            className="absolute inset-0 size-full object-cover opacity-45 scale-105"
            loading="eager"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-onyx via-onyx/70 to-onyx/40" />
        </>
      )}
      <div className="container-page relative py-20 md:py-28">
        {crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="eyebrow mb-6 text-cream/60 flex flex-wrap items-center gap-x-2">
            {crumbs.map((c, i) => (
              <span key={`${c.label}-${i}`} className="flex items-center gap-2">
                {i > 0 && <span aria-hidden className="opacity-40">/</span>}
                {c.to ? (
                  <Link to={c.to} params={c.params as never} className="hover:text-gold transition-colors">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-cream">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}

        {eyebrow && <p className="eyebrow text-gold mb-3">{eyebrow}</p>}
        <h1 className="font-display text-5xl md:text-7xl leading-[1.03] max-w-3xl">{title}</h1>
        {description && (
          <p className="mt-6 max-w-xl text-cream/75 leading-relaxed">{description}</p>
        )}
        {meta && <p className="eyebrow mt-6 text-cream/50">{meta}</p>}

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            to="/book"
            className="px-7 py-3 bg-gold text-onyx eyebrow hover:bg-gold/90 transition-colors"
          >
            Book a session
          </Link>
          <a
            href={whatsappLink(whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-7 py-3 border border-cream/30 text-cream eyebrow inline-flex items-center gap-2 hover:border-gold hover:text-gold transition-colors"
          >
            <MessageCircle className="size-4" aria-hidden /> WhatsApp
          </a>
          <a
            href={telLink()}
            className="px-4 py-3 text-cream/60 eyebrow inline-flex items-center gap-2 hover:text-gold transition-colors"
          >
            <Phone className="size-4" aria-hidden /> Call the studio
          </a>
        </div>
      </div>
    </header>
  );
}
