// Authoritative Hyperlocal SEO Registry for Rajmoti Studio
// Centered strictly on Jetpur, Gujarat (Physical Studio Location)
// Geographic Priorities:
// P0 - Core: Jetpur, Jetpur-Navagadh
// P1 - Nearby Expansion: Virpur (12km), Dhoraji (15km), Gondal (30km)
// P2 - Validation: Upleta, nearby Saurashtra villages
// NOTE: Rajkot and Junagadh are intentionally excluded from dedicated local SEO landing pages at this stage.

export interface LocalFAQ {
  q: string;
  a: string;
}

export interface LocalServiceData {
  slug: string;
  name: string;
  kicker: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  heroIntro: string;
  whyLocalAdvantage: string;
  localCompetitorContext: string;
  differentiators: Array<{ title: string; desc: string }>;
  featuredProductLinks: Array<{ name: string; price: number; link: string; badge?: string; desc: string }>;
  turnaroundTime: string;
  faqs: LocalFAQ[];
}

export interface CityData {
  slug: string;
  name: string;
  priority: "P0" | "P1" | "P2";
  district: string;
  pinCodes: string[];
  distanceFromJetpurStudio: string;
  isPhysicalStudioLocation: boolean;
  transitSummary: string;
  coverageAreas: string[];
  localCompetitors: string[];
  overviewHero: string;
  services: Record<string, LocalServiceData>;
  faqs: LocalFAQ[];
}

