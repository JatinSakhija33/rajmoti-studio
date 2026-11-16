// Curated Gift Bundles & Merchandising Sets for Rajmoti Studio
// Increases Average Order Value (AOV) while delivering genuine savings and emotional completeness.

export interface BundleItem {
  id: string;
  name: string;
  spec: string;
  image: string;
  individualPrice: number;
}

export interface GiftBundle {
  id: string;
  name: string;
  tagline: string;
  occasion: string;
  badge: string;
  bundlePrice: number;
  originalPrice: number;
  savings: number;
  heroImage: string;
  items: BundleItem[];
  emotionalStory: string;
  whatsAppMessage: string;
}

export const CURATED_BUNDLES: GiftBundle[] = [
  {
    id: "anniversary-memory-set",
    name: "Anniversary Keepsake Memory Set",
    tagline: "The complete celebration for your favourite milestone.",
    occasion: "anniversary",
    badge: "Save ₹248",
    bundlePrice: 1699,
    originalPrice: 1947,
    savings: 248,
    heroImage: "/products/frame-sample-anniversary.jpg",
    emotionalStory: "Designed for couples celebrating their milestone years. Features a handcrafted wall frame for home, a morning magic reveal mug for daily tea, and a matching pocket keychain to carry everywhere.",
    whatsAppMessage: "Namaste Rajmoti Studio! 💍 I would like to order the 'Anniversary Keepsake Memory Set' (₹1,699). Please guide me on sharing our couple photos.",
    items: [
      {
        id: "wooden-frame-12x18",
        name: "Royal Heritage Anniversary Frame",
        spec: "12×18 in · Natural Teak Finish Wood",
        image: "/products/frame-sample-anniversary.jpg",
        individualPrice: 1499,
      },
      {
        id: "magic-photo-mug",
        name: "Thermochromic Magic Photo Mug",
        spec: "325 ml · Hot Chai Heat Reveal",
        image: "/products/mug-sample-couple.jpg",
        individualPrice: 349,
      },
      {
        id: "keychain-couple",
        name: "Double-Sided Couple Keychain",
        spec: "Dual-photo high-gloss acrylic",
        image: "/products/frame-sample-wedding.jpg",
        individualPrice: 99,
      },
    ],
  },
  {
    id: "baby-first-year-collection",
    name: "Baby's First Milestone Collection",
    tagline: "Capture every toothless grin and wobbly first step.",
    occasion: "baby",
    badge: "Save ₹500",
    bundlePrice: 1999,
    originalPrice: 2499,
    savings: 500,
    heroImage: "/portfolio/baby-milestone.jpg",
    emotionalStory: "Babies grow up before we know it. This set pairs a multi-slot milestone frame with an archival lay-flat editorial photobook to preserve their entire first 12 months.",
    whatsAppMessage: "Namaste Rajmoti Studio! 👶 I want to order the 'Baby's First Milestone Collection' (₹1,999) for my child's milestone photos.",
    items: [
      {
        id: "baby-collage-14x20",
        name: "First Year 5-Photo Milestone Frame",
        spec: "14×20 in · Matte Charcoal Border",
        image: "/products/frame-sample-baby.jpg",
        individualPrice: 1699,
      },
      {
        id: "baby-soft-book",
        name: "Milestone Keepsake Photobook",
        spec: "8×8 in · 16 Pages Heavy Matte Paper",
        image: "/products/magazine-cover.jpg",
        individualPrice: 800,
      },
    ],
  },
  {
    id: "devotional-sanctum-set",
    name: "Sacred Mandir Sanctum Set",
    tagline: "Auspicious blessings and peaceful glowing presence for Gujarati homes.",
    occasion: "devotional",
    badge: "Save ₹348",
    bundlePrice: 1850,
    originalPrice: 2198,
    savings: 348,
    heroImage: "/deities/shrinathji.jpg",
    emotionalStory: "Combines an edge-lit LED Translight that softly illuminates your puja room during morning and evening aarti with an optical acrylic swaroop for your personal desk or car dashboard.",
    whatsAppMessage: "Namaste Rajmoti Studio! 🙏 I want to order the 'Sacred Mandir Sanctum Set' (₹1,850) with Shri Dwarkadhish swaroop.",
    items: [
      {
        id: "translight-12x18",
        name: "Backlit LED Translight Swaroop",
        spec: "12×18 in · High-Diffusion Optical LED",
        image: "/products/translight-sample.jpg",
        individualPrice: 1499,
      },
      {
        id: "acrylic-8x12-deity",
        name: "Cast Acrylic Mandir Murti",
        spec: "8×12 in · High-Gloss Bevel Edges",
        image: "/deities/shrinathji.jpg",
        individualPrice: 699,
      },
    ],
  },
  {
    id: "family-heirloom-trio",
    name: "Family Heritage Trio",
    tagline: "A majestic centerpiece for the living room and two gifts for grandparents.",
    occasion: "family",
    badge: "Save ₹498",
    bundlePrice: 2699,
    originalPrice: 3197,
    savings: 498,
    heroImage: "/portfolio/family-heritage.jpg",
    emotionalStory: "One large centerpiece frame for the living room plus two matching tabletop prints for grandparents or siblings, ensuring family unity across different homes.",
    whatsAppMessage: "Namaste Rajmoti Studio! 🏡 I would like to order the 'Family Heritage Trio' (₹2,699) with our joint family portrait.",
    items: [
      {
        id: "frame-16x24",
        name: "Grand Living Room Centerpiece Frame",
        spec: "16×24 in · Natural Teak Finish Wood",
        image: "/portfolio/family-heritage.jpg",
        individualPrice: 2199,
      },
      {
        id: "acrylic-tabletop-1",
        name: "Grandparents' Tabletop Acrylic Block",
        spec: "8×10 in · Optical Acrylic",
        image: "/products/frame-sample-family.jpg",
        individualPrice: 499,
      },
      {
        id: "acrylic-tabletop-2",
        name: "Sibling Tabletop Keepsake",
        spec: "8×10 in · Optical Acrylic",
        image: "/products/frame-sample-wedding.jpg",
        individualPrice: 499,
      },
    ],
  },
];
