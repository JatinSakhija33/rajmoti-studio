import { SITE } from "@/lib/site";

/** Production origin used for canonical + Open Graph URLs. */
export const SITE_URL = (import.meta.env.VITE_PUBLIC_SITE_URL || "https://rajmotistudio.lovable.app").replace(/\/$/, "");

/** Single source of truth for the local business entity. */
export const STUDIO = {
  name: SITE.name,
  city: "Jetpur",
  region: "Gujarat",
  country: "IN",
  phone: SITE.whatsapp,
  email: SITE.email,
  instagram: SITE.instagram,
  /** Only genuinely served areas — never invent branches. */
  serviceAreas: ["Jetpur", "Rajkot"],
} as const;

export function absUrl(path: string) {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Canonical <link> + og:url pair for a public route. */
export function canonicalFor(path: string) {
  return {
    links: [{ rel: "canonical", href: absUrl(path) }],
    ogUrl: { property: "og:url", content: absUrl(path) },
  };
}

export function localBusinessJsonLd(googleProfileUrl?: string | null) {
  const sameAs = [STUDIO.instagram, googleProfileUrl].filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "PhotographyBusiness",
    name: STUDIO.name,
    url: SITE_URL,
    telephone: STUDIO.phone,
    email: STUDIO.email,
    image: absUrl("/favicon.ico"),
    address: {
      "@type": "PostalAddress",
      addressLocality: STUDIO.city,
      addressRegion: STUDIO.region,
      addressCountry: STUDIO.country,
    },
    areaServed: STUDIO.serviceAreas.map((a) => ({ "@type": "Place", name: a })),
    sameAs,
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absUrl(it.path),
    })),
  };
}

export function serviceJsonLd(o: { name: string; description: string; path: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: o.name,
    description: o.description,
    serviceType: o.name,
    url: absUrl(o.path),
    areaServed: STUDIO.serviceAreas.map((a) => ({ "@type": "Place", name: a })),
    provider: {
      "@type": "PhotographyBusiness",
      name: STUDIO.name,
      address: {
        "@type": "PostalAddress",
        addressLocality: STUDIO.city,
        addressRegion: STUDIO.region,
        addressCountry: STUDIO.country,
      },
    },
  };
}

export type Faq = { q: string; a: string };

