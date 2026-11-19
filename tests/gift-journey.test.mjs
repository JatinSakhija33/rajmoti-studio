import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixture,giftBody,giftLine,request,stubExternalServices} from './helpers/gift-fixture.mjs';
import {cleanOrder,requireOwner} from '../functions/_lib/security.js';
import {onRequestPost as create} from '../functions/api/orders.js';
import {onRequestPost as upload} from '../functions/api/orders/[id]/photos.js';
import {onRequestPost as submitUtr} from '../functions/api/orders/[id]/payment.js';
import {onRequestPost as verify} from '../functions/api/owner/orders/[id]/payments.js';
import {onRequestPatch as progress} from '../functions/api/owner/orders/[id].js';
import {onRequestGet as track} from '../functions/api/track/[id].js';
import {onRequestGet as original} from '../functions/api/owner/orders/[id]/photos/[photoId].js';

test('gift journey uses real SQL, original image bytes and manually verified receipts',async t=>{
 const f=fixture(),restore=stubExternalServices();t.after(()=>{restore();f.close();});const env=f.env;
 const body=giftBody();let order;
 await t.test('canonical SKU prices reject forged variants and client prices',async()=>{
  assert.equal(cleanOrder({...body,quote:[{...body.quote[0],unitPricePaise:1,size:'fake'}]}).totalAmountPaise,55000);
  assert.throws(()=>cleanOrder({...body,quote:[{...body.quote[0],variantId:'made-up'}]}),/unavailable/);
  assert.throws(()=>cleanOrder({...body,quote:[giftLine('MAG-001',false)]}),/quotation/);
  const r=await create({request:request('/api/orders',{...body,expectedTotalPaise:1}),env});assert.equal(r.status,409);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM orders').get().n,0);
 });
 await t.test('order and ledger save atomically; retries return the same order',async()=>{
  let r=await create({request:request('/api/orders',body),env});assert.equal(r.status,201);order=await r.json();
  r=await create({request:request('/api/orders',body),env});assert.equal((await r.json()).id,order.id);
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM orders').get().n,1);assert.equal(f.sqlite.prepare('SELECT verified_paid_paise n FROM orders').get().n,0);
 });
 await t.test('real photo maps to saved design; duplicate upload does not duplicate storage',async()=>{
  const bytes=readFileSync(new URL('../public/products/mug-sample-couple.jpg',import.meta.url));
  const send=async(mime='image/jpeg',content=bytes,slot=0)=>{const data=new FormData();data.set('photo',new File([content],'qa-photo.jpg',{type:mime}));data.set('designId',body.quote[0].design.id);data.set('slotIndex',String(slot));return upload({request:new Request('http://localhost/api/orders/'+order.id+'/photos',{method:'POST',headers:{'X-Rajmoti-Upload-Token':order.uploadToken},body:data}),env,params:{id:order.id}});};
  assert.equal((await send('image/jpeg',new Uint8Array([1,2,3]))).status,415);
  assert.equal((await send('image/jpeg',bytes,99)).status,400);
  assert.equal((await send()).status,201);assert.equal((await send()).status,200);assert.equal(f.objects.size,1);
  const stored=[...f.objects.values()][0];assert.deepEqual(stored.bytes,new Uint8Array(bytes));
  const photo=f.sqlite.prepare('SELECT * FROM order_photos').get();assert.equal(photo.design_id,body.quote[0].design.id);assert.equal(photo.slot_index,0);
  const unauthorized=await original({request:new Request('http://localhost/api/owner/orders/x/photos/y'),env,params:{id:order.id,photoId:photo.id}});assert.equal(unauthorized.status,403);
  const authorized=await original({request:request('/api/owner/orders/x/photos/y',null,true,'GET'),env,params:{id:order.id,photoId:photo.id}});assert.equal(authorized.status,200);assert.deepEqual(new Uint8Array(await authorized.arrayBuffer()),new Uint8Array(bytes));
 });
 await t.test('customer UTR remains pending and cannot authorize dispatch',async()=>{
  let r=await submitUtr({request:request('/api/orders/'+order.id+'/payment',{trackingToken:order.trackingToken,utr:'QA123456789012'}),env,params:{id:order.id}});assert.equal(r.status,200);assert.equal((await r.json()).status,'pending_verification');
  assert.equal(f.sqlite.prepare('SELECT verified_paid_paise n FROM orders').get().n,0);
  r=await progress({request:request('/api/owner/orders/'+order.id,{status:'delivered',review:{original_preserved:true,identity_preserved:true,print_spec_verified:true,customer_details_verified:true}},true,'PATCH'),env,params:{id:order.id}});assert.equal(r.status,409);
 });
 await t.test('existing auth is independently verified and fails closed',async()=>{
  await assert.rejects(()=>requireOwner(new Request('http://localhost',{headers:{Authorization:'Bearer qa-customer'}}),env),e=>e.status===403);
  await assert.rejects(()=>requireOwner(new Request('http://localhost',{headers:{Authorization:'Bearer qa-unavailable'}}),env),e=>e.status===503);
  assert.equal(await requireOwner(new Request('http://localhost',{headers:{Authorization:'Bearer qa-admin'}}),env),'qa-owner@example.invalid');
 });
 await t.test('failed payment database writes roll back and never report paid',async()=>{
  const attempt=f.sqlite.prepare('SELECT id FROM order_payments').get();f.db.failPattern=/INSERT INTO order_events/;
  const r=await verify({request:request('/api/owner/orders/'+order.id+'/payments',{action:'verify_upi',paymentId:attempt.id,amountPaise:55000,utr:'QA123456789012',bankChecked:true},true),env,params:{id:order.id}});assert.equal(r.status,500);f.db.failPattern=null;
  assert.equal(f.sqlite.prepare('SELECT verified_paid_paise n FROM orders').get().n,0);assert.equal(f.sqlite.prepare('SELECT status FROM order_payments').get().status,'pending_verification');
 });
 await t.test('manual verification is explicit, partial, idempotent and duplicate-UTR protected',async()=>{
  const paymentId=f.sqlite.prepare('SELECT id FROM order_payments').get().id;
  const payload={action:'verify_upi',paymentId,amountPaise:20000,utr:'QA123456789012',bankChecked:true};
  assert.equal((await verify({request:request('/api/owner/orders/'+order.id+'/payments',{...payload,bankChecked:false},true),env,params:{id:order.id}})).status,400);
  for(let i=0;i<2;i++){const r=await verify({request:request('/api/owner/orders/'+order.id+'/payments',payload,true),env,params:{id:order.id}});assert.equal(r.status,200);assert.equal((await r.json()).verifiedPaise,20000);}
  const dup=await verify({request:request('/api/owner/orders/'+order.id+'/payments',{action:'record_counter_payment',receiptId:crypto.randomUUID(),amountPaise:35000,utr:payload.utr,bankChecked:true},true),env,params:{id:order.id}});assert.equal(dup.status,409);assert.equal(f.sqlite.prepare('SELECT verified_paid_paise n FROM orders').get().n,20000);
  const balance=await verify({request:request('/api/owner/orders/'+order.id+'/payments',{action:'record_counter_payment',receiptId:crypto.randomUUID(),amountPaise:35000,utr:'QA987654321012',bankChecked:true},true),env,params:{id:order.id}});assert.equal((await balance.json()).paymentStatus,'verified_paid');
 });
 await t.test('private tracking shows actual ledger and production progress',async()=>{
  const r=await progress({request:request('/api/owner/orders/'+order.id,{status:'delivered',review:{original_preserved:true,identity_preserved:true,print_spec_verified:true,customer_details_verified:true}},true,'PATCH'),env,params:{id:order.id}});assert.equal(r.status,200);
  const result=await track({request:new Request('http://localhost/api/track/'+order.id+'?token='+order.trackingToken),env,params:{id:order.id}});const data=await result.json();assert.equal(data.status,'delivered');assert.equal(data.verifiedPaidPaise,55000);assert.equal(data.photoCount,1);assert.equal(data.upiUri,'');assert.equal(data.uploadToken,null);
 });
 await t.test('failed order creation rolls back every table',async()=>{
  f.db.failPattern=/INSERT INTO order_events/;const r=await create({request:request('/api/orders',giftBody()),env});f.db.failPattern=null;assert.equal(r.status,500);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM orders').get().n,1);
 });
 await t.test('studio collection can submit UPI later; failed photo writes clean private storage',async()=>{
  const body=giftBody({paymentChoice:'pay_at_studio'});const created=await create({request:request('/api/orders',body),env});const order=await created.json();assert.equal(created.status,201);
  const data=new FormData();data.set('photo',new File([readFileSync(new URL('../public/products/mug-sample-couple.jpg',import.meta.url))],'qa.jpg',{type:'image/jpeg'}));data.set('designId',body.quote[0].design.id);data.set('slotIndex','0');f.db.failPattern=/INSERT INTO order_photos/;
  const response=await upload({request:new Request('http://localhost/api/orders/'+order.id+'/photos',{method:'POST',headers:{'X-Rajmoti-Upload-Token':order.uploadToken},body:data}),env,params:{id:order.id}});f.db.failPattern=null;assert.equal(response.status,500);assert.equal(f.objects.size,1);
  const result=await submitUtr({request:request('/api/orders/'+order.id+'/payment',{trackingToken:order.trackingToken,utr:'LATE123456789'}),env,params:{id:order.id}});assert.equal(result.status,200);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM order_payments WHERE order_id=?').get(order.id).n,1);assert.equal(f.sqlite.prepare('SELECT verified_paid_paise n FROM orders WHERE id=?').get(order.id).n,0);
 });
});
