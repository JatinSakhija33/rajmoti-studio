import {json,failure,cleanOrder,verifyTurnstile,assertOrigin,signUpload,signTracking} from "../_lib/security.js";
export async function onRequestPost({request,env}) {
 if(!env.ORDER_DB || !env.TURNSTILE_SECRET_KEY || !env.ORDER_UPLOAD_SECRET)return failure("Ordering is not configured",503);
 try {
  assertOrigin(request);
  if(Number(request.headers.get("Content-Length")||0)>20000)return failure("Request too large",413);
  const raw=await request.json();
  await verifyTurnstile(request,env,raw.turnstileToken);
  const order=cleanOrder(raw);
  const id=crypto.randomUUID();
  await env.ORDER_DB.prepare(
   "INSERT INTO orders(id,request_key,source,customer_name,phone,service_type,preferred_date,baby_age,package_slug,styles_json,items_json,notes) VALUES(?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(request_key) DO NOTHING"
  ).bind(id,order.clientRequestId,"website",order.name,order.phone,order.kind,order.date,order.age,order.collection,JSON.stringify(order.styles),JSON.stringify(order.quote),order.notes).run();
  const found=await env.ORDER_DB.prepare("SELECT id,public_ref FROM orders WHERE request_key=?").bind(order.clientRequestId).first();
  if(!found)return failure("Order could not be saved",500);
  return json({id:found.id,reference:found.public_ref||found.id.slice(0,8).toUpperCase(),uploadToken:await signUpload(found.id,env.ORDER_UPLOAD_SECRET),trackingToken:await signTracking(found.id,env.ORDER_UPLOAD_SECRET)},201);
 } catch(e){return failure(e.message||"Could not accept request",e instanceof SyntaxError?400:400);}
}
