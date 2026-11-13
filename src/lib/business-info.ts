/**
 * RAJMOTI STUDIO — AUTHORITATIVE BUSINESS INFORMATION REGISTRY
 *
 * Single source of truth for business information, physical location,
 * contact channels, service scopes, and verification status.
 *
 * Rules:
 * - Unverified or pending fields MUST NOT be emitted in public SEO / schema.
 * - Facts must originate from the owner, official business records, or verified listings.
 * - No AI creativity or assumed luxury photography claims.
 */

export type VerificationStatus = "verified" | "pending_owner_confirmation" | "unverified";

export interface BusinessFact<T = string> {
  key: string;
  label: string;
  value: T;
  status: VerificationStatus;
  lastUpdated: string; // ISO date string (YYYY-MM-DD)
  source?: string;
  isPublic: boolean;
  ownerApproved: boolean;
  notes?: string;
}

export interface BusinessRegistry {
  studioName: BusinessFact<string>;
  establishmentYear: BusinessFact<number>;
  city: BusinessFact<string>;
  region: BusinessFact<string>;
  postalCode: BusinessFact<string>;
  country: BusinessFact<string>;
  exactAddress: BusinessFact<string>;
  landmark: BusinessFact<string>;
  googleMapsListing: BusinessFact<string>;
  phone: BusinessFact<string>;
  whatsapp: BusinessFact<string>;
  email: BusinessFact<string>;
  openingHours: BusinessFact<string>;
  photographyServices: BusinessFact<string[]>;
  printingAndGiftServices: BusinessFact<string[]>;
  deliveryAreas: BusinessFact<string[]>;
  productMaterials: BusinessFact<string[]>;
  approvedServicePromises: BusinessFact<string[]>;
}

