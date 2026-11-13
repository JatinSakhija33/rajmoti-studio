import {json,failure,validTracking} from "../../_lib/security.js";
export async function onRequestGet({request,env,params}) {
 try {
  if(!env.ORDER_DB || !env.ORDER_UPLOAD_SECRET)return failure("Order tracking is unavailable",503);
  const id=String(params.id||"");
  const token=new URL(request.url).searchParams.get("token");
  if(!/^[0-9a-f-]{36}$/i.test(id) || !await validTracking(token,id,env.ORDER_UPLOAD_SECRET))
    return failure("This private tracking link is invalid or expired",403);
  const order=await env.ORDER_DB.prepare(
   "SELECT status,payment_status,quoted_total,paid_amount,due_date,created_at FROM orders WHERE id=?"
  ).bind(id).first();
  if(!order)return failure("Order not found",404);
  return json({reference:id.slice(0,8).toUpperCase(),status:order.status,
   paymentStatus:order.payment_status,quotedAmount:order.quoted_total,
   paidAmount:order.paid_amount,dueDate:order.due_date,createdAt:order.created_at});
 } catch{return failure("Unable to check order",500);}
}
