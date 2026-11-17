import { Gift, Heart, Flower2 } from "lucide-react";

// Deliberately abstract artwork: these are design illustrations, never inventory photographs.
export function ProductArt({
  category,
  shape = "Rectangle",
  className = "",
  label = false,
}: {
  category: string;
  shape?: string;
  className?: string;
  label?: boolean;
}) {
  const kind = [
    "frames",
    "acrylic",
    "prints",
    "albums",
    "drinkware",
    "devotional",
    "canvas",
    "collages",
  ].includes(category)
    ? category
    : "gift";
  return (
    <div className={`rs-art rs-art-${kind} ${className}`} aria-hidden="true">
      <div
        className={`rs-object ${/heart/i.test(shape) ? "is-heart" : /round|circle/i.test(shape) ? "is-round" : ""}`}
      >
        <div className="rs-artwork">
          <span className="art-sun" />
          <span className="art-hill one" />
          <span className="art-hill two" />
          {kind === "devotional" ? (
            <Flower2 size={40} />
          ) : kind === "gift" ? (
            <Heart size={30} strokeWidth={1.3} />
          ) : null}
        </div>
        {kind === "albums" && (
          <span className="album-title">
            OUR LITTLE
            <br />
            MOMENTS
          </span>
        )}
        {kind === "gift" && <Gift className="gift-mark" size={42} strokeWidth={1.2} />}
      </div>
      <span className="art-shadow" />
      {label && <small className="art-label">Design illustration</small>}
    </div>
  );
}
