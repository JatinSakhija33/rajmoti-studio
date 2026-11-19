import {json,failure,validUpload,assertOrigin,sniffMedia} from "../../../_lib/security.js";
export async function onRequestPost({request,env,params}){
 if(!env.ORDER_DB||!env.ORDER_PHOTOS||!env.ORDER_UPLOAD_SECRET)return failure("Private photo uploads are not configured",503);
 try{
  assertOrigin(request);const id=String(params.id||"");
  if(!/^[a-f0-9-]{36}$/i.test(id)||!await validUpload(request.headers.get("X-Rajmoti-Upload-Token"),id,env.ORDER_UPLOAD_SECRET))return failure("Upload permission is invalid or expired",403);
  const order=await env.ORDER_DB.prepare("SELECT * FROM orders WHERE id=?").bind(id).first();if(!order||['cancelled','delivered'].includes(order.status))return failure("This order is not available for uploads",409);
  if(Number(request.headers.get("Content-Length")||0)>10_100_000)return failure("Photo exceeds 10 MB",413);
  const form=await request.formData(),file=form.get('photo'),designId=String(form.get('designId')||''),index=Number(form.get('slotIndex'));
  const lines=JSON.parse(order.items_json||'[]');const line=lines.find(line=>line.design?.id===designId);
  if(!line||!Number.isInteger(index)||index<0||index>=line.design.photoCount)return failure("This photograph does not match an order design slot",400);
  const existing=await env.ORDER_DB.prepare("SELECT id FROM order_photos WHERE order_id=? AND design_id=? AND slot_index=? AND deleted_at IS NULL").bind(id,designId,index).first();if(existing)return json({photoId:existing.id});
  if(!(file instanceof File)||file.size<=0||file.size>10_000_000)return failure("Choose a JPG, PNG or WebP photo smaller than 10 MB",400);
  const bytes=await file.arrayBuffer(),extension=sniffMedia(bytes,file.type);if(!extension)return failure("The file is not a valid supported photograph",415);
  const usage=await env.ORDER_DB.prepare("SELECT COALESCE(SUM(size_bytes),0) used FROM order_photos WHERE deleted_at IS NULL").first();const quota=Math.min(5_000_000_000,Math.max(1_000_000,Number(env.ACTIVE_MEDIA_BYTES_LIMIT)||2_000_000_000));
  if(Number(usage?.used||0)+file.size>quota)return failure("Studio photo storage is full. Your order is saved; contact the studio to arrange the originals.",507);
  const photoId=crypto.randomUUID(),key='orders/'+id+'/'+photoId+extension;
  await env.ORDER_PHOTOS.put(key,bytes,{httpMetadata:{contentType:file.type},customMetadata:{orderId:id,designId,slotIndex:String(index)}});
  try{await env.ORDER_DB.prepare("INSERT INTO order_photos(id,order_id,r2_key,mime,size_bytes,design_id,slot_index) VALUES(?,?,?,?,?,?,?)").bind(photoId,id,key,file.type,file.size,designId,index).run();}catch(error){await env.ORDER_PHOTOS.delete(key);throw error;}
  return json({photoId},201);
 }catch(error){return failure(error.message||"Photo upload failed. Your order is retained and the upload can be retried.",500);}
}
