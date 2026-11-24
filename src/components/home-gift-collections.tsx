import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { seedProducts } from "@/features/catalogue/store";

const featuredProductIds = ["PRT-004", "SHP-012", "MUG-001", "SHP-006", "SHP-002", "SHP-001", "TEC-001", "MAG-001"];
const featuredProducts = featuredProductIds.flatMap((id) => {
  const product = seedProducts.find((item) => item.id === id);
  return product?.image ? [product] : [];
});

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
        {featuredProducts.map(({ id, name, image }) => (
          <li key={id}>
            <Link to="/gifts" search={{ product: id }}>
              <img src={image} alt="" width={360} height={360}
                loading="lazy" decoding="async" />
              <span>{name}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="home-gifts-caption">Illustrative product images</p>
    </section>
  );
}
