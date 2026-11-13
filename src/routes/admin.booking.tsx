import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Plus, Trash2, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  bookingServicesQuery, bookingPackagesQuery, bookingThemesQuery, bookingPosesQuery,
  bookingHoursQuery, blockedDatesQuery, bookingOffersQuery,
  DAY_LABELS, generateSlots,
  type BookingService, type BookingPackage, type BookingTheme, type BookingPose,
  type BookingHours, type BlockedDate, type BookingOffer,
} from "@/lib/booking-cms";
import { allImagesQuery } from "@/lib/queries";

export const Route = createFileRoute("/admin/booking")({
  head: () => ({ meta: [{ title: "Booking CMS — Rajmoti Studio" }] }),
  component: AdminBooking,
});

const TABS = ["Services", "Packages", "Themes", "Poses", "Hours", "Blocked dates", "Offers"] as const;
type Tab = typeof TABS[number];

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const tbl = (name: string) => supabase.from(name as any);

function AdminBooking() {
  const [tab, setTab] = useState<Tab>("Services");
  return (
    <div>
      <header className="mb-8">
        <p className="eyebrow text-gold mb-2">Booking CMS</p>
        <h1 className="font-display text-4xl">Booking management</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
          Everything customers see during booking is managed here — services, packages, themes, poses, working hours, closures and offers.
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
      {tab === "Services" && <ServicesTab />}
      {tab === "Packages" && <PackagesTab />}
      {tab === "Themes" && <ThemesTab />}
      {tab === "Poses" && <PosesTab />}
      {tab === "Hours" && <HoursTab />}
      {tab === "Blocked dates" && <BlockedTab />}
      {tab === "Offers" && <OffersTab />}
    </div>
  );
}

/* -------------------- Reusable helpers -------------------- */

