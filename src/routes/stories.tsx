import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { SaveStyle } from "@/features/editorial/shortlist";
import { Lightbox } from "@/components/lightbox";
export const Route = createFileRoute("/stories")({
  head: () => ({ meta: [{ title: "Stories & the studio experience — Rajmoti Studio" }] }),
  component: Stories,
});
function Stories() {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const images = [
    {
      src: "/demo/baby-1.svg",
      title: "The little personality",
      caption: "Gentle natural-light baby portraiture in our Jetpur studio",
    },
    {
      src: "/demo/maternity-1.svg",
      title: "A quiet moment with mother",
      caption: "Maternal warmth and quiet milestone bonds",
    },
    {
      src: "/demo/family-2.svg",
      title: "Laughter with father",
      caption: "Candid milestone memories preserved forever",
    },
    {
      src: "/editorial/family-hero.png",
      title: "Everyone, together",
      caption: "Multi-generation family portraiture session",
    },
  ];
  return (
    <div className="editorial">
      <SiteNav />
      <main>
        <section className="ed-wrap story-header">
          <p className="ed-kicker">The stories we keep</p>
          <h1>
            One session.
            <br />
            <em>So many ways to remember.</em>
          </h1>
          <p className="ed-copy">
            A complete story makes space for individuals, relationships and the whole family.
            Explore the layout below, then save the moments you would like in your own session.
          </p>
          <p className="ed-notice">
            This is an illustrative session storyboard. Real, consented client photographs and
            reviews will replace these examples.
          </p>
        </section>
        <section className="ed-wrap story-sequence">
          {images.map((im, i) => (
            <article key={im.title}>
              <button aria-label={`Open story photograph ${i + 1}`} onClick={() => setLightbox(i)}>
                <img
                  src={im.src}
                  alt={im.caption}
                  width="1200"
                  height="1500"
                  loading={i ? "lazy" : "eager"}
                />
              </button>
              <div>
                <p className="ed-kicker">Chapter 0{i + 1}</p>
                <h2>{im.title}</h2>
                <p>{im.caption}</p>
                <SaveStyle style={{ id: `demo-story-${i + 1}`, title: im.title, image: im.src }} />
              </div>
            </article>
          ))}
        </section>
        <section className="ed-wrap care-section">
          <div>
            <p className="ed-kicker">The care behind the image</p>
            <h2>
              Still you.
              <br />
              <em>Beautifully remembered.</em>
            </h2>
            <p>
              Our editing brief is simple: preserve the face, expression and details that make a
              photograph yours. Discuss backgrounds, colour and retouching before the final version.
            </p>
          </div>
          <div className="care-list">
            <article>
              <h3>Prepare together</h3>
              <p>
                Talk through clothing, your preferred style, family members and breaks before the
                session.
              </p>
            </article>
            <article>
              <h3>Choose with confidence</h3>
              <p>Shortlist your favourite frames and review the agreed edits before printing.</p>
            </article>
            <article>
              <h3>Keep the originals safe</h3>
              <p>
                Work from separate edited copies and check names, crops and print sizes carefully.
              </p>
            </article>
          </div>
        </section>
        <section className="ed-wrap closing-invite">
          <h2>
            Make room for <em>your story.</em>
          </h2>
          <Link to="/contact" search={{ session: "Family" }} className="ed-button">
            Enquire about a family session <ArrowRight size={16} />
          </Link>
        </section>
      </main>
      <SiteFooter />
      {lightbox !== null && (
        <Lightbox
          images={images}
          startIndex={lightbox}
          onClose={() => setLightbox(null)}
          enquiryContext="Family story"
        />
      )}
    </div>
  );
}
