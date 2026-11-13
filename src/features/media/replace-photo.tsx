import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { optimizeAndUpload, removeStoragePaths, validatePhoto } from "@/lib/images";
export function ReplacePhoto({
  image,
  onReplaced,
}: {
  image: any;
  onReplaced: (image: any) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  async function replace() {
    if (!file || busy) return;
    setBusy(true);
    let paths: string[] = [];
    let committed = false;
    let databaseWriteStarted = false;
    try {
      const uploaded = await optimizeAndUpload(file, image.category_id, image.id);
      paths = Object.values(uploaded.variants).map((v) => v.path);
      const patch = {
        ...uploaded,
        variants: JSON.parse(JSON.stringify(uploaded.variants)),
        optimized_at: new Date().toISOString(),
      };
      databaseWriteStarted = true;
      const { data, error } = await supabase
        .from("images")
        .update(patch)
        .eq("id", image.id)
        .select("*")
        .single();
      if (error || !data) throw error || new Error("Photo record was not saved");
      committed = true;
      onReplaced({ ...image, ...data });
      setFile(null);
      toast.success("Photo replaced. Its public link is unchanged; previous files were retained.");
    } catch (error) {
      if (!committed && !databaseWriteStarted && paths.length) await removeStoragePaths(paths).catch(() => {});
      toast.error(
        error instanceof Error
          ? error.message
          : "Replacement was not confirmed. Refresh to check the saved photo before retrying.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div data-owner-uploads="enabled" className="p-4 border-t border-onyx/15 space-y-3">
      <p className="text-xs">
        Replace the photo while keeping its title, category and permanent link. Previous files are
        retained in storage.
      </p>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label="Choose replacement photo"
        disabled={busy}
        onChange={(e) => {
          const next = e.target.files?.[0];
          if (next) {
            try {
              validatePhoto(next);
              setFile(next);
            } catch (err) {
              toast.error((err as Error).message);
            }
          }
          e.target.value = "";
        }}
      />
      {preview && (
        <>
          <img src={preview} alt="Replacement preview" className="w-full max-h-64 object-contain" />
          <div className="flex gap-3">
            <button
              disabled={busy}
              onClick={replace}
              className="bg-onyx text-cream px-4 py-3 text-xs"
            >
              {busy ? "Replacing…" : "Use this replacement"}
            </button>
            <button
              disabled={busy}
              onClick={() => setFile(null)}
              className="border px-4 py-3 text-xs"
            >
              Cancel replacement
            </button>
          </div>
        </>
      )}
    </div>
  );
}
