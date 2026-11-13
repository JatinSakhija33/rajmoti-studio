import {json,failure,requireOwner,assertOrigin} from "../../../../_lib/security.js";
export async function onRequestPost({request,env,params}) {
 try {
  const actor=await requireOwner(request,env);
  assertOrigin(request);
  if(!env.ORDER_DB || !env.ORDER_PHOTOS)return failure("Storage unavailable",503);
  const confirmation=await request.json();
  if(confirmation?.confirmation!=="DELETE CLOUD COPIES")return failure("Explicit deletion confirmation required",400);
  const row=await env.ORDER_DB.prepare(
   "SELECT status,archive_verified_at,delivered_at,(julianday('now')-julianday(delivered_at)) AS days_since_delivery FROM orders WHERE id=?"
  ).bind(params.id).first();
  if(!row || row.status!=="delivered" || !row.archive_verified_at ||
     Number(row.days_since_delivery)<30)return failure("Requires delivered order, verified double backup and 30 days retention",403);
  const photos=await env.ORDER_DB.prepare("SELECT id,r2_key FROM order_photos WHERE order_id=? AND deleted_at IS NULL").bind(params.id).all();
  let deleted=0;
  for(const photo of photos.results||[]) {
   await env.ORDER_PHOTOS.delete(photo.r2_key);
   await env.ORDER_DB.prepare("UPDATE order_photos SET deleted_at=CURRENT_TIMESTAMP WHERE id=?").bind(photo.id).run();
   deleted++;
  }
  await env.ORDER_DB.prepare("INSERT INTO order_events(order_id,actor,event,detail) VALUES(?,?,?,?)")
   .bind(params.id,actor,"cloud_media_deleted",String(deleted)+" private cloud objects purged after verified double backup").run();
  return json({deleted});
 }catch(e){return failure(e.message||"Cloud purge failed",403);}
}
