import {json,failure,validUpload,assertOrigin,sniffMedia} from "../../../_lib/security.js";
export async function onRequestPost({request,env,params}) {
 if(!env.ORDER_DB || !env.ORDER_PHOTOS || !env.ORDER_UPLOAD_SECRET)return failure("Uploads not configured",503);
 try {
  assertOrigin(request);
  const id=String(params.id||"");
  if(!/^[0-9a-f-]{36}$/i.test(id))return failure("Invalid order",400);
  const token=request.headers.get("X-Rajmoti-Upload-Token");
  if(!await validUpload(token,id,env.ORDER_UPLOAD_SECRET))return failure("Upload permission expired",403);
  const row = await env.ORDER_DB.prepare("SELECT * FROM orders WHERE id=?").bind(id).first();
  if (!row || row.status === "cancelled" || row.status === "delivered") return failure("Order unavailable for uploads", 404);
  if (Number(request.headers.get("Content-Length") || 0) > 10490000) return failure("Photo exceeds 10 MB", 413);
  const isMagazine =
    String(row.service_type || "").toLowerCase().includes("magazine") ||
    String(row.items_json || "").toLowerCase().includes("magazine");
  const maxPhotos = Number(row.photo_limit) || (isMagazine ? 20 : 5);
  const count = await env.ORDER_DB.prepare("SELECT count(*) n FROM order_photos WHERE order_id=? AND deleted_at IS NULL").bind(id).first();
  if ((count?.n || 0) >= maxPhotos) return failure(`Maximum ${maxPhotos} photos per request`, 400);
  const form=await request.formData(),file=form.get("photo");
  if(!(file instanceof File) || file.size<=0 || file.size>10_000_000)return failure("Choose a photo below 10 MB",400);
  const content=await file.arrayBuffer();
  const ext=sniffMedia(content,file.type);
  if(!ext)return failure("Only genuine JPG, PNG and WebP photos are accepted",400);
  const used=await env.ORDER_DB.prepare("SELECT coalesce(sum(size_bytes),0) used FROM order_photos WHERE deleted_at IS NULL").first();
  const cap=Math.min(5_000_000_000,Math.max(1_000_000,Number(env.ACTIVE_MEDIA_BYTES_LIMIT)||2_000_000_000));
  if(Number(used?.used||0)+file.size>cap)return failure("Studio upload quota reached; please send your photo directly to the studio",507);
  const photoId=crypto.randomUUID(),key="orders/"+id+"/"+photoId+ext;
  await env.ORDER_PHOTOS.put(key,content,{httpMetadata:{contentType:file.type},customMetadata:{orderId:id}});
  try {
   await env.ORDER_DB.prepare("INSERT INTO order_photos(id,order_id,r2_key,mime,size_bytes) VALUES(?,?,?,?,?)").bind(photoId,id,key,file.type,file.size).run();
  } catch(e){await env.ORDER_PHOTOS.delete(key);throw e;}
  return json({photoId},201);
 }catch(e){return failure(e.message||"Photo upload failed",400);}
}
