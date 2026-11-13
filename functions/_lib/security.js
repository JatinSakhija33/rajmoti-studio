const MIME = {"image/jpeg":".jpg","image/png":".png","image/webp":".webp"};
export const STAGES = ["received","editing","review","printing","framing","ready","delivered","cancelled"];
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
 if(Array.isArray(raw.quote) && raw.quote.length>12)throw Error("Too many selected gifts");
 const quote=(Array.isArray(raw.quote)?raw.quote:[]).map(v=>({
  productId:clean(v?.productId,80),variantId:clean(v?.variantId,80),
  quantity:Math.min(50,Math.max(1,Number(v?.quantity)||1)),
  personalisation:clean(v?.personalisation,200),packaging:clean(v?.packaging,80),
  orderType:clean(v?.orderType,80)
 }));
 const styles=(Array.isArray(raw.styles)?raw.styles:[]).slice(0,12).map(v=>({id:clean(v?.id,80),title:clean(v?.title,120)}));
 const date=clean(raw.date,10);
 if(date && !/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error("Invalid preferred date");
 const key=clean(raw.clientRequestId,80);
 if(key && !/^[a-zA-Z0-9_-]{8,80}$/.test(key))throw Error("Invalid request ID");
 return {name,phone,kind,date,age:clean(raw.age,80),collection:clean(raw.package,100),
 quote,styles,notes:clean(raw.notes,1000),clientRequestId:key||crypto.randomUUID()};
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
