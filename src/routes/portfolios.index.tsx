import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { categoriesQuery, siteContentQuery, taxonomyCountsQuery } from "@/lib/queries";
import { PortfolioHero } from "@/components/portfolio-hero";
import { SectionCta } from "@/components/section-cta";
import { absUrl, breadcrumbJsonLd } from "@/lib/seo";
import placeholder from "@/assets/image-placeholder.svg";

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

  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(categoriesQuery),
      context.queryClient.ensureQueryData(siteContentQuery),
      context.queryClient.ensureQueryData(taxonomyCountsQuery),
    ]),
  component: PortfoliosIndex,
});

function PortfoliosIndex() {
  const { data: categories } = useSuspenseQuery(categoriesQuery);
  const { data: siteContent } = useSuspenseQuery(siteContentQuery);
  const { data: counts } = useSuspenseQuery(taxonomyCountsQuery);
  const defaults = (siteContent.category_defaults ?? {}) as Record<string, string>;

  return (
    <div>
      <PortfolioHero
        eyebrow="Portfolios"
        title="A studied body of work."
        description="Baby, maternity, family and wedding sessions photographed at Rajmoti Studio in Jetpur, Gujarat."
        crumbs={[{ label: "Home", to: "/" }, { label: "Portfolios" }]}
        whatsappMessage="Hello Rajmoti Studio, I've been looking through your portfolios and would like to plan a session."
      />

      <div className="container-page py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          {categories.map((c, i) => (
            <Link
              key={c.id}
              to="/portfolios/$category"
              params={{ category: c.slug }}
              className={`group relative aspect-[4/5] overflow-hidden ${i % 2 === 1 ? "md:mt-16" : ""}`}
            >
              <img
                src={c.cover_image_url || defaults[c.slug] || placeholder}
                alt={`${c.name} photography by Rajmoti Studio`}
                loading={i < 2 ? "eager" : "lazy"}
                className="absolute inset-0 size-full object-cover transition-transform duration-[1200ms] group-hover:scale-105 motion-reduce:transform-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-onyx/85 via-onyx/25 to-transparent" />
              <div className="absolute inset-0 p-8 md:p-10 flex flex-col justify-end text-cream">
                <p className="eyebrow opacity-70 mb-2">
                  {String(i + 1).padStart(2, "0")}
                  {counts.byCategory[c.id] ? ` — ${counts.byCategory[c.id]} photographs` : ""}
                </p>
                <h2 className="font-display text-4xl mb-3">{c.name}</h2>
                {c.description && <p className="max-w-md text-sm opacity-80 mb-5">{c.description}</p>}
                <span className="eyebrow border-b border-cream/40 pb-1 self-start group-hover:border-gold group-hover:text-gold transition-colors">
                  View the work →
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
