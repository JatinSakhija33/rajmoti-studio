import content from "../src/lib/search-pages.json";

const site = "https://rajmotistudio.in";
const pages = [content.home, ...content.pages, ...content.services, ...content.products];
const byPath = new Map(pages.map((page) => [page.path, page]));
const indexPolicy = "index,follow,max-image-preview:large";
const noIndexPolicy = "noindex, nofollow";
const escapeHtml = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");

export function searchPage(request) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, "") || "/";
  return url.origin === site ? byPath.get(path) : undefined;
}

function relatedPages(page) {
  if (page.path === "/gifts") return [...content.products, content.pages.find((item) => item.path === "/contact")];
  if (page.path.startsWith("/gifts/")) return [byPath.get("/gifts"), byPath.get("/contact")];
  if (page.path.startsWith("/studio-services/")) return [content.home, byPath.get("/contact")];
  return [byPath.get("/portfolios"), ...content.pages.filter((item) => item.path.startsWith("/portfolios/")),
    ...content.services, byPath.get("/gifts"), byPath.get("/contact")].filter((item) => item.path !== page.path);
}

function fallback(page) {
  const links = relatedPages(page).map((item) =>
    `<li><a href="${escapeHtml(item.path)}">${escapeHtml(item.heading)}</a></li>`).join("");
  const answer = page.question
    ? `<h2>${escapeHtml(page.question)}</h2><p>${escapeHtml(page.answer)}</p>` : "";
  return `<main class="container-page py-8"><h1>${escapeHtml(page.heading)}</h1><p>${escapeHtml(page.description)}</p>${answer}<nav aria-label="Explore Rajmoti Studio"><ul>${links}</ul></nav></main>`;
}

function structuredData(page) {
  const entityId = site + "/#studio";
  if (page.path === "/" || page.path === "/contact") {
    return {
      "@context": "https://schema.org", "@type": "LocalBusiness", "@id": entityId,
      name: "Rajmoti Studio", url: site + "/", telephone: "+919429070317",
      email: "rajmotistudio@gmail.com", image: site + content.home.image,
      address: { "@type": "PostalAddress", addressLocality: "Jetpur", addressRegion: "Gujarat", addressCountry: "IN" },
      sameAs: ["https://www.instagram.com/rajmoti_studio/"],
    };
  }
  if (page.question || page.path.startsWith("/portfolios/")) {
    return {
      "@context": "https://schema.org", "@type": "Service", name: page.heading, description: page.description,
      url: site + page.path, areaServed: { "@type": "City", name: "Jetpur" },
      provider: { "@id": entityId, name: "Rajmoti Studio" },
    };
  }
  return null;
}

export async function onRequest(context) {
  const { request } = context;
  const response = await context.next();
  if (!["GET", "HEAD"].includes(request.method) || !response.headers.get("Content-Type")?.includes("text/html")) {
    return response;
  }

  const page = response.status === 200 ? searchPage(request) : undefined;
  const headers = new Headers(response.headers);
  headers.set("X-Robots-Tag", page ? indexPolicy : noIndexPolicy);
  if (!page) return new Response(response.body, { status: response.status, headers });

  headers.delete("Content-Length");
  headers.delete("ETag");
  if (request.method === "HEAD") return new Response(null, { status: response.status, headers });
  const url = site + page.path;
  const json = JSON.stringify(structuredData(page)).replaceAll("<", "\\u003c");
  const image = page.image || content.home.image;
  const canonical = `<link rel="canonical" href="${escapeHtml(url)}" data-search-shell>
<meta name="description" content="${escapeHtml(page.description)}" data-search-shell>
<meta property="og:title" content="${escapeHtml(page.title)}" data-search-shell>
<meta property="og:description" content="${escapeHtml(page.description)}" data-search-shell>
<meta property="og:url" content="${escapeHtml(url)}" data-search-shell>
<meta property="og:image" content="${escapeHtml(site + image)}" data-search-shell>
${json === "null" ? "" : `<script data-search-shell type="application/ld+json">${json}</script>`}`;
  return new HTMLRewriter()
    .on('meta[name="robots"]', { element(element) { element.setAttribute("content", indexPolicy); } })
    .on("title", { element(element) { element.setInnerContent(page.title); } })
    .on("head", { element(element) { element.append(canonical, { html: true }); } })
    .on("#root", { element(element) { element.setInnerContent(fallback(page), { html: true }); } })
    .transform(new Response(response.body, { status: response.status, headers }));
}
