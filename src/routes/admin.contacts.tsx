import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MessageCircle, Plus, X, Star, StickyNote, Clock, Search } from "lucide-react";
import { categoriesQuery } from "@/lib/queries";
import {
  DEFAULT_GOOGLE_PROFILE_URL, googleProfileUrlQuery, customerWhatsAppLink,
  buildCustomerWhatsAppMessage, normalizePhone,
} from "@/lib/customer-directory";
import {
  fetchContactsPage, fetchContactStats, contactsQueryKey, findByPhone, createContact,
  updateContact, markContacted, bulkSetService, contactInitials, parseQuickAdd,
  CONTACT_PAGE_SIZE, type Contact,
} from "@/lib/contacts";
import {
  addDaysISO, addTask, dueLabel, fetchNextActions, fetchNoteCounts, todayISO,
} from "@/lib/contact-workspace";
import { communicationQuery, templatesQuery, buildMessage } from "@/lib/studio-settings";
import { useMotionPrefs } from "@/lib/motion";
import { GoogleContactsPanel } from "@/components/admin/google-contacts-panel";
import { ContactDrawer, type WaKind } from "@/components/admin/contact-drawer";

export const Route = createFileRoute("/admin/contacts")({
  head: () => ({ meta: [{ title: "Contacts — Rajmoti Studio" }] }),
  component: AdminContacts,
});

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const spring = { type: "spring" as const, stiffness: 400, damping: 32 };

