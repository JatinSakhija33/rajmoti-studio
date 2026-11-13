import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toDateKey } from "@/lib/calendar";

export type StudioNote = {
  id: string;
  note: string;
  note_date: string;
  is_completed: boolean;
  completed_at: string | null;
  moved_from_date: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

const NOTE_FIELDS =
  "id,note,note_date,is_completed,completed_at,moved_from_date,created_at,updated_at,deleted_at";

const table = () => supabase.from("studio_notes");

/** All notes (open + completed) for one date. */
export const notesByDayQuery = (date: string) =>
  queryOptions({
    queryKey: ["studio_notes", date],
    staleTime: 30_000,
    queryFn: async (): Promise<StudioNote[]> => {
      const { data, error } = await table()
        .select(NOTE_FIELDS)
        .is("deleted_at", null)
        .eq("note_date", date)
        .order("is_completed", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as StudioNote[];
    },
  });

/** Dates in a range that contain notes — for the month calendar dots. */
export const noteDatesQuery = (from: string, to: string) =>
  queryOptions({
    queryKey: ["studio_note_dates", from, to],
    staleTime: 30_000,
    queryFn: async (): Promise<Record<string, number>> => {
      const { data, error } = await table()
        .select("note_date")
        .is("deleted_at", null)
        .gte("note_date", from)
        .lte("note_date", to);
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const row of (data ?? []) as { note_date: string }[]) {
        counts[row.note_date] = (counts[row.note_date] ?? 0) + 1;
      }
      return counts;
    },
  });

/** Every unresolved note — overdue, today and upcoming. Never auto-cleared. */
export const openNotesQuery = queryOptions({
  queryKey: ["studio_notes_open"],
  staleTime: 30_000,
  queryFn: async (): Promise<StudioNote[]> => {
    const { data, error } = await table()
      .select(NOTE_FIELDS)
      .is("deleted_at", null)
      .eq("is_completed", false)
      .order("note_date", { ascending: true })
      .limit(200);
    if (error) throw error;
    return (data ?? []) as StudioNote[];
  },
});

export async function createNote(note: string, noteDate: string) {
  const text = note.trim();
  if (!text) return;
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await table().insert({
    note: text,
    note_date: noteDate,
    created_by: auth.user?.id ?? null,
  });
  if (error) throw error;
}

export async function setNoteCompleted(id: string, completed: boolean) {
  const { error } = await table()
    .update({ is_completed: completed, completed_at: completed ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) throw error;
}

export async function updateNoteText(id: string, note: string) {
  const text = note.trim();
  if (!text) return;
  const { error } = await table().update({ note: text }).eq("id", id);
  if (error) throw error;
}

export async function moveNote(id: string, fromDate: string, toDate: string) {
  const { error } = await table()
    .update({ note_date: toDate, moved_from_date: fromDate })
    .eq("id", id);
  if (error) throw error;
}

/** Soft delete — the row stays in the database. Only ever called explicitly. */
export async function softDeleteNote(id: string) {
  const { error } = await table().update({ deleted_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function tomorrowKey(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return toDateKey(d);
}

export function isOverdue(n: StudioNote): boolean {
  return !n.is_completed && n.note_date < todayKey();
}

export function formatShortDate(key: string): string {
  const d = new Date(key + "T00:00:00");
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export const NOTE_QUERY_KEYS = ["studio_notes", "studio_note_dates", "studio_notes_open"];
