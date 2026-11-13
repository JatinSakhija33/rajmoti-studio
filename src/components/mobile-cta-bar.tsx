import { Phone, MessageCircle, Calendar } from "lucide-react";
import { Link, useLocation } from "@tanstack/react-router";
import { telLink, whatsappLink, SITE } from "@/lib/site";

export function MobileCtaBar({ message }: { message?: string }) {
  const location = useLocation();
  const path = location.pathname;

  // Don't show public bottom bar on owner desk or admin views
  if (path.startsWith("/desk") || path.startsWith("/admin")) {
    return null;
  }

  const defaultMsg = message || `Namaste ${SITE.name}! I am browsing your website from my mobile and would love to enquire about your photography services and photo gifts.`;
  const waUrl = whatsappLink(defaultMsg);

  return (
    <nav
      aria-label="Quick mobile contact actions"
      className="fixed bottom-0 inset-x-0 z-30 md:hidden bg-[#FFFCF7]/95 backdrop-blur-md border-t border-[#EAE4DC] px-3.5 py-2.5 flex items-center justify-between gap-2 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] print:hidden"
    >
      <a
        href={telLink()}
        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border border-stone-300/80 bg-white text-stone-800 text-xs font-medium active:bg-stone-100 transition-colors"
        aria-label={"Call studio at " + SITE.whatsapp}
      >
        <Phone size={14} className="text-stone-600" />
        <span>Call</span>
      </a>

      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-[#25D366] text-white text-xs font-semibold shadow-sm active:opacity-90 transition-opacity"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle size={15} />
        <span>WhatsApp</span>
      </a>

      <Link
        to="/contact"
        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-[#29251F] text-[#FAF7F1] text-xs font-semibold active:opacity-90 transition-opacity text-center"
      >
        <Calendar size={14} />
        <span>Enquire</span>
      </Link>
    </nav>
  );
}

export function MobileCtaSpacer() {
  return <div className="h-16 md:hidden print:hidden" aria-hidden="true" />;
}
