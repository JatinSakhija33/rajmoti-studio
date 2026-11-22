import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { MobileCtaBar } from "@/components/mobile-cta-bar";
import { siteContentQuery } from "@/lib/queries";
import { absUrl, breadcrumbJsonLd } from "@/lib/seo";
import { directionsLink, SITE, telLink } from "@/lib/site";

const TITLE = "About Rajmoti Studio | Photography Studio in Jetpur";
const DESC =
  "Rajmoti Studio is a photography studio in Jetpur, Gujarat, photographing baby, maternity, family and wedding sessions for families from Jetpur, Rajkot and nearby areas.";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: absUrl("/about") },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: absUrl("/about") }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "About", path: "/about" },
          ]),
        ),
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(siteContentQuery),
  component: About,
});


function About() {
  const { data: siteContent } = useSuspenseQuery(siteContentQuery);
  const about = (siteContent.about ?? {}) as { eyebrow?: string; heading?: string; body?: string; image?: string };

  const eyebrow = about.eyebrow || "The Studio";
  const heading = about.heading || "A quiet practice, devoted to memory.";
  const body = about.body ||
    "Rajmoti Studio was founded on a single conviction — that a photograph, made with care, becomes an heirloom from the moment it is captured.\n\nWe work slowly. We listen first. We compose for light, for posture, for the unhurried instant between performance and presence. Every session is delivered as a considered edit, never a flood of files.\n\nToday the studio serves families, parents-to-be, and couples across India, photographing the milestones that quietly define a life.";
  const contact = (siteContent.contact ?? {}) as { address?: string; hours?: string; phone?: string };
  const address = contact.address?.trim() || SITE.location;
  const image = about.image;

  return (
    <div className="bg-cream text-onyx min-h-dvh">
      <SiteNav />
      <div className="pt-28 pb-24 container-page max-w-5xl">
        <div className={"grid gap-10 items-start mb-16 " + (image ? "md:grid-cols-2" : "max-w-2xl")}>
          <div>
            <p className="eyebrow text-gold mb-3">{eyebrow}</p>
            <h1 className="font-display text-5xl md:text-6xl mb-8 text-balance">{heading}</h1>
            <div className="space-y-5 text-muted-foreground leading-relaxed">
              {body.split(/\n\n+/).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              <p>
                The studio is based in Jetpur, Gujarat, and photographs families from Jetpur, Rajkot and surrounding areas.
              </p>
            </div>
          </div>
          {image && (
            <img src={image} alt="Rajmoti Studio" loading="lazy" decoding="async"
              className="aspect-[4/5] object-cover w-full" />
          )}
        </div>

        <section className="border-t border-onyx/10 pt-16 mb-16">
          <h2 className="font-display text-3xl mb-6">What we photograph</h2>
          <ul className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <li><Link to="/portfolios/$category" params={{ category: "baby" }} className="border-b border-onyx/20 pb-0.5 hover:text-gold hover:border-gold">Baby photography</Link></li>
            <li><Link to="/portfolios/$category" params={{ category: "maternity" }} className="border-b border-onyx/20 pb-0.5 hover:text-gold hover:border-gold">Maternity photography</Link></li>
            <li><Link to="/portfolios/$category" params={{ category: "family" }} className="border-b border-onyx/20 pb-0.5 hover:text-gold hover:border-gold">Family portraits</Link></li>
            <li><Link to="/portfolios/$category" params={{ category: "wedding" }} className="border-b border-onyx/20 pb-0.5 hover:text-gold hover:border-gold">Wedding photography</Link></li>
            <li><Link to="/packages" className="border-b border-onyx/20 pb-0.5 hover:text-gold hover:border-gold">Packages &amp; pricing</Link></li>
            <li><Link to="/contact" className="border-b border-onyx/20 pb-0.5 hover:text-gold hover:border-gold">Contact the studio</Link></li>
          </ul>
        </section>

        <section className="border-t border-onyx/10 py-10">
          <h2 className="font-display text-3xl mb-4">Visit the studio</h2>
          <p>{address}</p>
          {contact.hours?.trim() && <p className="mt-2 text-sm">{contact.hours}</p>}
          <div className="flex flex-wrap gap-5 mt-4 text-sm">
            <a className="underline" href={directionsLink(SITE.name + ", " + address)}>Get directions</a>
            <a className="underline" href={telLink(contact.phone?.trim() || undefined)}>Call the studio</a>
          </div>
          <h3 className="font-display text-2xl mt-7 mb-3">Ask about studio services</h3>
          <ul className="flex flex-wrap gap-x-5 gap-y-3 text-sm">
            {["Passport photos", "Photo restoration", "Memorial photos"].map((session) => (
              <li key={session}><Link className="underline" to="/contact" search={{ session }}>{session}</Link></li>
            ))}
          </ul>
        </section>
        <div className="border-t border-onyx/10 pt-12 text-center">
          <p className="font-display text-3xl italic max-w-3xl mx-auto text-balance mb-8">
            "We don't make pictures of moments. We make pictures of how moments felt."
          </p>
          <Link to="/contact" className="eyebrow border-b border-onyx/30 pb-1 hover:text-gold hover:border-gold">
            Begin your inquiry →
          </Link>
        </div>
      </div>
      <SiteFooter />
      <WhatsAppFloat />
      <MobileCtaBar />
    </div>
  );
}
