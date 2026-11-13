/**
 * Canonical booking model — Customer → Booking → Money → Calendar.
 *
 * A "booking" is a real, agreed session. Website enquiries live in
 * `inquiries`; once the studio agrees a date on WhatsApp, the enquiry is
 * converted into a booking here. Everything money-related (total, paid,
 * balance) hangs off this row, and the calendar / dashboard read from it.
 */
import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type BookingStatus = "tentative" | "confirmed" | "completed" | "cancelled";
export type BookingStage = "upcoming" | "shot" | "editing" | "reels" | "delivered";

export type Booking = {
  id: string;
  customer_id: string | null;
  inquiry_id: string | null;
  contact_name: string | null;
  phone: string | null;
  service_slug: string | null;
  service_label: string | null;
  package_name: string | null;
  session_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  notes: string | null;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  status: BookingStatus;
  stage: BookingStage;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export const BOOKING_STATUSES: { key: BookingStatus; label: string }[] = [
  { key: "tentative", label: "Tentative" },
  { key: "confirmed", label: "Confirmed" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

export const BOOKING_STAGES: { key: BookingStage; label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "shot", label: "Shot" },
  { key: "editing", label: "Editing" },
  { key: "reels", label: "Reels" },
  { key: "delivered", label: "Delivered" },
];

const table = () => supabase.from("bookings" as never);

export function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function money(n?: number | null): string {
  const v = Number(n ?? 0);
  return `₹${v.toLocaleString("en-IN")}`;
}

export function formatSessionTime(b: Pick<Booking, "start_time" | "end_time">): string {
  const fmt = (t?: string | null) => {
    if (!t) return null;
    const [h, m] = t.split(":");
    const hh = Number(h);
    return `${hh % 12 === 0 ? 12 : hh % 12}:${m} ${hh >= 12 ? "PM" : "AM"}`;
  };
  const s = fmt(b.start_time);
  const e = fmt(b.end_time);
  if (!s) return "Time not set";
  return e ? `${s} – ${e}` : s;
}

export function bookingLabel(b: Booking): string {
  return b.contact_name?.trim() || b.service_label || b.package_name || "Session";
}

/* -------------------- Queries -------------------- */

const SELECT = "*";

export const bookingsQuery = queryOptions({
  queryKey: ["bookings"],
  queryFn: async () => {
    const { data, error } = await table()
      .select(SELECT)
      .is("deleted_at", null)
      .order("session_date", { ascending: false })
      .limit(500);
    if (error) throw error;
    return (data ?? []) as unknown as Booking[];
  },
});

/** Bookings on one day — used by the calendar day view and the dashboard. */
export const bookingsByDayQuery = (date: string) =>
  queryOptions({
    queryKey: ["bookings", "day", date],
    queryFn: async () => {
      const { data, error } = await table()
        .select(SELECT)
        .is("deleted_at", null)
        .eq("session_date", date)
        .neq("status", "cancelled")
        .order("start_time", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as unknown as Booking[];
    },
  });

/** Dates in a range that have at least one booking — calendar dots. */
export const bookingDatesQuery = (from: string, to: string) =>
  queryOptions({
    queryKey: ["bookings", "dates", from, to],
    queryFn: async () => {
      const { data, error } = await table()
        .select("session_date")
        .is("deleted_at", null)
        .neq("status", "cancelled")
        .gte("session_date", from)
        .lte("session_date", to);
      if (error) throw error;
      return Array.from(new Set(((data ?? []) as unknown as { session_date: string }[]).map((r) => r.session_date)));
    },
  });

/** Everything still owing money. */
export const outstandingBookingsQuery = queryOptions({
  queryKey: ["bookings", "outstanding"],
  queryFn: async () => {
    const { data, error } = await table()
      .select(SELECT)
      .is("deleted_at", null)
      .neq("status", "cancelled")
      .gt("balance_amount", 0)
      .order("session_date", { ascending: true })
      .limit(50);
    if (error) throw error;
    return (data ?? []) as unknown as Booking[];
  },
});

export const bookingsForCustomerQuery = (customerId?: string | null) =>
  queryOptions({
    queryKey: ["bookings", "customer", customerId],
    enabled: !!customerId,
    queryFn: async () => {
      const { data, error } = await table()
        .select(SELECT)
        .is("deleted_at", null)
        .eq("customer_id", customerId!)
        .order("session_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Booking[];
    },
  });

/* -------------------- Mutations -------------------- */

export type BookingInput = Partial<Omit<Booking, "id" | "balance_amount" | "created_at" | "updated_at" | "deleted_at">> & {
  session_date: string;
};

export async function createBooking(input: BookingInput) {
  const { data, error } = await table().insert(input as never).select("id").single();
  if (error) throw error;
  return data as unknown as { id: string };
}

export async function updateBooking(id: string, patch: Partial<BookingInput>) {
  const { error } = await table().update(patch as never).eq("id", id);
  if (error) throw error;
}

export async function recordPayment(id: string, currentPaid: number, amount: number) {
  await updateBooking(id, { paid_amount: Number(currentPaid) + Number(amount) });
}

export async function softDeleteBooking(id: string) {
  const { error } = await table()
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq("id", id);
  if (error) throw error;
}

/**
 * Find (or create) the customer behind a booking, so the contact directory and
 * the booking always point at the same person.
 */
export async function linkOrCreateCustomer(opts: {
  name?: string | null;
  phone?: string | null;
  serviceSlug?: string | null;
}): Promise<string | null> {
  const phone = (opts.phone ?? "").replace(/\D/g, "");
  if (!phone) return null;
  const normalized = phone.length === 10 ? `91${phone}` : phone;

  const { data: existing } = await supabase
    .from("customers")
    .select("id")
    .eq("normalized_phone", normalized)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();
  if (existing) return (existing as any).id as string;

  const { data, error } = await supabase
    .from("customers")
    .insert({
      customer_name: opts.name?.trim() || null,
      phone: opts.phone ?? null,
      service_slug: opts.serviceSlug ?? null,
    } as never)
    .select("id")
    .single();
  if (error) return null;
  return (data as any).id as string;
}
