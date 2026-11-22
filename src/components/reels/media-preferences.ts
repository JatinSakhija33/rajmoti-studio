type NetworkHints = { saveData?: boolean; effectiveType?: string };

export function prefersLightMedia() {
  const network = (navigator as Navigator & { connection?: NetworkHints }).connection;
  return Boolean(
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      network?.saveData ||
      ["slow-2g", "2g", "3g"].includes(network?.effectiveType ?? ""),
  );
}
