import { useState, useEffect } from "react";
import { MessageCircle, X } from "lucide-react";
import { useLocation } from "@tanstack/react-router";
import { SITE, whatsappLink } from "@/lib/site";

export function WhatsAppFloat({ message }: { message?: string }) {
  const location = useLocation();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Show a gentle greeting bubble after 3.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!dismissed) setShowPrompt(true);
    }, 3500);
    return () => clearTimeout(timer);
  }, [dismissed]);

  // Determine context message if not provided explicitly
  const getContextMessage = () => {
    if (message) return message;
    const path = location.pathname;
    if (path.includes("/baby")) {
      return `Namaste ${SITE.name}! 👶 I would like to inquire about booking a Baby / Milestone photoshoot in Jetpur. Could you please share session details and pricing?`;
    }
    if (path.includes("/maternity")) {
      return `Namaste ${SITE.name}! 🌸 I'm interested in a Maternity photoshoot session. Could you share available dates and collection packages?`;
    }
    if (path.includes("/wedding")) {
      return `Namaste ${SITE.name}! 💍 We are planning a wedding/pre-wedding in Gujarat and would love to check your team's dates and packages.`;
    }
    if (path.includes("/gifts")) {
      return `Namaste ${SITE.name}! 🎁 I'm interested in customized photo frames and personalized studio gifts. Could you help me choose the right size and finish?`;
    }
    if (path.includes("/packages")) {
      return `Namaste ${SITE.name}! 📸 I was reviewing your studio packages and would like personal guidance for an upcoming shoot.`;
    }
    return `Namaste ${SITE.name}! ✨ I visited your website and would love to speak with the studio about booking a photography session.`;
  };

  const targetUrl = whatsappLink(getContextMessage());

  return (
    <aside aria-label="WhatsApp Studio Assistant" className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2 print:hidden">
      {showPrompt && !dismissed && (
        <div className="relative max-w-[280px] rounded-2xl bg-white p-3.5 shadow-xl border border-amber-200/60 text-stone-800 transition-all duration-300 animate-fade-in-up">
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="absolute -top-1.5 -right-1.5 rounded-full bg-stone-100 p-1 text-stone-500 hover:bg-stone-200 focus:outline-none"
            aria-label="Dismiss chat prompt"
          >
            <X size={12} />
          </button>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-semibold tracking-wider uppercase text-amber-900/80">
              Rajmoti Studio · Jetpur
            </span>
          </div>
          <p className="text-xs leading-relaxed text-stone-700">
            Have questions about shoots, framing, or print sizes? Chat directly with the studio owner.
          </p>
        </div>
      )}

      <a
        href={targetUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Rajmoti Studio on WhatsApp"
        className="group relative flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-emerald-900/20 transition-transform duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2"
      >
        <span className="absolute -inset-1 rounded-full bg-[#25D366]/30 animate-ping opacity-70" />
        <MessageCircle className="size-7 transition-transform group-hover:rotate-6" />
      </a>
    </aside>
  );
}
