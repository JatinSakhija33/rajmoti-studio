import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { MessageCircle, Phone } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { MobileCtaBar, MobileCtaSpacer } from "@/components/mobile-cta-bar";
import { ReelPlayer } from "@/components/reels/reel-player";
import { ReelCard } from "@/components/reels/reel-card";
import { publicReelTitle, publishedReelsQuery, reelByShortIdQuery } from "@/lib/reels";
import { formatPrice, telLink, waMessage, whatsappLink } from "@/lib/site";
import { absUrl } from "@/lib/seo";

export const Route = createFileRoute("/reel/$shortId")({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(reelByShortIdQuery(params.shortId)),
      context.queryClient.ensureQueryData(publishedReelsQuery),
    ]),
  head: ({ loaderData, params }) => {
    const reel = loaderData?.[0];
    if (!reel) {
      return {
        meta: [
          { title: "Film unavailable | Rajmoti Studio" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const title = `${publicReelTitle(reel)} — Cinematic Reel | Rajmoti Studio, Jetpur`;
    const desc =
      reel.description?.slice(0, 155) ??
      `A cinematic reel filmed and edited by Rajmoti Studio in Jetpur. Studio reels from ₹3,500.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "video.other" },
        { property: "og:url", content: absUrl(`/reel/${params.shortId}`) },
        { name: "twitter:card", content: "summary_large_image" },
        ...(reel.poster_url
          ? [
              { property: "og:image", content: reel.poster_url },
              { name: "twitter:image", content: reel.poster_url },
            ]
          : []),
      ],
      links: [{ rel: "canonical", href: absUrl(`/reel/${params.shortId}`) }],
    };
  },
  component: ReelPage,
});

function ReelPage() {
  const { shortId } = Route.useParams();
  const { data: reel } = useSuspenseQuery(reelByShortIdQuery(shortId));
  const { data: all } = useSuspenseQuery(publishedReelsQuery);

  if (!reel) {
    return (
      <div className="bg-cream text-onyx min-h-dvh">
        <SiteNav />
        <div className="pt-40 pb-32 container-page text-center">
          <h1 className="font-display text-4xl mb-4">This film isn’t available</h1>
          <p className="text-muted-foreground mb-8">It may have been unpublished.</p>
          <Link to="/cinematic-reels" className="eyebrow border-b border-onyx/30 pb-1 hover:text-gold">
            See all cinematic reels →
          </Link>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const title = publicReelTitle(reel);
  const related = all
    .filter((r) => r.id !== reel.id && (!reel.category_id || r.category_id === reel.category_id))
    .slice(0, 3);
  const price = reel.packages?.price != null ? formatPrice(reel.packages.price, reel.packages.currency) : null;
  const wa = whatsappLink(
    waMessage.reel({
      title,
      category: reel.categories?.name,
      reelUrl: absUrl(`/reel/${reel.short_id}`),
      packageName: reel.packages?.name,
      price,
    }),
  );

  return (
    <div className="bg-onyx text-cream min-h-dvh">
      <SiteNav />
      <main className="pt-24 md:pt-28 pb-20">
        <section className="container-page grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-16 items-center">
          <ReelPlayer
            posterUrl={reel.poster_url}
            videoUrl={reel.video_url}
            ratio={reel.aspect_ratio}
            title={title}
            className="w-full max-h-[76vh]"
          />
          <div>
            {reel.categories?.name && <p className="eyebrow text-gold mb-3">{reel.categories.name}</p>}
            <h1 className="font-display text-4xl md:text-5xl leading-tight">{title}</h1>
            {reel.description && <p className="mt-5 opacity-75 leading-relaxed">{reel.description}</p>}
            {reel.packages?.name && (
              <p className="mt-6 eyebrow opacity-70">
                {reel.packages.name}
                {price ? ` — ${price}` : ""}
              </p>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={wa}
                target="_blank"
                rel="noreferrer"
                className="px-7 py-4 bg-cream text-onyx text-[10px] uppercase tracking-[0.25em] font-semibold hover:bg-gold hover:text-cream transition-colors flex items-center gap-2"
              >
                <MessageCircle className="size-4" aria-hidden /> I want a reel like this
              </a>
              <a
                href={telLink()}
                className="px-7 py-4 border border-cream/25 text-[10px] uppercase tracking-[0.25em] font-semibold hover:border-gold hover:text-gold transition-colors flex items-center gap-2"
              >
                <Phone className="size-4" aria-hidden /> Call the studio
              </a>
            </div>
          </div>
        </section>

        {related.length > 0 && (
          <section className="container-page mt-24">
            <h2 className="font-display text-2xl md:text-3xl mb-8">More like this</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {related.map((r) => (
                <ReelCard key={r.id} reel={r} />
              ))}
            </div>
          </section>
        )}

        {reel.categories?.slug && (
          <section className="container-page mt-20 border-t border-cream/10 pt-10 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow text-gold mb-2">Photography</p>
              <h2 className="font-display text-2xl">{reel.categories.name} portfolio</h2>
            </div>
            <Link
              to="/portfolios/$category"
              params={{ category: reel.categories.slug }}
              className="px-6 py-3 border border-cream/25 text-[10px] uppercase tracking-[0.25em] font-semibold hover:border-gold hover:text-gold transition-colors"
            >
              View portfolio
            </Link>
          </section>
        )}
      </main>
      <SiteFooter />
      <MobileCtaSpacer />
      <MobileCtaBar message={waMessage.cinematic()} />
    </div>
  );
}
