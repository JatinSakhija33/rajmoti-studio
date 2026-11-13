import { Link } from "@tanstack/react-router";
import { LayoutDashboard, Users, CalendarDays, ArrowUpRight, MessageCircle, Camera } from "lucide-react";
import { whatsappLink, waMessage } from "@/lib/site";
const links=[
  {to:"/desk",label:"Overview",icon:LayoutDashboard},
  {to:"/desk/contacts",label:"Contacts",icon:Users},
  {to:"/desk/calendar",label:"Calendar",icon:CalendarDays},
] as const;
export function DeskNav({active}:{active:"overview"|"contacts"|"calendar"}) {
 const current=active==="overview"?"/desk":active==="contacts"?"/desk/contacts":"/desk/calendar";
 return <div className="desk-navigation">
  <div className="desk-navigation-inner">
    <Link to="/" className="desk-brand"><Camera size={20}/> <span>RAJMOTI <small>STUDIO OS</small></span></Link>
    <nav aria-label="Owner workspace" className="desk-tabs">
      {links.map(x=><Link key={x.to} to={x.to} activeProps={{className:"selected"}} className={current===x.to?"selected":""}>
        <x.icon size={17}/>{x.label}
      </Link>)}
    </nav>
    <a className="desk-site-link" href={whatsappLink(waMessage.general())} target="_blank" rel="noopener noreferrer"><MessageCircle size={17}/> WhatsApp <ArrowUpRight size={13}/></a>
  </div>
 </div>;
}
