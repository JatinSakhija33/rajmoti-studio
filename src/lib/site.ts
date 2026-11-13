export const SITE = {
  name: "Rajmoti Studio",
  tagline: "Capturing Life's Most Beautiful Moments",
  email: "rajmotistudio@gmail.com",
  whatsapp: "+919429070317",
  instagram: "https://www.instagram.com/rajmoti_studio/",
  location: "Jetpur, Gujarat, PIN 360370",
  mapsUrl: "https://maps.app.goo.gl/nYgKFSidpihg1Nft6",
};

export function whatsappLink(message?: string, phone = SITE.whatsapp) {
  const p = phone.replace(/[^\d]/g, "");
  const text = encodeURIComponent(
    message ?? `Hello ${SITE.name}, I would like to know more about your photography services.`,
  );
  return `https://wa.me/${p}?text=${text}`;
}

/** Tap-to-call link for the studio line. */
export function telLink(phone = SITE.whatsapp) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/** Opens the verified studio location in Google Maps. */
export function directionsLink() {
  return SITE.mapsUrl;
}

/** Canonical Instagram profile URL (also used by the "Follow" button). */
export function instagramProfileUrl() {
  return SITE.instagram;
}

/** @handle derived from the profile URL. */
export function instagramHandle() {
  const m = SITE.instagram.match(/instagram\.com\/([^/?#]+)/i);
  return `@${m?.[1] ?? "rajmoti_studio"}`;
}

/** Context-aware WhatsApp openers so every enquiry arrives with its subject. */
export const waMessage = {
  general: () => `Hello Rajmoti Studio! I visited your website and would like to enquire about photography or prints. Please share the details.`,
  customerFollowUp: (name: string, subject = "your photography or print order") =>
    `Namaste ${name.trim() || "there"}, this is Rajmoti Studio, Jetpur. We are following up about ${subject}. Please let us know a convenient time to talk. Thank you!`,
  customerReady: (name: string, service: string) =>
    `Namaste ${name.trim() || "there"}, this is Rajmoti Studio, Jetpur. Your ${service} is ready. Please contact us to confirm collection or delivery. Thank you!`,
  category: (name: string) => `Hello ${SITE.name}, I'd like to know more about ${name}.`,
  package: (name: string) => `Hello ${SITE.name}, I'm interested in the ${name} package.`,
  photo: (title?: string | null) =>
    `Hello ${SITE.name}, I love the ${title ? `"${title}" ` : ""}photograph on your website — could we discuss a similar session?`,
  /**
   * Enquiry about a specific photograph. Only ever references the public
   * website photo page — never a storage URL, signed link or filename.
   */
  photoDetailed: (o: {
    category?: string | null;
    subcategory?: string | null;
    title?: string | null;
    /** Public site URL such as https://site/photo/7c6ca4fe3f */
    photoUrl?: string | null;
  }) => {
    const where = o.subcategory
      ? `from your ${o.subcategory} collection`
      : o.category
        ? `in your ${o.category} portfolio`
        : "on your website";
    const lines = [
      `Hello ${SITE.name} 👋`,
      "",
      `I saw this photograph ${where} and really liked this style.`,
    ];
    if (o.title) lines.push("", `Photograph: ${o.title}`);
    if (o.photoUrl) lines.push("", "📸 View photograph:", o.photoUrl);
    lines.push("", "Could you please share availability and pricing?");
    return lines.join("\n");
  },

  booking: () => `Hello ${SITE.name}, I'd like to check availability for a session.`,

  /**
   * "I want a reel like this" — only ever references the public
   * /reel/<short_id> page, never a storage URL, signed link or internal id.
   */
  reel: (o: { title?: string | null; category?: string | null; reelUrl?: string | null; packageName?: string | null; price?: string | null }) => {
    const lines = [
      `Hello ${SITE.name} 👋`,
      "",
      "I saw this cinematic reel on your website and I'd love to create something similar.",
    ];
    if (o.title) lines.push("", `Reel: ${o.title}${o.category ? ` (${o.category})` : ""}`);
    if (o.reelUrl) lines.push("", "🎬 Watch:", o.reelUrl);
    if (o.packageName) lines.push("", `Package: ${o.packageName}${o.price ? ` (${o.price})` : ""}`);
    lines.push("", "Could you please share availability and pricing?");
    return lines.join("\n");
  },

  /** Package-specific cinematic booking enquiry — price comes from the CMS. */
  reelPackage: (o: { packageName: string; price: string }) =>
    [
      `Hello ${SITE.name} 👋`,
      "",
      `I'm interested in your ${o.packageName} (${o.price}).`,
      "",
      "I'd like to know about availability and booking.",
    ].join("\n"),

  /** Cinematic service enquiry without a specific reel or package. */
  cinematic: () =>
    [
      `Hello ${SITE.name} 👋`,
      "",
      "I'd like to book a cinematic reel shoot.",
      "",
      "Could you please share availability and pricing?",
    ].join("\n"),


  /**
   * Service-led enquiry from the "Let's plan your shoot" page. Only ever
   * references public website URLs — never storage links or internal IDs.
   */
  service: (o: { title: string; portfolioUrl?: string | null; note?: string | null }) => {
    const lines = [
      `Hello ${SITE.name} 👋`,
      "",
      `I'm interested in ${o.title} photography.`,
    ];
    if (o.note?.trim()) lines.push("", o.note.trim());
    if (o.portfolioUrl) lines.push("", "I was looking at:", o.portfolioUrl);
    lines.push("", "Could you please share availability and pricing?");
    return lines.join("\n");
  },

};



export function formatPrice(value: number | null | undefined, currency = "INR") {
  if (value == null) return "On request";
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${value}`;
  }
}
