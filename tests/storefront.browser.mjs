import assert from "node:assert/strict";
import { chromium } from "playwright";

// Run against `npm run dev`; optionally set BASE_URL and BROWSER_PATH.
const base = process.env.BASE_URL || "http://127.0.0.1:5173";
const browser = await chromium.launch({
  headless: true,
  ...(process.env.BROWSER_PATH ? { executablePath: process.env.BROWSER_PATH } : {}),
});
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const go = async (path) => {
  await page.goto(base + path);
  await page.locator("h1").first().waitFor();
};
const visible = async (locator) => {
  await locator.waitFor({ state: "visible" });
};
const close = async () => {
  await page.getByRole("button", { name: "Close", exact: true }).last().click();
};
const noOverflow = async () =>
  assert.ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    "page must fit its viewport",
  );

try {
  await go("/");
  await page.getByRole("button", { name: "Search products", exact: true }).click();
  await page.getByRole("textbox", { name: "Search the gift collection" }).fill("acrylic");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.waitForURL(/q=acrylic/);
  await visible(page.locator(".rs-product-card").first());
  assert.ok((await page.locator(".rs-product-card").count()) > 0);
  assert.ok(
    (await page.locator(".rs-product-card-copy").allTextContents()).every((name) =>
      /acrylic/i.test(name),
    ),
  );
  await page.getByRole("button", { name: "Clear all", exact: true }).click();
  await page
    .locator(".rs-sidebar")
    .getByRole("button", { name: /^Photo collages/ })
    .click();
  await page.waitForURL(/collection=collages/);
  await page.waitForFunction(() => document.querySelectorAll(".rs-product-card").length === 2);
  assert.equal(await page.locator(".rs-product-card").count(), 2);
  await page.reload();
  await visible(page.locator(".rs-product-card").first());
  assert.equal(
    await page.locator(".rs-product-card").count(),
    2,
    "collection deep links survive reload",
  );

  await go("/gifts");
  await page.getByRole("button", { name: /^Filters/ }).click();
  await page.getByLabel("Material", { exact: true }).selectOption("Wood");
  assert.ok(
    (await page.locator(".rs-product-card-copy").allTextContents()).every((text) =>
      /Wood/i.test(text),
    ),
  );
  await page.getByRole("button", { name: "Reset detailed filters", exact: true }).click();
  await page.getByRole("button", { name: /^Filters/ }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: /Download catalogue CSV/ }).click();
  assert.ok((await download).suggestedFilename().endsWith(".csv"));
  await page.getByRole("button", { name: "Discover more", exact: true }).click();
  assert.equal(await page.locator(".rs-product-card").count(), 24);
  await page.getByRole("button", { name: "Save Wooden frame", exact: true }).click();
  await go("/gifts?saved=true");
  await visible(page.locator(".rs-product-card").first());
  assert.equal(await page.locator(".rs-product-card").count(), 1);
  await page.reload();
  await visible(page.getByRole("button", { name: "Unsave Wooden frame", exact: true }));
  await page.getByRole("button", { name: "Unsave Wooden frame", exact: true }).click();
  await visible(page.getByText("Your favourites will feel at home here.", { exact: true }));

  await go("/gifts");
  await page.locator(".rs-compare-toggle").nth(0).click();
  await page.locator(".rs-compare-toggle").nth(1).click();
  await page
    .locator(".rs-compare-bar")
    .getByRole("button", { name: "Compare", exact: true })
    .click();
  await visible(page.getByRole("dialog"));
  assert.equal(await page.getByRole("dialog").locator("thead select").count(), 2);
  await close();
  await page.locator(".rs-compare-bar").getByRole("button", { name: "Clear", exact: true }).click();

  await go("/gifts?product=FRM-001");
  const modal = page.getByRole("dialog");
  await visible(modal);
  const input = page.getByLabel("Choose photos for local preview");
  assert.equal(
    await input.isEnabled(),
    true,
    "local previews bypass only the demo file-input guard",
  );
  await input.setInputFiles({
    name: "invalid.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from("<svg></svg>"),
  });
  await visible(modal.getByRole("alert"));
  // An original, anonymous two-colour PNG fixture, generated in the browser.
  const fixture = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;
    const c = canvas.getContext("2d");
    c.fillStyle = "#d2e3bf";
    c.fillRect(0, 0, 400, 600);
    c.fillStyle = "#8b6a4c";
    c.fillRect(400, 0, 400, 600);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  const outgoing = [];
  const record = (request) => {
    if (!["GET", "HEAD"].includes(request.method())) outgoing.push(request.url());
  };
  page.on("request", record);
  await input.setInputFiles({
    name: "preview.png",
    mimeType: "image/png",
    buffer: Buffer.from(fixture, "base64"),
  });
  await visible(page.getByAltText("Your selected photo preview"));
  await modal.getByLabel("Size & finish", { exact: true }).selectOption("FRM-001-06");
  await visible(modal.getByText(/This photo may look soft/));
  await modal.getByLabel("Orientation", { exact: true }).selectOption("Landscape");
  await modal.getByLabel("Personalization", { exact: true }).selectOption("Photo + text");
  await modal.getByLabel(/Your text \(optional\)/).fill("Our favourite day");
  await modal.getByLabel("A note for the studio (optional)").fill("Please keep a cream border.");
  await modal.getByLabel(/Zoom/).fill("1.5");
  await modal.getByLabel("Horizontal position").fill("70");
  await modal.getByLabel("Vertical position").fill("30");
  assert.equal(await modal.locator(".rs-preview-text").textContent(), "Our favourite day");
  await modal.getByLabel("Product quantity", { exact: true }).fill("1.5");
  assert.equal(await modal.getByRole("button", { name: "Add to quote list" }).isDisabled(), true);
  await modal.getByLabel("Product quantity", { exact: true }).fill("2");
  await modal.getByRole("button", { name: "Add to quote list" }).click();
  await visible(page.getByRole("heading", { name: "Your quote list", exact: true }));
  const quote = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("rajmoti:editorial:quote:v2")),
  );
  assert.equal(quote[0].quantity, 2);
  assert.equal(quote[0].design.text, "Our favourite day");
  assert.equal(quote[0].design.orientation, "Landscape");
  assert.equal(quote[0].design.zoom, 1.5);
  assert.equal(quote[0].design.photoCount, 1);
  assert.ok(
    !JSON.stringify(quote).includes("blob:") && !JSON.stringify(quote).includes("data:image"),
    "photos are never persisted in the quote",
  );
  assert.deepEqual(outgoing, [], "local preview must not transmit photos");
  page.off("request", record);
  await page.getByRole("button", { name: "Increase quantity for Wooden frame" }).click();
  await page.getByRole("link", { name: "Continue to enquiry" }).click();
  await visible(page.getByText("Text: Our favourite day", { exact: true }));
  await visible(page.getByText("Note: Please keep a cream border.", { exact: true }));
  assert.ok((await page.locator(".quote-summary-row").textContent()).includes("Qty 3"));
  await page.getByLabel("Your name", { exact: true }).fill("Demo Customer");
  await page.getByLabel("WhatsApp number", { exact: true }).fill("9000000000");
  await page.getByRole("button", { name: "Save demo enquiry", exact: true }).click();
  await visible(page.locator(".enquiry-success"));
  const enquiries = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("rajmoti:editorial:enquiries:v2")),
  );
  assert.equal(enquiries.at(-1).quote[0].design.text, "Our favourite day");

  await go("/gifts?product=FRM-001");
  assert.equal(
    await page.getByAltText("Your selected photo preview").count(),
    0,
    "closing the personalizer clears photos",
  );
  await page.getByRole("button", { name: "Close product", exact: true }).click();
  await go("/gifts?collection=devotional");
  await visible(page.getByText(/There are no devotional products listed/));
  await go("/gifts?product=nonexistent");
  await visible(page.getByRole("heading", { name: "Product not found", exact: true }));
  await page.getByRole("button", { name: "Back to gifts", exact: true }).click();

  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await go("/");
    await noOverflow();
    await go("/gifts");
    await noOverflow();
    await go("/gifts?product=FRM-001");
    await visible(page.getByRole("dialog"));
    assert.ok(
      await page.getByRole("dialog").evaluate((e) => e.scrollWidth <= e.clientWidth + 1),
      `product modal fits at ${width}`,
    );
    await page.getByRole("button", { name: "Close product", exact: true }).click();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await go("/gifts?product=FRM-001");
  const quickPhoto = page.getByLabel("Quick photo preview");
  const quickBox = await quickPhoto.boundingBox();
  assert.ok(
    quickBox && quickBox.y + quickBox.height < 844,
    "mobile photo action is visible immediately",
  );
  await quickPhoto.setInputFiles({
    name: "preview.png",
    mimeType: "image/png",
    buffer: Buffer.from(fixture, "base64"),
  });
  await visible(page.getByAltText("Your selected photo preview"));
  await page.getByRole("button", { name: "Close product", exact: true }).click();
  await go("/");
  await page.getByRole("button", { name: "Open navigation", exact: true }).click();
  await page
    .getByRole("navigation", { name: "Mobile navigation", exact: true })
    .getByRole("link", { name: /^Saved gifts/ })
    .click();
  await page.waitForURL(/saved=true/);
  assert.equal(
    await page.getByRole("navigation", { name: "Mobile navigation", exact: true }).count(),
    0,
  );
  await go("/portfolios");
  await visible(page.locator("main"));
  await go("/packages");
  await visible(page.locator("main"));
  assert.deepEqual(errors, [], "no browser runtime errors");
  console.log(
    "PASS: discovery, deep links, saved gifts, comparison, photo validation, cropping, quotes, enquiry, mobile navigation, five viewport sizes and existing photography pages.",
  );
} finally {
  await browser.close();
}
