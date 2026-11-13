import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, IndianRupee, MessageCircle, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  BOOKING_STAGES,
  BOOKING_STATUSES,
  type Booking,
  type BookingStage,
  type BookingStatus,
  bookingsQuery,
  bookingLabel,
  createBooking,
  formatSessionTime,
  linkOrCreateCustomer,
  money,
  recordPayment,
  softDeleteBooking,
  todayKey,
  updateBooking,
} from "@/lib/bookings";
import { customerWhatsAppLink } from "@/lib/customer-directory";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/admin/bookings")({
  component: AdminBookings,
});

const SERVICES = [
  { slug: "baby", label: "Baby" },
  { slug: "maternity", label: "Maternity" },
  { slug: "family", label: "Family" },
  { slug: "wedding", label: "Wedding" },
  { slug: "", label: "Other" },
];

const spring = { type: "spring" as const, stiffness: 400, damping: 34 };

function prettyDate(d: string) {
  return new Date(`${d}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Confirmation message — plain, human, no internal IDs or storage links. */
function confirmMessage(b: Booking) {
  const lines = [
    `Hello${b.contact_name ? ` ${b.contact_name.trim()}` : ""} 👋`,
    "",
    `Your ${b.service_label || "photography"} session at ${SITE.name} is confirmed.`,
    `📅 ${prettyDate(b.session_date)}`,
  ];
  if (b.start_time) lines.push(`🕒 ${formatSessionTime(b)}`);
  if (b.package_name) lines.push(`📦 ${b.package_name}`);
  if (Number(b.total_amount) > 0) {
    lines.push(`💰 Total ${money(b.total_amount)}${Number(b.paid_amount) > 0 ? ` · Paid ${money(b.paid_amount)} · Balance ${money(b.balance_amount)}` : ""}`);
  }
  lines.push("", "See you at the studio!");
  return lines.join("\n");
}

function balanceMessage(b: Booking) {
  return [
    `Hello${b.contact_name ? ` ${b.contact_name.trim()}` : ""} 👋`,
    "",
    `A gentle reminder about the balance for your ${b.service_label || "photography"} session on ${prettyDate(b.session_date)}.`,
    `Balance due: ${money(b.balance_amount)}`,
    "",
    "Thank you!",
  ].join("\n");
}

type FormState = {
  contact_name: string;
  phone: string;
  service_slug: string;
  package_name: string;
  session_date: string;
  start_time: string;
  end_time: string;
  location: string;
  notes: string;
  total_amount: string;
  paid_amount: string;
  status: BookingStatus;
  stage: BookingStage;
};

const emptyForm = (): FormState => ({
  contact_name: "",
  phone: "",
  service_slug: "baby",
  package_name: "",
  session_date: todayKey(),
  start_time: "",
  end_time: "",
  location: "",
  notes: "",
  total_amount: "",
  paid_amount: "",
  status: "confirmed",
  stage: "upcoming",
});

function AdminBookings() {
  const qc = useQueryClient();
  const { data: bookings = [], isLoading } = useQuery(bookingsQuery);
  const [tab, setTab] = useState<"upcoming" | "today" | "past" | "money" | "all">("upcoming");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Booking | null>(null);
  const [creating, setCreating] = useState(false);

  const today = todayKey();

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return bookings
      .filter((b) => {
        if (tab === "today") return b.session_date === today && b.status !== "cancelled";
        if (tab === "upcoming") return b.session_date >= today && b.status !== "cancelled" && b.status !== "completed";
        if (tab === "past") return b.session_date < today;
        if (tab === "money") return Number(b.balance_amount) > 0 && b.status !== "cancelled";
        return true;
      })
      .filter((b) =>
        !term
          ? true
          : [b.contact_name, b.phone, b.service_label, b.package_name, b.notes, b.location]
              .some((v) => v?.toLowerCase().includes(term)),
      )
      .sort((a, b) =>
        tab === "past" ? b.session_date.localeCompare(a.session_date) : a.session_date.localeCompare(b.session_date),
      );
  }, [bookings, tab, q, today]);

  const outstanding = bookings
    .filter((b) => b.status !== "cancelled")
    .reduce((s, b) => s + Number(b.balance_amount || 0), 0);

  function refresh() {
    qc.invalidateQueries({ queryKey: ["bookings"] });
    qc.invalidateQueries({ queryKey: ["today-sessions"] });
    qc.invalidateQueries({ queryKey: ["pending-payments"] });
  }

  return (
    <div>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-gold mb-2">Bookings</p>
          <h1 className="font-display text-4xl">Confirmed sessions</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {bookings.length} booking{bookings.length === 1 ? "" : "s"}
            {outstanding > 0 && <> · {money(outstanding)} outstanding</>}
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setCreating(true); }}
          className="flex items-center gap-2 bg-onyx text-cream px-4 py-2.5 text-sm hover:bg-onyx/90"
        >
          <Plus className="size-4" /> New booking
        </button>
      </header>

      <div className="flex flex-wrap gap-2 mb-4">
        {([
          ["upcoming", "Upcoming"],
          ["today", "Today"],
          ["money", "Money due"],
          ["past", "Past"],
          ["all", "All"],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`eyebrow px-3 py-1.5 text-xs border transition-colors ${
              tab === k ? "bg-onyx text-cream border-onyx" : "border-onyx/15 hover:border-gold"
            }`}
          >
            {label}
          </button>
        ))}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, phone, package…"
          className="border border-onyx/15 px-3 py-1.5 text-sm bg-cream flex-1 min-w-52"
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-16 text-center">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground border border-dashed border-onyx/20">
          <p className="font-display text-2xl italic">Nothing here yet.</p>
          <p className="text-sm mt-2">Confirm an enquiry on WhatsApp, then add it as a booking.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {filtered.map((b) => (
              <motion.li
                key={b.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={spring}
                className="bg-white border border-onyx/10 hover:border-gold transition-colors p-4 flex flex-wrap items-center gap-4"
              >
                <button onClick={() => { setCreating(false); setEditing(b); }} className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{bookingLabel(b)}</p>
                    <span className="eyebrow px-2 py-0.5 border border-onyx/15 text-[10px]">{b.status}</span>
                    {b.status !== "cancelled" && (
                      <span className="eyebrow px-2 py-0.5 bg-gold/10 text-gold text-[10px]">{b.stage}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {prettyDate(b.session_date)} · {formatSessionTime(b)}
                    {b.service_label ? ` · ${b.service_label}` : ""}
                    {b.phone ? ` · ${b.phone}` : ""}
                  </p>
                </button>

                <div className="text-right shrink-0">
                  <p className="text-sm">{money(b.total_amount)}</p>
                  <p className={`text-xs ${Number(b.balance_amount) > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                    {Number(b.balance_amount) > 0 ? `${money(b.balance_amount)} due` : "Settled"}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {customerWhatsAppLink(b.phone, Number(b.balance_amount) > 0 ? balanceMessage(b) : confirmMessage(b)) && (
                    <a
                      href={customerWhatsAppLink(b.phone, Number(b.balance_amount) > 0 ? balanceMessage(b) : confirmMessage(b))!}
                      target="_blank"
                      rel="noreferrer"
                      title="WhatsApp"
                      className="px-2.5 py-2 bg-[#25D366] text-onyx"
                    >
                      <MessageCircle className="size-4" />
                    </a>
                  )}
                  <button
                    onClick={async () => {
                      if (!confirm("Remove this booking?")) return;
                      await softDeleteBooking(b.id);
                      refresh();
                      toast.success("Booking removed");
                    }}
                    className="text-destructive p-2"
                    title="Remove"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <AnimatePresence>
        {(creating || editing) && (
          <BookingSheet
            booking={editing}
            onClose={() => { setCreating(false); setEditing(null); }}
            onSaved={() => { refresh(); setCreating(false); setEditing(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function BookingSheet({
  booking,
  onClose,
  onSaved,
}: {
  booking: Booking | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(() =>
    booking
      ? {
          contact_name: booking.contact_name ?? "",
          phone: booking.phone ?? "",
          service_slug: booking.service_slug ?? "",
          package_name: booking.package_name ?? "",
          session_date: booking.session_date,
          start_time: booking.start_time?.slice(0, 5) ?? "",
          end_time: booking.end_time?.slice(0, 5) ?? "",
          location: booking.location ?? "",
          notes: booking.notes ?? "",
          total_amount: booking.total_amount ? String(booking.total_amount) : "",
          paid_amount: booking.paid_amount ? String(booking.paid_amount) : "",
          status: booking.status,
          stage: booking.stage,
        }
      : emptyForm(),
  );
  const [saving, setSaving] = useState(false);
  const [payment, setPayment] = useState("");

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    if (!form.session_date) return toast.error("Pick a session date");
    setSaving(true);
    try {
      const service = SERVICES.find((s) => s.slug === form.service_slug);
      const payload = {
        contact_name: form.contact_name.trim() || null,
        phone: form.phone.trim() || null,
        service_slug: form.service_slug || null,
        service_label: service?.label ?? null,
        package_name: form.package_name.trim() || null,
        session_date: form.session_date,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        location: form.location.trim() || null,
        notes: form.notes.trim() || null,
        total_amount: Number(form.total_amount || 0),
        paid_amount: Number(form.paid_amount || 0),
        status: form.status,
        stage: form.stage,
      };

      if (booking) {
        await updateBooking(booking.id, payload);
        toast.success("Booking updated");
      } else {
        const customerId = await linkOrCreateCustomer({
          name: payload.contact_name,
          phone: payload.phone,
          serviceSlug: payload.service_slug,
        });
        await createBooking({ ...payload, customer_id: customerId });
        toast.success("Booking created");
      }
      onSaved();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save booking");
    } finally {
      setSaving(false);
    }
  }

  async function addPayment() {
    if (!booking) return;
    const amt = Number(payment);
    if (!amt || amt <= 0) return toast.error("Enter an amount");
    await recordPayment(booking.id, Number(booking.paid_amount), amt);
    setPayment("");
    toast.success(`${money(amt)} recorded`);
    onSaved();
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-onyx/40 z-40"
      />
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={spring}
        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-cream z-50 overflow-y-auto border-l border-onyx/10"
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="eyebrow text-gold mb-1">{booking ? "Edit booking" : "New booking"}</p>
              <h2 className="font-display text-2xl">{booking ? bookingLabel(booking) : "Add a session"}</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:text-gold"><X className="size-5" /></button>
          </div>

          <div className="space-y-4">
            <Field label="Name">
              <input value={form.contact_name} onChange={(e) => set("contact_name", e.target.value)} className={input} />
            </Field>
            <Field label="Phone">
              <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 98765 43210" className={input} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Service">
                <select value={form.service_slug} onChange={(e) => set("service_slug", e.target.value)} className={input}>
                  {SERVICES.map((s) => <option key={s.label} value={s.slug}>{s.label}</option>)}
                </select>
              </Field>
              <Field label="Package">
                <input value={form.package_name} onChange={(e) => set("package_name", e.target.value)} className={input} />
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Field label="Date">
                <input type="date" value={form.session_date} onChange={(e) => set("session_date", e.target.value)} className={input} />
              </Field>
              <Field label="Start">
                <input type="time" value={form.start_time} onChange={(e) => set("start_time", e.target.value)} className={input} />
              </Field>
              <Field label="End">
                <input type="time" value={form.end_time} onChange={(e) => set("end_time", e.target.value)} className={input} />
              </Field>
            </div>

            <Field label="Location">
              <input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Studio / on location" className={input} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Total ₹">
                <input type="number" value={form.total_amount} onChange={(e) => set("total_amount", e.target.value)} className={input} />
              </Field>
              <Field label="Paid ₹">
                <input type="number" value={form.paid_amount} onChange={(e) => set("paid_amount", e.target.value)} className={input} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Status">
                <select value={form.status} onChange={(e) => set("status", e.target.value as BookingStatus)} className={input}>
                  {BOOKING_STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </Field>
              <Field label="Work stage">
                <select value={form.stage} onChange={(e) => set("stage", e.target.value as BookingStage)} className={input}>
                  {BOOKING_STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Notes">
              <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} className={input} />
            </Field>

            <button
              onClick={save}
              disabled={saving}
              className="w-full bg-onyx text-cream py-3 text-sm hover:bg-onyx/90 disabled:opacity-50"
            >
              {saving ? "Saving…" : booking ? "Save changes" : "Create booking"}
            </button>

            {booking && (
              <div className="border-t border-onyx/10 pt-5 space-y-3">
                <p className="eyebrow text-xs flex items-center gap-2"><IndianRupee className="size-3.5 text-gold" /> Record a payment</p>
                <p className="text-xs text-muted-foreground">
                  Total {money(booking.total_amount)} · Paid {money(booking.paid_amount)} · Balance {money(booking.balance_amount)}
                </p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={payment}
                    onChange={(e) => setPayment(e.target.value)}
                    placeholder="Amount received"
                    className={`${input} flex-1`}
                  />
                  <button onClick={addPayment} className="bg-gold text-onyx px-4 text-sm">Add</button>
                </div>
                {customerWhatsAppLink(booking.phone, confirmMessage(booking)) && (
                  <a
                    href={customerWhatsAppLink(booking.phone, confirmMessage(booking))!}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-[#25D366] text-onyx py-2.5 text-sm"
                  >
                    <MessageCircle className="size-4" /> Send confirmation
                  </a>
                )}
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <CalendarDays className="size-3" /> This session shows on the calendar and today's dashboard.
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.aside>
    </>
  );
}

const input = "w-full border border-onyx/15 px-3 py-2 text-sm bg-white";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="eyebrow text-[10px] text-muted-foreground block mb-1.5">{label}</span>
      {children}
    </label>
  );
}
