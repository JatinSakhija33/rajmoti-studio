export const STANDARD_DELIVERY_CHARGE_PAISE = 10000;
export const STANDARD_DELIVERY_CHARGE_INR = 100;

export function calculateVariantPriceInr(
  productId = "",
  variantSize = "",
  finish = "",
): number {
  const p = String(productId || "").toUpperCase();
  const s = String(variantSize || "").toLowerCase();
  const f = String(finish || "").toLowerCase();

  // Mugs
  if (p.includes("MUG") || s.includes("mug")) {
    if (f.includes("magic") || p === "MUG-002" || p === "MUG-003") return 550;
    if (f.includes("black")) return 450;
    return 350;
  }

  // Devotional God's Collection
  if (p.includes("GOD")) {
    if (p === "GOD-001" || f.includes("acrylic")) {
      if (s.includes("16×24") || s.includes("16x24")) return 1850;
      if (s.includes("12×18") || s.includes("12x18")) return 1450;
      return 950;
    }
    if (p === "GOD-002" || f.includes("translight")) {
      if (s.includes("16×24") || s.includes("16x24")) return 2850;
      return 1950;
    }
    return 750;
  }

  // Personalised Couple Magazine
  if (p.includes("MAG") || s.includes("magazine") || s.includes("pages")) {
    if (s.includes("16") || s.includes("20")) return 1950;
    return 1450;
  }

  // LED Translight
  if (p.includes("LED") || s.includes("translight")) {
    if (s.includes("16×24") || s.includes("16x24")) return 2850;
    return 1850;
  }

  // Inner Sparkle (14×20)
  if (p.includes("SPK") || s.includes("14×20") || s.includes("14x20") || f.includes("sparkle")) {
    return 1850;
  }

  // Acrylic Frames
  if (p.includes("ACR") || f.includes("acrylic")) {
    if (s.includes("16×24") || s.includes("16x24")) return 2450;
    if (s.includes("12×18") || s.includes("12x18")) return 1650;
    return 850;
  }

  // Standard Frames (FRM)
  if (s.includes("20×30") || s.includes("20x30")) return 2450;
  if (s.includes("16×24") || s.includes("16x24")) return 1450;
  if (s.includes("12×18") || s.includes("12x18")) return 850;
  if (s.includes("10×14") || s.includes("10x14")) return 650;
  if (s.includes("10×10") || s.includes("10x10")) return 550;
  if (s.includes("8×12") || s.includes("8x12")) return 450;
  if (s.includes("6×8") || s.includes("6x8")) return 350;
  if (s.includes("4×6") || s.includes("4x6")) return 250;

  return 450;
}
