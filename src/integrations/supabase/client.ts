import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { demoClient } from "@/demo/client";
import { liveBackend, backendConfigured, backendUrl, backendKey } from "@/lib/backend-mode";
let client: SupabaseClient<Database> | undefined;
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_, key) {
    if (!liveBackend) return Reflect.get(demoClient, key);
    if (!backendConfigured) throw new Error("Supabase mode is enabled but its public URL or publishable key is missing. Configure Cloudflare Pages production build variables and redeploy.");
    client ||= createClient<Database>(backendUrl, backendKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
    const value = Reflect.get(client, key);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
