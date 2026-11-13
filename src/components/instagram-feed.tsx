import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Instagram, MessageCircle } from "lucide-react";
import { SITE, instagramHandle, instagramProfileUrl, whatsappLink } from "@/lib/site";
import { useIsMobile } from "@/lib/motion";

export type InstagramMobileMode = "full" | "compact" | "hidden";

export type InstagramCms = {
  enabled?: boolean;
  eyebrow?: string;
  heading?: string;
  description?: string;
  cta_label?: string;
  /** LightWidget widget id or full embed URL/snippet pasted by the admin. */
  widget_id?: string;
  /** Reserved height in px for the widget (avoids layout shift before resize). */
  min_height?: number;
  /** How the section behaves on phones: full height, compressed, or hidden. */
  mobile_mode?: InstagramMobileMode;
};


const LW_SCRIPT = "https://cdn.lightwidget.com/widgets/lightwidget.js";

/**
 * Accepts a bare LightWidget hash, a widget URL, or the whole embed snippet and
 * returns the canonical iframe URL. Nothing is guessed: it must contain a hash.
 */
export function lightwidgetUrl(input?: string | null): string | null {
  const v = (input ?? "").trim();
  if (!v) return null;
  const fromUrl = v.match(/lightwidget\.com\/widgets\/([a-z0-9]+)\.html/i);
  const hash = fromUrl?.[1] ?? (/^[a-z0-9]{16,64}$/i.test(v) ? v : null);
  return hash ? `https://cdn.lightwidget.com/widgets/${hash}.html` : null;
}

/** Loads LightWidget's resize script once, only when the section is near view. */
function useLightWidgetScript(active: boolean) {
  useEffect(() => {
    if (!active || typeof document === "undefined") return;
    if (document.querySelector(`script[src="${LW_SCRIPT}"]`)) return;
    const s = document.createElement("script");
    s.src = LW_SCRIPT;
    s.async = true;
    document.body.appendChild(s);
  }, [active]);
}

function FollowFallback() {
  return (
    <a
      href={instagramProfileUrl()}
      target="_blank"
      rel="noreferrer"
      className="block border border-onyx/10 px-8 py-16 text-center hover:border-gold transition-colors"
    >
      <Instagram className="size-7 mx-auto mb-4 text-gold" aria-hidden />
      <p className="font-display text-2xl italic mb-2">See our latest work on Instagram</p>
      <p className="eyebrow text-muted-foreground">
        {instagramHandle()} · {SITE.location}
      </p>
    </a>
  );
}

function SkeletonGrid({
  columns = 4,
  minHeight,
  reduce,
}: {
  columns?: number;
  minHeight: number;
  reduce?: boolean;
}) {
  const items = Array.from({ length: columns * 2 });
  return (
    <div
      className="grid gap-1.5"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        minHeight,
      }}
    >
      {items.map((_, i) => (
        <div
          key={i}
          className="relative bg-secondary/60 overflow-hidden"
        >
          {!reduce && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-onyx/5 via-transparent to-onyx/5"
              initial={{ opacity: 0.5 }}
              animate={{ opacity: [0.5, 0.75, 0.5] }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: (i % columns) * 0.12,
              }}
            />
          )}
          {reduce && (
            <div className="absolute inset-0 bg-gradient-to-br from-onyx/5 via-transparent to-onyx/5" />
          )}
        </div>
      ))}
    </div>
  );
}


export function InstagramFeed({ cms }: { cms: InstagramCms }) {
  const reduce = useReducedMotion();
  const isMobile = useIsMobile();
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [state, setState] = useState<"idle" | "ready" | "failed">("idle");

  const mobileMode: InstagramMobileMode = cms.mobile_mode ?? "full";
  const hiddenOnMobile = isMobile && mobileMode === "hidden";
  const compact = isMobile && mobileMode === "compact";

  const src = lightwidgetUrl(cms.widget_id);
  const baseHeight = Math.max(320, Math.min(cms.min_height ?? 620, 1400));
  const minHeight = compact ? Math.min(baseHeight, 340) : baseHeight;

  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setNear(true)), {
      rootMargin: "400px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, [near]);

  // If the widget never loads, quietly fall back to the follow card.
  useEffect(() => {
    if (!near || !src || state !== "idle") return;
    const t = setTimeout(() => setState((s) => (s === "idle" ? "failed" : s)), 9000);
    return () => clearTimeout(t);
  }, [near, src, state]);

  useLightWidgetScript(near && !!src && !hiddenOnMobile);

  if (cms.enabled === false) return null;
  if (hiddenOnMobile) return null;

  return (
    <section
      aria-labelledby="instagram-heading"
      className={`${compact ? "py-14" : "py-24"} md:py-32 bg-secondary/40 border-y border-onyx/5`}
    >
      <div className="container-page max-w-6xl">

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className={compact ? "max-w-xl mb-6" : "max-w-xl mb-12"}
        >
          <p className="eyebrow text-gold mb-3">{cms.eyebrow || "Recently on Instagram"}</p>
          <h2 id="instagram-heading" className="font-display text-3xl md:text-4xl">
            {cms.heading || instagramHandle()}
          </h2>
          {cms.description !== "" && !compact && (
            <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
              {cms.description || "New sessions, quiet studio moments and work in progress — shared as we shoot."}
            </p>
          )}
        </motion.div>

        <div ref={ref} className="relative">
          {src && state !== "failed" ? (
            <div
              style={compact ? { height: minHeight } : { minHeight }}
              className={compact ? "relative overflow-hidden" : "relative"}
            >

              {near && (
                <motion.iframe
                  src={src}
                  title={`Instagram photographs from ${instagramHandle()}`}
                  scrolling="no"
                  loading="lazy"
                  onLoad={() => setState("ready")}
                  onError={() => setState("failed")}
                  className="lightwidget-widget w-full border-0 overflow-hidden"
                  style={{ minHeight }}
                  initial={{ opacity: 0 }}
                  animate={state === "ready" ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                />
              )}
              <AnimatePresence>
                {state !== "ready" && (
                  <motion.div
                    key="skeleton"
                    className="absolute inset-0 pointer-events-none"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    aria-label="Loading Instagram showcase"
                  >
                    <div className="hidden sm:grid">
                      <SkeletonGrid columns={4} minHeight={minHeight} reduce={!!reduce} />
                    </div>
                    <div className="grid sm:hidden">
                      <SkeletonGrid columns={2} minHeight={minHeight} reduce={!!reduce} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <FollowFallback />
          )}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
          <a
            href={instagramProfileUrl()}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 border-b border-onyx/20 pb-0.5 hover:text-gold hover:border-gold transition-colors"
          >
            <Instagram className="size-4 text-gold" aria-hidden />
            {cms.cta_label || `Follow ${instagramHandle()}`}
          </a>
          <a
            href={whatsappLink(
              `Hello ${SITE.name}, I saw your photographs on Instagram and would like photographs like these.`,
            )}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-gold transition-colors"
          >
            <MessageCircle className="size-4 text-gold" aria-hidden />
            Want photographs like these? WhatsApp us
          </a>
        </div>
      </div>
    </section>
  );
}
