import { useEffect } from "react";
import { ChevronLeft, ChevronRight, MessageCircle, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { publicReelTitle, type Reel } from "@/lib/reels";
import { ReelPlayer } from "@/components/reels/reel-player";
import { waMessage, whatsappLink } from "@/lib/site";
import { absUrl } from "@/lib/seo";

type Props = {
  reels: Reel[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
};

/** Immersive, dark cinematic viewer. Escape closes, arrows move. */
export function ReelViewer({ reels, index, onIndex, onClose }: Props) {
  const reel = reels[index];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && index < reels.length - 1) onIndex(index + 1);
      if (e.key === "ArrowLeft" && index > 0) onIndex(index - 1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, reels.length, onClose, onIndex]);

  // Warm the neighbouring posters only — never a second video.
  useEffect(() => {
    for (const i of [index - 1, index + 1]) {
      const url = reels[i]?.poster_url;
      if (url) {
        const img = new Image();
        img.src = url;
      }
    }
  }, [index, reels]);

  if (!reel) return null;
  const title = publicReelTitle(reel);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[60] bg-onyx/97 backdrop-blur-xl text-cream flex flex-col animate-in fade-in duration-300"
    >
      <div className="flex items-center justify-between px-4 md:px-8 h-16 shrink-0">
        <div className="min-w-0">
          <p className="font-display text-lg truncate">{title}</p>
          {reel.categories?.name && <p className="eyebrow opacity-60">{reel.categories.name}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close film"
          className="size-11 grid place-items-center hover:text-gold focus-visible:outline-2 focus-visible:outline-gold"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="flex-1 min-h-0 flex items-center justify-center gap-4 px-3 md:px-8 pb-4">
        {reels.length > 1 && (
          <button
            type="button"
            onClick={() => onIndex(Math.max(0, index - 1))}
            disabled={index === 0}
            aria-label="Previous film"
            className="hidden md:grid size-11 place-items-center disabled:opacity-25 hover:text-gold"
          >
            <ChevronLeft className="size-6" />
          </button>
        )}
        <div className="h-full max-h-full flex items-center justify-center">
          <ReelPlayer
            key={reel.id}
            posterUrl={reel.poster_url}
            videoUrl={reel.video_url}
            ratio={reel.aspect_ratio}
            title={title}
            className="max-h-[70vh] h-[70vh] w-auto max-w-full"
          />
        </div>
        {reels.length > 1 && (
          <button
            type="button"
            onClick={() => onIndex(Math.min(reels.length - 1, index + 1))}
            disabled={index === reels.length - 1}
            aria-label="Next film"
            className="hidden md:grid size-11 place-items-center disabled:opacity-25 hover:text-gold"
          >
            <ChevronRight className="size-6" />
          </button>
        )}
      </div>

      <div className="shrink-0 px-4 md:px-8 pb-6 flex flex-wrap items-center justify-center gap-3">
        <a
          href={whatsappLink(
            waMessage.reel({
              title,
              category: reel.categories?.name,
              reelUrl: absUrl(`/reel/${reel.short_id}`),
              packageName: reel.packages?.name,
            }),
          )}
          target="_blank"
          rel="noreferrer"
          className="px-7 py-3.5 bg-cream text-onyx text-[10px] uppercase tracking-[0.25em] font-semibold hover:bg-gold hover:text-cream transition-colors flex items-center gap-2"
        >
          <MessageCircle className="size-4" aria-hidden /> I want a reel like this
        </a>
        <Link
          to="/reel/$shortId"
          params={{ shortId: reel.short_id }}
          className="px-7 py-3.5 border border-cream/30 text-[10px] uppercase tracking-[0.25em] font-semibold hover:border-gold hover:text-gold transition-colors"
        >
          Open film page
        </Link>
      </div>
    </div>
  );
}
