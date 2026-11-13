import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Plus, Check, Trash2, Pencil, RotateCcw } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { inquiriesQuery } from "@/lib/queries";
import { SERVICES } from "@/lib/booking-questions";
import { FamilyProfileDrawer } from "@/components/admin/family-profile-drawer";
import { EventDialog } from "@/components/admin/event-dialog";
import {
  calendarEventsByDayQuery,
  formatTime,
  softDeleteCalendarEvent,
  toDateKey,
  typeMeta,
  updateCalendarEvent,
  type CalendarEvent,
} from "@/lib/calendar";
import { notesByDayQuery, noteDatesQuery, isOverdue } from "@/lib/notes";
import { NoteComposer, NoteRow } from "@/components/admin/day-notes";
import {
  bookingDatesQuery,
  bookingsByDayQuery,
  bookingLabel,
  formatSessionTime,
  money,
  type Booking,
} from "@/lib/bookings";


export const Route = createFileRoute("/admin/calendar")({
  component: AdminCalendar,
});

function AdminCalendar() {
  const qc = useQueryClient();
  const { data: inquiries = [] } = useQuery(inquiriesQuery);
  const [selected, setSelected] = useState<Date>(new Date());
  const [openId, setOpenId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);

  const dateKey = toDateKey(selected);
  const { data: events = [] } = useQuery(calendarEventsByDayQuery(dateKey));

  const monthRange = useMemo(() => {
    const first = new Date(selected.getFullYear(), selected.getMonth(), 1);
    const last = new Date(selected.getFullYear(), selected.getMonth() + 1, 0);
    return { from: toDateKey(first), to: toDateKey(last) };
  }, [selected]);
  const { data: notes = [] } = useQuery(notesByDayQuery(dateKey));
  const { data: noteCounts = {} } = useQuery(noteDatesQuery(monthRange.from, monthRange.to));
  const { data: sessions = [] } = useQuery(bookingsByDayQuery(dateKey));
  const { data: sessionDates = [] } = useQuery(bookingDatesQuery(monthRange.from, monthRange.to));


  const openNotes = notes.filter((n) => !n.is_completed);
  const doneNotes = notes.filter((n) => n.is_completed);
  const overdueCount = openNotes.filter(isOverdue).length;
  const noteDays = useMemo(
    () => Object.keys(noteCounts).map((k) => new Date(k + "T00:00:00")),
    [noteCounts],
  );

  const bookings = useMemo(
    () => (inquiries as any[]).filter((i) => i.session_date && i.status !== "cancelled"),
    [inquiries],
  );

  const bookedDays = useMemo(
    () =>
      Array.from(new Set([...bookings.map((b) => b.session_date), ...sessionDates])).map(
        (d) => new Date(d + "T00:00:00"),
      ),
    [bookings, sessionDates],
  );

  const dayBookings = useMemo(
    () => bookings.filter((b) => b.session_date === dateKey).sort((a, b) => (a.session_slot ?? "").localeCompare(b.session_slot ?? "")),
    [bookings, dateKey],
  );

  /** Confirmed bookings + website enquiries + admin entries in one chronological list. */
  const timeline = useMemo(() => {
    const fromSessions = sessions.map((s) => ({
      sort: s.start_time ?? "zz",
      kind: "session" as const,
      session: s,
    }));
    const fromBookings = dayBookings.map((b) => ({
      sort: b.session_slot ?? "zz",
      kind: "booking" as const,
      booking: b,
    }));
    const fromEvents = events.map((e) => ({
      sort: e.start_time ?? "zz",
      kind: "event" as const,
      event: e,
    }));
    return [...fromSessions, ...fromBookings, ...fromEvents].sort((a, b) => a.sort.localeCompare(b.sort));
  }, [sessions, dayBookings, events]);

  const summary = useMemo(() => {
    const count = (t: string) => events.filter((e) => e.type === t && e.status !== "cancelled").length;
    const active = events.filter((e) => e.status !== "cancelled");
    const expected =
      active.reduce((s, e) => s + (e.amount ?? 0), 0) +
      sessions.reduce((s, b) => s + Number(b.total_amount ?? 0), 0);
    const pending =
      active.filter((e) => e.payment_status === "pending" || e.payment_status === "partial").reduce((s, e) => s + (e.amount ?? 0), 0) +
      sessions.reduce((s, b) => s + Number(b.balance_amount ?? 0), 0);
    return {
      total: dayBookings.length + active.length + sessions.length,
      shoots: dayBookings.length + sessions.length + count("shoot"),
      calls: count("call"),
      deliveries: count("delivery"),
      tasks: count("task") + count("note"),
      expected,
      pending,
    };
  }, [events, dayBookings, sessions]);


  function shift(days: number) {
    const d = new Date(selected);
    d.setDate(d.getDate() + days);
    setSelected(d);
  }

  async function setStatus(e: CalendarEvent, status: CalendarEvent["status"]) {
    try {
      await updateCalendarEvent(e.id, { status });
      await qc.invalidateQueries({ queryKey: ["calendar_events"] });
    } catch {
      toast.error("Could not update");
    }
  }

  async function remove(e: CalendarEvent) {
    if (!window.confirm(`Delete "${e.title}"? It stays recoverable in the database.`)) return;
    try {
      await softDeleteCalendarEvent(e.id);
      await qc.invalidateQueries({ queryKey: ["calendar_events"] });
      toast.success("Deleted");
    } catch {
      toast.error("Could not delete");
    }
  }

  const openRow = openId ? (inquiries as any[]).find((i) => i.id === openId) : null;
  const isToday = dateKey === toDateKey(new Date());

  return (
    <div>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-gold mb-2">Day Manager</p>
          <h1 className="font-display text-4xl">Studio schedule</h1>
        </div>
        <button
          onClick={() => { setEditing(null); setDialogOpen(true); }}
          className="inline-flex items-center gap-2 px-5 py-3 bg-onyx text-cream text-[10px] uppercase tracking-[0.25em] font-semibold hover:bg-gold"
        >
          <Plus className="size-4" /> Add
        </button>
      </header>

      <div className="grid lg:grid-cols-[auto_1fr] gap-10">
        <div className="bg-white border border-onyx/10 p-4 order-2 lg:order-1">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(d) => d && setSelected(d)}
            modifiers={{ booked: bookedDays, noted: noteDays }}
            modifiersClassNames={{
              booked: "relative after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-gold",
              noted: "relative before:content-[''] before:absolute before:bottom-1 before:left-1/2 before:translate-x-1.5 before:w-1 before:h-1 before:rounded-full before:bg-onyx/40",
            }}
            className="pointer-events-auto"
          />
        </div>

        <div className="space-y-6 order-1 lg:order-2 min-w-0">
          <div className="flex items-center gap-2">
            <button onClick={() => shift(-1)} aria-label="Previous day" className="p-2 border border-onyx/15 hover:border-gold">
              <ChevronLeft className="size-4" />
            </button>
            <button onClick={() => setSelected(new Date())} className="px-4 py-2 border border-onyx/15 text-[10px] uppercase tracking-[0.2em] hover:border-gold">
              Today
            </button>
            <button onClick={() => shift(1)} aria-label="Next day" className="p-2 border border-onyx/15 hover:border-gold">
              <ChevronRight className="size-4" />
            </button>
            <input
              type="date"
              value={dateKey}
              onChange={(e) => e.target.value && setSelected(new Date(e.target.value + "T00:00:00"))}
              className="ml-auto border border-onyx/15 bg-white px-3 py-2 text-sm"
            />
          </div>

          <div>
            <h2 className="font-display text-2xl mb-2">
              {isToday ? "Today · " : ""}
              {selected.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
            </h2>
            <p className="text-xs text-muted-foreground">
              {summary.total} scheduled · {openNotes.length} open note{openNotes.length === 1 ? "" : "s"}
              {overdueCount > 0 ? ` · ${overdueCount} overdue` : ""}
              {summary.expected > 0 ? ` · ₹${summary.expected.toLocaleString("en-IN")} expected` : ""}
              {summary.pending > 0 ? ` · ₹${summary.pending.toLocaleString("en-IN")} pending` : ""}
            </p>
          </div>

          <section className="space-y-2">
            <p className="eyebrow text-gold text-[10px]">Notes for this day</p>
            {openNotes.map((n) => (
              <NoteRow key={n.id} n={n} />
            ))}
            <NoteComposer date={dateKey} />
            {doneNotes.length > 0 && (
              <div className="pt-2 space-y-2">
                <p className="eyebrow text-[9px] text-muted-foreground">Completed</p>
                {doneNotes.map((n) => (
                  <NoteRow key={n.id} n={n} />
                ))}
              </div>
            )}
          </section>

          <p className="eyebrow text-gold text-[10px] pt-2">Schedule</p>


          {timeline.length === 0 ? (
            <div className="border border-dashed border-onyx/15 p-10 text-center text-sm text-muted-foreground">
              Nothing planned for this day yet.
            </div>
          ) : (
            <div className="space-y-2">
              {timeline.map((item) =>
                item.kind === "session" ? (
                  <SessionRow key={`s-${item.session.id}`} b={item.session} />
                ) : item.kind === "booking" ? (
                  <BookingRow key={`b-${item.booking.id}`} b={item.booking} onOpen={() => setOpenId(item.booking.id)} />
                ) : (
                  <EventRow
                    key={item.event.id}
                    e={item.event}
                    onEdit={() => { setEditing(item.event); setDialogOpen(true); }}
                    onComplete={() => setStatus(item.event, item.event.status === "completed" ? "scheduled" : "completed")}
                    onDelete={() => remove(item.event)}
                  />
                ),
              )}

            </div>
          )}
        </div>
      </div>

      <FamilyProfileDrawer open={!!openRow} row={openRow} onClose={() => setOpenId(null)} />
      <EventDialog open={dialogOpen} date={dateKey} event={editing} onClose={() => { setDialogOpen(false); setEditing(null); }} />
    </div>
  );
}


