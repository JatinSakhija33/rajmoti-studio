import test from "node:test";
import assert from "node:assert/strict";
import {cleanOrder,phoneNumber,sniffMedia,signUpload,validUpload,signTracking,validTracking,requireOwner} from "../functions/_lib/security.js";

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
