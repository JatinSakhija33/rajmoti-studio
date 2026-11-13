import { Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { aspectValue, publicReelTitle, type Reel } from "@/lib/reels";

/**
 * A reel tile: poster only (never a video), fixed aspect box, quiet overlay.
 * Clicking opens the immersive viewer; the title also deep-links to the
 * stable public /reel/<short_id> page.
 */
export function ReelCard({ reel, onOpen }: { reel: Reel; onOpen?: () => void }) {
  const title = publicReelTitle(reel);
  return (
    <figure className="group">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Play ${title}`}
        className="relative block w-full overflow-hidden bg-onyx focus-visible:outline-2 focus-visible:outline-gold"
        style={{ aspectRatio: aspectValue(reel.aspect_ratio) }}
      >
        {reel.poster_url ? (
          <img
            src={reel.poster_url}
            alt={title}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <span className="absolute inset-0 bg-onyx" />
        )}
        <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-onyx/70 via-transparent to-transparent" />
        <span className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <span className="size-14 grid place-items-center rounded-full bg-cream/20 backdrop-blur text-cream">
            <Play className="size-5" />
          </span>
        </span>
      </button>
      <figcaption className="mt-3 flex items-baseline justify-between gap-4">
        <Link
          to="/reel/$shortId"
          params={{ shortId: reel.short_id }}
          className="font-display text-lg hover:text-gold transition-colors"
        >
          {title}
        </Link>
        {reel.categories?.name && (
          <span className="eyebrow text-muted-foreground shrink-0">{reel.categories.name}</span>
        )}
      </figcaption>
    </figure>
  );
}
