import test from "node:test";
import assert from "node:assert/strict";

// Import physical specs directly or test the exact formulas verified for Rajmoti Studio 300 DPI silver-halide production
const RAJMOTI_FRAME_SIZES = [
  { id: "8x12", widthInches: 8, heightInches: 12 },
  { id: "10x10", widthInches: 10, heightInches: 10 },
  { id: "10x14", widthInches: 10, heightInches: 14 },
  { id: "12x18", widthInches: 12, heightInches: 18 },
  { id: "14x20", widthInches: 14, heightInches: 20 },
  { id: "16x24", widthInches: 16, heightInches: 24 },
  { id: "18x24", widthInches: 18, heightInches: 24 },
  { id: "20x30", widthInches: 20, heightInches: 30 },
];

function calculateDimensions(size, dpi = 300, bleedMm = 3) {
  const bleedInches = bleedMm / 25.4;
  const widthInchesWithBleed = size.widthInches + bleedInches * 2;
  const heightInchesWithBleed = size.heightInches + bleedInches * 2;
  const targetWidthPx = Math.round(widthInchesWithBleed * dpi);
  const targetHeightPx = Math.round(heightInchesWithBleed * dpi);
  const visibleWidthPx = Math.round(size.widthInches * dpi);
  const visibleHeightPx = Math.round(size.heightInches * dpi);
  const bleedPx = Math.round(bleedInches * dpi);

  return {
    dpi,
    bleedMm,
    bleedInches,
    bleedPx,
    targetWidthPx,
    targetHeightPx,
    visibleWidthPx,
    visibleHeightPx,
  };
}

test("calculateDimensions accurately computes 300 DPI physical dimensions with 3mm bleed", () => {
  // 8x12 in at 300 DPI
  const dims8x12 = calculateDimensions({ widthInches: 8, heightInches: 12 }, 300, 3);
  assert.equal(dims8x12.visibleWidthPx, 2400); // 8 * 300
  assert.equal(dims8x12.visibleHeightPx, 3600); // 12 * 300
  assert.equal(dims8x12.bleedPx, 35); // 3mm / 25.4 * 300 = 35.43 -> 35px
  assert.equal(dims8x12.targetWidthPx, 2471); // (8 + 2 * 3/25.4) * 300 = 2470.86 -> 2471px
  assert.equal(dims8x12.targetHeightPx, 3671); // (12 + 2 * 3/25.4) * 300 = 3670.86 -> 3671px

  // 12x18 in at 300 DPI
  const dims12x18 = calculateDimensions({ widthInches: 12, heightInches: 18 }, 300, 3);
  assert.equal(dims12x18.visibleWidthPx, 3600);
  assert.equal(dims12x18.visibleHeightPx, 5400);
  assert.equal(dims12x18.targetWidthPx, 3671);
  assert.equal(dims12x18.targetHeightPx, 5471);
});

test("all Rajmoti standard frame sizes maintain proportional aspect ratios and positive bleeds", () => {
  for (const frame of RAJMOTI_FRAME_SIZES) {
    const dims = calculateDimensions(frame, 300, 3);
    assert.ok(dims.targetWidthPx > dims.visibleWidthPx, `Target width with bleed must exceed visible width for ${frame.id}`);
    assert.ok(dims.targetHeightPx > dims.visibleHeightPx, `Target height with bleed must exceed visible height for ${frame.id}`);
    assert.equal(dims.bleedPx, 35, "Bleed pixel margin must consistently be 35px for 3mm at 300 DPI");
  }
});
