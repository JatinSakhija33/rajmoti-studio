import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { categoriesQuery, siteContentQuery, taxonomyCountsQuery } from "@/lib/queries";
import { PortfolioHero } from "@/components/portfolio-hero";
import { SectionCta } from "@/components/section-cta";
import { absUrl, breadcrumbJsonLd } from "@/lib/seo";
import { photographySessions } from "@/lib/photography-sessions";

const TITLE = "Photography Portfolios in Jetpur | Rajmoti Studio";
const DESC =
  "Browse Rajmoti Studio's photography portfolios — baby, maternity, family and wedding sessions photographed in Jetpur, Gujarat.";

export const Route = createFileRoute("/portfolios/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: absUrl("/portfolios") },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: absUrl("/portfolios") }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Portfolios", path: "/portfolios" },
          ]),
        ),
      },
    ],
  }),

  component: PortfoliosIndex,
});

function PortfoliosIndex() {
  const { data: categories = [] } = useQuery(categoriesQuery);
  const { data: siteContent } = useQuery(siteContentQuery);
  const { data: counts } = useQuery(taxonomyCountsQuery);
  const defaults = (siteContent?.category_defaults ?? {}) as Record<string, string>;

  const cards = photographySessions.map((session) => {
    const category = categories.find((item) => item.slug === session.slug);
    const cover = category?.cover_image_url || defaults[session.slug];
    return {
      slug: session.slug,
      name: category?.name ?? session.label,
      description: category?.description || session.copy,
      cover: cover || session.cover,
      illustrative: !cover,
      count: category ? counts?.byCategory[category.id] : undefined,
    };
  });
  const otherCards = categories.filter((category) => !cards.some(({ slug }) => slug === category.slug))
    .map((category) => ({
      slug: category.slug,
      name: category.name,
      description: category.description,
      cover: category.cover_image_url || defaults[category.slug],
      illustrative: false,
      count: counts?.byCategory[category.id],
    }));

  return (
    <div>
      <PortfolioHero
        eyebrow="Portfolios"
        title="A studied body of work."
        description="Baby, maternity, family and wedding sessions photographed at Rajmoti Studio in Jetpur, Gujarat."
        crumbs={[{ label: "Home", to: "/" }, { label: "Portfolios" }]}
        whatsappMessage="Hello Rajmoti Studio, I've been looking through your portfolios and would like to plan a session."
      />

      <div className="container-page py-7 md:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8">
          {[...cards, ...otherCards].map((card, index) => (
            <Link
              key={card.slug}
              to="/portfolios/$category"
              params={{ category: card.slug }}
              className="group relative flex min-h-72 aspect-[4/5] flex-col justify-end overflow-hidden bg-onyx text-cream focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
            >
              {card.cover && (
                <img
                  src={card.cover}
                  alt=""
                  loading={index < 2 ? "eager" : "lazy"}
                  decoding="async"
                  className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transform-none"
                />
              )}
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-onyx via-onyx/50 to-transparent" />
              <div className="relative p-6 md:p-10">
                {card.illustrative && <p className="eyebrow text-cream mb-2">Session inspiration</p>}
                {!!card.count && <p className="eyebrow text-cream mb-2">{card.count} photographs</p>}
                <h2 className="font-display text-4xl mb-3">{card.name}</h2>
                {card.description && <p className="max-w-md text-sm mb-5">{card.description}</p>}
                <span className="eyebrow border-b border-cream/40 pb-1 group-hover:border-gold group-hover:text-gold">
                  Explore {card.name.toLowerCase()} photography →
                </span>
              </div>
            </Link>
          ))}
        </div>

        <SectionCta
          title="Not sure which session fits your family?"
          copy="Tell us the occasion and we'll suggest the right setting, timing and collection — usually within a few hours."
          whatsappMessage="Hello Rajmoti Studio, could you help me choose the right session for my family?"
          enquireLabel="Ask the studio"
        />
      </div>
    </div>
  );
}
