import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CloudUpload, FolderOpen, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { optimizeAndUpload, removeStoragePaths, validatePhoto } from "@/lib/images";
import { framingTag, suggestPhotoMetadata, suggestPhotoSubcategory } from "@/lib/photo-suggestions";
import { adminCategoriesQuery } from "@/lib/queries";
import type { Database } from "@/integrations/supabase/types";

type PhotoState = "queued" | "preparing" | "saving" | "saved" | "failed" | "invalid";
type Optimized = Awaited<ReturnType<typeof optimizeAndUpload>>;
type Entry = {
  id: string;
  file: File | null;
  name: string;
  preview: string;
  key: string;
  categoryId: string;
  suggestedLabel: string;
  suggestedText: string;
  subcategoryId: string | null;
  tags: string[];
  state: PhotoState;
  message: string;
  published?: boolean;
};
type Patch = Partial<Pick<Entry, "categoryId" | "subcategoryId" | "tags">>;
type Queue = {
  items: Entry[];
  busy: boolean;
  add: (files: FileList | File[]) => void;
  edit: (id: string, patch: Patch) => void;
  setBatch: (categoryId: string, subcategoryId: string | null) => void;
  discard: (id: string) => void;
  run: (publish: boolean) => Promise<void>;
};
const QueueContext = createContext<Queue | null>(null);
const isEditable = (item: Entry) => item.state === "queued" || item.state === "failed";

