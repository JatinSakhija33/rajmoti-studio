/**
 * Rajmoti Contacts — the daily contact directory data layer.
 * Reads always come from the Rajmoti database (never Google) and are
 * searched + paginated server-side so the screen stays fast at 10k contacts.
 */
import { supabase } from "@/integrations/supabase/client";
import { normalizePhone, phoneKey } from "@/lib/customer-directory";

export const CONTACT_PAGE_SIZE = 50;

export type Contact = {
  id: string;
  customer_name: string | null;
  phone: string | null;
  normalized_phone: string | null;
  email: string | null;
  service_slug: string | null;
  notes: string | null;
  source: string | null;
  photo_url: string | null;
  favorite: boolean;
  last_contacted_at: string | null;
  google_contact_resource_name: string | null;
  google_sync_status: string | null;
  created_at: string;
};

const COLUMNS =
  "id,customer_name,phone,normalized_phone,email,service_slug,notes,source,photo_url,favorite,last_contacted_at,google_contact_resource_name,google_sync_status,created_at";

export type ContactFilter = {
  search?: string;
  letter?: string | null;
  unclassifiedOnly?: boolean;
};

export async function fetchContactsPage(filter: ContactFilter, page: number) {
  let q = supabase
    .from("customers")
    .select(COLUMNS, { count: "exact" })
    .is("deleted_at", null);

  const term = (filter.search ?? "").trim();
  if (term) {
    const digits = term.replace(/\D/g, "");
    const parts = [`customer_name.ilike.%${term}%`];
    if (digits) {
      parts.push(`phone.ilike.%${digits}%`, `normalized_phone.ilike.%${digits}%`);
    }
    q = q.or(parts.join(","));
  }
  if (filter.letter) q = q.ilike("customer_name", `${filter.letter}%`);
  if (filter.unclassifiedOnly) q = q.is("service_slug", null);

  const from = page * CONTACT_PAGE_SIZE;
  const { data, error, count } = await q
    .order("customer_name", { ascending: true, nullsFirst: false })
    .range(from, from + CONTACT_PAGE_SIZE - 1);
  if (error) throw error;
  return { rows: (data ?? []) as unknown as Contact[], total: count ?? 0 };
}

export const contactsQueryKey = (filter: ContactFilter) => [
  "contacts",
  filter.search ?? "",
  filter.letter ?? "",
  filter.unclassifiedOnly ?? false,
];

export async function fetchContactStats() {
  const base = () => supabase.from("customers").select("id", { count: "exact", head: true }).is("deleted_at", null);
  const [total, withMobile, unclassified, fromGoogle] = await Promise.all([
    base(),
    base().not("normalized_phone", "is", null),
    base().is("service_slug", null),
    base().not("google_contact_resource_name", "is", null),
  ]);
  return {
    total: total.count ?? 0,
    withMobile: withMobile.count ?? 0,
    unclassified: unclassified.count ?? 0,
    fromGoogle: fromGoogle.count ?? 0,
  };
}

/** Find an existing contact with the same mobile number. */
export async function findByPhone(raw: string): Promise<Contact | null> {
  const n = normalizePhone(raw);
  const key = n.ok ? n.digits : phoneKey(raw);
  if (!key) return null;
  const { data } = await supabase
    .from("customers")
    .select(COLUMNS)
    .is("deleted_at", null)
    .eq("normalized_phone", key)
    .limit(1)
    .maybeSingle();
  return (data as unknown as Contact) ?? null;
}

export async function createContact(input: {
  name?: string | null;
  phone: string;
  service_slug?: string | null;
  notes?: string | null;
  source?: string | null;
}) {
  const { data, error } = await supabase
    .from("customers")
    .insert({
      customer_name: input.name?.trim() || null,
      phone: input.phone.trim(),
      service_slug: input.service_slug || null,
      notes: input.notes?.trim() || null,
      source: input.source ?? "Manual",
    } as any)
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return data as unknown as Contact;
}

export async function updateContact(id: string, patch: Record<string, unknown>) {
  const { error } = await supabase.from("customers").update(patch as any).eq("id", id);
  if (error) throw error;
}

/** Soft delete — bookings, inquiries and history stay attached. */
export async function softDeleteContact(id: string) {
  await updateContact(id, { deleted_at: new Date().toISOString() });
}

export async function markContacted(id: string) {
  try {
    await updateContact(id, { last_contacted_at: new Date().toISOString() });
  } catch {
    /* recording contact time must never block WhatsApp */
  }
}

export async function bulkSetService(ids: string[], slug: string | null) {
  if (!ids.length) return;
  const { error } = await supabase.from("customers").update({ service_slug: slug } as any).in("id", ids);
  if (error) throw error;
}

/**
 * Merge `loserId` into `winnerId`: business history is re-pointed, then the
 * duplicate is soft-deleted. Nothing is destroyed.
 */
export async function mergeContacts(winnerId: string, loserId: string) {
  await supabase.from("inquiries").update({ customer_id: winnerId } as any).eq("customer_id", loserId);
  await supabase.from("calendar_events").update({ customer_id: winnerId } as any).eq("customer_id", loserId);
  await supabase.from("customer_dates").update({ customer_id: winnerId } as any).eq("customer_id", loserId);
  await supabase.from("reminders").update({ customer_id: winnerId } as any).eq("customer_id", loserId);
  await supabase.from("contact_notes" as any).update({ customer_id: winnerId } as any).eq("customer_id", loserId);
  await supabase.from("contact_tasks" as any).update({ customer_id: winnerId } as any).eq("customer_id", loserId);
  await softDeleteContact(loserId);
}

export function contactInitials(c: Pick<Contact, "customer_name" | "phone">) {
  const name = (c.customer_name ?? "").trim();
  if (!name) return "#";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/** "Priya 9876543210 baby" → parsed quick-add fields. */
export function parseQuickAdd(input: string, services: { slug: string; name: string }[]) {
  const raw = input.trim();
  if (!raw) return null;
  const phoneMatch = raw.match(/(\+?\d[\d\s\-()]{7,})/);
  const phone = phoneMatch?.[1]?.trim() ?? "";
  const rest = phone ? raw.replace(phone, " ") : raw;
  const words = rest.split(/\s+/).filter(Boolean);
  let service: string | null = null;
  const nameWords: string[] = [];
  for (const w of words) {
    const hit = services.find(
      (s) => s.slug.toLowerCase() === w.toLowerCase() || s.name.toLowerCase().startsWith(w.toLowerCase()),
    );
    if (hit && !service && w.length >= 3) service = hit.slug;
    else nameWords.push(w);
  }
  return { name: nameWords.join(" ").trim(), phone, service };
}
