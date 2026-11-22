import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import seed from '../../src/features/catalogue/seed.json' with {type:'json'};

export function giftLine(productId='MUG-002', withPhoto=true) {
 const p=seed.products.find(p=>p.id===productId);
 return {productId:p.id,variantId:p.variants[0].id,quantity:1,personalisation:p.personalisation[0],packaging:p.packaging[0],orderType:p.orderTypes[0],...(withPhoto?{design:{id:crypto.randomUUID(),kind:'mug',settings:{heatPreview:true},photoSlots:[{source:'upload',index:0}],photoCount:1}}:{})};
}
export function giftBody(overrides={}) {return {name:'Local QA Customer',phone:'9876543210',type:'Photo gifting',clientRequestId:crypto.randomUUID(),fulfillment:'studio_collection',paymentChoice:'pay_online',turnstileToken:'qa-token',quote:[giftLine()],expectedTotalPaise:55000,...overrides};}
export function fixture(){
 const sqlite=new DatabaseSync(':memory:');sqlite.exec('PRAGMA foreign_keys=ON');
 for(const name of ['0001_web_orders.sql','0003_live_gifting_engine.sql','0004_payment_engine.sql','0005_gift_asset_mapping.sql'])sqlite.exec(readFileSync(new URL('../../db/migrations/'+name,import.meta.url),'utf8'));
 const db={failPattern:null,prepare(sql){return {sql,args:[],bind(...args){this.args=args;return this;},execute(){if(db.failPattern?.test(sql))throw Error('Injected database write failure');const result=sqlite.prepare(sql).run(...this.args);return {success:true,meta:{changes:Number(result.changes)}};},async run(){return this.execute();},async first(){if(db.failPattern?.test(sql))throw Error('Injected database read failure');return sqlite.prepare(sql).get(...this.args)||null;},async all(){if(db.failPattern?.test(sql))throw Error('Injected database read failure');return {results:sqlite.prepare(sql).all(...this.args)};}};},async batch(statements){sqlite.exec('BEGIN');try{const results=statements.map(s=>s.execute());sqlite.exec('COMMIT');return results;}catch(e){sqlite.exec('ROLLBACK');throw e;}}};
 const objects=new Map();const bucket={async put(key,bytes,metadata){objects.set(key,{bytes:new Uint8Array(bytes),metadata});},async delete(key){objects.delete(key);},async get(key){const obj=objects.get(key);return obj?{body:obj.bytes}:null;}};
 const env={GIFT_CHECKOUT_ENABLED:'true',GIFT_PRODUCTION_APPROVED:'true',ORDER_DB:db,ORDER_PHOTOS:bucket,ORDER_UPLOAD_SECRET:'local-qa-secret-only-0000000000000000000000000',TURNSTILE_SECRET_KEY:'qa-secret',TURNSTILE_SITE_KEY:'qa-site',SUPABASE_URL:'https://qa-auth.invalid',SUPABASE_PUBLISHABLE_KEY:'qa-key'};
 return {sqlite,db,objects,env,close:()=>sqlite.close()};
}
export function stubExternalServices(){
 const original=globalThis.fetch;
 globalThis.fetch=async(input,init)=>{const url=String(input instanceof Request?input.url:input);if(url==='https://challenges.cloudflare.com/turnstile/v0/siteverify')return Response.json({success:true});if(url.startsWith('https://qa-auth.invalid/')){const bearer=new Headers(init?.headers).get('Authorization');if(bearer==='Bearer qa-unavailable')return new Response('',{status:503});if(!['Bearer qa-admin','Bearer qa-customer'].includes(bearer))return new Response('',{status:401});return Response.json(url.includes('/auth/v1/user')?{id:'qa-user',email:'qa-owner@example.invalid'}:bearer==='Bearer qa-admin'?[{role:'admin'}]:[]);}return original(input,init);};
 return ()=>{globalThis.fetch=original;};
}
export function request(path,body,owner=false,method='POST'){return new Request('http://localhost'+path,{method,headers:{'Content-Type':'application/json',Origin:'http://localhost',...(owner?{Authorization:'Bearer qa-admin'}:{})},...(body?{body:JSON.stringify(body)}:{})});}