/** Highlight the part of a label that matched the search. */
function Highlight({ text, term }: { text: string; term: string }) {
  const q = term.trim();
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-gold/30 text-onyx">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

function AdminContacts() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [letter, setLetter] = useState<string | null>(null);
  const [unclassifiedOnly, setUnclassifiedOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [adding, setAdding] = useState(false);
  const [detail, setDetail] = useState<Contact | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [classify, setClassify] = useState(false);
  const [dragging, setDragging] = useState<Contact | null>(null);
  const [dropHot, setDropHot] = useState(false);
  const [followUpFor, setFollowUpFor] = useState<Contact | null>(null);

  const filter = { search, letter, unclassifiedOnly };
  const m = useMotionPrefs();
  const searchRef = useRef<HTMLInputElement>(null);
  const { data: categories = [] } = useQuery(categoriesQuery);
  const { data: googleUrl = DEFAULT_GOOGLE_PROFILE_URL } = useQuery(googleProfileUrlQuery);
  const { data: comm } = useQuery(communicationQuery);
  const { data: templates } = useQuery(templatesQuery);
  const services = useMemo(
    () => (categories as any[]).map((c) => ({ slug: c.slug as string, name: c.name as string })),
    [categories],
  );
  const serviceName = (slug?: string | null) => services.find((s) => s.slug === slug)?.name ?? null;

  const list = useQuery({
    queryKey: [...contactsQueryKey(filter), page],
    queryFn: () => fetchContactsPage(filter, page),
    placeholderData: (prev) => prev,
  });
  const stats = useQuery({ queryKey: ["contact-stats"], queryFn: fetchContactStats });

  const rows = list.data?.rows ?? [];
  const total = list.data?.total ?? 0;
  const ids = rows.map((r) => r.id);

  const nextActions = useQuery({ queryKey: ["next-actions", ids], queryFn: () => fetchNextActions(ids), enabled: ids.length > 0 });
  const noteCounts = useQuery({ queryKey: ["note-counts", ids], queryFn: () => fetchNoteCounts(ids), enabled: ids.length > 0 });

  /* Keyboard: "/" focuses search, "n" adds a contact, Esc closes overlays. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = !!el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
      if (e.key === "Escape") {
        setDetail(null); setFollowUpFor(null); setAdding(false);
        return;
      }
      if (typing) return;
      if (e.key === "/") { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key.toLowerCase() === "n" && !e.metaKey && !e.ctrlKey) { e.preventDefault(); setAdding(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function refresh() {
    qc.invalidateQueries({ queryKey: ["contacts"] });
    qc.invalidateQueries({ queryKey: ["contact-stats"] });
    qc.invalidateQueries({ queryKey: ["next-actions"] });
    qc.invalidateQueries({ queryKey: ["due-tasks"] });
  }

  function openWhatsApp(c: Contact, kind: WaKind, svc?: { slug: string; name: string }) {
    try {
      const body = comm && templates
        ? buildMessage({
            comm, templates, kind,
            customerName: c.customer_name,
            serviceSlug: svc?.slug ?? c.service_slug,
            serviceName: svc?.name ?? serviceName(c.service_slug),
          })
        : buildCustomerWhatsAppMessage({
            name: c.customer_name,
            serviceName: svc?.name ?? serviceName(c.service_slug),
            serviceSlug: svc?.slug ?? c.service_slug,
            googleUrl,
            kind,
          });
      const href = customerWhatsAppLink(c.phone, body);
      if (!href) {
        toast.error(`We can't message ${c.customer_name?.trim() || "this contact"} — the mobile number looks incomplete.`);
        return;
      }

      void markContacted(c.id);
      // Admin runs inside an embedded preview where new-tab popups may be
      // silently blocked. Same-tab navigation works reliably in preview,
      // installed mobile browsers, and the published site.
      window.location.assign(href);
    } catch {
      toast.error("WhatsApp could not be opened. Please try again.");
    }
  }

  async function applyBulkService(slug: string) {
    const withService = rows.filter((r) => selected.includes(r.id) && r.service_slug);
    if (withService.length && !confirm(`${withService.length} of these already have a service. Overwrite?`)) return;
    await bulkSetService(selected, slug || null);
    toast.success(`${selected.length} contacts updated`);
    setSelected([]);
    refresh();
  }

  async function quickFollowUp(c: Contact, what: string, due: string) {
    // Optimistic: the card badge updates before the database replies.
    setFollowUpFor(null);
    qc.setQueriesData({ queryKey: ["next-actions"] }, (old: any) =>
      old ? { ...old, [c.id]: { what: what || "Follow up", due_on: due } } : old);
    toast.success(`Follow-up set · ${dueLabel(due)}`);
    try {
      await addTask(c.id, what, due);
    } catch (e: any) {
      toast.error("That follow-up didn't save. Please try again.");
    } finally {
      qc.invalidateQueries({ queryKey: ["next-actions"] });
      qc.invalidateQueries({ queryKey: ["due-tasks"] });
    }
  }

  return (
    <div>
      <header className="mb-6">
        <p className="eyebrow text-gold mb-2">Contacts</p>
        <h1 className="font-display text-4xl">Contact book</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Find someone, remember what matters, and message them. Drag a card onto <em>Follow up</em> — or tap the clock on mobile.
        </p>
      </header>

      <div className="mb-4"><GoogleContactsPanel /></div>

      {stats.data && (
        <p className="text-xs text-muted-foreground mb-4">
          {stats.data.total} contacts · {stats.data.withMobile} with mobile · {stats.data.fromGoogle} from Google ·{" "}
          <button className="underline hover:text-onyx" onClick={() => { setUnclassifiedOnly(true); setPage(0); }}>
            {stats.data.unclassified} unclassified
          </button>
        </p>
      )}

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search name or mobile…"
            aria-label="Search contacts"
            className="bg-white border border-onyx/15 pl-9 pr-12 py-2 text-sm w-full focus:border-gold outline-none transition-colors"
          />
          <kbd className="hidden sm:block absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground border border-onyx/15 px-1.5 py-0.5">/</kbd>
        </div>
        <motion.button whileTap={m.press} onClick={() => setAdding(true)}
          className="eyebrow px-4 py-2 bg-onyx text-cream hover:bg-gold hover:text-onyx inline-flex items-center gap-2 transition-colors min-h-11">
          <Plus className="size-3" /> Add contact
        </motion.button>
        {(unclassifiedOnly || letter) && (
          <button onClick={() => { setUnclassifiedOnly(false); setLetter(null); setPage(0); }} className="eyebrow px-3 py-2 border border-onyx/15 hover:border-gold">
            Clear filter
          </button>
        )}
        {unclassifiedOnly && rows.length > 0 && (
          <button onClick={() => setClassify(true)} className="eyebrow px-3 py-2 border border-onyx/15 hover:border-gold">
            Classify quickly
          </button>
        )}
      </div>

      <div className="flex gap-1 flex-wrap mb-4 text-[11px] text-muted-foreground">
        {LETTERS.map((l) => (
          <button key={l} onClick={() => { setLetter(letter === l ? null : l); setPage(0); }}
            className={`px-1.5 py-0.5 ${letter === l ? "bg-onyx text-cream" : "hover:text-onyx"}`}>{l}</button>
        ))}
      </div>

      {selected.length > 0 && (
        <div className="bg-white border border-onyx/10 px-4 py-2 mb-3 flex items-center gap-3 text-sm flex-wrap">
          <span>{selected.length} selected</span>
          <select defaultValue="" onChange={(e) => e.target.value && applyBulkService(e.target.value)}
            className="bg-white border border-onyx/15 px-2 py-1 text-sm">
            <option value="">Set service →</option>
            {services.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
          </select>
          <button className="text-xs underline" onClick={() => setSelected([])}>Clear</button>
        </div>
      )}

      {/* Follow-up drop area (desktop drag target) */}
      <motion.div
        onDragOver={(e) => { e.preventDefault(); setDropHot(true); }}
        onDragLeave={() => setDropHot(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDropHot(false);
          if (dragging) setFollowUpFor(dragging);
          setDragging(null);
        }}
        animate={dropHot ? { scale: 1.01, borderColor: "rgba(201,168,76,0.9)" } : { scale: 1, borderColor: "rgba(0,0,0,0.12)" }}
        transition={spring}
        className={`hidden md:flex items-center justify-center gap-2 border border-dashed px-4 py-3 mb-4 text-xs ${dropHot ? "bg-gold/10 text-onyx" : "text-muted-foreground"}`}
      >
        <Clock className="size-3.5" />
        {dropHot ? "Drop to set a follow-up" : "Drag a contact here to follow up"}
      </motion.div>

      {list.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Loading contacts">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-onyx/10 p-4">
              <div className="flex items-start gap-3">
                <div className="size-10 shrink-0 rounded-full bg-onyx/5 animate-pulse" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3.5 w-2/3 bg-onyx/5 animate-pulse" />
                  <div className="h-3 w-1/2 bg-onyx/5 animate-pulse" />
                </div>
              </div>
              <div className="h-9 mt-4 bg-onyx/5 animate-pulse" />
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="border border-dashed border-onyx/15 p-12 text-center">
          <p className="text-sm text-muted-foreground">
            {search ? `No contacts found for “${search}”.` : "No contacts yet. Save a number to start."}
          </p>
          <motion.button whileTap={m.press} onClick={() => setAdding(true)}
            className="eyebrow mt-4 px-4 py-2.5 bg-onyx text-cream hover:bg-gold hover:text-onyx inline-flex items-center gap-2 transition-colors">
            <Plus className="size-3" /> Add contact
          </motion.button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((c) => {
            const valid = normalizePhone(c.phone).ok;
            const next = nextActions.data?.[c.id];
            const notes = noteCounts.data?.[c.id] ?? 0;
            return (
              <motion.article
                key={c.id}
                layout
                draggable
                onDragStart={() => setDragging(c)}
                onDragEnd={() => setDragging(null)}
                whileHover={m.reduced ? undefined : { y: -2, boxShadow: "0 14px 28px -18px rgba(0,0,0,0.45)" }}
                animate={dragging?.id === c.id ? { scale: 1.02, opacity: 0.85 } : { scale: 1, opacity: 1 }}
                transition={m.card}
                className="bg-white border border-onyx/10 p-4 flex flex-col gap-3 cursor-grab active:cursor-grabbing"
              >
                <div className="flex items-start gap-3">
                  <input type="checkbox" aria-label="Select contact" className="hidden sm:block mt-1.5" checked={selected.includes(c.id)}
                    onChange={(e) => setSelected((s) => e.target.checked ? [...s, c.id] : s.filter((x) => x !== c.id))} />
                  <div className="size-10 shrink-0 rounded-full bg-onyx/5 grid place-items-center text-xs font-semibold overflow-hidden">
                    {c.photo_url
                      ? <img src={c.photo_url} alt="" loading="lazy" className="size-full object-cover" />
                      : contactInitials(c)}
                  </div>
                  <button onClick={() => setDetail(c)} className="text-left flex-1 min-w-0 outline-none focus-visible:ring-1 focus-visible:ring-gold">
                    <p className="font-semibold truncate">
                      <Highlight text={c.customer_name?.trim() || c.phone || "Unnamed"} term={search} />
                      {c.favorite && <Star className="inline size-3 ml-1 text-gold fill-gold" />}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      <Highlight text={c.phone || "No mobile number"} term={search} /> · {serviceName(c.service_slug) ?? "Not specified"}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] min-h-4">
                      {next && (
                        <span className={next.due_on < todayISO() ? "text-destructive" : "text-gold"}>
                          {next.what} · {dueLabel(next.due_on)}
                        </span>
                      )}
                      {notes > 0 && (
                        <span className="text-muted-foreground inline-flex items-center gap-1"><StickyNote className="size-3" />{notes}</span>
                      )}
                    </div>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button whileTap={m.press} disabled={!valid}
                    onClick={() => valid ? openWhatsApp(c, c.service_slug ? "portfolio" : "availability") : undefined}
                    className="eyebrow flex-1 min-h-11 px-3 py-2 bg-[#25D366] text-onyx inline-flex items-center justify-center gap-2 disabled:opacity-40 transition-opacity">
                    <MessageCircle className="size-3.5" /> WhatsApp
                  </motion.button>
                  <motion.button whileTap={m.press} onClick={() => setFollowUpFor(c)} aria-label="Set a follow-up"
                    className="min-h-11 min-w-11 grid place-items-center border border-onyx/15 hover:border-gold transition-colors" title="Set a follow-up">
                    <Clock className="size-4" />
                  </motion.button>
                  <button onClick={() => setDetail(c)} className="eyebrow min-h-11 px-3 py-2 border border-onyx/15 hover:border-gold text-xs transition-colors">Open</button>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}

      {total > CONTACT_PAGE_SIZE && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}
            className="eyebrow px-3 py-2 border border-onyx/15 disabled:opacity-40">Previous</button>
          <span className="text-xs text-muted-foreground">
            {page * CONTACT_PAGE_SIZE + 1}–{Math.min((page + 1) * CONTACT_PAGE_SIZE, total)} of {total}
          </span>
          <button disabled={(page + 1) * CONTACT_PAGE_SIZE >= total} onClick={() => setPage((p) => p + 1)}
            className="eyebrow px-3 py-2 border border-onyx/15 disabled:opacity-40">Next</button>
        </div>
      )}

      <AnimatePresence>
        {followUpFor && (
          <FollowUpSheet
            key="followup"
            contact={followUpFor}
            onClose={() => setFollowUpFor(null)}
            onSet={(what, due) => quickFollowUp(followUpFor, what, due)}
          />
        )}
      </AnimatePresence>

      {adding && (
        <AddContactDialog services={services} onClose={() => setAdding(false)}
          onSaved={(c, whatsapp) => { refresh(); setAdding(false); if (whatsapp) openWhatsApp(c, c.service_slug ? "portfolio" : "availability"); }} />
      )}

      <AnimatePresence>
        {detail && (
          <ContactDrawer
            key={detail.id}
            contact={detail}
            services={services}
            onClose={() => setDetail(null)}
            onChanged={refresh}
            onWhatsApp={openWhatsApp}
          />
        )}
      </AnimatePresence>

      {classify && (
        <ClassifyDialog rows={rows.filter((r) => !r.service_slug)} services={services}
          onClose={() => { setClassify(false); refresh(); }} />
      )}
    </div>
  );
}

