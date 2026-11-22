import { useQuery } from "@tanstack/react-query";
import { categoriesQuery, siteContentQuery } from "@/lib/queries";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Heart, Check, MessageCircle } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { useStyles } from "@/features/catalogue/store";
import { whatsappLink } from "@/lib/site";
import { canonicalFor } from "@/lib/seo";
import { photographySessions } from "@/lib/photography-sessions";
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "Rajmoti Studio — Little moments. Lasting stories. | Jetpur" }, canonicalFor("/").ogUrl],
    links: canonicalFor("/").links,
  }),
  component: Home,
});
function Home() {
  const { data: content = {} } = useQuery(siteContentQuery);
  const { data: galleries = [] } = useQuery(categoriesQuery);
  const familyCover = galleries.find((gallery) =>
    ["baby", "family"].includes(gallery.slug) && gallery.cover_image_url &&
      !gallery.cover_image_url.startsWith("/demo/"),
  )?.cover_image_url;
  const candidate = content.hero?.images?.[0] || familyCover || content.hero?.fallback_image;
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
                View photography <ArrowRight size={17} />
              </Link>
              <Link to="/gifts" className="ed-text-button">
                Shop photo gifts <ArrowUpRight size={16} />
              </Link>
            </div>
            <div className="hero-signature">
              <span className="signature-line" />A family studio. A lifetime of memories.
            </div>
          </div>
          <figure className="home-hero-image">
            <picture>
              <source
                media="(max-width: 700px)"
                srcSet={customHero || "/editorial/family-hero-mobile.webp"}
              />
              <img
                src={customHero || "/editorial/family-hero.webp"}
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
            <figcaption>
              {customHero
                ? "Studio-selected photograph"
                : "Illustrative AI concept · not Rajmoti client work"}
            </figcaption>
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
            {photographySessions.map((session, index) => {
              const gallery = galleries.find((item) => item.slug === session.slug);
              const publishedCover = gallery?.cover_image_url;
              const familyConcept = session.slug === "family";
              const fallbackCover = familyConcept
                ? "/editorial/family-hero.webp"
                : `/demo/${session.slug}-1.svg`;
              return (
                <Link
                  to="/portfolios/$category"
                  params={{ category: session.slug }}
                  className="chapter-card"
                  key={session.slug}
                >
                  <div className="chapter-image">
                    <img
                      src={publishedCover || fallbackCover}
                      alt=""
                      width="1200"
                      height="1500"
                      loading="lazy"
                    />
                    {!publishedCover && (
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
            })}
          </div>
        </section>
        <section className="story-feature">
          <div className="ed-wrap story-feature-inner">
            <figure>
              <img
                src="/editorial/family-hero.webp"
                width="1536"
                height="1024"
                loading="lazy"
                alt="Illustrative family photography"
              />
              <figcaption>Illustrative portrait</figcaption>
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
                              image: "/editorial/family-hero.webp",
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
              src="/editorial/gift-still-life.webp"
              width="1536"
              height="1024"
              loading="lazy"
              alt="Illustrative photo gifts styled in a warm interior"
            />
            <figcaption>AI concept image · product availability to be confirmed</figcaption>
          </figure>
        </section>
        <section className="ed-wrap ed-section closing-invite">
          <p className="ed-kicker">A conversation is a lovely place to start</p>
          <h2>
            What would you like
            <br />
            <em>to remember?</em>
          </h2>
          <Link to="/contact" className="ed-button">
            Plan your session <ArrowUpRight size={16} />
          </Link>
          <p className="ed-footnote">ગુજરાતીમાં વાત કરવી છે? અમે મદદ કરીશું.</p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
