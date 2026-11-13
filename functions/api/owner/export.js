import {failure,requireOwner} from "../../_lib/security.js";
export async function onRequestGet({request,env}) {
 try {
  await requireOwner(request,env);
  if(!env.ORDER_DB)return failure("Database unavailable",503);
  const orders=await env.ORDER_DB.prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT 10000").all();
  const photos=await env.ORDER_DB.prepare("SELECT id,order_id,mime,size_bytes,created_at,deleted_at FROM order_photos LIMIT 50000").all();
  const events=await env.ORDER_DB.prepare("SELECT * FROM order_events ORDER BY id DESC LIMIT 50000").all();
  const body=JSON.stringify({schema:"rajmoti-web-intake-v1",exported_at:new Date().toISOString(),
   orders:orders.results,photos:photos.results,events:events.results},null,2);
  const date=new Date().toISOString().slice(0,10);
  return new Response(body,{headers:{"Content-Type":"application/json;charset=utf-8",
   "Content-Disposition":'attachment; filename="rajmoti-orders-'+date+'.json"',
   "Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
 }catch(e){return failure(e.message||"Owner export denied",403);}
}
