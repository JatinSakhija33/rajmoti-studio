import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { categoriesQuery } from "@/lib/queries";
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
  const { data: galleries = [] } = useQuery(categoriesQuery);
  const images = galleries.flatMap((gallery) =>
    gallery.cover_image_url
      ? [
          {
            src: gallery.cover_image_url,
            title: gallery.name,
            caption: gallery.description || `${gallery.name} photography`,
            id: gallery.id,
          },
        ]
      : [],
  );
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
            A complete story makes space for individuals, relationships and the whole family. Browse
            photographs from the studio and save styles you would like to discuss.
          </p>
          {!images.length && (
            <Link to="/portfolios" className="ed-text-button">
              Explore the photography portfolio <ArrowRight size={16} />
            </Link>
          )}
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
                <SaveStyle
                  style={{ id: `studio-story-${im.id}`, title: im.title, image: im.src }}
                />
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
      {lightbox !== null && images[lightbox] && (
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
