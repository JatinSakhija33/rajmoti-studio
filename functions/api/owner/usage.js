import {json,failure,requireOwner} from "../../_lib/security.js";
export async function onRequestGet({request,env}) {
 try{
  await requireOwner(request,env);
  if(!env.ORDER_DB)return failure("Database not connected",503);
  const totals=await env.ORDER_DB.prepare(
   "SELECT count(*) photo_count,coalesce(sum(size_bytes),0) bytes FROM order_photos WHERE deleted_at IS NULL"
  ).first();
  const limit=Math.min(5_000_000_000,Math.max(1_000_000,Number(env.ACTIVE_MEDIA_BYTES_LIMIT)||2_000_000_000));
  return json({photoCount:Number(totals?.photo_count||0),bytes:Number(totals?.bytes||0),limitBytes:limit,thresholdPercent:80});
 }catch(e){return failure(e.message||"Owner access denied",403);}
}
