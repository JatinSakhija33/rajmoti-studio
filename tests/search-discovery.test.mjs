import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import content from "../src/lib/search-pages.json" with { type: "json" };
import catalogue from "../src/features/catalogue/seed.json" with { type: "json" };
import { onRequest, searchPage } from "../functions/_middleware.js";

const site = "https://rajmotistudio.in";
const html = '<html><head><meta name="robots" content="noindex,nofollow"><title>Studio</title></head><body><div id="root"></div></body></html>';
const pages = [content.home, ...content.pages, ...content.services, ...content.products];
const request = (path, options) => new Request(new URL(path, site), options);
const next = (body = html, contentType = "text/html") => new Response(body, { headers: { "Content-Type": contentType } });

test("production discovery pages have distinct canonical targets in the sitemap", async () => {
  const sitemap = await readFile(new URL("../public/sitemap.xml", import.meta.url), "utf8");
  assert.deepEqual([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((url) => url[1]), pages.map((page) => site + page.path));
  assert.equal(new Set(pages.map((page) => page.title)).size, pages.length);
  for (const page of pages) {
    assert.equal(searchPage(request(page.path + "?source=profile"))?.path, page.path);
  }
  for (const product of content.products) {
    assert.ok(catalogue.products.some((item) => item.id === product.sku));
  }
});

test("private pages, unknown routes and previews keep the noindex policy", async () => {
  for (const url of ["/admin", "/admin/images", "/auth", "/reset-password", "/track/test", "/gifts/unknown", "https://rajmoti-studio.pages.dev/"]) {
    const response = await onRequest({ request: request(url), next: () => next() });
    assert.equal(response.headers.get("X-Robots-Tag"), "noindex, nofollow");
    assert.match(await response.text(), /noindex,nofollow/);
  }
});

test("production HTML HEAD is eligible while API and other assets pass through", async () => {
  const result = await onRequest({ request: request("/gifts", { method: "HEAD" }), next: () => next(null) });
  assert.match(result.headers.get("X-Robots-Tag"), /^index,follow/);
  const api = next('{"enabled":false}', "application/json");
  assert.equal(await onRequest({ request: request("/api/gifts/config"), next: () => api }), api);
});
