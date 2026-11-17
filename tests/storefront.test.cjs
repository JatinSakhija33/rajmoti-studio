const { test } = require("node:test");
const assert = require("node:assert/strict");
const ts = require("typescript");
const fs = require("node:fs");
const vm = require("node:vm");
const exportsObject = {};
const source = ts.transpileModule(fs.readFileSync("src/features/catalogue/discovery.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
vm.runInNewContext(source, { exports: exportsObject });
const { inCollection, matchesDiscovery, sameQuoteLine, validQuantity, validatePreviewFiles } =
  exportsObject;
const { products } = JSON.parse(fs.readFileSync("src/features/catalogue/seed.json", "utf8"));
const frame = products.find((p) => p.id === "FRM-001");
test("collections only reference existing catalogue products, including cross-family collages", () => {
  assert.equal(inCollection(frame, "frames"), true);
  assert.equal(inCollection(frame, "acrylic"), false);
  const collages = products.filter((p) => inCollection(p, "collages"));
  assert.equal(collages.length, 2);
  assert.ok(collages.every((p) => /collage/i.test(p.name)));
  assert.equal(products.filter((p) => inCollection(p, "devotional")).length, 0);
});
test("search matches metric and inch variants and combines with occasions and recipients", () => {
  assert.equal(
    matchesDiscovery(frame, { q: "4 x 6 inches", occasion: "Birthday", recipient: "Couples" }),
    true,
  );
  assert.equal(matchesDiscovery(frame, { q: "10.2 × 15.2 cm" }), true);
  assert.equal(matchesDiscovery(frame, { collection: "acrylic", q: "frame" }), false);
  assert.equal(matchesDiscovery(frame, { occasion: "Corporate" }), false);
  assert.equal(matchesDiscovery(frame, { recipient: "For him" }), true);
  assert.equal(matchesDiscovery(frame, { recipient: "For her" }), true);
});
test("quote merging preserves different personalization and photo references", () => {
  const line = {
    productId: frame.id,
    variantId: frame.variants[0].id,
    quantity: 1,
    personalisation: "Photo",
    packaging: "Standard",
    orderType: "Printed",
  };
  assert.equal(sameQuoteLine(line, { ...line, quantity: 3 }), true);
  assert.equal(sameQuoteLine(line, { ...line, variantId: "other" }), false);
  const design = {
    text: "A & B",
    note: "keep border",
    orientation: "Portrait",
    photoCount: 1,
    zoom: 1,
    x: 50,
    y: 50,
    referenceId: "one",
  };
  assert.equal(
    sameQuoteLine({ ...line, design }, { ...line, design: { ...design, text: "C & D" } }),
    false,
  );
  assert.equal(
    sameQuoteLine({ ...line, design }, { ...line, design: { ...design, referenceId: "two" } }),
    false,
  );
});
test("quantities reject fractions, empty values, infinities and values outside allowed range", () => {
  for (const value of [0, -1, 1.5, NaN, Infinity, 10000]) assert.equal(validQuantity(value), false);
  for (const value of [1, 2, 9999]) assert.equal(validQuantity(value), true);
});
test("photo selection enforces type, per-file, combined and accumulated count limits", () => {
  const jpg = { type: "image/jpeg", size: 1024 };
  assert.equal(validatePreviewFiles([jpg]), "");
  assert.match(validatePreviewFiles([{ type: "image/heic", size: 1024 }]), /JPG/);
  assert.match(validatePreviewFiles([{ type: "image/svg+xml", size: 1024 }]), /JPG/);
  assert.match(validatePreviewFiles([{ ...jpg, size: 0 }]), /10 MB/);
  assert.match(validatePreviewFiles([{ ...jpg, size: 11 * 1024 * 1024 }]), /10 MB/);
  assert.match(validatePreviewFiles(Array(3).fill({ ...jpg, size: 9 * 1024 * 1024 })), /25 MB/);
  assert.match(validatePreviewFiles([jpg, jpg], [jpg, jpg, jpg, jpg]), /5 photos/);
});
