import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  categoryBySlugQuery,
  imagesByCategoryInfiniteQuery,
  lookupSlugRedirect,
  packagesQuery,
  taxonomyCountsQuery,
  testimonialsQuery,
} from "@/lib/queries";
import { PortfolioHero } from "@/components/portfolio-hero";
import { SubcategoryNav } from "@/components/subcategory-nav";
import { PortfolioGallery } from "@/components/portfolio-gallery";
import { SectionCta } from "@/components/section-cta";
import { ReelsCrossSell } from "@/components/reels/reels-cross-sell";
import { CategorySeoSections } from "@/components/category-seo-sections";
import { formatPrice, waMessage } from "@/lib/site";
import { photographySession } from "@/lib/photography-sessions";
import { variantUrl } from "@/lib/images";
import {
  absUrl,
  breadcrumbJsonLd,
  categorySeo,
  faqJsonLd,
  serviceJsonLd,
} from "@/lib/seo";

export const Route = createFileRoute("/portfolios/$category/")({
  head: ({ params, loaderData }: { params: { category: string }; loaderData?: any }) => {
    const name = loaderData?.name ?? loaderData?.session?.label ?? "Portfolio";
    const seo = categorySeo(params.category, name, loaderData?.description ?? loaderData?.session?.copy);
    const title = loaderData?.seo_title || seo.title;
    const desc = loaderData?.seo_description || seo.description;
    const path = `/portfolios/${params.category}`;
    const image = loaderData?.cover_image_url || loaderData?.ogImage;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { property: "og:url", content: absUrl(path) },
        { name: "twitter:card", content: "summary_large_image" },
        ...(image
          ? [
              { property: "og:image", content: image },
              { name: "twitter:image", content: image },
            ]
          : []),
      ],
      links: [{ rel: "canonical", href: absUrl(path) }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Portfolios", path: "/portfolios" },
              { name: name, path },
            ]),
          ),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify(serviceJsonLd({ name: seo.h1, description: desc, path })),
        },
        ...(seo.faqs.length > 0
          ? [
              {
                type: "application/ld+json",
                children: JSON.stringify(faqJsonLd(seo.faqs)),
              },
            ]
          : []),
      ],
    };
  },
  loader: async ({ context, params }) => {
    const session = photographySession(params.category);
    let cat;
    try {
      cat = await context.queryClient.ensureQueryData(categoryBySlugQuery(params.category));
    } catch (error) {
      if (session) return { session };
      throw error;
    }
    if (!cat) {
      // A CMS rename takes precedence over the built-in session page.
      const next = await lookupSlugRedirect("category", params.category);
      if (next) throw redirect({ to: "/portfolios/$category", params: { category: next } });
      if (session) return { session };
      throw notFound();
    }
    const [images] = await Promise.all([
      context.queryClient.ensureInfiniteQueryData(imagesByCategoryInfiniteQuery(cat.id)),
      context.queryClient.ensureQueryData(packagesQuery),
      context.queryClient.ensureQueryData(testimonialsQuery),
      context.queryClient.ensureQueryData(taxonomyCountsQuery),
    ]);
    // A real photograph from this category makes the WhatsApp/social preview useful.
    const first = (images as any)?.pages?.[0]?.[0];
    const ogImage = first ? variantUrl(first, "large") : null;
    return { ...cat, ogImage };
  },

  component: CategoryRoute,
});

/** Remount per category so a new heading is never shown over the old gallery. */
function CategoryRoute() {
  const { category } = Route.useParams();
  const data = Route.useLoaderData();
  if (data.session) return <SessionGuide session={data.session} />;
  return <CategoryPage key={category} cat={data} />;
}

function SessionGuide({ session }: { session: NonNullable<ReturnType<typeof photographySession>> }) {
  return (
    <>
      <PortfolioHero
        eyebrow="Photography in Jetpur"
        title={session.label + " photography"}
        description={session.copy}
        crumbs={[{ label: "Portfolios", to: "/portfolios" }, { label: session.label }]}
        session={session.slug}
        whatsappMessage={waMessage.category(session.label + " photography")}
      />
      <section className="container-page grid items-center gap-7 py-8 sm:grid-cols-2 md:gap-12">
        <figure className="max-w-sm">
          <img src={session.cover} alt="" width="720" height="900"
            className="aspect-[4/5] w-full object-cover" decoding="async" />
          <figcaption className="mt-2 text-xs text-muted-foreground">Illustrative session inspiration</figcaption>
        </figure>
        <div>
          <h2 className="font-display text-3xl mb-3">{session.title}</h2>
          <p className="max-w-md text-muted-foreground mb-6">
            Ask the studio to share available photographs from this type of session and help plan yours.
          </p>
          <Link to="/contact" search={{ session: session.slug }}
            className="inline-block bg-onyx px-5 py-3 text-sm text-cream">
            Request examples and availability
          </Link>
        </div>
      </section>
    </>
  );
}

