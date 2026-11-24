import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(process.cwd() + "/" + path, "utf8");
const photos = JSON.parse(read("src/lib/published-portfolio.json"));
const categories = JSON.parse(read("src/lib/published-portfolio-taxonomy.json"));
const config = read("src/lib/homepage-gallery.ts");
const home = read("src/routes/index.tsx");
const marquee = read("src/components/home-gallery-marquee.tsx");
const available = new Set(photos.flatMap((photo) =>
  Object.values(photo.variants).map((variant) => variant.url)));

test("the exact chosen maternity and family covers exist on Cloudflare", () => {
  assert.equal(categories.find((x) => x.slug === "maternity").cover,
    "/portfolio/maternity/9ea4868277a6b703a682-medium-7b857711de2b.webp");
  assert.equal(categories.find((x) => x.slug === "family").cover,
    "/portfolio/family/8078c206caa42114f4da-large-03fae45dbaa3.webp");
  for (const category of categories) assert.ok(available.has(category.cover), category.slug);
});

test("the eight hero photos are unique and sourced from the published manifest", () => {
  const urls = [...config.matchAll(/src:\s*"([^"]+\.webp)"/g)].map((hit) => hit[1]);
  const ids = [...config.matchAll(/id:\s*"([a-f0-9]{20})"/g)].map((hit) => hit[1]);
  assert.equal(urls.length, 8);
  assert.equal(new Set(urls).size, 8);
  assert.equal(new Set(ids).size, 8);
  for (const url of urls) assert.ok(available.has(url), url);
  for (const id of ["9ea4868277a6b703a682", "8078c206caa42114f4da",
    "d3a075faa9a40668261a", "afa9cf7f87386eeedd29"]) {
    assert.ok(ids.includes(id), id);
  }
});

test("all 385 Cloudflare photos feed the loop with only 14 tiles mounted", () => {
  assert.equal(photos.length, 385);
  assert.match(marquee, /loadPublishedPhotos\(\)/);
  assert.match(marquee, /interleaveGalleryPhotos\(published\)/);
  assert.match(marquee, /length: 14/);
  assert.match(marquee, /onAnimationIteration/);
  assert.ok(home.indexOf("<HomeGalleryMarquee />") > home.indexOf("<PhotographyChapters"));
  assert.ok(home.indexOf("<HomeGalleryMarquee />") < home.indexOf("<StudioMap />"));
  assert.match(read("src/features/editorial/home-gallery.css"), /prefers-reduced-motion: reduce/);
});
