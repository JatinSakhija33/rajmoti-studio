/**
 * The contact drawer — a mini workspace for one person.
 * Profile → WhatsApp → Next action → Sticky notes → Follow-ups → History.
 */
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Copy, Instagram, MessageCircle, MoreHorizontal, Pin, Star, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { findByPhone, mergeContacts, softDeleteContact, updateContact, contactInitials, type Contact } from "@/lib/contacts";
import { normalizePhone } from "@/lib/customer-directory";
import { communicationQuery, portfolioUrlFor } from "@/lib/studio-settings";
import { useIsMobile, useMotionPrefs } from "@/lib/motion";
import {
  addDaysISO, addNote, addTask, completeTask, deleteNote, deleteTask, dueLabel,
  fetchNotes, fetchTasks, NOTE_COLORS, noteSurface, todayISO, updateNote,
  type ContactNote,
} from "@/lib/contact-workspace";

export type WaKind = "portfolio" | "google" | "followup" | "availability";

const spring = { type: "spring" as const, stiffness: 380, damping: 34, mass: 0.8 };

export function ContactDrawer({ contact, services, onClose, onChanged, onWhatsApp }: {
  contact: Contact;
  services: { slug: string; name: string }[];
  onClose: () => void;
  onChanged: () => void;
  onWhatsApp: (c: Contact, kind: WaKind, service?: { slug: string; name: string }) => void;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState(contact.customer_name ?? "");
  const [phone, setPhone] = useState(contact.phone ?? "");
  const [service, setService] = useState(contact.service_slug ?? "");
  const [savedFlash, setSavedFlash] = useState(false);
  const [dup, setDup] = useState<Contact | null>(null);
  const [share, setShare] = useState(false);
  const [more, setMore] = useState(false);
  const m = useMotionPrefs();
  const mobile = useIsMobile();
  const { data: comm } = useQuery(communicationQuery);

  const notes = useQuery({ queryKey: ["contact-notes", contact.id], queryFn: () => fetchNotes(contact.id) });
  const tasks = useQuery({ queryKey: ["contact-tasks", contact.id], queryFn: () => fetchTasks(contact.id) });

  const notesKey = ["contact-notes", contact.id];
  const setNotes = (fn: (old: ContactNote[]) => ContactNote[]) =>
    qc.setQueryData(notesKey, (old: ContactNote[] | undefined) => fn(old ?? []));

  /** Optimistic note create — the paper appears before the database replies. */
  async function createNote(body: string, color: string) {
    const temp: ContactNote = {
      id: `temp-${Date.now()}`, customer_id: contact.id, body, pinned: false, color,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    setNotes((old) => [temp, ...old]);
    try {
      await addNote(contact.id, body, color);
      await notes.refetch();
      qc.invalidateQueries({ queryKey: ["note-counts"] });
    } catch {
      setNotes((old) => old.filter((n) => n.id !== temp.id));
      toast.error("That note didn't save. Please try again.");
    }
  }

  async function togglePin(n: ContactNote) {
    setNotes((old) => old.map((x) => (x.id === n.id ? { ...x, pinned: !x.pinned } : x)));
    try { await updateNote(n.id, { pinned: !n.pinned }); await notes.refetch(); }
    catch { setNotes((old) => old.map((x) => (x.id === n.id ? { ...x, pinned: n.pinned } : x))); toast.error("Couldn't pin that note."); }
  }

  async function removeNote(n: ContactNote) {
    setNotes((old) => old.filter((x) => x.id !== n.id));
    let undone = false;
    toast("Note deleted", {
      action: { label: "Undo", onClick: () => { undone = true; setNotes((old) => [n, ...old]); } },
      duration: 5000,
    });
    window.setTimeout(async () => {
      if (undone) return;
      try { await deleteNote(n.id); qc.invalidateQueries({ queryKey: ["note-counts"] }); }
      catch { setNotes((old) => [n, ...old]); toast.error("Couldn't delete that note."); }
    }, 5200);
  }
  const history = useQuery({
    queryKey: ["contact-history", contact.id],
    queryFn: async () => {
      const [inq, ev] = await Promise.all([
        supabase.from("inquiries").select("id,created_at,status,service_type,category_label,session_date")
          .eq("customer_id", contact.id).order("created_at", { ascending: false }).limit(10),
        supabase.from("calendar_events").select("id,title,event_date,status,amount,payment_status")
          .eq("customer_id", contact.id).is("deleted_at", null).order("event_date", { ascending: false }).limit(10),
      ]);
      return { inquiries: (inq.data ?? []) as any[], events: (ev.data ?? []) as any[] };
    },
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function flash() {
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1200);
  }

  async function saveProfile(patch: Record<string, unknown>) {
    try {
      await updateContact(contact.id, patch);
      flash();
      onChanged();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save");
    }
  }

  async function savePhone() {
    const v = phone.trim();
    if (v && v !== (contact.phone ?? "")) {
      const other = await findByPhone(v);
      if (other && other.id !== contact.id) return setDup(other);
    }
    void saveProfile({ phone: v || null });
  }

  async function merge() {
    if (!dup) return;
    if (!confirm(`Merge into ${dup.customer_name ?? dup.phone}? Bookings, inquiries, notes and follow-ups move across.`)) return;
    await mergeContacts(dup.id, contact.id);
    toast.success("Contacts merged");
    onChanged();
    onClose();
  }

  const valid = normalizePhone(phone).ok;
  const openTasks = (tasks.data ?? []).filter((t) => !t.done_at);
  const next = openTasks[0];

  const sheet = m.sheet(mobile);

  return (
    <div className={`fixed inset-0 z-50 flex ${mobile ? "items-end" : "justify-end"}`}>
      <motion.div
        className="absolute inset-0 bg-onyx/45"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.aside
        role="dialog" aria-modal="true" aria-label="Contact"
        className={`relative bg-cream shadow-[0_20px_60px_-20px_rgba(0,0,0,0.45)] overflow-y-auto w-full ${
          mobile ? "max-h-[92dvh] rounded-t-2xl border-t border-onyx/10" : "h-dvh sm:max-w-[460px] border-l border-onyx/10"
        }`}
        {...sheet}
      >
        {mobile && <div className="sticky top-0 z-20 bg-cream pt-2 pb-1 grid place-items-center"><span className="h-1 w-10 rounded-full bg-onyx/15" /></div>}
        {/* Profile */}
        <header className={`p-5 border-b border-onyx/10 flex items-start gap-3 sticky ${mobile ? "top-5" : "top-0"} bg-cream z-10`}>
          <div className="size-11 shrink-0 rounded-full bg-onyx/5 grid place-items-center text-sm font-semibold overflow-hidden">
            {contact.photo_url ? <img src={contact.photo_url} alt="" className="size-full object-cover" /> : contactInitials(contact)}
          </div>
          <div className="min-w-0 flex-1">
            <input
              value={name} onChange={(e) => setName(e.target.value)} onBlur={() => saveProfile({ customer_name: name.trim() || null })}
              placeholder="Add a name"
              className="font-display text-2xl bg-transparent w-full outline-none focus:border-b focus:border-gold"
            />
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {contact.source ?? "Manual"}
              {contact.last_contacted_at && ` · last contacted ${new Date(contact.last_contacted_at).toLocaleDateString()}`}
            </p>
          </div>
          <button onClick={() => saveProfile({ favorite: !contact.favorite })} className="p-2 min-h-11 min-w-11 grid place-items-center text-muted-foreground hover:text-gold" aria-label="Star contact">
            <Star className={`size-4 ${contact.favorite ? "text-gold fill-gold" : ""}`} />
          </button>
          <button onClick={onClose} className="p-2 min-h-11 min-w-11 grid place-items-center text-muted-foreground hover:text-onyx" aria-label="Close"><X className="size-5" /></button>
        </header>

        <AnimatePresence>
          {savedFlash && (
            <motion.p
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-[11px] text-gold px-5 pt-2 flex items-center gap-1"
            >
              <Check className="size-3" /> Saved
            </motion.p>
          )}
        </AnimatePresence>

        <div className="p-5 space-y-6 text-sm">
          {/* WhatsApp + quick actions */}
          <section>
            <div className="flex gap-2">
              <motion.button
                whileTap={m.press} disabled={!valid}
                onClick={() => onWhatsApp(
                  { ...contact, customer_name: name.trim() || contact.customer_name, phone, service_slug: service || null },
                  service ? "portfolio" : "availability",
                )}
                className="eyebrow flex-1 min-h-12 px-4 py-3 bg-[#25D366] text-onyx inline-flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <MessageCircle className="size-4" /> WhatsApp
              </motion.button>
              <motion.button whileTap={m.press} onClick={() => { setShare((s) => !s); setMore(false); }}
                aria-expanded={share}
                className="eyebrow px-3 min-h-12 border border-onyx/15 hover:border-gold transition-colors">Share ▾</motion.button>
              <motion.button whileTap={m.press} onClick={() => { setMore((s) => !s); setShare(false); }}
                aria-label="More actions" aria-expanded={more}
                className="px-3 min-h-12 min-w-11 grid place-items-center border border-onyx/15 hover:border-gold transition-colors">
                <MoreHorizontal className="size-4" />
              </motion.button>
            </div>
            <AnimatePresence>
              {share && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  transition={m.popover}
                  className="overflow-hidden mt-2 flex flex-wrap gap-1.5">
                  {services.map((s) => (
                    <button key={s.slug} onClick={() => { setShare(false); onWhatsApp(contact, "portfolio", s); }}
                      className="text-xs px-2.5 py-2 border border-onyx/15 hover:border-gold bg-white transition-colors">{s.name}</button>
                  ))}
                  <button onClick={() => { setShare(false); onWhatsApp(contact, "google"); }}
                    className="text-xs px-2.5 py-2 border border-onyx/15 hover:border-gold bg-white transition-colors">Google profile</button>
                  <button onClick={() => { setShare(false); onWhatsApp(contact, "followup"); }}
                    className="text-xs px-2.5 py-2 border border-onyx/15 hover:border-gold bg-white transition-colors">Follow-up note</button>
                  {comm?.instagram.url && (
                    <button onClick={() => { setShare(false); window.open(comm.instagram.url, "_blank", "noopener,noreferrer"); }}
                      className="text-xs px-2.5 py-2 border border-onyx/15 hover:border-gold bg-white inline-flex items-center gap-1.5 transition-colors">
                      <Instagram className="size-3" /> Instagram
                    </button>
                  )}
                  <button
                    onClick={async () => {
                      const url = comm ? portfolioUrlFor(comm, contact.service_slug) : null;
                      if (!url) return toast.error("Pick a service first so we know which portfolio to copy.");
                      await navigator.clipboard.writeText(url);
                      setShare(false);
                      toast.success("Portfolio link copied");
                    }}
                    className="text-xs px-2.5 py-2 border border-onyx/15 hover:border-gold bg-white inline-flex items-center gap-1.5 transition-colors">
                    <Copy className="size-3" /> Copy portfolio link
                  </button>
                </motion.div>
              )}
              {more && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  transition={m.popover} className="overflow-hidden mt-2 flex flex-wrap gap-1.5">
                  <button
                    onClick={async () => { await navigator.clipboard.writeText(contact.phone ?? ""); setMore(false); toast.success("Number copied"); }}
                    className="text-xs px-2.5 py-2 border border-onyx/15 hover:border-gold bg-white transition-colors">Copy number</button>
                  <button onClick={() => { setMore(false); setShare(false); }}
                    className="text-xs px-2.5 py-2 border border-onyx/15 hover:border-gold bg-white transition-colors">Close menu</button>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <label className="block">
                <span className="eyebrow text-[10px] text-muted-foreground">Mobile</span>
                <input value={phone} onChange={(e) => { setPhone(e.target.value); setDup(null); }} onBlur={savePhone}
                  className="w-full bg-white border border-onyx/15 px-3 py-2 focus:border-gold outline-none" />
              </label>
              <label className="block">
                <span className="eyebrow text-[10px] text-muted-foreground">Interested in</span>
                <select value={service} onChange={(e) => { setService(e.target.value); saveProfile({ service_slug: e.target.value || null }); }}
                  className="w-full bg-white border border-onyx/15 px-3 py-2 focus:border-gold outline-none">
                  <option value="">Not specified</option>
                  {services.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
                </select>
              </label>
            </div>
            {phone.trim() && !valid && <p className="text-xs text-destructive mt-1">This number doesn't look usable for WhatsApp.</p>}
            {dup && (
              <div className="border border-gold/50 bg-gold/5 p-3 mt-2 text-xs">
                <p>Another contact already uses this number: {dup.customer_name ?? dup.phone}</p>
                <button onClick={merge} className="eyebrow mt-2 px-3 py-1.5 border border-onyx/15 hover:border-gold">Merge contacts</button>
              </div>
            )}
          </section>

          {/* Next action */}
          <NextAction
            contactId={contact.id}
            next={next ? { what: next.what, due_on: next.due_on } : null}
            onAdded={() => { qc.invalidateQueries({ queryKey: ["contact-tasks"] }); qc.invalidateQueries({ queryKey: ["due-tasks"] }); qc.invalidateQueries({ queryKey: ["next-actions"] }); }}
          />

          {/* Sticky notes */}
          <section>
            <h3 className="eyebrow text-[10px] text-muted-foreground mb-2">Notes</h3>
            <NoteComposer onAdd={createNote} />
            {notes.isLoading && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {[0, 1].map((i) => <div key={i} className="h-20 bg-onyx/5 animate-pulse" />)}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <AnimatePresence initial={false}>
                {(notes.data ?? []).map((n, i) => (
                  <motion.div
                    key={n.id} layout
                    initial={{ opacity: 0, scale: 0.96, rotate: i % 2 ? 0.6 : -0.6 }}
                    animate={{ opacity: 1, scale: 1, rotate: n.pinned ? 0 : i % 2 ? 0.4 : -0.4 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={m.card}
                    className={`border p-2.5 text-[13px] leading-snug ${
                      n.pinned ? "shadow-[0_6px_14px_-6px_rgba(0,0,0,0.35)] ring-1 ring-gold/40" : "shadow-[0_2px_6px_-2px_rgba(0,0,0,0.2)]"
                    } ${noteSurface(n.color)}`}
                  >
                    {n.pinned && <p className="eyebrow text-[9px] text-onyx/55 mb-1 flex items-center gap-1"><Pin className="size-2.5 fill-current" /> Remember</p>}
                    <textarea
                      defaultValue={n.body} rows={3}
                      onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== n.body) { void updateNote(n.id, { body: v }).then(() => notes.refetch()); } }}
                      className="w-full bg-transparent resize-none outline-none"
                    />
                    <div className="flex items-center justify-between text-[10px] text-onyx/50 pt-1">
                      <span>{new Date(n.created_at).toLocaleDateString()}</span>
                      <span className="flex items-center gap-2">
                        <button onClick={() => togglePin(n)} aria-label={n.pinned ? "Unpin note" : "Pin note"} title="Pin">
                          <Pin className={`size-3.5 ${n.pinned ? "text-gold fill-gold" : ""}`} />
                        </button>
                        <button onClick={() => removeNote(n)} aria-label="Delete note" title="Delete">
                          <Trash2 className="size-3.5 hover:text-destructive" />
                        </button>
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            {!notes.isLoading && (notes.data ?? []).length === 0 && (
              <p className="text-xs text-muted-foreground mt-2">No notes yet — jot down what you remember about them.</p>
            )}
          </section>

          {/* Follow-ups */}
          <section>
            <h3 className="eyebrow text-[10px] text-muted-foreground mb-2">Follow-ups</h3>
            <ul className="space-y-1.5">
              <AnimatePresence initial={false}>
                {(tasks.data ?? []).map((t) => (
                  <motion.li key={t.id} layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 12 }}
                    className="flex items-center gap-2 bg-white border border-onyx/10 px-3 py-2">
                    <motion.button whileTap={{ scale: 0.85 }} onClick={async () => {
                      await completeTask(t.id, !t.done_at);
                      tasks.refetch();
                      qc.invalidateQueries({ queryKey: ["due-tasks"] });
                      qc.invalidateQueries({ queryKey: ["next-actions"] });
                    }}
                      className={`size-4 shrink-0 border grid place-items-center ${t.done_at ? "bg-gold border-gold" : "border-onyx/30"}`} aria-label="Done">
                      {t.done_at && <Check className="size-3 text-onyx" />}
                    </motion.button>
                    <span className={`flex-1 text-[13px] ${t.done_at ? "line-through text-muted-foreground" : ""}`}>{t.what}</span>
                    <span className={`text-[11px] ${!t.done_at && t.due_on < todayISO() ? "text-destructive" : "text-muted-foreground"}`}>{dueLabel(t.due_on)}</span>
                    <button onClick={async () => { await deleteTask(t.id); tasks.refetch(); qc.invalidateQueries({ queryKey: ["due-tasks"] }); }}
                      className="text-muted-foreground hover:text-destructive"><Trash2 className="size-3" /></button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
            {!tasks.isLoading && (tasks.data ?? []).length === 0 && (
              <p className="text-xs text-muted-foreground">Nothing pending.</p>
            )}
          </section>

          {/* History */}
          <section>
            <h3 className="eyebrow text-[10px] text-muted-foreground mb-2">History</h3>
            {history.isLoading ? (
              <p className="text-xs text-muted-foreground">Loading…</p>
            ) : (history.data?.inquiries.length ?? 0) + (history.data?.events.length ?? 0) === 0 ? (
              <p className="text-xs text-muted-foreground">No bookings or enquiries yet.</p>
            ) : (
              <ul className="text-xs space-y-1.5 border-l border-onyx/10 pl-3">
                {history.data?.events.map((e) => (
                  <li key={e.id} className="flex justify-between gap-2">
                    <span className="truncate">{e.title}{e.amount ? ` · ₹${e.amount}` : ""}{e.payment_status ? ` · ${e.payment_status}` : ""}</span>
                    <span className="text-muted-foreground shrink-0">{new Date(`${e.event_date}T00:00:00`).toLocaleDateString()}</span>
                  </li>
                ))}
                {history.data?.inquiries.map((i) => (
                  <li key={i.id} className="flex justify-between gap-2">
                    <span className="truncate">Enquiry · {i.category_label || i.service_type || "General"} · {i.status}</span>
                    <span className="text-muted-foreground shrink-0">{new Date(i.created_at).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <button
            onClick={async () => {
              if (!confirm("Remove this contact? Bookings, enquiries and history are kept.")) return;
              await softDeleteContact(contact.id);
              toast.success("Contact removed");
              onChanged();
              onClose();
            }}
            className="text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-1"
          >
            <Trash2 className="size-3" /> Remove contact
          </button>
        </div>
      </motion.aside>
    </div>
  );
}

/* -------------------- Next action -------------------- */

export function NextAction({ contactId, next, onAdded }: {
  contactId: string;
  next: { what: string; due_on: string } | null;
  onAdded: () => void;
}) {
  const [what, setWhat] = useState("");
  const [saving, setSaving] = useState(false);

  async function create(due: string) {
    setSaving(true);
    try {
      await addTask(contactId, what || "Follow up", due);
      setWhat("");
      onAdded();
      toast.success("Follow-up set");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not set follow-up");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <h3 className="eyebrow text-[10px] text-muted-foreground mb-2">Next action</h3>
      {next ? (
        <p className="bg-white border border-onyx/10 px-3 py-2 text-[13px] mb-2">
          {next.what} <span className="text-muted-foreground">· {dueLabel(next.due_on)}</span>
        </p>
      ) : (
        <p className="text-xs text-muted-foreground mb-2">No next action set.</p>
      )}
      <input
        value={what} onChange={(e) => setWhat(e.target.value)} placeholder="What next? e.g. Send birthday shoot prices"
        className="w-full bg-white border border-onyx/15 px-3 py-2 text-[13px] focus:border-gold outline-none"
      />
      <div className="flex gap-1.5 mt-2 flex-wrap">
        {[["Today", todayISO()], ["Tomorrow", addDaysISO(1)], ["In 3 days", addDaysISO(3)], ["Next week", addDaysISO(7)]].map(([label, due]) => (
          <motion.button key={label} whileTap={{ scale: 0.95 }} disabled={saving} onClick={() => create(due)}
            className="text-xs px-2.5 py-1.5 border border-onyx/15 bg-white hover:border-gold disabled:opacity-50">{label}</motion.button>
        ))}
      </div>
    </section>
  );
}

/* -------------------- Note composer -------------------- */

function NoteComposer({ onAdd }: { onAdd: (body: string, color: string) => Promise<void> }) {
  const [body, setBody] = useState("");
  const [color, setColor] = useState<string>(NOTE_COLORS[0]);

  async function submit() {
    const v = body.trim();
    if (!v) return;
    setBody("");
    await onAdd(v, color);
  }

  return (
    <div className={`border p-2.5 ${noteSurface(color)}`}>
      <textarea
        value={body} onChange={(e) => setBody(e.target.value)} rows={2}
        onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void submit(); }}
        placeholder="Interested in birthday shoot…"
        className="w-full bg-transparent resize-none outline-none text-[13px]"
      />
      <div className="flex items-center justify-between pt-1">
        <div className="flex gap-1">
          {NOTE_COLORS.map((c) => (
            <button key={c} onClick={() => setColor(c)} aria-label={c}
              className={`size-4 border ${noteSurface(c)} ${color === c ? "ring-1 ring-onyx/40" : ""}`} />
          ))}
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={submit}
          className="eyebrow text-[10px] px-2.5 py-1 bg-onyx text-cream hover:bg-gold hover:text-onyx">Add note</motion.button>
      </div>
    </div>
  );
}