/* -------------------- Quick follow-up sheet -------------------- */

function FollowUpSheet({ contact, onClose, onSet }: {
  contact: Contact;
  onClose: () => void;
  onSet: (what: string, due: string) => void;
}) {
  const [what, setWhat] = useState("");
  return (
    <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center p-0 sm:p-4">
      <motion.div className="absolute inset-0 bg-onyx/45" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        initial={{ y: 40, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 30, opacity: 0 }}
        transition={spring}
        className="relative bg-cream w-full sm:max-w-sm border border-onyx/10 p-5"
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="eyebrow text-[10px] text-muted-foreground">Follow up with</p>
            <h2 className="font-display text-xl">{contact.customer_name?.trim() || contact.phone}</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-onyx"><X className="size-5" /></button>
        </div>
        <input
          autoFocus value={what} onChange={(e) => setWhat(e.target.value)}
          placeholder="What? e.g. Share birthday shoot prices"
          className="w-full bg-white border border-onyx/15 px-3 py-2 text-sm focus:border-gold outline-none"
        />
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {[["Today", todayISO()], ["Tomorrow", addDaysISO(1)], ["In 3 days", addDaysISO(3)], ["Next week", addDaysISO(7)]].map(([label, due]) => (
            <motion.button key={label} whileTap={{ scale: 0.95 }} onClick={() => onSet(what || "Follow up", due)}
              className="text-xs px-3 py-2 border border-onyx/15 bg-white hover:border-gold">{label}</motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/* -------------------- Add contact -------------------- */

function AddContactDialog({ services, onClose, onSaved }: {
  services: { slug: string; name: string }[];
  onClose: () => void;
  onSaved: (c: Contact, whatsapp: boolean) => void;
}) {
  const [quick, setQuick] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState("");
  const [saving, setSaving] = useState(false);
  const [dup, setDup] = useState<Contact | null>(null);

  const parsed = normalizePhone(phone);

  function applyQuick(v: string) {
    setQuick(v);
    const p = parseQuickAdd(v, services);
    if (!p) return;
    setName(p.name);
    setPhone(p.phone);
    if (p.service) setService(p.service);
  }

  async function save(whatsapp: boolean) {
    if (!phone.trim()) return toast.error("Mobile number is required");
    if (!parsed.ok) return toast.error(parsed.reason ?? "Number looks invalid");
    setSaving(true);
    try {
      const existing = await findByPhone(phone);
      if (existing) { setDup(existing); return; }
      const created = await createContact({ name, phone, service_slug: service || null });
      toast.success("Contact saved");
      onSaved(created, whatsapp);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save contact");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-onyx/60 grid place-items-center p-4" onClick={onClose}>
      <motion.div initial={{ y: 12, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={spring}
        className="bg-cream w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-onyx/10 flex items-center justify-between">
          <h2 className="font-display text-xl">Add contact</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-onyx"><X className="size-5" /></button>
        </div>
        <div className="p-5 space-y-4 text-sm">
          <div>
            <label className="eyebrow text-[10px] text-muted-foreground block mb-1">Quick add (optional)</label>
            <input value={quick} onChange={(e) => applyQuick(e.target.value)} placeholder="Priya 9876543210 baby"
              className="w-full bg-white border border-onyx/15 px-3 py-2 focus:border-gold outline-none" />
          </div>
          <div>
            <label className="eyebrow text-[10px] text-muted-foreground block mb-1">Name (optional)</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-full bg-white border border-onyx/15 px-3 py-2 focus:border-gold outline-none" />
          </div>
          <div>
            <label className="eyebrow text-[10px] text-muted-foreground block mb-1">WhatsApp number *</label>
            <input value={phone} onChange={(e) => { setPhone(e.target.value); setDup(null); }} placeholder="9876543210"
              className="w-full bg-white border border-onyx/15 px-3 py-2 focus:border-gold outline-none" />
            {phone.trim() && !parsed.ok && <p className="text-xs text-destructive mt-1">{parsed.reason}</p>}
          </div>
          <div>
            <label className="eyebrow text-[10px] text-muted-foreground block mb-1">Interested in</label>
            <select value={service} onChange={(e) => setService(e.target.value)}
              className="w-full bg-white border border-onyx/15 px-3 py-2 focus:border-gold outline-none">
              <option value="">Not specified</option>
              {services.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
            </select>
          </div>
          {dup && (
            <div className="border border-gold/50 bg-gold/5 p-3">
              <p className="font-semibold">Existing contact found</p>
              <p className="text-xs text-muted-foreground">
                {dup.customer_name?.trim() || "Unnamed"} · {dup.phone}
              </p>
              <button className="eyebrow mt-2 px-3 py-1.5 border border-onyx/15 hover:border-gold"
                onClick={() => onSaved(dup, true)}>Open & WhatsApp instead</button>
            </div>
          )}
        </div>
        <div className="p-5 border-t border-onyx/10 flex justify-end gap-2">
          <button onClick={onClose} className="eyebrow px-4 py-2 border border-onyx/15 hover:border-gold">Cancel</button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => save(false)} disabled={saving}
            className="eyebrow px-4 py-2 border border-onyx/15 hover:border-gold disabled:opacity-50">Save</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => save(true)} disabled={saving}
            className="eyebrow px-5 py-2 bg-[#25D366] text-onyx hover:opacity-90 disabled:opacity-50">
            {saving ? "Saving…" : "Save & WhatsApp"}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

/* -------------------- Fast classification -------------------- */

function ClassifyDialog({ rows, services, onClose }: {
  rows: Contact[];
  services: { slug: string; name: string }[];
  onClose: () => void;
}) {
  const [i, setI] = useState(0);
  const current = rows[i];

  async function set(slug: string | null) {
    if (current && slug) await updateContact(current.id, { service_slug: slug });
    if (i + 1 >= rows.length) onClose();
    else setI(i + 1);
  }

  return (
    <div className="fixed inset-0 z-50 bg-onyx/60 grid place-items-center p-4" onClick={onClose}>
      <div className="bg-cream w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-onyx/10 flex items-center justify-between">
          <h2 className="font-display text-xl">Unclassified contacts</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-onyx"><X className="size-5" /></button>
        </div>
        <div className="p-6 text-center">
          {current ? (
            <AnimatePresence mode="wait">
              <motion.div key={current.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={spring}>
                <p className="font-display text-2xl">{current.customer_name?.trim() || current.phone}</p>
                <p className="text-xs text-muted-foreground mb-5">{current.phone ?? "No mobile number"} · {i + 1} of {rows.length}</p>
                <p className="text-sm mb-3">What are they interested in?</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {services.map((s) => (
                    <motion.button whileTap={{ scale: 0.95 }} key={s.slug} onClick={() => set(s.slug)}
                      className="eyebrow px-3 py-2 border border-onyx/15 hover:border-gold">{s.name}</motion.button>
                  ))}
                  <button onClick={() => set(null)} className="eyebrow px-3 py-2 border border-onyx/15 text-muted-foreground hover:border-gold">Skip</button>
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <p className="text-sm text-muted-foreground">All done.</p>
          )}
        </div>
      </div>
    </div>
  );
}
