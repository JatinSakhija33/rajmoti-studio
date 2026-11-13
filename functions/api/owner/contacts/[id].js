import {json,failure,requireOwner,assertOrigin,clean,phoneNumber} from "../../../_lib/security.js";
const okDate=(s)=>!s||/^\d{4}-\d{2}-\d{2}$/.test(s);
export async function onRequestPatch({request,env,params}) {
 try {
  await requireOwner(request,env);assertOrigin(request);
  if(!env.ORDER_DB)return failure("Database not configured",503);
  const old=await env.ORDER_DB.prepare("SELECT * FROM studio_contacts WHERE id=?").bind(params.id).first();
  if(!old)return failure("Contact not found",404);
  const d=await request.json();
  const name=d.name===undefined?old.name:clean(d.name,140);
  const phone=d.phone===undefined?old.phone:phoneNumber(d.phone);
  if(name.length<2||!phone)return failure("Invalid name or phone");
  const email=d.email===undefined?old.email:clean(d.email,200);
  const family=d.family_name===undefined?old.family_name:clean(d.family_name,140);
  const birthday=d.birthday===undefined?old.birthday:clean(d.birthday,10);
  const anniversary=d.anniversary===undefined?old.anniversary:clean(d.anniversary,10);
  if(!okDate(birthday)||!okDate(anniversary))return failure("Invalid date");
  const notes=d.notes===undefined?old.notes:clean(d.notes,2000);
  await env.ORDER_DB.prepare(
   "UPDATE studio_contacts SET name=?,phone=?,email=?,family_name=?,birthday=?,anniversary=?,notes=?,updated_at=CURRENT_TIMESTAMP WHERE id=?"
  ).bind(name,phone,email,family,birthday,anniversary,notes,params.id).run();
  return json({ok:true});
 }catch(e){return failure(e.message||"Unable to update contact",400);}
}
