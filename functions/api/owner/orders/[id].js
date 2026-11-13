import {json,failure,requireOwner,clean,STAGES,assertOrigin} from "../../../_lib/security.js";
export async function onRequestGet({request,env,params}) {
 try {
  await requireOwner(request,env);
  const order=await env.ORDER_DB.prepare("SELECT * FROM orders WHERE id=?").bind(params.id).first();
  if(!order)return failure("Job not found",404);
  const photos=await env.ORDER_DB.prepare("SELECT id,mime,size_bytes,created_at FROM order_photos WHERE order_id=? AND deleted_at IS NULL").bind(params.id).all();
  return json({order,photos:photos.results||[]});
 }catch(e){return failure(e.message||"Owner access denied",403);}
}
export async function onRequestPatch({request,env,params}) {
 try {
  const actor=await requireOwner(request,env);
  assertOrigin(request);
  const old=await env.ORDER_DB.prepare("SELECT * FROM orders WHERE id=?").bind(params.id).first();
  if(!old)return failure("Job not found",404);
  const data=await request.json();
  const status=data.status===undefined?old.status:clean(data.status,30);
  if(!STAGES.includes(status))return failure("Invalid production status");
  const total=data.quoted_total===undefined?old.quoted_total:Number(data.quoted_total);
  const paid=data.paid_amount===undefined?old.paid_amount:Number(data.paid_amount);
  if(!Number.isSafeInteger(total)||!Number.isSafeInteger(paid)||total<0||paid<0||paid>total || total>10000000)return failure("Invalid payment amounts");
  const reference=data.payment_reference===undefined?old.payment_reference:clean(data.payment_reference,120);
  if(paid>0 && !reference)return failure("Record the verified bank transaction reference");
  const payment=paid===0?"unpaid":paid>=total?"paid":"partial";
  const notes=data.notes===undefined?old.notes:clean(data.notes,2000);
  const size=data.requested_size===undefined?old.requested_size:clean(data.requested_size,30);
  const priority=data.priority===undefined?old.priority:clean(data.priority,20);
  if(!["low","normal","high","urgent"].includes(priority))return failure("Invalid priority");
  const due=data.due_date===undefined?old.due_date:clean(data.due_date,10);
  if(due && !/^\d{4}-\d{2}-\d{2}$/.test(due))return failure("Invalid due date");
  const instructions=data.editing_instructions===undefined?old.editing_instructions:clean(data.editing_instructions,2000);
  const memorialRaw=data.memorial===undefined?JSON.parse(old.memorial_json||"{}"):data.memorial;
  const memorial={
   name:clean(memorialRaw?.name,150),
   date:clean(memorialRaw?.date,60),
   tithi:clean(memorialRaw?.tithi,150)
  };
  const required=["original_preserved","identity_preserved","print_spec_verified","customer_details_verified"];
  const reviewed=data.review===undefined?JSON.parse(old.review_json||"{}"):data.review;
  const review={};
  for(const k of required)review[k]=reviewed?.[k]===true;
  if((status==="ready"||status==="delivered") && required.some(k=>review[k]!==true))
    return failure("Complete the before/after review checklist before marking ready or delivered");

  // Strict Business Rule Enforcement from Final Payment Directive:
  const fulfillment = old.fulfillment_type || "studio_collection";
  const finalTotalPaise = Number(old.total_amount_paise) || (Number(total) * 100);
  const currentVerifiedPaidPaise = Number(old.verified_paid_paise) || (Number(paid) * 100);

  // Business Rule: Home Delivery = 100% Verified Prepayment. COD = Never. Unpaid delivery orders CANNOT be dispatched or delivered.
  if (fulfillment === "home_delivery") {
    if (status === "delivered" || status === "ready") {
      if (currentVerifiedPaidPaise < finalTotalPaise || finalTotalPaise <= 0) {
        return failure("Home Delivery orders require 100% verified prepayment before dispatch or delivery. Unpaid or partially paid orders cannot be dispatched.", 403);
      }
    }
  }

  // Business Rule: Studio Collection = Require outstanding balance to be settled before marking collected.
  if (fulfillment === "studio_collection") {
    if (status === "delivered") {
      if (currentVerifiedPaidPaise < finalTotalPaise) {
        return failure("Studio Collection orders require the outstanding balance to be settled (Cash or UPI at counter) before marking as collected.", 403);
      }
    }
  }

  const deliveredAt=status==="delivered" ? (old.status==="delivered" ? old.delivered_at : new Date().toISOString()) : null;
  const archived=status==="delivered" ? old.archive_verified_at : null;
  const archivedBy=status==="delivered" ? old.archive_verified_by : null;
  await env.ORDER_DB.prepare(
   "UPDATE orders SET status=?,quoted_total=?,paid_amount=?,payment_status=?,payment_reference=?,payment_verified_by=?,payment_verified_at=?,notes=?,requested_size=?,priority=?,due_date=?,editing_instructions=?,memorial_json=?,review_json=?,delivered_at=?,archive_verified_at=?,archive_verified_by=?,updated_at=CURRENT_TIMESTAMP WHERE id=?"
  ).bind(status,total,paid,payment,reference,paid>0?actor:null,paid>0?new Date().toISOString():null,notes,size,priority,due,instructions,JSON.stringify(memorial),JSON.stringify(review),deliveredAt,archived,archivedBy,params.id).run();
  await env.ORDER_DB.prepare("INSERT INTO order_events(order_id,actor,event,detail) VALUES(?,?,?,?)").bind(params.id,actor,"owner_update",JSON.stringify({status,payment,total,paid})).run();
  return json({ok:true});
 }catch(e){return failure(e.message||"Could not update job",400);}
}
