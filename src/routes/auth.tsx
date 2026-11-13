import { createFileRoute, Link } from "@tanstack/react-router";
import {ArrowRight,LockKeyhole,CalendarDays,Users,ClipboardList} from "lucide-react";
export const Route=createFileRoute("/auth")({
 head:()=>({meta:[{title:"Studio Owner Access — Rajmoti Studio"},{name:"robots",content:"noindex,nofollow"}]}),
 component:OwnerEntry
});
function OwnerEntry(){
 return <div className="owner-entry min-h-dvh flex flex-col items-center justify-center p-6">
  <Link to="/" className="owner-entry-logo">RAJMOTI <span>STUDIO · JETPUR</span></Link>
  <section className="owner-entry-card max-w-xl w-full">
   <div className="owner-entry-lock"><LockKeyhole size={22}/></div>
   <p className="desk-kicker">A space for the people behind the photographs</p>
   <h1>Welcome to <em>Rajmoti OS.</em></h1>
   <p className="owner-entry-copy">Your private workspace for customers, daily appointments, editing jobs, print orders and delivery. Owner access is protected by Cloudflare Access — no demonstration password or account signup.</p>
   <div className="owner-entry-features">
    <span><ClipboardList size={16}/> Production</span>
    <span><Users size={16}/> Contacts</span>
    <span><CalendarDays size={16}/> Calendar</span>
   </div>
   <Link to="/desk" className="owner-entry-button">Open owner workspace <ArrowRight size={18}/></Link>
   <p className="owner-entry-note">If you are not the studio owner, access will be refused by the server. Owner Access must be configured before the workspace is operational.</p>
  </section>
  <Link to="/" className="owner-entry-return">← Return to Rajmoti Studio</Link>
 </div>;
}
