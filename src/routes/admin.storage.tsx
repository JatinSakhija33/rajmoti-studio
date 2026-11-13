import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { HardDrive, ImageIcon, TrendingUp, AlertTriangle, ExternalLink, Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { formatBytes, isOptimized, variantUrl } from "@/lib/images";
import {
  emptyReport,
  fetchMigratableImages,
  migrateOne,
  pendingImages,
  storageSummary,
  variantCount,
  type MigrationReport,
} from "@/lib/image-migration";

export const Route = createFileRoute("/admin/storage")({
  head: () => ({ meta: [{ title: "Storage — Rajmoti Studio Admin" }] }),
  component: AdminStorage,
});

const FREE_TIER_BYTES = 1024 * 1024 * 1024; // 1 GB indicative free quota

function AdminStorage() {
  const qc = useQueryClient();
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number; label: string } | null>(null);
  const [report, setReport] = useState<MigrationReport | null>(null);

  const { data: rows, isLoading } = useQuery({
    queryKey: ["admin", "storage"],
    queryFn: fetchMigratableImages,
  });

  if (isLoading || !rows) return <div className="text-muted-foreground">Loading…</div>;

  const summary = storageSummary(rows);
  const pending = pendingImages(rows);
  const largest = [...rows].sort((a, b) => (b.bytes ?? 0) - (a.bytes ?? 0)).slice(0, 10);
  const oversized = rows.filter((r) => (r.bytes ?? 0) > 5 * 1024 * 1024);
  const pct = Math.min(100, (summary.totalBytes / FREE_TIER_BYTES) * 100);
  const warn = pct > 80;

  async function runMigration() {
    if (pending.length === 0) { toast.info("Every photograph is already optimized"); return; }
    setRunning(true);
    const acc = emptyReport();
    setReport(null);
    try {
      for (let i = 0; i < pending.length; i++) {
        const row = pending[i]!;
        setProgress({ done: i, total: pending.length, label: row.title || "Untitled photograph" });
        acc.bytesBefore += row.bytes ?? 0;
        try {
          const entry = await migrateOne(row);
          acc.journal.push(entry);
          acc.bytesAfter += entry.next.bytes;
          acc.processed++;
        } catch (err) {
          acc.failed.push({ id: row.id, title: row.title, reason: err instanceof Error ? err.message : "unknown error" });
        }
      }
      setProgress({ done: pending.length, total: pending.length, label: "Finishing" });
      setReport({ ...acc, skipped: rows!.length - pending.length });
      const saved = acc.bytesBefore - acc.bytesAfter;
      toast.success(`Optimized ${acc.processed} photograph(s) — saved ${formatBytes(Math.max(0, saved))}`);
      qc.invalidateQueries();
    } finally {
      setRunning(false);
      setProgress(null);
    }
  }

  return (
    <div className="max-w-5xl">
      <header className="mb-8">
        <p className="eyebrow text-gold mb-2">Storage</p>
        <h1 className="font-display text-4xl">Studio storage overview</h1>
        <p className="text-sm text-muted-foreground mt-2">Everything the studio has uploaded. Watch usage grow, optimize older photographs, and clean up oversized files here.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Stat icon={ImageIcon} label="Photographs" value={summary.count.toLocaleString()} />
        <Stat icon={HardDrive} label="Storage used" value={formatBytes(summary.totalBytes)} />
        <Stat icon={TrendingUp} label="Average size" value={formatBytes(summary.averageBytes)} />
        <Stat
          icon={AlertTriangle}
          label="Oversized (>5MB)"
          value={oversized.length.toString()}
          tone={oversized.length > 0 ? "warn" : "ok"}
        />
      </div>

      <section className="bg-white border border-onyx/10 p-6 mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-display text-xl">Free-tier usage</h2>
          <span className={`text-xs ${warn ? "text-destructive" : "text-muted-foreground"}`}>{formatBytes(summary.totalBytes)} of {formatBytes(FREE_TIER_BYTES)} indicative</span>
        </div>
        <div className="h-2 bg-onyx/10 overflow-hidden">
          <div className={`h-full transition-all ${warn ? "bg-destructive" : "bg-gold"}`} style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Storage is provided by Lovable Cloud. When the studio approaches the free quota, an upgrade adds more room without changing anything in this panel.
        </p>
      </section>

      <section className="bg-white border border-onyx/10 p-6 mb-8">
        <div className="flex items-start justify-between gap-6 mb-4">
          <div>
            <h2 className="font-display text-xl mb-1">Optimize the library</h2>
            <p className="text-sm text-muted-foreground max-w-xl">
              Older photographs are stored at full camera size. Optimizing converts each one into four web-ready sizes,
              keeps the largest at 2560px, and removes the heavy original once the new versions are verified.
            </p>
          </div>
          <button
            onClick={runMigration}
            disabled={running || pending.length === 0}
            className="shrink-0 inline-flex items-center gap-2 bg-onyx text-cream px-5 py-3 text-[10px] uppercase tracking-[0.25em] disabled:opacity-40 hover:bg-gold transition-colors"
          >
            {running ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
            {running ? "Optimizing" : `Optimize ${pending.length || "all"}`}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <MiniStat label="Optimized" value={`${summary.optimized} / ${summary.count}`} />
          <MiniStat label="Still to optimize" value={pending.length.toString()} />
          <MiniStat label="Average per photograph" value={formatBytes(summary.averageBytes)} />
        </div>

        {progress && (
          <div className="mt-6">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span className="truncate">{progress.label}</span>
              <span className="tabular-nums">{progress.done} / {progress.total}</span>
            </div>
            <div className="h-1.5 bg-onyx/10 overflow-hidden">
              <div className="h-full bg-gold transition-all" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Keep this tab open until it finishes — you can safely re-run it later to continue.</p>
          </div>
        )}

        {report && (
          <div className="mt-6 border-t border-onyx/10 pt-5">
            <p className="eyebrow text-gold mb-3 flex items-center gap-2"><CheckCircle2 className="size-3.5" /> Optimization report</p>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>Optimized: <span className="text-onyx">{report.processed}</span></li>
              <li>Already optimized: <span className="text-onyx">{report.skipped}</span></li>
              <li>Before: <span className="text-onyx">{formatBytes(report.bytesBefore)}</span> → After: <span className="text-onyx">{formatBytes(report.bytesAfter)}</span></li>
              <li>Saved: <span className="text-onyx">{formatBytes(Math.max(0, report.bytesBefore - report.bytesAfter))}</span></li>
            </ul>
            {report.failed.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-destructive mb-1">{report.failed.length} could not be optimized:</p>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {report.failed.map((f) => (
                    <li key={f.id}>{f.title || "Untitled"} — {f.reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="bg-white border border-onyx/10 p-6">
        <h2 className="font-display text-xl mb-4">Largest photographs</h2>
        {largest.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Nothing uploaded yet.</p>
        ) : (
          <ul className="divide-y divide-onyx/5">
            {largest.map((r) => (
              <li key={r.id} className="py-3 flex items-center gap-4">
                <img src={variantUrl(r, "thumbnail")} alt="" width={56} height={56} loading="lazy" className="w-14 h-14 object-cover border border-onyx/10" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{r.title || "Untitled photograph"}</p>
                  <p className="text-xs text-muted-foreground">
                    {isOptimized(r) ? `${variantCount(r)} web sizes` : "Not optimized yet"}
                  </p>
                </div>
                <span className="text-sm tabular-nums text-muted-foreground">{formatBytes(r.bytes ?? 0)}</span>
                <a href={r.image_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-gold">
                  <ExternalLink className="size-4" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-onyx/10 p-4">
      <p className="eyebrow text-muted-foreground mb-1">{label}</p>
      <p className="font-display text-2xl">{value}</p>
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone?: "warn" | "ok" }) {
  return (
    <div className="bg-white border border-onyx/10 p-6">
      <div className="flex items-center justify-between mb-6 text-muted-foreground">
        <p className="eyebrow">{label}</p>
        <Icon className={`size-4 ${tone === "warn" ? "text-destructive" : ""}`} />
      </div>
      <p className={`font-display text-3xl ${tone === "warn" ? "text-destructive" : ""}`}>{value}</p>
    </div>
  );
}
