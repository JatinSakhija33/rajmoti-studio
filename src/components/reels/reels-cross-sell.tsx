import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Film } from "lucide-react";
import { publishedReelsQuery } from "@/lib/reels";

/**
 * Quiet contextual bridge from a photography category to cinematic reels.
 * Renders nothing unless a published reel actually exists for that category.
 */
export function ReelsCrossSell({ categoryId, categoryName }: { categoryId: string; categoryName: string }) {
  const { data: reels } = useQuery(publishedReelsQuery);
  const match = (reels ?? []).filter((r) => r.category_id === categoryId);
  if (match.length === 0) return null;

  const label = categoryName.replace(/ photography| portraits/i, "").trim();

  return (
    <aside className="mt-16 border-t border-onyx/10 pt-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
      <div className="flex items-start gap-4 max-w-xl">
        <Film className="size-5 text-gold shrink-0 mt-1" aria-hidden />
        <div>
          <h2 className="font-display text-2xl md:text-3xl">Want your memories in motion?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We also film cinematic {label.toLowerCase()} reels — directed, edited and set to music.
          </p>
        </div>
      </div>
      <Link
        to="/cinematic-reels"
        className="px-6 py-3 bg-onyx text-cream text-[10px] uppercase tracking-[0.25em] font-semibold hover:bg-gold transition-colors shrink-0"
      >
        Explore cinematic reels
      </Link>
    </aside>
  );
}
