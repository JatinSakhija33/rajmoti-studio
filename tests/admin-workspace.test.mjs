import test from "node:test";
import assert from "node:assert/strict";
import { fixture, request, stubExternalServices } from "./helpers/gift-fixture.mjs";
import { onRequestGet } from "../functions/api/owner/connections.js";

test("connection diagnostics only expose readiness to the studio owner", async () => {
  const restore = stubExternalServices();
  const database = fixture();
  try {
    const path = "/api/owner/connections";
    const denied = await onRequestGet({ request: request(path, null, false, "GET"), env: database.env });
    assert.equal(denied.status, 403);
    const ownerRequest = request(path, null, true, "GET");
    const ready = await onRequestGet({ request: ownerRequest, env: database.env });
    assert.deepEqual(await ready.json(), { orders: "ready", giftPhotoStorage: true, studioPhotoStorage: false });
    assert.equal(ready.headers.get("cache-control"), "no-store");
    const missing = await onRequestGet({ request: ownerRequest, env: { ...database.env, ORDER_DB: undefined } });
    assert.equal((await missing.json()).orders, "binding-missing");
    database.db.failPattern = /FROM order_payments/;
    const failed = await onRequestGet({ request: ownerRequest, env: database.env });
    assert.equal((await failed.json()).orders, "unavailable");
  } finally {
    restore();
    database.close();
  }
});
