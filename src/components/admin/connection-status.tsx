import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CircleCheck, CircleHelp, TriangleAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { studioConnected } from "@/lib/backend-mode";

type OwnerConnections = {
  orders: "ready" | "binding-missing" | "unavailable";
  giftPhotoStorage: boolean;
  studioPhotoStorage: boolean;
};

async function ownerConnections(): Promise<OwnerConnections> {
  const session = await supabase.auth.getSession();
  if (session.error) throw session.error;
  const token = session.data.session?.access_token;
  if (!token) throw new Error("Your studio session expired.");
  const response = await fetch("/api/owner/connections", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok || !response.headers.get("Content-Type")?.includes("application/json")) {
    throw new Error("Cloudflare connection check is unavailable.");
  }
  return response.json();
}

async function studioConnections() {
  const [jobs, contacts, bookings, gallery, storage, giftRequests] = await Promise.allSettled([
    supabase.from("studio_jobs" as never).select("id").limit(1),
    supabase.from("customers").select("id").limit(1),
    supabase.from("bookings" as never).select("id").limit(1),
    supabase.from("images").select("id").limit(1),
    supabase.storage.from("gallery").list("", { limit: 1 }),
    supabase.from("gift_orders" as never).select("id").limit(1),
  ]);
  const ready = (result: PromiseSettledResult<{ error: unknown }>) => result.status === "fulfilled" && !result.value.error;
  return {
    jobs: ready(jobs), contacts: ready(contacts), bookings: ready(bookings),
    gallery: ready(gallery), storage: ready(storage), giftRequests: ready(giftRequests),
  };
}

export function ConnectionStatus() {
  const studio = useQuery({ queryKey: ["admin", "connections", "supabase"], queryFn: studioConnections, enabled: studioConnected, retry: false, staleTime: 30_000 });
  const cloud = useQuery({ queryKey: ["admin", "connections", "cloudflare"], queryFn: ownerConnections, enabled: studioConnected, retry: false, staleTime: 30_000 });
  const r2Enabled = import.meta.env.VITE_STUDIO_MEDIA_PROVIDER === "r2";
  const rows = [
    ["Studio jobs", studio.data?.jobs, "Read access to production jobs"],
    ["Contacts", studio.data?.contacts, "Read access to the customer directory"],
    ["Bookings", studio.data?.bookings, "Read access to bookings"],
    ["Gallery records", studio.data?.gallery, "Read access to managed photos"],
    ["Gallery file storage", studio.data?.storage, "List access to the Supabase gallery bucket"],
    ["Gift requests", studio.data?.giftRequests, "Read access to Supabase gift requests"],
    ["Gift orders", cloud.data ? cloud.data.orders === "ready" : undefined,
      cloud.data?.orders === "binding-missing" ? "Cloudflare Pages has no ORDER_DB binding for this deployment."
        : cloud.data?.orders === "unavailable" ? "Cloudflare found ORDER_DB but could not read the order tables."
        : "Read access to Cloudflare’s order, photo and receipt tables"],
    ["Gift photo storage", cloud.data?.giftPhotoStorage, "Cloudflare’s ORDER_PHOTOS binding"],
    ...(r2Enabled ? [["Private job photo storage", cloud.data?.studioPhotoStorage, "Cloudflare’s STUDIO_PRIVATE_FILES binding"] as const] : []),
  ] as const;

  return <section className="studio-panel">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="text-lg font-semibold">Studio connections</h2><p className="mt-1 text-sm text-muted-foreground">Read-only checks for this deployment.</p></div>
      <button className="studio-secondary" type="button" disabled={!studioConnected || studio.isFetching || cloud.isFetching}
        onClick={() => { void studio.refetch(); void cloud.refetch(); }}>Check again</button>
    </div>
    {!studioConnected && <p className="mt-4 text-sm text-destructive" role="alert">This deployment has no live Supabase configuration.</p>}
    {cloud.isError && <p className="mt-4 text-sm text-destructive" role="alert">The Cloudflare connection check did not respond.</p>}
    {(studio.isFetching || cloud.isFetching) && <p className="mt-4 text-sm" role="status">Checking connections…</p>}
    <ul className="mt-4 divide-y divide-onyx/10">
      {rows.map(([label, state, description]) => {
        const Icon = state === undefined ? CircleHelp : state ? CircleCheck : TriangleAlert;
        return <li key={label} className="flex flex-wrap items-center gap-3 py-3">
          <Icon className={`size-5 shrink-0 ${state === false ? "text-destructive" : state ? "text-[#344b3d]" : "text-muted-foreground"}`} aria-hidden />
          <span className="min-w-0 flex-1"><strong className="block text-sm">{label}</strong><span className="text-xs text-muted-foreground">{description}</span></span>
          <span className="text-xs font-medium">{state === undefined ? "Unverified" : state ? "Available" : "Needs attention"}</span>
        </li>;
      })}
    </ul>
    <div className="mt-4 flex flex-wrap gap-2"><Link to="/admin/storage" className="studio-secondary">Storage overview</Link><Link to="/admin/gift-orders" className="studio-secondary">Gift orders</Link></div>
  </section>;
}
