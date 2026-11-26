import { useQuery } from "@tanstack/react-query";
import { siteContentQuery } from "@/lib/queries";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Heart, Check, MessageCircle } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { PhotographyChapters } from "@/components/photography-chapters";
import { StudioMap } from "@/components/studio-map";
import { HomePhotoCarousel } from "@/components/home-photo-carousel";
import { HomeGiftCollections } from "@/components/home-gift-collections";
import { HomeGalleryMarquee } from "@/components/home-gallery-marquee";
import "@/features/editorial/home-gallery.css";
import { useStyles } from "@/features/catalogue/store";
import { directionsLink, SITE, whatsappLink } from "@/lib/site";
import { canonicalFor } from "@/lib/seo";
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "Rajmoti Studio — Little moments. Lasting stories. | Jetpur" }, canonicalFor("/").ogUrl],
    links: canonicalFor("/").links,
  }),
  component: Home,
});
function Home() {
  const { data: content = {} } = useQuery(siteContentQuery);
  const contact = (content.contact ?? {}) as { address?: string; hours?: string };
  const address = contact.address?.trim() || SITE.location;
  const hero = content.hero?.published_from_admin === true ? content.hero as Record<string, unknown> : undefined;
  const heroText = (field: string) => {
    const value = hero?.[field];
    return typeof value === "string" ? value.trim() : "";
  };
  function heroLink(field: string, fallback: string) {
    const value = heroText(field);
    if (!value || /[\x00-\x20\\]/.test(value)) return fallback;
    const base = "https://rajmotistudio.in";
    if (value.startsWith("/") && URL.canParse(value, base) && new URL(value, base).origin === base) return value;
    if (/^https:\/\//i.test(value) && URL.canParse(value)) return value;
    return fallback;
  }
  const [styles, setStyles] = useStyles();
  const saved = styles.some((s) => s.id === "demo-family-story");
  return (
    <div className="editorial">
      <SiteNav />
      <main>
        <HomePhotoCarousel content={content.hero}>
          <p className="ed-kicker">{heroText("eyebrow") || "Jetpur, Gujarat · Since 1982"}</p>
          <h1>
            {heroText("heading") || "Little moments."}
            <br />
            <em>{heroText("heading_italic") || "Lasting stories."}</em>
          </h1>
          <p className="ed-copy">
            {heroText("description") || "Baby, maternity, family and wedding photography. Thoughtfully made, for the people who mean everything."}
          </p>
          <div className="ed-actions">
            <a href={heroLink("cta_primary_href", "/portfolios")} className="ed-button">
              {heroText("cta_primary_label") || "View photography"} <ArrowRight size={17} />
            </a>
            <a href={heroLink("cta_secondary_href", "/gifts")} className="ed-text-button">
              {heroText("cta_secondary_label") || "Shop photo gifts"} <ArrowUpRight size={16} />
            </a>
          </div>
        </HomePhotoCarousel>
        <div className="ed-wrap heritage-line">
          <span>Photographing generations since 1982</span>
          <span>Personal guidance, from session to print</span>
          <span>A studio in the heart of Jetpur</span>
        </div>
        <HomeGiftCollections />
        <PhotographyChapters showCollectionsLink />
        <section className="story-feature">
          <div className="ed-wrap story-feature-inner">
            <figure>
              <img
                src="/portfolio/family/8078c206caa42114f4da-large-03fae45dbaa3.webp"
                width="1536"
                height="1024"
                loading="lazy"
                alt="Rajmoti Studio family portrait with a young child"
              />
              <figcaption>Rajmoti Studio · Real family photography</figcaption>
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
                              title: "Family portraits",
                              image: "/portfolio/family/8078c206caa42114f4da-large-03fae45dbaa3.webp",
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
        <HomeGalleryMarquee />
        <section className="ed-wrap pb-16 sm:pb-24">
          <div className="flex flex-wrap items-end justify-between gap-4 border-t border-onyx/10 pt-10">
            <div>
              <h2>Visit the studio</h2>
              <p className="ed-copy mt-3">{address}</p>
              {contact.hours?.trim() && <p className="mt-2 text-sm">{contact.hours}</p>}
            </div>
            <a className="ed-text-button" href={directionsLink(`${SITE.name}, ${address}`)}>
              Get directions <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          </div>
          <StudioMap />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