type CategoryData = Exclude<ReturnType<typeof Route.useLoaderData>, { session: unknown }>;

function CategoryPage({ cat }: { cat: CategoryData }) {
  const params = Route.useParams();
  const { data: allPackages } = useSuspenseQuery(packagesQuery);
  const { data: testimonials } = useSuspenseQuery(testimonialsQuery);
  const { data: counts } = useSuspenseQuery(taxonomyCountsQuery);
  const [shown, setShown] = useState(0);

  const packages = useMemo(
    () => allPackages.filter((p: any) => p.categories?.slug === params.category).slice(0, 3),
    [allPackages, params.category],
  );
  const testimonial = testimonials[0];

  const subs = (cat.subcategories ?? [])
    .filter((s: any) => !s.hidden && !s.archived_at)
    .sort((a: any, b: any) => a.display_order - b.display_order);

  const total = counts.byCategory[cat.id] ?? shown;
  const seo = categorySeo(params.category, cat.name, cat.description);
  const showSessionTypes = subs.length > 1 ||
    (subs.length === 1 && (total === 0 || counts.bySubcategory[subs[0].id] !== total));

  return (
    <div>
      <PortfolioHero
        eyebrow="Portfolio"
        title={seo.h1}
        description={seo.intro}
        coverUrl={cat.cover_image_url}

        meta={total ? `${total} photographs${subs.length ? ` · ${subs.length} session types` : ""}` : undefined}
        crumbs={[{ label: "Portfolios", to: "/portfolios" }, { label: cat.name }]}
        session={cat.slug}
        whatsappMessage={waMessage.category(cat.name)}
      />

      <div className="container-page py-6 md:py-9">
        {showSessionTypes && <SubcategoryNav
          categorySlug={params.category}
          subs={subs}
          active={null}
          counts={counts.bySubcategory}
        />}

        <div className={showSessionTypes ? "pt-6 md:pt-8" : undefined}>
          <PortfolioGallery
            categoryId={cat.id}
            contextName={cat.name}
            categoryName={cat.name}
            whatsappMessage={waMessage.category(cat.name)}
            onCount={setShown}
          />
        </div>

        {testimonial && (
          <figure className="mt-24 max-w-3xl mx-auto text-center border-t border-onyx/10 pt-16">
            <blockquote className="font-display text-2xl md:text-3xl italic leading-relaxed">
              “{testimonial.content}”
            </blockquote>
            <figcaption className="eyebrow text-muted-foreground mt-5">
              {testimonial.author}
              {testimonial.role ? ` — ${testimonial.role}` : ""}
            </figcaption>
          </figure>
        )}

        {packages.length > 0 && (
          <section className="mt-24">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-onyx/10 pb-4 mb-8">
              <div>
                <p className="eyebrow text-gold mb-2">Pricing</p>
                <h2 className="font-display text-3xl">{cat.name} collections</h2>
              </div>
              <Link to="/packages" className="eyebrow text-muted-foreground hover:text-gold transition-colors">
                All collections →
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {packages.map((p: any) => (
                <article key={p.id} className="border border-onyx/12 p-8 flex flex-col hover:border-gold/60 transition-colors">
                  <h3 className="font-display text-2xl mb-2">{p.name}</h3>
                  {p.description && <p className="text-sm text-muted-foreground mb-6">{p.description}</p>}
                  <p className="font-display text-3xl mb-6 mt-auto">{formatPrice(p.price)}</p>
                  <Link
                    to="/contact"
                    search={{ session: cat.slug, package: p.name }}
                    className="eyebrow px-5 py-2.5 bg-onyx text-cream text-center hover:bg-gold hover:text-onyx transition-colors"
                  >
                    Enquire about this package
                  </Link>
                </article>
              ))}
            </div>
          </section>
        )}

        <CategorySeoSections seo={seo} />

        <ReelsCrossSell categoryId={cat.id} categoryName={cat.name} />




        <SectionCta
          title={`Planning a ${cat.name.toLowerCase().replace(" photography", "").replace(" portraits", "")} session?`}
          copy="Tell us your dates and we'll share availability, pricing and what to expect — usually within a few hours."
          whatsappMessage={waMessage.category(cat.name)}
          enquireLabel="Check availability"
        />
      </div>
    </div>
  );
}
