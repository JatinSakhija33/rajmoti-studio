/**
 * Shared image pipeline: decode -> strip EXIF -> resize -> WebP -> upload.
 *
 * All encoding happens in the browser (Canvas). The server runtime is a
 * Cloudflare Worker where native image libraries (sharp) are unavailable.
 */
import { supabase } from "@/integrations/supabase/client";

export const BUCKET = "gallery";
export function validatePhoto(file: Blob) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("Choose a JPG, PNG or WebP photo.");
  if (!file.size || file.size > 25 * 1024 * 1024)
    throw new Error("Choose a photo between 1 byte and 25 MB.");
}
export const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 10; // 10 years

export type VariantKey = "thumbnail" | "medium" | "large" | "original";

export const VARIANT_WIDTHS: Record<VariantKey, number> = {
  thumbnail: 400,
  medium: 800,
  large: 1600,
  original: 2560,
};

export const VARIANT_ORDER: VariantKey[] = ["thumbnail", "medium", "large", "original"];

export const WEBP_QUALITY: Record<VariantKey, number> = {
  thumbnail: 0.72,
  medium: 0.78,
  large: 0.82,
  original: 0.82,
};

export type StoredVariant = {
  path: string;
  url: string;
  width: number;
  height: number;
  bytes: number;
};

export type ImageVariants = Partial<Record<VariantKey, StoredVariant>>;

export type EncodedVariant = {
  key: VariantKey;
  blob: Blob;
  width: number;
  height: number;
};

export type ProcessedImage = {
  variants: EncodedVariant[];
  width: number;
  height: number;
  dominantColor: string;
  totalBytes: number;
};

/** Minimal shape every gallery consumer relies on. */
export type GalleryImageLike = {
  id?: string;
  image_url: string;
  thumbnail_url?: string | null;
  variants?: unknown;
  width?: number | null;
  height?: number | null;
  dominant_color?: string | null;
  title?: string | null;
  alt_text?: string | null;
  caption?: string | null;
  short_id?: string | null;
};

/* -------------------------------------------------------------------------- */
/* Encoding                                                                    */
/* -------------------------------------------------------------------------- */

function isVariantRecord(v: unknown): v is StoredVariant {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return typeof o["url"] === "string" && typeof o["path"] === "string";
}

/** Safely read the `variants` jsonb column into a typed object. */
export function parseVariants(raw: unknown): ImageVariants {
  if (typeof raw !== "object" || raw === null) return {};
  const src = raw as Record<string, unknown>;
  const out: ImageVariants = {};
  for (const key of VARIANT_ORDER) {
    const v = src[key];
    if (isVariantRecord(v)) {
      out[key] = {
        path: v.path,
        url: v.url,
        width: typeof v.width === "number" ? v.width : 0,
        height: typeof v.height === "number" ? v.height : 0,
        bytes: typeof v.bytes === "number" ? v.bytes : 0,
      };
    }
  }
  return out;
}

async function decode(source: Blob): Promise<ImageBitmap> {
  // `from-image` applies the EXIF orientation; re-encoding then drops all EXIF.
  return createImageBitmap(source, { imageOrientation: "from-image" });
}

function scaledSize(w: number, h: number, maxEdge: number): { width: number; height: number } {
  const longEdge = Math.max(w, h);
  if (longEdge <= maxEdge) return { width: w, height: h };
  const ratio = maxEdge / longEdge;
  return { width: Math.max(1, Math.round(w * ratio)), height: Math.max(1, Math.round(h * ratio)) };
}

function makeCanvas(width: number, height: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  return c;
}

async function canvasToWebp(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", quality),
  );
  if (!blob) throw new Error("This browser could not encode WebP");
  return blob;
}

