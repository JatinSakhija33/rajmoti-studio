import {json,failure,requireOwner} from "../../_lib/security.js";
export async function onRequestGet({request,env}){
 try{await requireOwner(request,env);if(!env.ORDER_DB)return failure("Gift order database is not configured",503);const rows=await env.ORDER_DB.prepare("SELECT o.*, (SELECT COUNT(*) FROM order_photos p WHERE p.order_id=o.id AND p.deleted_at IS NULL) photo_count FROM orders o ORDER BY o.created_at DESC LIMIT 200").all();return json({orders:rows.results||[]});}catch(error){return failure(error.message,error.status||500);}
}
