import test from "node:test";
import assert from "node:assert/strict";
import {onRequestGet as config} from "../functions/api/gifts/config.js";
import {onRequestPost as order} from "../functions/api/orders.js";
import {fixture, giftBody, request} from "./helpers/gift-fixture.mjs";

test("recovery keeps ordering closed even when the old checkout flag is enabled", async t => {
  const f = fixture();
  t.after(f.close);
  delete f.env.GIFT_PRODUCTION_APPROVED;
  assert.equal((await config({env:f.env}).json()).enabled, false);
  const response = await order({request:request("/api/orders",giftBody()),env:f.env});
  assert.equal(response.status,503);
  assert.equal(f.sqlite.prepare("SELECT COUNT(*) AS count FROM orders").get().count,0);
});
