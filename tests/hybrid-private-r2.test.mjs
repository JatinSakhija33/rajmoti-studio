import test from "node:test";
import assert from "node:assert/strict";
import { onRequestGet, onRequestPost } from "../functions/api/owner/studio-files.js";

const userId = "bb1a65bb-1d4e-42ce-a65a-7a8f9ffb1cab";
const jobId = "6e6a1046-9bd4-4e63-8482-9ca1f2b968dc";
const env = {
  VITE_SUPABASE_URL: "https://supabase.example.org",
  VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_testing_only",
};
const admin = { Authorization: "Bearer valid-studio-session" };
const bytes = Uint8Array.from([255, 216, 255, 224, 0, 16, 74, 70, 73, 70]);

function storage() {
  const objects = new Map();
  return {
    objects,
    async put(key, bytes, options) {
      if (objects.has(key)) throw new Error("Refusing to overwrite old object");
      objects.set(key, { bytes, options });
    },
    async get(key) {
      const item = objects.get(key);
      return item ? {
        size: item.bytes.byteLength,
        body: new Blob([item.bytes]).stream(),
        httpMetadata: item.options.httpMetadata,
      } : null;
    },
  };
}
function makeUpload({ authorization = admin.Authorization, kind = "original", id = jobId, mime = "image/jpeg", content = bytes } = {}) {
  const data = new FormData();
  data.set("kind", kind);
  data.set("jobId", id);
  data.set("photo", new File([content], "original.jpg", { type: mime }));
  return new Request("https://rajmotistudio.in/api/owner/studio-files", {
    method: "POST",
    headers: authorization ? { Authorization: authorization } : {},
    body: data,
  });
}

test("private R2 never accepts an anonymous upload", async (t) => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  globalThis.fetch = async () => { throw new Error("Anonymous requests must not call Supabase"); };
  const bucket = storage();
  const response = await onRequestPost({ request: makeUpload({ authorization: null }), env: { ...env, STUDIO_PRIVATE_FILES: bucket } });
  assert.equal(response.status, 403);
  assert.equal(bucket.objects.size, 0);
});

test("wrong role is forbidden before any R2 write", async (t) => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  globalThis.fetch = async (url) => String(url).includes("/auth/v1/user")
    ? Response.json({ id: userId }) : Response.json([{ role: "user" }]);
  const bucket = storage();
  const response = await onRequestPost({ request: makeUpload(), env: { ...env, STUDIO_PRIVATE_FILES: bucket } });
  assert.equal(response.status, 403);
  assert.equal(bucket.objects.size, 0);
});

test("admin can upload new original and edited copy without overwriting, and read privately", async (t) => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  globalThis.fetch = async (url) => String(url).includes("/auth/v1/user")
    ? Response.json({ id: userId, email: "owner@example.com" })
    : Response.json([{ role: "admin" }]);
  const bucket = storage();
  const e = { ...env, STUDIO_PRIVATE_FILES: bucket };

  const a = await onRequestPost({ request: makeUpload(), env: e });
  assert.equal(a.status, 201);
  const first = await a.json();
  assert.match(first.path, /^r2:\/\/studio-jobs\//);

  const b = await onRequestPost({ request: makeUpload({ kind: "edited" }), env: e });
  assert.equal(b.status, 201);
  const second = await b.json();
  assert.notEqual(first.path, second.path);
  assert.equal(bucket.objects.size, 2);

  const url = "https://rajmotistudio.in/api/owner/studio-files?key=" + encodeURIComponent(first.path.slice(5));
  const read = await onRequestGet({
    request: new Request(url, { headers: admin }), env: e,
  });
  assert.equal(read.status, 200);
  assert.deepEqual(new Uint8Array(await read.arrayBuffer()), bytes);
  assert.match(read.headers.get("Cache-Control"), /no-store/);

  const anonymous = await onRequestGet({ request: new Request(url), env: e });
  assert.equal(anonymous.status, 403);
});

test("invalid image bytes and unexpected paths are refused", async (t) => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  globalThis.fetch = async (url) => String(url).includes("/auth/v1/user")
    ? Response.json({ id: userId }) : Response.json([{ role: "admin" }]);
  const e = { ...env, STUDIO_PRIVATE_FILES: storage() };
  const upload = await onRequestPost({
    request: makeUpload({ mime: "image/jpeg", content: Uint8Array.from([0, 0, 0, 0]) }), env: e,
  });
  assert.equal(upload.status, 415);
  const read = await onRequestGet({
    request: new Request("https://rajmotistudio.in/api/owner/studio-files?key=../../secrets", { headers: admin }), env: e,
  });
  assert.equal(read.status, 400);
});
