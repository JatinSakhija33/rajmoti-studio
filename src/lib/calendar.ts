import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type CalendarEventType =
  | "shoot"
  | "call"
  | "note"
  | "delivery"
  | "payment"
  | "task"
  | "appointment";

export type CalendarEventStatus = "scheduled" | "completed" | "cancelled" | "archived";
export type CalendarPriority = "normal" | "important" | "urgent";

export type CalendarEvent = {
  id: string;
  customer_id: string | null;
  title: string;
  type: CalendarEventType;
  description: string | null;
  contact_name: string | null;
  phone: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  amount: number | null;
  payment_status: string | null;
  status: CalendarEventStatus;
  priority: CalendarPriority;
  reminder_at: string | null;
  reminder_offset_minutes: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export const EVENT_TYPES: { key: CalendarEventType; label: string; icon: string }[] = [
  { key: "shoot", label: "Shoot", icon: "📸" },
  { key: "appointment", label: "Customer appointment", icon: "👤" },
  { key: "call", label: "Call", icon: "📞" },
  { key: "delivery", label: "Delivery", icon: "📦" },
  { key: "payment", label: "Payment", icon: "💰" },
  { key: "task", label: "Studio task", icon: "🛠" },
  { key: "note", label: "Note", icon: "📝" },
];

export function typeMeta(type: string) {
  return EVENT_TYPES.find((t) => t.key === type) ?? { key: "task", label: "Item", icon: "📝" };
}

const table = () => supabase.from("calendar_events" as never);

/** Events for a single day — never loads the full history. */
export const calendarEventsByDayQuery = (date: string) =>
  queryOptions({
    queryKey: ["calendar_events", date],
    queryFn: async () => {
      const { data, error } = await table()
        .select("*")
        .is("deleted_at", null)
        .eq("event_date", date)
        .order("start_time", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as unknown as CalendarEvent[];
    },
  });

/** Dates in a month that have at least one event — used for calendar dots. */
export const calendarEventDatesQuery = (from: string, to: string) =>
  queryOptions({
    queryKey: ["calendar_event_dates", from, to],
    queryFn: async () => {
      const { data, error } = await table()
        .select("event_date")
        .is("deleted_at", null)
        .gte("event_date", from)
        .lte("event_date", to);
      if (error) throw error;
      return Array.from(new Set(((data ?? []) as unknown as { event_date: string }[]).map((r) => r.event_date)));
    },
  });

export type CalendarEventInput = Partial<Omit<CalendarEvent, "id" | "created_at" | "updated_at" | "deleted_at">> & {
  title: string;
  event_date: string;
  type: CalendarEventType;
};

export async function createCalendarEvent(input: CalendarEventInput) {
  const { error } = await table().insert(input as never);
  if (error) throw error;
}

export async function updateCalendarEvent(id: string, patch: Partial<CalendarEvent>) {
  const { error } = await table().update(patch as never).eq("id", id);
  if (error) throw error;
}

/** Soft delete — the row stays in the database and can be recovered. */
export async function softDeleteCalendarEvent(id: string) {
  const { error } = await table()
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq("id", id);
  if (error) throw error;
}

/** Search existing CRM customers without loading the whole table. */
export async function searchCustomers(term: string) {
  const q = term.trim();
  if (q.length < 2) return [];
  const { data, error } = await supabase
    .from("customers" as never)
    .select("id,customer_name,phone,baby_name")
    .or(`customer_name.ilike.%${q}%,phone.ilike.%${q}%,baby_name.ilike.%${q}%`)
    .limit(8);
  if (error) throw error;
  return (data ?? []) as unknown as { id: string; customer_name: string; phone: string | null; baby_name: string | null }[];
}

export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatTime(t?: string | null): string {
  if (!t) return "—";
  const [h, m] = t.split(":");
  const hh = Number(h);
  const suffix = hh >= 12 ? "PM" : "AM";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12}:${m} ${suffix}`;
}
