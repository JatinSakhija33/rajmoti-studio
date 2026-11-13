import { useState } from "react";
import { publicImageTitle, variantSrcSet, variantUrl, type GalleryImageLike, type VariantKey } from "@/lib/images";

type Props = {
  image: GalleryImageLike;
  /** Variant used as the `src` fallback. */
  size?: VariantKey;
  sizes?: string;
  alt?: string;
  className?: string;
  priority?: boolean;
  onClick?: () => void;
};

/**
 * Responsive gallery image: srcset/sizes, lazy decoding, intrinsic dimensions
 * to prevent layout shift, and a dominant-colour placeholder that fades out.
 */
export function GalleryImage({ image, size = "medium", sizes, alt, className, priority = false, onClick }: Props) {
  const [loaded, setLoaded] = useState(false);
  const src = variantUrl(image, size);
  const srcSet = variantSrcSet(image);
  const bg = image.dominant_color ?? "#e8e2d4";
  const ratio = image.width && image.height ? `${image.width} / ${image.height}` : undefined;

  return (
    <span
      className="block relative overflow-hidden"
      style={{ backgroundColor: bg, aspectRatio: ratio }}
      onClick={onClick}
    >
      <img
        src={src}
        {...(srcSet ? { srcSet, sizes: sizes ?? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" } : {})}
        alt={alt ?? publicImageTitle(image.alt_text) ?? publicImageTitle(image.title) ?? ""}
        width={image.width ?? undefined}
        height={image.height ?? undefined}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        {...(priority ? { fetchPriority: "high" as const } : {})}
        onLoad={() => setLoaded(true)}
        className={`${className ?? ""} transition-[opacity,filter,transform] duration-700 motion-reduce:transition-none ${
          loaded ? "opacity-100 blur-0" : "opacity-0 blur-md"
        }`}
      />
    </span>
  );
}
