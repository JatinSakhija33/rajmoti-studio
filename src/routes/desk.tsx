import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, RefreshCw, ShieldCheck, IndianRupee, Download, Search } from "lucide-react";
const stages = ["received","editing","review","printing","framing","ready","delivered","cancelled"] as const;
type Job = {
  id: string; source: string; customer_name:string; phone:string; service_type:string; preferred_date:string;
  status: string; notes:string; created_at:string; quoted_total:number; paid_amount:number;
  payment_status:string; payment_reference:string; photo_count:number; items_json:string;
};
export const Route = createFileRoute("/desk")({
  head: () => ({ meta: [{title:"Owner Work Desk — Rajmoti Studio"}, {name:"robots",content:"noindex,nofollow"}] }),
  component: Desk,
});
function rupees(paise: number) { return (Number(paise||0)/100).toLocaleString("en-IN",{style:"currency",currency:"INR"}); }
function parseRupees(s: string) { const n=Number(s); return Number.isFinite(n)&&n>=0 ? Math.round(n*100) : NaN; }
function Desk() {
  const [jobs,setJobs]=useState<Job[]>([]);
  const [selected,setSelected]=useState<Job|null>(null);
  const [query,setQuery]=useState("");
  const [status,setStatus]=useState("all");
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [photoIds,setPhotoIds]=useState<string[]>([]);
  const [total,setTotal]=useState("");
  const [paid,setPaid]=useState("");
  const [reference,setReference]=useState("");
  const [notes,setNotes]=useState("");
  const [stage,setStage]=useState("received");
  const load=useCallback(async()=>{
    setLoading(true);setError("");
    try{
      const r=await fetch("/api/owner/orders",{credentials:"same-origin",cache:"no-store"});
      const data=await r.json();
      if(!r.ok)throw Error(data.error||"Unable to access the owner work desk");
      setJobs(data.orders||[]);
    }catch(e){setError(e instanceof Error?e.message:"Unable to retrieve orders");}
    finally{setLoading(false);}
  },[]);
  useEffect(()=>{void load();},[load]);
  useEffect(()=>{
    if(!selected){setPhotoIds([]);return;}
    setStage(selected.status);
    setTotal((Number(selected.quoted_total||0)/100).toFixed(2));
    setPaid((Number(selected.paid_amount||0)/100).toFixed(2));
    setReference(selected.payment_reference||"");
    setNotes(selected.notes||"");
    let active=true;
    void fetch("/api/owner/orders/"+encodeURIComponent(selected.id),{credentials:"same-origin"}).then(r=>r.json()).then(v=>{
      if(active)setPhotoIds((v.photos||[]).map((p:{id:string})=>p.id));
    }).catch(()=>{if(active)setPhotoIds([]);});
    return()=>{active=false;};
  },[selected?.id]);

  const shown=useMemo(()=>jobs.filter(j=>(status==="all"||j.status===status)&&
    [j.customer_name,j.phone,j.id,j.service_type,j.notes].join(" ").toLowerCase().includes(query.toLowerCase())),[jobs,status,query]);
  async function save() {
    if(!selected)return;
    const quoted_total=parseRupees(total),paid_amount=parseRupees(paid);
    if(!Number.isSafeInteger(quoted_total)||!Number.isSafeInteger(paid_amount)||paid_amount>quoted_total){
      setError("Enter valid amounts; received payment cannot exceed the total.");return;
    }
    if(paid_amount>0 && !reference.trim()){setError("Verify the bank payment and add its transaction reference.");return;}
    setSaving(true);setError("");setNotice("");
    try{
      const r=await fetch("/api/owner/orders/"+encodeURIComponent(selected.id),{
        method:"PATCH",credentials:"same-origin",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({status:stage,quoted_total,paid_amount,payment_reference:reference,notes}),
      });
      const result=await r.json();
      if(!r.ok)throw Error(result.error||"Could not save");
      setNotice("Job updated. Payment amounts are based on owner-entered bank verification.");
      await load();
      setSelected(null);
    }catch(e){setError(e instanceof Error?e.message:"Failed to save");}
    finally{setSaving(false);}
  }
  return <div className="min-h-dvh bg-[#f8f5ef] text-[#27231d]">
    <header className="border-b border-[#d8d0c4] p-5 md:px-10 flex items-center justify-between gap-4">
      <div><p className="uppercase text-xs tracking-[0.22em] text-[#9a7845]">Rajmoti Studio · Private</p>
        <h1 className="font-display text-2xl md:text-4xl">Owner Work Desk</h1></div>
      <div className="flex items-center gap-3"><Link to="/" className="text-sm underline flex items-center gap-1"><ArrowLeft size={14}/> Website</Link>
        <button onClick={()=>void load()} className="border p-2" aria-label="Refresh jobs"><RefreshCw size={18}/></button></div>
    </header>
    <main className="max-w-7xl mx-auto p-5 md:p-10">
      <p className="text-sm text-[#675e53] mb-6"><ShieldCheck size={16} className="inline"/> Owner access is verified on the server. This desk manages real intake, job stages, photos and manual payment records. Website demo administration is not used here.</p>
      {notice && <p role="status" className="bg-[#e7f3e9] p-3 mb-4">{notice}</p>}
      {error && <p role="alert" className="bg-[#ffeded] text-[#8d2626] p-3 mb-4">{error}. Make sure Cloudflare Access and D1 are configured.</p>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          ["Total jobs",jobs.length],
          ["Active",jobs.filter(j=>!["delivered","cancelled"].includes(j.status)).length],
          ["Ready",jobs.filter(j=>j.status==="ready").length],
          ["Pending balance",rupees(jobs.filter(j=>j.status!=="cancelled").reduce((s,j)=>s+Math.max(0,(Number(j.quoted_total)||0)-(Number(j.paid_amount)||0)),0))],
        ].map(([label,value])=><div key={String(label)} className="bg-white border border-[#e9dfd4] p-5">
          <p className="text-xs uppercase tracking-wide text-[#72665b]">{label}</p>
          <p className="font-display text-2xl mt-2">{value}</p></div>)}
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <label className="flex items-center bg-white border px-3 flex-1 gap-2"><Search size={16}/>
          <input className="w-full py-3 outline-none" placeholder="Find customer, phone or job" value={query} onChange={e=>setQuery(e.target.value)}/>
        </label>
        <select aria-label="Filter by production stage" className="bg-white border p-3" value={status} onChange={e=>setStatus(e.target.value)}>
          <option value="all">All stages</option>{stages.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="grid md:grid-cols-[1fr_380px] gap-6">
        <section className="min-w-0 bg-white border border-[#e9dfd4]">
          <div className="border-b p-4 flex justify-between"><strong>Orders & enquiries</strong><span className="text-xs text-[#71685c]">{shown.length} shown</span></div>
          {loading?<p className="p-6">Loading real orders…</p>:!shown.length?<p className="p-6 text-sm">No matching jobs. New website enquiries will appear here after D1 and Turnstile are connected.</p>:
          <div className="divide-y">{shown.map(j=><button key={j.id} onClick={()=>setSelected(j)} className={"w-full text-left p-4 hover:bg-[#fbf8f3] "+(selected?.id===j.id?"bg-[#fbf3e7]":"")}>
            <div className="flex justify-between gap-3"><strong>{j.customer_name}</strong><span className="uppercase text-[10px] tracking-wide">{j.status}</span></div>
            <p className="text-sm mt-1">{j.service_type} · {j.phone}</p>
            <p className="text-xs text-[#756c60] mt-1">{new Date(j.created_at+"Z").toLocaleDateString("en-IN")} · {j.photo_count} photos · Due {j.preferred_date||"not set"} · {rupees(j.quoted_total)}</p>
          </button>)}</div>}
        </section>
        <aside className="bg-white border border-[#e9dfd4] p-5 self-start">
          {!selected?<div className="text-sm text-[#756c60] p-4">Select a job to review details, record the verified payment and update its production stage.</div>:<>
            <p className="uppercase text-xs tracking-[0.18em] text-[#987244] mb-2">Job · {selected.id.slice(0,8)}</p>
            <h2 className="font-display text-2xl">{selected.customer_name}</h2>
            <p className="text-sm my-2">{selected.service_type} · {selected.phone}</p>
            <p className="text-xs text-[#7a6a57] mb-4">Source: {selected.source} · Reference {selected.id.slice(0,8).toUpperCase()}</p>
            <label className="block mb-3 text-sm">Production status
              <select className="w-full border p-3 mt-1" value={stage} onChange={e=>setStage(e.target.value)}>
                {stages.map(x=><option value={x} key={x}>{x}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">Total ₹ <input className="w-full border p-2 mt-1" type="number" min="0" step="0.01" value={total} onChange={e=>setTotal(e.target.value)}/></label>
              <label className="block text-sm">Paid ₹ <input className="w-full border p-2 mt-1" type="number" min="0" step="0.01" value={paid} onChange={e=>setPaid(e.target.value)}/></label>
            </div>
            <label className="block text-sm my-3">Verified bank/UPI reference
              <input className="w-full border p-2 mt-1" value={reference} onChange={e=>setReference(e.target.value)}
                placeholder="Only after checking bank statement"/></label>
            <label className="block text-sm mb-3">Instructions and notes
              <textarea className="w-full border p-3 mt-1" rows={4} value={notes} onChange={e=>setNotes(e.target.value)}/></label>
            <p className="text-sm mb-2">Private customer files ({photoIds.length})</p>
            <div className="flex flex-wrap gap-2 mb-5">{photoIds.map((id,i)=><a key={id} href={"/api/owner/orders/"+selected.id+"/photos/"+id}
                className="border px-3 py-2 text-xs flex items-center gap-2"><Download size={13}/> Photo {i+1}</a>)}</div>
            <button disabled={saving} onClick={()=>void save()} className="w-full bg-[#24211d] text-white px-4 py-3 text-sm">
              {saving?"Saving…":"Save job"} <IndianRupee size={14} className="inline"/>
            </button>
          </>}
        </aside>
      </div>
    </main>
  </div>;
}