function readDominantColor(bitmap: ImageBitmap): string {
  const c = makeCanvas(1, 1);
  const ctx = c.getContext("2d");
  if (!ctx) return "#e8e2d4";
  ctx.drawImage(bitmap, 0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  const hex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${hex(r ?? 232)}${hex(g ?? 226)}${hex(b ?? 212)}`;
}

/**
 * Turn any source image (File or downloaded Blob) into the four WebP variants.
 * Never returns the raw original.
 */
export async function processImage(source: Blob): Promise<ProcessedImage> {
  validatePhoto(source);
  const bitmap = await decode(source);
  if (bitmap.width * bitmap.height > 80_000_000) {
    bitmap.close();
    throw new Error("Photo exceeds 80 megapixels. Export a smaller copy first.");
  }
  try {
    const dominantColor = readDominantColor(bitmap);
    const base = scaledSize(bitmap.width, bitmap.height, VARIANT_WIDTHS.original);

    const variants: EncodedVariant[] = [];
    let totalBytes = 0;

    for (const key of VARIANT_ORDER) {
      const size = scaledSize(base.width, base.height, VARIANT_WIDTHS[key]);
      const canvas = makeCanvas(size.width, size.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas is unavailable in this browser");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(bitmap, 0, 0, size.width, size.height);
      const blob = await canvasToWebp(canvas, WEBP_QUALITY[key]);
      totalBytes += blob.size;
      variants.push({ key, blob, width: size.width, height: size.height });
      canvas.width = 0;
      canvas.height = 0;
    }

    return { variants, width: base.width, height: base.height, dominantColor, totalBytes };
  } finally {
    bitmap.close();
  }
}

/* -------------------------------------------------------------------------- */
/* Storage                                                                     */
/* -------------------------------------------------------------------------- */

export function variantPath(categoryId: string, imageId: string, key: VariantKey): string {
  return `${categoryId}/${imageId}/${key}.webp`;
}

async function signPath(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL);
  if (error || !data?.signedUrl)
    throw new Error(error?.message ?? "Could not create link for the uploaded photo");
  return data.signedUrl;
}

/** Uploads every encoded variant and verifies each object exists afterwards. */
export async function uploadVariants(
  categoryId: string,
  imageId: string,
  processed: ProcessedImage,
): Promise<ImageVariants> {
  const stored: ImageVariants = {};

  const uploadedPaths: string[] = [];
  try {
    for (const v of processed.variants) {
      const path = variantPath(categoryId, imageId, v.key);
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, v.blob, {
          cacheControl: "31536000",
          upsert: false,
          contentType: "image/webp",
        });
      if (error) throw new Error(`${v.key}: ${error.message}`);
      uploadedPaths.push(path);
      stored[v.key] = {
        path,
        url: await signPath(path),
        width: v.width,
        height: v.height,
        bytes: v.blob.size,
      };
    }

    await verifyVariants(categoryId, imageId, stored);
    return stored;
  } catch (error) {
    await removeStoragePaths(uploadedPaths).catch(() => {});
    throw error;
  }
}

/** Confirms each variant object is really present in storage. */
export async function verifyVariants(
  categoryId: string,
  imageId: string,
  stored: ImageVariants,
): Promise<void> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(`${categoryId}/${imageId}`, { limit: 20 });
  if (error) throw new Error(`verification failed: ${error.message}`);
  const names = new Set((data ?? []).map((o) => o.name));
  for (const key of VARIANT_ORDER) {
    if (stored[key] && !names.has(`${key}.webp`))
      throw new Error(`verification failed: ${key}.webp missing`);
  }
}

export async function removeStoragePaths(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) throw error;
}

/** Full pipeline for a newly chosen file. Returns row-ready metadata. */
export async function optimizeAndUpload(
  file: Blob,
  categoryId: string,
  imageId: string,
): Promise<{
  variants: ImageVariants;
  width: number;
  height: number;
  bytes: number;
  dominant_color: string;
  storage_path: string;
  image_url: string;
  thumbnail_url: string;
}> {
  const processed = await processImage(file);
  const variants = await uploadVariants(categoryId, `${imageId}/${crypto.randomUUID()}`, processed);
  const original = variants.original;
  const thumb = variants.thumbnail;
  if (!original || !thumb) throw new Error("Optimization did not produce the required sizes");
  return {
    variants,
    width: processed.width,
    height: processed.height,
    bytes: processed.totalBytes,
    dominant_color: processed.dominantColor,
    storage_path: original.path,
    image_url: original.url,
    thumbnail_url: thumb.url,
  };
}

/* -------------------------------------------------------------------------- */
/* Reading — responsive selection                                              */
/* -------------------------------------------------------------------------- */

/** Best URL for a requested size, gracefully falling back on legacy rows. */
export function variantUrl(img: GalleryImageLike, key: VariantKey): string {
  const v = parseVariants(img.variants);
  const exact = v[key];
  if (exact) return exact.url;
  // Fall back through progressively larger sizes, then legacy columns.
  const idx = VARIANT_ORDER.indexOf(key);
  for (let i = idx + 1; i < VARIANT_ORDER.length; i++) {
    const next = v[VARIANT_ORDER[i] as VariantKey];
    if (next) return next.url;
  }
  for (let i = idx - 1; i >= 0; i--) {
    const prev = v[VARIANT_ORDER[i] as VariantKey];
    if (prev) return prev.url;
  }
  if (key === "thumbnail" && img.thumbnail_url) return img.thumbnail_url;
  return img.image_url;
}

/** srcset built from whichever variants exist; empty for legacy rows. */
export function variantSrcSet(
  img: GalleryImageLike,
  keys: VariantKey[] = ["thumbnail", "medium", "large"],
): string | undefined {
  const v = parseVariants(img.variants);
  const parts = keys
    .map((k) => {
      const entry = v[k];
      return entry ? `${entry.url} ${entry.width}w` : null;
    })
    .filter((p): p is string => p !== null);
  return parts.length > 1 ? parts.join(", ") : undefined;
}

export function isOptimized(img: { variants?: unknown; optimized_at?: string | null }): boolean {
  if (img.optimized_at) return true;
  const v = parseVariants(img.variants);
  return Boolean(v.thumbnail && v.original);
}

export function formatBytes(n: number): string {
  if (!n) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  return `${(n / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

/**
 * Optimize + upload a site-content image (hero, about, covers…). Site content
 * stores a single URL, so we keep the 2560px WebP and a medium preview.
 */
export async function optimizeSiteImage(file: Blob, folder: string): Promise<string> {
  const processed = await processImage(file);
  const id = crypto.randomUUID();
  let url = "";
  for (const v of processed.variants) {
    if (v.key !== "original" && v.key !== "medium") continue;
    const path = `${folder}/${id}/${v.key}.webp`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, v.blob, { cacheControl: "31536000", upsert: false, contentType: "image/webp" });
    if (error) throw new Error(error.message);
    if (v.key === "original") url = await signPath(path);
  }
  if (!url) throw new Error("Could not store the optimized image");
  return url;
}

/* -------------------------------------------------------------------------- */
/* Public-facing titles                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Returns a human-readable title, or null when the stored value looks like a
 * camera/upload filename (e.g. "DSC 1747 copy", "IMG_2024", "021").
 * Visitors must never see technical filenames; storage paths stay untouched.
 */
export function publicImageTitle(title?: string | null): string | null {
  const raw = (title ?? "").trim();
  if (!raw) return null;
  const cleaned = raw
    .replace(/\.(jpe?g|png|webp|heic|tiff?|gif|raw|cr2|nef|arw)$/i, "")
    .replace(/\b(copy|final|edit(ed)?|export|small|large|original|scan)\b/gi, " ")
    .replace(/\b(dsc|dscn|img|imgp|pxl|dji|gopr|mvimg|photo|image|file|untitled|_mg)\b/gi, " ")
    .replace(/[\d_\-#()]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  // Needs at least one real word of 3+ letters to count as a human title.
  if (!/[a-z]{3,}/i.test(cleaned)) return null;
  return raw;
}
