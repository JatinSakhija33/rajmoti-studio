import {json,failure,requireOwner,assertOrigin,STAGES,clean} from "../../../_lib/security.js";
export async function onRequestGet({request,env,params}){
 try{await requireOwner(request,env);if(!env.ORDER_DB)return failure("Order database is not configured",503);const order=await env.ORDER_DB.prepare("SELECT * FROM orders WHERE id=?").bind(params.id).first();if(!order)return failure("Order not found",404);const photos=await env.ORDER_DB.prepare("SELECT id,mime,size_bytes,design_id,slot_index,created_at FROM order_photos WHERE order_id=? AND deleted_at IS NULL").bind(params.id).all();return json({order,photos:photos.results||[]});}catch(error){return failure(error.message,error.status||500);}
}
export async function onRequestPatch({request,env,params}){
 try{
  const actor=await requireOwner(request,env);assertOrigin(request);if(!env.ORDER_DB)return failure("Order database is not configured",503);
  const order=await env.ORDER_DB.prepare("SELECT * FROM orders WHERE id=?").bind(params.id).first();if(!order)return failure("Order not found",404);
  const raw=await request.json();if(raw.paid_amount!==undefined||raw.verified_paid_paise!==undefined||raw.payment_status!==undefined||raw.quoted_total!==undefined)return failure("Use manual payment reconciliation to change payment records",400);
  const status=raw.status===undefined?order.status:clean(raw.status,30);if(!STAGES.includes(status))return failure("Invalid production stage",400);
  if(['ready','delivered'].includes(status)){
   const checklist=raw.review||JSON.parse(order.review_json||'{}');
   if(!['original_preserved','identity_preserved','print_spec_verified','customer_details_verified'].every(key=>checklist[key]===true))return failure("Complete the original-photo, identity, print and customer checks first",400);
   const expected=JSON.parse(order.items_json||'[]').reduce((sum,line)=>sum+(line.design?.photoCount||0),0);const photos=await env.ORDER_DB.prepare("SELECT COUNT(*) n FROM order_photos WHERE order_id=? AND deleted_at IS NULL").bind(params.id).first();
   if(Number(photos?.n||0)<expected)return failure("Customer photographs are still missing",409);
   if((order.fulfillment_type==='home_delivery'||status==='delivered')&&(Number(order.verified_paid_paise)<Number(order.total_amount_paise)||Number(order.total_amount_paise)<=0))return failure("The outstanding balance must be manually verified before dispatch or collection",409);
  }
  const source=raw.review||JSON.parse(order.review_json||'{}');const review=Object.fromEntries(['original_preserved','identity_preserved','print_spec_verified','customer_details_verified'].map(key=>[key,source[key]===true]));
  await env.ORDER_DB.batch([
   env.ORDER_DB.prepare("UPDATE orders SET status=?,notes=?,review_json=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(status,raw.notes===undefined?order.notes:clean(raw.notes,2000),JSON.stringify(review),params.id),
   env.ORDER_DB.prepare("INSERT INTO order_events(order_id,actor,event,detail) VALUES(?,?,'production_stage_updated',?)").bind(params.id,actor,status)
  ]);return json({ok:true,status});
 }catch(error){return failure(error.message,error.status||500);}
}
