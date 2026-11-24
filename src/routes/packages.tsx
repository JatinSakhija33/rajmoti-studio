import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Clock3, MessageCircle } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { canonicalFor } from "@/lib/seo";
import { packagesQuery } from "@/lib/queries";
import { formatPrice, waMessage, whatsappLink } from "@/lib/site";
import { publishedPackages, type PublicPackage } from "@/lib/published-packages";

export const Route = createFileRoute("/packages")({
  head: () => ({
    meta: [{ title: "Photography packages & pricing in Jetpur — Rajmoti Studio" },
      { name: "description", content: "Explore Rajmoti Studio’s baby, maternity, family, wedding and cinematic reel packages in Jetpur." }],
    links: canonicalFor("/packages").links,
  }),
  component: Packages,
});

const primary = [
  { slug: "baby", title: "Baby photography", session: "Baby" },
  { slug: "maternity", title: "Maternity photography", session: "Maternity" },
  { slug: "family", title: "Family portraits", session: "Family" },
  { slug: "wedding", title: "Wedding photography", session: "Wedding" },
  { slug: "cinematic-reels", title: "Cinematic reels", session: "Cinematic reels" },
];

function Packages() {
  const { data } = useQuery(packagesQuery);
  const catalogue: PublicPackage[] = data?.length ? data : publishedPackages;
  const sections = new Map(primary.map((entry) => [entry.slug, { ...entry, items: [] as PublicPackage[] }]));
  for (const item of catalogue) {
    const category = item.categories ?? (item.slug.endsWith("-cinematic-reel")
      ? { slug: "cinematic-reels", name: "Cinematic reels" }
      : { slug: "other", name: "Other collections" });
    const section = sections.get(category.slug) ?? {
      slug: category.slug, title: category.name, session: category.name, items: [],
    };
    section.items.push(item);
    sections.set(category.slug, section);
  }
  const collections = Array.from(sections.values()).filter((section) => section.items.length > 0);

  return (
    <div className="editorial">
      <SiteNav />
      <main className="ed-wrap packages-page">
        <p className="ed-kicker">Photography sessions · Jetpur</p>
        <h1>Photography packages & pricing</h1>
        <p className="ed-copy">
          Compare what’s included, then share your dates with the studio. We’ll confirm availability and
          any details that depend on your session.
        </p>
        <nav aria-label="Jump to a package category" className="session-tabs package-category-nav">
          {collections.map(({ slug, title }) => <a key={slug} href={"#" + slug}>{title}</a>)}
        </nav>
        {collections.map(({ slug, title, session, items }) => (
          <section id={slug} key={slug} className="package-section" aria-labelledby={slug + "-title"}>
            <div className="package-section-heading">
              <h2 id={slug + "-title"}>{title}</h2>
              <p>{items.length} {items.length === 1 ? "package" : "packages"}</p>
            </div>
            <div className="package-grid">
              {items.map((item) => <PackageCard key={item.slug} item={item} session={session} />)}
            </div>
          </section>
        ))}
        <section className="wedding-collection">
          <h2>Need a custom session?</h2>
          <p>Tell us what you’re planning and we can discuss a package that fits.</p>
          <Link className="ed-button" to="/contact">
            Ask the studio <ArrowRight size={16} aria-hidden />
          </Link>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function PackageCard({ item, session }: { item: PublicPackage; session: string }) {
  const features = [...item.package_features].sort((a, b) => a.display_order - b.display_order);
  return (
    <article className="collection-card">
      <h3>{item.name.trim()}</h3>
      <strong className="collection-price">
        {typeof item.price === "number" && item.price > 0
          ? formatPrice(item.price, item.currency)
          : "Ask for a quotation"}
      </strong>
      {item.duration && <p className="package-duration"><Clock3 size={14} aria-hidden /> {item.duration}</p>}
      {item.description?.trim() && <p className="collection-subtitle">{item.description.trim()}</p>}
      {features.length > 0 && (
        <ul className="package-inclusions">
          {features.map(({ feature }, index) => <li key={index}>{feature}</li>)}
        </ul>
      )}
      <div className="package-card-actions">
        <Link className="ed-button outline" to="/contact" search={{ session, package: item.name.trim() }}>
          Check availability <ArrowRight size={16} aria-hidden />
        </Link>
        <a className="ed-text-button" href={whatsappLink(waMessage.package(item.name.trim()))}
          target="_blank" rel="noopener noreferrer">
          <MessageCircle size={15} aria-hidden /> Ask on WhatsApp
        </a>
      </div>
    </article>
  );
}
