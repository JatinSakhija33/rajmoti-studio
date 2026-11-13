import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { aspectValue } from "@/lib/reels";
import { usePrefersReducedMotion } from "@/lib/motion";

type Props = {
  posterUrl?: string | null;
  videoUrl?: string | null;
  ratio?: string | null;
  title: string;
  /** Autoplay muted once visible — used for the hero and the open viewer. */
  autoPlay?: boolean;
  /** Start unmuted (viewer only; browsers block autoplay with sound). */
  className?: string;
  rounded?: boolean;
};

/**
 * Poster-first cinematic player.
 *
 * 1. Renders the optimised poster inside a fixed aspect box (no CLS).
 * 2. Attaches the video source only when the element nears the viewport.
 * 3. Fades from poster to video; if autoplay is refused the poster stays with
 *    a quiet "Watch film" affordance.
 * 4. Pauses when scrolled out of view so bandwidth is never wasted.
 */
export function ReelPlayer({
  posterUrl,
  videoUrl,
  ratio,
  title,
  autoPlay = true,
  className = "",
  rounded = false,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [nearViewport, setNearViewport] = useState(false);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [failed, setFailed] = useState(false);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) setNearViewport(true);
        const v = videoRef.current;
        if (v && !entry.isIntersecting && !v.paused) {
          v.pause();
          setPlaying(false);
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Attempt a muted autoplay once the source is attached.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !nearViewport || !autoPlay || reduced || !videoUrl) return;
    v.muted = true;
    v.play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false));
  }, [nearViewport, autoPlay, reduced, videoUrl]);

  const toggle = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play()
        .then(() => setPlaying(true))
        .catch(() => setFailed(true));
    } else {
      v.pause();
      setPlaying(false);
    }
  }, []);

  const showVideo = Boolean(videoUrl) && nearViewport && ready && !failed;

  return (
    <div
      ref={wrapRef}
      className={`relative overflow-hidden bg-onyx ${rounded ? "rounded-sm" : ""} ${className}`}
      style={{ aspectRatio: aspectValue(ratio) }}
    >
      {posterUrl && (
        <img
          src={posterUrl}
          alt={title}
          loading="lazy"
          decoding="async"
          className={`absolute inset-0 size-full object-cover transition-opacity duration-700 ${
            showVideo && playing ? "opacity-0" : "opacity-100"
          }`}
        />
      )}

      {videoUrl && nearViewport && (
        <video
          ref={videoRef}
          src={videoUrl}
          poster={posterUrl ?? undefined}
          playsInline
          loop
          muted={muted}
          preload="metadata"
          aria-label={title}
          onLoadedData={() => setReady(true)}
          onError={() => setFailed(true)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          className={`absolute inset-0 size-full object-cover transition-opacity duration-700 ${
            showVideo ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      {/* Quiet cinematic vignette so overlaid text always stays legible. */}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-onyx/60 via-transparent to-onyx/20" />

      {videoUrl ? (
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? `Pause ${title}` : `Play ${title}`}
            className="size-10 grid place-items-center bg-cream/15 backdrop-blur text-cream hover:bg-cream/30 transition-colors focus-visible:outline-2 focus-visible:outline-gold"
          >
            {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
          </button>
          <button
            type="button"
            onClick={() => {
              const v = videoRef.current;
              if (v) v.muted = !v.muted;
              setMuted((m) => !m);
            }}
            aria-label={muted ? "Unmute film" : "Mute film"}
            className="size-10 grid place-items-center bg-cream/15 backdrop-blur text-cream hover:bg-cream/30 transition-colors focus-visible:outline-2 focus-visible:outline-gold"
          >
            {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </button>
          <button
            type="button"
            onClick={() => videoRef.current?.requestFullscreen?.()}
            aria-label="Play full screen"
            className="size-10 grid place-items-center bg-cream/15 backdrop-blur text-cream hover:bg-cream/30 transition-colors focus-visible:outline-2 focus-visible:outline-gold"
          >
            <Maximize2 className="size-4" />
          </button>
        </div>
      ) : null}

      {videoUrl && !playing && (
        <button
          type="button"
          onClick={toggle}
          className="absolute inset-0 grid place-items-center text-cream focus-visible:outline-2 focus-visible:outline-gold"
          aria-label={`Watch ${title}`}
        >
          <span className="flex items-center gap-3 px-6 py-3 bg-onyx/40 backdrop-blur-sm text-[10px] uppercase tracking-[0.3em]">
            <Play className="size-4" aria-hidden /> Watch film
          </span>
        </button>
      )}
    </div>
  );
}
