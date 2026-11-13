/**
 * Public gift request intake. Deploy with verify_jwt=false, but ONLY after
 * configuring TURNSTILE_SECRET_KEY and ALLOWED_SITE_ORIGINS. No public Storage
 * RLS permissions are granted: uploads + DB writes happen server-side only
 * after Turnstile verification. Every file remains private.
 */
import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = (Deno.env.get("ALLOWED_SITE_ORIGINS") ?? "")
  .split(",").map((x) => x.trim()).filter(Boolean);
const MAX_FILES = 5;
const MAX_EACH = 10 * 1024 * 1024;
const MAX_TOTAL = 25 * 1024 * 1024;
const MAX_BODY = 26 * 1024 * 1024;
const BUCKET = "gift-order-photos";

function headers(origin: string | null): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin && allowedOrigins.includes(origin) ? origin : "null",
    "Access-Control-Allow-Headers": "content-type, apikey, authorization, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
    "Cache-Control": "no-store",
  };
}
function reply(status: number, message: string, origin: string | null, id?: string) {
  return new Response(JSON.stringify({ error: status >= 400 ? message : null, message, id }), {
    status, headers: { ...headers(origin), "Content-Type": "application/json" },
  });
}
function value(form: FormData, key: string, max: number): string {
  const raw = form.get(key);
  return (typeof raw === "string" ? raw : "").trim().slice(0, max);
}
async function imageKind(file: File): Promise<{ type: string; ext: string } | null> {
  const start = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (start[0] === 0xff && start[1] === 0xd8 && start[2] === 0xff && file.type === "image/jpeg") return { type: "image/jpeg", ext: "jpg" };
  if (start[0] === 0x89 && start[1] === 0x50 && start[2] === 0x4e && start[3] === 0x47 && file.type === "image/png") return { type: "image/png", ext: "png" };
  if (String.fromCharCode(...start.slice(0, 4)) === "RIFF" && String.fromCharCode(...start.slice(8, 12)) === "WEBP" && file.type === "image/webp") return { type: "image/webp", ext: "webp" };
  return null;
}

Deno.serve(async (request) => {
  const origin = request.headers.get("origin");
  if (!origin || !allowedOrigins.includes(origin)) return reply(403, "This website origin is not permitted.", origin);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: headers(origin) });
  if (request.method !== "POST") return reply(405, "Method not allowed", origin);

  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const url = Deno.env.get("SUPABASE_URL");
  const captchaSecret = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (!key || !url || !captchaSecret || allowedOrigins.length === 0) {
    return reply(503, "Gifting uploads are not configured. Please contact the studio on WhatsApp.", origin);
  }
  const declaredSize = Number(request.headers.get("content-length") || 0);
  if (declaredSize > MAX_BODY) return reply(413, "Request exceeds 26 MB.", origin);
  if (!(request.headers.get("content-type") || "").includes("multipart/form-data")) {
    return reply(415, "Expected a photo upload form.", origin);
  }
  try {
    const form = await request.formData();
    const token = value(form, "turnstileToken", 4000);
    if (!token) return reply(400, "Complete the security check to upload photos.", origin);
    const captcha = new URLSearchParams({ secret: captchaSecret, response: token });
    const remoteIp = request.headers.get("cf-connecting-ip");
    if (remoteIp) captcha.set("remoteip", remoteIp);
    const validated = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST", body: captcha,
    });
    if (!validated.ok || !(await validated.json()).success) {
      return reply(403, "Security check failed; please try again.", origin);
    }

    const customerName = value(form, "customerName", 140);
    const phone = value(form, "phone", 20);
    const email = value(form, "email", 180);
    const productSlug = value(form, "productSlug", 80);
    const productName = value(form, "productName", 120);
    const size = value(form, "size", 80) || "To be discussed";
    const message = value(form, "message", 1600);
    if (customerName.length < 2 || !/^[0-9+()\s-]{8,20}$/.test(phone) || !/^[a-z0-9-]{2,80}$/.test(productSlug) || productName.length < 2) {
      return reply(400, "Please enter a valid name, phone and product.", origin);
    }
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return reply(400, "Please enter a valid email.", origin);
    const photos = form.getAll("photos").filter((item): item is File => item instanceof File && item.size > 0);
    if (photos.length < 1 || photos.length > MAX_FILES) return reply(400, "Upload 1–5 photos.", origin);
    if (photos.reduce((a, b) => a + b.size, 0) > MAX_TOTAL) return reply(413, "Combined photos exceed 25 MB.", origin);
    const verifiedPhotos: { file: File; kind: { type: string; ext: string } }[] = [];
    for (const file of photos) {
      if (file.size > MAX_EACH) return reply(413, "Each photo must be 10 MB or smaller.", origin);
      const kind = await imageKind(file);
      if (!kind) return reply(415, "Only real JPG, PNG or WebP photo files are accepted.", origin);
      verifiedPhotos.push({ file, kind });
    }

    const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const orderId = crypto.randomUUID();
    const uploaded: string[] = [];
    try {
      for (const { file, kind } of verifiedPhotos) {
        const path = `${orderId}/${crypto.randomUUID()}.${kind.ext}`;
        const { error } = await sb.storage.from(BUCKET).upload(path, file, { contentType: kind.type, upsert: false });
        if (error) throw error;
        uploaded.push(path);
      }
      const { error } = await sb.from("gift_orders").insert({
        id: orderId,
        customer_name: customerName,
        phone,
        email: email || null,
        product_slug: productSlug,
        product_name: productName,
        requested_size: size,
        customer_message: message,
        photo_paths: uploaded,
      });
      if (error) throw error;
      return reply(201, "Your gifting request and photographs were received.", origin, orderId);
    } catch (error) {
      if (uploaded.length) await sb.storage.from(BUCKET).remove(uploaded);
      console.error("Gift request submission failed", error instanceof Error ? error.name : "unknown error");
      return reply(500, "Could not save your request. No order was confirmed; please try again or use WhatsApp.", origin);
    }
  } catch {
    return reply(400, "Unable to process this upload. Please use up to five photos, each 10 MB or smaller.", origin);
  }
});
