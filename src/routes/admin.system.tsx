import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, Database, ExternalLink, RefreshCw, ShieldCheck, Wrench } from "lucide-react";
import { useAdminSystemHealth } from "@/components/admin/admin-readiness";
import { ADMIN_MODULES, ADMIN_SPECIAL_MODULES, moduleHealth } from "@/lib/admin-system-health";

export const Route = createFileRoute("/admin/system")({
  head: () => ({ meta: [{ title: "Studio system health — Rajmoti Studio" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: SystemHealthPage,
});

function SystemHealthPage() {
  const query = useAdminSystemHealth();
  const modules = query.data ? ADMIN_MODULES.map((mod) => ({ ...mod, health: moduleHealth(mod.path, query.data) })) : [];
  const healthy = modules.filter((mod) => mod.health?.ok).length;
  const missing = query.data?.tables.filter((table) => !table.ok) ?? [];

  return (
    <div className="space-y-7">
      <header className="flex flex-wrap justify-between items-start gap-5">
        <div>
          <p className="eyebrow text-gold mb-2">Rajmoti OS · owner only</p>
          <h1 className="font-display text-4xl">System health</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            Check which studio sections can reach their database tables. This is a read-only diagnostic;
            a green result does not guarantee that inserts, updates, storage permissions or historical records are ready.
          </p>
        </div>
        <button onClick={() => void query.refetch()} disabled={query.isFetching}
          className="flex items-center gap-2 bg-onyx text-cream px-4 py-3 text-sm disabled:opacity-50">
          <RefreshCw className={`size-4 ${query.isFetching ? "animate-spin" : ""}`} aria-hidden />
          {query.isFetching ? "Checking…" : "Run checks"}
        </button>
      </header>

      {query.isError && <div role="alert" className="border border-red-200 bg-red-50 p-4 text-sm">
        The diagnostic request failed. Check the network and authenticated Supabase session.
      </div>}

      {query.data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="bg-white border border-onyx/10 p-5"><p className="text-xs text-muted-foreground">Database modules reachable</p><p className="font-display text-4xl mt-3">{healthy}/{ADMIN_MODULES.length}</p></div>
            <div className="bg-white border border-onyx/10 p-5"><p className="text-xs text-muted-foreground">Unavailable tables</p><p className="font-display text-4xl mt-3">{missing.length}</p></div>
            <div className="bg-white border border-onyx/10 p-5 col-span-2 md:col-span-1"><p className="text-xs text-muted-foreground">Last checked</p><p className="font-display text-lg mt-4">{new Date(query.data.checkedAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}</p></div>
          </div>

          <div className="border border-onyx/10 bg-white">
            <div className="px-5 py-4 border-b border-onyx/10">
              <h2 className="font-display text-xl">Admin modules</h2>
              <p className="text-xs text-muted-foreground mt-1">These checks do not create or modify customer records.</p>
            </div>
            <div className="divide-y divide-onyx/10">
              {modules.map((mod) => (
                <div key={mod.path} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div className="flex gap-3 items-start min-w-0">
                    {mod.health?.ok
                      ? <CheckCircle2 className="size-5 text-green-700 shrink-0 mt-0.5" aria-label="Table endpoints reachable" />
                      : <AlertCircle className="size-5 text-amber-700 shrink-0 mt-0.5" aria-label="Database prerequisites unavailable" />}
                    <div>
                      <p className="text-sm font-semibold">{mod.label} <span className="font-normal text-muted-foreground">· {mod.group}</span></p>
                      <p className="text-xs text-muted-foreground mt-1 break-words">
                        {mod.health?.ok ? "Required tables are reachable" : `Unavailable: ${mod.health?.missing.join(", ") || "unknown"}`}
                      </p>
                    </div>
                  </div>
                  <Link to={mod.path} className="underline text-xs whitespace-nowrap">Open section</Link>
                </div>
              ))}
            </div>
          </div>

          {missing.length > 0 && <section className="bg-white border border-amber-300 p-5 space-y-3">
            <h2 className="font-display text-xl flex gap-2 items-center"><Wrench className="size-5" aria-hidden /> Database setup required</h2>
            <p className="text-sm text-muted-foreground">
              The new Supabase project appears to be missing some of the original Rajmoti schema.
              Restore and review the repository migrations in order, after backing up the current database.
              Do not insert fake sample customers or run unreviewed full-schema SQL over existing data.
            </p>
            <div className="flex flex-wrap gap-3 text-xs">
              <a href="https://github.com/JatinSakhija33/rajmoti-studio/tree/main/supabase/migrations" target="_blank" rel="noreferrer" className="underline inline-flex gap-1 items-center">Original schema migrations <ExternalLink className="size-3" /></a>
              <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="underline inline-flex gap-1 items-center">Supabase Dashboard <ExternalLink className="size-3" /></a>
            </div>
            <div className="space-y-2">
              {missing.map((entry) => (
                <p key={entry.table} className="text-xs bg-[#f8f4eb] px-3 py-2 break-words">
                  <strong>{entry.table}</strong> — {entry.category === "missing" ? "Table not found" : entry.category === "denied" ? "Permission denied" : "Query failed"}: {entry.detail}
                </p>
              ))}
            </div>
          </section>}
        </>
      )}

      <section className="bg-white border border-onyx/10 p-5 space-y-4">
        <h2 className="font-display text-xl flex gap-2 items-center"><Database className="size-5" aria-hidden /> Separate systems requiring verification</h2>
        {ADMIN_SPECIAL_MODULES.map((mod) => (
          <div key={mod.path} className="flex items-start justify-between gap-4 border-t border-onyx/10 pt-3">
            <div><p className="font-semibold text-sm">{mod.label}</p><p className="text-xs text-muted-foreground mt-1">{mod.detail}</p></div>
            <Link to={mod.path} className="underline text-xs shrink-0">Open</Link>
          </div>
        ))}
      </section>
      <p className="text-xs text-muted-foreground flex gap-2 items-start"><ShieldCheck className="size-4 shrink-0" aria-hidden />
        This view is accessible only after studio administrator authorization. Its probes never fetch customer records or reveal service keys.
      </p>
    </div>
  );
}
