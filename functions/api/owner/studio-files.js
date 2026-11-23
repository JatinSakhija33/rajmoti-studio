import { failure, json, requireOwner, sniffMedia } from "../../_lib/security.js";

const MAX_BYTES = 20 * 1024 * 1024;
const JOB_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const R2_KEY = /^studio-jobs\/[0-9a-f-]{36}\/(original|edited)\/[0-9a-f-]{36}\.(jpg|png|webp|tiff)$/i;

/** Only an authenticated studio admin may read or upload private R2 originals. */
function photoBucket(env) {
  return env.STUDIO_PRIVATE_FILES || null;
}

function sniffPhoto(bytes, mime) {
  if (mime === "image/tiff") {
    const header = new Uint8Array(bytes.slice(0, 4));
    const tiffLE = header.join(",") === "73,73,42,0";
    const tiffBE = header.join(",") === "77,77,0,42";
    return tiffLE || tiffBE ? ".tiff" : null;
  }
  return sniffMedia(bytes, mime);
}

const NO_STORE = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
};

export async function onRequestPost({ request, env }) {
  try {
    await requireOwner(request, env);
    const bucket = photoBucket(env);
    if (!bucket) return failure("Cloudflare R2 private storage binding is not configured", 503);

    const declaredLength = Number(request.headers.get("Content-Length") || 0);
    if (declaredLength > MAX_BYTES + 200_000) return failure("Photo upload exceeds 20 MB", 413);

    const form = await request.formData();
    const jobId = String(form.get("jobId") || "");
    const kind = String(form.get("kind") || "");
    const file = form.get("photo");

    if (!JOB_ID.test(jobId) || !["original", "edited"].includes(kind))
      return failure("Invalid studio job or photograph type", 400);
    if (!(file instanceof File) || file.size === 0 || file.size > MAX_BYTES)
      return failure("Choose a photo no larger than 20 MB", 413);

    const bytes = await file.arrayBuffer();
    const extension = sniffPhoto(bytes, file.type);
    if (!extension) return failure("Invalid JPG, PNG, WebP or TIFF photo", 415);

    // Always create a new immutable key. Never overwrite old camera originals,
    // edit versions, or Supabase Storage objects.
    const key = `studio-jobs/${jobId}/${kind}/${crypto.randomUUID()}${extension}`;
    await bucket.put(key, bytes, {
      httpMetadata: { contentType: file.type },
      customMetadata: { jobId, kind },
    });

    return json({ path: `r2://${key}`, provider: "cloudflare-r2", bytes: file.size }, 201);
  } catch (error) {
    return failure(
      error?.status ? error.message : "Private photo upload failed. Existing files were not changed.",
      error?.status || 500
    );
  }
}

export async function onRequestGet({ request, env }) {
  try {
    await requireOwner(request, env);
    const bucket = photoBucket(env);
    if (!bucket) return failure("Cloudflare R2 private storage binding is not configured", 503);

    const key = new URL(request.url).searchParams.get("key") || "";
    if (!R2_KEY.test(key)) return failure("Invalid studio file path", 400);
    const object = await bucket.get(key);
    if (!object) return failure("Studio photo not found", 404);

    return new Response(object.body, {
      status: 200,
      headers: {
        ...NO_STORE,
        "Content-Type": object.httpMetadata?.contentType || "application/octet-stream",
        "Content-Disposition": "inline",
        "Content-Length": String(object.size),
      },
    });
  } catch (error) {
    return failure(
      error?.status ? error.message : "Could not securely open studio photo",
      error?.status || 500
    );
  }
}
