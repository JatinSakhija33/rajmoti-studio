import { liveBackend, backendUrl } from "@/lib/backend-mode";
import { toast } from "sonner";
import { giftRequestsEnabled } from "@/features/catalogue/gift-network";
import { telLink, waMessage, whatsappLink } from "@/lib/site";
export function installDemoGuards() {
  const headerContacts = new Set([telLink(), whatsappLink(waMessage.booking())].map(href => new URL(href, location.href).href));
  const originalFetch = window.fetch.bind(window);
  window.fetch = ((input: any, init?: RequestInit) => {
    const u = new URL(
      typeof input === "string" ? input : input.url || String(input),
      location.href,
    );
    const method = (init?.method || input?.method || "GET").toUpperCase();
    if (liveBackend && backendUrl && u.origin === new URL(backendUrl).origin)
      return originalFetch(input, init);
    if (giftRequestsEnabled() && u.origin === location.origin && /^\/api\/(orders(?:\/[^/]+\/(?:photos|payment))?|owner\/orders(?:\/[^/]+(?:\/(?:payments|photos\/[^/]+))?)?|track\/[^/]+)$/.test(u.pathname))
      return originalFetch(input, init);
    if (giftRequestsEnabled() && u.origin === "https://challenges.cloudflare.com") return originalFetch(input, init);
    if (u.origin !== location.origin || !["GET", "HEAD"].includes(method))
      return Promise.reject(new Error("External services are disabled in this demo"));
    return originalFetch(input, init);
  }) as typeof fetch;
  document.addEventListener(
    "click",
    (e) => {
      const el = (e.target as Element).closest("a");
      if (!el) return;
      const url = new URL(el.href, location.href);
      if (el.closest('.studio-nav') && el.hasAttribute('data-studio-contact') && headerContacts.has(el.href)) return;
      if (giftRequestsEnabled() && url.protocol === "upi:" && el.closest('[data-gift-payment="enabled"]')) return;
      if (url.origin !== location.origin && !url.href.startsWith("blob:")) {
        e.preventDefault();
        e.stopPropagation();
        toast.info("Preview only — external contact, checkout and sharing are disabled.");
      }
    },
    true,
  );
  const disableFiles = () =>
    document.querySelectorAll<HTMLInputElement>('input[type="file"]').forEach((el) => {
      if (el.closest('[data-owner-uploads="enabled"]')) return;
      if (el.closest('[data-gift-uploads="local"]')) return;
      el.disabled = true;
      el.title = "Customer uploads are disabled in this preview";
    });
  new MutationObserver(disableFiles).observe(document.documentElement, {
    subtree: true,
    childList: true,
  });
  disableFiles();
}
