/**
 * WhatsApp-first Customer Directory helpers.
 *
 * ONE source of truth for:
 *  - phone normalisation
 *  - service -> portfolio URL mapping
 *  - the prefilled customer WhatsApp message
 *  - the wa.me link itself
 *
 * This is deliberately separate from the photograph sharing system
 * (see waMessage.photoDetailed in src/lib/site.ts) and never includes
 * storage URLs, photo IDs or filenames.
 */
import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SITE } from "@/lib/site";

/** Fallback origin used during SSR / when window is unavailable. */
export const CANONICAL_ORIGIN = (import.meta.env.VITE_PUBLIC_SITE_URL || "https://rajmotistudio.lovable.app").replace(/\/$/, "");

export function siteOrigin(): string {
  if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
  return CANONICAL_ORIGIN;
}

/** Default studio Google Business / reviews share link. */
export const DEFAULT_GOOGLE_PROFILE_URL = "https://share.google/T3UVPztmY6QZofvis";

/** Global studio setting: google_profile_share_url. */
export const googleProfileUrlQuery = queryOptions({
  queryKey: ["settings", "google_profile_share_url"],
  queryFn: async () => {
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "google_profile_share_url")
      .maybeSingle();
    const v = (data as any)?.value;
    return (typeof v === "string" && v.trim()) || DEFAULT_GOOGLE_PROFILE_URL;
  },
});

/* -------------------- Services -------------------- */

export type Service = { slug: string; name: string };

/** Canonical portfolio URL for a service slug. Central mapping — change here only. */
export function servicePortfolioUrl(slug?: string | null, origin = siteOrigin()): string | null {
  if (!slug) return null;
  return `${origin}/portfolios/${slug}`;
}

/* -------------------- Phone normalisation -------------------- */

export type PhoneResult = { ok: boolean; digits: string; reason?: string };

/**
 * Normalise a phone number into a wa.me-safe digit string.
 * Indian numbers: 9876543210 / +91 9876543210 / 09876543210 -> 919876543210
 * International numbers with a country code are preserved as-is.
 */
export function normalizePhone(raw?: string | null, defaultCountry = "91"): PhoneResult {
  if (!raw || !raw.trim()) return { ok: false, digits: "", reason: "No mobile number" };
  const hadPlus = raw.trim().startsWith("+");
  let d = raw.replace(/\D/g, "");
  if (!d) return { ok: false, digits: "", reason: "No digits in number" };

  if (hadPlus) {
    // Already international — trust it.
    return d.length >= 8 && d.length <= 15
      ? { ok: true, digits: d }
      : { ok: false, digits: d, reason: "Number looks invalid" };
  }

  // Strip a single national trunk prefix (e.g. 09876543210).
  if (d.length > 10 && d.startsWith("0")) d = d.replace(/^0+/, "");

  if (d.startsWith(defaultCountry) && d.length === defaultCountry.length + 10) {
    return { ok: true, digits: d };
  }
  if (d.length === 10) return { ok: true, digits: defaultCountry + d };
  if (d.length >= 11 && d.length <= 15) return { ok: true, digits: d };
  return { ok: false, digits: d, reason: "Number looks invalid" };
}

/** Digits-only key used for duplicate detection. */
export function phoneKey(raw?: string | null): string {
  const n = normalizePhone(raw);
  return n.ok ? n.digits : (raw ?? "").replace(/\D/g, "");
}

/* -------------------- Message builder -------------------- */

export type MessageKind = "portfolio" | "google" | "followup" | "availability";

export function buildCustomerWhatsAppMessage(opts: {
  name?: string | null;
  serviceName?: string | null;
  serviceSlug?: string | null;
  googleUrl?: string | null;
  kind?: MessageKind;
  origin?: string;
}): string {
  const greeting = opts.name?.trim() ? `Hello ${opts.name.trim()},` : "Hello,";
  const google = opts.googleUrl?.trim() || DEFAULT_GOOGLE_PROFILE_URL;
  const portfolio = servicePortfolioUrl(opts.serviceSlug, opts.origin ?? siteOrigin());
  const service = opts.serviceName?.trim() || null;
  const kind = opts.kind ?? "portfolio";
  const lines: string[] = [greeting, ""];

  if (kind === "followup") {
    lines.push(
      `Just following up from ${SITE.name} — do let us know if you'd like to plan your ${service ? service.toLowerCase() : "photoshoot"} session.`,
    );
    if (portfolio && service) lines.push("", `Our ${service} work:`, portfolio);
  } else if (kind === "availability") {
    lines.push(
      `Thank you for connecting with ${SITE.name}.`,
      "",
      `Please share your preferred date and we'll check availability for your ${service ? service.toLowerCase() : "photoshoot"} session.`,
    );
  } else if (kind === "google") {
    lines.push(`Thank you for connecting with ${SITE.name}.`);
  } else {
    lines.push(`Thank you for connecting with ${SITE.name}.`);
    if (portfolio && service) lines.push("", `You can see our ${service} work here:`, portfolio);
  }

  if (kind !== "followup") {
    lines.push("", "You can also see our latest work and reviews here:", google);
  }

  lines.push("", "Thank you,", SITE.name);
  return lines.join("\n");
}

/** customer phone + message -> wa.me URL (null when the number is unusable). */
export function customerWhatsAppLink(phone?: string | null, message = ""): string | null {
  const n = normalizePhone(phone);
  if (!n.ok) return null;
  return `https://wa.me/${n.digits}?text=${encodeURIComponent(message)}`;
}
