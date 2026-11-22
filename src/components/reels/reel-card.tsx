import { Link, useNavigate } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { aspectValue, publicReelTitle, type Reel } from "@/lib/reels";
import { prefersLightMedia } from "./media-preferences";

export function ReelCard({
  reel,
  onOpen,
  warmPreview = false,
}: {
  reel: Reel;
  onOpen?: () => void;
  warmPreview?: boolean;
}) {
  const title = publicReelTitle(reel);
  const navigate = useNavigate();
  const tile = useRef<HTMLButtonElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const hovering = useRef(false);
  const [playing, setPlaying] = useState(false);
  const preview = reel.preview_url !== reel.video_url ? reel.preview_url : null;
  const source = preview || reel.video_url;

  function stop() {
    hovering.current = false;
    video.current?.pause();
    setPlaying(false);
  }

  useEffect(() => {
    const element = tile.current;
    if (!element) return;
    const pointer = window.matchMedia("(any-hover: hover) and (any-pointer: fine)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const cancel = () => {
      if (document.hidden || !pointer.matches || prefersLightMedia()) stop();
    };
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          stop();
          return;
        }
        const player = video.current;
        if (warmPreview && preview && player && !player.getAttribute("src") &&
            pointer.matches && !document.hidden && !prefersLightMedia()) {
          player.preload = "auto";
          player.src = preview;
        }
      },
      { threshold: 0.15 },
    );
    observer?.observe(element);
    pointer.addEventListener("change", cancel);
    motion.addEventListener("change", cancel);
    document.addEventListener("visibilitychange", cancel);
    return () => {
      observer?.disconnect();
      pointer.removeEventListener("change", cancel);
      motion.removeEventListener("change", cancel);
      document.removeEventListener("visibilitychange", cancel);
    };
  }, [preview, warmPreview]);

  return (
    <figure className="group">
      <button
        ref={tile}
        type="button"
        onPointerEnter={(event) => {
          const player = video.current;
          if (event.pointerType !== "mouse" || !player || !source || prefersLightMedia()) return;
          hovering.current = true;
          if (player.getAttribute("src") !== source) player.src = source;
          player.play().catch(() => setPlaying(false));
        }}
        onPointerLeave={stop}
        onClick={() => {
          stop();
          if (onOpen) onOpen();
          else void navigate({ to: "/reel/$shortId", params: { shortId: reel.short_id } });
        }}
        aria-label={"Play " + title}
        className="relative block w-full overflow-hidden bg-onyx focus-visible:outline-2 focus-visible:outline-gold"
        style={{ aspectRatio: aspectValue(reel.aspect_ratio) }}
      >
        {reel.poster_url && (
          <img
            src={reel.poster_url}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 size-full object-cover"
          />
        )}
        {source && (
          <video
            key={source}
            ref={video}
            aria-hidden
            muted
            playsInline
            loop
            preload="none"
            disablePictureInPicture
            onPlaying={() => {
              if (hovering.current) setPlaying(true);
              else video.current?.pause();
            }}
            onPause={() => setPlaying(false)}
            onError={() => setPlaying(false)}
            className={"pointer-events-none absolute inset-0 size-full object-cover transition-opacity duration-200 motion-reduce:transition-none " +
              (playing ? "opacity-100" : "opacity-0")}
          />
        )}
        <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-onyx/70 via-transparent to-transparent" />
        <span aria-hidden className={"absolute inset-0 grid place-items-center transition-opacity motion-reduce:transition-none " +
          (playing ? "opacity-0 group-focus-within:opacity-100" : "opacity-100")}>
          <span className="size-12 grid place-items-center rounded-full bg-onyx/55 text-cream">
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
