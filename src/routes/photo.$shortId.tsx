import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { photoByShortIdQuery } from "@/lib/queries";
import { publicImageTitle, variantUrl } from "@/lib/images";
import { waMessage, whatsappLink } from "@/lib/site";

export const Route = createFileRoute("/photo/$shortId")({
  head: () => ({
    meta: [
      { title: "Photograph | Rajmoti Studio" },
      { name: "description", content: "A photograph from the Rajmoti Studio portfolio — Jetpur, Gujarat." },
      { property: "og:title", content: "Photograph | Rajmoti Studio" },
      { property: "og:description", content: "A photograph from the Rajmoti Studio portfolio — Jetpur, Gujarat." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async ({ context, params }) => {
    const photo = await context.queryClient.ensureQueryData(photoByShortIdQuery(params.shortId));
    if (!photo) throw notFound();
  },
  component: PhotoPage,
});

function PhotoPage() {
  const { shortId } = Route.useParams();
  const { data: photo } = useSuspenseQuery(photoByShortIdQuery(shortId));
  if (!photo) return null;

  const category = (photo as any).categories?.name as string | undefined;
  const subcategory = (photo as any).subcategories?.name as string | undefined;
  const title = publicImageTitle(photo.title);
  const message = waMessage.photoDetailed({
    category,
    subcategory,
    title,
    photoUrl: typeof window !== "undefined" ? `${window.location.origin}/photo/${shortId}` : undefined,
  });

  return (
    <div className="container-page py-16 md:py-24">
      <nav className="eyebrow text-muted-foreground mb-8">
        <Link to="/portfolios" className="hover:text-gold">Portfolios</Link>
        {category && <span> / {category}</span>}
      </nav>

      <div className="grid gap-10 md:grid-cols-[1.4fr_1fr] items-start">
        <img
          src={variantUrl(photo as any, "large")}
          alt={publicImageTitle(photo.alt_text) || title || category || "Photograph by Rajmoti Studio"}
          width={photo.width ?? undefined}
          height={photo.height ?? undefined}
          className="w-full bg-onyx/5"
        />
        <div>
          {title && <h1 className="font-display text-3xl italic mb-3">{title}</h1>}
          {!title && <h1 className="font-display text-3xl italic mb-3">{category ?? "Photograph"}</h1>}
          {photo.description && <p className="text-sm text-muted-foreground mb-6">{photo.description}</p>}
          <p className="eyebrow text-muted-foreground mb-8">
            {[category, subcategory, (photo as any).theme].filter(Boolean).join(" · ")}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link to="/book" className="px-5 py-2.5 bg-onyx text-cream eyebrow hover:bg-gold hover:text-onyx transition-colors">
              Book a session
            </Link>
            <a
              href={whatsappLink(message)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 border border-onyx/20 eyebrow inline-flex items-center gap-2 hover:border-gold hover:text-gold transition-colors"
            >
              <MessageCircle className="size-4" aria-hidden /> Enquire on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
