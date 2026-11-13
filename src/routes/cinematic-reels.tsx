import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Check, MessageCircle, Phone } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { MobileCtaBar, MobileCtaSpacer } from "@/components/mobile-cta-bar";
import { ReelPlayer } from "@/components/reels/reel-player";
import { ReelCard } from "@/components/reels/reel-card";
import { ReelViewer } from "@/components/reels/reel-viewer";
import {
  cinematicPackagesQuery,
  isStudioPackage,
  publicReelTitle,
  publishedReelsQuery,
  type Reel,
} from "@/lib/reels";
import { testimonialsQuery, googleProfileQuery } from "@/lib/queries";
import { formatPrice, telLink, waMessage, whatsappLink } from "@/lib/site";
import { absUrl, breadcrumbJsonLd, serviceJsonLd } from "@/lib/seo";

const TITLE = "Cinematic Reels & Video Shoots in Jetpur | Rajmoti Studio";
const DESC =
  "Cinematic reels by Rajmoti Studio, Jetpur — directed, filmed and edited to music. Studio cinematic reel from ₹3,500, outdoor cinematic reel ₹6,500. Book on WhatsApp.";

export const Route = createFileRoute("/cinematic-reels")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: absUrl("/cinematic-reels") },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: absUrl("/cinematic-reels") }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          serviceJsonLd({
            name: "Cinematic Reels & Video Shoots",
            description: DESC,
            path: "/cinematic-reels",
          }),
        ),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Cinematic Reels", path: "/cinematic-reels" },
          ]),
        ),
      },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(publishedReelsQuery),
      context.queryClient.ensureQueryData(cinematicPackagesQuery),
      context.queryClient.ensureQueryData(testimonialsQuery),
      context.queryClient.ensureQueryData(googleProfileQuery),
    ]),
  component: CinematicReelsPage,
});

const HOW_IT_WORKS = [
  { n: "01", t: "Choose your style", c: "Studio or outdoor." },
  { n: "02", t: "Plan your shoot", c: "We discuss look, mood and concept together." },
  { n: "03", t: "We film", c: "Full direction on set — movement, expression, timing." },
  { n: "04", t: "We edit", c: "Music, pacing, colour and finishing." },
  { n: "05", t: "Your reel", c: "You receive the finished cinematic film, ready to share." },
];

const VALUE_STACK = [
  { t: "Directed", c: "You never have to figure out what to do with your hands." },
  { t: "Cinematic", c: "Intentional framing, movement and lighting." },
  { t: "Edited", c: "Music, pacing and colour brought together." },
  { t: "Ready to share", c: "Delivered in a social-ready format." },
];

