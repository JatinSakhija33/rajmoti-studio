import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useRef, type FormEvent } from "react";
import {
  Search,
  Plus,
  Users,
  MessageCircle,
  Phone,
  RefreshCw,
  Save,
  CalendarDays,
  Download,
  Upload,
  Heart,
  Cake,
  Gift,
} from "lucide-react";
import { DeskNav } from "@/components/desk-nav";
import { whatsappLink, waMessage, telLink } from "@/lib/site";

export const Route = createFileRoute("/desk_/contacts")({
  head: () => ({
    meta: [
      { title: "Contacts & Families — Rajmoti Studio OS" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: Contacts,
});

type Contact = {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  family_name?: string;
  birthday?: string;
  anniversary?: string;
  notes?: string;
  job_count?: number;
  last_job_at?: string;
};

const empty: Contact = {
  name: "",
  phone: "",
  email: "",
  family_name: "",
  birthday: "",
  anniversary: "",
  notes: "",
};

function Contacts() {
  const [items, setItems] = useState<Contact[]>([]);
  const [unlinked, setUnlinked] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<Contact>({ ...empty });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/owner/contacts", { credentials: "same-origin", cache: "no-store" });
      const d = await r.json();
      if (!r.ok) throw Error(d.error || "Unable to load contacts");
      setItems(d.contacts || []);
      setUnlinked(d.unlinked || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Contacts unavailable");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const merged = useMemo(
    () =>
      [...items, ...unlinked]
        .filter((x) =>
          [x.name, x.phone, x.family_name || "", x.notes || ""]
            .join(" ")
            .toLowerCase()
            .includes(search.toLowerCase()),
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [items, unlinked, search],
  );

  // Check if birthday or anniversary is this month
  const currentMonth = new Date().getMonth() + 1;
  const isEventThisMonth = (dateStr?: string) => {
    if (!dateStr) return false;
    try {
      const parts = dateStr.split("-");
      if (parts.length >= 2) {
        return Number(parts[1]) === currentMonth;
      }
    } catch {}
    return false;
  };

  const begin = (x: Contact) => {
    setForm({ ...empty, ...x });
    setEditing(true);
    setError("");
    setNotice("");
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const url = form.id ? "/api/owner/contacts/" + encodeURIComponent(form.id) : "/api/owner/contacts";
      const r = await fetch(url, {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error || "Unable to save contact");
      setNotice("Contact saved. Orders with the same phone number remain linked.");
      setEditing(false);
      setForm({ ...empty });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save");
    } finally {
      setSaving(false);
    }
  };

  const exportCSV = () => {
    const headers = ["Name", "Phone", "Email", "Family Name", "Birthday", "Anniversary", "Notes"];
    const rows = merged.map((c) => [
      `"${(c.name || "").replace(/"/g, '""')}"`,
      `"${c.phone || ""}"`,
      `"${c.email || ""}"`,
      `"${(c.family_name || "").replace(/"/g, '""')}"`,
      `"${c.birthday || ""}"`,
      `"${c.anniversary || ""}"`,
      `"${(c.notes || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `rajmoti-contacts-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const importCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const lines = text.split("\n").filter((l) => l.trim().length > 0);
      let count = 0;
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(",").map((p) => p.replace(/^"|"$/g, "").trim());
        if (parts.length >= 2 && parts[0] && parts[1]) {
          await fetch("/api/owner/contacts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({
              name: parts[0],
              phone: parts[1],
              email: parts[2] || "",
              family_name: parts[3] || "",
              birthday: parts[4] || "",
              anniversary: parts[5] || "",
              notes: parts[6] || "",
            }),
          });
          count++;
        }
      }
      setNotice(`Imported ${count} contacts from CSV.`);
      await load();
    } catch {
      setError("Failed to import CSV. Please ensure the CSV follows Name, Phone format.");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="desk-app">
      <DeskNav active="contacts" />
      <main className="desk-page">
        <div className="desk-heading">
          <div>
            <p className="desk-kicker">Families & Relationships</p>
            <h1>
              Studio contacts <em>& client profiles.</em>
            </h1>
            <p>Unified directory connecting every client, family milestone and past order by phone number.</p>
          </div>
          <div className="flex gap-2">
            <button className="desk-light-btn text-xs" onClick={exportCSV}>
              <Download size={14} /> Export CSV
            </button>
            <label className="desk-light-btn text-xs cursor-pointer">
              <Upload size={14} /> Import CSV
              <input ref={fileInputRef} type="file" accept=".csv" hidden onChange={(e) => void importCSV(e)} />
            </label>
            <button className="desk-primary" onClick={() => begin({ ...empty })}>
              <Plus size={17} /> New contact
            </button>
          </div>
        </div>

        {error && (
          <p className="desk-error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="desk-notice" role="status">
            {notice}
          </p>
        )}

        <div className="desk-toolbar">
          <label className="desk-search">
            <Search size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer name, phone number, or family name…"
            />
          </label>
          <button className="desk-light-btn" onClick={() => void load()}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        <div className="desk-stats">
          <div>
            <strong>{items.length}</strong>
            <span>Saved Studio Contacts</span>
          </div>
          <div>
            <strong>{unlinked.length}</strong>
            <span>Auto-discovered from Orders</span>
          </div>
          <div>
            <strong>{merged.length}</strong>
            <span>Total Unified Clients</span>
          </div>
        </div>

        <div className="desk-contact-grid">
          {loading ? (
            <p>Loading your studio directory…</p>
          ) : !merged.length ? (
            <div className="desk-empty">
              <Users size={32} />
              <h2>Your client directory starts here.</h2>
              <p>Add walk-in families or let orders automatically create profiles.</p>
            </div>
          ) : (
            merged.map((c, i) => {
              const bdayThisMonth = isEventThisMonth(c.birthday);
              const annivThisMonth = isEventThisMonth(c.anniversary);
              return (
                <article className="desk-person" key={c.id || "order-" + c.phone + i}>
                  <div className="desk-person-initial">{(c.name || "?").slice(0, 1).toUpperCase()}</div>
                  <div className="desk-person-text">
                    <div className="flex items-center gap-2">
                      <h2>{c.name}</h2>
                      {bdayThisMonth && (
                        <span className="text-[10px] font-bold bg-pink-100 text-pink-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Cake size={11} /> Birthday Month
                        </span>
                      )}
                      {annivThisMonth && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Heart size={11} /> Anniversary
                        </span>
                      )}
                    </div>
                    <p>
                      {c.family_name || "Rajmoti Studio Client"} · {c.job_count || 0} order(s)
                    </p>
                    <span>{c.phone}</span>
                    {(c.birthday || c.anniversary) && (
                      <p className="text-stone-500 text-[11px] mt-1">
                        <CalendarDays size={12} className="inline mr-1" />
                        {c.birthday ? `Birthday: ${c.birthday}` : ""}
                        {c.birthday && c.anniversary ? " · " : ""}
                        {c.anniversary ? `Anniversary: ${c.anniversary}` : ""}
                      </p>
                    )}
                    {c.notes && <p className="text-[11px] text-stone-600 italic mt-1">"{c.notes}"</p>}
                  </div>
                  <div className="desk-person-actions">
                    <a
                      href={whatsappLink(waMessage.customerFollowUp(c.name), c.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1"
                      title={"Message " + c.name + " on WhatsApp"}
                    >
                      <MessageCircle size={15} /> WhatsApp
                    </a>
                    <a href={telLink(c.phone)} title={"Call " + c.name}>
                      <Phone size={15} />
                    </a>
                    <button onClick={() => begin(c)}>Edit</button>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {editing && (
          <div
            className="desk-modal-backdrop"
            role="presentation"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setEditing(false);
            }}
          >
            <section className="desk-modal" role="dialog" aria-modal="true" aria-label="Contact details">
              <div className="flex justify-between items-center mb-5">
                <h2>{form.id ? "Edit Client Profile" : "Add New Client"}</h2>
                <button onClick={() => setEditing(false)}>Close</button>
              </div>
              <form onSubmit={(e) => void submit(e)} className="desk-form">
                <label>
                  Customer name
                  <input
                    required
                    minLength={2}
                    maxLength={140}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Full name"
                  />
                </label>
                <label>
                  WhatsApp / Mobile number
                  <input
                    required
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 94290 70317"
                  />
                </label>
                <label>
                  Family surname / Group
                  <input
                    value={form.family_name || ""}
                    onChange={(e) => setForm({ ...form, family_name: e.target.value })}
                    placeholder="e.g. Patel Family (Jetpur)"
                  />
                </label>
                <label>
                  Email (optional)
                  <input
                    type="email"
                    value={form.email || ""}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </label>
                <label>
                  Birthday (for milestone alerts)
                  <input
                    type="date"
                    value={form.birthday || ""}
                    onChange={(e) => setForm({ ...form, birthday: e.target.value })}
                  />
                </label>
                <label>
                  Wedding anniversary
                  <input
                    type="date"
                    value={form.anniversary || ""}
                    onChange={(e) => setForm({ ...form, anniversary: e.target.value })}
                  />
                </label>
                <label className="desk-span2">
                  Personal notes & preferences
                  <textarea
                    rows={3}
                    value={form.notes || ""}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Prefers natural light baby shoots, likes teak frames, etc."
                  />
                </label>
                <button disabled={saving} className="desk-primary">
                  <Save size={16} />
                  {saving ? "Saving…" : "Save Client Record"}
                </button>
              </form>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
