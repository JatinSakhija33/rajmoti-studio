import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { studioConnected } from "@/lib/backend-mode";
import { variantUrl, type GalleryImageLike } from "@/lib/images";
import { publishedPhotoLibraryQuery } from "@/lib/published-portfolio";
import { allImagesQuery } from "@/lib/queries";

export function GalleryPhotoPicker({
  onSelect,
  size = "medium",
}: {
  onSelect: (url: string) => void;
  size?: "medium" | "large";
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(18);
  const published = useQuery({ ...publishedPhotoLibraryQuery, enabled: open });
  const live = useQuery({ ...allImagesQuery, enabled: open && studioConnected });
  const term = search.trim().toLowerCase();
  const photos = [...(live.data ?? []).filter((photo) => !photo.hidden), ...(published.data ?? [])];
  const matching = new Map<string, { photo: GalleryImageLike; label: string }>();
  for (const photo of photos) {
    const url = variantUrl(photo, size);
    const category = photo.categories?.name ?? "";
    const label = photo.title?.trim() || photo.alt_text?.trim() || category || "Studio photograph";
    if (url && !matching.has(url) &&
        (label + " " + category + " " + photo.short_id).toLowerCase().includes(term)) {
      matching.set(url, { photo, label });
    }
  }

  return (
    <div className="mt-2">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)}
        className="border border-onyx/20 px-3 py-2 text-xs hover:border-gold">
        {open ? "Close photo library" : "Choose from photo library"}
      </button>
      {open && (
        <div className="mt-2 max-h-96 overflow-auto border border-onyx/15 bg-white p-3">
          <input
            type="search"
            aria-label="Find a published photo"
            placeholder="Search by photo title, category or code"
            value={search}
            className="w-full border border-onyx/20 p-2 text-sm"
            onChange={(event) => { setSearch(event.currentTarget.value); setLimit(18); }}
          />
          {matching.size ? (
            <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {[...matching].slice(0, limit).map(([url, { photo, label }]) => (
                <li key={url}>
                  <button type="button" aria-label={"Use " + label}
                    onClick={() => { onSelect(url); setOpen(false); }}
                    className="w-full border border-onyx/15 p-1.5 hover:border-gold">
                    <img src={variantUrl(photo, "thumbnail")} alt="" loading="lazy" decoding="async"
                      className="h-20 w-full bg-cream object-contain" />
                    <span className="mt-1 block truncate text-xs">{label}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              {published.isPending || (studioConnected && live.isPending) ? "Loading photographs…" : "No published photos match."}
            </p>
          )}
          {matching.size > limit && (
            <button type="button" onClick={() => setLimit(limit + 18)} className="mt-3 text-sm underline">
              Show more photographs
            </button>
          )}
        </div>
      )}
    </div>
  );
}
