import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { MobileCtaBar } from "@/components/mobile-cta-bar";
import { siteContentQuery } from "@/lib/queries";
import { absUrl, breadcrumbJsonLd } from "@/lib/seo";
import placeholder from "@/assets/image-placeholder.svg";

const TITLE = "About Rajmoti Studio | Photography Studio in Jetpur";
const DESC =
  "Rajmoti Studio is a photography studio based in Jetpur, Gujarat (PIN 360370), specializing in baby, maternity, family and wedding photography, photo framing and personalized gifts.";

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
    "Rajmoti Studio was founded on a single conviction — that a photograph, made with care, becomes an heirloom from the moment it is captured.\n\nWe work attentively with every client. Every session is delivered as a considered edit, never a flood of uninspected files.\n\nBased in Jetpur, Gujarat, the studio photographs family milestones and crafts personalized photo keepsakes.";
  const image = about.image || placeholder;

  return (
    <div className="bg-cream text-onyx min-h-dvh">
      <SiteNav />
      <div className="pt-28 pb-24 container-page max-w-5xl">
        <div className="grid md:grid-cols-2 gap-16 items-start mb-24">
          <div>
            <p className="eyebrow text-gold mb-3">{eyebrow}</p>
            <h1 className="font-display text-5xl md:text-6xl mb-8 text-balance">{heading}</h1>
            <div className="space-y-5 text-muted-foreground leading-relaxed">
              {body.split(/\n\n+/).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              <p>
                The studio is based in Jetpur, Gujarat (PIN 360370). For our exact location, visiting hours or enquiries, please contact us on WhatsApp or use our verified business listing.
              </p>
            </div>
          </div>
          <img
            src={image}
            alt="Inside Rajmoti Studio, the photography studio in Jetpur, Gujarat"
            loading="lazy"
            className="aspect-[4/5] object-cover w-full"
          />
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

        <div className="border-t border-onyx/10 pt-16 text-center">
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
