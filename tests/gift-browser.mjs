// Local end-to-end QA. Actual Pages handlers + SQLite + private image bytes;
// only external authentication/Turnstile boundaries are simulated. No live orders.
import {createServer} from 'node:http';
import {readFileSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,extname,sep} from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {fixture,stubExternalServices} from './helpers/gift-fixture.mjs';
import * as config from '../functions/api/gifts/config.js';
import * as orders from '../functions/api/orders.js';
import * as photos from '../functions/api/orders/[id]/photos.js';
import * as payment from '../functions/api/orders/[id]/payment.js';
import * as tracking from '../functions/api/track/[id].js';
import * as ownerList from '../functions/api/owner/orders.js';
import * as ownerDetail from '../functions/api/owner/orders/[id].js';
import * as ownerPayment from '../functions/api/owner/orders/[id]/payments.js';
import * as ownerPhoto from '../functions/api/owner/orders/[id]/photos/[photoId].js';
const root=fileURLToPath(new URL('../',import.meta.url)),dist=resolve(root,'dist'),out=resolve(root,'../integration-audit/browser');mkdirSync(out,{recursive:true});
const f=fixture(),restore=stubExternalServices();const routes=[[/^\/api\/gifts\/config$/,config],[/^\/api\/orders$/,orders],[/^\/api\/orders\/([^/]+)\/photos$/,photos],[/^\/api\/orders\/([^/]+)\/payment$/,payment],[/^\/api\/track\/([^/]+)$/,tracking],[/^\/api\/owner\/orders$/,ownerList],[/^\/api\/owner\/orders\/([^/]+)\/payments$/,ownerPayment],[/^\/api\/owner\/orders\/([^/]+)\/photos\/([^/]+)$/,ownerPhoto],[/^\/api\/owner\/orders\/([^/]+)$/,ownerDetail]];
const mime={'.js':'text/javascript','.css':'text/css','.json':'application/json','.html':'text/html','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{try{const url=new URL(req.url,'http://127.0.0.1:8789');const route=routes.find(([pattern])=>pattern.test(url.pathname));if(route){const match=route[0].exec(url.pathname);const chunks=[];for await(const chunk of req)chunks.push(chunk);const body=Buffer.concat(chunks);const request=new Request(url,{method:req.method,headers:req.headers,...(body.length?{body}:{})});const handler=route[1]['onRequest'+req.method[0]+req.method.slice(1).toLowerCase()];const response=handler?await handler({request,env:f.env,params:{id:match[1],photoId:match[2]}}):new Response('',{status:405});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));return;}let path=resolve(dist,'.'+decodeURIComponent(url.pathname));if(!path.startsWith(dist+sep)&&path!==dist){res.writeHead(403);res.end();return;}if(!existsSync(path)||!extname(path))path=resolve(dist,'index.html');res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream'});res.end(readFileSync(path));}catch(e){res.writeHead(500);res.end(String(e));}});
await new Promise(r=>server.listen(8789,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.EDGE_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--enable-unsafe-swiftshader']});const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));const report=[];
await page.route('https://challenges.cloudflare.com/turnstile/v0/api.js*',route=>route.fulfill({contentType:'text/javascript',body:'window.turnstile={render:function(el,options){setTimeout(()=>options.callback("qa-token"),0);return "qa-widget";},remove:function(){}};'}));
const base='http://127.0.0.1:8789',photo=resolve(root,'public/products/mug-sample-couple.jpg');
async function visit(path){await page.goto(base+path);await page.locator('h1').first().waitFor();}
async function shot(name){await page.screenshot({path:resolve(out,name+'.png'),fullPage:false});}
try{
 await visit('/');assert.match(await page.title(),/Little moments/);report.push('Original photography homepage renders');
 await visit('/portfolios');assert.match(await page.title(),/Photography Portfolios/);await page.getByRole('heading',{name:'A studied body of work.'}).waitFor();report.push('Original photography portfolio renders');
 await visit('/admin');await page.getByRole('link',{name:'Studio Workflow',exact:true}).waitFor();report.push('Original admin dashboard and navigation render in existing demo mode');
 await visit('/gifts?product=MUG-002');const dialog=page.getByRole('dialog');await dialog.locator('canvas').waitFor();await dialog.locator('input[type=file]').setInputFiles(photo);await dialog.getByRole('slider',{name:'Mug photo zoom'}).fill('1.5');await page.waitForTimeout(700);await shot('mug-uploaded');
 await dialog.getByRole('button',{name:'Cold',exact:true}).click();await shot('mug-cold');await dialog.getByRole('button',{name:'Hot',exact:true}).click();
 await dialog.getByRole('button',{name:/Save design & add to cart/}).click();
 const cart=page.getByRole('button',{name:/Your cart/}).first();await cart.click();await page.getByRole('button',{name:/Continue to order/}).click();await page.getByLabel('Your name',{exact:true}).fill('Local Browser QA');await page.getByLabel('Mobile number',{exact:true}).fill('9876543210');
 const responsePromise=page.waitForResponse(r=>r.url().endsWith('/api/orders')&&r.request().method()==='POST');await page.getByRole('button',{name:'Create order & upload originals'}).click();const response=await responsePromise;assert.equal(response.status(),201);const receipt=await response.json();await page.getByText('1 original photograph(s) received.').waitFor();
 await page.getByLabel('Bank transaction reference / UTR').fill('BROWSER123456789');await page.getByRole('button',{name:'Submit reference for manual verification'}).click();await page.getByText('Awaiting manual bank verification.',{exact:false}).waitFor();await shot('order-pending');
 const row=f.sqlite.prepare('SELECT * FROM orders WHERE id=?').get(receipt.id);const saved=JSON.parse(row.items_json);assert.equal(saved[0].design.settings.crop.zoom,1.5);assert.equal(f.objects.size,1);assert.equal(row.verified_paid_paise,0);assert.equal(row.payment_status,'pending_verification');report.push('Photo upload → real mug texture → crop edit → save → cart → actual order handler → private original storage → UTR pending');
 await page.reload();await page.getByRole('button',{name:/Your cart/}).first().click();await page.getByText('Order '+receipt.reference+' saved',{exact:true}).waitFor();assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM orders').get().n,1);report.push('Refresh restores receipt without duplicating order');
 await page.getByRole('link',{name:/View private order progress/}).click();await page.getByText(receipt.reference,{exact:true}).waitFor();await shot('tracking');report.push('Private tracking reads actual progress and payment ledger');
 // Admin is authenticated at the external-service boundary; all owner handlers remain real.
 await page.setExtraHTTPHeaders({Authorization:'Bearer qa-admin'});await visit('/admin/gift-orders');await page.getByRole('button',{name:new RegExp(receipt.reference)}).click();await page.getByRole('button',{name:/View original/}).click();await page.getByAltText('Private customer original').waitFor();
 await page.getByLabel('Bank-verified UTR',{exact:true}).fill('BROWSER123456789');await page.getByLabel('I reconciled this receipt against the bank statement.').check();await page.getByRole('button',{name:'Record manually verified receipt'}).click();await page.getByText('Total ₹550.00 · Verified ₹550.00',{exact:true}).waitFor();report.push('Existing admin shell opens private photo and records manually verified UPI receipt');
 await page.setExtraHTTPHeaders({});
 for(const [id,name] of [['LED-001','led'],['ACR-001','acrylic'],['ALB-001','album'],['KEY-001','keychain'],['TEC-001','phone']]){
  await visit('/gifts?product='+id);const d=page.getByRole('dialog');await d.locator('input[type=file]').first().waitFor({state:'attached'});await d.locator('input[type=file]').first().setInputFiles(photo);await page.waitForTimeout(350);
  if(name==='led'){await d.getByRole('button',{name:'Off',exact:true}).click();await shot('led-off');await d.getByRole('button',{name:'Light On',exact:true}).click();}
  if(name==='album'){await d.getByRole('button',{name:'Next Page',exact:true}).click();await page.waitForTimeout(800);await d.getByText('Page 2 of 12',{exact:true}).waitFor();await d.getByRole('button',{name:/Save design & add to cart/}).click();const line=await page.evaluate(()=>JSON.parse(localStorage.getItem('rajmoti:editorial:quote:v2')).at(-1));assert.equal(line.design.kind,'album');assert.equal(line.design.photoCount,1);assert.equal(line.design.photoSlots[0].source,'upload');await visit('/gifts?product='+id);}
  await shot(name+'-uploaded');report.push(name+' actual photo upload and interactive renderer');
 }
 for(const width of [320,390,768,1024,1440]){await page.setViewportSize({width,height:950});await visit('/gifts');const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false,'shopping page overflow at '+width);await visit('/gifts?product=MUG-002');await page.getByRole('dialog').locator('canvas').waitFor();assert.equal(await page.getByRole('dialog').evaluate(el=>el.scrollWidth>el.clientWidth+1),false,'mug modal overflow at '+width);await shot('mobile-'+width);}
 for(const id of ['LED-001','ACR-001','ALB-001','KEY-001','TEC-001']){await page.setViewportSize({width:390,height:950});await visit('/gifts?product='+id);const d=page.getByRole('dialog');await d.locator('input[type=file]').first().waitFor({state:'attached'});assert.equal(await d.evaluate(el=>el.scrollWidth>el.clientWidth+1),false,'preview modal overflow '+id);}
 report.push('Shopping and real mug modal fit 320, 390, 768, 1024 and 1440 px');assert.deepEqual(errors,[]);writeFileSync(resolve(out,'report.json'),JSON.stringify({report,errors},null,2));console.log(JSON.stringify({report,errors},null,2));
}finally{await browser.close();server.close();restore();f.close();}
