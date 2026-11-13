import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Plus,
  RefreshCw,
  Check,
  MessageCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  Phone,
} from "lucide-react";
import { DeskNav } from "@/components/desk-nav";
import { whatsappLink, telLink } from "@/lib/site";

export const Route = createFileRoute("/desk_/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar & Schedule — Rajmoti Studio OS" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: Calendar,
});

type EventItem = {
  id: string;
  title: string;
  event_date: string;
  start_time: string;
  event_type: string;
  contact_phone: string;
  notes: string;
  done: number;
};

type Job = {
  id: string;
  customer_name: string;
  phone: string;
  service_type: string;
  due_date: string;
  status: string;
  priority: string;
};

const iso = (date: Date) =>
  [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
const today = () => iso(new Date());

function Calendar() {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [day, setDay] = useState(today());
  const [events, setEvents] = useState<EventItem[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({
    title: "",
    event_date: today(),
    start_time: "10:00",
    event_type: "session",
    contact_phone: "",
    notes: "",
  });

  const start = iso(new Date(month.getFullYear(), month.getMonth(), 1));
  const end = iso(new Date(month.getFullYear(), month.getMonth() + 1, 0));

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/owner/calendar?start=" + start + "&end=" + end, {
        credentials: "same-origin",
        cache: "no-store",
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error || "Calendar unavailable");
      setEvents(d.events || []);
      setJobs(d.jobs || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load calendar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [start, end]);

  const grid = useMemo(() => {
    const offset = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
    const n = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return Array.from({ length: Math.ceil((n + offset) / 7) * 7 }, (_, i) => {
      const dayNumber = i - offset + 1;
      return dayNumber >= 1 && dayNumber <= n
        ? iso(new Date(month.getFullYear(), month.getMonth(), dayNumber))
        : null;
    });
  }, [month]);

  const dayEvents = events.filter((x) => x.event_date === day);
  const dayJobs = jobs.filter((x) => x.due_date === day);

  // Check for scheduling conflicts (events at the same time on the same date)
  const conflicts = useMemo(() => {
    const timeMap: Record<string, EventItem[]> = {};
    dayEvents.forEach((e) => {
      if (e.start_time) {
        timeMap[e.start_time] = timeMap[e.start_time] || [];
        timeMap[e.start_time].push(e);
      }
    });
    return Object.entries(timeMap).filter(([, items]) => items.length > 1);
  }, [dayEvents]);

  const shift = (n: number) => {
    const newMonth = new Date(month.getFullYear(), month.getMonth() + n, 1);
    setMonth(newMonth);
    setDay(iso(newMonth));
  };

  const add = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const r = await fetch("/api/owner/calendar", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error || "Unable to create calendar entry");
      setNotice("Calendar appointment scheduled.");
      setShowAdd(false);
      setForm({ title: "", event_date: day, start_time: "10:00", event_type: "session", contact_phone: "", notes: "" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save event");
    } finally {
      setSaving(false);
    }
  };

  const mark = async (item: EventItem) => {
    try {
      const r = await fetch("/api/owner/calendar/" + encodeURIComponent(item.id), {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: !item.done }),
      });
      if (!r.ok) throw Error("Could not update task");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    }
  };

  const getShootReminderMessage = (event: EventItem) => {
    return `Namaste! This is Rajmoti Studio, Jetpur. Looking forward to our scheduled photography session "${event.title}" on ${event.event_date}${
      event.start_time ? ` at ${event.start_time}` : ""
    }. Please arrive 10 minutes early. Let us know if you need any directions!`;
  };

  return (
    <div className="desk-app">
      <DeskNav active="calendar" />
      <main className="desk-page">
        <div className="desk-heading">
          <div>
            <p className="desk-kicker">Studio Schedule & Workflow</p>
            <h1>
              Studio calendar <em>& shoot bookings.</em>
            </h1>
            <p>Appointments, production deadlines, framing dates and personal reminders in one synchronized agenda.</p>
          </div>
          <div className="flex gap-2">
            <button className="desk-light-btn text-xs" onClick={() => void load()}>
              <RefreshCw size={14} /> Refresh
            </button>
            <button
              className="desk-primary"
              onClick={() => {
                setForm({ ...form, event_date: day });
                setShowAdd(true);
              }}
            >
              <Plus size={16} /> Add appointment
            </button>
          </div>
        </div>

        {error && (
          <p role="alert" className="desk-error">
            {error}
          </p>
        )}
        {notice && (
          <p className="desk-notice" role="status">
            {notice}
          </p>
        )}

        {/* Schedule Conflict Alert */}
        {conflicts.length > 0 && (
          <div className="p-3.5 mb-5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-700 shrink-0" />
            <span>
              <strong>Schedule Conflict:</strong> Multiple studio events booked at{" "}
              {conflicts.map(([time]) => time).join(", ")} on this date. Please check studio room availability.
            </span>
          </div>
        )}

        <div className="desk-calendar-layout">
          {/* Left Month Grid */}
          <section className="desk-calendar-card shadow-sm">
            <div className="desk-month">
              <button onClick={() => shift(-1)} aria-label="Previous month">
                <ChevronLeft />
              </button>
              <h2>{month.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</h2>
              <div>
                <button
                  onClick={() => {
                    const now = new Date();
                    setMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                    setDay(today());
                  }}
                >
                  Today
                </button>
                <button onClick={() => shift(1)} aria-label="Next month">
                  <ChevronRight />
                </button>
              </div>
            </div>

            <div className="desk-calendar-grid">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((x) => (
                <span key={x} className="weekday">
                  {x}
                </span>
              ))}
              {grid.map((date, i) => {
                const dayEventCount = events.filter((x) => x.event_date === date).length;
                const dayJobCount = jobs.filter((x) => x.due_date === date).length;
                const totalItems = dayEventCount + dayJobCount;
                return (
                  <button
                    key={date || "blank" + i}
                    disabled={!date}
                    onClick={() => date && setDay(date)}
                    className={[
                      !date ? "blank" : "",
                      date === day ? "current" : "",
                      date === today() ? "today" : "",
                    ].join(" ")}
                  >
                    {date && (
                      <>
                        <b>{Number(date.slice(-2))}</b>
                        {totalItems > 0 && <small>{totalItems}</small>}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Right Day Agenda Panel */}
          <aside className="desk-day-panel shadow-sm">
            <p className="desk-kicker">Day Agenda</p>
            <h2>
              {new Date(day + "T12:00:00").toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </h2>
            <p className="desk-day-count">
              {dayEvents.length} scheduled session(s) · {dayJobs.length} production delivery deadline(s)
            </p>

            {loading ? (
              <p className="text-stone-500 text-sm py-8">Loading schedule…</p>
            ) : (
              <div className="desk-day-list">
                {/* Orders due on this date */}
                {dayJobs.map((j) => (
                  <article key={j.id} className="border-l-4 border-l-amber-600 bg-amber-50/50">
                    <span className="desk-event-type text-amber-800 font-semibold">
                      Production Due · {j.priority.toUpperCase()}
                    </span>
                    <h3>
                      {j.customer_name} — {j.service_type}
                    </h3>
                    <p>
                      Status: {j.status} · Phone: {j.phone}
                    </p>
                    <div className="flex gap-2 items-center mt-2">
                      <Link to="/desk" className="desk-small-action">
                        View in Work Desk →
                      </Link>
                      {j.phone && (
                        <a
                          className="desk-small-action text-emerald-700"
                          href={whatsappLink(`Namaste ${j.customer_name}, this is Rajmoti Studio regarding your order (${j.service_type}).`, j.phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MessageCircle size={13} /> WhatsApp
                        </a>
                      )}
                    </div>
                  </article>
                ))}

                {/* Calendar Events on this date */}
                {dayEvents.map((x) => (
                  <article key={x.id} className={x.done ? "is-done" : ""}>
                    <span className="desk-event-type">
                      {x.event_type} {x.start_time ? "· " + x.start_time : ""}
                    </span>
                    <h3>{x.title}</h3>
                    {x.notes && <p>{x.notes}</p>}
                    <div className="flex gap-2 items-center mt-2 flex-wrap">
                      <button onClick={() => void mark(x)} className="desk-small-action">
                        <Check size={13} />
                        {x.done ? "Reopen" : "Mark completed"}
                      </button>

                      {x.contact_phone && (
                        <>
                          <a
                            className="desk-small-action text-emerald-700 font-medium"
                            href={whatsappLink(getShootReminderMessage(x), x.contact_phone)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <MessageCircle size={14} /> Send WhatsApp Reminder
                          </a>
                          <a className="desk-small-action text-stone-600" href={telLink(x.contact_phone)}>
                            <Phone size={13} /> Call
                          </a>
                        </>
                      )}
                    </div>
                  </article>
                ))}

                {!dayJobs.length && !dayEvents.length && (
                  <div className="desk-empty">
                    <CalendarDays size={28} className="text-stone-300" />
                    <p className="text-stone-600">No appointments or deadlines on this day.</p>
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>

        {/* Modal: Add Calendar Item */}
        {showAdd && (
          <div
            className="desk-modal-backdrop"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setShowAdd(false);
            }}
          >
            <section role="dialog" aria-modal="true" aria-label="New calendar appointment" className="desk-modal">
              <div className="flex justify-between mb-5 items-center">
                <h2>Add Studio Appointment</h2>
                <button onClick={() => setShowAdd(false)}>Close</button>
              </div>
              <form className="desk-form" onSubmit={(e) => void add(e)}>
                <label className="desk-span2">
                  Session / Task Title
                  <input
                    required
                    minLength={2}
                    maxLength={140}
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Baby Milestone Shoot - Aarav Patel"
                  />
                </label>
                <label>
                  Date
                  <input
                    required
                    type="date"
                    value={form.event_date}
                    onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                  />
                </label>
                <label>
                  Start Time
                  <input
                    type="time"
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                  />
                </label>
                <label>
                  Appointment Type
                  <select
                    value={form.event_type}
                    onChange={(e) => setForm({ ...form, event_type: e.target.value })}
                  >
                    {["session", "consultation", "photo_selection", "delivery", "framing", "task", "other"].map((v) => (
                      <option value={v} key={v}>
                        {v.replaceAll("_", " ").toUpperCase()}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Client WhatsApp / Phone
                  <input
                    type="tel"
                    value={form.contact_phone}
                    onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                    placeholder="+91 94290 70317"
                  />
                </label>
                <label className="desk-span2">
                  Preparation Notes
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Props needed, outfits, family notes…"
                  />
                </label>
                <button disabled={saving} className="desk-primary">
                  {saving ? "Scheduling…" : "Save Appointment"}
                </button>
              </form>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
