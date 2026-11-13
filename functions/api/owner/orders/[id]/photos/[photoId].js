import {failure,requireOwner} from "../../../../../_lib/security.js";
export async function onRequestGet({request,env,params}) {
 try {
  await requireOwner(request,env);
  if(!env.ORDER_DB || !env.ORDER_PHOTOS)return failure("Media unavailable",503);
  const row=await env.ORDER_DB.prepare(
   "SELECT r2_key,mime FROM order_photos WHERE id=? AND order_id=? AND deleted_at IS NULL"
  ).bind(params.photoId,params.id).first();
  if(!row)return failure("Photo not found",404);
  const obj=await env.ORDER_PHOTOS.get(row.r2_key);
  if(!obj)return failure("Photo missing",404);
  return new Response(obj.body,{headers:{
   "Content-Type":row.mime,"Cache-Control":"private, no-store",
   "Content-Disposition":"attachment; filename=rajmoti-photo",
   "X-Content-Type-Options":"nosniff","Content-Security-Policy":"sandbox"
  }});
 }catch(e){return failure(e.message||"Owner access denied",403);}
}
