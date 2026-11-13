import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowRight, CalendarDays, CheckCircle2, ChevronRight, CircleDollarSign, ClipboardList, Clock3, CloudOff, Gift, LayoutGrid, ListFilter, MessageCircle, Plus, RefreshCw, Search, ShieldCheck, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { StudioJobEditor } from "@/components/admin/studio-job-editor";
import { useAuth } from "@/lib/use-auth";
import { whatsappLink } from "@/lib/site";
import {
  emptyJob, fetchStudioJobs, isReviewed, JOB_TEMPLATES, mergePending,
  phoneDigits, readCache, readPending, saveCache, savePending, STAGES,
  today, tomorrow, writeJob, type StudioJob, type JobStage, type JobPriority,
} from "@/lib/studio-jobs";

export const Route = createFileRoute("/admin/workflow")({
  head: () => ({ meta: [{ title: "Studio Workflow — Rajmoti Studio" }] }),
  component: StudioWorkflow,
});

type View = "board" | "today" | "all" | "templates";
const LABELS: Record<JobStage, string> = { received: "New", editing: "Editing", review: "Review", printing: "Printing", ready: "Ready", delivered: "Delivered" };
const PRIORITY_CLASS: Record<JobPriority, string> = { urgent: "bg-[#ffede5] text-[#a53d1d]", high: "bg-[#fff0de] text-[#a16b21]", normal: "bg-[#edf2ea] text-[#516953]", low: "bg-[#f0f0f0] text-[#666]" };
const stageOrder = (job: StudioJob) => STAGES.indexOf(job.job_status);
const formatDate = (s?: string | null) => s ? new Date(`${s}T12:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Unscheduled";

function StudioWorkflow() {
  const { user, isAdmin } = useAuth();
  const userId = user?.id || "";
  const [jobs, setJobs] = useState<StudioJob[]>([]);
  const [pending, setPending] = useState<StudioJob[]>([]);
  const pendingRef = useRef<StudioJob[]>([]);
  const syncingRef = useRef(false);
  const [online, setOnline] = useState(true);
  const [backendReady, setBackendReady] = useState(true);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState<View>("board");
  const [search, setSearch] = useState("");
  const [showDone, setShowDone] = useState(false);
  const [editor, setEditor] = useState<StudioJob | null>(null);
  const [day, setDay] = useState(today());
  const [priorityFilter, setPriorityFilter] = useState("");

  const load = useCallback(async (id: string) => {
    if (typeof navigator !== "undefined" && !navigator.onLine) { setBackendReady(false); setLoading(false); return; }
    try {
      const remote = await fetchStudioJobs();
      const queue = readPending(id);
      const combined = mergePending(remote, queue);
      setJobs(combined);
      saveCache(id, combined);
      setBackendReady(true);
      setError("");
    } catch (e) {
      setBackendReady(false);
      setError(e instanceof Error ? `Database unavailable: ${e.message}. Showing browser-saved jobs.` : "Database unavailable. Showing browser-saved jobs.");
      setJobs(mergePending(readCache(id), readPending(id)));
    } finally { setLoading(false); }
  }, []);

  const syncQueue = useCallback(async (id: string) => {
    if (syncingRef.current || !navigator.onLine) return;
    syncingRef.current = true;
    setSyncing(true);
    let completed = 0;
    try {
      const snapshot = [...pendingRef.current];
      for (const item of snapshot) {
        await writeJob(item);
        // Do not drop updates that arrived while the request was in flight.
        if (pendingRef.current.find((j) => j.id === item.id) === item) {
          pendingRef.current = pendingRef.current.filter((j) => j.id !== item.id);
          savePending(id, pendingRef.current);
          setPending([...pendingRef.current]);
        }
        completed++;
      }
      if (completed) toast.success(`${completed} job change(s) saved to demo storage`);
      setBackendReady(true);
    } catch (e) {
      setBackendReady(false);
      setError(`Changes are safe on this browser, but syncing failed: ${e instanceof Error ? e.message : "unknown error"}`);
    } finally { syncingRef.current = false; setSyncing(false); await load(id); }
  }, [load]);

  useEffect(() => {
    if (!userId || !isAdmin) return;
    const currentQueue = readPending(userId);
    pendingRef.current = currentQueue;
    setPending(currentQueue);
    setJobs(mergePending(readCache(userId), currentQueue));
    setOnline(navigator.onLine);
    void load(userId).then(() => { if (navigator.onLine && currentQueue.length) void syncQueue(userId); });
    const onOnline = () => { setOnline(true); void syncQueue(userId); };
    const onOffline = () => { setOnline(false); setBackendReady(false); };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => { window.removeEventListener("online", onOnline); window.removeEventListener("offline", onOffline); };
  }, [userId, isAdmin, load, syncQueue]);

  const saveJob = async (item: StudioJob) => {
    if (!userId) throw new Error("Sign in first to save jobs.");
    // Metadata is written locally FIRST so paused backends don't lose intake.
    const updated = mergePending(jobs.filter((j) => j.id !== item.id), [item]);
    const nextPending = [...pendingRef.current.filter((j) => j.id !== item.id), item];
    try {
      saveCache(userId, updated);
      savePending(userId, nextPending);
    } catch { throw new Error("Could not save a browser backup. Check available storage before closing this window."); }
    pendingRef.current = nextPending;
    setPending(nextPending);
    setJobs(updated);
    toast.success(navigator.onLine ? "Demo job saved on this device…" : "Job queued safely on this browser (offline)");
    if (navigator.onLine) void syncQueue(userId);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobs.filter((job) => {
      if (!showDone && job.job_status === "delivered") return false;
      if (priorityFilter && job.priority !== priorityFilter) return false;
      if (!q) return true;
      return [job.customer_name, job.phone, job.photo_type, job.requested_size, job.memorial_name, job.notes, job.background_instructions, job.restoration_instructions].some((v) => (v || "").toLowerCase().includes(q));
    }).sort((a, b) => {
      const rank = { urgent: 0, high: 1, normal: 2, low: 3 };
      return rank[a.priority] - rank[b.priority] || (a.due_on || "9999").localeCompare(b.due_on || "9999");
    });
  }, [jobs, showDone, search, priorityFilter]);
  const active = jobs.filter((job) => job.job_status !== "delivered");
  const late = active.filter((job) => job.due_on && job.due_on < today()).length;
  const due = active.filter((job) => job.due_on === today()).length;
  const unpaid = active.filter((job) => job.payment_status !== "paid").length;
  const pickedDay = filtered.filter((job) => job.due_on === day);
  const unscheduled = filtered.filter((job) => !job.due_on);
  const overdue = filtered.filter((job) => job.due_on && job.due_on < today());
  const tabs: { id: View; label: string; icon: typeof LayoutGrid }[] = [
    { id: "board", label: "Production board", icon: LayoutGrid },
    { id: "today", label: "Date planner", icon: CalendarDays },
    { id: "all", label: "All jobs", icon: ListFilter },
    { id: "templates", label: "Quick templates", icon: ClipboardList },
  ];

  function advance(job: StudioJob) {
    const next = STAGES[stageOrder(job) + 1];
    if (!next || next === "delivered") return setEditor(job);
    void saveJob({ ...job, job_status: next, delivery_status: next === "ready" ? "ready" : job.delivery_status });
  }
  function resetCache() {
    if (pending.length) { toast.error("Sync pending edits before clearing the browser cache."); return; }
    if (!confirm("Clear the saved local view of studio jobs on this device? Demo records remain in this browser.")) return;
    localStorage.removeItem(`rajmoti:studio-jobs:cache:v1:${userId}`);
    setJobs([]);
    toast.success("Local job snapshot cleared");
    if (online) void load(userId);
  }

  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-start justify-between gap-5"><div><p className="eyebrow text-gold mb-3">Single-owner command centre</p><h1 className="font-display text-4xl md:text-5xl">Studio workflow</h1><p className="text-sm leading-6 text-muted-foreground mt-3">Every walk-in, edit, print and delivery in one place.</p></div><div className="flex flex-wrap items-center gap-2"><Link to="/admin/gifts" className="border border-onyx/20 px-3 py-3 text-xs flex gap-2 items-center"><Gift className="size-4" /> Gift inbox</Link><button onClick={() => setEditor(emptyJob())} className="bg-onyx text-cream px-5 py-3 text-xs flex gap-2 items-center font-semibold"><Plus className="size-4" /> New walk-in job</button></div></header>
      <div className="flex flex-wrap gap-3 items-center text-xs"><span className={`inline-flex items-center gap-2 px-3 py-2 border ${online && backendReady ? "border-green-200 bg-green-50 text-green-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>{online && backendReady ? <Wifi className="size-4" /> : <WifiOff className="size-4" />}{online && backendReady ? "Demo records · saved in this browser" : online ? "Database paused or unavailable · local mode" : "Offline · local mode"}</span>{pending.length > 0 && <span className="px-3 py-2 bg-[#fff1df] text-[#825b31] border border-[#ebcf9a]">{pending.length} unsynced edit(s) · kept on this browser</span>}<button disabled={!online || syncing} onClick={() => void syncQueue(userId).then(() => { if (pendingRef.current.length === 0) void load(userId); })} className="inline-flex items-center gap-2 border border-onyx/20 px-3 py-2 disabled:opacity-40"><RefreshCw className={`size-3.5 ${syncing ? "animate-spin" : ""}`} /> Save demo changes</button>{pending.length === 0 && <button onClick={resetCache} className="underline text-muted-foreground ml-auto">Clear local cache</button>}</div>
      {error && <div role="alert" className="bg-amber-50 border border-amber-200 text-amber-900 text-xs px-4 py-3 flex gap-2 items-start"><AlertTriangle className="size-4 shrink-0" />{error}</div>}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[{ label: "Jobs in progress", value: active.length, sub: "not yet delivered", icon: ClipboardList }, { label: "Due today", value: due, sub: formatDate(today()), icon: Clock3 }, { label: "Overdue", value: late, sub: "needs attention", icon: AlertTriangle }, { label: "Payment follow-up", value: unpaid, sub: "not fully paid", icon: CircleDollarSign }].map(({ label, value, sub, icon: Icon }) => <div key={label} className="border border-onyx/10 bg-white px-5 py-5"><div className="flex items-center justify-between gap-2 text-muted-foreground mb-4"><span className="text-xs">{label}</span><Icon className="size-5 text-[#aa8955]" /></div><p className="font-display text-4xl leading-none">{value}</p><p className="text-[11px] text-muted-foreground mt-3">{sub}</p></div>)}
      </div>
      <div className="flex flex-wrap items-center gap-2 border-b border-onyx/10 overflow-x-auto">{tabs.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setView(id)} className={`px-4 py-3 text-xs font-semibold inline-flex items-center gap-2 whitespace-nowrap border-b-2 ${view === id ? "border-gold text-onyx" : "border-transparent text-muted-foreground hover:text-onyx"}`}><Icon className="size-4" />{label}</button>)}</div>
      {view !== "templates" && <div className="flex flex-wrap items-center gap-3"><div className="flex-1 min-w-[180px] bg-white border border-onyx/20 px-3 flex items-center gap-2"><Search className="size-4 text-muted-foreground" /><input value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search by customer, phone, instructions, or size" placeholder="Search names, phones, instructions, print size…" className="py-3 min-w-0 flex-1 outline-none text-xs bg-transparent" /></div><select aria-label="Filter priority" className="border border-onyx/20 bg-white px-3 py-3 text-xs" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}><option value="">All priorities</option><option value="urgent">Urgent</option><option value="high">High</option><option value="normal">Normal</option><option value="low">Low</option></select><label className="inline-flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} /> Show delivered</label></div>}

      {view === "board" && <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{STAGES.map((stage) => { const group = filtered.filter((job) => job.job_status === stage); return <section key={stage} className="bg-[#f0ece4] border border-onyx/5 p-3 rounded-sm min-h-52"><div className="flex items-center justify-between mb-4 px-2"><h2 className="text-lg">{LABELS[stage]}</h2><span className="text-xs font-semibold text-muted-foreground bg-white px-2 py-1">{group.length}</span></div><div className="space-y-3">{group.map((job) => <JobCard key={job.id} job={job} pending={pending.some((p) => p.id === job.id)} onEdit={() => setEditor(job)} onAdvance={() => advance(job)} />)}{group.length === 0 && <div className="py-8 text-center text-xs text-muted-foreground">No jobs in this stage.</div>}</div></section>; })}</div>}

      {view === "today" && <div className="grid lg:grid-cols-[1fr_280px] gap-6"><div className="space-y-6"><div className="bg-white border border-onyx/10 p-5 flex flex-wrap justify-between gap-3 items-end"><div><p className="eyebrow text-gold mb-2">Plan your day</p><h2 className="text-2xl">Jobs due on {formatDate(day)}</h2></div><input aria-label="Choose planning date" type="date" value={day} onChange={(e) => setDay(e.target.value)} className="border border-onyx/20 px-3 py-2 text-sm" /></div>{pickedDay.length === 0 ? <div className="bg-white border border-onyx/10 p-10 text-sm text-center text-muted-foreground">No jobs due on this date.</div> : <div className="grid gap-3">{pickedDay.map((job) => <JobCard key={job.id} job={job} pending={pending.some((p) => p.id === job.id)} onEdit={() => setEditor(job)} onAdvance={() => advance(job)} />)}</div>} {overdue.length > 0 && <div><h3 className="text-xl mb-3 flex items-center gap-2"><AlertTriangle className="size-5 text-orange-700" /> Overdue jobs ({overdue.length})</h3><div className="grid sm:grid-cols-2 gap-3">{overdue.map((job) => <JobCard key={job.id} job={job} pending={pending.some((p) => p.id === job.id)} onEdit={() => setEditor(job)} onAdvance={() => advance(job)} />)}</div></div>}</div><aside className="bg-white border border-onyx/10 p-5 self-start"><h3 className="font-display text-xl mb-4">Quick dates</h3><div className="space-y-1">{Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; const n = filtered.filter((j) => j.due_on === iso).length; return <button key={iso} type="button" onClick={() => setDay(iso)} className={`w-full py-3 px-2 flex justify-between text-xs ${day === iso ? "bg-[#f3e9d8] font-semibold" : "hover:bg-[#f7f5ef]"}`}><span>{i === 0 ? "Today" : i === 1 ? "Tomorrow" : formatDate(iso)}</span><span>{n} job(s)</span></button>; })}</div><div className="border-t border-onyx/10 mt-4 pt-5"><h4 className="text-xs font-semibold">Unscheduled ({unscheduled.length})</h4>{unscheduled.slice(0, 6).map((job) => <button key={job.id} className="block text-left text-xs py-2 underline" onClick={() => setEditor(job)}>{job.customer_name} — {job.photo_type}</button>)}</div></aside></div>}

      {view === "all" && <div className="overflow-x-auto bg-white border border-onyx/10"><table className="min-w-[850px] w-full text-left text-xs"><thead className="bg-[#f1ece4] text-muted-foreground uppercase tracking-wider"><tr>{["Customer / contact", "Photo type", "Print size", "Due", "Priority", "Production", "Payment", "Delivery", "Notes"].map((h) => <th key={h} className="p-3 font-semibold">{h}</th>)}</tr></thead><tbody className="divide-y divide-onyx/10">{filtered.map((job) => <tr key={job.id} onClick={() => setEditor(job)} onKeyDown={(e) => { if (e.key === "Enter") setEditor(job); }} tabIndex={0} role="button" className="hover:bg-[#faf7f1] cursor-pointer focus:outline-2 focus:outline-gold"><td className="p-3 font-semibold">{job.customer_name}<span className="block font-normal mt-1 text-muted-foreground">{job.phone || "No phone"}</span>{pending.some((p) => p.id === job.id) && <span className="text-amber-700 text-[10px]">Unsynced</span>}</td><td className="p-3">{job.photo_type}</td><td className="p-3">{job.requested_size}</td><td className="p-3">{formatDate(job.due_on)}</td><td className="p-3 capitalize">{job.priority}</td><td className="p-3">{LABELS[job.job_status]}</td><td className="p-3 capitalize">{job.payment_status}</td><td className="p-3 capitalize">{job.delivery_status.replace(/_/g, " ")}</td><td className="p-3 max-w-52 truncate" title={job.notes}>{job.notes || job.assumptions || "—"}</td></tr>)}</tbody></table>{filtered.length === 0 && <p className="p-10 text-center text-sm text-muted-foreground">No jobs found.</p>}</div>}

      {view === "templates" && <div><div className="flex flex-wrap items-end justify-between gap-4 mb-6"><div><h2 className="text-2xl">Start with a familiar request</h2><p className="text-xs leading-6 text-muted-foreground mt-2">Templates pre-fill instructions only; client details and unconfirmed information remain editable.</p></div><div className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 text-[#b18a4c]" /> Identity preservation on every job</div></div><div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{JOB_TEMPLATES.map((template) => <button type="button" key={template.id} onClick={() => setEditor(emptyJob(template))} className="bg-white border border-onyx/10 hover:border-gold hover:shadow-md text-left px-6 py-6 transition-all"><p className="eyebrow text-gold mb-3">{template.photoType} · {template.size}</p><h3 className="text-2xl mb-3">{template.name}</h3><p className="text-xs leading-6 text-muted-foreground min-h-20">{template.restoration}</p><span className="flex gap-2 items-center text-xs font-semibold mt-6">Start new job <ArrowRight className="size-4" /></span></button>)}</div></div>}

      {loading && <p className="text-xs text-muted-foreground">Checking the studio database and local job cache…</p>}
      <div className="border-t border-onyx/10 pt-5 text-[11px] text-muted-foreground flex flex-wrap gap-3 items-center justify-between"><p>Local offline backups save customer job metadata in this browser only; use a trusted device. Photos are never cached here for offline access.</p><p>Do not overwrite originals · Confirm unknowns · Verify before printing</p></div>
      {editor && <StudioJobEditor key={editor.id} job={editor} otherJobs={jobs} online={online && backendReady} onClose={() => setEditor(null)} onSave={saveJob} />}
    </div>
  );
}

