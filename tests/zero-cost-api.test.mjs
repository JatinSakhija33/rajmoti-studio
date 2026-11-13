import test from "node:test";
import assert from "node:assert/strict";
import {
  cleanOrder,
  phoneNumber,
  sniffMedia,
  signUpload,
  validUpload,
  signTracking,
  validTracking,
  requireOwner,
  buildUpiUri,
  UPI_CONFIG,
  calculateVariantPricePaise,
  STANDARD_DELIVERY_CHARGE_PAISE,
} from "../functions/_lib/security.js";

const secret="d5c64a28942d159134a2d7c783afb14184fbd784a19557f35a930132019b83af";

test("phone normalization rejects invalid numbers",()=>{
 assert.equal(phoneNumber("+91 98765 43210"),"9876543210");
 assert.equal(phoneNumber("9876543210"),"9876543210");
 assert.equal(phoneNumber("0000000000"),null);
 assert.equal(phoneNumber("98345"),null);
});
test("order intake sanitizes and bounds personal fields",()=>{
 const v=cleanOrder({name:"  Test Person  ",phone:"+91 9876543210",type:"Photo gifting",notes:"X".repeat(2000),clientRequestId:"request_abcdef1234567890"});
 assert.equal(v.name,"Test Person");assert.equal(v.phone,"9876543210");assert.equal(v.notes.length,1000);
 assert.equal(v.clientRequestId,"request_abcdef1234567890");
 assert.throws(()=>cleanOrder({name:"X",phone:"123",type:"Baby"}));
 assert.throws(()=>cleanOrder({name:"Test",phone:"9876543210",type:"Baby",quote:Array(13).fill({})}));
});
test("upload grant is scoped to the correct order",async()=>{
 const id=crypto.randomUUID(),different=crypto.randomUUID();
 const token=await signUpload(id,secret);
 assert.equal(await validUpload(token,id,secret),true);
 assert.equal(await validUpload(token,different,secret),false);
 const parts=token.split(".");
 const signature=parts[2];
 const changed=(signature[0]==="A"?"B":"A")+signature.slice(1);
 assert.equal(await validUpload(parts[0]+"."+parts[1]+"."+changed,id,secret),false);
 assert.equal(await validUpload("garbage",id,secret),false);
});
test("tracking grant is separate from upload and scope-limited",async()=>{
 const id=crypto.randomUUID(),other=crypto.randomUUID();
 const track=await signTracking(id,secret);
 const upload=await signUpload(id,secret);
 assert.equal(await validTracking(track,id,secret),true);
 assert.equal(await validTracking(track,other,secret),false);
 assert.equal(await validTracking(upload,id,secret),false);
 assert.equal(await validUpload(track,id,secret),false);
});
test("content signature checks reject disguised files",()=>{
 const jpeg=new Uint8Array([255,216,255,224,0,0,0,0,0,0,0,0,0,0,0,0]).buffer;
 const fake=new Uint8Array([0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5]).buffer;
 assert.equal(sniffMedia(jpeg,"image/jpeg"),".jpg");
 assert.equal(sniffMedia(fake,"image/jpeg"),null);
});
test("owner access fails closed if no Access credentials exist",async()=>{
 await assert.rejects(()=>requireOwner(new Request("https://example.com/api/owner/orders"),{}));
});

test("UPI URI encodes exact payee, beneficiary, and integer paise amount", () => {
  assert.equal(UPI_CONFIG.payeeVpa, "9429070317@apl");
  assert.equal(UPI_CONFIG.payeeName, "PANKAJ LAXMICHAND SAKHIJA");

  const uri = buildUpiUri({ amountPaise: 85000, publicRef: "RJ-TEST", note: "12x18 Frame" });
  assert.match(uri, /^upi:\/\/pay\?/);
  assert.match(uri, /pa=9429070317%40apl/);
  assert.match(uri, /pn=PANKAJ\+LAXMICHAND\+SAKHIJA/);
  assert.match(uri, /am=850\.00/);
  assert.match(uri, /cu=INR/);
  assert.match(uri, /tr=RJ-TEST/);

  // Throws on negative or zero amounts
  assert.throws(() => buildUpiUri({ amountPaise: 0 }));
  assert.throws(() => buildUpiUri({ amountPaise: -100 }));
});

test("Home Delivery requires 100% online prepayment and delivery address", () => {
  // Rejects Home Delivery without address
  assert.throws(() =>
    cleanOrder({
      name: "Suresh Patel",
      phone: "9876543210",
      type: "Photo gifting",
      fulfillment: "home_delivery",
      address: {},
    }),
  );

  // Valid Home Delivery order forces paymentChoice = pay_online (COD = Never)
  const deliveryOrder = cleanOrder({
    name: "Suresh Patel",
    phone: "9876543210",
    type: "Photo gifting",
    fulfillment: "home_delivery",
    paymentChoice: "pay_at_studio", // Attempted to choose pay on collection for delivery
    address: { line1: "Station Road", pincode: "360370", city: "Jetpur" },
    quote: [{ productId: "FRM-001", size: "12×18 in", quantity: 1 }],
  });

  assert.equal(deliveryOrder.fulfillment, "home_delivery");
  assert.equal(deliveryOrder.paymentChoice, "pay_online"); // Forced full online payment
  assert.equal(deliveryOrder.deliveryChargePaise, STANDARD_DELIVERY_CHARGE_PAISE);
  assert.equal(deliveryOrder.totalAmountPaise, 85000 + 10000); // Frame ₹850 + Delivery ₹100 = ₹950
});

test("Studio Collection allows Pay Online or Pay at Studio", () => {
  const shopOrder = cleanOrder({
    name: "Pooja Varma",
    phone: "9876543210",
    type: "Photo gifting",
    fulfillment: "studio_collection",
    paymentChoice: "pay_at_studio",
    quote: [{ productId: "MUG-001", size: "Standard", finish: "magic", quantity: 2 }],
  });

  assert.equal(shopOrder.fulfillment, "studio_collection");
  assert.equal(shopOrder.paymentChoice, "pay_at_studio");
  assert.equal(shopOrder.deliveryChargePaise, 0);
  assert.equal(shopOrder.totalAmountPaise, 55000 * 2); // 2 Magic Mugs = ₹1100
});
