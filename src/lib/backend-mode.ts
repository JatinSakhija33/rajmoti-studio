export const liveBackend = import.meta.env.VITE_DATA_MODE === "supabase";
export const backendUrl = import.meta.env.VITE_SUPABASE_URL || "";
export const backendKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
export const backendConfigured = !!backendUrl && !!backendKey && !backendUrl.includes("YOUR_");
