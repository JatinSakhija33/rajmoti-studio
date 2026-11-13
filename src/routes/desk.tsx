import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, RefreshCw, ShieldCheck, IndianRupee, Download, Search } from "lucide-react";
const stages = ["received","editing","review","printing","framing","ready","delivered","cancelled"] as const;
const printSizes = ["4×6","6×8","8×12","10×14","12×18","14×20","16×24","18×24","20×30","35×45 mm passport","Custom"];
const checks = {
  original_preserved: "Original files protected; no overwriting",
  identity_preserved: "Faces, expressions, pose, clothing and proportions preserved unless expressly requested",
  print_spec_verified: "Print size, resolution, crop and colours reviewed",
  customer_details_verified: "Names, dates, tithi and customer instructions checked",
} as const;
type ReviewKey = keyof typeof checks;
type Job = {
  id: string; source: string; customer_name:string; phone:string; service_type:string; preferred_date:string;
  status: string; notes:string; created_at:string; quoted_total:number; paid_amount:number;
  payment_status:string; payment_reference:string; photo_count:number; items_json:string; delivered_at?:string; archive_verified_at?:string;
  requested_size:string; priority:string; due_date:string; editing_instructions:string; memorial_json:string; review_json:string;
};
export const Route = createFileRoute("/desk")({
  head: () => ({ meta: [{title:"Owner Work Desk — Rajmoti Studio"}, {name:"robots",content:"noindex,nofollow"}] }),
  component: Desk,
});
function rupees(paise: number) { return (Number(paise||0)/100).toLocaleString("en-IN",{style:"currency",currency:"INR"}); }
function parseRupees(s: string) { const n=Number(s); return Number.isFinite(n)&&n>=0 ? Math.round(n*100) : NaN; }
function Desk() {
  const [jobs,setJobs]=useState<Job[]>([]);
  const [usage,setUsage]=useState<{bytes:number;limitBytes:number;photoCount:number}|null>(null);
  const [selected,setSelected]=useState<Job|null>(null);
  const [query,setQuery]=useState("");
  const [status,setStatus]=useState("all");
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [photoIds,setPhotoIds]=useState<string[]>([]);
  const [primaryBackup,setPrimaryBackup]=useState(false);
  const [secondaryBackup,setSecondaryBackup]=useState(false);
  const [total,setTotal]=useState("");
  const [paid,setPaid]=useState("");
  const [reference,setReference]=useState("");
  const [notes,setNotes]=useState("");
  const [stage,setStage]=useState("received");
  const [size,setSize]=useState("");
  const [priority,setPriority]=useState("normal");
  const [due,setDue]=useState("");
  const [instructions,setInstructions]=useState("");
  const [memorial,setMemorial]=useState({name:"",date:"",tithi:""});
  const [review,setReview]=useState<Record<ReviewKey,boolean>>({original_preserved:false,identity_preserved:false,print_spec_verified:false,customer_details_verified:false});
  const [showIntake,setShowIntake]=useState(false);
  const [intake,setIntake]=useState({name:"",phone:"",type:"Restoration",requested_size:"8×12",priority:"normal",due_date:"",editing_instructions:"",memorial_name:"",memorial_date:"",memorial_tithi:""});

  const load=useCallback(async()=>{
    setLoading(true);setError("");
    try{
      const r=await fetch("/api/owner/orders",{credentials:"same-origin",cache:"no-store"});
      const data=await r.json();
      if(!r.ok)throw Error(data.error||"Unable to access the owner work desk");
      setJobs(data.orders||[]);
      try { const r=await fetch("/api/owner/usage",{credentials:"same-origin",cache:"no-store"});
        if(r.ok)setUsage(await r.json()); }catch{}
    }catch(e){setError(e instanceof Error?e.message:"Unable to retrieve orders");}
    finally{setLoading(false);}
  },[]);
  useEffect(()=>{void load();},[load]);
  useEffect(()=>{
    if(!selected){setPhotoIds([]);return;}
    setPrimaryBackup(false); setSecondaryBackup(false);
    setStage(selected.status);
    setSize(selected.requested_size||"");
    setPriority(selected.priority||"normal");
    setDue(selected.due_date||"");
    setInstructions(selected.editing_instructions||"");
    try{setMemorial({...{name:"",date:"",tithi:""},...JSON.parse(selected.memorial_json||"{}")});}catch{setMemorial({name:"",date:"",tithi:""});}
    try{setReview({...{original_preserved:false,identity_preserved:false,print_spec_verified:false,customer_details_verified:false},...JSON.parse(selected.review_json||"{}")});}
    catch{setReview({original_preserved:false,identity_preserved:false,print_spec_verified:false,customer_details_verified:false});}
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
        body:JSON.stringify({status:stage,quoted_total,paid_amount,payment_reference:reference,notes,requested_size:size,priority,due_date:due,editing_instructions:instructions,memorial,review}),
      });
      const result=await r.json();
      if(!r.ok)throw Error(result.error||"Could not save");
      setNotice("Job updated. Payment amounts are based on owner-entered bank verification.");
      await load();
      setSelected(null);
    }catch(e){setError(e instanceof Error?e.message:"Failed to save");}
    finally{setSaving(false);}
  }
  async function createWalkIn(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);setError("");setNotice("");
    try {
      const r=await fetch("/api/owner/orders",{
        method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",
        body:JSON.stringify({...intake,clientRequestId:crypto.randomUUID()}),
      });
      const data=await r.json();
      if(!r.ok)throw Error(data.error||"Could not save walk-in job");
      setNotice("Walk-in job created and added to the production queue.");
      setShowIntake(false);
      setIntake({name:"",phone:"",type:"Restoration",requested_size:"8×12",priority:"normal",due_date:"",editing_instructions:"",memorial_name:"",memorial_date:"",memorial_tithi:""});
      await load();
    }catch(e){setError(e instanceof Error?e.message:"Intake failed");}
    finally{setSaving(false);}
  }
  async function verifyArchive() {
    if(!selected || selected.status!=="delivered" || !primaryBackup || !secondaryBackup)return;
    setSaving(true);setError("");setNotice("");
    try {
      const r=await fetch("/api/owner/orders/"+encodeURIComponent(selected.id)+"/archive",{
        method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({primaryBackupVerified:true,secondaryBackupVerified:true,confirmation:"TWO BACKUPS VERIFIED"}),
      });
      const result=await r.json();
      if(!r.ok)throw Error(result.error||"Could not verify backups");
      setNotice("Two backups recorded. Cloud copies stay until 30 days after delivery and deliberate deletion.");
      setSelected(null);await load();
    }catch(e){setError(e instanceof Error?e.message:"Archive verification failed");}
    finally{setSaving(false);}
  }
  async function purgeCloudPhotos() {
    if(!selected || !selected.archive_verified_at)return;
    const typed=window.prompt("To delete cloud copies after the retention period, type DELETE CLOUD COPIES. Do this ONLY after checking both local backups.");
    if(typed!=="DELETE CLOUD COPIES")return;
    setSaving(true);setError("");setNotice("");
    try {
      const r=await fetch("/api/owner/orders/"+encodeURIComponent(selected.id)+"/purge",{
        method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({confirmation:typed}),
      });
      const result=await r.json();
      if(!r.ok)throw Error(result.error||"Unable to delete copies");
      setNotice(result.deleted+" private cloud photographs deleted. Local verified archives are unaffected.");
      setSelected(null);await load();
    }catch(e){setError(e instanceof Error?e.message:"Cleanup failed");}
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
      <section className="bg-white border border-[#e9dfd4] mb-5">
        <button className="w-full text-left px-5 py-4 flex justify-between items-center" onClick={()=>setShowIntake(!showIntake)}>
          <strong>+ Quick walk-in intake</strong><span className="text-sm">{showIntake?"Close":"Open"}</span>
        </button>
        {showIntake && <form className="p-5 border-t grid sm:grid-cols-2 gap-4 text-sm" onSubmit={e=>void createWalkIn(e)}>
          <label>Customer name <input className="w-full border p-2 mt-1" required minLength={2} value={intake.name} onChange={e=>setIntake({...intake,name:e.target.value})}/></label>
          <label>Phone number <input className="w-full border p-2 mt-1" required type="tel" value={intake.phone} onChange={e=>setIntake({...intake,phone:e.target.value})}/></label>
          <label>Job template <select className="w-full border p-2 mt-1" value={intake.type} onChange={e=>setIntake({...intake,type:e.target.value})}>
            {["Restoration","Passport photo","Background replacement","Memorial portrait","Family collage","Baby portrait","Gifting","Wedding","Other"].map(x=><option key={x}>{x}</option>)}
          </select></label>
          <label>Print size <select className="w-full border p-2 mt-1" value={intake.requested_size} onChange={e=>setIntake({...intake,requested_size:e.target.value})}>
            {printSizes.map(x=><option key={x}>{x}</option>)}
          </select></label>
          <label>Priority <select className="w-full border p-2 mt-1" value={intake.priority} onChange={e=>setIntake({...intake,priority:e.target.value})}>
            {["low","normal","high","urgent"].map(x=><option key={x}>{x}</option>)}
          </select></label>
          <label>Due date <input className="w-full border p-2 mt-1" type="date" value={intake.due_date} onChange={e=>setIntake({...intake,due_date:e.target.value})}/></label>
          <label className="sm:col-span-2">Editing / background instructions <textarea rows={2} className="w-full border p-2 mt-1" value={intake.editing_instructions} onChange={e=>setIntake({...intake,editing_instructions:e.target.value})} placeholder="Preserve face and expression; describe requested changes…"/></label>
          {intake.type==="Memorial portrait" && <>
            <label>Memorial name <input className="w-full border p-2 mt-1" value={intake.memorial_name} onChange={e=>setIntake({...intake,memorial_name:e.target.value})}/></label>
            <label>Date <input className="w-full border p-2 mt-1" value={intake.memorial_date} onChange={e=>setIntake({...intake,memorial_date:e.target.value})}/></label>
            <label className="sm:col-span-2">Tithi <input className="w-full border p-2 mt-1" value={intake.memorial_tithi} onChange={e=>setIntake({...intake,memorial_tithi:e.target.value})}/></label>
          </>}
          <p className="sm:col-span-2 text-xs text-[#71675c]">Unknown fields remain editable. Face, clothing, body and pose changes are never assumed. No original image is overwritten.</p>
          <button className="bg-[#24211d] text-white px-4 py-3 disabled:opacity-50" disabled={saving}>{saving?"Saving…":"Create studio job"}</button>
        </form>}
      </section>
      {usage && <div className="border border-[#e9dfd4] bg-white p-4 mb-5 text-sm" aria-label="Temporary cloud photo storage">
        <div className="flex flex-wrap justify-between gap-3 mb-2">
          <strong>Temporary customer photo storage</strong>
          <span>{(usage.bytes/1000000).toFixed(1)} MB / {(usage.limitBytes/1000000000).toFixed(1)} GB · {usage.photoCount} files</span>
        </div>
        <div className="w-full h-2 rounded-full bg-[#e8e4db] overflow-hidden"><div className="h-full bg-[#688b73]" style={{width:Math.min(100,usage.bytes/usage.limitBytes*100)+"%"}}/></div>
        <p className="text-xs mt-2 text-[#70665d]">{usage.bytes/usage.limitBytes>=0.8?"Upload quota approaching. Verify archives and clean eligible completed orders.":"Within the app storage cap. Originals are private; permanent local backups remain your responsibility."}</p>
      </div>}
      <div className="flex justify-end mb-3"><a href="/api/owner/export" className="text-xs underline flex items-center gap-2"><Download size={14}/> Export encrypted-backup-ready order data (JSON)</a></div>
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
            <p className="text-xs text-[#756c60] mt-1">{new Date(j.created_at+"Z").toLocaleDateString("en-IN")} · {j.photo_count} photos · Due {j.due_date||j.preferred_date||"not set"} · {j.requested_size||"size pending"} · {j.priority||"normal"} · {rupees(j.quoted_total)}</p>
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
            <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
              <label>Print size <select className="w-full border p-2 mt-1" value={size} onChange={e=>setSize(e.target.value)}>
                <option value="">Not specified</option>{printSizes.map(x=><option key={x}>{x}</option>)}
              </select></label>
              <label>Priority <select className="w-full border p-2 mt-1" value={priority} onChange={e=>setPriority(e.target.value)}>
                {["low","normal","high","urgent"].map(x=><option key={x}>{x}</option>)}
              </select></label>
              <label className="col-span-2">Due date <input className="w-full border p-2 mt-1" type="date" value={due} onChange={e=>setDue(e.target.value)}/></label>
              <label className="col-span-2">Editing instructions <textarea rows={3} className="w-full border p-2 mt-1" value={instructions} onChange={e=>setInstructions(e.target.value)}/></label>
              {selected.service_type==="Memorial portrait" && <>
                <label>Memorial name <input className="w-full border p-2 mt-1" value={memorial.name} onChange={e=>setMemorial({...memorial,name:e.target.value})}/></label>
                <label>Date <input className="w-full border p-2 mt-1" value={memorial.date} onChange={e=>setMemorial({...memorial,date:e.target.value})}/></label>
                <label className="col-span-2">Tithi <input className="w-full border p-2 mt-1" value={memorial.tithi} onChange={e=>setMemorial({...memorial,tithi:e.target.value})}/></label>
              </>}
            </div>
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
            <section className="border-t pt-4 mb-5">
              <h3 className="font-display text-xl mb-2">Before / after approval</h3>
              <p className="text-xs text-[#756b61] mb-3">All checks required before Ready or Delivered. Owner review, not automated identity verification.</p>
              {(Object.entries(checks) as [ReviewKey,string][]).map(([k,label])=>
                <label key={k} className="flex items-start gap-2 mb-3 text-xs">
                  <input type="checkbox" className="mt-1" checked={review[k]} onChange={e=>setReview({...review,[k]:e.target.checked})}/>{label}
                </label>
              )}
            </section>
            <button disabled={saving} onClick={()=>void save()} className="w-full bg-[#24211d] text-white px-4 py-3 text-sm">
              {saving?"Saving…":"Save job"} <IndianRupee size={14} className="inline"/>
            </button>
            <section className="mt-7 border-t pt-5 text-sm">
              <h3 className="font-display text-xl mb-2">Verified local archive</h3>
              <p className="text-[#675e53] mb-3">Cloud copies must never be the only copy. Archive the originals on the studio computer and a second independent backup before confirming.</p>
              {selected.archive_verified_at ? <p className="bg-[#edf4eb] p-3 text-xs">Backups confirmed on {selected.archive_verified_at}.</p> :
                selected.status==="delivered" ? <>
                  <label className="flex gap-2 items-start mb-3"><input type="checkbox" checked={primaryBackup} onChange={e=>setPrimaryBackup(e.target.checked)}/> Original files checked on studio computer.</label>
                  <label className="flex gap-2 items-start mb-3"><input type="checkbox" checked={secondaryBackup} onChange={e=>setSecondaryBackup(e.target.checked)}/> Second independent backup opened and verified.</label>
                  <button disabled={saving || !primaryBackup || !secondaryBackup} onClick={()=>void verifyArchive()} className="border px-4 py-2 disabled:opacity-40">Confirm verified backups</button>
                </> : <p>Mark the job Delivered and save before confirming archives.</p>}
              {selected.archive_verified_at && <div className="mt-4">
                <p className="text-xs mb-2">Cloud deletion is allowed only after 30 days from delivery and two verified backups. No automatic deletion of your only copy.</p>
                <button disabled={saving || !selected.photo_count} onClick={()=>void purgeCloudPhotos()} className="border border-[#a84d3c] text-[#8f3225] px-4 py-2 disabled:opacity-40">Purge eligible cloud photos</button>
              </div>}
            </section>
          </>}
        </aside>
      </div>
    </main>
  </div>;
}
