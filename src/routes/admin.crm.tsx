import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Send, Check, Clock, User, Calendar as CalIcon, Sparkles, MessageCircle, Tag, X, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { inquiriesQuery, categoriesQuery } from "@/lib/queries";
import {
  DEFAULT_GOOGLE_PROFILE_URL, googleProfileUrlQuery, customerWhatsAppLink,
  buildCustomerWhatsAppMessage, normalizePhone, phoneKey,
} from "@/lib/customer-directory";
import { whatsappLink, formatPrice, SITE } from "@/lib/site";
import {
  customersQuery, customerDatesQuery, milestoneConfigsQuery,
  reminderOffersQuery, messageTemplatesQuery, remindersQuery,
  computeUpcomingMilestones, generateReminderMessage, pickTemplate,
  type Customer, type CustomerDate, type MilestoneConfig,
  type ReminderOffer, type MessageTemplate, type UpcomingMilestone,
} from "@/lib/crm";

export const Route = createFileRoute("/admin/crm")({
  head: () => ({ meta: [{ title: "Customers — Rajmoti Studio" }] }),
  component: AdminCRM,
});

const TABS = ["Reminders", "Milestones", "Offers", "Templates"] as const;
type Tab = typeof TABS[number];

const tbl = (name: string) => supabase.from(name as any);

