import {json,failure,requireOwner,clean,assertOrigin} from "../../../../_lib/security.js";
export async function onRequestGet({request,env,params}){
 try{await requireOwner(request,env);if(!env.ORDER_DB)return failure("Order database is not connected",503);const rows=await env.ORDER_DB.prepare("SELECT * FROM order_payments WHERE order_id=? ORDER BY created_at DESC").bind(params.id).all();return json({payments:rows.results||[]});}catch(error){return failure(error.message,error.status||500);}
}
export async function onRequestPost({request,env,params}){
 try{
  const actor=await requireOwner(request,env);assertOrigin(request);
  if(!env.ORDER_DB)return failure("Order database is not connected",503);
  if((await request.clone().json()).bankChecked!==true)return failure("Confirm bank reconciliation before verifying a payment",400);
  const order=await env.ORDER_DB.prepare("SELECT * FROM orders WHERE id=?").bind(params.id).first();if(!order)return failure("Order not found",404);
  const raw=await request.json(),action=clean(raw.action,40),amount=Number(raw.amountPaise),utr=clean(raw.utr||raw.reference,40);
  if(!["verify_upi","record_counter_payment"].includes(action))return failure("Unknown payment action",400);
  if(!Number.isSafeInteger(amount)||amount<=0||amount>100000000)return failure("Enter the actual amount received, in integer paise",400);
  const method=action==="record_counter_payment"&&raw.method==="cash"?"cash":"upi";
  if(method==="upi"&&!/^[a-zA-Z0-9-]{6,40}$/.test(utr))return failure("A bank-verified UPI reference is required",400);
  const paymentId=clean(raw.paymentId||raw.receiptId,60);
  if(!/^[a-f0-9-]{36}$/i.test(paymentId))return failure("A stable payment receipt ID is required",400);
  const existing=await env.ORDER_DB.prepare("SELECT * FROM order_payments WHERE id=?").bind(paymentId).first();
  if(existing&&existing.order_id!==params.id)return failure("This receipt belongs to another order",409);
  if(existing?.status==="verified")return json({ok:true,paymentStatus:order.payment_status,verifiedPaise:order.verified_paid_paise});
  if(action==="verify_upi"&&!existing)return failure("Select the payment attempt you reconciled",400);
  const record=existing?env.ORDER_DB.prepare("UPDATE order_payments SET amount_paise=?,status='verified',method=?,customer_utr=?,verified_by=?,verified_at=CURRENT_TIMESTAMP,notes=? WHERE id=? AND order_id=? AND status='pending_verification'").bind(amount,method,utr||null,actor,clean(raw.notes,500),paymentId,params.id):env.ORDER_DB.prepare("INSERT INTO order_payments(id,order_id,attempt_ref,amount_paise,method,status,customer_utr,verified_by,verified_at,notes) VALUES(?,?,?,?,?,'verified',?,?,CURRENT_TIMESTAMP,?) ON CONFLICT(id) DO NOTHING").bind(paymentId,params.id,"COUNTER-"+paymentId,amount,method,utr||null,actor,clean(raw.notes,500));
  await env.ORDER_DB.batch([
   record,
   env.ORDER_DB.prepare(`UPDATE orders SET verified_paid_paise=(SELECT COALESCE(SUM(amount_paise),0) FROM order_payments WHERE order_id=orders.id AND status='verified'),paid_amount=(SELECT COALESCE(SUM(amount_paise),0)/100.0 FROM order_payments WHERE order_id=orders.id AND status='verified'),payment_status=CASE WHEN (SELECT COALESCE(SUM(amount_paise),0) FROM order_payments WHERE order_id=orders.id AND status='verified')>=total_amount_paise AND total_amount_paise>0 THEN 'verified_paid' ELSE 'partially_paid' END,payment_reference=?,payment_verified_by=?,payment_verified_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(utr||"CASH-COUNTER",actor,params.id),
   env.ORDER_DB.prepare("INSERT INTO order_events(order_id,actor,event,detail) VALUES(?,?,'payment_manually_verified',?)").bind(params.id,actor,JSON.stringify({paymentId,amountPaise:amount,method,utr}))
  ]);
  const saved=await env.ORDER_DB.prepare("SELECT verified_paid_paise,payment_status FROM orders WHERE id=?").bind(params.id).first();
  return json({ok:true,verifiedPaise:saved.verified_paid_paise,paymentStatus:saved.payment_status});
 }catch(error){if(/UNIQUE constraint failed.*customer_utr/i.test(error.message))return failure("This bank reference was already verified. Review the existing receipt before continuing.",409);return failure(error.message||"Payment reconciliation failed. No payment has been marked verified.",error.status||500);}
}

