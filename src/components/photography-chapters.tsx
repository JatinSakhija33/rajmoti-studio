import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { variantSrcSet, variantUrl } from "@/lib/images";
import { photographySessions } from "@/lib/photography-sessions";
import { categoriesQuery, photographyCoverQuery, siteContentQuery } from "@/lib/queries";

type Session = (typeof photographySessions)[number];

export function PhotographyChapters({ showCollectionsLink = false }: { showCollectionsLink?: boolean }) {
  const { data: categories = [] } = useQuery(categoriesQuery);
  const { data: content } = useQuery(siteContentQuery);
  const defaults = (content?.category_defaults ?? {}) as Record<string, string>;

  return (
    <section className="ed-wrap ed-section" aria-labelledby="photography-chapters-title">
      <div className="ed-section-heading">
        <div>
          <p className="ed-kicker">What brings you here?</p>
          <h2 id="photography-chapters-title">Every chapter deserves a place.</h2>
        </div>
        {showCollectionsLink && (
          <Link to="/portfolios" className="ed-text-button">
            See the collections <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        )}
      </div>
      <div className="chapter-grid">
        {photographySessions.map((session, index) => {
          const category = categories.find((item) => item.slug === session.slug);
          return (
            <ChapterCard
              key={session.slug}
              session={session}
              index={index}
              categoryId={category?.id}
              selectedCover={category?.cover_image_url || (category ? defaults[session.slug] : undefined)}
            />
          );
        })}
      </div>
    </section>
  );
}

function ChapterCard({
  session,
  index,
  categoryId,
  selectedCover,
}: {
  session: Session;
  index: number;
  categoryId?: string;
  selectedCover?: string;
}) {
  const { data: photograph } = useQuery({
    ...photographyCoverQuery(categoryId ?? ""),
    enabled: Boolean(categoryId && !selectedCover),
  });
  const familyConcept = session.slug === "family";
  const fallback = familyConcept ? "/editorial/family-hero.webp" : `/demo/${session.slug}-1.svg`;
  const galleryCover = photograph ? variantUrl({
    ...photograph,
    image_url: photograph.thumbnail_url || photograph.image_url,
  }, "medium") : undefined;
  const srcSet = !selectedCover && photograph
    ? variantSrcSet(photograph, ["thumbnail", "medium"])
    : undefined;

  return (
    <Link to="/portfolios/$category" params={{ category: session.slug }} className="chapter-card">
      <div className="chapter-image">
        <img
          src={selectedCover || galleryCover || fallback}
          srcSet={srcSet}
          sizes={srcSet ? "(max-width: 850px) 50vw, 25vw" : undefined}
          alt=""
          width="1200"
          height="1500"
          loading="lazy"
          decoding="async"
        />
        {!selectedCover && !galleryCover && (
          <span>{familyConcept ? "Concept image" : "Photography pending"}</span>
        )}
      </div>
      <div className="chapter-label">
        <span>{String(index + 1).padStart(2, "0")} / {session.name}</span>
        <ArrowUpRight size={17} aria-hidden="true" />
      </div>
      <h3>{session.title}</h3>
      <p>{session.caption}</p>
    </Link>
  );
}
