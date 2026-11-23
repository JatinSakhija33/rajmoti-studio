import { supabase } from "@/integrations/supabase/client";
import { studioConnected } from "@/lib/backend-mode";

/**
 * Read-only admin preflight checks. A successful HEAD request only confirms
 * that the authenticated role can reach a table; it does NOT imply writes,
 * storage policies or migrated customer data are working.
 */
export const ADMIN_MODULES = [
  { path: "/admin/workflow", label: "Jobs & production", tables: ["studio_jobs"], group: "Studio" },
  { path: "/admin/calendar", label: "Calendar", tables: ["calendar_events", "studio_notes", "bookings"], group: "Studio" },
  { path: "/admin/bookings", label: "Bookings", tables: ["bookings", "customers"], group: "Studio" },
  { path: "/admin/contacts", label: "Contacts", tables: ["customers", "contact_notes", "contact_tasks"], group: "Customers" },
  { path: "/admin/inquiries", label: "Enquiries", tables: ["inquiries"], group: "Customers" },
  { path: "/admin/crm", label: "Reminders & campaigns", tables: ["customers", "customer_dates", "reminders", "message_templates"], group: "Customers" },
  { path: "/admin/gifts", label: "Gift requests", tables: ["gift_orders", "studio_jobs"], group: "Commerce" },
  { path: "/admin/categories", label: "Categories", tables: ["categories", "subcategories"], group: "Website" },
  { path: "/admin/images", label: "Photo gallery", tables: ["images", "categories"], group: "Website" },
  { path: "/admin/reels", label: "Cinematic reels", tables: ["reels"], group: "Website" },
  { path: "/admin/packages", label: "Session packages", tables: ["packages", "package_features"], group: "Website" },
  { path: "/admin/booking", label: "Booking CMS", tables: ["booking_services", "booking_packages", "booking_hours"], group: "Website" },
  { path: "/admin/content", label: "Website content", tables: ["site_content"], group: "Website" },
  { path: "/admin/storage", label: "Media storage manager", tables: ["images"], group: "Website" },
  { path: "/admin/settings", label: "Studio settings", tables: ["settings"], group: "Website" },
] as const;

export const ADMIN_SPECIAL_MODULES = [
  { path: "/admin/catalogue", label: "Product catalogue", detail: "Currently browser-local. Changes are not shared between devices and do not publish to a database." },
  { path: "/admin/gift-orders", label: "Gift orders & payments", detail: "Uses Cloudflare Pages Functions and D1/R2 bindings, not the Supabase gift_requests table. Check Cloudflare bindings separately." },
] as const;

export type TableHealth = { table: string; ok: boolean; category: "ready" | "missing" | "denied" | "error"; detail: string };
export type SystemHealth = { checkedAt: string; tables: TableHealth[]; connected: boolean };

export const REQUIRED_ADMIN_TABLES = [...new Set(ADMIN_MODULES.flatMap((mod) => [...mod.tables]))];

function classifyError(code: string | undefined, message: string) {
  if (code === "PGRST205" || code === "42P01" || /could not find the table|relation .* does not exist/i.test(message)) return "missing" as const;
  if (code === "42501" || /permission denied|not authorized|forbidden/i.test(message)) return "denied" as const;
  return "error" as const;
}

export async function checkAdminSystem(): Promise<SystemHealth> {
  if (!studioConnected) {
    return { checkedAt: new Date().toISOString(), connected: false,
      tables: REQUIRED_ADMIN_TABLES.map((table) => ({ table, ok: false, category: "error" as const, detail: "Supabase production mode is not configured." })) };
  }

  const tables = await Promise.all(REQUIRED_ADMIN_TABLES.map(async (table): Promise<TableHealth> => {
    try {
      // HEAD / one row: inspect table visibility without downloading customer data.
      const { error } = await supabase.from(table as any).select("*", { head: true }).limit(1);
      if (error) return { table, ok: false, category: classifyError(error.code, error.message), detail: error.message };
      return { table, ok: true, category: "ready", detail: "Read endpoint reachable; write permissions not yet tested." };
    } catch (error) {
      return { table, ok: false, category: "error", detail: error instanceof Error ? error.message : "Network error" };
    }
  }));
  return { checkedAt: new Date().toISOString(), connected: true, tables };
}

export function moduleHealth(path: string, health: SystemHealth | undefined) {
  const module = ADMIN_MODULES.find((m) => m.path === path);
  if (!module || !health) return null;
  const missing = module.tables.filter((table) => !health.tables.find((row) => row.table === table)?.ok);
  return { module, missing, ok: missing.length === 0 };
}
