import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { ADMIN_SPECIAL_MODULES, checkAdminSystem, moduleHealth } from "@/lib/admin-system-health";

export function useAdminSystemHealth(enabled = true) {
  return useQuery({
    queryKey: ["admin", "system-health", "v1"],
    queryFn: checkAdminSystem,
    enabled,
    retry: false,
    staleTime: 300_000,
    refetchOnWindowFocus: false,
  });
}

export function AdminReadiness({ pathname }: { pathname: string }) {
  // Do not fire 30+ schema probes on every admin page visit. The full audit
  // runs only when the owner opens /admin/system or explicitly rechecks.
  const health = useAdminSystemHealth(false);
  const current = moduleHealth(pathname, health.data);
  const special = ADMIN_SPECIAL_MODULES.find((mod) => mod.path === pathname);
  if (pathname === "/admin/system") return null;

  if (!health.data && !special) return null;

  if (health.isError) {
    return (
      <div role="alert" className="mb-6 border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        Studio connection check failed. <Link to="/admin/system" className="underline font-semibold">Open system health</Link>.
      </div>
    );
  }

  const missing = health.data?.tables.filter((row) => !row.ok) ?? [];
  const specific = current && !current.ok;
  if (!specific && missing.length === 0 && !special) return null;

  return (
    <section role="status" className="mb-6 flex flex-wrap items-center justify-between gap-3 border border-amber-300 bg-[#fffaf0] px-4 py-3 text-sm">
      <div className="flex items-start gap-3 min-w-0">
        <AlertTriangle className="size-5 shrink-0 text-amber-700" aria-hidden />
        <div>
          <p className="font-semibold text-onyx">
            {special ? "This section needs a separate production integration" : specific ? "This section needs database setup" : "Some studio modules need database setup"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {special ? special.detail
              : specific ? `Unavailable: ${current.missing.join(", ")}. Unsaved changes may not reach other devices.`
              : `${missing.length} backend table(s) are unavailable. Empty results may not mean zero records.`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => void health.refetch()} className="inline-flex gap-1.5 text-xs underline items-center">
          <RefreshCw className="size-3.5" aria-hidden /> Recheck
        </button>
        <Link to="/admin/system" className="text-xs font-semibold underline whitespace-nowrap">System health</Link>
      </div>
    </section>
  );
}
