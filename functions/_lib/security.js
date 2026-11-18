import seed from "../../src/features/catalogue/seed.json" with { type: "json" };
import extras from "../../src/features/catalogue/gift-extras.json" with { type: "json" };
const MIME = {"image/jpeg":".jpg","image/png":".png","image/webp":".webp"};
export const STAGES = ["received","editing","review","printing","framing","ready","delivered","cancelled"];

export const UPI_CONFIG = {
  payeeVpa: "9429070317@apl",
  payeeName: "PANKAJ LAXMICHAND SAKHIJA",
  storeName: "Rajmoti Studio",
};

export const STANDARD_DELIVERY_CHARGE_PAISE = 10000; // ₹100 standard Home Delivery charge

export function calculateVariantPricePaise(productId = "", variantSize = "", finish = "") {
  const p = String(productId || "").toUpperCase();
  const s = String(variantSize || "").toLowerCase();
  const f = String(finish || "").toLowerCase();

  // Mugs
  if (p.includes("MUG") || s.includes("mug")) {
    if (f.includes("magic") || p === "MUG-002" || p === "MUG-003") return 55000; // ₹550
    if (f.includes("black")) return 45000; // ₹450
    return 35000; // ₹350 Gloss White Ceramic
  }

  // Devotional God's Collection
  if (p.includes("GOD")) {
    if (p === "GOD-001" || f.includes("acrylic")) {
      if (s.includes("16×24") || s.includes("16x24")) return 185000; // ₹1850
      if (s.includes("12×18") || s.includes("12x18")) return 145000; // ₹1450
      return 95000; // ₹950 (8×12)
    }
    if (p === "GOD-002" || f.includes("translight")) {
      if (s.includes("16×24") || s.includes("16x24")) return 285000; // ₹2850
      return 195000; // ₹1950 (12×18)
    }
    return 75000; // ₹750 (Shrine Frame)
  }

  // Personalised Couple Magazine
  if (p.includes("MAG") || s.includes("magazine") || s.includes("pages")) {
    if (s.includes("16") || s.includes("20")) return 195000; // ₹1950 (16-20 photos)
    return 145000; // ₹1450 (12-16 photos)
  }

  // LED Translight
  if (p.includes("LED") || s.includes("translight")) {
    if (s.includes("16×24") || s.includes("16x24")) return 285000; // ₹2850
    return 185000; // ₹1850 (12×18)
  }

  // Inner Sparkle (14×20)
  if (p.includes("SPK") || s.includes("14×20") || s.includes("14x20") || f.includes("sparkle")) {
    return 185000; // ₹1850
  }

  // Acrylic Frames
  if (p.includes("ACR") || f.includes("acrylic")) {
    if (s.includes("16×24") || s.includes("16x24")) return 245000; // ₹2450
    if (s.includes("12×18") || s.includes("12x18")) return 165000; // ₹1650
    return 85000; // ₹850 (8×12)
  }

  // Standard Frames (FRM)
  if (s.includes("20×30") || s.includes("20x30")) return 245000; // ₹2450
  if (s.includes("16×24") || s.includes("16x24")) return 145000; // ₹1450
  if (s.includes("12×18") || s.includes("12x18")) return 85000;  // ₹850
  if (s.includes("10×14") || s.includes("10x14")) return 65000;  // ₹650
  if (s.includes("10×10") || s.includes("10x10")) return 55000;  // ₹550
  if (s.includes("8×12") || s.includes("8x12")) return 45000;   // ₹450
  if (s.includes("6×8") || s.includes("6x8")) return 35000;     // ₹350
  if (s.includes("4×6") || s.includes("4x6")) return 25000;     // ₹250

  return 45000; // Default baseline ₹450
}

export function buildUpiUri({ amountPaise, publicRef = "", note = "" }) {
  if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0) {
    throw Error("Invalid payment amount for UPI");
  }
  const inr = (amountPaise / 100).toFixed(2);
  const tn = clean(note || (publicRef ? `Rajmoti Order ${publicRef}` : "Rajmoti Studio"), 50);
  const params = new URLSearchParams({
    pa: UPI_CONFIG.payeeVpa,
    pn: UPI_CONFIG.payeeName,
    am: inr,
    cu: "INR",
    tn,
  });
  if (publicRef) params.set("tr", String(publicRef).slice(0, 35));
  return `upi://pay?${params.toString()}`;
}

