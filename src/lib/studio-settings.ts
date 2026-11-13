/**
 * ONE source of truth for studio identity, communication channels and the
 * WhatsApp message templates the owner edits in Settings.
 *
 * Nothing in the UI should hardcode an Instagram / Google / website URL again.
 */
import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SITE } from "@/lib/site";
import { DEFAULT_GOOGLE_PROFILE_URL, CANONICAL_ORIGIN } from "@/lib/customer-directory";

export type ServiceLink = { slug: string; name: string; path: string; template?: string };

export type Communication = {
  studio: { name: string; tagline: string; phone: string; whatsapp: string; address: string };
  instagram: { url: string; handle: string; shareMessage: boolean };
  google: { profileUrl: string };
  website: { url: string; services: ServiceLink[] };
};

export const DEFAULT_COMMUNICATION: Communication = {
  studio: { name: SITE.name, tagline: "", phone: "", whatsapp: SITE.whatsapp ?? "", address: "" },
  instagram: { url: "https://instagram.com/rajmotistudio", handle: "@rajmotistudio", shareMessage: false },
  google: { profileUrl: DEFAULT_GOOGLE_PROFILE_URL },
  website: { url: CANONICAL_ORIGIN, services: [] },
};

export type TemplateKey = "portfolio" | "google" | "followup" | "availability";

export type Template = { name: string; body: string };
export type Templates = Record<TemplateKey, Template>;

export const TEMPLATE_ORDER: TemplateKey[] = ["portfolio", "google", "followup", "availability"];

export const DEFAULT_TEMPLATES: Templates = {
  portfolio: {
    name: "Portfolio",
    body: [
      "Hello {customer_name},",
      "",
      "Thank you for connecting with {studio_name}.",
      "",
      "You can explore our {service_name} work here:",
      "{portfolio_url}",
      "",
      "You can also see our latest work and reviews here:",
      "{google_profile_url}",
      "",
      "Thank you,",
      "{studio_name}",
    ].join("\n"),
  },
  google: {
    name: "Google profile",
    body: [
      "Hello {customer_name},",
      "",
      "Thank you for connecting with {studio_name}.",
      "",
      "You can see our latest work and reviews here:",
      "{google_profile_url}",
      "",
      "Thank you,",
      "{studio_name}",
    ].join("\n"),
  },
  followup: {
    name: "Follow-up",
    body: [
      "Hello {customer_name},",
      "",
      "Just following up from {studio_name} — do let us know if you'd like to plan your {service_name} session.",
      "",
      "{portfolio_url}",
      "",
      "Thank you,",
      "{studio_name}",
    ].join("\n"),
  },
  availability: {
    name: "Availability",
    body: [
      "Hello {customer_name},",
      "",
      "Thank you for connecting with {studio_name}.",
      "",
      "Please share your preferred date and we'll check availability for your {service_name} session.",
      "",
      "Thank you,",
      "{studio_name}",
    ].join("\n"),
  },
};

export const TEMPLATE_VARIABLES = [
  { token: "{customer_name}", label: "Customer name" },
  { token: "{service_name}", label: "Service" },
  { token: "{portfolio_url}", label: "Portfolio link" },
  { token: "{google_profile_url}", label: "Google profile" },
  { token: "{instagram_url}", label: "Instagram" },
  { token: "{website_url}", label: "Website" },
  { token: "{studio_name}", label: "Studio name" },
] as const;

/* -------------------- queries -------------------- */

function mergeCommunication(raw: any): Communication {
  const d = DEFAULT_COMMUNICATION;
  const v = raw && typeof raw === "object" ? raw : {};
  return {
    studio: { ...d.studio, ...(v.studio ?? {}) },
    instagram: { ...d.instagram, ...(v.instagram ?? {}) },
    google: { ...d.google, ...(v.google ?? {}) },
    website: { ...d.website, ...(v.website ?? {}), services: Array.isArray(v.website?.services) ? v.website.services : [] },
  };
}

