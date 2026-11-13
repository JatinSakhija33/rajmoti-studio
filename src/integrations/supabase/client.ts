import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { demoClient } from "@/demo/client";
import { liveBackend, backendConfigured, backendUrl, backendKey } from "@/lib/backend-mode";
let client: SupabaseClient<Database> | undefined;
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_, key) {
    if (!liveBackend) return Reflect.get(demoClient, key);
    if (!backendConfigured)
      throw new Error(
        "Supabase mode requires VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY. No demo owner is allowed in Supabase mode.",
      );
    client ||= createClient<Database>(backendUrl, backendKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
    const value = Reflect.get(client, key);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