function CinematicReelsPage() {
  const { data: reels } = useSuspenseQuery(publishedReelsQuery);
  const { data: packages } = useSuspenseQuery(cinematicPackagesQuery);
  const { data: testimonials } = useSuspenseQuery(testimonialsQuery);
  const { data: googleUrl } = useSuspenseQuery(googleProfileQuery);

  const [filter, setFilter] = useState<string>("all");
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const hero = useMemo(() => reels.find((r) => r.featured) ?? reels[0] ?? null, [reels]);
  const showcase = useMemo(() => reels.filter((r) => r.id !== hero?.id), [reels, hero]);

  const filters = useMemo(() => {
    const seen = new Map<string, string>();
    for (const r of showcase) if (r.categories?.slug) seen.set(r.categories.slug, r.categories.name);
    return [...seen.entries()];
  }, [showcase]);

  const visible = useMemo(
    () => (filter === "all" ? showcase : showcase.filter((r) => r.categories?.slug === filter)).slice(0, 6),
    [showcase, filter],
  );

  const studio = packages.find((p) => isStudioPackage(p.slug));
  const outdoor = packages.find((p) => !isStudioPackage(p.slug));
  const fromPrice = packages.length ? formatPrice(Math.min(...packages.map((p) => p.price ?? 0)), "INR") : null;

  const storyTypes = useMemo(() => {
    const seen = new Map<string, { name: string; slug: string; reel: Reel }>();
    for (const r of reels) if (r.categories?.slug && !seen.has(r.categories.slug))
      seen.set(r.categories.slug, { name: r.categories.name, slug: r.categories.slug, reel: r });
    return [...seen.values()];
  }, [reels]);

  return (
    <div className="bg-onyx text-cream min-h-dvh">
      <SiteNav overlay />

      {/* 01 — CINEMATIC HERO */}
      <header className="relative">
        <div className="container-page pt-28 md:pt-36 pb-10 text-center">
          <p className="eyebrow text-gold mb-5">Cinematic Reels</p>
          <h1 className="font-display text-5xl md:text-7xl leading-[1.05]">
            Your moment.
            <br />
            <span className="italic opacity-90">In motion.</span>
          </h1>
          <p className="mt-6 max-w-xl mx-auto opacity-70">
            Not just a reel. A memory you can watch again and again — filmed and edited at Rajmoti Studio, Jetpur.
          </p>
        </div>

        <div className="container-page">
          {hero ? (
            <ReelPlayer
              posterUrl={hero.poster_url}
              videoUrl={hero.video_url}
              ratio={hero.aspect_ratio}
              title={publicReelTitle(hero)}
              className="w-full max-h-[70vh] mx-auto"
            />
          ) : (
            <div
              className="w-full bg-gradient-to-b from-onyx to-ink border border-cream/10 grid place-items-center"
              style={{ aspectRatio: "16 / 9" }}
            >
              <p className="eyebrow opacity-50">Films coming soon</p>
            </div>
          )}
        </div>

        <div className="container-page mt-8 flex flex-col md:flex-row items-center justify-center gap-4">
          {fromPrice && <p className="eyebrow opacity-70">From {fromPrice}</p>}
          <a
            href={whatsappLink(waMessage.cinematic())}
            target="_blank"
            rel="noreferrer"
            className="px-8 py-4 bg-cream text-onyx text-[10px] uppercase tracking-[0.25em] font-semibold hover:bg-gold hover:text-cream transition-colors"
          >
            Book your reel
          </a>
        </div>
      </header>

      {/* 02 — EMOTIONAL INTRODUCTION */}
      <section className="container-page py-24 md:py-32 grid md:grid-cols-2 gap-12 items-start">
        <div>
          <h2 className="font-display text-4xl md:text-5xl leading-tight">More than a reel.</h2>
          <p className="mt-5 opacity-70 leading-relaxed max-w-md">
            Photographs preserve a moment. A film brings it back to life — the way you moved, laughed and looked at
            each other.
          </p>
        </div>
        <ul className="space-y-4 md:pt-3">
          {["Movement", "Expressions", "Atmosphere", "Music", "Your story"].map((x) => (
            <li key={x} className="flex items-center gap-4 border-b border-cream/10 pb-4 eyebrow">
              <span className="text-gold">—</span>
              {x}
            </li>
          ))}
        </ul>
      </section>

      {/* 04 — WHAT KIND OF STORY ARE YOU CREATING? */}
      {storyTypes.length > 0 && (
        <section className="container-page pb-24">
          <h2 className="font-display text-3xl md:text-4xl mb-10">What kind of story are you creating?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {storyTypes.map((s) => (
              <Link
                key={s.slug}
                to="/portfolios/$category"
                params={{ category: s.slug }}
                className="group block"
              >
                <div className="relative overflow-hidden bg-ink" style={{ aspectRatio: "4 / 5" }}>
                  {s.reel.poster_url && (
                    <img
                      src={s.reel.poster_url}
                      alt={s.name}
                      loading="lazy"
                      className="absolute inset-0 size-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-105"
                    />
                  )}
                  <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-onyx/80 to-transparent" />
                  <span className="absolute bottom-5 left-5 font-display text-2xl">{s.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 05/15/16 — CINEMATIC PACKAGES */}
      <section className="bg-cream text-onyx py-24 md:py-32">
        <div className="container-page">
          <p className="eyebrow text-gold mb-3">The experiences</p>
          <h2 className="font-display text-4xl md:text-5xl mb-12">Choose your cinematic experience</h2>

          <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
            {packages.map((p) => {
              const price = formatPrice(p.price, p.currency);
              return (
                <article key={p.id} className="border-t border-onyx/15 pt-8">
                  <p className="eyebrow text-gold mb-3">{isStudioPackage(p.slug) ? "In studio" : "On location"}</p>
                  <h3 className="font-display text-3xl md:text-4xl">{p.name}</h3>
                  <p className="mt-3 font-display text-2xl text-gold">{price}</p>
                  {p.description && <p className="mt-4 text-muted-foreground leading-relaxed">{p.description}</p>}
                  {p.duration && <p className="mt-3 eyebrow text-muted-foreground">{p.duration}</p>}
                  {(p.package_features ?? []).length > 0 && (
                    <ul className="mt-5 space-y-2">
                      {(p.package_features ?? []).map((f) => (
                        <li key={f.id} className="flex gap-3 text-sm">
                          <Check className="size-4 text-gold shrink-0 mt-0.5" aria-hidden />
                          {f.label}
                        </li>
                      ))}
                    </ul>
                  )}
                  <a
                    href={whatsappLink(waMessage.reelPackage({ packageName: p.name, price }))}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-8 inline-flex px-7 py-4 bg-onyx text-cream text-[10px] uppercase tracking-[0.25em] font-semibold hover:bg-gold transition-colors"
                  >
                    {isStudioPackage(p.slug) ? "Book this reel" : "Book outdoor reel"}
                  </a>
                </article>
              );
            })}
          </div>

          {/* 17 — WHICH ONE IS FOR ME? */}
          {studio && outdoor && (
            <div className="mt-20 grid md:grid-cols-2 gap-12 border-t border-onyx/10 pt-12">
              <div>
                <h3 className="font-display text-2xl mb-4">{studio.name} is best for</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>Controlled studio lighting</li>
                  <li>A clean, timeless cinematic look</li>
                  <li>A focused session, indoors</li>
                </ul>
              </div>
              <div>
                <h3 className="font-display text-2xl mb-4">{outdoor.name} is best for</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>Natural surroundings and light</li>
                  <li>Movement and location storytelling</li>
                  <li>A larger visual environment</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 07 — SEE THE WORK */}
      {showcase.length > 0 && (
        <section className="container-page py-24 md:py-32">
          <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
            <h2 className="font-display text-4xl md:text-5xl">See the work</h2>
            {filters.length > 1 && (
              <div className="flex flex-wrap gap-4 eyebrow">
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className={filter === "all" ? "text-gold" : "opacity-60 hover:opacity-100"}
                >
                  All
                </button>
                {filters.map(([slug, name]) => (
                  <button
                    key={slug}
                    type="button"
                    onClick={() => setFilter(slug)}
                    className={filter === slug ? "text-gold" : "opacity-60 hover:opacity-100"}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {visible.map((r) => (
              <ReelCard
                key={r.id}
                reel={r}
                onOpen={() => setViewerIndex(showcase.findIndex((x) => x.id === r.id))}
              />
            ))}
          </div>
        </section>
      )}

      {/* 26/27 — REASSURANCE + VALUE */}
      <section className="bg-ink py-24 md:py-32">
        <div className="container-page grid md:grid-cols-2 gap-16">
          <div>
            <h2 className="font-display text-3xl md:text-4xl leading-tight">
              Never done a cinematic shoot before?
            </h2>
            <p className="mt-5 opacity-70 leading-relaxed">
              You don’t need to know what to do. We guide movement, expressions, positioning and timing throughout the
              shoot — most of our clients have never been filmed before.
            </p>
          </div>
          <dl className="grid sm:grid-cols-2 gap-x-10 gap-y-8">
            {VALUE_STACK.map((v) => (
              <div key={v.t}>
                <dt className="eyebrow text-gold mb-2">{v.t}</dt>
                <dd className="text-sm opacity-70 leading-relaxed">{v.c}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* 28 — HOW IT WORKS */}
      <section className="container-page py-24 md:py-32">
        <h2 className="font-display text-4xl md:text-5xl mb-12">How it works</h2>
        <ol className="grid md:grid-cols-5 gap-8">
          {HOW_IT_WORKS.map((s) => (
            <li key={s.n} className="border-t border-cream/15 pt-5">
              <p className="font-display text-gold text-xl mb-2">{s.n}</p>
              <p className="eyebrow mb-2">{s.t}</p>
              <p className="text-sm opacity-60 leading-relaxed">{s.c}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 11 — SOCIAL PROOF (only real testimonials) */}
      {testimonials.length > 0 && (
        <section className="container-page pb-24 md:pb-32">
          <div className="grid md:grid-cols-3 gap-10">
            {testimonials.slice(0, 3).map((t) => (
              <figure key={t.id} className="border-t border-cream/15 pt-6">
                <blockquote className="font-display text-xl leading-relaxed">“{t.content}”</blockquote>
                <figcaption className="mt-4 eyebrow opacity-60">{t.author}</figcaption>
              </figure>
            ))}
          </div>
          {googleUrl && (
            <div className="mt-12 flex flex-wrap items-center gap-4 eyebrow">
              <span className="opacity-60">See more of our work</span>
              <a href={googleUrl} target="_blank" rel="noreferrer" className="hover:text-gold border-b border-cream/25 pb-1">
                Google
              </a>
              <Link to="/portfolios" className="hover:text-gold border-b border-cream/25 pb-1">
                Portfolio
              </Link>
            </div>
          )}
        </section>
      )}

      {/* 35 — EMOTIONAL CLOSING */}
      <section className="relative">
        {hero?.poster_url && (
          <img
            src={hero.poster_url}
            alt=""
            aria-hidden
            loading="lazy"
            className="absolute inset-0 size-full object-cover opacity-25"
          />
        )}
        <div className="relative container-page py-28 md:py-40 text-center">
          <h2 className="font-display text-3xl md:text-5xl leading-tight max-w-3xl mx-auto">
            Photographs let you remember a moment.
            <br />
            <span className="italic">Films let you feel it again.</span>
          </h2>
          <p className="mt-6 opacity-70">Your expressions. Your movement. Your people. Your story.</p>
        </div>
      </section>

      {/* 38 — CROSS-SELL */}
      <section className="container-page pb-24 border-t border-cream/10 pt-12 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow text-gold mb-2">Love the video?</p>
          <h2 className="font-display text-2xl md:text-3xl">Capture the photographs too.</h2>
        </div>
        <Link
          to="/portfolios"
          className="px-6 py-3 border border-cream/25 text-[10px] uppercase tracking-[0.25em] font-semibold hover:border-gold hover:text-gold transition-colors"
        >
          Explore photography
        </Link>
      </section>

      {/* 40 — FINAL CTA */}
      <section className="bg-cream text-onyx py-24 md:py-32">
        <div className="container-page text-center">
          <h2 className="font-display text-4xl md:text-5xl">Ready to see your story in motion?</h2>
          <p className="mt-4 text-muted-foreground">Let’s create a reel you’ll want to watch again.</p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a
              href={whatsappLink(waMessage.cinematic())}
              target="_blank"
              rel="noreferrer"
              className="px-8 py-4 bg-onyx text-cream text-[10px] uppercase tracking-[0.25em] font-semibold hover:bg-gold transition-colors flex items-center gap-2"
            >
              <MessageCircle className="size-4" aria-hidden /> WhatsApp Rajmoti
            </a>
            <a
              href={telLink()}
              className="px-8 py-4 border border-onyx/20 text-[10px] uppercase tracking-[0.25em] font-semibold hover:border-gold hover:text-gold transition-colors flex items-center gap-2"
            >
              <Phone className="size-4" aria-hidden /> Call Rajmoti
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
      <MobileCtaSpacer />
      <MobileCtaBar message={waMessage.cinematic()} />

      {viewerIndex !== null && (
        <ReelViewer
          reels={showcase}
          index={viewerIndex}
          onIndex={setViewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </div>
  );
}
