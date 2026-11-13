import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Pin, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { NoteRow, useRefreshNotes } from "@/components/admin/day-notes";
import {
  createNote,
  openNotesQuery,
  todayKey,
  tomorrowKey,
  type StudioNote,
} from "@/lib/notes";

/** Persistent open-reminder indicator + global quick capture for the admin shell. */
export function AdminReminders() {
  const { data: open = [] } = useQuery(openNotesQuery);
  const [listOpen, setListOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);

  useEffect(() => {
    function onKey(e: globalThis.KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      const typing = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setQuickOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const today = todayKey();
  const overdue = open.filter((n) => n.note_date < today);
  const dueToday = open.filter((n) => n.note_date === today);
  const upcoming = open.filter((n) => n.note_date > today);

  return (
    <div className="flex items-center gap-2">
      <Popover open={listOpen} onOpenChange={setListOpen}>
        <PopoverTrigger asChild>
          <button className="inline-flex items-center gap-2 border border-onyx/15 px-3 py-2 text-[10px] uppercase tracking-[0.2em] hover:border-gold">
            <Pin className="size-3.5" />
            {open.length} open
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0 bg-cream max-h-[70vh] overflow-y-auto">
          <div className="px-4 py-3 border-b border-onyx/10">
            <p className="eyebrow text-[10px] text-gold">Open reminders</p>
          </div>
          {open.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">Nothing open. All clear.</p>
          ) : (
            <div className="p-3 space-y-4">
              <Group title="Overdue" notes={overdue} />
              <Group title="Today" notes={dueToday} />
              <Group title="Upcoming" notes={upcoming} />
            </div>
          )}
          <div className="px-4 py-3 border-t border-onyx/10">
            <Link
              to="/admin/calendar"
              onClick={() => setListOpen(false)}
              className="eyebrow text-[10px] border-b border-onyx/30 pb-0.5 hover:text-gold"
            >
              View all →
            </Link>
          </div>
        </PopoverContent>
      </Popover>

      <QuickNote open={quickOpen} onOpenChange={setQuickOpen} />
    </div>
  );
}

function Group({ title, notes }: { title: string; notes: StudioNote[] }) {
  if (notes.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <p className="eyebrow text-[9px] text-muted-foreground">{title}</p>
      {notes.map((n) => (
        <NoteRow key={n.id} n={n} showDate />
      ))}
    </div>
  );
}

function QuickNote({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [value, setValue] = useState("");
  const [when, setWhen] = useState<string>(todayKey());
  const inputRef = useRef<HTMLInputElement>(null);
  const refresh = useRefreshNotes();

  useEffect(() => {
    if (open) {
      setWhen(todayKey());
      setTimeout(() => inputRef.current?.focus(), 40);
    } else {
      setValue("");
    }
  }, [open]);

  async function save() {
    const text = value.trim();
    if (!text) return;
    try {
      await createNote(text, when);
      setValue("");
      onOpenChange(false);
      await refresh();
      toast.success("Note saved");
    } catch {
      toast.error("Could not save the note");
    }
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") { e.preventDefault(); void save(); }
    if (e.key === "Escape") onOpenChange(false);
  }

  const options: { label: string; value: string }[] = [
    { label: "Today", value: todayKey() },
    { label: "Tomorrow", value: tomorrowKey() },
  ];

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          title="Quick note (N)"
          className="inline-flex items-center gap-1.5 border border-onyx/15 px-3 py-2 text-[10px] uppercase tracking-[0.2em] hover:border-gold"
        >
          <Plus className="size-3.5" /> Note
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 bg-cream space-y-3">
        <p className="eyebrow text-[10px] text-gold">What do you need to remember?</p>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKey}
          placeholder="Collect ₹2,000 from Patel"
          className="w-full border border-onyx/15 bg-white px-3 py-2 text-sm outline-none focus:border-gold"
        />
        <div className="flex flex-wrap items-center gap-2">
          {options.map((o) => (
            <button
              key={o.label}
              onClick={() => setWhen(o.value)}
              className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] border ${
                when === o.value ? "bg-onyx text-cream border-onyx" : "border-onyx/15 hover:border-gold"
              }`}
            >
              {o.label}
            </button>
          ))}
          <input
            type="date"
            value={when}
            onChange={(e) => e.target.value && setWhen(e.target.value)}
            className="border border-onyx/15 bg-white px-2 py-1.5 text-xs"
          />
        </div>
        <button
          onClick={() => void save()}
          className="w-full px-4 py-2.5 bg-onyx text-cream text-[10px] uppercase tracking-[0.25em] font-semibold hover:bg-gold"
        >
          Save
        </button>
      </PopoverContent>
    </Popover>
  );
}
