import {json,failure,requireOwner,assertOrigin,clean,phoneNumber} from "../../_lib/security.js";
const dateOk=(s)=>/^\d{4}-\d{2}-\d{2}$/.test(s);
export async function onRequestGet({request,env}) {
 try {
  await requireOwner(request,env);
  if(!env.ORDER_DB)return failure("Database not configured",503);
  const start=new URL(request.url).searchParams.get("start");
  const end=new URL(request.url).searchParams.get("end");
  if(!dateOk(start||"")||!dateOk(end||"")||start>end)return failure("Valid date range required");
  const items=await env.ORDER_DB.prepare(
   "SELECT * FROM studio_calendar WHERE event_date BETWEEN ? AND ? ORDER BY event_date,start_time LIMIT 800"
  ).bind(start,end).all();
  const jobs=await env.ORDER_DB.prepare(
   "SELECT id,customer_name,phone,service_type,due_date,status,priority FROM orders WHERE due_date BETWEEN ? AND ? AND status NOT IN ('delivered','cancelled') ORDER BY due_date LIMIT 800"
  ).bind(start,end).all();
  return json({events:items.results||[],jobs:jobs.results||[]});
 }catch(e){return failure(e.message||"Calendar access denied",403);}
}
export async function onRequestPost({request,env}) {
 try {
  await requireOwner(request,env);assertOrigin(request);
  if(!env.ORDER_DB)return failure("Database not configured",503);
  const d=await request.json();
  const title=clean(d.title,140),date=clean(d.event_date,10);
  if(title.length<2||!dateOk(date))return failure("Title and date required");
  const start=clean(d.start_time,5);
  if(start&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(start))return failure("Time must be HH:MM");
  const type=clean(d.event_type,30)||"task";
  if(!["task","session","delivery","follow_up","reminder","other"].includes(type))return failure("Invalid event type");
  const rawPhone=clean(d.contact_phone,20);
  const phone=rawPhone?phoneNumber(rawPhone):"";
  if(rawPhone&&!phone)return failure("Invalid customer phone");
  const id=crypto.randomUUID();
  await env.ORDER_DB.prepare(
   "INSERT INTO studio_calendar(id,title,event_date,start_time,event_type,contact_phone,notes) VALUES(?,?,?,?,?,?,?)"
  ).bind(id,title,date,start,type,phone,clean(d.notes,1000)).run();
  return json({id},201);
 }catch(e){return failure(e.message||"Unable to save calendar item",400);}
}
