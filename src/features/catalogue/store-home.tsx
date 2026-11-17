import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  Camera,
  Check,
  Flower2,
  Heart,
  Image,
  Layers,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { collections, inCollection } from "./discovery";
import { useProducts } from "./store";
import { ProductArt } from "./product-art";

export function StoreHome() {
  const [products] = useProducts();
  return (
    <div className="editorial rs-store">
      <SiteNav />
      <main id="main-content" tabIndex={-1}>
        <section className="rs-hero rs-wrap">
          <div className="rs-hero-copy">
            <p className="rs-eyebrow">
              <span />
              PHOTOGRAPHS. FEELINGS. FOREVER.
            </p>
            <h1>
              Your memories.
              <br />A little more
              <br />
              <em>personal.</em>
            </h1>
            <p>
              That favourite photo deserves more than a place on your phone. Turn it into a
              keepsake, a thoughtful gift, a little everyday joy.
            </p>
            <div className="rs-actions">
              <Link to="/gifts" className="rs-button">
                Explore photo gifts <ArrowRight size={17} />
              </Link>
              <Link to="/portfolios" className="rs-text-link">
                Discover photography <ArrowUpRight size={16} />
              </Link>
            </div>
            <div className="rs-hero-note">
              <Camera size={21} strokeWidth={1.3} />
              <span>
                From the first photograph
                <br />
                <strong>to something worth keeping.</strong>
              </span>
            </div>
          </div>
          <figure className="rs-hero-visual">
            <img
              src="/editorial/gift-still-life-960.webp"
              srcSet="/editorial/gift-still-life-480.webp 480w, /editorial/gift-still-life-960.webp 960w, /editorial/gift-still-life-1280.webp 1280w"
              sizes="(max-width: 700px) calc(100vw - 44px), 50vw"
              width="1536"
              height="1024"
              fetchPriority="high"
              alt="Illustrative still life of a framed photograph, album and photo keepsakes in a warm interior"
            />
            <span className="rs-photo-stamp">
              made personal.
              <br />
              <em>kept close.</em>
            </span>
            <figcaption>Styling inspiration · illustrative image, not verified products</figcaption>
            <div className="rs-hero-tag">
              <Heart size={18} strokeWidth={1.4} />
              <span>
                A photo. A feeling.
                <br />
                <strong>A gift only you could give.</strong>
              </span>
            </div>
          </figure>
        </section>
        <div className="rs-values">
          <div className="rs-wrap">
            <span>
              <Image size={17} />
              Your photos, your story
            </span>
            <span>
              <Layers size={17} />
              Sizes & finishes, made clear
            </span>
            <span>
              <Check size={17} />
              Details confirmed with you
            </span>
            <span>
              <MessageCircle size={17} />
              Personal studio guidance
            </span>
          </div>
        </div>
        <section className="rs-section rs-wrap">
          <div className="rs-heading">
            <div>
              <p className="rs-eyebrow">SMALL THINGS. SO MUCH MEANING.</p>
              <h2>What will you make yours?</h2>
            </div>
            <Link to="/gifts" className="rs-text-link">
              Explore all gifts <ArrowRight size={17} />
            </Link>
          </div>
          <div className="rs-collection-grid">
            {collections.slice(0, 6).map((c) => (
              <Link key={c.id} to="/gifts" search={{ collection: c.id }} className="rs-collection">
                <ProductArt category={c.id === "gifts" ? "drinkware" : c.id} />
                <h3>{c.name}</h3>
                <span>{c.detail}</span>
              </Link>
            ))}
          </div>
          <p className="rs-caption">
            Design illustrations. Browse the existing catalogue; availability and prices are
            confirmed by the studio.
          </p>
        </section>
        <section className="rs-occasion-section">
          <div className="rs-wrap rs-section">
            <div className="rs-heading">
              <div>
                <p className="rs-eyebrow">IT’S THE THOUGHT THAT MAKES IT</p>
                <h2>For your favourite people.</h2>
              </div>
              <p>
                A reason to celebrate.
                <br />A memory to make it personal.
              </p>
            </div>
            <div className="rs-occasion-grid">
              {[
                {
                  title: "Another year. More memories.",
                  label: "Birthday gifts",
                  occasion: "Birthday",
                  icon: <Sparkles size={28} strokeWidth={1.2} />,
                  tone: "peach",
                },
                {
                  title: "Your story, still unfolding.",
                  label: "Anniversary gifts",
                  occasion: "Anniversary",
                  icon: <Heart size={28} strokeWidth={1.2} />,
                  tone: "sage",
                },
                {
                  title: "A little something, for them.",
                  label: "Gifts for couples",
                  recipient: "Couples",
                  icon: <Flower2 size={28} strokeWidth={1.2} />,
                  tone: "sand",
                },
              ].map((c) => (
                <Link
                  key={c.label}
                  to="/gifts"
                  search={{ occasion: c.occasion, recipient: c.recipient }}
                  className={`rs-occasion ${c.tone}`}
                >
                  <span className="rs-occasion-icon">{c.icon}</span>
                  <h3>{c.title}</h3>
                  <span>
                    {c.label}
                    <ArrowUpRight size={19} />
                  </span>
                </Link>
              ))}
            </div>
            <div className="rs-recipient-links">
              <span>A little inspiration for…</span>
              <Link to="/gifts" search={{ recipient: "For him" }}>
                Him <ArrowUpRight size={14} />
              </Link>
              <Link to="/gifts" search={{ recipient: "For her" }}>
                Her <ArrowUpRight size={14} />
              </Link>
              <Link to="/gifts" search={{ recipient: "Parents" }}>
                Parents <ArrowUpRight size={14} />
              </Link>
              <Link to="/gifts" search={{ collection: "devotional" }}>
                Devotional moments <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>
        </section>
        <section className="rs-section rs-wrap">
          <div className="rs-heading">
            <div>
              <p className="rs-eyebrow">FIND A NEW HOME FOR YOUR PHOTOS</p>
              <h2>A few lovely places to start.</h2>
            </div>
            <Link to="/gifts" className="rs-text-link">
              View the collection <ArrowRight size={17} />
            </Link>
          </div>
          <div className="rs-home-products">
            {["frames", "acrylic", "albums", "prints"].map((category) => {
              const p = products.find(
                (p) => inCollection(p, category) && p.availability !== "Discontinued",
              );
              return p ? (
                <Link to="/gifts" search={{ product: p.id }} className="rs-home-product" key={p.id}>
                  <ProductArt category={p.category} shape={p.shape} label />
                  <div>
                    <span className="rs-eyebrow">{p.material}</span>
                    <h3>{p.name}</h3>
                    <p>{p.variants.length} size & finish options</p>
                    <span className="rs-home-product-bottom">
                      Price on request <ArrowRight size={17} />
                    </span>
                  </div>
                </Link>
              ) : null;
            })}
          </div>
        </section>
        <section className="rs-how rs-wrap">
          <div>
            <p className="rs-eyebrow">A LITTLE YOU. A LOT OF MEANING.</p>
            <h2>
              Make it personal.
              <br />
              <em>Keep it simple.</em>
            </h2>
            <Link to="/gifts" className="rs-text-link">
              Find your keepsake <ArrowRight size={17} />
            </Link>
          </div>
          <ol>
            {[
              [
                "Find your favourite",
                "Choose a keepsake, then explore its size and finish options.",
              ],
              [
                "Try your photo",
                "Preview a photo on your device. Add a name, a message or a little direction.",
              ],
              [
                "Bring it together",
                "Save your choices to a quote list. Confirm artwork, price and fulfilment with the studio.",
              ],
            ].map(([title, body], i) => (
              <li key={title}>
                <span>0{i + 1}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
        <section className="rs-studio-section rs-wrap">
          <div className="rs-studio-art">
            <Camera size={72} strokeWidth={0.8} />
            <span>
              RAJMOTI
              <br />
              <em>behind the memories.</em>
            </span>
            <div className="rs-studio-art-line" />
          </div>
          <div>
            <p className="rs-eyebrow">SOME MOMENTS DESERVE A SESSION</p>
            <h2>
              Before the keepsake,
              <br />
              <em>there’s the moment.</em>
            </h2>
            <p>
              Baby smiles, growing families, a wedding day. Explore our photography, save the styles
              you love and tell us what you have in mind.
            </p>
            <div className="rs-actions">
              <Link to="/portfolios" className="rs-button">
                Explore photography <ArrowUpRight size={16} />
              </Link>
              <Link to="/packages" className="rs-text-link">
                Session collections <ArrowRight size={16} />
              </Link>
            </div>
            <Link to="/stories" className="rs-subtle-link">
              Discover our stories
            </Link>
          </div>
        </section>
        <section className="rs-section rs-wrap rs-faq">
          <div>
            <p className="rs-eyebrow">A LITTLE HELP, BEFORE YOU START</p>
            <h2>
              Good questions.
              <br />
              <em>Simple answers.</em>
            </h2>
            <Link to="/contact" className="rs-text-link">
              Talk to the studio <ArrowUpRight size={16} />
            </Link>
          </div>
          <div>
            {[
              [
                "Can I use a photo from my phone?",
                "Yes. The local preview accepts JPG, PNG and WebP. Use your original file where possible; screenshots and forwarded photos may be too small for larger prints. The studio confirms suitability before production.",
              ],
              [
                "How do I choose a size?",
                "Open a product to explore its existing size and finish options. The preview changes with your selection. Dimensions are a guide, and the studio confirms the final format and artwork.",
              ],
              [
                "Are prices and delivery confirmed online?",
                "This catalogue contains demonstration specifications without verified prices. Your quote list helps organise a request. Availability, pricing, preparation time and delivery or collection need studio confirmation.",
              ],
              [
                "What happens to my preview photos?",
                "They stay in memory on your device while the personalizer is open. They are not uploaded, saved in your quote list or sent with a demo enquiry. Closing the personalizer clears the photos; supply originals separately when ordering.",
              ],
            ].map(([question, answer]) => (
              <details key={question}>
                <summary>
                  {question}
                  <span>+</span>
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
