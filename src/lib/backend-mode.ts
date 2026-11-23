/**
 * Vite embeds public Supabase settings at build time.
 * An explicit "demo" is always offline; an explicit "supabase" always requires
 * valid configuration. When the mode is omitted, valid public credentials
 * enable the real backend automatically (important for Cloudflare Pages).
 */
const dataMode = String(import.meta.env.VITE_DATA_MODE || "").trim().toLowerCase();

export const backendUrl = String(import.meta.env.VITE_SUPABASE_URL || "").trim().replace(/\/$/, "");
export const backendKey = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "").trim();

function isUsableBackendUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const isLocal = ["localhost", "127.0.0.1"].includes(parsed.hostname);
    return (parsed.protocol === "https:" || (isLocal && parsed.protocol === "http:")) &&
      !parsed.hostname.includes("your_") && !parsed.hostname.includes("example");
  } catch {
    return false;
  }
}

export const backendConfigured =
  isUsableBackendUrl(backendUrl) &&
  backendKey.length > 20 &&
  !backendKey.includes("YOUR_");

export const liveBackend = dataMode === "supabase" || (dataMode === "" && backendConfigured);
export const studioConnected = liveBackend && backendConfigured;