function EventRow({ e, onEdit, onComplete, onDelete }: { e: CalendarEvent; onEdit: () => void; onComplete: () => void; onDelete: () => void }) {
  const meta = typeMeta(e.type);
  const done = e.status === "completed";
  const cancelled = e.status === "cancelled";
  const accent = e.priority === "urgent" ? "border-l-destructive" : e.priority === "important" ? "border-l-gold" : "border-l-onyx/20";
  return (
    <div className={`bg-white border border-onyx/10 border-l-4 ${accent} p-4 flex items-start gap-4 ${done || cancelled ? "opacity-60" : ""}`}>
      <div className="w-20 shrink-0">
        <p className="eyebrow text-gold text-[10px]">{formatTime(e.start_time)}</p>
        {e.end_time && <p className="text-[10px] text-muted-foreground">{formatTime(e.end_time)}</p>}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`font-medium ${done ? "line-through" : ""}`}>
          <span className="mr-1.5">{meta.icon}</span>
          {e.title}
        </p>
        {(e.contact_name || e.phone) && (
          <p className="text-xs text-muted-foreground">
            {e.contact_name}
            {e.phone ? ` · ${e.phone}` : ""}
          </p>
        )}
        {e.description && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{e.description}</p>}
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-2">
          {meta.label}
          {e.amount != null ? ` · ₹${Number(e.amount).toLocaleString("en-IN")}` : ""}
          {e.payment_status ? ` · ${e.payment_status}` : ""}
          {done ? " · completed" : ""}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={onComplete} title={done ? "Reopen" : "Mark completed"} className="p-2 hover:text-gold">
          {done ? <RotateCcw className="size-4" /> : <Check className="size-4" />}
        </button>
        <button onClick={onEdit} title="Edit" className="p-2 hover:text-gold">
          <Pencil className="size-4" />
        </button>
        <button onClick={onDelete} title="Delete" className="p-2 hover:text-destructive">
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  );
}

