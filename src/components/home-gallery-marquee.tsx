import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { homeHeroSlides, interleaveGalleryPhotos } from "@/lib/homepage-gallery";
import { loadPublishedPhotos } from "@/lib/published-portfolio";

type StripPhoto = {
  id: string;
  shortId: string;
  alt: string;
  thumbnail: string;
  category: string;
};

const seed: StripPhoto[] = homeHeroSlides.map((slide) => ({
  id: slide.id,
  shortId: slide.id,
  alt: slide.alt,
  thumbnail: slide.medium,
  category: slide.slug,
}));

const categoryLabel: Record<string, string> = {
  baby: "Baby & milestones",
  maternity: "Maternity",
  family: "Family",
};

/**
 * Virtualized marquee: steps through every published image in a seamless loop.
 * Only 14 optimized thumbnail elements are present; never insert 770 images.
 */
export function HomeGalleryMarquee() {
  const [photos, setPhotos] = useState<StripPhoto[]>(seed);
  const [cursor, setCursor] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let active = true;
    loadPublishedPhotos().then((published) => {
      if (!active) return;
      const mixed = interleaveGalleryPhotos(published).map((photo) => ({
        id: photo.id,
        shortId: photo.short_id,
        alt: photo.alt_text || photo.title || "Rajmoti Studio photograph",
        thumbnail: photo.thumbnail_url || photo.image_url,
        category: photo.categories.slug,
      }));
      if (mixed.length > 0) {
        setPhotos(mixed);
        setCursor(0);
      }
    }).catch(() => {
      // The curated fallback stays on screen if the manifest chunk cannot load.
    });
    return () => { active = false; };
  }, []);

  const visible = useMemo(
    () => Array.from({ length: 14 }, (_, index) => photos[(cursor + index) % photos.length]),
    [cursor, photos],
  );
  const move = (distance: number) => {
    setCursor((current) => (current + distance + photos.length) % photos.length);
  };

  return (
    <section className="home-gallery-section" id="studio-gallery" aria-labelledby="home-gallery-heading">
      <div className="ed-wrap home-gallery-heading">
        <div>
          <p className="ed-kicker">In the frame · Rajmoti Studio</p>
          <h2 id="home-gallery-heading">Real stories. <em>Beautifully remembered.</em></h2>
          <p className="ed-copy">
            A moving glimpse of our baby, maternity and family portraits.
            Every photograph is part of our studio's published collection.
          </p>
        </div>
        <div className="home-gallery-heading-actions">
          <span className="home-gallery-total">
            {photos.length === 385 ? "385 published photographs" : "Studio-selected photographs"}
          </span>
          <Link to="/portfolios" className="ed-text-button">
            Explore every collection <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </div>
      <div
        className="home-gallery-viewport"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
        }}
      >
        <div
          className="home-gallery-track"
          style={{ animationPlayState: paused ? "paused" : "running" }}
          onAnimationIteration={() => move(1)}
        >
          {visible.map((photo, index) => (
            <Link
              key={photo.id + "-" + index}
              to="/photo/$shortId"
              params={{ shortId: photo.shortId }}
              className="home-gallery-tile"
              aria-label={"View " + (categoryLabel[photo.category] || "studio") + " photograph"}
            >
              <img
                src={photo.thumbnail}
                alt={photo.alt}
                loading="lazy"
                decoding="async"
                width="480"
                height="360"
              />
              <span>{categoryLabel[photo.category] || "Rajmoti Studio"}</span>
            </Link>
          ))}
        </div>
      </div>
      <div className="ed-wrap home-gallery-bottom">
        <span>Slow moments, made to stay.</span>
        <div className="home-gallery-manual-controls" role="group" aria-label="Browse studio photographs">
          <button type="button" onClick={() => move(-1)} aria-label="Previous studio photograph">
            <ArrowLeft size={17} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => move(1)} aria-label="Next studio photograph">
            <ArrowRight size={17} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
