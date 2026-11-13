import {json,failure,requireOwner,assertOrigin} from "../../../_lib/security.js";
export async function onRequestPatch({request,env,params}) {
 try {
  await requireOwner(request,env);assertOrigin(request);
  if(!env.ORDER_DB)return failure("Database not connected",503);
  const item=await env.ORDER_DB.prepare("SELECT id FROM studio_calendar WHERE id=?").bind(params.id).first();
  if(!item)return failure("Item not found",404);
  const d=await request.json();
  if(typeof d.done!=="boolean")return failure("Expected a done status",400);
  await env.ORDER_DB.prepare("UPDATE studio_calendar SET done=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(d.done?1:0,params.id).run();
  return json({ok:true});
 }catch(e){return failure(e.message||"Update failed",403);}
}