function JobCard({ job, pending, onEdit, onAdvance }: { job: StudioJob; pending: boolean; onEdit: () => void; onAdvance: () => void }) {
  const late = job.due_on && job.due_on < today() && job.job_status !== "delivered";
  return <article className="bg-white border border-onyx/10 p-4 shadow-sm"><div className="flex items-center justify-between gap-2 mb-3"><span className={`text-[10px] uppercase tracking-wide px-2 py-1 font-semibold ${PRIORITY_CLASS[job.priority]}`}>{job.priority}</span><span className={`text-[11px] ${late ? "text-red-700 font-semibold" : "text-muted-foreground"}`}><Clock3 className="inline size-3 mr-1" />{formatDate(job.due_on)}{late ? " · Late" : ""}</span></div><button type="button" className="block text-left w-full" onClick={onEdit}><h3 className="font-display text-xl leading-snug">{job.customer_name}</h3><p className="text-xs text-muted-foreground mt-1">{job.photo_type} · {job.requested_size}</p>{job.memorial_name && <p className="text-xs mt-2">{job.memorial_name}</p>}<p className="text-[11px] text-muted-foreground leading-5 mt-3 line-clamp-2">{job.restoration_instructions || job.background_instructions || job.notes || "Tap to add instructions"}</p></button><div className="flex gap-2 flex-wrap text-[10px] my-3"><span className="bg-[#f2f0eb] px-2 py-1">Payment: {job.payment_status}</span><span className="bg-[#f2f0eb] px-2 py-1">Delivery: {job.delivery_status.replace(/_/g, " ")}</span>{!isReviewed(job) && <span className="bg-[#fff3df] px-2 py-1">Review pending</span>}{pending && <span className="bg-amber-100 px-2 py-1 text-amber-900"><CloudOff className="size-3 inline mr-1" />Unsynced</span>}</div><div className="border-t border-onyx/10 pt-3 flex items-center justify-between gap-3"><div className="flex gap-3 items-center">{phoneDigits(job.phone).length >= 10 && <a title="Message customer" href={whatsappLink(`Hello ${job.customer_name}, this is Rajmoti Studio about your ${job.photo_type} order.`, job.phone)} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-gold"><MessageCircle className="size-4" /></a>}<button onClick={onEdit} className="text-xs underline hover:text-gold">Details</button></div>{job.job_status !== "delivered" && <button onClick={onAdvance} className="text-[11px] font-semibold inline-flex gap-1 items-center text-[#947249]">{stageOrder(job) === STAGES.length - 2 ? "Review delivery" : "Next stage"}<ChevronRight className="size-3" /></button>}{job.job_status === "delivered" && <span className="text-xs text-green-700 flex items-center gap-1"><CheckCircle2 className="size-4" /> Completed</span>}</div></article>;
}
