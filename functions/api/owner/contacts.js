import {json,failure,requireOwner,assertOrigin,clean,phoneNumber} from "../../_lib/security.js";
const okDate=(s)=>!s||/^\d{4}-\d{2}-\d{2}$/.test(s);
export async function onRequestGet({request,env}) {
 try {
  await requireOwner(request,env);
  if(!env.ORDER_DB)return failure("Database not configured",503);
  const contacts=await env.ORDER_DB.prepare(
    "SELECT c.*, (SELECT count(*) FROM orders o WHERE o.phone=c.phone) job_count, (SELECT max(created_at) FROM orders o WHERE o.phone=c.phone) last_job_at FROM studio_contacts c ORDER BY c.updated_at DESC LIMIT 1000"
  ).all();
  // Customers who submitted work before a contact was created are shown, without duplicating an existing phone.
  const unlinked=await env.ORDER_DB.prepare(
   "SELECT o.phone, o.customer_name name, count(*) job_count, max(o.created_at) last_job_at FROM orders o WHERE NOT EXISTS(SELECT 1 FROM studio_contacts c WHERE c.phone=o.phone) GROUP BY o.phone ORDER BY last_job_at DESC LIMIT 1000"
  ).all();
  return json({contacts:contacts.results||[],unlinked:unlinked.results||[]});
 }catch(e){return failure(e.message||"Owner access denied",403);}
}
export async function onRequestPost({request,env}) {
 try {
  const actor=await requireOwner(request,env); assertOrigin(request);
  if(!env.ORDER_DB)return failure("Database not configured",503);
  const data=await request.json();
  const name=clean(data.name,140),phone=phoneNumber(data.phone);
  if(name.length<2||!phone)return failure("Enter a name and valid 10-digit phone");
  const email=clean(data.email,200),family=clean(data.family_name,140);
  const birthday=clean(data.birthday,10),anniversary=clean(data.anniversary,10);
  if(!okDate(birthday)||!okDate(anniversary))return failure("Invalid date");
  const notes=clean(data.notes,2000);
  const id=crypto.randomUUID();
  await env.ORDER_DB.prepare(
   "INSERT INTO studio_contacts(id,name,phone,email,family_name,birthday,anniversary,notes) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(phone) DO UPDATE SET name=excluded.name,email=excluded.email,family_name=excluded.family_name,birthday=excluded.birthday,anniversary=excluded.anniversary,notes=excluded.notes,updated_at=CURRENT_TIMESTAMP"
  ).bind(id,name,phone,email,family,birthday,anniversary,notes).run();
  const row=await env.ORDER_DB.prepare("SELECT id FROM studio_contacts WHERE phone=?").bind(phone).first();
  return json({id:row.id,merged:true},201);
 }catch(e){return failure(e.message||"Unable to save contact",400);}
}
