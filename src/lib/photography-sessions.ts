// Stable public session sections. Sample covers are reused from the earlier
// studio site and never serve as catalogue records or client photographs.
export const photographySessions = [
  {
    slug: "baby",
    label: "Baby",
    title: "Their little beginnings",
    copy: "Newborn portraits and first-year milestones, with time for breaks.",
    cover: "/portfolio/baby-milestone.webp",
  },
  {
    slug: "maternity",
    label: "Maternity",
    title: "Before we meet",
    copy: "Plan maternity portraits around a setting and look you feel comfortable in.",
    cover: "/portfolio/maternity-grace.svg",
  },
  {
    slug: "family",
    label: "Family",
    title: "Together, as you are",
    copy: "Natural family portraits, from little ones to grandparents.",
    cover: "/portfolio/family-heritage.webp",
  },
  {
    slug: "wedding",
    label: "Wedding",
    title: "A day. A lifetime.",
    copy: "Share your dates and venues to plan ceremony and candid coverage.",
    cover: "/portfolio/wedding-mandap.webp",
  },
] as const;

export function photographySession(slug: string) {
  return photographySessions.find((session) => session.slug === slug);
}