export function faqJsonLd(faqs: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export type CategorySeo = {
  h1: string;
  title: string;
  description: string;
  intro: string;
  /** Short, honest list of what is actually photographed in this category. */
  covers: string[];
  faqs: Faq[];
  related: { label: string; slug: string }[];
  instagramLine: string;
};

const MAP: Record<string, Omit<CategorySeo, "related"> & { related: { label: string; slug: string }[] }> = {
  baby: {
    h1: "Baby Photography in Jetpur",
    title: "Baby Photography in Jetpur | Rajmoti Studio",
    description:
      "Baby and newborn photography at Rajmoti Studio in Jetpur, Gujarat — milestone, themed and cake smash sessions for families from Jetpur, Rajkot and nearby towns.",
    intro:
      "Rajmoti Studio photographs babies at our studio in Jetpur, Gujarat — newborn sittings, monthly milestones, themed sets and first-birthday cake smash sessions. Sessions move at the baby's pace, with feeding and settling breaks built in, and parents and siblings are welcome in the frame.",
    covers: [
      "Newborn sessions in the first weeks",
      "Monthly milestone portraits",
      "Themed baby sets",
      "Cake smash and first birthday",
      "Baby with parents and siblings",
      "Studio and outdoor sessions",
    ],
    faqs: [
      {
        q: "When is the best time for a newborn photoshoot?",
        a: "Newborn sessions are usually planned within the first two to three weeks, when babies sleep deeply and curl naturally. If that window has passed, milestone sessions work beautifully at any age.",
      },
      {
        q: "Can parents and siblings be part of the session?",
        a: "Yes. Most families photograph the baby alone as well as with parents, siblings and grandparents during the same session.",
      },
      {
        q: "Can we choose a theme or setup?",
        a: "Yes. We plan the theme, props and colour palette with you before the session so the set is ready when you arrive.",
      },
      {
        q: "What should we bring to a baby photoshoot?",
        a: "Feeds, an extra change of clothes, a favourite blanket or toy, and any outfits you would like photographed. Everything else is arranged at the studio.",
      },
      {
        q: "How much does a baby photoshoot cost?",
        a: "Pricing depends on the session length and the number of edited photographs. Current collections and inclusions are listed on our packages page, and we confirm the exact figure on WhatsApp before booking.",
      },
      {
        q: "Do you photograph first birthdays?",
        a: "Yes — cake smash and first-birthday sessions are photographed at the studio, and can also be arranged on location around Jetpur.",
      },
    ],
    related: [
      { label: "Maternity Photography", slug: "maternity" },
      { label: "Family Portraits", slug: "family" },
    ],
    instagramLine: "See more baby sessions on Instagram",
  },
  maternity: {
    h1: "Maternity Photography in Jetpur",
    title: "Maternity Photography in Jetpur | Rajmoti Studio",
    description:
      "Maternity and pregnancy photoshoots at Rajmoti Studio in Jetpur, Gujarat — studio and outdoor portraits for mothers-to-be, couples and families from Jetpur and Rajkot.",
    intro:
      "Maternity sessions at Rajmoti Studio are calm and unhurried. We photograph mothers-to-be in the studio in Jetpur or outdoors nearby, with the option to include your partner, older children or family in part of the session.",
    covers: [
      "Studio maternity portraits",
      "Outdoor maternity sessions",
      "Couple maternity photography",
      "Maternity with older children",
      "Traditional and draped looks",
    ],
    faqs: [
      {
        q: "When should we schedule a maternity photoshoot?",
        a: "Most mothers photograph between the seventh and eighth month, when the bump is clearly visible and moving around is still comfortable.",
      },
      {
        q: "Can my partner be part of the photoshoot?",
        a: "Yes. Couple portraits are part of most maternity sessions, and older children or family can join for a set of frames.",
      },
      {
        q: "What should we wear for a maternity session?",
        a: "Fitted fabrics that show the shape of the bump photograph best. Bring two or three outfits and we will help you choose on the day.",
      },
      {
        q: "Do you photograph maternity sessions outdoors?",
        a: "Yes — outdoor sessions are planned around early morning or late-afternoon light at locations near Jetpur.",
      },
    ],
    related: [
      { label: "Baby Photography", slug: "baby" },
      { label: "Family Portraits", slug: "family" },
    ],
    instagramLine: "See our latest maternity work on Instagram",
  },
  family: {
    h1: "Family Photography in Jetpur",
    title: "Family Photography in Jetpur | Rajmoti Studio",
    description:
      "Family portraits and photoshoots at Rajmoti Studio in Jetpur, Gujarat — parents, children, siblings and grandparents, photographed in studio or on location near Jetpur and Rajkot.",
    intro:
      "Family sessions at Rajmoti Studio bring everyone into the same frame — parents, children, siblings and grandparents. We photograph in the studio in Jetpur or on location nearby, and keep sessions relaxed enough for young children.",
    covers: [
      "Studio family portraits",
      "Outdoor family sessions",
      "Kids and sibling portraits",
      "Three-generation family photographs",
      "Birthday and celebration sessions",
    ],
    faqs: [
      {
        q: "Can grandparents join the family session?",
        a: "Yes. Three-generation portraits are one of the most requested family sessions at the studio.",
      },
      {
        q: "Can siblings be photographed together?",
        a: "Yes — sibling portraits are usually photographed alongside the full family frames in the same session.",
      },
      {
        q: "Do you offer outdoor family sessions?",
        a: "Yes. Outdoor family sessions are scheduled around soft morning or evening light at locations around Jetpur.",
      },
      {
        q: "How long does a family photoshoot take?",
        a: "Most family sessions take between one and two hours, depending on the number of people and outfit changes.",
      },
    ],
    related: [
      { label: "Baby Photography", slug: "baby" },
      { label: "Maternity Photography", slug: "maternity" },
    ],
    instagramLine: "See more family sessions on Instagram",
  },
  wedding: {
    h1: "Wedding Photography in Jetpur",
    title: "Wedding Photography in Jetpur | Rajmoti Studio",
    description:
      "Wedding photography by Rajmoti Studio, Jetpur — candid and traditional coverage, couple portraits and pre-wedding sessions for weddings in Jetpur, Rajkot and nearby.",
    intro:
      "Rajmoti Studio photographs weddings in and around Jetpur, Gujarat — candid coverage through the ceremonies alongside traditional portraits of the couple and both families. Pre-wedding sessions can be planned separately before the wedding days.",
    covers: [
      "Candid wedding coverage",
      "Traditional wedding portraits",
      "Couple portraits",
      "Pre-wedding sessions",
      "Family and group photographs",
    ],
    faqs: [
      {
        q: "How do we book wedding photography?",
        a: "Message the studio on WhatsApp with your wedding dates and venue. We confirm availability, share coverage options and hold the date once the booking is confirmed.",
      },
      {
        q: "How far in advance should we book?",
        a: "Wedding dates are held on a first-confirmed basis, so it is best to check availability as soon as your dates are fixed.",
      },
      {
        q: "Do you photograph pre-wedding sessions?",
        a: "Yes. Pre-wedding sessions are photographed separately, usually outdoors, and can be planned around your schedule.",
      },
      {
        q: "Do you travel outside Jetpur for weddings?",
        a: "Yes — we regularly photograph weddings for families from Rajkot and surrounding areas. Travel is discussed upfront.",
      },
    ],
    related: [{ label: "Family Portraits", slug: "family" }],
    instagramLine: "See recent wedding work on Instagram",
  },
};

/** Per-category SEO copy, with a safe generic fallback for other categories. */
export function categorySeo(slug: string, name: string, description?: string | null): CategorySeo {
  const preset = MAP[slug];
  if (preset) return preset;
  const clean = name.replace(/\s+Photography$/i, "").replace(/\s+Portraits$/i, "");
  return {
    h1: `${name} — Rajmoti Studio, Jetpur`,
    title: `${name} in Jetpur | Rajmoti Studio`,
    description:
      description ||
      `${name} by Rajmoti Studio, a photography studio in Jetpur, Gujarat serving families from Jetpur, Rajkot and nearby areas.`,
    intro:
      description ||
      `${clean} photographed by Rajmoti Studio at our studio in Jetpur, Gujarat.`,
    covers: [],
    faqs: [],
    related: [
      { label: "Baby Photography", slug: "baby" },
      { label: "Family Portraits", slug: "family" },
    ],
    instagramLine: "See our latest work on Instagram",
  };
}
