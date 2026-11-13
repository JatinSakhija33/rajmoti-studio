import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X, Maximize2, Share2, Download, ZoomIn, ZoomOut } from "lucide-react";
import { toast } from "sonner";
import { waMessage, whatsappLink } from "@/lib/site";




type Img = {
  /** Display source — should be the `large` variant. */
  src: string;
  /** Higher-resolution source loaded only when the visitor zooms in. */
  zoomSrc?: string;
  width?: number | null;
  height?: number | null;
  dominantColor?: string | null;
  title?: string | null;
  caption?: string | null;
  shortId?: string | null;
  allowDownload?: boolean;
};

export function Lightbox({
  images,
  startIndex,
  onClose,
  downloadEnabled = false,
  enquiryContext,
  enquiryCategory,
  enquirySubcategory,
}: {
  images: Img[];
  startIndex: number;
  onClose: () => void;
  downloadEnabled?: boolean;
  /** e.g. "Baby Photography" — used to pre-fill the WhatsApp enquiry. */
  enquiryContext?: string;
  /** Category / subcategory names sent along with the photo in the enquiry. */
  enquiryCategory?: string;
  enquirySubcategory?: string;
}) {

  const [i, setI] = useState(startIndex);
  const [zoom, setZoom] = useState(1);
  const [ready, setReady] = useState(false);
  const [displayed, setDisplayed] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const prev = () => { setZoom(1); setReady(false); setI((v) => (v - 1 + images.length) % images.length); };
  const next = () => { setZoom(1); setReady(false); setI((v) => (v + 1) % images.length); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Preload only the immediate neighbours — never the whole gallery.
  useEffect(() => {
    if (images.length < 2) return;
    const neighbours = [
      images[(i + 1) % images.length],
      images[(i - 1 + images.length) % images.length],
    ];
    const loaders = neighbours.map((n) => {
      const el = new Image();
      el.decoding = "async";
      el.src = n.src;
      return el;
    });
    return () => { for (const el of loaders) el.src = ""; };
  }, [i, images]);

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    if (t) touchStart.current = { x: t.clientX, y: t.clientY };
  }

  function onTouchEnd(e: React.TouchEvent) {
    const start = touchStart.current;
    const t = e.changedTouches[0];
    touchStart.current = null;
    if (!start || !t || zoom > 1) return;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) next(); else prev();
  }



  const img = images[i];
  const currentSrc = zoom > 1 && img.zoomSrc ? img.zoomSrc : img.src;
  const canDownload = downloadEnabled && img.allowDownload !== false;

  async function share() {
    const url = typeof window !== "undefined"
      ? `${window.location.origin}${img.shortId ? `/photo/${img.shortId}` : window.location.pathname}`
      : "";
    try {
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        await (navigator as any).share({ title: img.title || "Photograph", url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch { /* user cancelled */ }
  }

  function toggleFullscreen() {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen?.();
    else document.exitFullscreen?.();
  }

  async function download() {
    if (!canDownload) return;
    try {
      const r = await fetch(img.zoomSrc ?? img.src);
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // Never expose storage filename — use title or short ID
      const safe = (img.title || img.shortId || "photograph").replace(/[^a-z0-9-_ ]/gi, "").trim() || "photograph";
      a.download = `${safe}.webp`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Could not download");
    }
  }

  return (
    <div
      ref={containerRef}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className="fixed inset-0 z-[100] bg-onyx/95 backdrop-blur-xl flex items-center justify-center animate-fade-in-up"
    >
      {/* Top-right actions */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1">
        <button onClick={() => setZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)))} aria-label="Zoom out" className="text-cream/70 hover:text-cream p-2" title="Zoom out">
          <ZoomOut className="size-5" />
        </button>
        <button onClick={() => setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2)))} aria-label="Zoom in" className="text-cream/70 hover:text-cream p-2" title="Zoom in">
          <ZoomIn className="size-5" />
        </button>
        <button onClick={toggleFullscreen} aria-label="Fullscreen" className="text-cream/70 hover:text-cream p-2" title="Fullscreen">
          <Maximize2 className="size-5" />
        </button>
        <button onClick={share} aria-label="Share" className="text-cream/70 hover:text-cream p-2" title="Share">
          <Share2 className="size-5" />
        </button>
        {canDownload && (
          <button onClick={download} aria-label="Download" className="text-cream/70 hover:text-cream p-2" title="Download">
            <Download className="size-5" />
          </button>
        )}
        <button onClick={onClose} aria-label="Close" className="text-cream/70 hover:text-cream p-2" title="Close">
          <X className="size-6" />
        </button>
      </div>

      <button onClick={prev} aria-label="Previous" className="absolute left-3 md:left-8 top-1/2 -translate-y-1/2 text-cream/70 hover:text-cream p-3 z-10">
        <ChevronLeft className="size-7" />
      </button>
      <button onClick={next} aria-label="Next" className="absolute right-3 md:right-8 top-1/2 -translate-y-1/2 text-cream/70 hover:text-cream p-3 z-10">
        <ChevronRight className="size-7" />
      </button>

      <div className="max-w-[92vw] max-h-[88dvh] flex flex-col items-center gap-4 overflow-hidden">
        <div
          className="relative overflow-auto max-w-full max-h-[80dvh]"
          style={{ backgroundColor: !ready && !displayed ? (img.dominantColor ?? "transparent") : "transparent" }}
        >
          {/* Previous frame stays on screen until the next one has loaded — no blank flash. */}
          {!ready && displayed && (
            <img
              src={displayed}
              alt=""
              aria-hidden
              className="absolute inset-0 size-full object-contain"
              draggable={false}
            />
          )}
          <img
            key={`${i}-${zoom > 1 ? "zoom" : "base"}`}
            src={currentSrc}
            alt={img.title ?? ""}
            width={img.width ?? undefined}
            height={img.height ?? undefined}
            decoding="async"
            onLoad={() => { setReady(true); setDisplayed(currentSrc); }}
            className={`relative max-w-full max-h-[80dvh] object-contain transition-[transform,opacity] duration-500 ${ready ? "opacity-100" : "opacity-0"}`}
            style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
            draggable={false}
          />
        </div>

        {(img.title || img.caption) && (
          <div className="text-center text-cream/80 max-w-2xl px-6">
            {img.title && <p className="font-display text-lg italic">{img.title}</p>}
            {img.caption && <p className="text-xs mt-1 opacity-70">{img.caption}</p>}
          </div>
        )}
        <div className="flex items-center gap-4">
          <p className="eyebrow text-cream/40">{i + 1} / {images.length}</p>
          <a
            href={whatsappLink(
              waMessage.photoDetailed({
                category: enquiryCategory ?? enquiryContext,
                subcategory: enquirySubcategory,
                title: img.title,
                photoUrl: typeof window !== "undefined" && img.shortId
                  ? `${window.location.origin}/photo/${img.shortId}`
                  : undefined,
              }),
            )}

            target="_blank"
            rel="noreferrer"
            className="eyebrow text-cream/70 hover:text-gold border-b border-cream/25 hover:border-gold pb-0.5 transition-colors"
          >
            Enquire about this photograph →
          </a>
        </div>

      </div>
    </div>
  );
}