export const RAJMOTI_BUSINESS_REGISTRY: BusinessRegistry = {
  studioName: {
    key: "studioName",
    label: "Studio Legal & Commercial Name",
    value: "Rajmoti Studio",
    status: "verified",
    lastUpdated: "2026-11-14",
    source: "Owner business registration & storefront",
    isPublic: true,
    ownerApproved: true,
  },
  establishmentYear: {
    key: "establishmentYear",
    label: "Year of Establishment",
    value: 1982,
    status: "verified",
    lastUpdated: "2026-11-14",
    source: "Owner confirmation",
    isPublic: true,
    ownerApproved: true,
    notes: "Owner-confirmed establishment year: 1982.",
  },
  city: {
    key: "city",
    label: "City / Town",
    value: "Jetpur",
    status: "verified",
    lastUpdated: "2026-11-14",
    source: "Google Maps verified location",
    isPublic: true,
    ownerApproved: true,
  },
  region: {
    key: "region",
    label: "State / District",
    value: "Gujarat",
    status: "verified",
    lastUpdated: "2026-11-14",
    source: "Official postal jurisdiction",
    isPublic: true,
    ownerApproved: true,
  },
  postalCode: {
    key: "postalCode",
    label: "Postal PIN Code",
    value: "360370",
    status: "verified",
    lastUpdated: "2026-11-14",
    source: "India Post Jetpur SO",
    isPublic: true,
    ownerApproved: true,
  },
  country: {
    key: "country",
    label: "Country",
    value: "IN",
    status: "verified",
    lastUpdated: "2026-11-14",
    source: "India",
    isPublic: true,
    ownerApproved: true,
  },
  exactAddress: {
    key: "exactAddress",
    label: "Exact Shop Street Address",
    value: "Kanakia Plot, near Kamlesh Farsan, Natraj Loge, Jetpur, Gujarat 360370",
    status: "pending_owner_confirmation",
    lastUpdated: "2026-11-14",
    source: "Third-party public listing (unconfirmed by owner)",
    isPublic: false, // NOT public until owner confirms exact storefront location
    ownerApproved: false,
    notes: "Do not display as final storefront address until owner explicitly verifies.",
  },
  landmark: {
    key: "landmark",
    label: "Prominent Landmark",
    value: "",
    status: "unverified",
    lastUpdated: "2026-11-14",
    isPublic: false,
    ownerApproved: false,
    notes: "Old 'Near Rajmoti Cinema' claim removed as unverified.",
  },
  googleMapsListing: {
    key: "googleMapsListing",
    label: "Verified Google Maps Business URL",
    value: "https://maps.app.goo.gl/nYgKFSidpihg1Nft6",
    status: "verified",
    lastUpdated: "2026-11-14",
    source: "Google Maps Business Profile link provided by owner",
    isPublic: true,
    ownerApproved: true,
  },
  phone: {
    key: "phone",
    label: "Studio Direct Telephone",
    value: "+919429070317",
    status: "verified",
    lastUpdated: "2026-11-14",
    source: "Owner verified mobile line",
    isPublic: true,
    ownerApproved: true,
  },
  whatsapp: {
    key: "whatsapp",
    label: "Official WhatsApp Business Line",
    value: "+919429070317",
    status: "verified",
    lastUpdated: "2026-11-14",
    source: "Active wa.me contact channel",
    isPublic: true,
    ownerApproved: true,
  },
  email: {
    key: "email",
    label: "Public Business Inquiries Email",
    value: "rajmotistudio@gmail.com",
    status: "verified",
    lastUpdated: "2026-11-14",
    source: "Owner verified email contact",
    isPublic: true,
    ownerApproved: true,
  },
  openingHours: {
    key: "openingHours",
    label: "Studio Visiting & Operating Hours",
    value: "",
    status: "unverified",
    lastUpdated: "2026-11-14",
    isPublic: false, // UNVERIFIED: do not publish until confirmed by owner
    ownerApproved: false,
    notes: "Previously generated 9am-8pm removed as unverified.",
  },
  photographyServices: {
    key: "photographyServices",
    label: "Active Photography Disciplines",
    value: [
      "Baby & Milestone Photography",
      "Maternity & Motherhood Portraits",
      "Family Portraits",
      "Wedding & Mandap Photography",
      "Birthday & Milestone Sessions",
      "Pre-Wedding Couple Stories",
      "Photo Restoration & Archival Reproduction",
    ],
    status: "verified",
    lastUpdated: "2026-11-14",
    source: "Portfolio catalogue & studio offerings",
    isPublic: true,
    ownerApproved: true,
  },
  printingAndGiftServices: {
    key: "printingAndGiftServices",
    label: "Personalized Photo Printing & Gifting Services",
    value: [
      "Personalized Photo Frames & Collages",
      "Ceramic & Magic Reveal Photo Mugs",
      "Backlit LED Translights",
      "Sacred Devotional Prints & Shrines",
      "Double-Sided Keepsake Keychains",
      "Photobooks & Magazines",
    ],
    status: "verified",
    lastUpdated: "2026-11-14",
    source: "Active live preview catalogue",
    isPublic: true,
    ownerApproved: true,
  },
  deliveryAreas: {
    key: "deliveryAreas",
    label: "Approved Delivery & Fulfilment Scope",
    value: ["Jetpur"],
    status: "verified",
    lastUpdated: "2026-11-14",
    source: "Local studio counter pickup & confirmed Jetpur delivery",
    isPublic: true,
    ownerApproved: true,
    notes: "Areas outside Jetpur (Gondal, Rajkot, etc.) remain subject to individual studio confirmation.",
  },
  productMaterials: {
    key: "productMaterials",
    label: "Frame & Product Material Options",
    value: [
      "Wooden Moulding Frame (Teak Finish / Charcoal Matte / Gold Finish)",
      "Acrylic Sheet / Acrylic Block",
      "Ceramic Sublimation Mugs",
      "Edge-Lit LED Translight Lightboxes",
    ],
    status: "verified",
    lastUpdated: "2026-11-14",
    source: "Actual framing inventory",
    isPublic: true,
    ownerApproved: true,
    notes: "Invented claims ('Genuine Saurashtra Teak', 'Diamond-polished floating acrylic') removed.",
  },
  approvedServicePromises: {
    key: "approvedServicePromises",
    label: "Approved Customer Service Commitments",
    value: [
      "Original customer photos preserved without server uploads during preview",
      "Digital proofing and customization confirmation via WhatsApp before production",
      "Full prepayment required for home delivery orders; no Cash on Delivery",
      "Counter collection with pay-at-studio option available in Jetpur",
    ],
    status: "verified",
    lastUpdated: "2026-11-14",
    source: "Owner payment & privacy directives",
    isPublic: true,
    ownerApproved: true,
  },
};

/**
 * Returns public-safe, verified business details.
 * Any unverified or unapproved field falls back to null/empty.
 */
export function getVerifiedBusinessInfo() {
  const r = RAJMOTI_BUSINESS_REGISTRY;
  return {
    name: r.studioName.value,
    sinceYear: r.establishmentYear.ownerApproved ? r.establishmentYear.value : null,
    city: r.city.value,
    region: r.region.value,
    postalCode: r.postalCode.value,
    country: r.country.value,
    mapsUrl: r.googleMapsListing.value,
    phone: r.phone.value,
    whatsapp: r.whatsapp.value,
    email: r.email.value,
    // Exact address is only returned if owner-approved
    streetAddress: r.exactAddress.ownerApproved && r.exactAddress.isPublic ? r.exactAddress.value : null,
    // Opening hours only returned if verified
    openingHours: r.openingHours.ownerApproved && r.openingHours.isPublic ? r.openingHours.value : null,
    serviceAreas: r.deliveryAreas.value,
  };
}