export const HYPERLOCAL_CITIES: Record<string, CityData> = {
  jetpur: {
    slug: "jetpur",
    name: "Jetpur",
    priority: "P0",
    district: "Rajkot District, Gujarat",
    pinCodes: ["360370", "360360"],
    distanceFromJetpurStudio: "0 km (Physical Studio Location)",
    isPhysicalStudioLocation: true,
    transitSummary: "Walk into our studio on MG Road or request same-day doorstep delivery across Jetpur and Navagadh.",
    coverageAreas: [
      "Jetpur Town Centre & MG Road",
      "Kanakia Plot & Natraj Lodge area",
      "Navagadh Industrial & Residential Area",
      "Sardar Chowk & Station Road",
      "Bhadar Riverfront & Dhoraji Road",
      "Junagadh Road & Virpur Bypass",
    ],
    localCompetitors: [
      "Krishna Art Gallery (framing & decorative art)",
      "Heer Laser Art (laser-cutting & custom gift work)",
      "Saifee Photo Framing (traditional framing)",
      "Chandni Gift & Toys (physical gift retail)",
    ],
    overviewHero:
      "Rajmoti Studio has been Jetpur's trusted photography and bespoke framing destination since 1982. From our physical studio in Jetpur, we handcraft custom photo frames, 3D magic reveal mugs, backlit LED translights, and fine art family portraits with 2–4 hour counter pickup.",
    faqs: [
      {
        q: "Where is Rajmoti Studio located in Jetpur?",
        a: "Rajmoti Studio is located in Jetpur, Gujarat (PIN 360370), near Kanakia Plot / Natraj Lodge area on MG Road. You can find our verified Google Maps listing or reach us directly at +91 94290 70317.",
      },
      {
        q: "Can I collect my personalized photo gift or frame directly from the Jetpur studio?",
        a: "Yes! Counter pickup is available at our Jetpur studio. Most personalized mugs, keychains, and standard frames can be ready for inspection and collection within 2 to 4 hours after you approve the WhatsApp digital preview.",
      },
      {
        q: "Do you offer doorstep delivery in Jetpur and Navagadh?",
        a: "Yes, we provide same-day or next-day local delivery across all neighborhoods in Jetpur, including Navagadh. Full online payment via UPI is required prior to home delivery dispatch.",
      },
      {
        q: "How does Rajmoti Studio differ from local gift shops or out-of-town couriers in Jetpur?",
        a: "Unlike physical gift shops that sell uncustomized novelties or generic laser cuts, Rajmoti allows you to upload photos online and see realistic 3D previews on mugs and wall-size visualizers before ordering. Every product is printed on calibrated archival photo paper and assembled by experienced local craftsmen in Jetpur.",
      },
      {
        q: "Can I discuss framing sizes or photo restoration directly with Pankajbhai?",
        a: "Yes. You can message or call Pankajbhai on WhatsApp (+91 94290 70317) to discuss portrait dimensions, wall layout ideas, and restoration estimates.",
      },
    ],
    services: {
      "personalized-gifts": {
        slug: "personalized-gifts",
        name: "Personalized Gifts",
        kicker: "Jetpur's Custom Gifting Studio · Est. 1982",
        h1: "Personalized Gifts in Jetpur, Gujarat",
        metaTitle: "Personalized Gifts in Jetpur — Custom Photo Gifts, Magic Mugs & Keychains | Rajmoti Studio",
        metaDescription:
          "Order handcrafted personalized gifts in Jetpur, Gujarat. Preview your photo on 3D magic reveal mugs, double-sided keychains & bespoke collages with 2–4hr studio pickup.",
        heroIntro:
          "Looking for a meaningful birthday, anniversary, or festive gift in Jetpur? At Rajmoti Studio, you can preview your own memories on rotating 3D ceramic mugs, heat-reveal magic cups, crystal keychains, and couple story magazines before placing your order.",
        whyLocalAdvantage:
          "National gifting websites take 4–7 days to ship generic items to Jetpur and charge high courier fees. In Jetpur, physical toy and gift shops primarily sell imported mass-produced trinkets. Rajmoti Studio combines modern online preview technology with local Jetpur craftsmanship—ready in 2–4 hours.",
        localCompetitorContext:
          "While Heer Laser Art provides laser-cut MDF gifts and Chandni Gift & Toys retails physical novelty items, Rajmoti Studio specializes in authentic photographic gifts where memories are printed with archival color fidelity and fitted by hand.",
        differentiators: [
          {
            title: "Live 3D & In-Browser Preview",
            desc: "Rotate mugs 360° and test heat reveals with your photo before spending a single rupee. No surprises.",
          },
          {
            title: "Fast 2–4 Hour Counter Pickup in Jetpur",
            desc: "Urgent birthday or anniversary today? Many gift items can be crafted, proofed, and handed over at our Jetpur counter within hours.",
          },
          {
            title: "Studio Gift Box & Wax-Sealed Note",
            desc: "Add our signature handcrafted gift packaging (+₹49) and handwritten calligraphy card (+₹29) for a memorable unboxing experience.",
          },
          {
            title: "Private & Safe Photo Workflow",
            desc: "Your family and couple photographs are fitted in your browser RAM and never shared publicly or stored indefinitely.",
          },
        ],
        featuredProductLinks: [
          {
            name: "Magic Reveal Heat-Sensitive Photo Mug",
            price: 349,
            link: "/products/mugs/magic-reveal-chai",
            badge: "Jetpur Bestseller",
            desc: "Black ceramic reveals your anniversary or family photo when hot chai is poured.",
          },
          {
            name: "Double-Sided Crystal Acrylic Keychain",
            price: 149,
            link: "/products/phone-covers",
            badge: "Pocket Keepsake",
            desc: "Durable, scratch-resistant acrylic featuring two different photos.",
          },
          {
            name: "Personalised Couple Story Photobook",
            price: 899,
            link: "/products/magazines",
            badge: "Editorial Gift",
            desc: "12–20 curated photos with personal vows, dates, and Spotify song QR code.",
          },
          {
            name: "Royal Heritage Wedding Keepsake Frame (12×18 in)",
            price: 1499,
            link: "/products/frames/royal-heritage",
            badge: "Heirloom Grade",
            desc: "Rich wood moulding with crystal optical acrylic and acid-free mounting.",
          },
        ],
        turnaroundTime: "2 to 4 hours for studio counter collection; same-day delivery across Jetpur–Navagadh.",
        faqs: [
          {
            q: "Can I get a personalized photo gift made same-day in Jetpur?",
            a: "Yes! Magic mugs, standard gloss mugs, double-sided keychains, and 8×12 frames are eligible for same-day production at our Jetpur studio when ordered before 3:00 PM.",
          },
          {
            q: "How do I share my photo for mug or keychain printing?",
            a: "You can upload it directly into our live personalizer in the browser, or send it directly on WhatsApp to +91 94290 70317. We send you a digital proof before printing.",
          },
          {
            q: "What payment methods are supported for Jetpur gift orders?",
            a: "We accept all UPI apps (GPay, PhonePe, Paytm) at our verified UPI ID 9429070317@apl (Pankaj Laxmichand Sakhija). Studio pickup orders can also be settled at the counter.",
          },
        ],
      },
      "photo-frames": {
        slug: "photo-frames",
        name: "Photo Frames & Wall Art",
        kicker: "Master Framing Joinery · Jetpur Studio",
        h1: "Custom Photo Frames & Wall Art in Jetpur",
        metaTitle: "Custom Photo Frames in Jetpur — Handcrafted Wall Art & Framing | Rajmoti Studio",
        metaDescription:
          "Custom photo frames, acrylic blocks & multi-photo collage frames crafted in Jetpur. Teak finish, charcoal matte & gold finishes with interactive wall-size visualizer.",
        heroIntro:
          "Turn your favorite wedding, baby, and family moments into heirloom wall art. Crafted in our Jetpur workshop with precision miter joinery, acid-free backing, and crystal optical acrylic in sizes from 8×12 to 20×30 inches.",
        whyLocalAdvantage:
          "Shipping large glass or wood frames through general courier services often results in cracked glass, chipped corners, and weeks of transit disputes. Rajmoti Studio builds your frame locally in Jetpur with robust shatterproof acrylic, delivered safely to your home or ready for pickup.",
        localCompetitorContext:
          "While traditional framers in Jetpur like Krishna Art Gallery and Saifee Photo Framing offer standard moulding cuts, Rajmoti provides an interactive online Wall Size Visualizer to preview dimensions against realistic living room furniture, combined with studio-calibrated archival photo printing.",
        differentiators: [
          {
            title: "Interactive Wall Size Visualizer",
            desc: "Compare 8×12, 10×14, 12×18, 16×24, and 20×30 inch frames above a living room sofa before choosing your size.",
          },
          {
            title: "Fine Art Moulding Finishes",
            desc: "Natural Teak Finish Wood, Matte Charcoal Wood, Champagne Gold Finish, and Floating Cast Optical Acrylic.",
          },
          {
            title: "Archival Lab Printing Included",
            desc: "We don't just frame an uncalibrated print; we print your photo on museum-grade lustre paper that won't fade or yellow.",
          },
          {
            title: "Multi-Photo Story Layouts",
            desc: "Triptych (3-photo story), 4-grid family moments, and 5-photo heritage mosaics fitted with zero distortion.",
          },
        ],
        featuredProductLinks: [
          {
            name: "Royal Heritage Single Frame (12×18 in)",
            price: 1499,
            link: "/products/frames/royal-heritage",
            badge: "Most Popular",
            desc: "Deep teak finish wood moulding with crystal clear acrylic cover.",
          },
          {
            name: "Living Room Panoramic Frame (16×24 in)",
            price: 2199,
            link: "/products/frames/living-room-hero",
            badge: "Statement Wall Art",
            desc: "Generous proportioned wall piece for master bedrooms and family drawing rooms.",
          },
          {
            name: "Cast Optical Acrylic Block (8×12 in)",
            price: 999,
            link: "/products/acrylic",
            badge: "Modern Minimalist",
            desc: "High-gloss optical acrylic with polished bevel edges and chrome standoff studs.",
          },
          {
            name: "Backlit LED Translight Frame (12×18 in)",
            price: 2499,
            link: "/products/devotional",
            badge: "Sanctum Illumination",
            desc: "Evenly diffused internal LED backlight for mandirs and ambient night display.",
          },
        ],
        turnaroundTime: "24 to 48 hours for bespoke custom frames; express 4-hour assembly on standard 8×12 & 12×18 sizes.",
        faqs: [
          {
            q: "What frame sizes do you manufacture in Jetpur?",
            a: "We support standard sizes including 8×12, 10×10 (square), 10×14, 12×18, 14×20, 16×24, 18×24, and 20×30 inches. Custom proportions are also available upon request.",
          },
          {
            q: "Do you use glass or acrylic?",
            a: "We use high-grade optical acrylic instead of brittle window glass. Optical acrylic is lighter, shatterproof, crystal clear, and protects your photos against UV discoloration.",
          },
          {
            q: "Can I bring my own printed photo to your Jetpur studio for framing?",
            a: "Yes! If you already have a physical photograph or painting, you can bring it to our studio in Jetpur. We will inspect, mount, and custom-frame it to your chosen finish.",
          },
        ],
      },
      "photo-printing": {
        slug: "photo-printing",
        name: "Photo Printing & Restoration",
        kicker: "Calibrated Lab Output · Jetpur Heritage",
        h1: "Photo Printing & Restoration in Jetpur",
        metaTitle: "Photo Printing & Restoration in Jetpur — Archival Lab Prints | Rajmoti Studio",
        metaDescription:
          "Professional photo printing, passport photos (15 mins), and old photo restoration in Jetpur. Archival lustre paper, true color reproduction & in-studio pickup.",
        heroIntro:
          "Print your smartphone and camera photos with professional color fidelity, or bring faded ancestral photographs back to life. Hand-retouched and printed on archival photo paper right here in Jetpur.",
        whyLocalAdvantage:
          "Most local minilabs and stationery shops in Jetpur use uncalibrated inkjets that produce reddish casts or fade within months. Rajmoti Studio uses professional photo paper with archival pigments rated for decades of display, with same-day collection.",
        localCompetitorContext:
          "While commercial Xerox and copy centers in Jetpur offer basic colour printouts, Rajmoti Studio provides authentic photo-grade continuous tone lab printing, precision trimming, and expert digital photo restoration.",
        differentiators: [
          {
            title: "15-Minute Passport & Visa Photos",
            desc: "Biometric-compliant white background passport photos printed and cut in 15 minutes at our Jetpur studio.",
          },
          {
            title: "Archival Digital Photo Restoration",
            desc: "Repair scratches, tears, water damage, and color fading on treasured black-and-white family portraits.",
          },
          {
            title: "True Color Calibration",
            desc: "Skin tones, vibrant wedding silks, and subtle shadow details reproduced accurately without harsh contrast.",
          },
          {
            title: "Memorial Tribute Enlargements",
            desc: "Reverent floral border formatting and framed memorial portraits prepared with utmost dignity and urgent turnaround.",
          },
        ],
        featuredProductLinks: [
          {
            name: "Archival Photo Enlargements (12×18 in)",
            price: 299,
            link: "/products",
            badge: "Lab Quality",
            desc: "Heavyweight lustre paper with anti-fingerprint pearl finish.",
          },
          {
            name: "Urgent Studio Passport Photos (Set of 8)",
            price: 99,
            link: "/contact",
            badge: "15-Min Ready",
            desc: "Government, school, passport, and driving licence approved.",
          },
          {
            name: "Heritage Photo Restoration Service",
            price: 499,
            link: "/services/photo-restoration",
            badge: "Digital Artistry",
            desc: "Full digital restoration, crease removal, contrast revival, and archival reprint.",
          },
          {
            name: "Shraddhanjali Memorial Tribute Frame (10×14 in)",
            price: 899,
            link: "/products/frames",
            badge: "Dignified Keepsake",
            desc: "Includes garland border design, respectful retouching, and wood framing.",
          },
        ],
        turnaroundTime: "15 minutes for passport photos; same-day for photo prints; 24–48 hours for complex restorations.",
        faqs: [
          {
            q: "Can you restore an old torn or faded photo if I only have a small passport picture?",
            a: "Yes! Bring the original to our Jetpur studio or send a high-resolution smartphone scan on WhatsApp. Our digital artists can repair creases, correct fading, and enlarge it up to 12×18 or 16×24 inches.",
          },
          {
            q: "What paper types do you offer for printing in Jetpur?",
            a: "We offer Premium Archival Lustre (pearl finish, resistant to fingerprints and glare), High-Gloss Photo Media, and Heavyweight Textured Fine-Art Canvas.",
          },
          {
            q: "How fast can I get passport photos in Jetpur?",
            a: "Passport photos are taken, verified, printed, and cut within 15 minutes of visiting our Jetpur studio.",
          },
        ],
      },
      "photography-studio": {
        slug: "photography-studio",
        name: "Photography Studio",
        kicker: "Four Decades of Trust · Jetpur Landmark",
        h1: "Professional Photography Studio in Jetpur",
        metaTitle: "Photography Studio in Jetpur — Baby, Maternity, Family & Wedding Portraits | Rajmoti Studio",
        metaDescription:
          "Jetpur's trusted photography studio since 1982. Fine art baby milestones, maternity portraits, heritage family photos and wedding coverage on MG Road, Jetpur.",
        heroIntro:
          "Welcome to Rajmoti Studio, Jetpur's established photography destination since 1982. Led by veteran photographer Pankajbhai Sakhija, we specialize in milestone baby portraits, timeless maternity sessions, joint family heirlooms, and comprehensive wedding photography.",
        whyLocalAdvantage:
          "Hiring travelling photographers from larger cities often incurs hefty travel surcharges and impersonal service. Rajmoti Studio offers rooted local experience in Jetpur, intimate understanding of Saurashtra traditions and ceremonies, and a physical studio where you can review your albums in person.",
        localCompetitorContext:
          "While various commercial studios operate across Dhoraji and Gondal, Rajmoti Studio provides a continuous legacy of 40+ years in Jetpur, combining classic portraiture expertise with modern cinematic framing and lay-flat photo albums.",
        differentiators: [
          {
            title: "Milestone Baby & Cake Smash Studio",
            desc: "Temperature-comfortable, child-safe studio environment with clean sanitized props and patience.",
          },
          {
            title: "Maternity & Motherhood Portraits",
            desc: "Flattering, artistic studio lighting celebrating motherhood with dignity and elegance.",
          },
          {
            title: "Heritage Multi-Generation Family Sessions",
            desc: "Comfortably photograph 3–4 generations together with balanced lighting and archival framing.",
          },
          {
            title: "Authentic Gujarati Wedding Coverage",
            desc: "Lagan, Pithi, Mandap Muhurat, and Reception coverage capturing authentic emotional moments.",
          },
        ],
        featuredProductLinks: [
          {
            name: "Baby Milestone & 1st Birthday Session",
            price: 2499,
            link: "/portfolios/baby",
            badge: "Studio Session",
            desc: "Includes multiple setups, themed props, and high-res digital proofs.",
          },
          {
            name: "Fine-Art Maternity Portrait Session",
            price: 3499,
            link: "/portfolios/maternity",
            badge: "Motherhood Grace",
            desc: "Elegant studio lighting, gowns, and couple portraits.",
          },
          {
            name: "Heritage Family Group Portrait Package",
            price: 3999,
            link: "/portfolios/family",
            badge: "Generations Set",
            desc: "Studio shoot + 16×24 inch archival framed heirloom for your living room.",
          },
          {
            name: "Wedding & Traditional Mandap Photography",
            price: 14999,
            link: "/portfolios/wedding",
            badge: "Full Coverage",
            desc: "Complete ceremony coverage, candid moments, and lay-flat luxury album.",
          },
        ],
        turnaroundTime: "Same-day booking consultation on WhatsApp; 3–5 days for portrait proofs.",
        faqs: [
          {
            q: "How do I book a photoshoot session at Rajmoti Studio in Jetpur?",
            a: "You can book directly via WhatsApp (+91 94290 70317) or visit our studio on MG Road, Jetpur. We discuss your preferred date, outfit suggestions, and family group size.",
          },
          {
            q: "Do you travel for wedding photoshoots outside Jetpur?",
            a: "Yes! While our physical studio is in Jetpur, we regularly travel to Virpur, Dhoraji, Gondal, and surrounding Saurashtra venues for wedding and event coverage.",
          },
          {
            q: "How long has Rajmoti Studio been in Jetpur?",
            a: "Rajmoti Studio was established in 1982 and has served multiple generations of families in Jetpur for over 40 years.",
          },
        ],
      },
    },
  },

  // P1 Nearby Expansion: Virpur (12 km)
  virpur: {
    slug: "virpur",
    name: "Virpur",
    priority: "P1",
    district: "Rajkot District, Gujarat",
    pinCodes: ["360380"],
    distanceFromJetpurStudio: "12 km (15–20 minutes via NH-27)",
    isPhysicalStudioLocation: false,
    transitSummary: "Located just 12 km from our Jetpur studio. Customers can pick up orders in Jetpur or receive courier delivery in Virpur within 24 hours.",
    coverageAreas: ["Virpur Dham", "Jalaram Bapa Mandir Area", "Virpur–Jetpur Highway Belt"],
    localCompetitors: ["Local mandir novelty shops and souvenir stalls"],
    overviewHero:
      "Serving Virpur families and devotees with sacred Jalaram Bapa mandir photo frames, backlit LED translights, and customized family keepsakes crafted just 12 km away at our Jetpur studio.",
    faqs: [
      {
        q: "How far is Rajmoti Studio from Virpur?",
        a: "Our physical studio in Jetpur is just 12 km from Virpur, a convenient 15 to 20-minute drive along the National Highway. Many Virpur families visit our counter directly for urgent framing and album pickups.",
      },
      {
        q: "Can I get sacred Jalaram Bapa devotional frames delivered to Virpur?",
        a: "Yes! We craft authentic, revered Sant Shri Jalaram Bapa portraits in acrylic blocks, wood frames, and illuminated LED translights with fast delivery to Virpur.",
      },
    ],
    services: {
      "devotional-photo-gifts": {
        slug: "devotional-photo-gifts",
        name: "Devotional Keepsakes & Gifts",
        kicker: "Virpur Connection · Handcrafted 12 km Away",
        h1: "Devotional Mandir Frames & Photo Gifts for Virpur",
        metaTitle: "Photo Gifts & Devotional Mandir Keepsakes in Virpur | Rajmoti Studio",
        metaDescription:
          "Devotional photo frames, Jalaram Bapa temple keepsakes & custom gifts for Virpur families. Handcrafted 12 km away at Rajmoti Studio Jetpur with fast delivery.",
        heroIntro:
          "Honoring the sacred spirit of Virpur Dham. Discover reverent Pujya Jalaram Bapa keepsakes, illuminated mandir translights, and personalized family photo gifts crafted with devotion at Rajmoti Studio.",
        whyLocalAdvantage:
          "Unlike generic pilgrimage souvenir stalls with flimsy paper prints, Rajmoti Studio creates heirloom-grade sacred art with crystal acrylic protection, warm LED backlighting, and solid wood frames.",
        localCompetitorContext:
          "Souvenir stalls near the Virpur temple cater primarily to quick tourist trinkets. Rajmoti Studio provides bespoke, permanent sanctum installations for family homes.",
        differentiators: [
          {
            title: "Authentic Virpur Sadavrat Iconography",
            desc: "Reverent portraits depicting Jalaram Bapa with walking staff, white paghdi, and benevolent compassion.",
          },
          {
            title: "Quick 20-Minute Proximity",
            desc: "Order online from Virpur and collect from our Jetpur studio the same afternoon, or request delivery.",
          },
          {
            title: "Backlit LED Mandir Translights",
            desc: "Evenly diffused warm glow creating a tranquil temple atmosphere in your home puja room.",
          },
          {
            title: "Bespoke Family Devotional Sets",
            desc: "Combine Kuldevi Maa Khodiyar / Maa Umiya with Jalaram Bapa in coordinated matching frames.",
          },
        ],
        featuredProductLinks: [
          {
            name: "Param Pujya Jalaram Bapa Virpur Murti Frame",
            price: 1499,
            link: "/products/devotional",
            badge: "Virpur Sacred",
            desc: "12×18 inch Teak finish wood frame with reverent gold plaque and protective acrylic.",
          },
          {
            name: "Sacred Mandir Sanctum Set (Bundle of 3)",
            price: 3499,
            link: "/products#curated-bundles",
            badge: "Curated Bundle",
            desc: "Backlit LED translight + 2 matching acrylic deity keepsakes with 20% bundle savings.",
          },
          {
            name: "Shri Dwarkadhish Divine Darshan Acrylic Block",
            price: 999,
            link: "/products/acrylic",
            badge: "Mandir Keepsake",
            desc: "Cast optical acrylic with high-gloss polished edges.",
          },
        ],
        turnaroundTime: "Same-day counter pickup at our Jetpur studio (12 km away) or 24-hour delivery to Virpur.",
        faqs: [
          {
            q: "Can Virpur residents collect orders directly from Jetpur?",
            a: "Yes! Many customers from Virpur drive 15 minutes to our Jetpur counter to inspect their finished frames in person.",
          },
          {
            q: "Do you ship personalized anniversary and birthday gifts to Virpur?",
            a: "Yes, all our personalized photo mugs, magazines, and frames are available with delivery to Virpur PIN 360380.",
          },
        ],
      },
    },
  },

  // P1 Nearby Expansion: Dhoraji (15 km)
  dhoraji: {
    slug: "dhoraji",
    name: "Dhoraji",
    priority: "P1",
    district: "Rajkot District, Gujarat",
    pinCodes: ["360410"],
    distanceFromJetpurStudio: "15 km (20–25 minutes via NH-27)",
    isPhysicalStudioLocation: false,
    transitSummary: "Located 15 km west of Jetpur. Dhoraji residents enjoy fast 1-day delivery or easy counter pickup at our Jetpur studio.",
    coverageAreas: ["Dhoraji Town", "Station Road Dhoraji", "Darbar Gadh Area", "Bhadar Dam Belt"],
    localCompetitors: ["Omkar Art (physical gifting & crafts)", "Local photography studios in Dhoraji"],
    overviewHero:
      "Handcrafted personalized photo gifts, custom framing, and family portraits for Dhoraji residents. Created just 15 km away at Rajmoti Studio Jetpur with preview-before-order convenience.",
    faqs: [
      {
        q: "Does Rajmoti Studio deliver personalized gifts to Dhoraji?",
        a: "Yes! We regularly fulfill orders for customers in Dhoraji (PIN 360410). Because Dhoraji is only 15 km from our Jetpur studio, delivery takes just 1 business day.",
      },
      {
        q: "Why should Dhoraji residents order from Rajmoti Studio?",
        a: "Rajmoti offers full in-browser photo customization, live 3D preview of mugs, wall size visualizers, and 40+ years of studio craftsmanship without the need to order from distant regional cities.",
      },
    ],
    services: {
      "personalized-gifts": {
        slug: "personalized-gifts",
        name: "Personalized Gifts",
        kicker: "Serving Dhoraji · Handcrafted in Jetpur",
        h1: "Personalized Gifts for Dhoraji, Gujarat",
        metaTitle: "Personalized Gifts in Dhoraji — Custom Photo Gifts & Mugs | Rajmoti Studio",
        metaDescription:
          "Custom photo gifts, 3D magic reveal mugs & keepsake frames delivered to Dhoraji from Rajmoti Studio Jetpur. Live online preview & fast delivery.",
        heroIntro:
          "Celebrate birthdays, weddings, and anniversaries in Dhoraji with personalized photo keepsakes. Upload your photos online, preview them in 3D, and receive beautifully packaged gifts from nearby Jetpur.",
        whyLocalAdvantage:
          "Ordering from Mumbai or Ahmedabad-based websites often means damaged goods and impersonal customer service. Rajmoti Studio is right down the road in Jetpur, offering direct WhatsApp assistance and reliable regional transit.",
        localCompetitorContext:
          "While Omkar Art and local novelty stores in Dhoraji offer general physical gifts, Rajmoti Studio specializes in personalized photo products with calibrated lab print quality.",
        differentiators: [
          {
            title: "Convenient 20-Minute Highway Transit",
            desc: "Fast delivery to Dhoraji addresses, or drop by our Jetpur counter to pick up in person.",
          },
          {
            title: "Interactive In-Browser Fitting",
            desc: "Fit your photos on mugs and collage frames with your phone or PC before paying.",
          },
          {
            title: "Verified WhatsApp Proofing",
            desc: "We confirm crop, spelling, and dates directly with you on WhatsApp prior to production.",
          },
        ],
        featuredProductLinks: [
          {
            name: "Magic Reveal Thermochromic Mug",
            price: 349,
            link: "/products/mugs/magic-reveal-chai",
            badge: "Gift Favorite",
            desc: "Poured hot chai reveals your proposal or birthday photograph.",
          },
          {
            name: "Anniversary Keepsake Memory Set",
            price: 2499,
            link: "/products#curated-bundles",
            badge: "Complete Set",
            desc: "Includes 12×18 wood frame, 2 magic reveal mugs & matching crystal keychains.",
          },
          {
            name: "Double-Sided Custom Acrylic Keychain",
            price: 149,
            link: "/products/phone-covers",
            badge: "Budget Friendly",
            desc: "Two distinct photos sealed in crystal acrylic.",
          },
        ],
        turnaroundTime: "1 business day delivery to Dhoraji or same-day counter collection in Jetpur.",
        faqs: [
          {
            q: "Can I send a surprise gift directly to someone in Dhoraji?",
            a: "Yes! Enter the recipient's Dhoraji address, add our gift box (+₹49) and personal note card (+₹29), and we will deliver it with all price tags removed.",
          },
        ],
      },
    },
  },

  // P1 Nearby Expansion: Gondal (30 km)
  gondal: {
    slug: "gondal",
    name: "Gondal",
    priority: "P1",
    district: "Rajkot District, Gujarat",
    pinCodes: ["360311"],
    distanceFromJetpurStudio: "30 km (30–35 minutes via NH-27)",
    isPhysicalStudioLocation: false,
    transitSummary: "Located 30 km north of Jetpur on National Highway 27. Orders reach Gondal within 1 to 2 business days via verified courier or direct dispatch.",
    coverageAreas: ["Gondal City", "Naulakha Palace Area", "Gondal GIDC", "Station Plot & College Road"],
    localCompetitors: [
      "PD Love Gift (customized gift listing, currently not accepting orders)",
      "Bhola Gift and Events (celebration retail)",
      "VP Gift Mart (personalized & novelty retail)",
    ],
    overviewHero:
      "Premium personalized gifts, heirloom photo frames, and portrait keepsakes for Gondal. Crafted in our heritage studio in Jetpur with convenient online preview and prompt delivery.",
    faqs: [
      {
        q: "Does Rajmoti Studio ship to Gondal?",
        a: "Yes! We regularly deliver personalized photo frames, mugs, magazines, and devotional artwork across Gondal (PIN 360311). Delivery typically takes 1 to 2 business days.",
      },
      {
        q: "What makes Rajmoti Studio a reliable choice for Gondal customers?",
        a: "With some local online listings in Gondal currently inactive, Rajmoti Studio provides a fully functioning, reliable e-commerce experience with interactive photo personalizers and verified UPI checkout.",
      },
    ],
    services: {
      "personalized-gifts": {
        slug: "personalized-gifts",
        name: "Personalized Gifts",
        kicker: "Serving Gondal · Handcrafted in Jetpur",
        h1: "Personalized Gifts for Gondal, Gujarat",
        metaTitle: "Personalized Gifts in Gondal — Photo Keepsakes & Custom Mugs | Rajmoti Studio",
        metaDescription:
          "Order personalized photo gifts & custom frames delivered to Gondal from Rajmoti Studio Jetpur. Interactive preview, gift wrapping & fast delivery.",
        heroIntro:
          "Looking for personalized gifts in Gondal? Discover custom photo frames, magic reveal ceramic mugs, and photo magazines. Easy online photo fitting and reliable delivery from nearby Jetpur.",
        whyLocalAdvantage:
          "Gondal customers often struggle with distant metropolitan sellers that cannot guarantee safe delivery of glass or fragile frames. Rajmoti Studio operates right along the NH-27 corridor in Jetpur, ensuring attentive packing and personal customer support.",
        localCompetitorContext:
          "While local stores like Bhola Gift and VP Gift Mart carry general gift items and listings like PD Love Gift are currently not accepting orders, Rajmoti Studio provides a live, functioning online studio.",
        differentiators: [
          {
            title: "Reliable 1–2 Day Transit along NH-27",
            desc: "Direct courier link between Jetpur and Gondal with protective packaging.",
          },
          {
            title: "Live Online Customization",
            desc: "Upload photos, adjust cropping, and preview products on your phone.",
          },
          {
            title: "Handcrafted Studio Quality",
            desc: "Every frame and mug is prepared with archival pigments and durable moulding.",
          },
        ],
        featuredProductLinks: [
          {
            name: "Royal Heritage Anniversary Frame (12×18 in)",
            price: 1499,
            link: "/products/frames/royal-heritage",
            badge: "Gondal Favorite",
            desc: "Classic teak finish moulding with optical acrylic protection.",
          },
          {
            name: "Magic Reveal Photo Chai Mug",
            price: 349,
            link: "/products/mugs/magic-reveal-chai",
            badge: "Morning Surprise",
            desc: "Reveals personal family or couple photo with warm tea.",
          },
          {
            name: "Personalised Couple Story Magazine",
            price: 899,
            link: "/products/magazines",
            badge: "Editorial Photobook",
            desc: "Page-flip keepsake with custom vows and dates.",
          },
        ],
        turnaroundTime: "1 to 2 business days delivery across Gondal.",
        faqs: [
          {
            q: "How are frames packaged to avoid transit damage to Gondal?",
            a: "We use optical shatterproof acrylic instead of fragile glass, double corner protectors, heavy-duty bubble wrap, and sturdy corrugated outer boxes.",
          },
        ],
      },
    },
  },
};

/**
 * Returns city data or fallback to Jetpur.
 */
export function getCityData(citySlug: string): CityData {
  const norm = citySlug.toLowerCase().trim();
  return HYPERLOCAL_CITIES[norm] || HYPERLOCAL_CITIES.jetpur;
}

/**
 * Returns service data for a specific city.
 */
export function getCityServiceData(citySlug: string, serviceSlug: string): LocalServiceData | null {
  const city = getCityData(citySlug);
  return city.services[serviceSlug] || null;
}
