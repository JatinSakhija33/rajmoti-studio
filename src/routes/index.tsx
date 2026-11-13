import { useQuery } from "@tanstack/react-query";
import { siteContentQuery } from "@/lib/queries";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Heart, Check, MessageCircle } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { useStyles } from "@/features/catalogue/store";
import { whatsappLink, waMessage } from "@/lib/site";
export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Rajmoti Studio — Little moments. Lasting stories. | Jetpur" }] }),
  component: Home,
});
function Home() {
  const { data: content = {} } = useQuery(siteContentQuery);
  const candidate = content.hero?.images?.[0] || content.hero?.fallback_image;
  const customHero = candidate && !candidate.startsWith("/demo/") ? candidate : null;
  const [styles, setStyles] = useStyles();
  const saved = styles.some((s) => s.id === "demo-family-story");
  return (
    <div className="editorial">
      <SiteNav />
      <main>
        <section className="ed-wrap home-hero">
          <div className="home-hero-copy">
            <p className="ed-kicker">Jetpur, Gujarat · Since 1982</p>
            <h1>
              Little moments.
              <br />
              <em>Lasting stories.</em>
            </h1>
            <p className="ed-copy">
              Baby, maternity, family and wedding photography. Thoughtfully made, for the people who
              mean everything.
            </p>
            <div className="ed-actions">
              <Link to="/portfolios" className="ed-button">
                Explore sessions <ArrowRight size={17} />
              </Link>
              <a className="ed-text-button" href={whatsappLink(waMessage.booking())} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={16} /> Let's talk
              </a>
            </div>
            <div className="hero-signature">
              <span className="signature-line" />A family studio. A lifetime of memories.
            </div>
          </div>
          <figure className="home-hero-image">
            <picture>
              <source
                media="(max-width: 700px)"
                srcSet={customHero || "/editorial/family-hero.png"}
              />
              <img
                src={customHero || "/editorial/family-hero.png"}
                width="1536"
                height="1024"
                fetchPriority="high"
                alt={
                  customHero
                    ? "Rajmoti Studio portfolio photograph"
                    : "Illustrative Indian family portrait in a warm studio"
                }
              />
            </picture>
            {!customHero && <figcaption className="concept-credit">Illustrative image — client portfolio photography to be added</figcaption>}
            <div className="photo-note">
              The everyday.
              <br />
              <em>Made unforgettable.</em>
            </div>
          </figure>
        </section>
        <div className="ed-wrap heritage-line">
          <span>Photographing generations since 1982</span>
          <span>Personal guidance, from session to print</span>
          <span>A studio in the heart of Jetpur</span>
        </div>
        <section className="ed-wrap ed-section">
          <div className="ed-section-heading">
            <div>
              <p className="ed-kicker">What brings you here?</p>
              <h2>Every chapter deserves a place.</h2>
            </div>
            <Link to="/portfolios" className="ed-text-button">
              See the collections <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="chapter-grid">
            {[
              {
                slug: "baby",
                name: "Their little beginnings",
                label: "Baby & milestones",
                text: "Tiny expressions. Big feelings.",
              },
              {
                slug: "maternity",
                name: "Before we meet",
                label: "Maternity",
                text: "A beautiful chapter, just beginning.",
              },
              {
                slug: "family",
                name: "Together, as you are",
                label: "Family",
                text: "The people who make a home.",
              },
              {
                slug: "wedding",
                name: "A day. A lifetime.",
                label: "Weddings",
                text: "The moments between the moments.",
              },
            ].map((c, i) => (
              <Link
                to="/portfolios/$category"
                params={{ category: c.slug }}
                className="chapter-card"
                key={c.slug}
              >
                <div className="chapter-image">
                  <img
                    src={
                      c.slug === "family" ? "/editorial/family-hero.png" : `/demo/${c.slug}-1.svg`
                    }
                    alt={
                      c.slug === "family"
                        ? "Illustrative family portrait"
                        : `${c.label} image placeholder`
                    }
                    width="1200"
                    height="1500"
                    loading="lazy"
                  />
    
                </div>
                <div className="chapter-label">
                  <span>
                    0{i + 1} / {c.label}
                  </span>
                  <ArrowUpRight size={17} />
                </div>
                <h3>{c.name}</h3>
                <p>{c.text}</p>
              </Link>
            ))}
          </div>
        </section>
        <section className="story-feature">
          <div className="ed-wrap story-feature-inner">
            <figure>
              <img
                src="/editorial/family-hero.png"
                width="1536"
                height="1024"
                loading="lazy"
                alt="Fictional family used to demonstrate the story layout"
              />
              <figcaption className="concept-credit">Illustrative editorial image</figcaption>
            </figure>
            <div>
              <p className="ed-kicker">More than a single frame</p>
              <h2>
                A little laughter.
                <br />
                <em>A whole lot of love.</em>
              </h2>
              <p className="ed-copy">
                Explore how a complete session can bring together a child's personality, quiet
                parent moments and everyone in one frame.
              </p>

              <div className="ed-actions">
                <Link to="/stories" className="ed-button outline">
                  Explore the story <ArrowRight size={16} />
                </Link>
                <button
                  className="ed-text-button"
                  aria-pressed={saved}
                  onClick={() =>
                    setStyles(
                      saved
                        ? styles.filter((s) => s.id !== "demo-family-story")
                        : [
                            ...styles,
                            {
                              id: "demo-family-story",
                              title: "Family story concept",
                              image: "/editorial/family-hero.png",
                            },
                          ],
                    )
                  }
                >
                  {saved ? <Check size={16} /> : <Heart size={16} />}{" "}
                  {saved ? "Style saved" : "Save this style"}
                </button>
              </div>
            </div>
          </div>
        </section>
        <section className="ed-wrap ed-section">
          <div className="ed-section-heading">
            <div>
              <p className="ed-kicker">Your studio experience</p>
              <h2>
                Come as you are.
                <br />
                <em>We'll guide the rest.</em>
              </h2>
            </div>
            <p className="ed-copy narrow">
              From the first conversation to the final photograph, a little preparation makes room
              for natural moments.
            </p>
          </div>
          <div className="experience-grid">
            {[
              {
                n: "01",
                title: "A little planning",
                text: "Tell us the occasion, your ideas and the people joining you. We confirm the session details together.",
              },
              {
                n: "02",
                title: "Time to feel at home",
                text: "A relaxed pace, simple direction and space for breaks. We discuss what will make your family comfortable.",
              },
              {
                n: "03",
                title: "Your favourite frames",
                text: "Choose the photographs you love. Agree on the edits, print sizes and finishing details.",
              },
              {
                n: "04",
                title: "Something to keep",
                text: "Review the finished work and confirm collection or delivery. Originals and identity deserve care.",
              },
            ].map((s) => (
              <article key={s.n}>
                <span>{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="gift-feature ed-wrap">
          <div>
            <p className="ed-kicker">Off your phone. Into your life.</p>
            <h2>
              Memories you
              <br />
              <em>can hold.</em>
            </h2>
            <p className="ed-copy">
              Frames, albums, acrylic keepsakes and thoughtful gifts. Explore 18 product families,
              right down to the size and finish.
            </p>
            <Link to="/gifts" className="ed-button">
              Discover photo gifts <ArrowRight size={16} />
            </Link>
          </div>
          <figure>
            <img
              src="/editorial/gift-still-life.png"
              width="1536"
              height="1024"
              loading="lazy"
              alt="Illustrative photo gifts styled in a warm interior"
            />
            <figcaption className="concept-credit">Illustrative product styling · final selection confirmed by studio</figcaption>
          </figure>
        </section>
        <section className="ed-wrap ed-section closing-invite">
          <p className="ed-kicker">A conversation is a lovely place to start</p>
          <h2>
            What would you like
            <br />
            <em>to remember?</em>
          </h2>
          <a href={whatsappLink(waMessage.booking())} target="_blank" rel="noopener noreferrer" className="ed-button">
            Let's talk on WhatsApp <MessageCircle size={16}/>
          </a>
          <p className="ed-footnote">ગુજરાતીમાં વાત કરવી છે? અમે મદદ કરીશું.</p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
