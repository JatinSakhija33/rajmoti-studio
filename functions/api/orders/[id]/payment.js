import {json,failure,clean,validTracking,assertOrigin} from "../../../_lib/security.js";
export async function onRequestPost({request,env,params}){
 try{
  assertOrigin(request);
  if(!env.ORDER_DB||!env.ORDER_UPLOAD_SECRET)return failure("Payment recording is unavailable",503);
  const id=String(params.id||""),raw=await request.json();
  if(!/^[a-f0-9-]{36}$/i.test(id)||!await validTracking(raw.trackingToken,id,env.ORDER_UPLOAD_SECRET))return failure("Invalid or expired tracking authorization",403);
  const utr=clean(raw.utr,40);
  if(!/^[a-zA-Z0-9-]{6,40}$/.test(utr))return failure("Enter a valid bank transaction reference",400);
  const order=await env.ORDER_DB.prepare("SELECT * FROM orders WHERE id=?").bind(id).first();
  if(!order)return failure("Order not found",404);
  if(order.status==="cancelled")return failure("This order is cancelled",409);
  if(Number(order.verified_paid_paise)>=Number(order.total_amount_paise)&&Number(order.total_amount_paise)>0)return json({ok:true,status:"verified_paid",message:"The studio has already verified this payment."});
  await env.ORDER_DB.batch([
   env.ORDER_DB.prepare("INSERT INTO order_payments(id,order_id,attempt_ref,amount_paise,method,status,customer_utr) SELECT ?,id,payment_attempt_ref,total_amount_paise-verified_paid_paise,'upi','pending_verification',? FROM orders WHERE id=? AND verified_paid_paise<total_amount_paise AND NOT EXISTS(SELECT 1 FROM order_payments WHERE order_id=? AND status='pending_verification')").bind(crypto.randomUUID(),utr,id,id),
   env.ORDER_DB.prepare("UPDATE order_payments SET customer_utr=? WHERE order_id=? AND attempt_ref=? AND status='pending_verification'").bind(utr,id,order.payment_attempt_ref),
   env.ORDER_DB.prepare("UPDATE orders SET payment_status='pending_verification',payment_reference=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND verified_paid_paise<total_amount_paise").bind(utr,id),
   env.ORDER_DB.prepare("INSERT INTO order_events(order_id,actor,event,detail) VALUES(?,'customer','utr_submitted',?)").bind(id,JSON.stringify({utr}))
  ]);
  return json({ok:true,status:"pending_verification",message:"Reference received. The studio must reconcile it with bank records; this is not a payment confirmation."});
 }catch(error){return failure(error.message||"Could not record the transaction reference",500);}
}
