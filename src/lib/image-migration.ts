/**
 * One-time migration: convert already-uploaded originals into optimized WebP
 * variants. Runs in the admin browser tab (no native image tooling exists in
 * the Cloudflare Worker runtime). Resumable and failure-tolerant.
 */
import { supabase } from "@/integrations/supabase/client";
import {
  BUCKET,
  isOptimized,
  optimizeAndUpload,
  parseVariants,
  removeStoragePaths,
  type ImageVariants,
} from "@/lib/images";

export type MigratableImage = {
  id: string;
  category_id: string | null;
  storage_path: string | null;
  image_url: string;
  thumbnail_url: string | null;
  bytes: number | null;
  variants: unknown;
  optimized_at: string | null;
  title: string | null;
};

export type JournalEntry = {
  id: string;
  at: string;
  previous: {
    storage_path: string | null;
    image_url: string;
    thumbnail_url: string | null;
    bytes: number | null;
  };
  next: {
    storage_path: string;
    bytes: number;
  };
};

export type MigrationFailure = { id: string; title: string | null; reason: string };

export type MigrationReport = {
  processed: number;
  skipped: number;
  failed: MigrationFailure[];
  bytesBefore: number;
  bytesAfter: number;
  journal: JournalEntry[];
};

export const emptyReport = (): MigrationReport => ({
  processed: 0,
  skipped: 0,
  failed: [],
  bytesBefore: 0,
  bytesAfter: 0,
  journal: [],
});

export async function fetchMigratableImages(): Promise<MigratableImage[]> {
  const { data, error } = await supabase
    .from("images")
    .select("id, category_id, storage_path, image_url, thumbnail_url, bytes, variants, optimized_at, title")
    .order("bytes", { ascending: false, nullsFirst: false })
    .limit(2000);
  if (error) throw error;
  return (data ?? []) as MigratableImage[];
}

/** Only rows that still point at a raw original inside our own bucket. */
export function pendingImages(rows: MigratableImage[]): MigratableImage[] {
  return rows.filter((r) => !isOptimized(r) && !!r.storage_path && !!r.category_id);
}

async function downloadOriginal(row: MigratableImage): Promise<Blob> {
  if (row.storage_path) {
    const { data, error } = await supabase.storage.from(BUCKET).download(row.storage_path);
    if (!error && data) return data;
  }
  const res = await fetch(row.image_url);
  if (!res.ok) throw new Error(`could not download original (${res.status})`);
  return await res.blob();
}

/**
 * Migrate one image. Deletes the oversized original only after the new
 * variants are uploaded, verified and the database row is updated.
 */
export async function migrateOne(row: MigratableImage): Promise<JournalEntry> {
  if (!row.category_id) throw new Error("no category");
  if (!row.storage_path) throw new Error("no stored file");

  const original = await downloadOriginal(row);
  const result = await optimizeAndUpload(original, row.category_id, row.id);

  const { error: updErr } = await supabase
    .from("images")
    .update({
      variants: JSON.parse(JSON.stringify(result.variants)),
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      dominant_color: result.dominant_color,
      storage_path: result.storage_path,
      image_url: result.image_url,
      thumbnail_url: result.thumbnail_url,
      optimized_at: new Date().toISOString(),
    })
    .eq("id", row.id);
  if (updErr) throw new Error(updErr.message);

  const newPaths = new Set(
    Object.values(result.variants as ImageVariants)
      .filter((v): v is NonNullable<typeof v> => Boolean(v))
      .map((v) => v.path),
  );
  if (!newPaths.has(row.storage_path)) {
    await removeStoragePaths([row.storage_path]);
  }

  return {
    id: row.id,
    at: new Date().toISOString(),
    previous: {
      storage_path: row.storage_path,
      image_url: row.image_url,
      thumbnail_url: row.thumbnail_url,
      bytes: row.bytes,
    },
    next: { storage_path: result.storage_path, bytes: result.bytes },
  };
}

/** Re-point a record at its pre-migration values (record-level rollback). */
export async function revertFromJournal(entry: JournalEntry): Promise<void> {
  const { error } = await supabase
    .from("images")
    .update({
      storage_path: entry.previous.storage_path,
      image_url: entry.previous.image_url,
      thumbnail_url: entry.previous.thumbnail_url,
      bytes: entry.previous.bytes,
      variants: null,
      optimized_at: null,
    })
    .eq("id", entry.id);
  if (error) throw new Error(error.message);
}

export function storageSummary(rows: MigratableImage[]): {
  count: number;
  totalBytes: number;
  optimized: number;
  pending: number;
  averageBytes: number;
} {
  const totalBytes = rows.reduce((acc, r) => acc + (r.bytes ?? 0), 0);
  const optimized = rows.filter((r) => isOptimized(r)).length;
  return {
    count: rows.length,
    totalBytes,
    optimized,
    pending: rows.length - optimized,
    averageBytes: rows.length ? Math.round(totalBytes / rows.length) : 0,
  };
}

export function variantCount(row: MigratableImage): number {
  return Object.keys(parseVariants(row.variants)).length;
}
