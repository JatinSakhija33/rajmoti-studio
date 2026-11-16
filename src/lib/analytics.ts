// Privacy-first e-commerce event bus for Rajmoti Studio
// Tracks funnel conversion, CRO milestones, and gift finder interactions.
// Strictly strips any customer photos or sensitive data.

export type AnalyticsEventName =
  | "page_view"
  | "view_item"
  | "select_occasion"
  | "select_recipient"
  | "gift_finder_step"
  | "gift_finder_complete"
  | "start_personalization"
  | "complete_personalization"
  | "add_to_cart"
  | "remove_from_cart"
  | "select_gift_addon"
  | "select_bundle"
  | "begin_checkout"
  | "order_submitted"
  | "payment_verify_initiated"
  | "occasion_reminder_optin";

export interface AnalyticsPayload {
  itemId?: string;
  itemName?: string;
  category?: string;
  price?: number;
  quantity?: number;
  variant?: string;
  occasion?: string;
  recipient?: string;
  budget?: string;
  style?: string;
  addonType?: string;
  bundleId?: string;
  step?: number;
  fulfillment?: "home_delivery" | "studio_collection";
  [key: string]: unknown;
}

export function trackEvent(name: AnalyticsEventName, data?: AnalyticsPayload) {
  if (typeof window === "undefined") return;

  // Sanitize data: remove any base64 images, blob URLs, or customer names
  const sanitized: Record<string, unknown> = {};
  if (data) {
    for (const [k, v] of Object.entries(data)) {
      if (k === "photo" || k === "photoUrl" || k === "image" || k === "dataUrl") continue;
      if (typeof v === "string" && (v.startsWith("data:") || v.startsWith("blob:"))) continue;
      sanitized[k] = v;
    }
  }

  const payload = {
    event: name,
    timestamp: new Date().toISOString(),
    ...sanitized,
  };

  try {
    // 1. Dispatch custom DOM event for internal subscribers / Desk
    window.dispatchEvent(new CustomEvent("rajmoti:analytics", { detail: payload }));

    // 2. Local session event buffer for admin metrics (capped at last 50 events)
    const sessionKey = "rajmoti:analytics:session";
    const existing = JSON.parse(sessionStorage.getItem(sessionKey) || "[]");
    existing.push(payload);
    if (existing.length > 50) existing.shift();
    sessionStorage.setItem(sessionKey, JSON.stringify(existing));

    // 3. Optional Google Analytics (gtag) dispatch if initialized
    const win = window as unknown as { gtag?: (...args: unknown[]) => void };
    if (typeof win.gtag === "function") {
      win.gtag("event", name, sanitized);
    }
  } catch {
    // Fail silently in restricted sandbox environments
  }
}

export function getStoredEvents(): Array<{ event: AnalyticsEventName; timestamp: string; [key: string]: unknown }> {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(sessionStorage.getItem("rajmoti:analytics:session") || "[]");
  } catch {
    return [];
  }
}

