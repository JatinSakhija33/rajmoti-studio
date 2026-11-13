import {mkdirSync,writeFileSync} from "node:fs";
const candidate=process.env.VITE_PUBLIC_SITE_URL || process.env.CF_PAGES_URL || "";
let origin="";
try {
 const u=new URL(candidate);
 if((u.protocol==="https:" || (u.hostname==="localhost" && u.protocol==="http:")) &&
    !u.hostname.includes("YOUR-") && u.hostname!== "YOUR-DOMAIN.example")origin=u.origin;
} catch {}
const allow=["/","/about","/portfolios","/gifts","/packages","/stories","/cinematic-reels","/contact"];
mkdirSync("public",{recursive:true});
const robots=["User-agent: *","Allow: /","Disallow: /admin","Disallow: /auth",
 "Disallow: /reset-password","Disallow: /desk","Disallow: /track","Disallow: /api"];
if(origin)robots.push("", "Sitemap: "+origin+"/sitemap.xml");
writeFileSync("public/robots.txt",robots.join("\n")+"\n");
if(origin){
 const esc=(s)=>s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll('"',"&quot;");
 const doc='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+
 allow.map(path=>"  <url><loc>"+esc(origin+path)+"</loc></url>").join("\n")+"\n</urlset>\n";
 writeFileSync("public/sitemap.xml",doc);
 console.log("Generated sitemap for",origin);
} else console.log("No verified production URL configured: omitting sitemap until domain/Pages URL is set.");
