import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { giftCollections } from "@/features/catalogue/gift-collections";

export function HomeGiftCollections() {
  return (
    <section className="ed-wrap home-gifts" aria-labelledby="home-gifts-title">
      <div className="home-gifts-heading">
        <h2 id="home-gifts-title">Personalised gifts</h2>
        <Link to="/gifts" hash="directory" className="ed-text-button">
          See all products <ArrowUpRight size={16} aria-hidden />
        </Link>
      </div>
      <ul className="home-gifts-grid">
        {giftCollections.map(({ id, name }) => (
          <li key={id}>
            <Link to="/gifts" search={{ collection: id }} hash="directory">
              <img src={"/products/collections/" + id + ".webp"} alt="" width={360} height={360}
                loading="lazy" decoding="async" />
              <span>{name}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="home-gifts-caption">Illustrative collection images</p>
    </section>
  );
}
