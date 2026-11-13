import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Instagram, Star } from "lucide-react";
import { googleProfileQuery } from "@/lib/queries";
import { STUDIO } from "@/lib/seo";
import type { CategorySeo } from "@/lib/seo";

/**
 * Quiet supporting content for a portfolio/service page: what is actually
 * photographed, real FAQs, and a small "explore more" trail. Kept short on
 * purpose — the photography stays the main content.
 */
export function CategorySeoSections({ seo }: { seo: CategorySeo }) {
  const { data: googleProfile } = useQuery(googleProfileQuery);

  return (
    <>
      {seo.covers.length > 0 && (
        <section className="mt-24 border-t border-onyx/10 pt-16">
          <h2 className="font-display text-3xl mb-8">What we photograph</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm text-muted-foreground">
            {seo.covers.map((c) => (
              <li key={c} className="border-l border-gold/50 pl-4 py-1">
                {c}
              </li>
            ))}
          </ul>
        </section>
      )}

      {seo.faqs.length > 0 && (
        <section className="mt-24 border-t border-onyx/10 pt-16 max-w-3xl">
          <h2 className="font-display text-3xl mb-8">Questions families ask</h2>
          <div className="divide-y divide-onyx/10 border-y border-onyx/10">
            {seo.faqs.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="cursor-pointer list-none flex items-start justify-between gap-6 font-medium">
                  <h3 className="text-base">{f.q}</h3>
                  <span aria-hidden className="text-gold transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      <section className="mt-20 flex flex-wrap gap-x-8 gap-y-3 text-sm">
        <a
          href={STUDIO.instagram}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 hover:text-gold transition-colors"
        >
          <Instagram className="size-4 text-gold" aria-hidden /> {seo.instagramLine}
        </a>
        {googleProfile && (
          <a
            href={googleProfile}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 hover:text-gold transition-colors"
          >
            <Star className="size-4 text-gold" aria-hidden /> See our work &amp; reviews on Google
          </a>
        )}
      </section>

      <nav aria-label="Explore more" className="mt-12 border-t border-onyx/10 pt-10">
        <h2 className="eyebrow text-gold mb-5">Explore more</h2>
        <ul className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
          {seo.related.map((r) => (
            <li key={r.slug}>
              <Link
                to="/portfolios/$category"
                params={{ category: r.slug }}
                className="border-b border-onyx/20 pb-0.5 hover:text-gold hover:border-gold transition-colors"
              >
                Explore our {r.label} portfolio
              </Link>
            </li>
          ))}
          <li>
            <Link to="/packages" className="border-b border-onyx/20 pb-0.5 hover:text-gold hover:border-gold transition-colors">
              Photography packages &amp; pricing
            </Link>
          </li>
          <li>
            <Link to="/contact" className="border-b border-onyx/20 pb-0.5 hover:text-gold hover:border-gold transition-colors">
              Contact Rajmoti Studio, Jetpur
            </Link>
          </li>
        </ul>
      </nav>
    </>
  );
}
