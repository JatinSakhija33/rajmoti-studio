import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, ArrowLeft } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
export const Route = createFileRoute("/track/$id")({
 validateSearch: (x:Record<string,unknown>)=>({token:typeof x.token==="string"?x.token:""}),
 head:()=>({meta:[{title:"Private Order Tracking — Rajmoti Studio"},{name:"robots",content:"noindex,nofollow"}]}),
 component: Tracking,
});
type Status={reference:string;status:string;paymentStatus:string;quotedAmount:number;paidAmount:number;dueDate:string;createdAt:string};
const stepLabels=["received","editing","review","printing","framing","ready","delivered"];
function Tracking() {
 const {id}=Route.useParams();
 const {token}=Route.useSearch();
 const [data,setData]=useState<Status|null>(null);
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(true);
 useEffect(()=>{
  let active=true;
  const get=async()=>{
   try{
    const r=await fetch("/api/track/"+encodeURIComponent(id)+"?token="+encodeURIComponent(token),{cache:"no-store"});
    const result=await r.json();
    if(!r.ok)throw Error(result.error||"Tracking unavailable");
    if(active)setData(result);
   }catch(e){if(active)setError(e instanceof Error?e.message:"Tracking unavailable");}
   finally{if(active)setLoading(false);}
  };
  void get();
  return()=>{active=false;};
 },[id,token]);
 const step=data?stepLabels.indexOf(data.status):-1;
 const remaining=data?Math.max(0,(data.quotedAmount||0)-(data.paidAmount||0)):0;
 return <div className="editorial"><SiteNav/>
 <main className="ed-wrap py-16 max-w-3xl">
  <p className="ed-kicker">Rajmoti Studio · Your private order</p>
  <h1 className="font-display text-4xl md:text-6xl mb-6">A little progress. <em>A lasting memory.</em></h1>
  {loading?<p className="ed-copy">Checking your order…</p>:error?<p role="alert" className="ed-notice">{error}</p>:data&&<>
    <p className="text-sm mb-6">Reference <strong>{data.reference}</strong>. This link shows progress only and does not expose private photos.</p>
    <div className="border border-[#e6ddd1] p-6 bg-white">
      <div className="flex items-center gap-3 mb-6">{data.status==="delivered"?<CheckCircle2 size={24}/>:<Clock3 size={24}/>}
        <h2 className="font-display text-3xl capitalize">{data.status.replaceAll("_"," ")}</h2></div>
      <ol className="flex flex-col gap-3">{stepLabels.map((s,i)=><li key={s} className="flex gap-3 items-center text-sm">
       <span className={"w-6 h-6 rounded-full text-xs grid place-items-center "+(i<=step?"bg-[#4c6d57] text-white":"bg-[#eee8de] text-[#726d66]")}>{i+1}</span>
       <span className={"capitalize "+(i<=step?"font-semibold":"text-[#888078]")}>{s}</span></li>)}</ol>
      {data.status==="cancelled"&&<p className="mt-4">This request was cancelled. Contact the studio for details.</p>}
      {data.dueDate&&<p className="mt-5 text-sm">Estimated due date: {data.dueDate}. Confirm timing with the studio.</p>}
      {data.quotedAmount>0&&<p className="mt-3 text-sm">Quoted total: ₹{(data.quotedAmount/100).toFixed(2)} · Recorded balance: ₹{(remaining/100).toFixed(2)}</p>}
      <p className="text-xs mt-5 text-[#827769]">Payment status is entered by the studio after checking bank records. No payment is collected through this tracking page.</p>
    </div>
    <button className="ed-text-button mt-5" onClick={()=>void navigator.clipboard.writeText(window.location.href)}>Copy private tracking link</button>
  </>}
  <div className="mt-8"><Link to="/" className="ed-text-button"><ArrowLeft size={16}/> Return home</Link></div>
 </main><SiteFooter/></div>;
}
