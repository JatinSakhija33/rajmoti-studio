import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import { homeHeroSlides } from "@/lib/homepage-gallery";

/** Curated real Rajmoti photos; motion is optional and never alters source images. */
export function HomePhotoCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setActive((current) => (current + 1) % homeHeroSlides.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [active, paused, reducedMotion]);

  const slide = homeHeroSlides[active];
  return (
    <figure
      className="home-hero-image home-carousel"
      aria-roledescription="carousel"
      aria-label="Rajmoti Studio selected photography"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
      }}
    >
      <div className="home-carousel-stage">
        {homeHeroSlides.map((item, index) => (
          <div
            key={item.id}
            className={"home-carousel-slide" + (item.portrait ? " is-portrait" : "") +
              (index === active ? " is-active" : "")}
            aria-hidden={index !== active}
          >
            <div
              className="home-carousel-ambient"
              style={{ backgroundImage: "url('" + item.medium + "')" }}
              aria-hidden="true"
            />
            <img
              src={item.src}
              width={item.portrait ? 1280 : 1920}
              height={item.portrait ? 1920 : 1280}
              alt={index === active ? item.alt : ""}
              loading={index === 0 ? "eager" : "lazy"}
              fetchPriority={index === 0 ? "high" : "auto"}
              decoding="async"
            />
          </div>
        ))}
        <div className="home-carousel-shade" aria-hidden="true" />
        <div className="home-carousel-caption" aria-live="off">
          <span className="home-carousel-eyebrow">{slide.eyebrow}</span>
          <span className="home-carousel-headline">{slide.headline}</span>
        </div>
        <div className="home-carousel-controls" aria-label="Slideshow controls">
          <button
            type="button"
            onClick={() => setActive((current) =>
              (current - 1 + homeHeroSlides.length) % homeHeroSlides.length)}
            aria-label="Previous photograph"
          >
            <ArrowLeft size={16} aria-hidden="true" />
          </button>
          <span className="home-carousel-counter" aria-hidden="true">
            {String(active + 1).padStart(2, "0")} / {String(homeHeroSlides.length).padStart(2, "0")}
          </span>
          <button
            type="button"
            onClick={() => setActive((current) => (current + 1) % homeHeroSlides.length)}
            aria-label="Next photograph"
          >
            <ArrowRight size={16} aria-hidden="true" />
          </button>
          {!reducedMotion && (
            <button
              type="button"
              onClick={() => setPaused((current) => !current)}
              aria-label={paused ? "Resume automatic slideshow" : "Pause automatic slideshow"}
              aria-pressed={paused}
            >
              {paused ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}
            </button>
          )}
        </div>
      </div>
      <figcaption className="home-carousel-credit">
        Rajmoti Studio · {slide.category} · Original studio work
      </figcaption>
      <div className="home-carousel-dots" role="group" aria-label="Choose a featured photograph">
        {homeHeroSlides.map((item, index) => (
          <button
            type="button"
            key={item.id}
            className={index === active ? "is-active" : ""}
            aria-label={"Show photograph " + (index + 1) + ": " + item.category}
            aria-current={index === active ? "true" : undefined}
            onClick={() => setActive(index)}
          />
        ))}
      </div>
    </figure>
  );
}
