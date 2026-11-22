import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { canonicalFor } from "@/lib/seo";
import { packagesQuery } from "@/lib/queries";

export const Route = createFileRoute("/packages")({
  head: () => ({
    meta: [{ title: "Photography session collections — Rajmoti Studio" }],
    links: canonicalFor("/packages").links,
  }),
  component: Packages,
});
const services = ["Baby", "Maternity", "Family", "Wedding"] as const;

function Packages() {
  const [service, setService] = useState<(typeof services)[number]>("Baby");
  const { data = [], isPending } = useQuery(packagesQuery);
  const packages = data.filter(
    (item) =>
      item.categories?.name?.toLowerCase() === service.toLowerCase() ||
      item.categories?.slug === service.toLowerCase(),
  );
  return (
    <div className="editorial">
      <SiteNav />
      <main className="ed-wrap packages-page">
        <p className="ed-kicker">Photography sessions · Jetpur</p>
        <h1>
          Plan a session
          <br />
          <em>that feels like you.</em>
        </h1>
        <p className="ed-copy">
          Choose a session type to see current collections or discuss a plan with the studio.
        </p>
        <div className="session-tabs" role="group" aria-label="Photography category">
          {services.map((item) => (
            <button
              key={item}
              aria-pressed={service === item}
              className={service === item ? "active" : ""}
              onClick={() => setService(item)}
            >
              {item}
            </button>
          ))}
        </div>
        {isPending ? (
          <p role="status">Loading current collections…</p>
        ) : packages.length ? (
          <div className="package-grid">
            {packages.map((item) => (
              <article className="collection-card" key={item.id}>
                <p className="ed-kicker">{service}</p>
                <h2>{item.name}</h2>
                {!!item.description && <p className="collection-subtitle">{item.description}</p>}
                <strong className="collection-price">
                  {typeof item.price === "number" && item.price > 0
                    ? `₹${item.price.toLocaleString("en-IN")}`
                    : "Ask for a quotation"}
                </strong>
                {!!item.package_features?.length && (
                  <ul>
                    {item.package_features.map((feature) => (
                      <li key={feature.id}>{feature.feature}</li>
                    ))}
                  </ul>
                )}
                <Link
                  className="ed-button outline"
                  to="/contact"
                  search={{ session: service, package: item.name }}
                >
                  Discuss this collection <ArrowRight size={16} />
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="wedding-collection">
            <h2>Tell us about your {service.toLowerCase()} session.</h2>
            <p>
              The studio can help you choose coverage, photographs and keepsakes and confirm an
              individual quotation.
            </p>
            <Link className="ed-button" to="/contact" search={{ session: service }}>
              Discuss a session <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
