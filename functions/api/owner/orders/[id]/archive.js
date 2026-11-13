import {json,failure,requireOwner,assertOrigin} from "../../../../_lib/security.js";
export async function onRequestPost({request,env,params}) {
 try {
  const actor=await requireOwner(request,env);
  assertOrigin(request);
  if(!env.ORDER_DB)return failure("Database unavailable",503);
  const input=await request.json();
  if(input.primaryBackupVerified!==true || input.secondaryBackupVerified!==true ||
     input.confirmation!=="TWO BACKUPS VERIFIED")return failure("Two independently verified local backups are required",400);
  const row=await env.ORDER_DB.prepare("SELECT status,delivered_at FROM orders WHERE id=?").bind(params.id).first();
  if(!row || row.status!=="delivered" || !row.delivered_at)return failure("Job must be delivered first",400);
  await env.ORDER_DB.prepare(
   "UPDATE orders SET archive_verified_at=CURRENT_TIMESTAMP,archive_verified_by=?,updated_at=CURRENT_TIMESTAMP WHERE id=?"
  ).bind(actor,params.id).run();
  await env.ORDER_DB.prepare("INSERT INTO order_events(order_id,actor,event,detail) VALUES(?,?,?,?)")
   .bind(params.id,actor,"archive_verified","Owner confirmed two independently checked local backups").run();
  return json({archived:true,notice:"Cloud media remains available for at least 30 days after delivery and until explicitly purged."});
 }catch(e){return failure(e.message||"Archive verification failed",403);}
}
