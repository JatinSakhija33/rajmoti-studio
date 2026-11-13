import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  EVENT_TYPES,
  createCalendarEvent,
  searchCustomers,
  updateCalendarEvent,
  type CalendarEvent,
  type CalendarEventType,
  type CalendarPriority,
} from "@/lib/calendar";

type Props = {
  open: boolean;
  date: string;
  event?: CalendarEvent | null;
  onClose: () => void;
};

const REMINDERS: { value: string; label: string }[] = [
  { value: "", label: "No reminder" },
  { value: "30", label: "30 minutes before" },
  { value: "60", label: "1 hour before" },
  { value: "1440", label: "1 day before" },
];

const inputCls = "w-full border border-onyx/15 bg-white px-3 py-2 text-sm";
const labelCls = "eyebrow text-[10px] text-muted-foreground mb-1 block";

export function EventDialog({ open, date, event, onClose }: Props) {
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [type, setType] = useState<CalendarEventType>("shoot");
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState(date);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [description, setDescription] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [priority, setPriority] = useState<CalendarPriority>("normal");
  const [reminder, setReminder] = useState("");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<{ id: string; customer_name: string; phone: string | null }[]>([]);

  useEffect(() => {
    if (!open) return;
    setType((event?.type as CalendarEventType) ?? "shoot");
    setTitle(event?.title ?? "");
    setEventDate(event?.event_date ?? date);
    setStartTime(event?.start_time?.slice(0, 5) ?? "");
    setEndTime(event?.end_time?.slice(0, 5) ?? "");
    setDescription(event?.description ?? "");
    setContactName(event?.contact_name ?? "");
    setPhone(event?.phone ?? "");
    setAmount(event?.amount != null ? String(event.amount) : "");
    setPaymentStatus(event?.payment_status ?? "");
    setPriority((event?.priority as CalendarPriority) ?? "normal");
    setReminder(event?.reminder_offset_minutes ? String(event.reminder_offset_minutes) : "");
    setCustomerId(event?.customer_id ?? null);
    setSearch("");
    setResults([]);
  }, [open, event, date]);

  useEffect(() => {
    if (search.trim().length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      searchCustomers(search)
        .then((r) => !cancelled && setResults(r))
        .catch(() => !cancelled && setResults([]));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [search]);

  async function save() {
    if (!title.trim()) {
      toast.error("Add a short title");
      return;
    }
    setSaving(true);
    try {
      const offset = reminder ? Number(reminder) : null;
      const reminderAt =
        offset && startTime ? new Date(new Date(`${eventDate}T${startTime}:00`).getTime() - offset * 60000).toISOString() : null;
      const payload = {
        type,
        title: title.trim(),
        event_date: eventDate,
        start_time: startTime || null,
        end_time: endTime || null,
        description: description.trim() || null,
        contact_name: contactName.trim() || null,
        phone: phone.trim() || null,
        amount: amount ? Number(amount) : null,
        payment_status: paymentStatus || null,
        priority,
        customer_id: customerId,
        reminder_offset_minutes: offset,
        reminder_at: reminderAt,
      };
      if (event) await updateCalendarEvent(event.id, payload as Partial<CalendarEvent>);
      else await createCalendarEvent(payload);
      await qc.invalidateQueries({ queryKey: ["calendar_events"] });
      await qc.invalidateQueries({ queryKey: ["calendar_event_dates"] });
      toast.success(event ? "Updated" : "Added to the day");
      onClose();
    } catch {
      toast.error("Could not save this entry");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto bg-cream">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{event ? "Edit entry" : "Add to the day"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {EVENT_TYPES.map((t) => (
              <button
                key={t.key}
                onClick={() => setType(t.key)}
                className={`px-2 py-2 text-[11px] border transition-colors ${
                  type === t.key ? "border-gold bg-onyx text-cream" : "border-onyx/15 hover:border-gold"
                }`}
              >
                <span className="block text-base">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          <div>
            <label className={labelCls}>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="Shah Family — passport photos" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Date</label>
              <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Start</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>End</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Existing customer (optional)</label>
            {customerId ? (
              <div className="flex items-center justify-between border border-onyx/15 bg-white px-3 py-2 text-sm">
                <span>{contactName || "Linked customer"}</span>
                <button onClick={() => setCustomerId(null)} className="text-xs text-muted-foreground hover:text-destructive">
                  Unlink
                </button>
              </div>
            ) : (
              <>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={inputCls}
                  placeholder="Search name or phone — optional"
                />
                {results.length > 0 && (
                  <div className="border border-onyx/15 border-t-0 bg-white divide-y divide-onyx/5">
                    {results.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setCustomerId(c.id);
                          setContactName(c.customer_name);
                          if (c.phone) setPhone(c.phone);
                          setSearch("");
                          setResults([]);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-onyx/5"
                      >
                        {c.customer_name}
                        {c.phone ? <span className="text-xs text-muted-foreground"> · {c.phone}</span> : null}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Name (no CRM needed)</label>
              <input value={contactName} onChange={(e) => setContactName(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Amount ₹</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Payment</label>
              <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className={inputCls}>
                <option value="">—</option>
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as CalendarPriority)} className={inputCls}>
                <option value="normal">Normal</option>
                <option value="important">Important</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Reminder</label>
            <select value={reminder} onChange={(e) => setReminder(e.target.value)} className={inputCls}>
              {REMINDERS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Note</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputCls} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="eyebrow text-muted-foreground hover:text-onyx">
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="px-6 py-3 bg-onyx text-cream text-[10px] uppercase tracking-[0.25em] font-semibold hover:bg-gold disabled:opacity-50"
            >
              {saving ? "Saving…" : event ? "Save changes" : "Add"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