function AdminCRM() {
  const [tab, setTab] = useState<Tab>("Reminders");
  return (
    <div>
      <header className="mb-8">
        <p className="eyebrow text-gold mb-2">Secondary</p>
        <h1 className="font-display text-4xl">Reminders &amp; offers</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
          Milestone reminders, offers and message templates. Day-to-day contact work lives in Contacts.
        </p>
      </header>
      <div className="border-b border-onyx/10 mb-8 -mx-6 md:-mx-10 px-6 md:px-10 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-3 text-xs uppercase tracking-widest whitespace-nowrap border-b-2 -mb-px transition-colors ${
                tab === t ? "border-gold text-onyx font-semibold" : "border-transparent text-muted-foreground hover:text-onyx"
              }`}>
              {t}
            </button>
          ))}
        </div>
      </div>
      {tab === "Reminders" && <RemindersTab />}
      {tab === "Milestones" && <MilestonesTab />}
      {tab === "Offers" && <OffersTab />}
      {tab === "Templates" && <TemplatesTab />}
    </div>
  );
}

/* -------------------- Reminders -------------------- */

function RemindersTab() {
  const { data: customers = [] } = useQuery(customersQuery);
  const { data: milestones = [] } = useQuery(milestoneConfigsQuery);
  const { data: custDates = [] } = useQuery(customerDatesQuery);
  const { data: offers = [] } = useQuery(reminderOffersQuery);
  const { data: templates = [] } = useQuery(messageTemplatesQuery);
  const { data: reminders = [] } = useQuery(remindersQuery);
  const qc = useQueryClient();

  const [composing, setComposing] = useState<UpcomingMilestone | null>(null);
  const [filter, setFilter] = useState<"upcoming" | "all" | "sent">("upcoming");

  const upcoming = useMemo(
    () => computeUpcomingMilestones(customers, milestones, custDates, 60),
    [customers, milestones, custDates],
  );

  const activeOffer = offers.find((o) => o.active) ?? null;

  const sentMap = useMemo(() => {
    const m = new Map<string, typeof reminders[number]>();
    for (const r of reminders) m.set(`${r.customer_id}|${r.kind}|${r.label}|${r.milestone_date}`, r);
    return m;
  }, [reminders]);

  function rowKey(u: UpcomingMilestone) {
    return `${u.customer.id}|${u.kind}|${u.label}|${u.milestone_date}`;
  }

  const filtered = upcoming.filter((u) => {
    const r = sentMap.get(rowKey(u));
    if (filter === "sent") return r?.status === "sent";
    if (filter === "upcoming") return !r || (r.status !== "sent" && r.status !== "dismissed");
    return true;
  });

  async function markSent(u: UpcomingMilestone) {
    const { error } = await tbl("reminders").upsert({
      customer_id: u.customer.id, kind: u.kind, label: u.label,
      milestone_date: u.milestone_date, remind_on: u.remind_on,
      status: "sent", sent_at: new Date().toISOString(),
    }, { onConflict: "customer_id,kind,label,milestone_date" });
    if (error) return toast.error(error.message);
    toast.success("Marked as sent");
    qc.invalidateQueries({ queryKey: ["reminders"] });
  }

  async function snooze(u: UpcomingMilestone, days: number) {
    const snoozeUntil = new Date(); snoozeUntil.setDate(snoozeUntil.getDate() + days);
    const { error } = await tbl("reminders").upsert({
      customer_id: u.customer.id, kind: u.kind, label: u.label,
      milestone_date: u.milestone_date, remind_on: u.remind_on,
      status: "snoozed", snoozed_until: snoozeUntil.toISOString().slice(0, 10),
    }, { onConflict: "customer_id,kind,label,milestone_date" });
    if (error) return toast.error(error.message);
    toast.success(`Snoozed ${days} days`);
    qc.invalidateQueries({ queryKey: ["reminders"] });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex gap-2">
          {(["upcoming", "sent", "all"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`eyebrow px-3 py-1.5 border ${filter === f ? "bg-onyx text-cream border-onyx" : "border-onyx/15 hover:border-gold"}`}>
              {f}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} milestones in the next 60 days · reminders trigger 7 days before
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="border border-dashed border-onyx/15 p-12 text-center">
          <Sparkles className="size-6 text-gold mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No upcoming milestones. Add customers with baby birth dates to see reminders here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((u) => {
            const r = sentMap.get(rowKey(u));
            return (
              <div key={rowKey(u)} className="bg-white border border-onyx/10 p-5 grid md:grid-cols-[1fr_auto] gap-4 items-center">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-display text-xl">{u.customer.baby_name || u.customer.customer_name}</span>
                    <span className="eyebrow text-gold">{u.label}</span>
                    {r?.status === "sent" && <span className="eyebrow text-emerald-700 bg-emerald-50 px-2 py-0.5">Sent</span>}
                    {r?.status === "snoozed" && <span className="eyebrow text-amber-700 bg-amber-50 px-2 py-0.5">Snoozed</span>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {u.customer.customer_name} · {u.customer.phone ?? "no phone"} ·
                    Milestone {new Date(u.milestone_date + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })} ·
                    <span className={u.days_remaining <= 7 ? "text-gold font-semibold ml-1" : "ml-1"}>{u.days_remaining} days away</span>
                  </p>
                  {activeOffer && <p className="text-xs text-muted-foreground mt-1">🎁 {activeOffer.label}</p>}
                </div>
                <div className="flex flex-wrap gap-2 justify-end">
                  <button onClick={() => setComposing(u)}
                    className="eyebrow px-3 py-1.5 bg-gold text-onyx hover:bg-gold/80 inline-flex items-center gap-1.5">
                    <MessageCircle className="size-3" /> WhatsApp
                  </button>
                  <button onClick={() => markSent(u)}
                    className="eyebrow px-3 py-1.5 border border-onyx/15 hover:border-gold inline-flex items-center gap-1.5">
                    <Check className="size-3" /> Mark sent
                  </button>
                  <button onClick={() => snooze(u, 7)}
                    className="eyebrow px-3 py-1.5 border border-onyx/15 hover:border-gold inline-flex items-center gap-1.5">
                    <Clock className="size-3" /> Snooze 7d
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {composing && (
        <ComposeDialog
          milestone={composing}
          offer={activeOffer}
          templates={templates}
          onClose={() => setComposing(null)}
          onSent={() => { markSent(composing); setComposing(null); }}
        />
      )}
    </div>
  );
}

function ComposeDialog({ milestone, offer, templates, onClose, onSent }: {
  milestone: UpcomingMilestone; offer: ReminderOffer | null;
  templates: MessageTemplate[]; onClose: () => void; onSent: () => void;
}) {
  const [tpl, setTpl] = useState(() => pickTemplate(templates));
  const [msg, setMsg] = useState(() => generateReminderMessage({
    customer: milestone.customer, milestoneLabel: milestone.label,
    kind: milestone.kind, template: pickTemplate(templates), offer,
  }));

  function regenerate() {
    const t = pickTemplate(templates);
    setTpl(t);
    setMsg(generateReminderMessage({
      customer: milestone.customer, milestoneLabel: milestone.label,
      kind: milestone.kind, template: t, offer,
    }));
  }

  const phone = milestone.customer.phone;
  const wa = phone ? whatsappLink(msg, phone) : null;

  return (
    <div className="fixed inset-0 z-50 bg-onyx/60 grid place-items-center p-4" onClick={onClose}>
      <div className="bg-cream max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-onyx/10 flex items-center justify-between">
          <div>
            <p className="eyebrow text-gold">{milestone.label}</p>
            <h2 className="font-display text-2xl">Message {milestone.customer.customer_name}</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-onyx"><X className="size-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">Template: {tpl ? "✓" : "none active"}</p>
            <button onClick={regenerate} className="eyebrow text-gold">Regenerate ↻</button>
          </div>
          <textarea value={msg} onChange={(e) => setMsg(e.target.value)}
            rows={14}
            className="w-full bg-white border border-onyx/15 p-4 text-sm font-sans leading-relaxed focus:border-gold outline-none" />
          {!phone && <p className="text-xs text-destructive">No phone on file for this customer.</p>}
          {!milestone.customer.whatsapp_consent && phone && (
            <p className="text-xs text-amber-700">⚠️ Customer has not opted in to promotional WhatsApp. Send with care.</p>
          )}
          <div className="flex flex-wrap gap-2 justify-end pt-2 border-t border-onyx/10">
            <button onClick={onClose} className="eyebrow px-4 py-2 border border-onyx/15 hover:border-gold">Cancel</button>
            {wa ? (
              <a href={wa} target="_blank" rel="noreferrer" onClick={onSent}
                className="eyebrow px-4 py-2 bg-gold text-onyx hover:bg-gold/80 inline-flex items-center gap-2">
                <Send className="size-3" /> Send via WhatsApp
              </a>
            ) : (
              <button disabled className="eyebrow px-4 py-2 bg-onyx/20 text-onyx/50">No phone</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------- Customers -------------------- */

function CustomersTab() {
  const { data: customers = [] } = useQuery(customersQuery);
  const { data: categories = [] } = useQuery(categoriesQuery);
  const { data: googleUrl = DEFAULT_GOOGLE_PROFILE_URL } = useQuery(googleProfileUrlQuery);
  const qc = useQueryClient();
  const [quick, setQuick] = useState<Customer | "new" | null>(null);
  const [full, setFull] = useState<Customer | null>(null);
  const [q, setQ] = useState("");
  const [menu, setMenu] = useState<string | null>(null);

  const services = useMemo(
    () => (categories as any[]).map((c) => ({ slug: c.slug as string, name: c.name as string })),
    [categories],
  );
  const serviceName = (slug?: string | null) => services.find((s) => s.slug === slug)?.name ?? null;

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return customers;
    const digits = term.replace(/\D/g, "");
    return customers.filter((c) => {
      const name = (c.customer_name ?? "").toLowerCase();
      const phone = (c.phone ?? "").replace(/\D/g, "");
      return name.includes(term) || (digits.length > 0 && phone.includes(digits));
    });
  }, [customers, q]);

  function waLink(c: Customer, kind: "portfolio" | "google" | "followup" | "availability") {
    const slug = (c as any).service_slug as string | null;
    return customerWhatsAppLink(
      c.phone,
      buildCustomerWhatsAppMessage({
        name: c.customer_name,
        serviceName: serviceName(slug),
        serviceSlug: slug,
        googleUrl,
        kind,
      }),
    );
  }

  async function del(id: string) {
    if (!confirm("Remove this customer? Linked bookings are kept.")) return;
    const { error } = await tbl("customers").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Customer removed");
    qc.invalidateQueries({ queryKey: ["customers"] });
  }

  return (
    <div onClick={() => setMenu(null)}>
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or mobile…"
          className="bg-white border border-onyx/15 px-3 py-2 text-sm flex-1 min-w-[220px] focus:border-gold outline-none" />
        <button onClick={() => setQuick("new")} className="eyebrow px-4 py-2 bg-onyx text-cream hover:bg-gold hover:text-onyx inline-flex items-center gap-2">
          <Plus className="size-3" /> Add customer
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="border border-dashed border-onyx/15 p-12 text-center text-sm text-muted-foreground">
          {customers.length === 0 ? "No customers yet. Add a number to start." : "No matches."}
        </div>
      ) : (
        <div className="border border-onyx/10 bg-white divide-y divide-onyx/10">
          {filtered.map((c) => {
            const slug = (c as any).service_slug as string | null;
            const link = waLink(c, "portfolio");
            return (
              <div key={c.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3">
                <button onClick={() => setQuick(c)} className="text-left flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{c.customer_name?.trim() || "Unnamed"}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.phone || "No mobile number"}
                    {slug ? ` · ${serviceName(slug) ?? slug}` : " · Not specified"}
                  </p>
                </button>
                <div className="flex items-center gap-2 relative">
                  {link ? (
                    <>
                      <a href={link} target="_blank" rel="noopener noreferrer"
                        className="eyebrow px-4 py-2 bg-[#25D366] text-onyx hover:opacity-90 inline-flex items-center gap-2">
                        <MessageCircle className="size-3.5" /> WhatsApp
                      </a>
                      <button onClick={(e) => { e.stopPropagation(); setMenu(menu === c.id ? null : c.id); }}
                        className="px-2 py-2 border border-onyx/15 hover:border-gold text-xs" aria-label="More WhatsApp options">▾</button>
                      {menu === c.id && (
                        <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-onyx/15 shadow-lg min-w-[180px]" onClick={(e) => e.stopPropagation()}>
                          {([["portfolio", "Portfolio"], ["google", "Google profile"], ["followup", "Follow-up"], ["availability", "Availability"]] as const).map(([k, label]) => (
                            <a key={k} href={waLink(c, k)!} target="_blank" rel="noopener noreferrer"
                              onClick={() => setMenu(null)}
                              className="block px-3 py-2 text-sm hover:bg-onyx/5">{label}</a>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <button onClick={() => setQuick(c)} className="eyebrow px-4 py-2 border border-onyx/15 text-muted-foreground hover:border-gold">
                      Add mobile number
                    </button>
                  )}
                  <button onClick={() => setFull(c)} className="text-muted-foreground hover:text-onyx p-2" title="Full profile"><Pencil className="size-4" /></button>
                  <button onClick={() => del(c.id)} className="text-muted-foreground hover:text-destructive p-2" title="Remove"><Trash2 className="size-4" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {quick && (
        <QuickCustomerDialog
          customer={quick === "new" ? null : quick}
          services={services}
          customers={customers}
          onOpenExisting={(c) => setQuick(c)}
          onClose={() => setQuick(null)}
        />
      )}
      {full && <CustomerEditor customer={full} onClose={() => setFull(null)} />}
    </div>
  );
}

function QuickCustomerDialog({ customer, services, customers, onClose, onOpenExisting }: {
  customer: Customer | null;
  services: { slug: string; name: string }[];
  customers: Customer[];
  onClose: () => void;
  onOpenExisting: (c: Customer) => void;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState(customer?.customer_name ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [service, setService] = useState<string>(((customer as any)?.service_slug as string) ?? "");
  const [notes, setNotes] = useState(customer?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [dup, setDup] = useState<Customer | null>(null);

  const parsed = normalizePhone(phone);
  const phoneInvalid = phone.trim().length > 0 && !parsed.ok;

  async function save() {
    if (!phone.trim()) return toast.error("Mobile number is required");
    if (!parsed.ok) return toast.error(parsed.reason ?? "Number looks invalid");
    const key = phoneKey(phone);
    const existing = customers.find((c) => c.id !== customer?.id && phoneKey(c.phone) === key);
    if (existing) { setDup(existing); return; }

    setSaving(true);
    const payload: any = {
      customer_name: name.trim() || null,
      phone: phone.trim(),
      service_slug: service || null,
      notes: notes.trim() || null,
    };
    const res = customer
      ? await tbl("customers").update(payload).eq("id", customer.id)
      : await tbl("customers").insert(payload);
    setSaving(false);
    if (res.error) return toast.error(res.error.message);
    toast.success("Saved");
    qc.invalidateQueries({ queryKey: ["customers"] });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-onyx/60 grid place-items-center p-4" onClick={onClose}>
      <div className="bg-cream w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-onyx/10 flex items-center justify-between">
          <h2 className="font-display text-xl">{customer ? "Edit customer" : "Add customer"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-onyx"><X className="size-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <Field label="Name (optional)" full><Input value={name} onChange={setName} /></Field>
          <Field label="Mobile number *" full><Input value={phone} onChange={(v) => { setPhone(v); setDup(null); }} placeholder="9876543210" /></Field>
          {phoneInvalid && <p className="text-xs text-destructive -mt-2">{parsed.reason}</p>}
          <Field label="Service" full>
            <select value={service} onChange={(e) => setService(e.target.value)}
              className="w-full bg-white border border-onyx/15 px-3 py-2 text-sm focus:border-gold outline-none">
              <option value="">Not specified</option>
              {services.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Notes (optional)" full>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-white border border-onyx/15 px-3 py-2 text-sm focus:border-gold outline-none" />
          </Field>
          {dup && (
            <div className="border border-destructive/40 bg-destructive/5 p-3 text-sm">
              This mobile number already exists.{" "}
              <button className="underline" onClick={() => { onOpenExisting(dup); setDup(null); }}>
                Open {dup.customer_name?.trim() || dup.phone}
              </button>
            </div>
          )}
        </div>
        <div className="p-5 border-t border-onyx/10 flex justify-end gap-2">
          <button onClick={onClose} className="eyebrow px-4 py-2 border border-onyx/15 hover:border-gold">Cancel</button>
          <button onClick={save} disabled={saving} className="eyebrow px-5 py-2 bg-onyx text-cream hover:bg-gold hover:text-onyx disabled:opacity-50">
            {saving ? "Saving…" : "Save customer"}
          </button>
        </div>
      </div>
    </div>
  );
}


function CustomerEditor({ customer, onClose }: { customer: Customer | null; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: inquiries = [] } = useQuery(inquiriesQuery);
  const { data: dates = [] } = useQuery(customerDatesQuery);
  const [form, setForm] = useState<Partial<Customer>>(() => customer ?? {
    customer_name: "", whatsapp_consent: true, source: "Walk-in",
  } as any);
  const [saving, setSaving] = useState(false);
  const [newDate, setNewDate] = useState<{ label: string; date: string; recurring: boolean }>({ label: "", date: "", recurring: true });

  const linked = (inquiries as any[]).filter((i) => customer && i.customer_id === customer.id);
  const custDates = dates.filter((d) => customer && d.customer_id === customer.id);

  async function save() {
    if (!form.customer_name?.trim()) return toast.error("Customer name is required");
    setSaving(true);
    const payload = { ...form };
    delete (payload as any).id; delete (payload as any).created_at; delete (payload as any).updated_at;
    // strip empty strings to null for date fields
    for (const k of ["baby_dob", "anniversary_date"] as const) {
      if ((payload as any)[k] === "") (payload as any)[k] = null;
    }
    let res;
    if (customer) res = await tbl("customers").update(payload).eq("id", customer.id);
    else res = await tbl("customers").insert(payload);
    setSaving(false);
    if (res.error) return toast.error(res.error.message);
    toast.success("Saved");
    qc.invalidateQueries({ queryKey: ["customers"] });
    onClose();
  }

  async function addDate() {
    if (!customer) return toast.error("Save the customer first");
    if (!newDate.label || !newDate.date) return;
    const { error } = await tbl("customer_dates").insert({ customer_id: customer.id, ...newDate });
    if (error) return toast.error(error.message);
    setNewDate({ label: "", date: "", recurring: true });
    qc.invalidateQueries({ queryKey: ["customer_dates"] });
  }

  async function delDate(id: string) {
    const { error } = await tbl("customer_dates").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["customer_dates"] });
  }

  function set<K extends keyof Customer>(k: K, v: any) { setForm((f) => ({ ...f, [k]: v })); }

  return (
    <div className="fixed inset-0 z-50 bg-onyx/60 grid place-items-center p-4" onClick={onClose}>
      <div className="bg-cream max-w-3xl w-full max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-onyx/10 flex items-center justify-between">
          <div>
            <p className="eyebrow text-gold">{customer ? "Edit" : "New"} customer</p>
            <h2 className="font-display text-2xl">{form.customer_name || "New family"}</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-onyx"><X className="size-5" /></button>
        </div>

        <div className="p-6 grid md:grid-cols-2 gap-4">
          <Field label="Customer / Parent Name *"><Input value={form.customer_name ?? ""} onChange={(v) => set("customer_name", v)} /></Field>
          <Field label="Phone (WhatsApp)"><Input value={form.phone ?? ""} onChange={(v) => set("phone", v)} placeholder="+91…" /></Field>
          <Field label="Baby Name"><Input value={form.baby_name ?? ""} onChange={(v) => set("baby_name", v)} /></Field>
          <Field label="Baby Date of Birth"><Input type="date" value={form.baby_dob ?? ""} onChange={(v) => set("baby_dob", v)} /></Field>
          <Field label="Baby Gender">
            <select value={form.baby_gender ?? ""} onChange={(e) => set("baby_gender", e.target.value || null)}
              className="w-full bg-white border border-onyx/15 px-3 py-2 text-sm focus:border-gold outline-none">
              <option value="">—</option><option>Girl</option><option>Boy</option><option>Other</option>
            </select>
          </Field>
          <Field label="Email"><Input value={form.email ?? ""} onChange={(v) => set("email", v)} /></Field>
          <Field label="Anniversary Date"><Input type="date" value={form.anniversary_date ?? ""} onChange={(v) => set("anniversary_date", v)} /></Field>
          <Field label="City"><Input value={form.city ?? ""} onChange={(v) => set("city", v)} /></Field>
          <Field label="Mother's Name"><Input value={form.mother_name ?? ""} onChange={(v) => set("mother_name", v)} /></Field>
          <Field label="Father's Name"><Input value={form.father_name ?? ""} onChange={(v) => set("father_name", v)} /></Field>
          <Field label="Source">
            <select value={form.source ?? "Walk-in"} onChange={(e) => set("source", e.target.value)}
              className="w-full bg-white border border-onyx/15 px-3 py-2 text-sm focus:border-gold outline-none">
              <option>Walk-in</option><option>Instagram</option><option>Referral</option><option>Google</option><option>Facebook</option><option>Other</option>
            </select>
          </Field>
          <Field label="Address" full><Input value={form.address ?? ""} onChange={(v) => set("address", v)} /></Field>
          <Field label="Notes (favorite themes, preferences…)" full>
            <textarea rows={3} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)}
              className="w-full bg-white border border-onyx/15 px-3 py-2 text-sm focus:border-gold outline-none" />
          </Field>
          <label className="md:col-span-2 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.whatsapp_consent ?? true} onChange={(e) => set("whatsapp_consent", e.target.checked)} />
            Consent to receive promotional WhatsApp messages
          </label>
        </div>

        {customer && (
          <div className="px-6 pb-6 space-y-6">
            <div>
              <p className="eyebrow text-gold mb-3">Important dates</p>
              <div className="space-y-2 mb-3">
                {custDates.map((d) => (
                  <div key={d.id} className="flex items-center justify-between bg-white border border-onyx/10 px-3 py-2 text-sm">
                    <span>{d.label} · {new Date(d.date + "T00:00:00").toLocaleDateString()} {d.recurring && <span className="text-xs text-muted-foreground">(yearly)</span>}</span>
                    <button onClick={() => delDate(d.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-3" /></button>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center">
                <Input value={newDate.label} onChange={(v) => setNewDate({ ...newDate, label: v })} placeholder="e.g., Baby's Birthday" />
                <Input type="date" value={newDate.date} onChange={(v) => setNewDate({ ...newDate, date: v })} />
                <label className="flex items-center gap-1.5 text-xs">
                  <input type="checkbox" checked={newDate.recurring} onChange={(e) => setNewDate({ ...newDate, recurring: e.target.checked })} /> yearly
                </label>
                <button onClick={addDate} className="eyebrow px-3 py-2 border border-onyx/15 hover:border-gold">Add</button>
              </div>
            </div>

            {linked.length > 0 && (
              <div>
                <p className="eyebrow text-gold mb-3">Linked bookings ({linked.length})</p>
                <div className="space-y-2">
                  {linked.map((i) => (
                    <div key={i.id} className="bg-white border border-onyx/10 px-3 py-2 text-sm flex justify-between">
                      <span>{i.category_label ?? i.service_type ?? "Session"} · {i.session_date ?? "—"} {i.session_slot ? `@ ${i.session_slot}` : ""}</span>
                      <span className="text-muted-foreground">{formatPrice(i.total_price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="p-6 border-t border-onyx/10 flex justify-end gap-2 sticky bottom-0 bg-cream">
          <button onClick={onClose} className="eyebrow px-4 py-2 border border-onyx/15 hover:border-gold">Cancel</button>
          <button onClick={save} disabled={saving} className="eyebrow px-4 py-2 bg-onyx text-cream hover:bg-gold hover:text-onyx disabled:opacity-50">
            {saving ? "Saving…" : "Save customer"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------- Milestones -------------------- */

function MilestonesTab() {
  const { data: milestones = [] } = useQuery(milestoneConfigsQuery);
  const qc = useQueryClient();
  const [form, setForm] = useState<{ label: string; months: string }>({ label: "", months: "" });

  async function add() {
    if (!form.label || !form.months) return;
    const { error } = await tbl("milestone_configs").insert({
      label: form.label, months: Number(form.months), sort_order: (milestones.length + 1) * 10,
    });
    if (error) return toast.error(error.message);
    setForm({ label: "", months: "" });
    qc.invalidateQueries({ queryKey: ["milestone_configs"] });
  }
  async function toggle(m: MilestoneConfig) {
    const { error } = await tbl("milestone_configs").update({ active: !m.active }).eq("id", m.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["milestone_configs"] });
  }
  async function del(id: string) {
    if (!confirm("Delete this milestone?")) return;
    const { error } = await tbl("milestone_configs").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["milestone_configs"] });
  }

  return (
    <div className="max-w-2xl">
      <p className="text-sm text-muted-foreground mb-6">
        Baby milestones are calculated from each child's date of birth. A reminder is generated 7 days before each milestone.
      </p>
      <div className="space-y-2 mb-6">
        {milestones.map((m) => (
          <div key={m.id} className="bg-white border border-onyx/10 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="font-medium">{m.label}</p>
              <p className="text-xs text-muted-foreground">{m.months} months</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs">
                <input type="checkbox" checked={m.active} onChange={() => toggle(m)} /> active
              </label>
              <button onClick={() => del(m.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
            </div>
          </div>
        ))}
      </div>
      <div className="border border-onyx/10 p-4 bg-white grid grid-cols-[1fr_auto_auto] gap-2 items-end">
        <Field label="Label"><Input value={form.label} onChange={(v) => setForm({ ...form, label: v })} placeholder="e.g., 100 Days" /></Field>
        <Field label="Months"><Input type="number" value={form.months} onChange={(v) => setForm({ ...form, months: v })} /></Field>
        <button onClick={add} className="eyebrow px-4 py-2 bg-onyx text-cream hover:bg-gold hover:text-onyx">Add</button>
      </div>
    </div>
  );
}

/* -------------------- Offers -------------------- */

function OffersTab() {
  const { data: offers = [] } = useQuery(reminderOffersQuery);
  const qc = useQueryClient();
  const [form, setForm] = useState<Partial<ReminderOffer>>({ label: "", offer_type: "percent", value: 20, active: true });

  async function save() {
    if (!form.label) return toast.error("Label required");
    const { error } = await tbl("reminder_offers").insert(form);
    if (error) return toast.error(error.message);
    setForm({ label: "", offer_type: "percent", value: 20, active: true });
    qc.invalidateQueries({ queryKey: ["reminder_offers"] });
  }
  async function toggle(o: ReminderOffer) {
    const { error } = await tbl("reminder_offers").update({ active: !o.active }).eq("id", o.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["reminder_offers"] });
  }
  async function del(id: string) {
    if (!confirm("Delete offer?")) return;
    const { error } = await tbl("reminder_offers").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["reminder_offers"] });
  }

  return (
    <div className="max-w-3xl">
      <p className="text-sm text-muted-foreground mb-6">
        The first active offer is auto-attached to every reminder message. Toggle offers on and off to run seasonal promotions.
      </p>
      <div className="space-y-2 mb-6">
        {offers.map((o) => (
          <div key={o.id} className="bg-white border border-onyx/10 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{o.label} <Tag className="inline size-3 text-gold" /></p>
                <p className="text-xs text-muted-foreground">
                  {o.offer_type === "percent" && `${o.value}% off`}
                  {o.offer_type === "flat" && `₹${o.value} off`}
                  {o.offer_type === "free_item" && `Free: ${o.message}`}
                  {o.offer_type === "text" && o.message}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs">
                  <input type="checkbox" checked={o.active} onChange={() => toggle(o)} /> active
                </label>
                <button onClick={() => del(o.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="border border-onyx/10 p-4 bg-white grid md:grid-cols-2 gap-3">
        <Field label="Label"><Input value={form.label ?? ""} onChange={(v) => setForm({ ...form, label: v })} placeholder="e.g., Diwali Milestone Offer" /></Field>
        <Field label="Type">
          <select value={form.offer_type} onChange={(e) => setForm({ ...form, offer_type: e.target.value as any })}
            className="w-full bg-white border border-onyx/15 px-3 py-2 text-sm focus:border-gold outline-none">
            <option value="percent">Percentage discount</option>
            <option value="flat">Flat discount (₹)</option>
            <option value="free_item">Free item (frame, print, etc.)</option>
            <option value="text">Custom promotional text</option>
          </select>
        </Field>
        {(form.offer_type === "percent" || form.offer_type === "flat") && (
          <Field label="Value"><Input type="number" value={String(form.value ?? "")} onChange={(v) => setForm({ ...form, value: Number(v) })} /></Field>
        )}
        <Field label="Message / item description" full>
          <textarea rows={2} value={form.message ?? ""} onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="e.g., Complimentary A4 photo frame"
            className="w-full bg-white border border-onyx/15 px-3 py-2 text-sm focus:border-gold outline-none" />
        </Field>
        <div className="md:col-span-2 flex justify-end">
          <button onClick={save} className="eyebrow px-4 py-2 bg-onyx text-cream hover:bg-gold hover:text-onyx">Add offer</button>
        </div>
      </div>
    </div>
  );
}

/* -------------------- Templates -------------------- */

function TemplatesTab() {
  const { data: templates = [] } = useQuery(messageTemplatesQuery);
  const qc = useQueryClient();
  const [body, setBody] = useState("");

  async function add() {
    if (!body.trim()) return;
    const { error } = await tbl("message_templates").insert({ body: body.trim() });
    if (error) return toast.error(error.message);
    setBody("");
    qc.invalidateQueries({ queryKey: ["message_templates"] });
  }
  async function toggle(t: MessageTemplate) {
    const { error } = await tbl("message_templates").update({ active: !t.active }).eq("id", t.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["message_templates"] });
  }
  async function del(id: string) {
    if (!confirm("Delete template?")) return;
    const { error } = await tbl("message_templates").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["message_templates"] });
  }

  return (
    <div className="max-w-3xl">
      <p className="text-sm text-muted-foreground mb-6">
        These warm, cute lines rotate randomly inside every reminder message. Add your studio's own voice here.
      </p>
      <div className="space-y-2 mb-6">
        {templates.map((t) => (
          <div key={t.id} className="bg-white border border-onyx/10 px-4 py-3 flex items-start justify-between gap-3">
            <p className="text-sm flex-1">{t.body}</p>
            <div className="flex items-center gap-3 shrink-0">
              <label className="flex items-center gap-1.5 text-xs">
                <input type="checkbox" checked={t.active} onChange={() => toggle(t)} /> active
              </label>
              <button onClick={() => del(t.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
            </div>
          </div>
        ))}
      </div>
      <div className="border border-onyx/10 p-4 bg-white space-y-3">
        <textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)}
          placeholder="e.g., Tiny hands, tiny feet, and memories that last forever. 💕"
          className="w-full bg-white border border-onyx/15 px-3 py-2 text-sm focus:border-gold outline-none" />
        <div className="flex justify-end">
          <button onClick={add} className="eyebrow px-4 py-2 bg-onyx text-cream hover:bg-gold hover:text-onyx">Add template</button>
        </div>
      </div>
    </div>
  );
}

/* -------------------- Tiny UI helpers -------------------- */

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="eyebrow text-muted-foreground block mb-1.5">{label}</label>
      {children}
    </div>
  );
}
function Input({ value, onChange, type = "text", placeholder }: { value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full bg-white border border-onyx/15 px-3 py-2 text-sm focus:border-gold outline-none" />
  );
}
