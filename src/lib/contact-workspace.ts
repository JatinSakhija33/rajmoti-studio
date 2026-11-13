/**
 * The "person with memory" layer: sticky notes and lightweight follow-ups
 * attached to a contact. Deliberately tiny — a follow-up is only
 * customer + what + when.
 */
import { supabase } from "@/integrations/supabase/client";

export type ContactNote = {
  id: string;
  customer_id: string;
  body: string;
  pinned: boolean;
  color: string;
  created_at: string;
  updated_at: string;
};

export type ContactTask = {
  id: string;
  customer_id: string;
  what: string;
  due_on: string;
  done_at: string | null;
  created_at: string;
};

export const NOTE_COLORS = ["butter", "rose", "sky", "sage"] as const;

export function noteSurface(color: string) {
  switch (color) {
    case "rose":
      return "bg-[#fdeeee] border-[#f0d3d3]";
    case "sky":
      return "bg-[#eaf2f8] border-[#d0e0ec]";
    case "sage":
      return "bg-[#eef4ec] border-[#d3e2d0]";
    default:
      return "bg-[#fdf4dc] border-[#eddfb4]";
  }
}

/* -------------------- dates -------------------- */

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function addDaysISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function dueLabel(due: string) {
  const t = todayISO();
  if (due === t) return "Today";
  if (due === addDaysISO(1)) return "Tomorrow";
  if (due < t) return "Overdue";
  return new Date(`${due}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/* -------------------- notes -------------------- */

export async function fetchNotes(customerId: string) {
  const { data, error } = await supabase
    .from("contact_notes" as any)
    .select("id,customer_id,body,pinned,color,created_at,updated_at")
    .eq("customer_id", customerId)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ContactNote[];
}

export async function addNote(customerId: string, body: string, color = "butter") {
  const { data, error } = await supabase
    .from("contact_notes" as any)
    .insert({ customer_id: customerId, body: body.trim(), color } as any)
    .select("id,customer_id,body,pinned,color,created_at,updated_at")
    .single();
  if (error) throw error;
  return data as unknown as ContactNote;
}

export async function updateNote(id: string, patch: Partial<Pick<ContactNote, "body" | "pinned" | "color">>) {
  const { error } = await supabase.from("contact_notes" as any).update(patch as any).eq("id", id);
  if (error) throw error;
}

export async function deleteNote(id: string) {
  const { error } = await supabase.from("contact_notes" as any).delete().eq("id", id);
  if (error) throw error;
}

/* -------------------- follow-ups -------------------- */

export async function fetchTasks(customerId: string) {
  const { data, error } = await supabase
    .from("contact_tasks" as any)
    .select("id,customer_id,what,due_on,done_at,created_at")
    .eq("customer_id", customerId)
    .order("done_at", { ascending: true, nullsFirst: true })
    .order("due_on", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as ContactTask[];
}

export async function addTask(customerId: string, what: string, dueOn: string) {
  const { data, error } = await supabase
    .from("contact_tasks" as any)
    .insert({ customer_id: customerId, what: what.trim() || "Follow up", due_on: dueOn } as any)
    .select("id,customer_id,what,due_on,done_at,created_at")
    .single();
  if (error) throw error;
  return data as unknown as ContactTask;
}

export async function completeTask(id: string, done = true) {
  const { error } = await supabase
    .from("contact_tasks" as any)
    .update({ done_at: done ? new Date().toISOString() : null } as any)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteTask(id: string) {
  const { error } = await supabase.from("contact_tasks" as any).delete().eq("id", id);
  if (error) throw error;
}

export type OpenTask = ContactTask & {
  customer: { id: string; customer_name: string | null; phone: string | null; service_slug: string | null } | null;
};

/** Every open follow-up due on or before `through` (defaults to today). */
export async function fetchDueTasks(through = todayISO()) {
  const { data, error } = await supabase
    .from("contact_tasks" as any)
    .select("id,customer_id,what,due_on,done_at,created_at,customer:customers(id,customer_name,phone,service_slug)")
    .is("done_at", null)
    .lte("due_on", through)
    .order("due_on", { ascending: true })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as unknown as OpenTask[];
}

/** Map of customer_id → soonest open follow-up, for the contact cards. */
export async function fetchNextActions(customerIds: string[]) {
  if (!customerIds.length) return {} as Record<string, ContactTask>;
  const { data } = await supabase
    .from("contact_tasks" as any)
    .select("id,customer_id,what,due_on,done_at,created_at")
    .in("customer_id", customerIds)
    .is("done_at", null)
    .order("due_on", { ascending: true });
  const map: Record<string, ContactTask> = {};
  for (const t of (data ?? []) as unknown as ContactTask[]) {
    if (!map[t.customer_id]) map[t.customer_id] = t;
  }
  return map;
}

/** Count of pinned/total notes per contact, for the small card marker. */
export async function fetchNoteCounts(customerIds: string[]) {
  if (!customerIds.length) return {} as Record<string, number>;
  const { data } = await supabase
    .from("contact_notes" as any)
    .select("customer_id")
    .in("customer_id", customerIds);
  const map: Record<string, number> = {};
  for (const n of (data ?? []) as unknown as { customer_id: string }[]) {
    map[n.customer_id] = (map[n.customer_id] ?? 0) + 1;
  }
  return map;
}
