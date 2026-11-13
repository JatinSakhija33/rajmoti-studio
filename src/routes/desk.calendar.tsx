import {createFileRoute,Link} from "@tanstack/react-router";
import {useEffect,useMemo,useState,type FormEvent} from "react";
import {ChevronLeft,ChevronRight,CalendarDays,Plus,RefreshCw,Check,MessageCircle} from "lucide-react";
import {DeskNav} from "@/components/desk-nav";
import {whatsappLink} from "@/lib/site";
export const Route=createFileRoute("/desk/calendar")({head:()=>({meta:[{title:"Calendar — Rajmoti Studio OS"},{name:"robots",content:"noindex,nofollow"}]}),component:Calendar});
type EventItem={id:string;title:string;event_date:string;start_time:string;event_type:string;contact_phone:string;notes:string;done:number};
type Job={id:string;customer_name:string;phone:string;service_type:string;due_date:string;status:string;priority:string};
const iso=(date:Date)=>[date.getFullYear(),String(date.getMonth()+1).padStart(2,"0"),String(date.getDate()).padStart(2,"0")].join("-");
const today=()=>iso(new Date());
function Calendar(){
 const [month,setMonth]=useState(()=>new Date(new Date().getFullYear(),new Date().getMonth(),1));
 const [day,setDay]=useState(today());
 const [events,setEvents]=useState<EventItem[]>([]);
 const [jobs,setJobs]=useState<Job[]>([]);
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [showAdd,setShowAdd]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [form,setForm]=useState({title:"",event_date:today(),start_time:"",event_type:"task",contact_phone:"",notes:""});
 const start=iso(new Date(month.getFullYear(),month.getMonth(),1));
 const end=iso(new Date(month.getFullYear(),month.getMonth()+1,0));
 const load=async()=>{
  setLoading(true);setError("");
  try{
   const r=await fetch("/api/owner/calendar?start="+start+"&end="+end,{credentials:"same-origin",cache:"no-store"});
   const d=await r.json();if(!r.ok)throw Error(d.error||"Calendar unavailable");
   setEvents(d.events||[]);setJobs(d.jobs||[]);
  }catch(e){setError(e instanceof Error?e.message:"Could not load calendar");}
  finally{setLoading(false);}
 };
 useEffect(()=>{void load();},[start,end]);
 const grid=useMemo(()=>{
  const offset=new Date(month.getFullYear(),month.getMonth(),1).getDay();
  const n=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();
  return Array.from({length:Math.ceil((n+offset)/7)*7},(_,i)=>{const dayNumber=i-offset+1;return dayNumber>=1&&dayNumber<=n?iso(new Date(month.getFullYear(),month.getMonth(),dayNumber)):null;});
 },[month]);
 const dayEvents=events.filter(x=>x.event_date===day);
 const dayJobs=jobs.filter(x=>x.due_date===day);
 const shift=(n:number)=>{const newMonth=new Date(month.getFullYear(),month.getMonth()+n,1);setMonth(newMonth);setDay(iso(newMonth));};
 const add=async(e:FormEvent)=>{
  e.preventDefault();setSaving(true);setError("");setNotice("");
  try{
   const r=await fetch("/api/owner/calendar",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
   const d=await r.json();if(!r.ok)throw Error(d.error||"Unable to create event");
   setNotice("Calendar item added.");
   setShowAdd(false);setForm({title:"",event_date:day,start_time:"",event_type:"task",contact_phone:"",notes:""});
   await load();
  }catch(e){setError(e instanceof Error?e.message:"Could not save event");}
  finally{setSaving(false);}
 };
 const mark=async(item:EventItem)=>{
  try{
   const r=await fetch("/api/owner/calendar/"+encodeURIComponent(item.id),{method:"PATCH",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({done:!item.done})});
   if(!r.ok)throw Error("Could not update task");await load();
  }catch(e){setError(e instanceof Error?e.message:"Update failed");}
 };
 return <div className="desk-app"><DeskNav active="calendar"/>
  <main className="desk-page">
   <div className="desk-heading"><div><p className="desk-kicker">One day at a time</p><h1>Studio calendar <em>& plans.</em></h1>
    <p>Sessions, due orders and personal reminders — thoughtfully organised.</p></div>
    <button className="desk-primary" onClick={()=>{setForm({...form,event_date:day});setShowAdd(true);}}><Plus size={16}/> Add to calendar</button></div>
   {error&&<p role="alert" className="desk-error">{error}</p>}
   {notice&&<p className="desk-notice" role="status">{notice}</p>}
   <div className="desk-calendar-layout"><section className="desk-calendar-card">
     <div className="desk-month"><button onClick={()=>shift(-1)} aria-label="Previous month"><ChevronLeft/></button>
       <h2>{month.toLocaleDateString("en-IN",{month:"long",year:"numeric"})}</h2>
       <div><button onClick={()=>{const now=new Date();setMonth(new Date(now.getFullYear(),now.getMonth(),1));setDay(today());}}>Today</button>
       <button onClick={()=>shift(1)} aria-label="Next month"><ChevronRight/></button></div></div>
     <div className="desk-calendar-grid">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(x=><span key={x} className="weekday">{x}</span>)}
       {grid.map((date,i)=><button key={date||"blank"+i} disabled={!date} onClick={()=>date&&setDay(date)} className={[!date?"blank":"",date===day?"current":"",date===today()?"today":""] .join(" ")}>
        {date&&<><b>{Number(date.slice(-2))}</b><small>{events.filter(x=>x.event_date===date).length+jobs.filter(x=>x.due_date===date).length||""}</small></>}
       </button>)}</div>
   </section>
   <aside className="desk-day-panel">
    <p className="desk-kicker">Daily overview</p><h2>{new Date(day+"T12:00:00").toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"})}</h2>
    <p className="desk-day-count">{dayEvents.length} plans · {dayJobs.length} production deadlines</p>
    {loading?<p>Loading…</p>:<div className="desk-day-list">
     {dayJobs.map(j=><article key={j.id}><span className="desk-event-type">Job due · {j.priority}</span>
       <h3>{j.customer_name} — {j.service_type}</h3><p>{j.status} · {j.phone}</p>
       <Link to="/desk">Open production queue</Link></article>)}
     {dayEvents.map(x=><article key={x.id} className={x.done?"is-done":""}>
       <span className="desk-event-type">{x.event_type} {x.start_time?("· "+x.start_time):""}</span>
       <h3>{x.title}</h3><p>{x.notes}</p>
       <div className="flex gap-3 items-center"><button onClick={()=>void mark(x)} className="desk-small-action"><Check size={13}/>{x.done?"Reopen":"Mark done"}</button>
       {x.contact_phone&&<a className="desk-small-action" href={whatsappLink("Hello, this is Rajmoti Studio following up about our appointment.", "+91"+x.contact_phone)} target="_blank" rel="noopener noreferrer"><MessageCircle size={14}/> Message</a>}</div>
      </article>)}
     {!dayJobs.length&&!dayEvents.length&&<div className="desk-empty"><CalendarDays size={26}/><p>Nothing planned yet. A calm day to catch up.</p></div>}
    </div>}
   </aside></div>
   {showAdd&&<div className="desk-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setShowAdd(false);}}>
    <section role="dialog" aria-modal="true" aria-label="New calendar item" className="desk-modal">
     <div className="flex justify-between mb-5 items-center"><h2>Add a studio plan</h2><button onClick={()=>setShowAdd(false)}>Close</button></div>
     <form className="desk-form" onSubmit={e=>void add(e)}>
      <label className="desk-span2">Title<input required minLength={2} maxLength={140} value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label>
      <label>Date<input required type="date" value={form.event_date} onChange={e=>setForm({...form,event_date:e.target.value})}/></label>
      <label>Time (optional)<input type="time" value={form.start_time} onChange={e=>setForm({...form,start_time:e.target.value})}/></label>
      <label>Type<select value={form.event_type} onChange={e=>setForm({...form,event_type:e.target.value})}>
       {["task","session","delivery","follow_up","reminder","other"].map(v=><option value={v} key={v}>{v.replaceAll("_"," ")}</option>)}</select></label>
      <label>Contact phone (optional)<input type="tel" value={form.contact_phone} onChange={e=>setForm({...form,contact_phone:e.target.value})}/></label>
      <label className="desk-span2">Notes<textarea rows={4} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label>
      <button disabled={saving} className="desk-primary">{saving?"Saving…":"Create calendar item"}</button>
     </form>
    </section></div>}
  </main></div>;
}
