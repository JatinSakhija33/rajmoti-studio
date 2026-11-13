import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  categoryBySlugQuery,
  imagesByCategoryInfiniteQuery,
  lookupSlugRedirect,
  taxonomyCountsQuery,
} from "@/lib/queries";
import { PortfolioHero } from "@/components/portfolio-hero";
import { SubcategoryNav } from "@/components/subcategory-nav";
import { PortfolioGallery } from "@/components/portfolio-gallery";
import { SectionCta } from "@/components/section-cta";
import { absUrl, breadcrumbJsonLd } from "@/lib/seo";

export const Route = createFileRoute("/portfolios/$category/$subcategory")({
  head: ({ params, loaderData }: { params: { category: string; subcategory: string }; loaderData?: any }) => {
    const path = `/portfolios/${params.category}/${params.subcategory}`;
    const heading = loaderData ? `${loaderData.sub.name} — ${loaderData.cat.name}` : "Portfolio";
    const title = loaderData?.sub?.seo_title || `${heading} — Rajmoti Studio`;
    const desc =
      loaderData?.sub?.seo_description ||
      loaderData?.sub?.description ||
      `${heading} photography by Rajmoti Studio, Jetpur — see the work and check availability.`;
    const cover = loaderData?.sub?.cover_image_url;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { property: "og:url", content: absUrl(path) },
        { name: "twitter:card", content: "summary_large_image" },
        ...(cover
          ? [
              { property: "og:image", content: cover },
              { name: "twitter:image", content: cover },
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
              { name: loaderData?.cat?.name ?? params.category, path: `/portfolios/${params.category}` },
              { name: loaderData?.sub?.name ?? params.subcategory, path },
            ]),
          ),
        },
      ],
    };
  },
  loader: async ({ context, params }) => {
    const categorySlug = params.category;
    const cat = await context.queryClient.ensureQueryData(categoryBySlugQuery(categorySlug));
    if (!cat) {
      const next = await lookupSlugRedirect("category", categorySlug);
      if (!next) throw notFound();
      throw redirect({
        to: "/portfolios/$category/$subcategory",
        params: { category: next, subcategory: params.subcategory },
      });
    }
    const visible = (cat.subcategories ?? []).filter((s: any) => !s.hidden && !s.archived_at);
    const sub = visible.find((s: any) => s.slug === params.subcategory);
    if (!sub) {
      const next = await lookupSlugRedirect("subcategory", params.subcategory, categorySlug);
      if (next) {
        throw redirect({
          to: "/portfolios/$category/$subcategory",
          params: { category: categorySlug, subcategory: next },
        });
      }
      throw notFound();
    }
    await Promise.all([
      context.queryClient.ensureInfiniteQueryData(imagesByCategoryInfiniteQuery(cat.id, sub.id)),
      context.queryClient.ensureQueryData(taxonomyCountsQuery),
    ]);
    return { cat, sub };
  },
  component: SubcategoryRoute,
});

/** Remount per category/subcategory so stale photographs never flash. */
function SubcategoryRoute() {
  const { category, subcategory } = Route.useParams();
  return <SubcategoryPage key={`${category}/${subcategory}`} />;
}

function SubcategoryPage() {
  const params = Route.useParams();
  const { cat, sub } = Route.useLoaderData();
  const { data: counts } = useSuspenseQuery(taxonomyCountsQuery);
  const [shown, setShown] = useState(0);

  const subs = (cat.subcategories ?? [])
    .filter((s: any) => !s.hidden && !s.archived_at)
    .sort((a: any, b: any) => a.display_order - b.display_order);

  const wa = `Hello Rajmoti Studio, I'd like to know more about ${sub.name} (${cat.name}).`;
  const total = counts.bySubcategory[sub.id] ?? shown;

  return (
    <div>
      <PortfolioHero
        eyebrow={cat.name}
        title={sub.name}
        description={sub.description}
        coverUrl={sub.cover_image_url || cat.cover_image_url}
        meta={total ? `${total} photographs` : undefined}
        crumbs={[
          { label: "Portfolios", to: "/portfolios" },
          { label: cat.name, to: "/portfolios/$category", params: { category: params.category } },
          { label: sub.name },
        ]}
        whatsappMessage={wa}
      />

      <div className="container-page py-10 md:py-14">
        <SubcategoryNav
          categorySlug={params.category}
          subs={subs}
          active={sub.slug}
          counts={counts.bySubcategory}
        />

        <div className="pt-10 md:pt-14">
          <PortfolioGallery
            categoryId={cat.id}
            subcategoryId={sub.id}
            contextName={sub.name}
            categoryName={cat.name}
            subcategoryName={sub.name}
            whatsappMessage={wa}
            onCount={setShown}
          />
        </div>

        <div className="mt-20 border-t border-onyx/10 pt-10 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Looking for more? See every {cat.name.toLowerCase()} photograph.
          </p>
          <Link
            to="/portfolios/$category"
            params={{ category: params.category }}
            className="eyebrow border-b border-onyx/30 pb-1 hover:text-gold hover:border-gold transition-colors"
          >
            All {cat.name} work →
          </Link>
        </div>

        <SectionCta
          title={`Love these ${sub.name.toLowerCase()} frames?`}
          copy="Share your preferred dates and we'll come back with availability and pricing."
          whatsappMessage={wa}
          enquireLabel="Check availability"
        />

      </div>
    </div>
  );
}
