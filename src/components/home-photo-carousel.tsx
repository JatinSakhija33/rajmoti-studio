import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import { homeHeroSlides } from "@/lib/homepage-gallery";
import { usePrefersReducedMotion } from "@/lib/motion";

// Match the original studio slideshow’s ten-second pace.
const rotationMs = 10_000;
const totalSlides = homeHeroSlides.length;
const changeIndex = (current: number, offset: number) => (current + offset + totalSlides) % totalSlides;

export function HomePhotoCarousel({ children }: { children: ReactNode }) {
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
    if (paused || hovering || focused || reducedMotion || requested !== visible.current) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setRequested((current) => changeIndex(current, 1));
    }, rotationMs);
    return () => window.clearInterval(timer);
  }, [paused, hovering, focused, reducedMotion, requested, visible.current]);

  const slide = homeHeroSlides[visible.current];
  // Keep the visible image until the selected one has loaded. Only warm one future slide.
  const rendered = new Set([visible.current, visible.previous, requested]);
  if (loaded.includes(visible.current) && !paused && !reducedMotion) {
    rendered.add(changeIndex(visible.current, 1));
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
      {homeHeroSlides.map((item, index) => {
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
          <div className="home-carousel-controls" aria-label="Slideshow controls">
            <button type="button" onClick={() => setRequested((index) => changeIndex(index, -1))}
              aria-label="Previous photograph">
              <ArrowLeft size={17} aria-hidden />
            </button>
            <span className="home-carousel-counter" aria-hidden="true">
              {String(visible.current + 1).padStart(2, "0")} / {String(totalSlides).padStart(2, "0")}
            </span>
            <button type="button" onClick={() => setRequested((index) => changeIndex(index, 1))}
              aria-label="Next photograph">
              <ArrowRight size={17} aria-hidden />
            </button>
            {!reducedMotion && (
              <button type="button" onClick={() => setPaused((current) => !current)}
                aria-label={paused ? "Resume automatic slideshow" : "Pause automatic slideshow"}>
                {paused ? <Play size={16} aria-hidden /> : <Pause size={16} aria-hidden />}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