function ImagePickerButton({ value, onChange, label = "Cover" }: { value: string | null; onChange: (url: string | null) => void; label?: string }) {
  const { data: images = [] } = useQuery(allImagesQuery);
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="size-16 bg-onyx/5 border border-onyx/10 grid place-items-center overflow-hidden shrink-0">
          {value ? <img src={value} alt="" className="size-full object-cover" /> : <ImageIcon className="size-5 text-muted-foreground" />}
        </div>
        <div className="flex flex-col gap-1">
          <button onClick={() => setOpen((o) => !o)} className="eyebrow text-gold text-left">{value ? "Change" : `Pick ${label}`}</button>
          {value && <button onClick={() => onChange(null)} className="eyebrow text-destructive text-left">Remove</button>}
        </div>
      </div>
      {open && (
        <div className="border border-onyx/10 p-3 bg-white max-h-64 overflow-y-auto">
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {(images as any[]).map((img) => (
              <button key={img.id} onClick={() => { onChange(img.url); setOpen(false); }}
                className={`aspect-square overflow-hidden border ${value === img.url ? "border-gold ring-2 ring-gold/40" : "border-onyx/10 hover:border-gold"}`}>
                <img src={img.url} alt="" className="size-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2 text-xs">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="text-xs block">
      <span className="eyebrow text-muted-foreground block mb-1">{label}</span>
      {children}
    </label>
  );
}

const inputCls = "w-full border border-onyx/10 px-3 py-2 text-sm bg-white";

/* -------------------- SERVICES -------------------- */

function ServicesTab() {
  const qc = useQueryClient();
  const { data: services = [] } = useQuery(bookingServicesQuery);

  async function add() {
    const name = prompt("Service name?");
    if (!name) return;
    const { error } = await tbl("booking_services").insert({ name, slug: slugify(name) + "-" + Date.now().toString(36), sort_order: services.length });
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["booking_services"] });
  }
  async function update(id: string, patch: Partial<BookingService>) {
    const { error } = await tbl("booking_services").update(patch as any).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["booking_services"] });
  }
  async function del(id: string) {
    if (!confirm("Delete this service? Its packages, themes and poses will also be removed.")) return;
    const { error } = await tbl("booking_services").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["booking_services"] });
  }

  return (
    <section>
      <div className="flex justify-end mb-4">
        <button onClick={add} className="bg-onyx text-cream px-4 py-2 text-xs uppercase tracking-widest font-semibold hover:bg-gold flex items-center gap-2">
          <Plus className="size-4" /> Service
        </button>
      </div>
      {services.length === 0 && <p className="text-sm text-muted-foreground">No services yet. Add one to start building your booking catalog.</p>}
      <div className="space-y-4">
        {services.map((s) => (
          <div key={s.id} className="bg-white border border-onyx/10 p-6">
            <div className="grid md:grid-cols-[auto_1fr] gap-6">
              <ImagePickerButton value={s.cover_url} onChange={(u) => update(s.id, { cover_url: u })} />
              <div className="grid md:grid-cols-2 gap-3">
                <Field label="Name"><input defaultValue={s.name} onBlur={(e) => e.target.value !== s.name && update(s.id, { name: e.target.value })} className={inputCls} /></Field>
                <Field label="Slug"><input defaultValue={s.slug} onBlur={(e) => e.target.value !== s.slug && update(s.id, { slug: e.target.value })} className={inputCls} /></Field>
                <Field label="Sort order"><input type="number" defaultValue={s.sort_order} onBlur={(e) => update(s.id, { sort_order: Number(e.target.value) })} className={inputCls} /></Field>
                <div className="flex items-end gap-4">
                  <Toggle checked={s.active} onChange={(v) => update(s.id, { active: v })} label="Active" />
                  <Toggle checked={s.featured} onChange={(v) => update(s.id, { featured: v })} label="Featured" />
                  <button onClick={() => del(s.id)} className="text-destructive ml-auto"><Trash2 className="size-4" /></button>
                </div>
                <Field label="Description">
                  <textarea defaultValue={s.description ?? ""} rows={2} onBlur={(e) => update(s.id, { description: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Booking instructions (shown to customer)">
                  <textarea defaultValue={s.booking_instructions ?? ""} rows={2} onBlur={(e) => update(s.id, { booking_instructions: e.target.value })} className={inputCls} />
                </Field>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------- PACKAGES -------------------- */

function PackagesTab() {
  const qc = useQueryClient();
  const { data: services = [] } = useQuery(bookingServicesQuery);
  const { data: packages = [] } = useQuery(bookingPackagesQuery);
  const [filter, setFilter] = useState<string>("");

  const filtered = useMemo(
    () => filter ? packages.filter((p) => p.service_id === filter) : packages,
    [packages, filter],
  );

  async function add() {
    if (!services.length) return toast.error("Add a service first");
    const service_id = filter || services[0].id;
    const name = prompt("Package name?");
    if (!name) return;
    const { error } = await tbl("booking_packages").insert({ service_id, name, sort_order: packages.length });
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["booking_packages"] });
  }
  async function update(id: string, patch: Partial<BookingPackage>) {
    const { error } = await tbl("booking_packages").update(patch as any).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["booking_packages"] });
  }
  async function del(id: string) {
    if (!confirm("Delete this package?")) return;
    const { error } = await tbl("booking_packages").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["booking_packages"] });
  }

  return (
    <section>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border border-onyx/10 px-3 py-2 text-sm bg-white">
          <option value="">All services</option>
          {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button onClick={add} className="ml-auto bg-onyx text-cream px-4 py-2 text-xs uppercase tracking-widest font-semibold hover:bg-gold flex items-center gap-2">
          <Plus className="size-4" /> Package
        </button>
      </div>
      <div className="space-y-4">
        {filtered.map((p) => (
          <div key={p.id} className="bg-white border border-onyx/10 p-6">
            <div className="grid md:grid-cols-4 gap-3 mb-3">
              <Field label="Name"><input defaultValue={p.name} onBlur={(e) => update(p.id, { name: e.target.value })} className={inputCls} /></Field>
              <Field label="Service">
                <select defaultValue={p.service_id} onChange={(e) => update(p.id, { service_id: e.target.value })} className={inputCls}>
                  {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </Field>
              <Field label="Price (₹)"><input type="number" defaultValue={p.price} onBlur={(e) => update(p.id, { price: Number(e.target.value) })} className={inputCls} /></Field>
              <Field label="Duration (min)"><input type="number" defaultValue={p.duration_minutes} onBlur={(e) => update(p.id, { duration_minutes: Number(e.target.value) })} className={inputCls} /></Field>
              <Field label="Max themes"><input type="number" defaultValue={p.max_themes} onBlur={(e) => update(p.id, { max_themes: Number(e.target.value) })} className={inputCls} /></Field>
              <Field label="Max poses"><input type="number" defaultValue={p.max_poses} onBlur={(e) => update(p.id, { max_poses: Number(e.target.value) })} className={inputCls} /></Field>
              <Field label="Max edited photos"><input type="number" defaultValue={p.max_edited_photos} onBlur={(e) => update(p.id, { max_edited_photos: Number(e.target.value) })} className={inputCls} /></Field>
              <Field label="Max family members"><input type="number" defaultValue={p.max_family_members} onBlur={(e) => update(p.id, { max_family_members: Number(e.target.value) })} className={inputCls} /></Field>
              <Field label="Advance %"><input type="number" defaultValue={p.advance_percent} onBlur={(e) => update(p.id, { advance_percent: Number(e.target.value) })} className={inputCls} /></Field>
              <Field label="Seasonal discount %"><input type="number" defaultValue={p.seasonal_discount_percent} onBlur={(e) => update(p.id, { seasonal_discount_percent: Number(e.target.value) })} className={inputCls} /></Field>
              <Field label="Badge"><input defaultValue={p.badge ?? ""} onBlur={(e) => update(p.id, { badge: e.target.value || null })} className={inputCls} placeholder="e.g. Best value" /></Field>
              <Field label="Sort order"><input type="number" defaultValue={p.sort_order} onBlur={(e) => update(p.id, { sort_order: Number(e.target.value) })} className={inputCls} /></Field>
            </div>
            <Field label="Description">
              <textarea defaultValue={p.description ?? ""} rows={2} onBlur={(e) => update(p.id, { description: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Features (one per line)">
              <textarea
                defaultValue={Array.isArray(p.features) ? p.features.join("\n") : ""}
                rows={4}
                onBlur={(e) => update(p.id, { features: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) as any })}
                className={inputCls}
              />
            </Field>
            <div className="flex items-center gap-4 mt-3">
              <Toggle checked={p.active} onChange={(v) => update(p.id, { active: v })} label="Active" />
              <Toggle checked={p.popular} onChange={(v) => update(p.id, { popular: v })} label="Popular" />
              <button onClick={() => del(p.id)} className="text-destructive ml-auto"><Trash2 className="size-4" /></button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground">No packages here yet.</p>}
      </div>
    </section>
  );
}

/* -------------------- THEMES -------------------- */

function ThemesTab() {
  const qc = useQueryClient();
  const { data: services = [] } = useQuery(bookingServicesQuery);
  const { data: themes = [] } = useQuery(bookingThemesQuery);
  const [filter, setFilter] = useState<string>("");
  const filtered = filter ? themes.filter((t) => t.service_id === filter) : themes;

  async function add() {
    if (!services.length) return toast.error("Add a service first");
    const service_id = filter || services[0].id;
    const name = prompt("Theme name?");
    if (!name) return;
    const { error } = await tbl("booking_themes").insert({ service_id, name, sort_order: themes.length });
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["booking_themes"] });
  }
  async function update(id: string, patch: Partial<BookingTheme>) {
    const { error } = await tbl("booking_themes").update(patch as any).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["booking_themes"] });
  }
  async function del(id: string) {
    if (!confirm("Delete this theme? Its poses will be removed too.")) return;
    const { error } = await tbl("booking_themes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["booking_themes"] });
  }

  return (
    <section>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border border-onyx/10 px-3 py-2 text-sm bg-white">
          <option value="">All services</option>
          {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button onClick={add} className="ml-auto bg-onyx text-cream px-4 py-2 text-xs uppercase tracking-widest font-semibold hover:bg-gold flex items-center gap-2">
          <Plus className="size-4" /> Theme
        </button>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map((t) => (
          <div key={t.id} className="bg-white border border-onyx/10 p-5">
            <div className="grid grid-cols-[auto_1fr] gap-4 mb-3">
              <ImagePickerButton value={t.thumbnail_url} onChange={(u) => update(t.id, { thumbnail_url: u })} label="Thumbnail" />
              <div className="space-y-2">
                <input defaultValue={t.name} onBlur={(e) => update(t.id, { name: e.target.value })} className={`${inputCls} font-display text-lg`} />
                <select defaultValue={t.service_id} onChange={(e) => update(t.id, { service_id: e.target.value })} className={inputCls}>
                  {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <Field label="Recommended age"><input defaultValue={t.recommended_age ?? ""} onBlur={(e) => update(t.id, { recommended_age: e.target.value || null })} className={inputCls} placeholder="e.g. 3–6 months" /></Field>
              <Field label="BG color"><input defaultValue={t.bg_color ?? ""} onBlur={(e) => update(t.id, { bg_color: e.target.value || null })} className={inputCls} placeholder="#f5e6d3" /></Field>
              <Field label="Sort order"><input type="number" defaultValue={t.sort_order} onBlur={(e) => update(t.id, { sort_order: Number(e.target.value) })} className={inputCls} /></Field>
              <div className="flex items-end">
                <Toggle checked={t.active} onChange={(v) => update(t.id, { active: v })} label="Active" />
                <button onClick={() => del(t.id)} className="text-destructive ml-auto"><Trash2 className="size-4" /></button>
              </div>
            </div>
            <Field label="Props (comma separated)">
              <input defaultValue={(t.props ?? []).join(", ")} onBlur={(e) => update(t.id, { props: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} className={inputCls} />
            </Field>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground">No themes yet.</p>}
      </div>
    </section>
  );
}

/* -------------------- POSES -------------------- */

function PosesTab() {
  const qc = useQueryClient();
  const { data: services = [] } = useQuery(bookingServicesQuery);
  const { data: themes = [] } = useQuery(bookingThemesQuery);
  const { data: poses = [] } = useQuery(bookingPosesQuery);
  const [serviceFilter, setServiceFilter] = useState<string>("");
  const [themeFilter, setThemeFilter] = useState<string>("");

  const themeOptions = useMemo(
    () => serviceFilter ? themes.filter((t) => t.service_id === serviceFilter) : themes,
    [themes, serviceFilter],
  );
  const filtered = poses.filter((p) => {
    if (themeFilter) return p.theme_id === themeFilter;
    if (serviceFilter) return themeOptions.some((t) => t.id === p.theme_id);
    return true;
  });

  async function add() {
    if (!themeOptions.length) return toast.error("Add a theme first");
    const theme_id = themeFilter || themeOptions[0].id;
    const name = prompt("Pose name?");
    if (!name) return;
    const { error } = await tbl("booking_poses").insert({ theme_id, name, sort_order: poses.length });
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["booking_poses"] });
  }
  async function update(id: string, patch: Partial<BookingPose>) {
    const { error } = await tbl("booking_poses").update(patch as any).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["booking_poses"] });
  }
  async function del(id: string) {
    if (!confirm("Delete this pose?")) return;
    const { error } = await tbl("booking_poses").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["booking_poses"] });
  }

  return (
    <section>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select value={serviceFilter} onChange={(e) => { setServiceFilter(e.target.value); setThemeFilter(""); }} className="border border-onyx/10 px-3 py-2 text-sm bg-white">
          <option value="">All services</option>
          {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={themeFilter} onChange={(e) => setThemeFilter(e.target.value)} className="border border-onyx/10 px-3 py-2 text-sm bg-white">
          <option value="">All themes</option>
          {themeOptions.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <button onClick={add} className="ml-auto bg-onyx text-cream px-4 py-2 text-xs uppercase tracking-widest font-semibold hover:bg-gold flex items-center gap-2">
          <Plus className="size-4" /> Pose
        </button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => {
          const theme = themes.find((t) => t.id === p.theme_id);
          return (
            <div key={p.id} className="bg-white border border-onyx/10 p-4">
              <ImagePickerButton value={p.preview_url} onChange={(u) => update(p.id, { preview_url: u })} label="Preview" />
              <div className="mt-3 space-y-2">
                <input defaultValue={p.name} onBlur={(e) => update(p.id, { name: e.target.value })} className={`${inputCls} font-medium`} />
                <select defaultValue={p.theme_id} onChange={(e) => update(p.id, { theme_id: e.target.value })} className={inputCls}>
                  {themes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <p className="text-xs text-muted-foreground">Service: {services.find((s) => s.id === theme?.service_id)?.name ?? "—"}</p>
                <div className="grid grid-cols-2 gap-2">
                  <input defaultValue={p.category ?? ""} placeholder="Category" onBlur={(e) => update(p.id, { category: e.target.value || null })} className={inputCls} />
                  <input defaultValue={p.difficulty ?? ""} placeholder="Difficulty" onBlur={(e) => update(p.id, { difficulty: e.target.value || null })} className={inputCls} />
                </div>
                <input defaultValue={p.recommended_age ?? ""} placeholder="Recommended age" onBlur={(e) => update(p.id, { recommended_age: e.target.value || null })} className={inputCls} />
                <textarea defaultValue={p.description ?? ""} rows={2} placeholder="Description" onBlur={(e) => update(p.id, { description: e.target.value })} className={inputCls} />
                <div className="flex items-center gap-3">
                  <input type="number" defaultValue={p.sort_order} onBlur={(e) => update(p.id, { sort_order: Number(e.target.value) })} className="w-20 border border-onyx/10 px-2 py-1 text-sm" />
                  <Toggle checked={p.active} onChange={(v) => update(p.id, { active: v })} label="Active" />
                  <button onClick={() => del(p.id)} className="text-destructive ml-auto"><Trash2 className="size-4" /></button>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground col-span-full">No poses yet.</p>}
      </div>
    </section>
  );
}

/* -------------------- HOURS -------------------- */

function HoursTab() {
  const qc = useQueryClient();
  const { data: hours = [] } = useQuery(bookingHoursQuery);

  async function update(id: string, patch: Partial<BookingHours>) {
    const { error } = await tbl("booking_hours").update(patch as any).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["booking_hours"] });
  }

  return (
    <section>
      <p className="text-sm text-muted-foreground mb-6">
        Working windows for each day. Slot start times are auto-generated from these blocks using the session length.
      </p>
      <div className="space-y-3">
        {hours.map((h) => {
          const preview = h.open ? generateSlots(h.blocks ?? [], h.session_minutes) : [];
          return (
            <div key={h.id} className="bg-white border border-onyx/10 p-5">
              <div className="flex items-center gap-4 mb-3">
                <p className="font-display text-lg w-16">{DAY_LABELS[h.day_of_week]}</p>
                <Toggle checked={h.open} onChange={(v) => update(h.id, { open: v })} label="Open" />
                <div className="ml-auto flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Session (min)</span>
                  <input type="number" defaultValue={h.session_minutes} onBlur={(e) => update(h.id, { session_minutes: Number(e.target.value) })} className="w-20 border border-onyx/10 px-2 py-1" />
                </div>
              </div>
              <div className="space-y-2">
                {(h.blocks ?? []).map((b, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <input type="time" defaultValue={b.start} onBlur={(e) => {
                      const next = [...(h.blocks ?? [])]; next[i] = { ...next[i], start: e.target.value };
                      update(h.id, { blocks: next });
                    }} className="border border-onyx/10 px-2 py-1" />
                    <span>–</span>
                    <input type="time" defaultValue={b.end} onBlur={(e) => {
                      const next = [...(h.blocks ?? [])]; next[i] = { ...next[i], end: e.target.value };
                      update(h.id, { blocks: next });
                    }} className="border border-onyx/10 px-2 py-1" />
                    <button onClick={() => update(h.id, { blocks: (h.blocks ?? []).filter((_, j) => j !== i) })} className="text-destructive">
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                ))}
                <button onClick={() => update(h.id, { blocks: [...(h.blocks ?? []), { start: "10:00", end: "14:00" }] })} className="eyebrow text-gold">+ Add block</button>
              </div>
              {preview.length > 0 && (
                <div className="mt-3 pt-3 border-t border-onyx/10">
                  <p className="eyebrow text-muted-foreground mb-2">Generated slots</p>
                  <div className="flex flex-wrap gap-1.5">
                    {preview.map((s) => <span key={s} className="text-xs px-2 py-1 bg-onyx/5">{s}</span>)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* -------------------- BLOCKED DATES -------------------- */

function BlockedTab() {
  const qc = useQueryClient();
  const { data: blocked = [] } = useQuery(blockedDatesQuery);
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");

  async function add() {
    if (!date) return toast.error("Pick a date");
    const { error } = await tbl("booking_blocked_dates").insert({ date, reason, all_day: true });
    if (error) return toast.error(error.message);
    setDate(""); setReason("");
    qc.invalidateQueries({ queryKey: ["booking_blocked_dates"] });
  }
  async function del(id: string) {
    const { error } = await tbl("booking_blocked_dates").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["booking_blocked_dates"] });
  }

  return (
    <section>
      <div className="bg-white border border-onyx/10 p-5 mb-6 grid sm:grid-cols-[auto_1fr_auto] gap-3 items-end">
        <Field label="Date"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} /></Field>
        <Field label="Reason"><input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Holiday, family event…" className={inputCls} /></Field>
        <button onClick={add} className="bg-onyx text-cream px-4 py-2.5 text-xs uppercase tracking-widest font-semibold hover:bg-gold flex items-center gap-2">
          <Plus className="size-4" /> Block
        </button>
      </div>
      <div className="space-y-2">
        {(blocked as BlockedDate[]).map((b) => (
          <div key={b.id} className="bg-white border border-onyx/10 p-4 flex items-center gap-4">
            <span className="font-medium">{new Date(b.date + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
            <span className="text-sm text-muted-foreground">{b.reason ?? "Closed"}</span>
            <button onClick={() => del(b.id)} className="text-destructive ml-auto"><Trash2 className="size-4" /></button>
          </div>
        ))}
        {blocked.length === 0 && <p className="text-sm text-muted-foreground">No blocked dates.</p>}
      </div>
    </section>
  );
}

/* -------------------- OFFERS -------------------- */

function OffersTab() {
  const qc = useQueryClient();
  const { data: offers = [] } = useQuery(bookingOffersQuery);
  const { data: services = [] } = useQuery(bookingServicesQuery);

  async function add() {
    const name = prompt("Offer name?");
    if (!name) return;
    const { error } = await tbl("booking_offers").insert({ name, discount_percent: 10, active: true });
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["booking_offers"] });
  }
  async function update(id: string, patch: Partial<BookingOffer>) {
    const { error } = await tbl("booking_offers").update(patch as any).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["booking_offers"] });
  }
  async function del(id: string) {
    if (!confirm("Delete this offer?")) return;
    const { error } = await tbl("booking_offers").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["booking_offers"] });
  }

  return (
    <section>
      <div className="flex justify-end mb-4">
        <button onClick={add} className="bg-onyx text-cream px-4 py-2 text-xs uppercase tracking-widest font-semibold hover:bg-gold flex items-center gap-2">
          <Plus className="size-4" /> Offer
        </button>
      </div>
      <div className="space-y-4">
        {offers.map((o) => (
          <div key={o.id} className="bg-white border border-onyx/10 p-6">
            <div className="grid md:grid-cols-4 gap-3">
              <Field label="Name"><input defaultValue={o.name} onBlur={(e) => update(o.id, { name: e.target.value })} className={inputCls} /></Field>
              <Field label="Code (optional)"><input defaultValue={o.code ?? ""} onBlur={(e) => update(o.id, { code: e.target.value || null })} className={inputCls} placeholder="DIWALI25" /></Field>
              <Field label="Discount %"><input type="number" defaultValue={o.discount_percent ?? ""} onBlur={(e) => update(o.id, { discount_percent: e.target.value ? Number(e.target.value) : null })} className={inputCls} /></Field>
              <Field label="Flat amount ₹"><input type="number" defaultValue={o.flat_amount ?? ""} onBlur={(e) => update(o.id, { flat_amount: e.target.value ? Number(e.target.value) : null })} className={inputCls} /></Field>
              <Field label="Starts"><input type="date" defaultValue={o.starts_at ?? ""} onBlur={(e) => update(o.id, { starts_at: e.target.value || null })} className={inputCls} /></Field>
              <Field label="Ends"><input type="date" defaultValue={o.ends_at ?? ""} onBlur={(e) => update(o.id, { ends_at: e.target.value || null })} className={inputCls} /></Field>
              <Field label="Weekdays (bitmask 0-127)">
                <input type="number" defaultValue={o.weekday_mask} onBlur={(e) => update(o.id, { weekday_mask: Number(e.target.value) })} className={inputCls} />
              </Field>
              <div className="flex items-end gap-4">
                <Toggle checked={o.active} onChange={(v) => update(o.id, { active: v })} label="Active" />
                <Toggle checked={o.auto_apply} onChange={(v) => update(o.id, { auto_apply: v })} label="Auto apply" />
                <button onClick={() => del(o.id)} className="text-destructive ml-auto"><Trash2 className="size-4" /></button>
              </div>
            </div>
            <Field label="Applies to services (leave empty for all)">
              <div className="flex flex-wrap gap-2 mt-1">
                {services.map((s) => {
                  const on = o.applies_to_service_ids?.includes(s.id);
                  return (
                    <button key={s.id} onClick={() => {
                      const next = on ? o.applies_to_service_ids.filter((x) => x !== s.id) : [...(o.applies_to_service_ids ?? []), s.id];
                      update(o.id, { applies_to_service_ids: next });
                    }} className={`eyebrow px-3 py-1.5 border ${on ? "bg-onyx text-cream border-onyx" : "border-onyx/15 hover:border-gold"}`}>
                      {s.name}
                    </button>
                  );
                })}
              </div>
            </Field>
          </div>
        ))}
        {offers.length === 0 && <p className="text-sm text-muted-foreground">No offers yet. Create seasonal or weekday promotions here.</p>}
      </div>
    </section>
  );
}
