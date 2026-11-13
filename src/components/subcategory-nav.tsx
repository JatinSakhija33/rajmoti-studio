import { Link } from "@tanstack/react-router";

type Sub = { id: string; name: string; slug: string };

type Props = {
  categorySlug: string;
  subs: Sub[];
  /** Slug of the active subcategory, or null when viewing everything. */
  active: string | null;
  counts?: Record<string, number>;
};

/**
 * Sticky filter rail so a visitor can move between subcategories without
 * losing their place — horizontally scrollable on small screens.
 */
export function SubcategoryNav({ categorySlug, subs, active, counts }: Props) {
  if (subs.length === 0) return null;
  const base =
    "shrink-0 eyebrow px-4 py-2 border transition-colors whitespace-nowrap";
  const on = "border-gold bg-gold/10 text-gold";
  const off = "border-onyx/12 text-muted-foreground hover:border-onyx/40 hover:text-onyx";

  return (
    <div className="sticky top-16 z-20 -mx-4 px-4 py-3 bg-background/85 backdrop-blur border-b border-onyx/8">
      <nav aria-label="Filter by session type" className="flex gap-2 overflow-x-auto no-scrollbar">
        <Link
          to="/portfolios/$category"
          params={{ category: categorySlug }}
          className={`${base} ${active == null ? on : off}`}
          aria-current={active == null ? "page" : undefined}
        >
          All work
        </Link>
        {subs.map((s) => (
          <Link
            key={s.id}
            to="/portfolios/$category/$subcategory"
            params={{ category: categorySlug, subcategory: s.slug }}
            className={`${base} ${active === s.slug ? on : off}`}
            aria-current={active === s.slug ? "page" : undefined}
          >
            {s.name}
            {counts?.[s.id] ? <span className="ml-2 opacity-50">{counts[s.id]}</span> : null}
          </Link>
        ))}
      </nav>
    </div>
  );
}
