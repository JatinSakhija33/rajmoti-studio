import { ReplacePhoto } from "@/features/media/replace-photo";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Trash2,
  Eye,
  EyeOff,
  Star,
  X,
  Pencil,
  Search,
  CheckSquare,
  Square,
  Link2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { adminCategoriesQuery, allImagesQuery } from "@/lib/queries";
import { variantUrl } from "@/lib/images";
import { PhotoUploadPanel } from "@/components/admin/photo-upload-queue";
import { publishedPhotoLibraryQuery } from "@/lib/published-portfolio";

export const Route = createFileRoute("/admin/images")({
  component: AdminImages,
});

/** The permanent public route of a photograph — always derived from its public id. */
function publicPhotoPath(shortId: string) {
  return `/photo/${shortId}`;
}

async function copyPublicLink(shortId: string) {
  const url = `${window.location.origin}${publicPhotoPath(shortId)}`;
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Public link copied");
  } catch {
    toast.error(url);
  }
}

function AdminImages() {
  const qc = useQueryClient();
  const managed = useQuery(allImagesQuery);
  const bundled = useQuery(publishedPhotoLibraryQuery);
  const { data: categories = [] } = useQuery(adminCategoriesQuery);
  const [filterCat, setFilterCat] = useState("");
  const [search, setSearch] = useState("");
  const [source, setSource] = useState<"all" | "managed" | "bundled">("all");
  const [viewing, setViewing] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [limit, setLimit] = useState(48);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const managedPhotos = (managed.data ?? []).map((photo) => ({ ...photo, bundled: false as const }));
    const ids = new Set(managedPhotos.filter((photo) => !photo.hidden).map((photo) => photo.short_id));
    const bundledPhotos = (bundled.data ?? [])
      .filter((photo) => source === "bundled" || !ids.has(photo.short_id))
      .map((photo) => ({ ...photo, bundled: true as const }));
    const photos = source === "managed" ? managedPhotos : source === "bundled" ? bundledPhotos : [...managedPhotos, ...bundledPhotos];
    return photos.filter((img) => {
      if (filterCat && img.categories?.slug !== filterCat) return false;
      const tags = "tags" in img ? img.tags : undefined;
      const caption = "caption" in img ? img.caption : undefined;
      return !term || [img.title, caption, img.alt_text, img.categories?.name, img.subcategories?.name, ...(tags ?? [])]
        .filter(Boolean).join(" ").toLowerCase().includes(term);
    });
  }, [managed.data, bundled.data, filterCat, search, source]);

  const shown = filtered.slice(0, limit);
  const selectable = shown.filter((photo) => !photo.bundled);
  const allSelectedOnPage = selectable.length > 0 && selectable.every((photo) => selected.has(photo.id));
  function toggleSelectAll() {
    setSelected((previous) => {
      const next = new Set(previous);
      selectable.forEach((photo) => allSelectedOnPage ? next.delete(photo.id) : next.add(photo.id));
      return next;
    });
  }

  function toggleOne(id: string) {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  }

  async function updateImage(id: string, patch: any) {
    if (patch.hidden === false && managed.data?.find((photo) => photo.id === id)?.hidden && !confirm("Publish this photo to the website? Confirm it is approved for public use.")) return false;
    const { error } = await supabase.from("images").update(patch).eq("id", id);
    if (error) {
      toast.error(error.message);
      return false;
    }
    qc.invalidateQueries({ queryKey: ["images"] });
    qc.invalidateQueries({ queryKey: ["photo"] });
    qc.invalidateQueries({ queryKey: ["taxonomy"] });
    return true;
  }

  async function deleteImage(id: string) {
    if (!confirm("Delete this photograph? This cannot be undone.")) return;
    const { error } = await supabase.from("images").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["images"] });
    qc.invalidateQueries({ queryKey: ["photo"] });
    qc.invalidateQueries({ queryKey: ["taxonomy"] });
  }

  async function bulkUpdate(patch: any) {
    if (selected.size === 0) return;
    if (patch.hidden === false && !confirm("Publish the selected photos? Confirm they are approved for public use.")) return;
    const ids = Array.from(selected);
    const { error } = await supabase.from("images").update(patch).in("id", ids);
    if (error) return toast.error(error.message);
    toast.success(`Updated ${ids.length} photograph(s)`);
    setSelected(new Set());
    qc.invalidateQueries({ queryKey: ["images"] });
    qc.invalidateQueries({ queryKey: ["photo"] });
    qc.invalidateQueries({ queryKey: ["taxonomy"] });
  }

  async function bulkDelete() {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} photograph(s)? This cannot be undone.`)) return;
    const ids = Array.from(selected);
    const { error } = await supabase.from("images").delete().in("id", ids);
    if (error) return toast.error(error.message);
    toast.success(`Deleted ${ids.length} photograph(s)`);
    setSelected(new Set());
    qc.invalidateQueries({ queryKey: ["images"] });
    qc.invalidateQueries({ queryKey: ["photo"] });
    qc.invalidateQueries({ queryKey: ["taxonomy"] });
  }

  const categoriesForFilter = new Map<string, string>();
  for (const photo of bundled.data ?? []) {
    if (photo.categories.slug && photo.categories.name) categoriesForFilter.set(photo.categories.slug, photo.categories.name);
  }
  for (const category of categories) categoriesForFilter.set(category.slug, category.name);

  return (
    <div data-owner-uploads="enabled">
      <header className="mb-6">
        <h1 className="font-display text-4xl">Media Library</h1>
        <p className="mt-2 text-sm text-muted-foreground">Website photos and gallery drafts. Find customer originals under Jobs.</p>
      </header>
      <PhotoUploadPanel />

      <div className="mb-4 flex flex-wrap gap-2" aria-label="Photo source">
        {([["all", "All photos"], ["managed", "Managed uploads"], ["bundled", "Website archive"]] as const).map(([id, label]) => (
          <button key={id} type="button" aria-pressed={source === id}
            onClick={() => { setSource(id); setSelected(new Set()); setLimit(48); }}
            className={source === id ? "studio-primary" : "studio-secondary"}>{label}</button>
        ))}
      </div>
      {source !== "bundled" && managed.isError && <p role="alert" className="mb-4 text-sm text-destructive">Managed uploads couldn’t load. <button className="underline" onClick={() => void managed.refetch()}>Try again</button></p>}
      {source !== "managed" && bundled.isError && <p role="alert" className="mb-4 text-sm text-destructive">The website archive couldn’t load. <button className="underline" onClick={() => void bundled.refetch()}>Try again</button></p>}
      {/* Filter + search bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={filterCat}
          aria-label="Filter by gallery category"
          onChange={(e) => { setFilterCat(e.target.value); setSelected(new Set()); setLimit(48); }}
          className="border border-onyx/15 px-3 py-2 text-sm bg-cream"
        >
          <option value="">All categories</option>
          {[...categoriesForFilter].map(([slug, name]) => <option key={slug} value={slug}>{name}</option>)}
        </select>
        <div className="relative flex-1 min-w-[220px]">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            aria-label="Search photos"
            onChange={(e) => { setSearch(e.target.value); setSelected(new Set()); setLimit(48); }}
            placeholder="Search title, caption, tag…"
            className="w-full border border-onyx/15 pl-9 pr-3 py-2 text-sm bg-cream"
          />
        </div>
        <button
          onClick={toggleSelectAll}
          disabled={!selectable.length}
          className="text-xs inline-flex items-center gap-2 border border-onyx/15 px-3 py-2 hover:border-gold"
        >
          {allSelectedOnPage ? <CheckSquare className="size-4" /> : <Square className="size-4" />}
          {allSelectedOnPage ? "Unselect shown" : "Select managed photos shown"}
        </button>
        <p className="text-xs text-muted-foreground ml-auto">{filtered.length} photograph(s)</p>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="sticky top-2 z-10 bg-onyx text-cream flex flex-wrap items-center gap-3 px-4 py-3 mb-4 shadow-lg">
          <span className="eyebrow">{selected.size} selected</span>
          <button
            onClick={() => bulkUpdate({ featured: true })}
            className="text-xs px-3 py-1.5 border border-cream/30 hover:bg-cream hover:text-onyx inline-flex items-center gap-1"
          >
            <Star className="size-3" /> Feature
          </button>
          <button
            onClick={() => bulkUpdate({ featured: false })}
            className="text-xs px-3 py-1.5 border border-cream/30 hover:bg-cream hover:text-onyx"
          >
            Unfeature
          </button>
          <button
            onClick={() => bulkUpdate({ hidden: true })}
            className="text-xs px-3 py-1.5 border border-cream/30 hover:bg-cream hover:text-onyx inline-flex items-center gap-1"
          >
            <EyeOff className="size-3" /> Hide
          </button>
          <button
            onClick={() => bulkUpdate({ hidden: false })}
            className="text-xs px-3 py-1.5 border border-cream/30 hover:bg-cream hover:text-onyx inline-flex items-center gap-1"
          >
            <Eye className="size-3" /> Show
          </button>
          <BulkAssign categories={categories} onApply={(patch) => bulkUpdate(patch)} />
          <button
            onClick={bulkDelete}
            className="text-xs px-3 py-1.5 bg-destructive/80 hover:bg-destructive inline-flex items-center gap-1 ml-auto"
          >
            <Trash2 className="size-3" /> Delete
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-xs px-2 py-1.5 hover:opacity-70"
            aria-label="Clear selection"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {shown.map((img: any) => {
          const isSelected = selected.has(img.id);
          return (
            <div
              key={`${img.bundled ? "archive" : "managed"}-${img.id}`}
              className={`relative group overflow-hidden rounded-xl bg-white border ${isSelected ? "border-gold ring-2 ring-gold" : "border-onyx/10"}`}
            >
              <button
                aria-label={`Preview ${img.title || "photograph"}`}
                className="block w-full"
                onClick={() => setViewing(img)}
              >
                <img
                  src={variantUrl(img, "thumbnail")}
                  alt={img.alt_text || img.title || ""}
                  loading="lazy"
                  decoding="async"
                  width={400}
                  height={400}
                  className={`w-full aspect-square object-cover ${img.hidden ? "opacity-40" : ""}`}
                  style={{ backgroundColor: img.dominant_color ?? "#e8e2d4" }}
                />
              </button>
              {!img.bundled && <button
                onClick={() => toggleOne(img.id)}
                aria-label={isSelected ? "Unselect" : "Select"}
                className={`absolute top-2 left-2 size-6 flex items-center justify-center rounded-sm border ${isSelected ? "bg-gold border-gold text-cream" : "bg-cream/90 border-onyx/20 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"} transition-opacity`}
              >
                {isSelected && <CheckSquare className="size-3.5" />}
              </button>}
              <div className="p-3 text-xs">
                <p className="truncate font-medium">{img.title || "Untitled"}</p>
                <p className="text-muted-foreground truncate text-[10px]">
                  {img.categories?.name}
                  {img.subcategories?.name ? ` · ${img.subcategories.name}` : ""}
                  {img.theme ? ` · ${img.theme}` : ""}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  {img.hidden ? <span className="text-muted-foreground">Draft or hidden</span> : <>
                  {img.bundled && <span className="text-muted-foreground">Website archive</span>}
                  <a
                    href={publicPhotoPath(img.short_id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[10px] text-muted-foreground truncate hover:text-gold"
                  >
                    {img.bundled ? "Open" : `/photo/${img.short_id}`}
                  </a>
                  <button
                    title="Copy public link"
                    onClick={() => copyPublicLink(img.short_id)}
                    className="ml-auto inline-flex items-center gap-1 border border-onyx/15 px-2 py-1 text-[10px] hover:border-gold hover:text-gold"
                  >
                    <Link2 className="size-3" /> Copy link
                  </button>
                  </>}
                </div>
              </div>
              {!img.bundled && <div className="absolute top-2 right-2 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity">
                <button
                  title="Edit"
                  onClick={() => setEditing(img)}
                  className="p-1.5 rounded bg-cream/90 text-onyx hover:bg-onyx hover:text-cream"
                >
                  <Pencil className="size-3" />
                </button>
                <button
                  title="Feature"
                  onClick={() => updateImage(img.id, { featured: !img.featured })}
                  className={`p-1.5 rounded ${img.featured ? "bg-gold text-cream" : "bg-cream/90 text-onyx"} hover:bg-gold hover:text-cream`}
                >
                  <Star className="size-3" />
                </button>
                <button
                  title={img.hidden ? "Publish photo" : "Hide photo"}
                  onClick={() => updateImage(img.id, { hidden: !img.hidden })}
                  className="p-1.5 rounded bg-cream/90 text-onyx hover:bg-onyx hover:text-cream"
                >
                  {img.hidden ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                </button>
                <button
                  title="Delete"
                  onClick={() => deleteImage(img.id)}
                  className="p-1.5 rounded bg-cream/90 text-destructive hover:bg-destructive hover:text-cream"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>}
              {img.featured && !img.hidden && (
                <span className="absolute top-2 right-2 group-hover:hidden eyebrow bg-gold text-cream px-2 py-1">
                  Featured
                </span>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length > limit && <button type="button" className="studio-secondary mt-4" onClick={() => setLimit(limit + 48)}>Show more photos</button>}
      {filtered.length === 0 && (
        <div className="text-center py-24 text-muted-foreground border border-dashed border-onyx/20">
          <p className="font-display text-2xl mb-2">{managed.isLoading || bundled.isLoading ? "Loading photos…" : "No photographs match"}</p>
          <p className="text-sm">{search || filterCat ? "Try clearing the search or category filter." : "Choose photos above to start a new batch."}</p>
        </div>
      )}

      {viewing && (
        <div
          role="dialog"
          aria-label="Photo preview"
          className="fixed inset-0 z-[130] bg-black/90 grid place-items-center p-6"
          onClick={() => setViewing(null)}
        >
          <button
            className="absolute top-4 right-4 text-white p-3"
            onClick={() => setViewing(null)}
          >
            Close preview
          </button>
          <img
            src={variantUrl(viewing, "original")}
            alt={viewing.alt_text || viewing.title || "Photo preview"}
            className="max-w-full max-h-[85vh] object-contain"
          />
        </div>
      )}
      {editing && (
        <EditDialog
          img={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSave={async (patch: any) => {
            if (await updateImage(editing.id, patch)) setEditing(null);
          }}
          onReplaced={(image: any) => {
            setEditing(image);
            qc.invalidateQueries({ queryKey: ["images"] });
            qc.invalidateQueries({ queryKey: ["photo"] });
            qc.invalidateQueries({ queryKey: ["taxonomy"] });
          }}
        />
      )}
    </div>
  );
}

function EditDialog({ img, categories, onClose, onSave, onReplaced }: any) {
  const [title, setTitle] = useState(img.title ?? "");
  const [caption, setCaption] = useState(img.caption ?? "");
  const [altText, setAltText] = useState(img.alt_text ?? "");
  const [description, setDescription] = useState(img.description ?? "");
  const [categoryId, setCategoryId] = useState(img.category_id ?? "");
  const [subcategoryId, setSubcategoryId] = useState(img.subcategory_id ?? "");
  const [tags, setTags] = useState((img.tags ?? []).join(", "));
  const [theme, setTheme] = useState(img.theme ?? "");
  const [displayOrder, setDisplayOrder] = useState(img.display_order ?? 0);

  const { data: subs = [] } = useQuery({
    queryKey: ["subs-for-edit", categoryId],
    queryFn: async () => {
      if (!categoryId) return [];
      const { data } = await supabase
        .from("subcategories")
        .select("*")
        .eq("category_id", categoryId)
        .order("display_order");
      return data ?? [];
    },
    enabled: !!categoryId,
  });

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[130] bg-onyx/70 flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-cream max-w-2xl w-full max-h-[90vh] overflow-auto"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-onyx/10">
          <p className="eyebrow text-gold">Edit photograph</p>
          <button onClick={onClose}>
            <X className="size-4" />
          </button>
        </div>
        <div className="grid md:grid-cols-2 gap-0">
          <div>
            <img
              src={variantUrl(img, "large")}
              alt={img.alt_text || "Current photo"}
              className="w-full h-64 object-contain"
            />
            <ReplacePhoto image={img} onReplaced={onReplaced} />
          </div>
          <div className="p-6 space-y-3 text-sm">
            <label className="block">
              <span className="eyebrow text-muted-foreground block mb-1">
                Title (shown to visitors)
              </span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-onyx/15 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="eyebrow text-muted-foreground block mb-1">Caption</span>
              <input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full border border-onyx/15 px-3 py-2"
                placeholder="Short line under the photo"
              />
            </label>
            <label className="block">
              <span className="eyebrow text-muted-foreground block mb-1">
                Alt text (SEO / accessibility)
              </span>
              <input
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                className="w-full border border-onyx/15 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="eyebrow text-muted-foreground block mb-1">
                Description (internal notes)
              </span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full border border-onyx/15 px-3 py-2"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="eyebrow text-muted-foreground block mb-1">Category</span>
                <select
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value);
                    setSubcategoryId("");
                  }}
                  className="w-full border border-onyx/15 px-3 py-2 bg-white"
                >
                  <option value="">—</option>
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="eyebrow text-muted-foreground block mb-1">Subcategory</span>
                <select
                  value={subcategoryId}
                  onChange={(e) => setSubcategoryId(e.target.value)}
                  className="w-full border border-onyx/15 px-3 py-2 bg-white"
                >
                  <option value="">—</option>
                  {subs.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block">
              <span className="eyebrow text-muted-foreground block mb-1">Theme (optional)</span>
              <input
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full border border-onyx/15 px-3 py-2"
                placeholder="e.g. Princess Theme"
              />
            </label>
            <label className="block">
              <span className="eyebrow text-muted-foreground block mb-1">
                Public link (permanent)
              </span>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={`/photo/${img.short_id}`}
                  className="w-full border border-onyx/15 px-3 py-2 font-mono text-xs bg-white/60"
                />
                <button
                  onClick={() => copyPublicLink(img.short_id)}
                  className="px-3 py-2 text-xs uppercase tracking-widest border border-onyx/15 hover:border-gold"
                >
                  Copy
                </button>
              </div>
            </label>
            <label className="block">
              <span className="eyebrow text-muted-foreground block mb-1">
                Tags (comma separated)
              </span>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full border border-onyx/15 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="eyebrow text-muted-foreground block mb-1">Display order</span>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Number(e.target.value))}
                className="w-full border border-onyx/15 px-3 py-2"
              />
            </label>
            <div className="flex justify-end gap-2 pt-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs uppercase tracking-widest border border-onyx/15"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  onSave({
                    title: title.trim() || null,
                    caption: caption.trim() || null,
                    alt_text: altText.trim() || null,
                    description: description.trim() || null,
                    category_id: categoryId || null,
                    subcategory_id: subcategoryId || null,
                    theme: theme.trim() || null,
                    tags: tags
                      .split(",")
                      .map((t: string) => t.trim())
                      .filter(Boolean),
                    display_order: displayOrder,
                  })
                }
                className="px-4 py-2 text-xs uppercase tracking-widest bg-onyx text-cream hover:bg-gold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Assign a category (and a matching subcategory) to every selected photograph. */
function BulkAssign({ categories, onApply }: { categories: any[]; onApply: (patch: any) => void }) {
  const [cat, setCat] = useState("");
  const [sub, setSub] = useState("");

  const { data: subs = [] } = useQuery({
    queryKey: ["subs-for-bulk", cat],
    queryFn: async () => {
      if (!cat) return [];
      const { data } = await supabase
        .from("subcategories")
        .select("*")
        .eq("category_id", cat)
        .order("display_order");
      return data ?? [];
    },
    enabled: !!cat,
  });

  return (
    <div className="flex items-center gap-2">
      <label className="sr-only" htmlFor="bulk-cat">
        Assign category
      </label>
      <select
        id="bulk-cat"
        value={cat}
        onChange={(e) => {
          setCat(e.target.value);
          setSub("");
        }}
        className="text-xs bg-onyx border border-cream/30 px-2 py-1.5 text-cream"
      >
        <option value="">Move to category…</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id} className="text-onyx">
            {c.name}
          </option>
        ))}
      </select>
      <label className="sr-only" htmlFor="bulk-sub">
        Assign subcategory
      </label>
      <select
        id="bulk-sub"
        value={sub}
        onChange={(e) => setSub(e.target.value)}
        disabled={!cat}
        className="text-xs bg-onyx border border-cream/30 px-2 py-1.5 text-cream disabled:opacity-40"
      >
        <option value="">Subcategory…</option>
        {subs.map((s: any) => (
          <option key={s.id} value={s.id} className="text-onyx">
            {s.name}
          </option>
        ))}
      </select>
      <button
        onClick={() => cat && onApply({ category_id: cat, subcategory_id: sub || null })}
        disabled={!cat}
        className="text-xs px-3 py-1.5 border border-cream/30 hover:bg-cream hover:text-onyx disabled:opacity-40"
      >
        Apply
      </button>
    </div>
  );
}
