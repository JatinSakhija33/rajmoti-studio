import {json,failure,requireOwner,cleanOrder,assertOrigin,clean} from "../../_lib/security.js";
export async function onRequestGet({request,env}) {
 try {
  await requireOwner(request,env);
  if(!env.ORDER_DB)return failure("Database not connected",503);
  const all=await env.ORDER_DB.prepare(
   "SELECT o.*, (SELECT count(*) FROM order_photos p WHERE p.order_id=o.id AND p.deleted_at IS NULL) photo_count FROM orders o ORDER BY o.created_at DESC LIMIT 200"
  ).all();
  return json({orders:all.results||[]});
 }catch(e){return failure(e.message||"Owner access denied",403);}
}
export async function onRequestPost({request,env}) {
 try {
  const actor=await requireOwner(request,env);
  assertOrigin(request);
  if(!env.ORDER_DB)return failure("Database not connected",503);
  const data=cleanOrder(await request.json());
  const id=crypto.randomUUID();
  const input=await request.clone().json();
  const requested_size=clean(input.requested_size,30);
  const priority=clean(input.priority,20)||"normal";
  if(!["low","normal","high","urgent"].includes(priority))return failure("Invalid priority");
  const due_date=clean(input.due_date,10);
  if(due_date && !/^\d{4}-\d{2}-\d{2}$/.test(due_date))return failure("Invalid due date");
  const editing_instructions=clean(input.editing_instructions,2000);
  const memorial={name:clean(input.memorial_name,150),date:clean(input.memorial_date,60),tithi:clean(input.memorial_tithi,150)};
  await env.ORDER_DB.prepare(
   "INSERT INTO orders(id,request_key,source,customer_name,phone,service_type,preferred_date,baby_age,package_slug,styles_json,items_json,notes,requested_size,priority,due_date,editing_instructions,memorial_json) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
  ).bind(id,data.clientRequestId,"walk_in",data.name,data.phone,data.kind,data.date,data.age,data.collection,JSON.stringify(data.styles),JSON.stringify(data.quote),data.notes,requested_size,priority,due_date,editing_instructions,JSON.stringify(memorial)).run();
  await env.ORDER_DB.prepare("INSERT INTO order_events(order_id,actor,event,detail) VALUES(?,?,?,?)").bind(id,actor,"walk_in_created","Created in owner desk").run();
  return json({id},201);
 }catch(e){return failure(e.message||"Could not create job",400);}
}
