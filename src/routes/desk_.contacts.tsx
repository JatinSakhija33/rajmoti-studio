import {createFileRoute,Link} from "@tanstack/react-router";
import {useEffect,useMemo,useState,type FormEvent} from "react";
import {Search,Plus,Users,MessageCircle,Phone,RefreshCw,Save,CalendarDays} from "lucide-react";
import {DeskNav} from "@/components/desk-nav";
import {whatsappLink,waMessage,telLink} from "@/lib/site";
export const Route=createFileRoute("/desk/contacts")({
 head:()=>({meta:[{title:"Contacts — Rajmoti Studio OS"},{name:"robots",content:"noindex,nofollow"}]}),
 component:Contacts
});
type Contact={id?:string;name:string;phone:string;email?:string;family_name?:string;birthday?:string;anniversary?:string;notes?:string;job_count?:number;last_job_at?:string};
const empty:Contact={name:"",phone:"",email:"",family_name:"",birthday:"",anniversary:"",notes:""};
function Contacts() {
 const [items,setItems]=useState<Contact[]>([]);
 const [unlinked,setUnlinked]=useState<Contact[]>([]);
 const [search,setSearch]=useState("");
 const [form,setForm]=useState<Contact>({...empty});
 const [editing,setEditing]=useState(false);
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const load=async()=>{
  setLoading(true);setError("");
  try{
   const r=await fetch("/api/owner/contacts",{credentials:"same-origin",cache:"no-store"});
   const d=await r.json();
   if(!r.ok)throw Error(d.error||"Unable to load contacts");
   setItems(d.contacts||[]);setUnlinked(d.unlinked||[]);
  }catch(e){setError(e instanceof Error?e.message:"Contacts unavailable");}
  finally{setLoading(false);}
 };
 useEffect(()=>{void load();},[]);
 const merged=useMemo(()=>[...items,...unlinked].filter(x=>
  [x.name,x.phone,x.family_name||"",x.notes||""].join(" ").toLowerCase().includes(search.toLowerCase())
 ).sort((a,b)=>a.name.localeCompare(b.name)),[items,unlinked,search]);
 const begin=(x:Contact)=>{setForm({...empty,...x});setEditing(true);setError("");setNotice("");};
 const submit=async(e:FormEvent)=>{
  e.preventDefault();setSaving(true);setError("");setNotice("");
  try{
   const url=form.id?"/api/owner/contacts/"+encodeURIComponent(form.id):"/api/owner/contacts";
   const r=await fetch(url,{method:form.id?"PATCH":"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",body:JSON.stringify(form)});
   const d=await r.json();
   if(!r.ok)throw Error(d.error||"Unable to save contact");
   setNotice("Contact saved. Jobs with the same phone number remain connected.");
   setEditing(false);setForm({...empty});await load();
  }catch(e){setError(e instanceof Error?e.message:"Unable to save");}
  finally{setSaving(false);}
 };
 return <div className="desk-app"><DeskNav active="contacts"/>
  <main className="desk-page">
   <div className="desk-heading">
    <div><p className="desk-kicker">Your people, remembered</p><h1>Studio contacts <em>& families.</em></h1>
     <p>Keep relationships, important dates and every order connected by phone number.</p></div>
    <button className="desk-primary" onClick={()=>begin({...empty})}><Plus size={17}/> New contact</button>
   </div>
   {error&&<p className="desk-error" role="alert">{error}</p>}
   {notice&&<p className="desk-notice" role="status">{notice}</p>}
   <div className="desk-toolbar">
    <label className="desk-search"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, phone or family"/></label>
    <button className="desk-light-btn" onClick={()=>void load()}><RefreshCw size={16}/> Refresh</button>
   </div>
   <div className="desk-stats"><div><strong>{items.length}</strong><span>Saved contacts</span></div><div><strong>{unlinked.length}</strong><span>Customers from jobs</span></div><div><strong>{merged.length}</strong><span>Matching people</span></div></div>
   <div className="desk-contact-grid">
    {loading?<p>Loading your contacts…</p>:!merged.length?<div className="desk-empty"><Users size={30}/><h2>Your contact book starts here.</h2><p>Add a walk-in customer or let new online orders populate your directory.</p></div>:
     merged.map((c,i)=><article className="desk-person" key={c.id||"order-"+c.phone+i}>
      <div className="desk-person-initial">{(c.name||"?").slice(0,1).toUpperCase()}</div>
      <div className="desk-person-text"><h2>{c.name}</h2><p>{c.family_name||"Rajmoti customer"} · {c.job_count||0} jobs</p>
       <span>{c.phone}</span>
       {(c.birthday||c.anniversary)&&<p><CalendarDays size={12} className="inline"/> {c.birthday?"Birthday "+c.birthday:""} {c.anniversary?"Anniversary "+c.anniversary:""}</p>}
      </div>
      <div className="desk-person-actions">
       <a href={whatsappLink(waMessage.service({title:"studio photography and photo printing",note:"I'm following up regarding your Rajmoti Studio work."}),"+91"+c.phone)}
         target="_blank" rel="noopener noreferrer" aria-label={"Message "+c.name}><MessageCircle size={17}/></a>
       <a href={telLink("+91"+c.phone)} aria-label={"Call "+c.name}><Phone size={16}/></a>
       <button onClick={()=>begin(c)}>Edit</button>
      </div>
     </article>)
    }
   </div>
   {editing&&<div className="desk-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setEditing(false);}}>
    <section className="desk-modal" role="dialog" aria-modal="true" aria-label="Contact details">
     <div className="flex justify-between items-center mb-5"><h2>{form.id?"Edit contact":"Add a contact"}</h2><button onClick={()=>setEditing(false)}>Close</button></div>
     <form onSubmit={e=>void submit(e)} className="desk-form">
      <label>Name<input required minLength={2} maxLength={140} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
      <label>WhatsApp / mobile number<input required type="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
      <label>Family name<input value={form.family_name||""} onChange={e=>setForm({...form,family_name:e.target.value})}/></label>
      <label>Email (optional)<input type="email" value={form.email||""} onChange={e=>setForm({...form,email:e.target.value})}/></label>
      <label>Birthday<input type="date" value={form.birthday||""} onChange={e=>setForm({...form,birthday:e.target.value})}/></label>
      <label>Anniversary<input type="date" value={form.anniversary||""} onChange={e=>setForm({...form,anniversary:e.target.value})}/></label>
      <label className="desk-span2">Notes<textarea rows={4} value={form.notes||""} onChange={e=>setForm({...form,notes:e.target.value})}/></label>
      <button disabled={saving} className="desk-primary"><Save size={16}/>{saving?"Saving…":"Save contact"}</button>
     </form>
    </section>
   </div>}
   <p className="desk-small-note">This is the new protected contact book. Your earlier Lovable contacts still require a separate database export and migration.</p>
  </main>
 </div>;
}
