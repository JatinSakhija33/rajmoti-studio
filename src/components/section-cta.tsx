import { Link } from "@tanstack/react-router";
import { MessageCircle, Phone } from "lucide-react";
import { telLink, whatsappLink } from "@/lib/site";

type Props = {
  /** Short, contextual question — e.g. "Planning a baby shoot?" */
  title: string;
  /** One supporting line, optional. */
  copy?: string;
  /** Pre-filled WhatsApp message so the enquiry arrives with its context. */
  whatsappMessage?: string;
  /** Label of the primary enquiry action. */
  enquireLabel?: string;
  /** Search params passed into the inquiry flow (e.g. package context). */
  enquireSearch?: Record<string, string>;
  showCall?: boolean;
  tone?: "light" | "dark";
};

/**
 * A quiet, contextual next step placed after a meaningful section.
 * Primary = Enquire, secondary = WhatsApp, tertiary = Call.
 */
export function SectionCta({
  title,
  copy,
  whatsappMessage,
  enquireLabel = "Enquire now",
  enquireSearch,
  showCall = true,
  tone = "light",
}: Props) {
  const dark = tone === "dark";
  return (
    <aside
      className={`mt-16 border-t pt-10 ${dark ? "border-cream/15 text-cream" : "border-onyx/10 text-onyx"}`}
    >
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div className="max-w-xl">
          <h2 className="font-display text-2xl md:text-3xl">{title}</h2>
          {copy && (
            <p className={`mt-2 text-sm ${dark ? "opacity-70" : "text-muted-foreground"}`}>{copy}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/contact"
            search={enquireSearch as never}
            className={`px-6 py-3 text-[10px] uppercase tracking-[0.25em] font-semibold transition-colors ${
              dark ? "bg-cream text-onyx hover:bg-gold hover:text-cream" : "bg-onyx text-cream hover:bg-gold"
            }`}
          >
            {enquireLabel}
          </Link>
          <a
            href={whatsappLink(whatsappMessage)}
            target="_blank"
            rel="noreferrer"
            className={`px-6 py-3 text-[10px] uppercase tracking-[0.25em] font-semibold border transition-colors flex items-center gap-2 ${
              dark ? "border-cream/30 hover:border-gold hover:text-gold" : "border-onyx/20 hover:border-gold hover:text-gold"
            }`}
          >
            <MessageCircle className="size-3.5" aria-hidden /> WhatsApp
          </a>
          {showCall && (
            <a
              href={telLink()}
              className={`text-[10px] uppercase tracking-[0.25em] font-semibold flex items-center gap-2 pb-1 border-b transition-colors ${
                dark ? "border-cream/25 hover:text-gold" : "border-onyx/20 hover:text-gold"
              }`}
            >
              <Phone className="size-3.5" aria-hidden /> Call the studio
            </a>
          )}
        </div>
      </div>
    </aside>
  );
}
