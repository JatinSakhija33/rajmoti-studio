import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { aspectValue } from "@/lib/reels";
import { usePrefersReducedMotion } from "@/lib/motion";
import { prefersLightMedia } from "./media-preferences";

type Props = {
  posterUrl?: string | null;
  videoUrl?: string | null;
  ratio?: string | null;
  title: string;
  /** Autoplay muted once visible — used for the hero and the open viewer. */
  autoPlay?: boolean;
  className?: string;
  rounded?: boolean;
};

/**
 * Poster-first cinematic player.
 *
 * 1. Renders the optimised poster inside a fixed aspect box (no CLS).
 * 2. Attaches video on play or when eligible for visible autoplay.
 * 3. Fades from poster to video; if autoplay is refused the poster stays with
 *    a quiet "Watch film" affordance.
 * 4. Pauses playback when scrolled out of view.
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
  const [inViewport, setInViewport] = useState(false);
  const userPaused = useRef(false);
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
        setInViewport(entry.isIntersecting);
        const v = videoRef.current;
        if (v && !entry.isIntersecting && !v.paused) {
          v.pause();
          setPlaying(false);
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Attempt a muted autoplay once the source is attached.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !inViewport || !autoPlay || reduced || !videoUrl ||
        prefersLightMedia() || userPaused.current || document.hidden) return;
    if (!v.getAttribute("src")) v.src = videoUrl;
    v.play().catch(() => setPlaying(false));
  }, [inViewport, autoPlay, reduced, videoUrl]);

  useEffect(() => {
    const pauseHidden = () => {
      if (document.hidden) videoRef.current?.pause();
    };
    document.addEventListener("visibilitychange", pauseHidden);
    return () => document.removeEventListener("visibilitychange", pauseHidden);
  }, []);

  const toggle = useCallback(() => {
    const v = videoRef.current;
    if (!v || !videoUrl) return;
    if (v.paused) {
      userPaused.current = false;
      if (!v.getAttribute("src")) v.src = videoUrl;
      else if (v.error) v.load();
      setFailed(false);
      v.play().catch((error: DOMException) => {
        if (error.name !== "AbortError") setFailed(true);
      });
    } else {
      userPaused.current = true;
      v.pause();
    }
  }, [videoUrl]);

  const showVideo = Boolean(videoUrl) && ready && !failed && playing;

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

      {videoUrl && (
        <video
          ref={videoRef}
          poster={posterUrl ?? undefined}
          playsInline
          loop
          muted={muted}
          preload="none"
          aria-label={title}
          onLoadedData={() => setReady(true)}
          onError={() => setFailed(true)}
          onPlaying={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          className={`absolute inset-0 size-full object-cover transition-opacity duration-700 ${
            showVideo ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      {/* Quiet cinematic vignette so overlaid text always stays legible. */}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-onyx/60 via-transparent to-onyx/20" />

      {videoUrl ? (
        <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2">
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
          className="absolute inset-0 z-10 grid place-items-center text-cream focus-visible:outline-2 focus-visible:outline-gold"
          aria-label={`Watch ${title}`}
        >
          <span className="flex items-center gap-3 px-6 py-3 bg-onyx/40 backdrop-blur-sm text-[10px] uppercase tracking-[0.3em]">
            <Play className="size-4" aria-hidden /> {failed ? "Retry film" : "Watch film"}
          </span>
        </button>
      )}
    </div>
  );
}