export function PhotoUploadProvider({ children }: { children: ReactNode }) {
  const { data: categories = [] } = useQuery(adminCategoriesQuery);
  const uploadCategories = categories.filter((category) => !category.hidden && !category.archived_at);
  const client = useQueryClient();
  const [items, setItems] = useState<Entry[]>([]);
  const [busy, setBusy] = useState(false);
  const current = useRef<Entry[]>([]);
  const running = useRef(false);
  const uploaded = useRef(new Map<string, { categoryId: string; photo: Optimized; writeStarted: boolean }>());
  const urls = useRef(new Set<string>());
  const activeUser = useRef(true);

  function set(next: Entry[]) {
    current.current = next;
    setItems(next);
  }

  useEffect(() => {
    activeUser.current = true;
    return () => {
      activeUser.current = false;
      for (const url of urls.current) URL.revokeObjectURL(url);
      urls.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!items.some((item) => item.state !== "saved" && item.state !== "invalid")) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [items]);

  function add(files: FileList | File[]) {
    if (running.current) return;
    const seen = new Set(current.current.map((item) => item.key));
    const next: Entry[] = [];
    for (const file of Array.from(files)) {
      const key = [file.webkitRelativePath || file.name, file.size, file.lastModified].join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      const suggestion = suggestPhotoMetadata(file.name, file.webkitRelativePath, uploadCategories);
      let preview = "";
      let message = "";
      try {
        validatePhoto(file);
        preview = URL.createObjectURL(file);
        urls.current.add(preview);
      } catch (error) {
        message = error instanceof Error ? error.message : "This file could not be selected";
      }
      next.push({
        id: crypto.randomUUID(), file: message ? null : file, name: file.name, preview, key, categoryId: suggestion.categoryId,
        suggestedLabel: suggestion.categoryLabel, suggestedText: suggestion.text,
        subcategoryId: null, tags: suggestion.tags, state: message ? "invalid" : "queued", message,
      });
    }
    set([...current.current, ...next]);
    if (!next.length && files.length) toast.info("These files are already in the upload batch.");
  }

  function edit(id: string, patch: Patch) {
    if (!running.current) {
      set(current.current.map((item) => item.id === id && isEditable(item) ? { ...item, ...patch } : item));
    }
  }

  function setBatch(categoryId: string, subcategoryId: string | null) {
    if (!running.current && categoryId) {
      set(current.current.map((item) => isEditable(item) ? { ...item, categoryId, subcategoryId } : item));
    }
  }

  function discard(id: string) {
    if (running.current) return;
    const item = current.current.find((entry) => entry.id === id);
    if (item?.preview) {
      URL.revokeObjectURL(item.preview);
      urls.current.delete(item.preview);
    }
    // A failed response can still mean the row committed. Leave those objects intact.
    uploaded.current.delete(id);
    set(current.current.filter((entry) => entry.id !== id));
  }

  function status(id: string, state: PhotoState, message = "", published?: boolean) {
    if (activeUser.current) {
      set(current.current.map((item) => {
        if (item.id !== id) return item;
        if (state !== "saved") return { ...item, state, message, published };
        URL.revokeObjectURL(item.preview);
        urls.current.delete(item.preview);
        return { ...item, state, message, published, file: null, preview: "" };
      }));
    }
  }

  async function run(publish: boolean) {
    if (running.current) return;
    const ready = current.current.filter((item) => isEditable(item) && item.categoryId);
    if (!ready.length) return;
    running.current = true;
    setBusy(true);
    const categoryOptions = new Map<string, Awaited<ReturnType<typeof subcategoriesFor>>>();
    try {
      for (const item of ready) {
        if (!activeUser.current) break;
        status(item.id, "preparing");
        try {
          // This ID survives retries, including a response lost after the DB insert.
          let previous = uploaded.current.get(item.id);
          if (previous?.writeStarted) {
            const existing = await supabase.from("images").select("hidden").eq("id", item.id).maybeSingle();
            if (existing.error) throw existing.error;
            if (existing.data) {
              uploaded.current.delete(item.id);
              status(item.id, "saved", "", !existing.data.hidden);
              continue;
            }
          }
          if (previous && previous.categoryId !== item.categoryId) {
            await removeStoragePaths(Object.values(previous.photo.variants).map((variant) => variant.path));
            uploaded.current.delete(item.id);
            previous = undefined;
          }
          if (!previous) {
            if (!item.file) throw new Error("Select the photo again before retrying.");
            const photo = await optimizeAndUpload(item.file, item.categoryId, item.id);
            previous = { categoryId: item.categoryId, photo, writeStarted: false };
            uploaded.current.set(item.id, previous);
          }
          if (!activeUser.current) break;
          const photo = previous.photo;
          status(item.id, "saving");
          let subcategoryId = item.subcategoryId;
          if (subcategoryId === null) {
            if (!categoryOptions.has(item.categoryId)) {
              categoryOptions.set(item.categoryId, await subcategoriesFor(item.categoryId));
            }
            subcategoryId = suggestPhotoSubcategory(item.suggestedText, categoryOptions.get(item.categoryId) ?? [])?.id ?? "";
          }
          // Use standard taxonomy and image geometry for public tags. Never publish filenames.
          const row: Database["public"]["Tables"]["images"]["Insert"] = {
            id: item.id,
            category_id: item.categoryId,
            subcategory_id: subcategoryId || null,
            tags: [...new Set([...item.tags, framingTag(photo.width, photo.height)])],
            ...photo,
            variants: JSON.parse(JSON.stringify(photo.variants)),
            optimized_at: new Date().toISOString(),
            hidden: !publish,
          };
          if (!activeUser.current) break;
          previous.writeStarted = true;
          const { error } = await supabase.from("images").insert(row);
          if (error) throw error;
          uploaded.current.delete(item.id);
          status(item.id, "saved", "", publish);
        } catch (error) {
          const message = typeof error === "object" && error && "message" in error
            ? String(error.message) : "The photo could not be saved";
          status(item.id, "failed", message);
        }
      }
    } finally {
      running.current = false;
      if (activeUser.current) setBusy(false);
      void client.invalidateQueries({ queryKey: ["images"] });
      void client.invalidateQueries({ queryKey: ["photo"] });
      void client.invalidateQueries({ queryKey: ["taxonomy"] });
    }
  }

  return (
    <QueueContext.Provider value={{ items, busy, add, edit, setBatch, discard, run }}>
      {children}
    </QueueContext.Provider>
  );
}

export function usePhotoUpload() {
  const state = useContext(QueueContext);
  if (!state) throw new Error("Photo uploads require the studio workspace");
  return state;
}

async function subcategoriesFor(categoryId: string) {
  const { data, error } = await supabase.from("subcategories").select("id,name,slug")
    .eq("category_id", categoryId).eq("hidden", false).is("archived_at", null).order("display_order");
  if (error) throw error;
  return data ?? [];
}

const STATUS: Record<PhotoState, string> = {
  queued: "Ready to review", preparing: "Preparing web copies", saving: "Saving to gallery",
  saved: "Saved", failed: "Needs retry", invalid: "Unsupported file",
};

export function PhotoUploadPanel() {
  const { items, busy, add, edit, setBatch, discard, run } = usePhotoUpload();
  const categories = useQuery(adminCategoriesQuery);
  const uploadCategories = categories.data?.filter((category) => !category.hidden && !category.archived_at);
  const [batch, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState<string | null>(null);
  const [approved, setApproved] = useState(false);
  const [folderSupported] = useState(() => "webkitdirectory" in document.createElement("input"));
  const subcategories = useQuery({
    queryKey: ["photo-upload-subcategories", batch],
    queryFn: () => subcategoriesFor(batch),
    enabled: Boolean(batch),
  });
  const fileInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);
  const pending = items.filter(isEditable);
  const ready = pending.filter((item) => item.categoryId);
  const saved = items.filter((item) => item.state === "saved").length;
  const failed = items.filter((item) => item.state === "failed").length;
  const invalid = items.filter((item) => item.state === "invalid").length;
  const retrying = ready.length > 0 && ready.every((item) => item.state === "failed");

  return (
    <section className="studio-panel mb-6" id="photo-upload" aria-labelledby="upload-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="upload-title" className="text-xl font-semibold">Add gallery photos</h2>
          <p className="mt-1 text-sm text-muted-foreground">Suggestions use filenames, folder names and photo shape on this device.</p>
        </div>
        <div className="flex gap-2">
          <button className="studio-secondary" type="button" disabled={busy || categories.isPending} onClick={() => folderInput.current?.click()} hidden={!folderSupported}><FolderOpen className="size-4" /> Add folder</button>
          <button className="studio-primary" type="button" disabled={busy || categories.isPending} onClick={() => fileInput.current?.click()}><ImagePlus className="size-4" /> Choose photos</button>
        </div>
      </div>
      <input ref={fileInput} type="file" multiple accept="image/jpeg,image/png,image/webp" hidden onChange={(event) => {
        if (event.currentTarget.files) add(event.currentTarget.files);
        event.currentTarget.value = "";
        setApproved(false);
      }} />
      <input ref={folderInput} type="file" multiple hidden
        {...{ webkitdirectory: "" }}
        onChange={(event) => {
          if (event.currentTarget.files) add(event.currentTarget.files);
          event.currentTarget.value = "";
          setApproved(false);
        }} />
      {!items.length && <div onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
        event.preventDefault();
        add(event.dataTransfer.files);
        setApproved(false);
      }} className="mt-4 rounded-xl border border-dashed border-onyx/20 bg-onyx/[0.02] px-4 py-7 text-center text-sm text-muted-foreground">
        <CloudUpload aria-hidden className="mx-auto mb-2 size-6" /> Drop JPG, PNG or WebP files here. Up to 25 MB per photo.
      </div>}
      {categories.isError && <p role="alert" className="mt-3 text-sm text-destructive">Categories couldn’t load. <button className="underline" onClick={() => void categories.refetch()}>Try again</button></p>}
      {pending.length > 1 && <div className="mt-5 flex flex-wrap items-end gap-2">
        <label className="grid gap-1 text-xs font-medium">Batch category
          <select className="studio-field" value={batch} disabled={busy} onChange={(event) => { setCategory(event.target.value); setSubcategory(null); }}>
            <option value="">Choose category</option>
            {uploadCategories?.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
          </select>
        </label>
        {batch && <label className="grid gap-1 text-xs font-medium">Batch subcategory
          <select className="studio-field" value={subcategory ?? "auto"} disabled={busy} onChange={(event) => setSubcategory(event.target.value === "auto" ? null : event.target.value)}>
            <option value="auto">Suggest from names</option>
            <option value="">No subcategory</option>
            {subcategories.data?.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
          </select>
        </label>}
        <button type="button" className="studio-secondary" disabled={!batch || busy} onClick={() => setBatch(batch, subcategory)}>Apply to pending photos</button>
      </div>}
      {items.length > 0 && <>
        <p className="my-3 text-sm text-muted-foreground" role="status">{saved} saved · {failed} need retry · {pending.length - ready.length} need a category{invalid ? ` · ${invalid} unsupported` : ""}</p>
        <ul className="max-h-[32rem] divide-y divide-onyx/10 overflow-auto rounded-xl border border-onyx/10">
          {items.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center gap-3 p-3">
              {item.preview && <img className="size-12 rounded-md object-cover" src={item.preview} alt="" loading="lazy" />}
              <div className="min-w-0 basis-32 flex-1">
                <p className="truncate text-sm font-medium" title={item.name}>{item.name}</p>
                <p className={`text-xs ${item.message ? "text-destructive" : "text-muted-foreground"}`}>
                  {item.published ? "Published" : item.state === "saved" ? "Saved as draft" : STATUS[item.state]}
                  {item.message && ` · ${item.message}`}
                  {item.state === "queued" && item.suggestedLabel && ` · Suggested ${item.suggestedLabel}`}
                </p>
              </div>
              {isEditable(item) && <div className="flex flex-wrap gap-2">
                <select className="studio-field" aria-label={`Category for ${item.name}`} disabled={busy} value={item.categoryId}
                  onChange={(event) => edit(item.id, { categoryId: event.target.value, subcategoryId: null })}>
                  <option value="">Choose category</option>
                  {uploadCategories?.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
                </select>
                <PhotoTagField item={item} disabled={busy} onChange={(tags) => edit(item.id, { tags })} />
              </div>}
              <button type="button" className="studio-icon" aria-label={`Dismiss ${item.name}`} disabled={busy} onClick={() => discard(item.id)}><X className="size-4" /></button>
            </li>
          ))}
        </ul>
        {pending.length > 0 && <div className="mt-4 flex flex-wrap items-center gap-3">
          <button className="studio-primary" type="button" disabled={busy || !ready.length} onClick={() => void run(false)}>
            {busy ? "Saving photos…" : retrying ? `Retry ${ready.length} as drafts` : `Save ${ready.length} as drafts`}
          </button>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={approved} disabled={busy}
            onChange={(event) => setApproved(event.target.checked)} /> Approved for the public portfolio</label>
          <button className="studio-secondary" type="button" disabled={busy || !ready.length || !approved}
            onClick={() => { setApproved(false); void run(true); }}>Publish {ready.length}</button>
        </div>}
      </>}
    </section>
  );
}

function PhotoTagField({ item, onChange, disabled }: { item: Entry; onChange: (tags: string[]) => void; disabled: boolean }) {
  const [value, setValue] = useState(item.tags.join(", "));
  return (
    <input className="studio-field w-36" value={value} disabled={disabled} placeholder="Optional tags"
      aria-label={`Tags for ${item.name}`}
      onBlur={() => onChange(value.split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 12))}
      onChange={(event) => setValue(event.target.value)} />
  );
}
