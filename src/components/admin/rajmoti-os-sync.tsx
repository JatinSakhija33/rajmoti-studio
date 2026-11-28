import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, CloudOff, Link2, LogOut, RefreshCw, ShieldCheck, Smartphone } from "lucide-react";
import {
  getRajmotiFirebase,
  connectRajmotiGoogle,
  disconnectRajmotiGoogle,
  verifyRajmotiMembership,
  watchRajmotiOperationalData
} from "@/lib/rajmoti-firebase-browser.mjs";
import { workflowSummary } from "@/lib/rajmoti-os-firestore-contract.mjs";

type FireDoc = {id: string; data: Record<string, unknown>};
type AuthStatus = "checking" | "disconnected" | "connecting" | "authorized" | "denied" | "error";
type LiveState = "waiting" | "loading" | "live" | "error";
type Summary = {
  jobs: Array<{
    documentId: string;
    id: number;
    billNumber: string;
    stage: string;
    itemDescription: string;
    productType: string;
    dueDateMs: number | null;
    balanceDue: number | null;
    customer: {name: string; phone: string} | null;
  }>;
  activeCount: number; dueTodayCount: number; overdueCount: number;
  outstandingCount: number; missingContactCount: number;
};
const currency = (v: number | null) => v === null ? "Not recorded" : "₹" + v.toLocaleString("en-IN");
const date = (value: number | null) => value === null ? "Not set" :
  new Date(value).toLocaleDateString("en-IN", {timeZone:"Asia/Kolkata", day:"numeric",month:"short",year:"numeric"});
const issueMessage = (error: unknown) => error instanceof Error ? error.message : String(error || "Connection error");

