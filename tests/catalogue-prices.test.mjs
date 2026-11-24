
import test from "node:test";
import assert from "node:assert/strict";
import { onRequestGet, onRequestPost } from "../functions/api/catalogue-prices.js";
import { cleanOrder } from "../functions/_lib/security.js";

const endpoint = "https://rajmoti.example/api/catalogue-prices";
const auth = { SUPABASE_URL: "https://studio.example", SUPABASE_PUBLISHABLE_KEY: "fixture-public-key" };
function bucket() {
  let state = null;
  let version = 0;
  return {
    async get() { return state && { httpEtag: state.etag, json: async () => JSON.parse(state.body) }; },
    async put(key, body, { onlyIf }) {
      assert.match(key, /^catalogue-prices\/v1\//);
      if (onlyIf.has("If-None-Match") && state) return null;
      if (onlyIf.has("If-Match") && onlyIf.get("If-Match") !== state?.etag) return null;
      state = { etag: '"' + ++version + '"', body };
      return { httpEtag: state.etag };
    },
  };
}
function update({ productId = "FRM-001", revision = null, prices = { "FRM-001-02": 17900 }, token, origin } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = "Bearer " + token;
  if (origin) headers.Origin = origin;
  return new Request(endpoint, { method: "POST", headers, body: JSON.stringify({ productId, prices, revision }) });
}

test("catalogue prices are anonymous-readable, admin-writable and concurrency-safe", async (t) => {
  t.mock.method(globalThis, "fetch", async (url, options) => {
    if (url.endsWith("/auth/v1/user")) return Response.json({ id: "fixture-owner" });
    const role = options.headers.Authorization === "Bearer studio-admin" ? "admin" : "user";
    return Response.json([{ role }]);
  });
  const env = { ...auth, CATALOGUE_STORE: bucket() };
  const read = async () => (await onRequestGet({ env })).json();
  const write = (args) => onRequestPost({ env, request: update(args) });
  assert.deepEqual(await read(), { configured: true, revision: null, prices: {} });
  assert.equal((await write()).status, 403);
  assert.equal((await write({ token: "visitor" })).status, 403);
  assert.equal((await write({ token: "studio-admin", origin: "https://other.example" })).status, 403);
  assert.equal((await write({ token: "studio-admin", prices: { "SHP-001-01": 10000 } })).status, 400);
  assert.equal((await write({ token: "studio-admin", prices: { "FRM-001-02": 12.5 } })).status, 400);
  assert.equal((await write({ token: "studio-admin" })).status, 200);
  const after = await read();
  assert.deepEqual(after.prices, { "FRM-001-02": 17900 });
  assert.equal((await write({ token: "studio-admin" })).status, 409);

  const saves = await Promise.all([
    write({ token: "studio-admin", productId: "SHP-001", revision: after.revision, prices: { "SHP-001-01": 29900 } }),
    write({ token: "studio-admin", productId: "SHP-013", revision: after.revision, prices: { "SHP-013-01": 9900 } }),
  ]);
  assert.deepEqual(saves.map(({ status }) => status).sort(), [200, 409]);
  const latest = await read();
  assert.equal(latest.prices["FRM-001-02"], 17900);
  assert.equal(Object.keys(latest.prices).length, 2);
  assert.equal((await write({ token: "studio-admin", revision: latest.revision, prices: { "FRM-001-02": null } })).status, 200);
  assert.equal((await read()).prices["FRM-001-02"], null);
  assert.equal((await (await onRequestGet({ env: {} })).json()).configured, false);
});

test("server checkout pricing agrees with the published catalogue and respects quote-only prices", () => {
  const order = {
    name: "Fixture customer", phone: "9876543210", type: "Photo gifting",
    quote: [{ productId: "FRM-001", variantId: "FRM-001-02",
      quantity: 2, personalisation: "Photo", packaging: "Standard", orderType: "Finished" }],
  };
  assert.equal(cleanOrder(order, { "FRM-001-02": 17900 }).totalAmountPaise, 35800);
  assert.throws(() => cleanOrder(order, { "FRM-001-02": null }), /quotation/);
  const clock = { ...order, quote: [{ ...order.quote[0], productId: "SHP-012", variantId: "SHP-012-01",
    personalisation: "Personalised design" }] };
  assert.throws(() => cleanOrder(clock), /quotation/);
  assert.throws(() => cleanOrder({ ...clock, quote: [{ ...clock.quote[0], quoteOnly: true }] },
    { "SHP-012-01": 40000 }), /quotation/);
});
