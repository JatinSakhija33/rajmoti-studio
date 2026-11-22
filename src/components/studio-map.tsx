import { useQuery } from "@tanstack/react-query";
import { mapsEmbedQuery } from "@/lib/queries";
import { googleMapsEmbedUrl, SITE } from "@/lib/site";

export function StudioMap() {
  const { data = "" } = useQuery(mapsEmbedQuery);

  return (
    <iframe
      title="Rajmoti Studio location on Google Maps"
      src={googleMapsEmbedUrl(data) ?? SITE.mapsEmbedUrl}
      width={600}
      height={450}
      className="mt-6 block h-[300px] w-full border-0 sm:h-[450px]"
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
    />
  );
}
