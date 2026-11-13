import {SaveStyle} from "@/features/editorial/shortlist";
import { Link } from "@tanstack/react-router";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle } from "lucide-react";
import { imagesByCategoryInfiniteQuery } from "@/lib/queries";
import { GalleryImage } from "@/components/gallery-image";
import { GallerySkeleton } from "@/components/gallery-skeleton";
import { Lightbox } from "@/components/lightbox";
import { publicImageTitle, variantUrl } from "@/lib/images";
import { whatsappLink } from "@/lib/site";

type Props = {
  categoryId: string;
  subcategoryId?: string;
  /** Used for alt text and pre-filled enquiries. */
  contextName: string;
  /** Taxonomy names carried into the WhatsApp enquiry alongside the photo. */
  categoryName?: string;
  subcategoryName?: string;
  whatsappMessage: string;
  /** Called with the loaded count so the header can show it. */
  onCount?: (n: number) => void;
};

/**
 * The shared editorial masonry: responsive images, infinite scroll,
 * a lightbox, and one quiet in-grid invitation to start a conversation.
 */
export function PortfolioGallery({ categoryId, subcategoryId, contextName, categoryName, subcategoryName, whatsappMessage, onCount }: Props) {
  const query = useSuspenseInfiniteQuery(imagesByCategoryInfiniteQuery(categoryId, subcategoryId));
  const images = useMemo(() => query.data.pages.flat(), [query.data]);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onCount?.(images.length);
  }, [images.length, onCount]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && query.hasNextPage && !query.isFetchingNextPage) {
          query.fetchNextPage();
        }
      },
      { rootMargin: "600px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [query.hasNextPage, query.isFetchingNextPage, query.fetchNextPage]);

  if (images.length === 0) {
    return (
      <div className="py-28 text-center">
        <p className="font-display text-3xl italic mb-3">This gallery is being curated.</p>
        <p className="text-muted-foreground text-sm mb-8">
          New {contextName.toLowerCase()} work is added every few weeks.
        </p>
        <Link to="/contact" className="px-7 py-3 bg-onyx text-cream eyebrow inline-block hover:bg-gold hover:text-onyx transition-colors">
          Enquire about this session
        </Link>
      </div>
    );
  }

  const invitationAt = Math.min(11, images.length);

  return (
    <>
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-3 md:gap-5 [column-fill:balance]">
        {images.map((img, idx) => (
          <div key={img.id} className="break-inside-avoid mb-3 md:mb-5">
            <button
              onClick={() => setLightbox(idx)}
              aria-label={`View photograph ${idx + 1} of ${images.length}`}
              className="block w-full group relative overflow-hidden bg-onyx/5 focus-visible:outline-2 focus-visible:outline-gold"
            >
              <GalleryImage
                image={img}
                size="thumbnail"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                alt={publicImageTitle(img.alt_text) || publicImageTitle(img.title) || contextName}
                priority={idx < 3}
                className="w-full transition-transform duration-[900ms] ease-out group-hover:scale-[1.04] motion-reduce:transform-none"
              />
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-onyx/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="pointer-events-none absolute bottom-4 left-4 right-4 text-left eyebrow text-cream translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 motion-reduce:transition-none">
                View larger
              </span>
            </button>
            <SaveStyle style={{id:img.short_id||img.id,title:img.title||contextName,image:variantUrl(img,"thumbnail")}}/>
            {idx === invitationAt - 1 && (
              <div className="mt-3 md:mt-5 break-inside-avoid border border-onyx/12 p-8 bg-cream">
                <p className="font-display text-2xl leading-snug mb-3">Something here feel like yours?</p>
                <p className="text-sm text-muted-foreground mb-6">
                  Send us the frames you love and we'll plan a {contextName.toLowerCase()} session around them.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link to="/contact" className="px-5 py-2.5 bg-onyx text-cream eyebrow hover:bg-gold hover:text-onyx transition-colors">
                    Enquire about this session
                  </Link>
                  <a
                    href={whatsappLink(whatsappMessage)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 border border-onyx/20 eyebrow inline-flex items-center gap-2 hover:border-gold hover:text-gold transition-colors"
                  >
                    <MessageCircle className="size-4" aria-hidden /> WhatsApp
                  </a>
                </div>
              </div>
            )}
          </div>
        ))}
        {query.isFetchingNextPage && <GallerySkeleton count={3} />}
      </div>

      <div ref={sentinel} aria-hidden className="h-px" />

      {lightbox != null && (
        <Lightbox
          images={images.map((i) => ({
            src: variantUrl(i, "large"),
            zoomSrc: variantUrl(i, "original"),
            width: i.width,
            height: i.height,
            dominantColor: i.dominant_color,
            title: publicImageTitle(i.title),
            caption: i.description,
            shortId: i.short_id,
          }))}
          startIndex={lightbox}
          onClose={() => setLightbox(null)}
          enquiryContext={contextName}
          enquiryCategory={categoryName ?? contextName}
          enquirySubcategory={subcategoryName}
        />
      )}
    </>
  );
}
