import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import pages from "@/lib/search-pages.json";
import { searchPageHead } from "@/lib/seo";

export const Route = createFileRoute("/gifts_/$productSlug")({
  loader: ({ params }) => {
    const product = pages.products.find((page) => page.slug === params.productSlug);
    if (!product) throw notFound();
    return product;
  },
  head: ({ loaderData }) => loaderData ? searchPageHead(loaderData) : {},
  component: GiftProductPage,
});

function GiftProductPage() {
  const product = Route.useLoaderData();
  return <div className="editorial"><SiteNav /><main className="ed-wrap ed-section">
    <Link to="/gifts" className="ed-text-button">← All photo gifts</Link>
    <article className={`mt-8 grid max-w-5xl items-start gap-8 ${product.image ? "md:grid-cols-2" : ""}`}>
      {"image" in product && product.image && <figure>
        <img className="w-full rounded-xl object-contain" src={product.image} alt={product.alt} />
        <figcaption className="mt-2 text-sm text-muted-foreground">Personalisation example</figcaption>
      </figure>}
      <div>
        <p className="ed-kicker">Rajmoti Studio · Jetpur</p>
        <h1>{product.heading}</h1>
        <p className="ed-copy">{product.description}</p>
        <h2 className="mt-6 text-xl">How to order</h2>
        <p className="ed-copy">Choose a design or request a quote. We’ll confirm the price and collection date with you. Collect from our Jetpur studio. Home delivery, where available, requires full prepayment.</p>
        <div className="ed-actions mt-5">
          <Link to="/gifts" search={{ product: product.sku }} className="ed-button">View design options <ArrowRight size={16} /></Link>
          <Link to="/contact" search={{ session: "photo-gifting" }} className="ed-text-button">Ask the studio</Link>
        </div>
      </div>
    </article>
  </main><SiteFooter /></div>;
}
