import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, Film, Loader2, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { adminCategoriesQuery, packagesQuery } from "@/lib/queries";
import type { Database } from "@/integrations/supabase/types";
import { adminReelsQuery, uploadReelVideo, type Reel } from "@/lib/reels";
import { optimizeSiteImage } from "@/lib/images";

export const Route = createFileRoute("/admin/reels")({
  head: () => ({ meta: [{ title: "Cinematic Reels — Admin" }] }),
  component: AdminReels,
});

type Draft = Partial<Reel> & { id?: string };

function AdminReels() {
  const qc = useQueryClient();
  const { data: reels = [], isLoading } = useQuery(adminReelsQuery);
  const { data: categories = [] } = useQuery(adminCategoriesQuery);
  const { data: packages = [] } = useQuery(packagesQuery);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const posterInput = useRef<HTMLInputElement>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["reels"] });
  };

  const save = useMutation({
    mutationFn: async (d: Draft) => {
      const payload = {
        title: d.title?.trim() || "Untitled reel",
        description: d.description ?? null,
        video_url: d.video_url ?? null,
        video_path: d.video_path ?? null,
        poster_url: d.poster_url ?? null,
        poster_path: d.poster_path ?? null,
        aspect_ratio: d.aspect_ratio || "9:16",
        category_id: d.category_id || null,
        package_id: d.package_id || null,
        location: d.location ?? null,
        featured: Boolean(d.featured),
        published: Boolean(d.published),
        display_order: d.display_order ?? reels.length,
      };
      if (d.id) {
        const { error } = await supabase.from("reels").update(payload).eq("id", d.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("reels").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Reel saved");
      setDraft(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reels").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reel deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function patch(id: string, values: Database["public"]["Tables"]["reels"]["Update"]) {
    const { error } = await supabase.from("reels").update(values).eq("id", id);
    if (error) toast.error(error.message);
    invalidate();
  }

  async function move(reel: Reel, dir: -1 | 1) {
    const sorted = [...reels].sort((a, b) => a.display_order - b.display_order);
    const i = sorted.findIndex((r) => r.id === reel.id);
    const j = i + dir;
    if (j < 0 || j >= sorted.length) return;
    const other = sorted[j]!;
    await patch(reel.id, { display_order: other.display_order });
    await patch(other.id, { display_order: reel.display_order });
  }

  async function onVideo(file: File) {
    const id = draft?.id ?? crypto.randomUUID();
    setBusy("video");
    try {
      const { path, url } = await uploadReelVideo(id, file);
      setDraft((d) => ({ ...(d ?? {}), id: d?.id, video_path: path, video_url: url }));
      toast.success("Video uploaded");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function onPoster(file: File) {
    setBusy("poster");
    try {
      const url = await optimizeSiteImage(file, "reels");
      setDraft((d) => ({ ...(d ?? {}), poster_url: url }));
      toast.success("Poster uploaded");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const sorted = [...reels].sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl">Cinematic Reels</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload a web-ready 1080p MP4 (keep it under ~30 MB) and a poster image. Posters are optimised
            automatically.
          </p>
        </div>
        <button
          onClick={() => setDraft({ aspect_ratio: "9:16", published: false })}
          className="flex items-center gap-2 px-5 py-2.5 bg-onyx text-cream text-[10px] uppercase tracking-[0.2em]"
        >
          <Plus className="size-4" /> New reel
        </button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : sorted.length === 0 ? (
        <div className="border border-dashed border-onyx/20 p-12 text-center text-muted-foreground">
          <Film className="size-6 mx-auto mb-3 opacity-50" />
          No reels yet. Add your first cinematic film.
        </div>
      ) : (
        <ul className="space-y-3">
          {sorted.map((r) => (
            <li key={r.id} className="flex items-center gap-4 border border-onyx/10 p-3">
              <div className="w-16 h-20 bg-onyx/5 overflow-hidden shrink-0">
                {r.poster_url && <img src={r.poster_url} alt="" className="size-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{r.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  /reel/{r.short_id}
                  {r.categories?.name ? ` · ${r.categories.name}` : ""}
                  {r.packages?.name ? ` · ${r.packages.name}` : ""}
                  {r.video_url ? "" : " · no video yet"}
                </p>
              </div>
              <button
                onClick={() => patch(r.id, { featured: !r.featured })}
                aria-label="Toggle featured"
                className={`p-2 ${r.featured ? "text-gold" : "text-muted-foreground hover:text-onyx"}`}
              >
                <Star className="size-4" />
              </button>
              <button
                onClick={() => patch(r.id, { published: !r.published })}
                className={`text-[10px] uppercase tracking-[0.2em] px-3 py-2 border ${
                  r.published ? "border-gold text-gold" : "border-onyx/20 text-muted-foreground"
                }`}
              >
                {r.published ? "Published" : "Draft"}
              </button>
              <button onClick={() => move(r, -1)} aria-label="Move up" className="p-2 hover:text-gold">
                <ArrowUp className="size-4" />
              </button>
              <button onClick={() => move(r, 1)} aria-label="Move down" className="p-2 hover:text-gold">
                <ArrowDown className="size-4" />
              </button>
              <button onClick={() => setDraft(r)} className="text-[10px] uppercase tracking-[0.2em] px-3 py-2 bg-onyx text-cream">
                Edit
              </button>
              <button
                onClick={() => remove.mutate(r.id)}
                aria-label="Delete reel"
                className="p-2 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {draft && (
        <div className="fixed inset-0 z-50 bg-onyx/40 flex justify-end" onClick={() => setDraft(null)}>
          <div
            className="bg-cream w-full max-w-lg h-full overflow-y-auto p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-2xl">{draft.id ? "Edit reel" : "New reel"}</h2>

            <label className="block text-sm">
              Title
              <input
                value={draft.title ?? ""}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                className="mt-1 w-full border border-onyx/20 px-3 py-2 bg-transparent"
              />
            </label>

            <label className="block text-sm">
              Description
              <textarea
                value={draft.description ?? ""}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                rows={3}
                className="mt-1 w-full border border-onyx/20 px-3 py-2 bg-transparent"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                Service / category
                <select
                  value={draft.category_id ?? ""}
                  onChange={(e) => setDraft({ ...draft, category_id: e.target.value || null })}
                  className="mt-1 w-full border border-onyx/20 px-3 py-2 bg-transparent"
                >
                  <option value="">None</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                Package
                <select
                  value={draft.package_id ?? ""}
                  onChange={(e) => setDraft({ ...draft, package_id: e.target.value || null })}
                  className="mt-1 w-full border border-onyx/20 px-3 py-2 bg-transparent"
                >
                  <option value="">None</option>
                  {packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                Aspect ratio
                <select
                  value={draft.aspect_ratio ?? "9:16"}
                  onChange={(e) => setDraft({ ...draft, aspect_ratio: e.target.value })}
                  className="mt-1 w-full border border-onyx/20 px-3 py-2 bg-transparent"
                >
                  <option value="9:16">Vertical 9:16</option>
                  <option value="4:5">Portrait 4:5</option>
                  <option value="1:1">Square 1:1</option>
                  <option value="16:9">Landscape 16:9</option>
                </select>
              </label>
              <label className="block text-sm">
                Location
                <input
                  value={draft.location ?? ""}
                  onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                  className="mt-1 w-full border border-onyx/20 px-3 py-2 bg-transparent"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm mb-1">Video (web-ready MP4)</p>
                <input
                  ref={videoInput}
                  type="file"
                  accept="video/mp4,video/webm"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onVideo(f);
                  }}
                />
                <button
                  onClick={() => videoInput.current?.click()}
                  className="w-full border border-onyx/20 py-3 text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2"
                >
                  {busy === "video" ? <Loader2 className="size-4 animate-spin" /> : null}
                  {draft.video_url ? "Replace video" : "Upload video"}
                </button>
              </div>
              <div>
                <p className="text-sm mb-1">Poster</p>
                <input
                  ref={posterInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onPoster(f);
                  }}
                />
                <button
                  onClick={() => posterInput.current?.click()}
                  className="w-full border border-onyx/20 py-3 text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2"
                >
                  {busy === "poster" ? <Loader2 className="size-4 animate-spin" /> : null}
                  {draft.poster_url ? "Replace poster" : "Upload poster"}
                </button>
              </div>
            </div>

            {draft.poster_url && (
              <img src={draft.poster_url} alt="" className="w-32 aspect-[9/16] object-cover" />
            )}

            <div className="flex gap-6 pt-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(draft.featured)}
                  onChange={(e) => setDraft({ ...draft, featured: e.target.checked })}
                />
                Featured (hero film)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(draft.published)}
                  onChange={(e) => setDraft({ ...draft, published: e.target.checked })}
                />
                Published
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => save.mutate(draft)}
                disabled={save.isPending || busy !== null}
                className="px-6 py-3 bg-onyx text-cream text-[10px] uppercase tracking-[0.2em] disabled:opacity-50"
              >
                {save.isPending ? "Saving…" : "Save reel"}
              </button>
              <button onClick={() => setDraft(null)} className="px-6 py-3 border border-onyx/20 text-[10px] uppercase tracking-[0.2em]">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
