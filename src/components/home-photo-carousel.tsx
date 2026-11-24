import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import { homeHeroSlides } from "@/lib/homepage-gallery";
import { publishedPhotoLibraryQuery } from "@/lib/published-portfolio";
import { usePrefersReducedMotion } from "@/lib/motion";

type HeroContent = {
  images?: unknown;
  fallback_image?: unknown;
  slideshow?: boolean;
  slideshow_seconds?: number;
};

function isPhotoUrl(value: unknown): value is string {
  return typeof value === "string" &&
    (/^\/(?![\/\\]|demo\/)/.test(value) || value.startsWith("https://"));
}

export function HomePhotoCarousel({
  children,
  content,
}: {
  children: ReactNode;
  content?: HeroContent;
}) {
  const photos = Array.isArray(content?.images) ? [...new Set(content.images.filter(isPhotoUrl))] : [];
  if (!photos.length && isPhotoUrl(content?.fallback_image)) photos.push(content.fallback_image);

  const library = useQuery({
    ...publishedPhotoLibraryQuery,
    enabled: photos.some((url) => url.startsWith("/portfolio/")),
  });
  const slides = photos.length ? photos.map((url) => {
    const curated = homeHeroSlides.find((photo) => photo.src === url || photo.medium === url);
    if (curated) return curated;
    const published = library.data?.find((photo) =>
      Object.values(photo.variants).some((variant) => variant.url === url));
    return {
      id: url,
      src: published?.variants.large.url ?? url,
      medium: published?.variants.medium.url ?? url,
      category: published?.categories.name ?? "Studio photography",
      alt: published?.alt_text || published?.title || "Rajmoti Studio photograph",
      portrait: !!published && published.height > published.width,
    };
  }) : homeHeroSlides;
  const seconds = content?.slideshow_seconds ?? 10;
  const interval = Number.isFinite(seconds) && seconds >= 2 && seconds <= 30 ? seconds * 1_000 : 10_000;
  return (
    <PhotoCarousel key={JSON.stringify(photos)} slides={slides} interval={interval}
      autoplay={content?.slideshow !== false}>
      {children}
    </PhotoCarousel>
  );
}

type CarouselSlide = {
  id: string;
  src: string;
  medium: string;
  category: string;
  alt: string;
  portrait: boolean;
};

const changeIndex = (current: number, offset: number, count: number) =>
  (current + offset + count) % count;

function PhotoCarousel({ slides, interval, autoplay, children }: {
  slides: readonly CarouselSlide[];
  interval: number;
  autoplay: boolean;
  children: ReactNode;
}) {
  const totalSlides = slides.length;
  const [requested, setRequested] = useState(0);
  const [visible, setVisible] = useState({ current: 0, previous: -1 });
  const [loaded, setLoaded] = useState<number[]>([]);
  const [paused, setPaused] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [focused, setFocused] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (loaded.includes(requested) && requested !== visible.current) {
      setVisible({ current: requested, previous: visible.current });
    }
  }, [requested, loaded, visible.current]);

  useEffect(() => {
    if (!autoplay || totalSlides < 2 || paused || hovering || focused || reducedMotion ||
        requested !== visible.current) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setRequested((current) => changeIndex(current, 1, totalSlides));
    }, interval);
    return () => window.clearInterval(timer);
  }, [autoplay, totalSlides, interval, paused, hovering, focused, reducedMotion, requested, visible.current]);

  const slide = slides[visible.current];
  // Keep the visible image until the selected one has loaded. Only warm one future slide.
  const rendered = new Set([visible.current, visible.previous, requested]);
  if (totalSlides > 1 && autoplay && loaded.includes(visible.current) && !paused && !reducedMotion) {
    rendered.add(changeIndex(visible.current, 1, totalSlides));
  }

  return (
    <section
      className="home-carousel home-carousel-stage"
      aria-roledescription="carousel"
      aria-label="Rajmoti Studio featured photography"
      onPointerEnter={(event) => { if (event.pointerType === "mouse") setHovering(true); }}
      onPointerLeave={() => setHovering(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
      }}
    >
      {slides.map((item, index) => {
        if (!rendered.has(index)) return null;
        const current = index === visible.current;
        return (
          <div
            key={item.id}
            className={"home-carousel-slide" + (item.portrait ? " is-portrait" : "") +
              (current ? " is-active" : index === visible.previous ? " is-previous" : "")}
            aria-hidden={!current}
          >
            <picture>
              <source media="(max-width: 640px)" srcSet={item.medium} />
              <img
                src={item.src}
                width={item.portrait ? 1280 : 1920}
                height={item.portrait ? 1920 : 1280}
                alt={current ? item.alt : ""}
                fetchPriority={index === 0 ? "high" : index === requested ? "auto" : "low"}
                decoding="async"
                onLoad={() => setLoaded((ready) => ready.includes(index) ? ready : [...ready, index])}
                onError={() => setRequested((target) => target === index ? visible.current : target)}
              />
            </picture>
          </div>
        );
      })}
      <div className="home-carousel-shade" aria-hidden="true" />
      <div className="ed-wrap home-carousel-layout">
        <div className="home-carousel-copy">{children}</div>
        <div className="home-carousel-bar">
          <p className="home-carousel-credit">Rajmoti Studio · {slide.category}</p>
          {totalSlides > 1 && <div className="home-carousel-controls" aria-label="Slideshow controls">
            <button type="button" onClick={() => setRequested((index) => changeIndex(index, -1, totalSlides))}
              aria-label="Previous photograph">
              <ArrowLeft size={17} aria-hidden />
            </button>
            <span className="home-carousel-counter" aria-hidden="true">
              {String(visible.current + 1).padStart(2, "0")} / {String(totalSlides).padStart(2, "0")}
            </span>
            <button type="button" onClick={() => setRequested((index) => changeIndex(index, 1, totalSlides))}
              aria-label="Next photograph">
              <ArrowRight size={17} aria-hidden />
            </button>
            {autoplay && !reducedMotion && (
              <button type="button" onClick={() => setPaused((current) => !current)}
                aria-label={paused ? "Resume automatic slideshow" : "Pause automatic slideshow"}>
                {paused ? <Play size={16} aria-hidden /> : <Pause size={16} aria-hidden />}
              </button>
            )}
          </div>}
        </div>
      </div>
    </section>
  );
}
