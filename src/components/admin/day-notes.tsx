import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Check, Trash2, ArrowRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  createNote,
  formatShortDate,
  isOverdue,
  moveNote,
  setNoteCompleted,
  softDeleteNote,
  updateNoteText,
  type StudioNote,
} from "@/lib/notes";

export function useRefreshNotes() {
  const qc = useQueryClient();
  return async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["studio_notes"] }),
      qc.invalidateQueries({ queryKey: ["studio_note_dates"] }),
      qc.invalidateQueries({ queryKey: ["studio_notes_open"] }),
    ]);
  };
}

/** Click → type → Enter. No form, no extra fields. */
export function NoteComposer({ date }: { date: string }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const refresh = useRefreshNotes();

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function save() {
    const text = value.trim();
    if (!text) return setOpen(false);
    try {
      await createNote(text, date);
      setValue("");
      await refresh();
      inputRef.current?.focus();
    } catch {
      toast.error("Could not save the note");
    }
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") { e.preventDefault(); void save(); }
    if (e.key === "Escape") { setValue(""); setOpen(false); }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full text-left flex items-center gap-2 px-4 py-3 border border-dashed border-onyx/20 text-sm text-muted-foreground hover:border-gold hover:text-onyx transition-colors"
      >
        <Plus className="size-4" /> Write a note…
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 border border-onyx/20 bg-white px-3 py-2">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKey}
        onBlur={() => { if (!value.trim()) setOpen(false); }}
        placeholder="What do you need to remember?"
        className="flex-1 bg-transparent text-sm outline-none"
      />
      <button onClick={() => void save()} className="eyebrow text-[10px] text-gold hover:underline">
        Save
      </button>
    </div>
  );
}

export function NoteRow({ n, showDate = false }: { n: StudioNote; showDate?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(n.note);
  const refresh = useRefreshNotes();
  const overdue = isOverdue(n);

  async function run(fn: () => Promise<void>, failure: string) {
    try {
      await fn();
      await refresh();
    } catch {
      toast.error(failure);
    }
  }

  function pickDate() {
    const next = window.prompt("Move to date (YYYY-MM-DD)", n.note_date);
    if (!next || !/^\d{4}-\d{2}-\d{2}$/.test(next)) return;
    void run(() => moveNote(n.id, n.note_date, next), "Could not move the note");
  }

  function moveTomorrow() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    void run(() => moveNote(n.id, n.note_date, key), "Could not move the note");
  }

  return (
    <div
      className={`group flex items-start gap-3 bg-white border border-onyx/10 px-4 py-3 ${
        overdue ? "border-l-2 border-l-gold" : ""
      } ${n.is_completed ? "opacity-55" : ""}`}
    >
      <button
        onClick={() => void run(() => setNoteCompleted(n.id, !n.is_completed), "Could not update")}
        aria-label={n.is_completed ? "Mark open" : "Mark complete"}
        className={`mt-0.5 size-4 shrink-0 border ${
          n.is_completed ? "bg-onyx border-onyx text-cream" : "border-onyx/30 hover:border-gold"
        } grid place-items-center`}
      >
        {n.is_completed && <Check className="size-3" />}
      </button>

      <div className="min-w-0 flex-1">
        {(overdue || showDate || n.moved_from_date) && (
          <p className="eyebrow text-[9px] text-muted-foreground mb-1">
            {overdue ? `Overdue · ${formatShortDate(n.note_date)}` : showDate ? formatShortDate(n.note_date) : ""}
            {n.moved_from_date ? `${overdue || showDate ? " · " : ""}moved from ${formatShortDate(n.moved_from_date)}` : ""}
          </p>
        )}
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => { setEditing(false); if (draft.trim() && draft !== n.note) void run(() => updateNoteText(n.id, draft), "Could not save"); }}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.currentTarget.blur(); }
              if (e.key === "Escape") { setDraft(n.note); setEditing(false); }
            }}
            className="w-full bg-transparent text-sm outline-none border-b border-gold/50"
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className={`text-left text-sm w-full ${n.is_completed ? "line-through" : ""}`}
          >
            {n.note}
          </button>
        )}
      </div>

      {!n.is_completed && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button title="Move" className="p-1 text-muted-foreground hover:text-gold">
              <ArrowRight className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={moveTomorrow}>Tomorrow</DropdownMenuItem>
            <DropdownMenuItem onClick={pickDate}>Pick date…</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <button
        title="Delete note"
        onClick={() => {
          if (!window.confirm("Delete this note? It stays recoverable in the database.")) return;
          void run(() => softDeleteNote(n.id), "Could not delete");
        }}
        className="p-1 text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