export const communicationQuery = queryOptions({
  queryKey: ["settings", "communication"],
  queryFn: async (): Promise<Communication> => {
    const { data } = await supabase.from("settings").select("value").eq("key", "communication").maybeSingle();
    return mergeCommunication((data as any)?.value);
  },
});

export const templatesQuery = queryOptions({
  queryKey: ["settings", "message_templates"],
  queryFn: async (): Promise<Templates> => {
    const { data } = await supabase.from("settings").select("value").eq("key", "message_templates").maybeSingle();
    const v = (data as any)?.value;
    const out = { ...DEFAULT_TEMPLATES };
    if (v && typeof v === "object") {
      for (const k of TEMPLATE_ORDER) {
        if (v[k]?.body) out[k] = { name: v[k].name || DEFAULT_TEMPLATES[k].name, body: String(v[k].body) };
      }
    }
    return out;
  },
});

export async function saveSetting(key: string, value: unknown) {
  const { error } = await supabase.from("settings").upsert({ key, value: value as any });
  if (error) throw error;
}

/* -------------------- rendering -------------------- */

export type MessageContext = {
  customer_name?: string | null;
  service_name?: string | null;
  portfolio_url?: string | null;
  google_profile_url?: string | null;
  instagram_url?: string | null;
  website_url?: string | null;
  studio_name?: string | null;
};

/**
 * Replace {variables}. Missing values never produce "undefined" — the token is
 * removed, and a line that contained only that token is dropped entirely.
 */
export function renderTemplate(body: string, ctx: MessageContext): string {
  const map: Record<string, string> = {
    customer_name: ctx.customer_name?.trim() || "",
    service_name: ctx.service_name?.trim() || "",
    portfolio_url: ctx.portfolio_url?.trim() || "",
    google_profile_url: ctx.google_profile_url?.trim() || "",
    instagram_url: ctx.instagram_url?.trim() || "",
    website_url: ctx.website_url?.trim() || "",
    studio_name: ctx.studio_name?.trim() || SITE.name,
  };

  const lines = body.split("\n").flatMap((line) => {
    const tokens = line.match(/\{(\w+)\}/g) ?? [];
    const rendered = line.replace(/\{(\w+)\}/g, (_m, k: string) => map[k] ?? "");
    // Drop a line that existed only to carry a now-empty variable.
    if (tokens.length && !rendered.trim()) return [];
    return [rendered.replace(/\s{2,}/g, " ").trimEnd()];
  });

  // Collapse runs of blank lines and greeting edge cases ("Hello ,").
  return lines
    .map((l) => l.replace(/^Hello\s*,$/i, "Hello,").replace(/\s+,/g, ","))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Canonical portfolio URL for a service, honouring the owner's mapping. */
export function portfolioUrlFor(comm: Communication, slug?: string | null): string | null {
  if (!slug) return null;
  const base = (comm.website.url || CANONICAL_ORIGIN).replace(/\/+$/, "");
  const mapped = comm.website.services.find((s) => s.slug === slug)?.path;
  const path = (mapped || `/portfolios/${slug}`).replace(/^\/?/, "/");
  return `${base}${path}`;
}

/** Build the outgoing WhatsApp body for a contact using the owner's templates. */
export function buildMessage(opts: {
  comm: Communication;
  templates: Templates;
  kind: TemplateKey;
  customerName?: string | null;
  serviceSlug?: string | null;
  serviceName?: string | null;
}): string {
  const { comm, templates, kind } = opts;
  const tpl = templates[kind] ?? DEFAULT_TEMPLATES[kind];
  const body = renderTemplate(tpl.body, {
    customer_name: opts.customerName,
    service_name: opts.serviceName,
    portfolio_url: portfolioUrlFor(comm, opts.serviceSlug),
    google_profile_url: comm.google.profileUrl,
    instagram_url: comm.instagram.url,
    website_url: comm.website.url,
    studio_name: comm.studio.name,
  });
  if (comm.instagram.shareMessage && comm.instagram.url) {
    return `${body}\n\nYou can also see our latest work on Instagram:\n${comm.instagram.url}`;
  }
  return body;
}
