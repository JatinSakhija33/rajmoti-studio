/** Masonry-shaped placeholders shown while a gallery page is loading. */
export function GallerySkeleton({ count = 6 }: { count?: number }) {
  const ratios = ["3/4", "1/1", "4/5", "2/3", "1/1", "3/4", "4/5", "2/3"];
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="w-full break-inside-avoid bg-onyx/5 animate-pulse"
          style={{ aspectRatio: ratios[i % ratios.length] }}
        />
      ))}
    </>
  );
}
