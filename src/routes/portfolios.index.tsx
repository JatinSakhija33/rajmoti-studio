import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { categoriesQuery, siteContentQuery, taxonomyCountsQuery } from "@/lib/queries";
import { PortfolioHero } from "@/components/portfolio-hero";
import { PhotographyChapters } from "@/components/photography-chapters";
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
  const defaults = (siteContent?.category_defaults ?? {}) as Record<string, string>;
  const cards = categories
    .filter((category) => !photographySessions.some((session) => category.slug === session.slug))
    .map((category) => ({
      ...category,
      cover: category.cover_image_url || defaults[category.slug],
    }));
  const { data: counts } = useQuery({ ...taxonomyCountsQuery, enabled: cards.length > 0 });

  return (
    <div>
      <PortfolioHero
        eyebrow="Portfolios"
        title="A studied body of work."
        description="Baby, maternity, family and wedding sessions photographed at Rajmoti Studio in Jetpur, Gujarat."
        crumbs={[{ label: "Home", to: "/" }, { label: "Portfolios" }]}
        whatsappMessage="Hello Rajmoti Studio, I've been looking through your portfolios and would like to plan a session."
      />

      <div className="editorial">
        <PhotographyChapters />
      </div>
      <div className="container-page pb-7 md:pb-12">
        {cards.length > 0 && <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          {cards.map((card, index) => {
            const photoCount = card.id ? counts?.byCategory[card.id] : undefined;
            return (
              <Link
                key={card.slug}
                to="/portfolios/$category"
                params={{ category: card.slug }}
                className={`group relative flex flex-col justify-end overflow-hidden p-8 md:p-10 focus-visible:outline-2 focus-visible:outline-gold ${
                  card.cover ? "aspect-[4/5] bg-onyx text-cream" : "min-h-56 border border-onyx/15"
                }`}
              >
                {card.cover && (
                  <>
                    {card.slug === "family" && (
                      <img
                        src={card.cover}
                        alt=""
                        aria-hidden="true"
                        loading={index < 2 ? "eager" : "lazy"}
                        className="absolute inset-0 size-full object-cover blur-2xl scale-110 opacity-60"
                      />
                    )}
                    <img
                      src={card.cover}
                      alt=""
                      loading={index < 2 ? "eager" : "lazy"}
                      className={"absolute inset-0 size-full transition-transform duration-[1200ms] group-hover:scale-105 motion-reduce:transform-none " +
                        (card.slug === "family" ? "object-contain" : "object-cover")}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-onyx/85 via-onyx/25 to-transparent" />
                  </>
                )}
                <div className="relative">
                  {photoCount ? <p className="eyebrow opacity-70 mb-2">{photoCount} photographs</p> : null}
                  <h2 className="font-display text-4xl mb-3">{card.name}</h2>
                  {card.description && <p className="max-w-md text-sm opacity-80 mb-5">{card.description}</p>}
                  <span className="eyebrow border-b border-current pb-1 group-hover:text-gold transition-colors">
                    {card.cover || photoCount ? "View the work" : "View session details"} →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>}

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
