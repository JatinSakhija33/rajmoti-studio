import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@/demo/server-stub";
import { toast } from "sonner";
import { RefreshCw, Upload, Link2, Unlink } from "lucide-react";
import {
  googleContactsStatus,
  startGoogleContactsConnect,
  syncGoogleContacts,
  disconnectGoogleContacts,
} from "@/lib/google-contacts.functions";
import { analyseCsvContacts, parseGoogleCsv, importCsvContacts, decodeCsvBuffer, type CsvAnalysis } from "@/lib/contacts-csv";

function relative(iso: string | null) {
  if (!iso) return "never";
  const d = new Date(iso);
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  return d.toLocaleString();
}

export function GoogleContactsPanel() {
  const qc = useQueryClient();
  const status = useServerFn(googleContactsStatus);
  const start = useServerFn(startGoogleContactsConnect);
  const sync = useServerFn(syncGoogleContacts);
  const disconnect = useServerFn(disconnectGoogleContacts);
  const [csvOpen, setCsvOpen] = useState(false);

  const q = useQuery({ queryKey: ["google-contacts-status"], queryFn: () => status({ data: undefined as never }) });

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("google") === "connected") {
      toast.success("Google Contacts connected");
      qc.invalidateQueries({ queryKey: ["google-contacts-status"] });
      window.history.replaceState({}, "", window.location.pathname);
    } else if (p.get("google") === "error") {
      toast.error("Google Contacts could not be connected. Please try again.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [qc]);

  const connect = useMutation({
    mutationFn: async () => start({ data: { origin: window.location.origin } }),
    onSuccess: (r) => { window.location.href = r.url; },
    onError: () => toast.error("Google Contacts is not set up yet."),
  });

  const syncNow = useMutation({
    mutationFn: async () => sync({ data: {} }),
    onSuccess: (r) => {
      const bits: string[] = [];
      if (r.newContacts) bits.push(`${r.newContacts} new`);
      if (r.updated) bits.push(`${r.updated} updated`);
      if (r.matched) bits.push(`${r.matched} matched`);
      if (r.removedInGoogle) bits.push(`${r.removedInGoogle} removed in Google — kept in Rajmoti`);
      toast.success(bits.length ? bits.join(" · ") : "You're up to date.");
      qc.invalidateQueries({ queryKey: ["contacts"] });
      qc.invalidateQueries({ queryKey: ["contact-stats"] });
      qc.invalidateQueries({ queryKey: ["google-contacts-status"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Google Contacts could not be synced."),
  });

  const cut = useMutation({
    mutationFn: async () => disconnect({ data: undefined as never }),
    onSuccess: () => {
      toast.success("Google disconnected. Your Rajmoti contacts are unchanged.");
      qc.invalidateQueries({ queryKey: ["google-contacts-status"] });
    },
  });

  const s = q.data;

  return (
    <div className="bg-white border border-onyx/10 px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
      <div className="flex-1 min-w-[220px]">
        <p className="font-semibold flex items-center gap-2">
          Google Contacts
          {s?.connected && <span className="text-[11px] text-emerald-600">● Connected</span>}
        </p>
        <p className="text-xs text-muted-foreground">
          {!s
            ? "Checking…"
            : s.connected
              ? `${s.email ?? "Google account"} · ${s.contactsCount} synced · last sync ${relative(s.lastSyncAt)}`
              : s.configured
                ? "Import your existing Google contacts."
                : "Google sign-in isn't set up yet — you can still import a Google CSV export."}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {s?.connected ? (
          <>
            <button
              onClick={() => syncNow.mutate()}
              disabled={syncNow.isPending}
              className="eyebrow px-3 py-2 border border-onyx/15 hover:border-gold inline-flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`size-3.5 ${syncNow.isPending ? "animate-spin" : ""}`} />
              {syncNow.isPending ? "Syncing…" : "Sync now"}
            </button>
            <button
              onClick={() => { if (confirm("Disconnecting Google Contacts will stop synchronisation. Existing Rajmoti contacts will remain.")) cut.mutate(); }}
              className="eyebrow px-3 py-2 border border-onyx/15 hover:border-destructive inline-flex items-center gap-2"
            >
              <Unlink className="size-3.5" /> Disconnect
            </button>
          </>
        ) : (
          <button
            onClick={() => connect.mutate()}
            disabled={!s?.configured || connect.isPending}
            className="eyebrow px-3 py-2 bg-onyx text-cream hover:bg-gold hover:text-onyx inline-flex items-center gap-2 disabled:opacity-40"
          >
            <Link2 className="size-3.5" /> Connect Google
          </button>
        )}
        <button onClick={() => setCsvOpen(true)} className="eyebrow px-3 py-2 border border-onyx/15 hover:border-gold inline-flex items-center gap-2">
          <Upload className="size-3.5" /> Import CSV
        </button>
      </div>
      {csvOpen && <CsvImportDialog onClose={() => setCsvOpen(false)} />}
    </div>
  );
}

type Filter = "all" | "new" | "existing" | "duplicate" | "nophone";

function CsvImportDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"pick" | "reading" | "review" | "importing" | "done">("pick");
  const [analysis, setAnalysis] = useState<CsvAnalysis | null>(null);
  const [filter, setFilter] = useState<Filter>("new");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [imported, setImported] = useState(0);

  async function onFile(file: File) {
    setStep("reading");
    try {
      const parsed = parseGoogleCsv(decodeCsvBuffer(await file.arrayBuffer()));
      const a = await analyseCsvContacts(parsed.contacts, parsed.schema);
      setAnalysis(a);
      const preselect = new Set<number>();
      a.rows.forEach((r, i) => { if (r.status === "new") preselect.add(i); });
      setSelected(preselect);
      setFilter(preselect.size ? "new" : "all");
      setStep("review");
    } catch {
      toast.error("That file could not be read. Export contacts from Google as CSV and try again.");
      setStep("pick");
    }
  }

  const rows = analysis?.rows ?? [];
  const visible = rows
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => filter === "all" || r.status === filter);
  const counts = {
    all: rows.length,
    new: rows.filter((r) => r.status === "new").length,
    existing: rows.filter((r) => r.status === "existing").length,
    duplicate: rows.filter((r) => r.status === "duplicate").length,
    nophone: rows.filter((r) => r.status === "nophone").length,
  };
  const usable = rows.length - counts.nophone;
  const selectable = visible.filter(({ r }) => r.status === "new" || r.status === "duplicate");
  const allVisibleSelected = selectable.length > 0 && selectable.every(({ i }) => selected.has(i));
  const noPhonesDetected = rows.length > 0 && usable === 0;

  function toggle(i: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  }

  async function runImport() {
    if (!analysis) return;
    const chosen = [...selected]
      .map((i) => analysis.rows[i])
      .filter((r): r is NonNullable<typeof r> => Boolean(r && r.normalized && r.status !== "existing"));
    // never insert the same number twice in one run
    const seen = new Set<string>();
    const payload = chosen.filter((r) => (seen.has(r.normalized!) ? false : (seen.add(r.normalized!), true)));
    if (!payload.length) return;
    setStep("importing");
    try {
      const n = await importCsvContacts(payload, setImported);
      setImported(n);
      setStep("done");
      qc.invalidateQueries({ queryKey: ["contacts"] });
      qc.invalidateQueries({ queryKey: ["contact-stats"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Import failed.");
      setStep("review");
    }
  }

  const selectedCount = [...selected].filter((i) => rows[i]?.normalized && rows[i]?.status !== "existing").length;

  return (
    <div className="fixed inset-0 z-50 bg-onyx/60 grid place-items-center p-4" onClick={onClose}>
      <div className="bg-cream w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-onyx/10">
          <h2 className="font-display text-xl">Import Google Contacts</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Export from Google Contacts (Export → Google CSV), then upload the file here. Existing Rajmoti
            records are never changed.
          </p>
        </div>
        <div className="p-5 text-sm space-y-3 overflow-y-auto">
          {step === "pick" && (
            <>
              <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); }} />
              <button onClick={() => fileRef.current?.click()} className="eyebrow px-4 py-2 bg-onyx text-cream hover:bg-gold hover:text-onyx">
                Choose CSV file
              </button>
            </>
          )}
          {step === "reading" && <p className="text-muted-foreground">Reading contacts and matching existing records…</p>}
          {step === "review" && analysis && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Row label="Contacts found" value={rows.length} />
                <Row label="With usable phone numbers" value={usable} />
                <Row label="Already in Rajmoti" value={counts.existing} />
                <Row label="New contacts" value={counts.new} />
                <Row label="Possible duplicates" value={counts.duplicate} />
                <Row label="Without usable phone numbers" value={counts.nophone} />
              </div>

              {noPhonesDetected ? (
                <div className="border border-onyx/15 bg-white p-3 space-y-2">
                  <p className="font-semibold">
                    We found {rows.length} contacts, but couldn&apos;t identify their phone-number columns.
                    No contacts were imported.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Columns detected in your file: {analysis.schema.headers.slice(0, 12).join(", ") || "none"}
                    {analysis.schema.headers.length > 12 ? "…" : ""}
                  </p>
                  <button onClick={() => { setAnalysis(null); setStep("pick"); }} className="eyebrow px-3 py-2 border border-onyx/15 hover:border-gold">
                    Choose a different CSV
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap gap-1">
                    {([
                      ["all", `All (${counts.all})`],
                      ["new", `New (${counts.new})`],
                      ["existing", `Existing (${counts.existing})`],
                      ["duplicate", `Duplicates (${counts.duplicate})`],
                      ["nophone", `No phone (${counts.nophone})`],
                    ] as [Filter, string][]).map(([k, label]) => (
                      <button key={k} onClick={() => setFilter(k)}
                        className={`eyebrow px-2.5 py-1.5 border text-[11px] ${filter === k ? "bg-onyx text-cream border-onyx" : "border-onyx/15 hover:border-gold"}`}>
                        {label}
                      </button>
                    ))}
                  </div>

                  <div className="border border-onyx/10 bg-white">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-onyx/10 text-xs">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        disabled={!selectable.length}
                        onChange={() => setSelected((prev) => {
                          const next = new Set(prev);
                          if (allVisibleSelected) selectable.forEach(({ i }) => next.delete(i));
                          else selectable.forEach(({ i }) => next.add(i));
                          return next;
                        })}
                      />
                      <span>Select all shown</span>
                      <span className="ml-auto text-muted-foreground">{selectedCount} selected</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-onyx/5">
                      {visible.slice(0, 500).map(({ r, i }) => (
                        <label key={i} className="flex items-center gap-3 px-3 py-2 text-xs cursor-pointer hover:bg-onyx/[0.03]">
                          <input
                            type="checkbox"
                            checked={selected.has(i)}
                            disabled={r.status === "existing" || !r.normalized}
                            onChange={() => toggle(i)}
                          />
                          <span className="flex-1 truncate">{r.name ?? "Unnamed"}</span>
                          <span className="w-32 truncate text-muted-foreground">{r.phone ?? "—"}</span>
                          <span className="w-24 text-right text-muted-foreground">
                            {r.status === "new" ? "New"
                              : r.status === "existing" ? "In Rajmoti"
                              : r.status === "duplicate" ? "Duplicate"
                              : "No phone"}
                          </span>
                        </label>
                      ))}
                      {!visible.length && <p className="px-3 py-4 text-xs text-muted-foreground">Nothing in this view.</p>}
                    </div>
                    {visible.length > 500 && (
                      <p className="px-3 py-2 text-[11px] text-muted-foreground border-t border-onyx/10">
                        Showing the first 500 of {visible.length}. Use “Select all shown” to include every one of them.
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
          {step === "importing" && <p className="text-muted-foreground">Importing… {imported} added</p>}
          {step === "done" && (
            <div>
              <p className="font-semibold">Done</p>
              <p className="text-muted-foreground">
                {imported} new contacts added. {counts.existing} existing contacts matched and left untouched.
              </p>
            </div>
          )}
        </div>
        <div className="p-5 border-t border-onyx/10 flex justify-end gap-2">
          <button onClick={onClose} className="eyebrow px-4 py-2 border border-onyx/15 hover:border-gold">
            {step === "done" ? "Close" : "Cancel"}
          </button>
          {step === "review" && !noPhonesDetected && selectedCount > 0 && (
            <button onClick={runImport} className="eyebrow px-5 py-2 bg-onyx text-cream hover:bg-gold hover:text-onyx">
              Import {selectedCount} selected
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between border-b border-onyx/10 pb-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value.toLocaleString()}</span>
    </div>
  );
}