export function json(data,status=200) { return Response.json(data,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}}); }
export function failure(message,status=400) { return json({error:message},status); }
export function clean(s,max=120) {return typeof s==="string"?s.trim().slice(0,max):"";}
export function phoneNumber(s) {
 const digits=String(s??"").replace(/\D/g,"");
 const ten=digits.startsWith("91") && digits.length===12 ? digits.slice(2) : digits;
 return /^[6-9]\d{9}$/.test(ten)?ten:null;
}
export function cleanOrder(raw={}) {
 if(!raw || typeof raw!=="object" || Array.isArray(raw)) throw Error("Invalid form");
 const name=clean(raw.name,120),phone=phoneNumber(raw.phone),kind=clean(raw.type,60);
 if(name.length<2 || !phone || !kind)throw Error("Enter a name, 10-digit phone and service");

 // Two fulfilment methods: 'home_delivery' (Full online payment compulsory) vs 'studio_collection'
 const fulfillment = clean(raw.fulfillment, 40) === "home_delivery" ? "home_delivery" : "studio_collection";
 let paymentChoice = clean(raw.paymentChoice, 40);
 if (fulfillment === "home_delivery") {
   paymentChoice = "pay_online"; // COD = Never; 100% online prepayment required
 } else {
   paymentChoice = paymentChoice === "pay_online" ? "pay_online" : "pay_at_studio";
 }

 let address = null;
 if (fulfillment === "home_delivery") {
   const a = raw.address || {};
   address = {
     line1: clean(a.line1, 150),
     line2: clean(a.line2, 150),
     city: clean(a.city, 80),
     pincode: clean(a.pincode, 10),
     state: clean(a.state, 50),
   };
   if (!address.line1 || !address.city || !address.state || !/^[1-9]\d{5}$/.test(address.pincode)) {
     throw Error("Full delivery address and pin code are required for Home Delivery");
   }
 }

 if(Array.isArray(raw.quote) && raw.quote.length>12)throw Error("Too many selected gifts");
 const catalogue=[...seed.products,...extras.products];
 const quote=(Array.isArray(raw.quote)?raw.quote:[]).map(item=>{
   const p=catalogue.find(p=>p.id===item?.productId);
   const v=p?.variants.find(v=>v.id===item?.variantId);
   if(!p || !v || p.availability==='Discontinued')throw Error('A selected product or variant is unavailable');
   const quantity=Number(item.quantity);
   if(!Number.isSafeInteger(quantity) || quantity<1 || quantity>50)throw Error('Choose a whole quantity from 1 to 50');
   if(!p.personalisation.includes(item.personalisation) || !p.packaging.includes(item.packaging) || !p.orderTypes.includes(item.orderType))throw Error('Invalid product options');
   let unitPaise;
   if(v.price!=null)unitPaise=Math.round(Number(v.price)*100);
   else if(['frames','acrylic','led','drinkware','canvas','gods-collection','magazines'].includes(p.category))unitPaise=calculateVariantPricePaise(p.id,v.size,v.finish);
   else throw Error('This item requires a studio quotation before payment');
   if(!Number.isSafeInteger(unitPaise) || unitPaise<=0)throw Error('A price must be confirmed before payment');
   let design;
   if(item.design){
     const value=item.design;
     if(!/^[a-f0-9-]{36}$/i.test(value.id)||typeof value.kind!=='string')throw Error('Invalid saved design');
     if(!Number.isInteger(value.photoCount)||value.photoCount<0||value.photoCount>20)throw Error('Invalid design photo count');
     const settings=JSON.parse(JSON.stringify(value.settings||{}));
     if(JSON.stringify(settings).length>16000)throw Error('Design instructions are too long');
     const photoSlots=(Array.isArray(value.photoSlots)?value.photoSlots:[]).slice(0,40).map(slot=>slot.source==='upload'?{source:'upload',index:Number(slot.index)}:{source:'sample',path:clean(slot.path,160)});
     if(photoSlots.some(slot=>slot.source==='upload' && (!Number.isInteger(slot.index)||slot.index<0||slot.index>=value.photoCount)))throw Error('Invalid photo slot');
     design={id:value.id,kind:clean(value.kind,50),settings,photoSlots,photoCount:value.photoCount};
   }
   return {productId:p.id,productName:p.name,variantId:v.id,quantity,personalisation:item.personalisation,packaging:item.packaging,orderType:item.orderType,size:v.size,finish:v.finish,unitPricePaise:unitPaise,...(design?{design}:{})};
 });
 if(!quote.length)throw Error('Add at least one gift to your cart');
 if(quote.reduce((n,item)=>n+(item.design?.photoCount||0),0)>20)throw Error('An order can contain up to 20 uploaded photographs');
 const itemsPaise=quote.reduce((sum,item)=>sum+item.unitPricePaise*item.quantity,0);
 const deliveryChargePaise=fulfillment==='home_delivery'?STANDARD_DELIVERY_CHARGE_PAISE:0;
 const totalAmountPaise=itemsPaise+deliveryChargePaise;
 if(!Number.isSafeInteger(totalAmountPaise)||totalAmountPaise>100000000)throw Error('Order amount is outside the supported range');

 const styles=(Array.isArray(raw.styles)?raw.styles:[]).slice(0,12).map(v=>({id:clean(v?.id,80),title:clean(v?.title,120)}));
 const date=clean(raw.date,10);
 if(date && !/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error("Invalid preferred date");
 const key=clean(raw.clientRequestId,80);
 if(key && !/^[a-zA-Z0-9_-]{8,80}$/.test(key))throw Error("Invalid request ID");

 return {
  name,phone,kind,date,age:clean(raw.age,80),collection:clean(raw.package,100),
  quote,styles,notes:clean(raw.notes,1000),clientRequestId:key||crypto.randomUUID(),
  fulfillment,paymentChoice,address,itemsPaise,deliveryChargePaise,totalAmountPaise
 };
}
export function assertOrigin(request) {
 const origin=request.headers.get("Origin");
 if(origin && origin!==new URL(request.url).origin)throw Error("Request origin does not match website");
}
export async function verifyTurnstile(request,env,token) {
 if(!env.TURNSTILE_SECRET_KEY)throw Error("Turnstile not configured");
 if(!token || typeof token!=="string")throw Error("Complete the spam check");
 const form=new FormData();
 form.set("secret",env.TURNSTILE_SECRET_KEY);form.set("response",token);
 const ip=request.headers.get("CF-Connecting-IP");
 if(ip)form.set("remoteip",ip);
 const response=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{method:"POST",body:form});
 if(!response.ok)throw Error("Verification unavailable");
 const r=await response.json();
 if(!r.success || (r.hostname && r.hostname!==new URL(request.url).hostname))throw Error("Spam verification failed");
}
const encoder=new TextEncoder();
function b64url(bytes) {
 return btoa(Array.from(bytes,b=>String.fromCharCode(b)).join("")).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
function decode64(s) {
 const b=atob(s.replace(/-/g,"+").replace(/_/g,"/"));
 return Uint8Array.from(b,c=>c.charCodeAt(0));
}
async function hmacKey(secret) {return crypto.subtle.importKey("raw",encoder.encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign","verify"]);}
export async function signUpload(orderId,secret) {
 if(!secret || secret.length<32)throw Error("Upload secret missing or too short");
 const expiry=Math.floor(Date.now()/1000)+3600;
 const raw=orderId+"."+expiry;
 const signature=await crypto.subtle.sign("HMAC",await hmacKey(secret),encoder.encode(raw));
 return raw+"."+b64url(new Uint8Array(signature));
}
export async function validUpload(token,orderId,secret) {
 if(!secret || !token)return false;
 const parts=String(token).split(".");
 if(parts.length!==3 || parts[0]!==orderId || !/^\d{10}$/.test(parts[1]) || Number(parts[1])<Date.now()/1000)return false;
 try{const sig=decode64(parts[2]);if(b64url(sig)!==parts[2] || sig.length!==32)return false;
 return await crypto.subtle.verify("HMAC",await hmacKey(secret),sig,encoder.encode(parts[0]+"."+parts[1]));}catch{return false;}
}
let certCache={at:0,keys:[]};
export async function requireOwner(request,env) {
 const bearer=request.headers.get('Authorization');
 if(bearer?.startsWith('Bearer ')){
  const url=(env.SUPABASE_URL||env.VITE_SUPABASE_URL||'').replace(/\/$/,'');
  const key=env.SUPABASE_PUBLISHABLE_KEY||env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if(!/^https:\/\/[^/]+$/.test(url)||!key)throw Object.assign(Error('Supabase owner verification is not configured'),{status:503});
  const headers={Authorization:bearer,apikey:key};
  const userResponse=await fetch(url+'/auth/v1/user',{headers});
  if(!userResponse.ok)throw Object.assign(Error('Please sign in again as the studio owner'),{status:userResponse.status>=500?503:401});
  const user=await userResponse.json();
  if(!user.id)throw Object.assign(Error('Owner identity could not be verified'),{status:401});
  const rolesResponse=await fetch(url+'/rest/v1/user_roles?select=role&user_id=eq.'+encodeURIComponent(user.id)+'&role=eq.admin',{headers});
  if(!rolesResponse.ok)throw Object.assign(Error('Could not verify the studio admin role'),{status:503});
  const roles=await rolesResponse.json();
  if(!Array.isArray(roles)||!roles.some(row=>row.role==='admin'))throw Object.assign(Error('Studio admin access is required'),{status:403});
  return user.email||user.id;
 }
 try{return await requireAccessOwner(request,env);}catch(error){error.status=403;throw error;}
}
async function requireAccessOwner(request,env) {
 const issuer=clean(env.CF_ACCESS_ISSUER,200).replace(/\/$/,"");
 const audiences=String(env.CF_ACCESS_AUD||"").split(",").map(x=>x.trim()).filter(Boolean);
 const allowed=String(env.OWNER_EMAILS||"").toLowerCase().split(",").map(x=>x.trim()).filter(Boolean);
 const token=request.headers.get("Cf-Access-Jwt-Assertion");
 if(!issuer || !audiences.length || !allowed.length || !token)throw Error("Owner access not configured or not authenticated");
 if(!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer))throw Error("Invalid Access issuer");
 const parts=token.split(".");
 if(parts.length!==3)throw Error("Invalid owner token");
 let header,payload;
 try {header=JSON.parse(new TextDecoder().decode(decode64(parts[0])));payload=JSON.parse(new TextDecoder().decode(decode64(parts[1])));}
 catch{throw Error("Invalid owner token");}
 const now=Math.floor(Date.now()/1000);
 if(header.alg!=="RS256" || typeof header.kid!=="string" || payload.iss!==issuer ||
   !(Array.isArray(payload.aud)?payload.aud.some(a=>audiences.includes(a)):audiences.includes(payload.aud)) ||
   typeof payload.exp!=="number" || payload.exp<=now || (payload.nbf && payload.nbf>now) ||
   !allowed.includes(String(payload.email||"").toLowerCase()))throw Error("Owner access denied");
 if(Date.now()-certCache.at>3600000 || !certCache.keys.some(k=>k.kid===header.kid)){
  const r=await fetch(issuer+"/cdn-cgi/access/certs");
  if(!r.ok)throw Error("Cannot verify owner access");
  const v=await r.json();certCache={at:Date.now(),keys:v.keys||[]};
 }
 const jwk=certCache.keys.find(k=>k.kid===header.kid && k.kty==="RSA");
 if(!jwk)throw Error("Unknown Access key");
 const key=await crypto.subtle.importKey("jwk",jwk,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["verify"]);
 const ok=await crypto.subtle.verify("RSASSA-PKCS1-v1_5",key,decode64(parts[2]),encoder.encode(parts[0]+"."+parts[1]));
 if(!ok)throw Error("Invalid owner signature");
 return String(payload.email);
}
export function sniffMedia(buf,mime) {
 const b=new Uint8Array(buf.slice(0,16));
 if(mime==="image/jpeg" && b[0]===255 && b[1]===216 && b[2]===255)return MIME[mime];
 if(mime==="image/png" && [137,80,78,71,13,10,26,10].every((v,i)=>b[i]===v))return MIME[mime];
 const ascii=String.fromCharCode(...b);
 if(mime==="image/webp" && ascii.startsWith("RIFF") && ascii.slice(8,12)==="WEBP")return MIME[mime];
 return null;
}

export async function signTracking(orderId,secret) {
 if(!secret || secret.length<32)throw Error("Order tracking secret not configured");
 const expires=Math.floor(Date.now()/1000)+30*24*3600;
 const raw="tracking."+orderId+"."+expires;
 const signature=await crypto.subtle.sign("HMAC",await hmacKey(secret),encoder.encode(raw));
 return raw+"."+b64url(new Uint8Array(signature));
}
export async function validTracking(token,orderId,secret) {
 if(!secret || !token)return false;
 const p=String(token).split(".");
 if(p.length!==4 || p[0]!=="tracking" || p[1]!==orderId ||
    !/^\d{10}$/.test(p[2]) || Number(p[2])<Date.now()/1000)return false;
 try {
  const sig=decode64(p[3]);if(b64url(sig)!==p[3] || sig.length!==32)return false;
  return await crypto.subtle.verify("HMAC",await hmacKey(secret),sig,encoder.encode(p.slice(0,3).join(".")));
 }catch{return false;}
}

export function hasBindings(env) {return !!env.ORDER_DB;}
