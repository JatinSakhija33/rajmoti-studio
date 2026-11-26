import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import pages from "@/lib/search-pages.json";
import { searchPageHead } from "@/lib/seo";
import { directionsLink } from "@/lib/site";

export const Route = createFileRoute("/studio-services/$service")({
  loader: ({ params }) => {
    const service = pages.services.find((page) => page.slug === params.service);
    if (!service) throw notFound();
    return service;
  },
  head: ({ loaderData }) => loaderData ? searchPageHead(loaderData) : {},
  component: StudioServicePage,
});

function StudioServicePage() {
  const service = Route.useLoaderData();
  return <div className="editorial">
    <SiteNav />
    <main className="ed-wrap ed-section">
      <article className="max-w-3xl">
        <p className="ed-kicker">Rajmoti Studio · Jetpur, Gujarat</p>
        <h1>{service.heading}</h1>
        <p className="ed-copy">{service.description}</p>
        <section className="mt-8">
          <h2>{service.question}</h2>
          <p className="ed-copy">{service.answer}</p>
        </section>
        <div className="ed-actions mt-8">
          <Link to="/contact" search={{ session: service.enquiry }} className="ed-button">{service.button}</Link>
          <a href={directionsLink()} className="ed-text-button"><MapPin size={16} /> Get directions</a>
        </div>
      </article>
    </main>
    <SiteFooter />
  </div>;
}
