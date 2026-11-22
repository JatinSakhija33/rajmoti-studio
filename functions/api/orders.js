import { json, failure, cleanOrder, verifyTurnstile, assertOrigin, signUpload, signTracking, buildUpiUri, UPI_CONFIG } from "../_lib/security.js";
function result(order, env) {
  const total=Number(order.total_amount_paise), due=Math.max(0,total-Number(order.verified_paid_paise||0));
  return Promise.all([signUpload(order.id,env.ORDER_UPLOAD_SECRET),signTracking(order.id,env.ORDER_UPLOAD_SECRET)]).then(([uploadToken,trackingToken])=>({
    id:order.id,reference:order.public_ref,publicRef:order.public_ref,attemptRef:order.payment_attempt_ref,
    fulfillment:order.fulfillment_type,paymentStatus:order.payment_status,totalAmountPaise:total,amountDuePaise:due,
    deliveryChargePaise:Number(order.delivery_charge_paise),photoLimit:order.photo_limit,
    upiUri:due>0?buildUpiUri({amountPaise:due,publicRef:order.public_ref}):null,
    payeeVpa:UPI_CONFIG.payeeVpa,beneficiaryName:UPI_CONFIG.payeeName,uploadToken,trackingToken
  }));
}
export async function onRequestPost({request,env}) {
  if(env.GIFT_PRODUCTION_APPROVED!=="true"||env.GIFT_CHECKOUT_ENABLED!=="true"||!env.ORDER_DB||!env.ORDER_PHOTOS||!env.TURNSTILE_SITE_KEY||!env.TURNSTILE_SECRET_KEY||!env.ORDER_UPLOAD_SECRET||env.ORDER_UPLOAD_SECRET.length<32)return failure("Gift ordering is not configured",503);
  try {
    assertOrigin(request);
    const reader=request.body?.getReader();if(!reader)return failure("Order details are required",400);
    const chunks=[];let length=0;
    while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>256000){await reader.cancel();return failure("Order instructions are too large",413);}chunks.push(value);}
    const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
    const raw=JSON.parse(new TextDecoder().decode(bytes));
    let order;try{order=cleanOrder(raw);}catch(error){return failure(error.message,400);}
    if(raw.expectedTotalPaise!==order.totalAmountPaise)return failure("The cart price has changed. Please review your selected variants before ordering.",409);
    await verifyTurnstile(request,env,raw.turnstileToken);
    const existing=await env.ORDER_DB.prepare("SELECT * FROM orders WHERE request_key=?").bind(order.clientRequestId).first();
    if(existing){
      if(existing.customer_name!==order.name||existing.phone!==order.phone||existing.items_json!==JSON.stringify(order.quote)||existing.fulfillment_type!==order.fulfillment||existing.delivery_address_json!==JSON.stringify(order.address||{})||existing.total_amount_paise!==order.totalAmountPaise)return failure("This request reference is already used by another order. Reopen your saved order receipt.",409);
      return json(await result(existing,env));
    }
    const id=crypto.randomUUID(),publicRef="RJ-"+crypto.randomUUID().replaceAll("-","").slice(0,12).toUpperCase(),attemptRef="PAY-"+crypto.randomUUID();
    const online=order.paymentChoice==="pay_online";
    const photoLimit=Math.max(5,order.quote.reduce((sum,line)=>sum+(line.design?.photoCount||0),0));
    const insert=env.ORDER_DB.prepare(`INSERT INTO orders(id,request_key,source,customer_name,phone,service_type,preferred_date,baby_age,package_slug,styles_json,items_json,notes,public_ref,photo_limit,customization_json,fulfillment_type,delivery_address_json,delivery_charge_paise,total_amount_paise,verified_paid_paise,payment_method,payment_attempt_ref,payment_status,quoted_total)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(request_key) DO NOTHING`).bind(id,order.clientRequestId,"website",order.name,order.phone,order.kind,order.date,order.age,order.collection,JSON.stringify(order.styles),JSON.stringify(order.quote),order.notes,publicRef,photoLimit,JSON.stringify(order.quote.map(line=>line.design||null)),order.fulfillment,JSON.stringify(order.address||{}),order.deliveryChargePaise,order.totalAmountPaise,0,online?"upi_online":"pay_at_studio",attemptRef,online?"unpaid":"pay_at_studio",order.totalAmountPaise/100);
    const statements=[insert];
    if(online)statements.push(env.ORDER_DB.prepare(`INSERT INTO order_payments(id,order_id,attempt_ref,amount_paise,method,status,payee_upi,beneficiary_name) SELECT ?,id,?,?,?,'pending_verification',?,? FROM orders WHERE id=?`).bind(crypto.randomUUID(),attemptRef,order.totalAmountPaise,"upi",UPI_CONFIG.payeeVpa,UPI_CONFIG.payeeName,id));
    statements.push(env.ORDER_DB.prepare("INSERT INTO order_events(order_id,actor,event,detail) SELECT id,'customer','order_created',? FROM orders WHERE id=?").bind("Awaiting photos and manual payment verification",id));
    await env.ORDER_DB.batch(statements);
    const saved=await env.ORDER_DB.prepare("SELECT * FROM orders WHERE request_key=?").bind(order.clientRequestId).first();
    if(!saved)throw Error("Order could not be saved");
    return json(await result(saved,env),201);
  }catch(error){return failure(error.message||"Could not create the order",error instanceof SyntaxError?400:/Choose|Invalid|requires|unavailable|price|Add at least|supported|confirmation|selected|photo|verification|Spam|origin/i.test(error.message)?400:500);}
}