function BookingRow({ b, onOpen }: { b: any; onOpen: () => void }) {
  const svc = SERVICES.find((s) => s.key === b.service_type);
  return (
    <button
      onClick={onOpen}
      className="w-full text-left bg-white border border-onyx/10 border-l-4 border-l-gold hover:border-gold p-4 flex items-center justify-between gap-4 transition-colors"
    >
      <div className="min-w-0">
        <p className="font-medium truncate">📸 {b.family_name || b.name}{b.child_name ? ` · ${b.child_name}` : ""}</p>
        <p className="text-xs text-muted-foreground">
          Website booking · {svc?.title ?? b.category_label ?? "Session"}
        </p>
      </div>
      <span className="eyebrow text-gold">{b.session_slot ?? "—"}</span>
    </button>
  );
}

/** A confirmed booking from the canonical bookings table. */
function SessionRow({ b }: { b: Booking }) {
  const due = Number(b.balance_amount ?? 0);
  return (
    <Link
      to="/admin/bookings"
      className="w-full text-left bg-white border border-onyx/10 border-l-4 border-l-onyx hover:border-gold p-4 flex items-center justify-between gap-4 transition-colors"
    >
      <div className="w-20 shrink-0">
        <p className="eyebrow text-gold text-[10px]">{b.start_time ? formatTime(b.start_time) : "—"}</p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium truncate">📸 {bookingLabel(b)}</p>
        <p className="text-xs text-muted-foreground truncate">
          Booking · {formatSessionTime(b)}
          {b.package_name ? ` · ${b.package_name}` : ""}
          {b.phone ? ` · ${b.phone}` : ""}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm">{money(b.total_amount)}</p>
        <p className={`text-[11px] ${due > 0 ? "text-destructive" : "text-muted-foreground"}`}>
          {due > 0 ? `${money(due)} due` : "Settled"}
        </p>
      </div>
    </Link>
  );
}