export function RajmotiOsSync({compact = false}: {compact?: boolean}) {
  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking");
  const [liveState, setLiveState] = useState<LiveState>("waiting");
  const [account, setAccount] = useState("");
  const [message, setMessage] = useState("");
  const [sessions, setSessions] = useState<FireDoc[] | null>(null);
  const [families, setFamilies] = useState<FireDoc[] | null>(null);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    let stopAuth: (() => void) | undefined;
    let stopData: (() => void) | undefined;
    let sequence = 0;
    getRajmotiFirebase().then(({auth, authSdk}) => {
      if (!alive) return;
      stopAuth = authSdk.onAuthStateChanged(auth, async (user: {uid: string; email?: string} | null) => {
        const request = ++sequence;
        stopData?.(); stopData = undefined;
        setSessions(null); setFamilies(null); setLastSync(null);
        setLiveState("waiting");
        if (!user) {
          setAuthStatus("disconnected"); setAccount(""); setMessage(""); return;
        }
        setAuthStatus("connecting");
        setAccount(user.email || "");
        try {
          const membership = await verifyRajmotiMembership(user);
          if (!alive || request !== sequence) return;
          if (!membership.ok) {
            setAuthStatus("denied"); setMessage(membership.reason); return;
          }
          setAuthStatus("authorized"); setMessage("Existing Firebase ADMIN membership verified.");
          setLiveState("loading");
          const stop = await watchRajmotiOperationalData({
            onSessions: rows => {if(alive && request===sequence) {setSessions(rows);setLastSync(Date.now());}},
            onFamilies: rows => {if(alive && request===sequence) {setFamilies(rows);setLastSync(Date.now());}},
            onError: error => {
              if (!alive || request!==sequence) return;
              setLiveState("error"); setMessage("Firestore read failed: " + issueMessage(error));
            }
          });
          if (alive && request===sequence) stopData = stop;
          else stop();
        } catch (error) {
          if (alive && request===sequence) {
            setAuthStatus("error"); setLiveState("error");
            setMessage(issueMessage(error));
          }
        }
      }, (error: unknown) => {
        if (alive) {setAuthStatus("error");setMessage(issueMessage(error));}
      });
    }).catch(error => {
      if (alive) {setAuthStatus("error");setMessage(issueMessage(error));}
    });
    return () => {alive=false; sequence++;stopData?.();stopAuth?.();};
  }, []);

  useEffect(() => {
    if (authStatus === "authorized" && sessions !== null && families !== null && liveState !== "error")
      setLiveState("live");
  }, [authStatus, sessions, families, liveState]);

  const summary = useMemo<Summary | null>(() => sessions !== null && families !== null
    ? workflowSummary(sessions, families) as Summary
    : null, [sessions, families]);

  async function connect() {
    setBusy(true);setMessage("");
    try {await connectRajmotiGoogle();}
    catch(error){setMessage(issueMessage(error));}
    finally{setBusy(false);}
  }
  async function disconnect() {
    setBusy(true);
    try {await disconnectRajmotiGoogle();}
    catch(error){setMessage(issueMessage(error));}
    finally{setBusy(false);}
  }

  return (
    <section className="rounded-2xl border border-[#e5e0d6] bg-white p-4 sm:p-6 space-y-4" aria-label="Rajmoti OS mobile sync">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-[#8a754f]">Android ↔ Website</p>
          <h2 className="font-display text-2xl">Rajmoti OS · Live jobs</h2>
          <p className="text-xs text-muted-foreground mt-1">Read-only preview from the named Firebase database; the existing Supabase workflow is unchanged.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs" role="status">
          {liveState==="live"?<CheckCircle2 className="size-3.5 text-green-700"/>:<CloudOff className="size-3.5 text-amber-700"/>}
          {liveState==="live"?"Live":authStatus==="disconnected"?"Not connected":authStatus==="denied"?"Access denied":authStatus==="error"?"Connection error":authStatus==="authorized"?"Loading jobs…":"Checking login…"}
        </span>
      </header>
      {authStatus==="disconnected" || authStatus==="denied" || authStatus==="error" ? (
        <div className="rounded-xl bg-[#f8f6f0] p-4 space-y-3">
          <p className="text-sm">Connect an existing Rajmoti OS Firebase administrator using Google. Your website email/password login stays the same.</p>
          <button type="button" disabled={busy} onClick={()=>void connect()}
            className="inline-flex items-center gap-2 rounded-lg bg-[#344b3d] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            <Link2 className="size-4"/> {busy?"Connecting…":"Connect with Google"}
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span><ShieldCheck className="inline size-4 mr-1"/>{account || "Checking Firebase identity"} {authStatus==="authorized"?"· ADMIN verified":""}</span>
          {authStatus==="authorized" && <button type="button" onClick={()=>void disconnect()} disabled={busy} className="inline-flex gap-1 items-center underline"><LogOut className="size-3.5"/>Disconnect</button>}
        </div>
      )}
      {message && (authStatus==="denied" || authStatus==="error" || liveState==="error") &&
        <p role="alert" className="rounded-md bg-amber-50 p-3 text-xs text-amber-900">{message}</p>}
      {summary && authStatus==="authorized" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[["Active jobs",summary.activeCount],["Due today",summary.dueTodayCount],["Overdue",summary.overdueCount],["With balance",summary.outstandingCount]].map(([label,value]) => (
              <div className="rounded-xl bg-[#f5f3ed] p-3" key={label}>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-2xl font-semibold tabular-nums mt-1">{value}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span><Smartphone className="size-3.5 inline mr-1"/>{sessions?.length || 0} sessions · {families?.length || 0} families loaded (up to 300 each)</span>
            <span><RefreshCw className="size-3.5 inline mr-1"/>Last update {lastSync?new Date(lastSync).toLocaleTimeString("en-IN"): "—"}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead><tr className="border-b text-xs text-muted-foreground"><th className="py-2 pr-4">Customer / bill</th><th className="py-2 pr-4">Job & stage</th><th className="py-2 pr-4">Due</th><th className="py-2">Balance</th></tr></thead>
              <tbody>{summary.jobs.slice(0,compact?8:50).map(job=>(
                <tr className="border-b border-[#eeeae2]" key={job.documentId}>
                  <td className="py-3 pr-4"><strong>{job.customer?.name||"Contact not linked"}</strong><div className="text-xs text-muted-foreground">{job.billNumber} · {job.customer?.phone||"No phone"}</div></td>
                  <td className="py-3 pr-4">{job.itemDescription||job.productType||"Studio job"}<div className="text-xs text-muted-foreground">{job.stage}</div></td>
                  <td className="py-3 pr-4 whitespace-nowrap">{date(job.dueDateMs)}</td>
                  <td className="py-3 whitespace-nowrap">{currency(job.balanceDue)}</td>
                </tr>
              ))}</tbody>
            </table>
            {!summary.jobs.length && <p className="py-5 text-sm text-muted-foreground">No compatible Android sessions returned. Verify your Firebase permissions and data fields.</p>}
          </div>
          {compact && summary.jobs.length>8 && <Link to="/admin/settings" search={{tab:"connections"}} className="text-sm underline">See more synced sessions in Connections</Link>}
        </>
      )}
      {authStatus==="authorized" && liveState==="loading" && <p className="text-sm text-muted-foreground">Reading sessions and linked families from Firestore…</p>}
    </section>
  );
}
