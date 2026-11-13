import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  RotateCcw,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { adminCategoriesQuery, adminSubcategoriesQuery, taxonomyCountsQuery } from "@/lib/queries";

export const Route = createFileRoute("/admin/categories")({
  component: AdminCategories,
});

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

type Row = Record<string, any>;

function AdminCategories() {
  const qc = useQueryClient();
  const { data: categories = [] } = useQuery(adminCategoriesQuery);
  const { data: subcategories = [] } = useQuery(adminSubcategoriesQuery);
  const { data: counts } = useQuery(taxonomyCountsQuery);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  const visible = useMemo(
    () => categories.filter((c: Row) => (showArchived ? !!c.archived_at : !c.archived_at)),
    [categories, showArchived],
  );
  const editing = categories.find((c: Row) => c.id === editingId) ?? null;

  function refresh() {
    qc.invalidateQueries({ queryKey: ["categories"] });
    qc.invalidateQueries({ queryKey: ["subcategories"] });
    qc.invalidateQueries({ queryKey: ["taxonomy"] });
    qc.invalidateQueries({ queryKey: ["category"] });
  }

  async function addCategory() {
    const name = prompt("Category name?");
    if (!name) return;
    const { error } = await supabase.from("categories").insert({
      name,
      slug: slugify(name),
      display_order: categories.length,
    });
    if (error) return toast.error(error.message);
    toast.success("Category created");
    refresh();
  }

  /** Persist a new order for the currently visible list. */
  async function persistOrder(ordered: Row[]) {
    await Promise.all(
      ordered.map((c, i) =>
        c.display_order === i
          ? Promise.resolve()
          : supabase.from("categories").update({ display_order: i }).eq("id", c.id),
      ),
    );
    refresh();
  }

  function move(id: string, delta: number) {
    const list = [...visible];
    const from = list.findIndex((c) => c.id === id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= list.length) return;
    const [row] = list.splice(from, 1);
    list.splice(to, 0, row!);
    persistOrder(list);
  }

  function onDropOn(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const list = [...visible];
    const from = list.findIndex((c) => c.id === dragId);
    const to = list.findIndex((c) => c.id === targetId);
    if (from < 0 || to < 0) return;
    const [row] = list.splice(from, 1);
    list.splice(to, 0, row!);
    setDragId(null);
    persistOrder(list);
  }

  return (
    <div data-owner-uploads="enabled">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-gold mb-2">Categories</p>
          <h1 className="font-display text-4xl">Organize the portfolio</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Drag to reorder — the public portfolio and navigation follow this order.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowArchived((v) => !v)}
            className="eyebrow text-muted-foreground hover:text-gold"
          >
            {showArchived ? "← Back to active" : "View archived"}
          </button>
          <button
            onClick={addCategory}
            className="bg-onyx text-cream px-4 py-2 text-xs uppercase tracking-widest font-semibold hover:bg-gold flex items-center gap-2"
          >
            <Plus className="size-4" aria-hidden /> New category
          </button>
        </div>
      </header>

      <ul className="space-y-3">
        {visible.map((c: Row, idx: number) => {
          const subs = subcategories.filter((s: Row) => s.category_id === c.id && !s.archived_at);
          const photos = counts?.byCategory[c.id] ?? 0;
          return (
            <li
              key={c.id}
              draggable
              onDragStart={() => setDragId(c.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDropOn(c.id)}
              className={`bg-white border ${dragId === c.id ? "border-gold" : "border-onyx/10"} flex items-center gap-4 p-4`}
            >
              <GripVertical className="size-4 text-onyx/30 cursor-grab shrink-0" aria-hidden />
              <div className="flex flex-col shrink-0">
                <button aria-label={`Move ${c.name} up`} onClick={() => move(c.id, -1)} disabled={idx === 0} className="p-0.5 disabled:opacity-25 hover:text-gold">
                  <ArrowUp className="size-3.5" />
                </button>
                <button aria-label={`Move ${c.name} down`} onClick={() => move(c.id, 1)} disabled={idx === visible.length - 1} className="p-0.5 disabled:opacity-25 hover:text-gold">
                  <ArrowDown className="size-3.5" />
                </button>
              </div>
              {c.cover_image_url ? (
                <img src={c.cover_image_url} alt="" width={56} height={56} className="size-14 object-cover shrink-0" />
              ) : (
                <div aria-hidden className="size-14 bg-cream border border-onyx/10 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-display text-xl truncate">
                  {c.name}
                  {c.featured && <Star className="inline size-3.5 ml-2 text-gold" aria-label="Featured" />}
                </p>
                <p className="text-xs text-muted-foreground">
                  {subs.length} subcategor{subs.length === 1 ? "y" : "ies"} · {photos} photograph{photos === 1 ? "" : "s"} · /{c.slug}
                </p>
                <p className="text-xs mt-1 inline-flex items-center gap-1.5">
                  <span className={`size-1.5 rounded-full ${c.hidden ? "bg-muted-foreground" : "bg-gold"}`} aria-hidden />
                  {c.archived_at ? "Archived" : c.hidden ? "Hidden" : "Published"}
                </p>
              </div>
              {c.archived_at ? (
                <button
                  onClick={async () => {
                    await supabase.from("categories").update({ archived_at: null }).eq("id", c.id);
                    toast.success("Restored");
                    refresh();
                  }}
                  className="eyebrow text-gold hover:underline inline-flex items-center gap-1"
                >
                  <RotateCcw className="size-3.5" aria-hidden /> Restore
                </button>
              ) : (
                <button
                  onClick={() => setEditingId(c.id)}
                  className="eyebrow border border-onyx/15 px-4 py-2 hover:border-gold hover:text-gold"
                >
                  Edit
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {visible.length === 0 && (
        <div className="text-center py-24 border border-dashed border-onyx/20 text-muted-foreground">
          <p className="font-display text-2xl italic mb-2">
            {showArchived ? "Nothing archived." : "No categories yet."}
          </p>
          {!showArchived && <p className="text-sm">Create your first portfolio category above.</p>}
        </div>
      )}

      {editing && (
        <CategoryEditor
          category={editing}
          allCategories={categories.filter((c: Row) => !c.archived_at)}
          subcategories={subcategories.filter((s: Row) => s.category_id === editing.id)}
          counts={counts}
          onClose={() => setEditingId(null)}
          onChanged={refresh}
        />
      )}
    </div>
  );
}

function CategoryEditor({
  category,
  allCategories,
  subcategories,
  counts,
  onClose,
  onChanged,
}: {
  category: Row;
  allCategories: Row[];
  subcategories: Row[];
  counts: { byCategory: Record<string, number>; bySubcategory: Record<string, number>; featuredByCategory: Record<string, number> } | undefined;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [form, setForm] = useState({
    name: category.name ?? "",
    slug: category.slug ?? "",
    description: category.description ?? "",
    cover_image_url: category.cover_image_url ?? "",
    seo_title: category.seo_title ?? "",
    seo_description: category.seo_description ?? "",
    hidden: !!category.hidden,
    featured: !!category.featured,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const photos = counts?.byCategory[category.id] ?? 0;
  const featuredPhotos = counts?.featuredByCategory[category.id] ?? 0;
  const active = subcategories.filter((s) => !s.archived_at);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    if (!form.name.trim()) return toast.error("A category needs a name");
    const slug = slugify(form.slug || form.name);
    setSaving(true);
    const { error } = await supabase
      .from("categories")
      .update({
        name: form.name.trim(),
        slug,
        description: form.description || null,
        cover_image_url: form.cover_image_url || null,
        seo_title: form.seo_title || null,
        seo_description: form.seo_description || null,
        hidden: form.hidden,
        featured: form.featured,
      })
      .eq("id", category.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    if (slug !== category.slug) toast.success("Saved — the old link now redirects here");
    else toast.success("Saved");
    onChanged();
    onClose();
  }

  async function archive() {
    const message =
      `This category contains ${photos} photograph${photos === 1 ? "" : "s"} and ${active.length} subcategor${active.length === 1 ? "y" : "ies"}.\n\n` +
      "Archiving hides it from the website but keeps every photograph and its links. Continue?";
    if (!confirm(message)) return;
    const { error } = await supabase
      .from("categories")
      .update({ archived_at: new Date().toISOString(), hidden: true })
      .eq("id", category.id);
    if (error) return toast.error(error.message);
    toast.success("Archived — restore it any time");
    onChanged();
    onClose();
  }

  async function moveContent() {
    const others = allCategories.filter((c) => c.id !== category.id);
    if (others.length === 0) return toast.error("There is no other category to move content into");
    const target = prompt(
      `Move ${photos} photograph(s) and ${active.length} subcategor${active.length === 1 ? "y" : "ies"} into which category?\n\n` +
        others.map((c, i) => `${i + 1}. ${c.name}`).join("\n"),
    );
    const idx = Number(target) - 1;
    const dest = others[idx];
    if (!dest) return;
    const [a, b] = await Promise.all([
      supabase.from("images").update({ category_id: dest.id }).eq("category_id", category.id),
      supabase.from("subcategories").update({ category_id: dest.id }).eq("category_id", category.id),
    ]);
    if (a.error || b.error) return toast.error(a.error?.message ?? b.error!.message);
    toast.success(`Moved into ${dest.name}`);
    onChanged();
  }

  async function destroy() {
    if (photos > 0 || active.length > 0) {
      return toast.error("Move or archive the content first — this category is not empty");
    }
    if (!confirm(`Permanently delete "${category.name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("categories").delete().eq("id", category.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    onChanged();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-onyx/70 flex justify-end"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Edit ${category.name}`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-cream w-full max-w-xl h-dvh overflow-y-auto"
      >
        <div className="sticky top-0 bg-cream flex items-center justify-between px-6 py-4 border-b border-onyx/10 z-10">
          <div>
            <p className="eyebrow text-gold">Category</p>
            <p className="font-display text-2xl">{category.name}</p>
          </div>
          <button onClick={onClose} aria-label="Close editor" className="p-2 hover:text-gold">
            <X className="size-5" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-5 text-sm">
          <p className="text-xs text-muted-foreground">
            {photos} photograph{photos === 1 ? "" : "s"} · {featuredPhotos} featured · {active.length} subcategor
            {active.length === 1 ? "y" : "ies"} ·{" "}
            <a href={`/portfolios/${category.slug}`} target="_blank" rel="noreferrer" className="text-gold hover:underline">
              View public category ↗
            </a>
          </p>

          <Field label="Cover image URL">
            <input value={form.cover_image_url} onChange={(e) => set("cover_image_url", e.target.value)} placeholder="https://…" className="field-input" />
          </Field>
          {form.cover_image_url && (
            <img src={form.cover_image_url} alt="" className="w-full aspect-[3/1] object-cover border border-onyx/10" />
          )}

          <Field label="Display name">
            <input value={form.name} onChange={(e) => set("name", e.target.value)} className="field-input" />
          </Field>

          <Field label="URL slug (changing this keeps the old link working)">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">/portfolios/</span>
              <input value={form.slug} onChange={(e) => set("slug", e.target.value)} className="field-input flex-1" />
              <button onClick={() => set("slug", slugify(form.name))} className="eyebrow text-gold hover:underline whitespace-nowrap">
                From name
              </button>
            </div>
          </Field>

          <Field label="Description (shown on the category page)">
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} className="field-input" />
          </Field>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => set("hidden", !form.hidden)}
              className={`inline-flex items-center gap-2 border px-4 py-2 eyebrow ${form.hidden ? "border-onyx/20 text-muted-foreground" : "border-gold text-gold"}`}
            >
              {form.hidden ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
              {form.hidden ? "Hidden" : "Published"}
            </button>
            <button
              onClick={() => set("featured", !form.featured)}
              className={`inline-flex items-center gap-2 border px-4 py-2 eyebrow ${form.featured ? "border-gold text-gold" : "border-onyx/20 text-muted-foreground"}`}
            >
              <Star className="size-4" aria-hidden /> {form.featured ? "Featured" : "Not featured"}
            </button>
          </div>

          <Field label="SEO title">
            <input value={form.seo_title} onChange={(e) => set("seo_title", e.target.value)} placeholder={`${form.name} — Rajmoti Studio`} className="field-input" />
          </Field>
          <Field label="SEO description">
            <textarea value={form.seo_description} onChange={(e) => set("seo_description", e.target.value)} rows={2} className="field-input" />
          </Field>

          <div className="flex gap-3 pt-2">
            <button
              onClick={save}
              disabled={saving}
              className="bg-onyx text-cream px-6 py-3 text-[10px] uppercase tracking-[0.25em] font-semibold hover:bg-gold disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save category"}
            </button>
            <button onClick={onClose} className="eyebrow text-muted-foreground hover:text-onyx px-2">Cancel</button>
          </div>

          <SubcategoryManager category={category} subcategories={subcategories} counts={counts} onChanged={onChanged} />

          <section className="border-t border-onyx/10 pt-6 mt-8">
            <p className="eyebrow text-muted-foreground mb-3">Danger zone</p>
            <div className="flex flex-wrap gap-3">
              <button onClick={archive} className="inline-flex items-center gap-2 border border-onyx/20 px-4 py-2 eyebrow hover:border-gold hover:text-gold">
                <Archive className="size-4" aria-hidden /> Archive category
              </button>
              <button onClick={moveContent} className="inline-flex items-center gap-2 border border-onyx/20 px-4 py-2 eyebrow hover:border-gold hover:text-gold">
                Move content elsewhere
              </button>
              <button onClick={destroy} className="inline-flex items-center gap-2 border border-destructive/40 text-destructive px-4 py-2 eyebrow hover:bg-destructive hover:text-cream">
                <Trash2 className="size-4" aria-hidden /> Delete
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Deletion is only possible once the category is empty, so photographs can never disappear by accident.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function SubcategoryManager({
  category,
  subcategories,
  counts,
  onChanged,
}: {
  category: Row;
  subcategories: Row[];
  counts: { bySubcategory: Record<string, number> } | undefined;
  onChanged: () => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const active = subcategories.filter((s) => !s.archived_at).sort((a, b) => a.display_order - b.display_order);

  async function add() {
    const name = prompt("Subcategory name?");
    if (!name) return;
    const { error } = await supabase.from("subcategories").insert({
      category_id: category.id,
      name,
      slug: slugify(name),
      display_order: active.length,
    });
    if (error) return toast.error(error.message);
    onChanged();
  }

  async function move(id: string, delta: number) {
    const list = [...active];
    const from = list.findIndex((s) => s.id === id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= list.length) return;
    const [row] = list.splice(from, 1);
    list.splice(to, 0, row!);
    await Promise.all(list.map((s, i) => supabase.from("subcategories").update({ display_order: i }).eq("id", s.id)));
    onChanged();
  }

  return (
    <section className="border-t border-onyx/10 pt-6 mt-8">
      <div className="flex items-center justify-between mb-3">
        <p className="eyebrow text-muted-foreground">Subcategories</p>
        <button onClick={add} className="eyebrow text-gold hover:underline">+ Add subcategory</button>
      </div>
      {active.length === 0 && <p className="text-xs text-muted-foreground">No subcategories yet.</p>}
      <ul className="space-y-2">
        {active.map((s, i) => (
          <li key={s.id} className="border border-onyx/10 bg-white">
            <div className="flex items-center gap-3 p-3">
              <div className="flex flex-col">
                <button aria-label={`Move ${s.name} up`} onClick={() => move(s.id, -1)} disabled={i === 0} className="p-0.5 disabled:opacity-25 hover:text-gold"><ArrowUp className="size-3" /></button>
                <button aria-label={`Move ${s.name} down`} onClick={() => move(s.id, 1)} disabled={i === active.length - 1} className="p-0.5 disabled:opacity-25 hover:text-gold"><ArrowDown className="size-3" /></button>
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate">
                  {s.name}
                  {s.hidden && <span className="ml-2 text-[10px] uppercase tracking-widest text-muted-foreground">Hidden</span>}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  /{s.slug} · {counts?.bySubcategory[s.id] ?? 0} photograph{(counts?.bySubcategory[s.id] ?? 0) === 1 ? "" : "s"}
                </p>
              </div>
              <button onClick={() => setOpenId(openId === s.id ? null : s.id)} className="eyebrow text-muted-foreground hover:text-gold">
                {openId === s.id ? "Close" : "Edit"}
              </button>
            </div>
            {openId === s.id && (
              <SubcategoryForm
                sub={s}
                photos={counts?.bySubcategory[s.id] ?? 0}
                onDone={() => { setOpenId(null); onChanged(); }}
              />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function SubcategoryForm({ sub, photos, onDone }: { sub: Row; photos: number; onDone: () => void }) {
  const [form, setForm] = useState({
    name: sub.name ?? "",
    slug: sub.slug ?? "",
    description: sub.description ?? "",
    cover_image_url: sub.cover_image_url ?? "",
    seo_title: sub.seo_title ?? "",
    seo_description: sub.seo_description ?? "",
    hidden: !!sub.hidden,
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    if (!form.name.trim()) return toast.error("A subcategory needs a name");
    const { error } = await supabase
      .from("subcategories")
      .update({
        name: form.name.trim(),
        slug: slugify(form.slug || form.name),
        description: form.description || null,
        cover_image_url: form.cover_image_url || null,
        seo_title: form.seo_title || null,
        seo_description: form.seo_description || null,
        hidden: form.hidden,
      })
      .eq("id", sub.id);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    onDone();
  }

  async function archive() {
    if (!confirm(`Archive "${sub.name}"? ${photos} photograph${photos === 1 ? "" : "s"} stay in the category.`)) return;
    const { error } = await supabase
      .from("subcategories")
      .update({ archived_at: new Date().toISOString(), hidden: true })
      .eq("id", sub.id);
    if (error) return toast.error(error.message);
    toast.success("Archived");
    onDone();
  }

  return (
    <div className="border-t border-onyx/10 p-4 bg-cream/40 space-y-3 text-sm">
      <Field label="Name"><input value={form.name} onChange={(e) => set("name", e.target.value)} className="field-input" /></Field>
      <Field label="Slug"><input value={form.slug} onChange={(e) => set("slug", e.target.value)} className="field-input" /></Field>
      <Field label="Description"><textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} className="field-input" /></Field>
      <Field label="Cover image URL"><input value={form.cover_image_url} onChange={(e) => set("cover_image_url", e.target.value)} className="field-input" /></Field>
      <Field label="SEO title"><input value={form.seo_title} onChange={(e) => set("seo_title", e.target.value)} className="field-input" /></Field>
      <Field label="SEO description"><textarea value={form.seo_description} onChange={(e) => set("seo_description", e.target.value)} rows={2} className="field-input" /></Field>
      <button
        onClick={() => set("hidden", !form.hidden)}
        className={`inline-flex items-center gap-2 border px-3 py-1.5 eyebrow ${form.hidden ? "border-onyx/20 text-muted-foreground" : "border-gold text-gold"}`}
      >
        {form.hidden ? <EyeOff className="size-3.5" aria-hidden /> : <Eye className="size-3.5" aria-hidden />}
        {form.hidden ? "Hidden" : "Published"}
      </button>
      <div className="flex gap-3 pt-1">
        <button onClick={save} className="bg-onyx text-cream px-4 py-2 text-[10px] uppercase tracking-[0.25em] font-semibold hover:bg-gold">Save</button>
        <button onClick={archive} className="eyebrow text-muted-foreground hover:text-destructive">Archive</button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="eyebrow text-muted-foreground block mb-1">{label}</span>
      {children}
    </label>
  );
}
