# RAJMOTI STUDIO 4.0 — GLOBAL E-COMMERCE & PERSONALIZED GIFTS RESEARCH REPORT

## Executive Context
This research examines leading international and national photo-product boutiques (Artifact Uprising, Framebridge, Mixbook, Once Upon, Popsa, Shutterfly, Zoomin, Printo, Zapvi, iGiftzi) and synthesizes Baymard Institute e-commerce guidelines. The goal is to inform the comprehensive rebuild of Rajmoti Studio's physical product architecture (`/products`), moving from an administrative catalogue into an editorial, emotionally resonant, high-converting digital boutique.

---

## 1. Product Landing Page Hierarchy (Benchmark Analysis)

| Store | Above the Fold Hero | Secondary Section | Browse Mode | Filter Placement |
| :--- | :--- | :--- | :--- | :--- |
| **Artifact Uprising** | Large lifestyle photography of real photo books on linen tablecloths; succinct poetic heading; zero technical jargon. | Curated collection cards (Photo Books, Prints, Frames). | Visual department cards with natural material cues. | Sub-category navigation tabs, never multi-select dropdown forms. |
| **Framebridge** | Clean interior showing frames hung on real gallery walls; "Custom framing made truly simple". | Step-by-step visual value proposition: 1. You choose frame, 2. We print & frame, 3. Delivered ready to hang. | By frame style (Clean Wood, Gilded, Modern Metal, Gallery Walls). | Visual pill filters for size & style; minimal facet clutter. |
| **Zoomin & Printo** | Occasion-led banners (Anniversary, Birthday) and top 4 bestseller tiles. | Category grid with price anchors ("Starting at ₹299"). | Visual grid with direct CTA "Create Now" / "Buy Now". | Top scrollable horizontal occasion pills. |
| **Baymard Guideline** | Never confront first-time visitors with an exhaustive faceted filter matrix before establishing emotional product appeal. | Introduce 3–5 broad product departments visually before showing full product grids. | Allow single-click entry into focused sub-departments. | Place search and deep facets below the curated showroom. |

### Rajmoti Studio 4.0 Application:
- **Hero**: Rich warm ivory background, genuine wedding/family portrait in handcrafted Saurashtra teak, headline: *"Made personal. Made to keep."*
- **Level 1**: 5 Visual Department Entry Cards (Personalized Gifts, Devotional Photos, Frames & Prints, Magazines & Albums, Customized Accessories).
- **Level 2**: Featured Keepsakes Spotlight (4 owner-priced bestsellers).
- **Level 3**: Gifts by Occasion horizontal pills (Anniversary, Birthday, Wedding, Griha Pravesh, Baby).
- **Level 4**: Material Craftsmanship cards (Teak Wood, Cast Acrylic, Canvas, Ceramic, LED Film).
- **Level 5**: Dedicated Devotional Sanctum section.
- **Level 6**: Same-Day Express in Jetpur Banner.
- **Level 7**: Finished Keepsakes Gallery (real customer items).
- **Level 8**: Interactive 3-Tap Gift Finder & Proportional Living Room Wall Visualizer.
- **Level 9**: Dedicated "Shop All Products" Directory with context-aware filters.

---

## 2. Navigation and Browsing Architecture

### Observed Industry Standards:
1. **Separation of Services vs Physical Goods**: Neither Artifact Uprising nor Framebridge mixes photography shoot bookings with finished physical frames. Photography services require inquiry/calendar flows; physical goods require variant selection and checkout.
2. **Dedicated Clean URLs**: Each major product category requires its own canonical, SEO-indexed URL rather than query-string URL states (`/products/frames`, `/products/mugs`, `/products/devotional`, `/products/gifts/anniversary`).
3. **Breadcrumbs & One-Click Upward Traversal**: Breadcrumbs like `Home > Products > Frames > Anniversary Story Frame` allow intuitive browsing without hitting browser back button dead ends.

---

## 3. Product Imagery and Photography Direction

| Dimension | Poor / Anti-Pattern (To Avoid) | Best-in-Class Benchmark | Rajmoti 4.0 Standard |
| :--- | :--- | :--- | :--- |
| **Product Staging** | Generic floating PNGs on stark white backgrounds or synthetic AI faces. | Artifact Uprising & Framebridge: Tactile products photographed in real morning sunlight, showing wood grain, bevel edges, and linen textures. | Handcrafted Saurashtra teak frames, glossy ceramic mugs with steaming chai, and consecrated mandir altars photographed in warm Saurashtra home lighting. |
| **Scale Context** | Isolated frame with no human or furniture reference. | Popsa & Mixbook: Photo books held in hands; frames displayed above sofas or dining credenzas. | Wall Size Visualizer comparing 8×12 through 20×30 in frames against a standard 7-foot living room sofa. |
| **Devotional Art** | Generic clip art or flat scans of murtis. | Consecrated temple darshan imagery with authentic Gujarati shringar, tulsi malas, and silver ornaments. | High-resolution photography of revered regional swaroops (Dwarkadhish, Jalaram Bapa, Khodiyar Maa, Umiya Maa, Somnath). |

---

## 4. Variant and Size Selection (PDP UX)

### Baymard Best Practices:
1. **Explicit Visual State**: Active size, finish, and orientation must be immediately visible without opening hidden dropdown menus.
2. **Instant Price Recalculation**: Changing from 8×12 to 12×18 must immediately update the displayed price without page reload or lag.
3. **Metric & Imperial Equivalents**: Indian shoppers frequently think in inches (12×18) for wall art and centimeters (30×45 cm) for print dimensions. Both must be clearly displayed.
4. **Availability & Turnaround Transparency**: Clearly state if an item is ready for Same-Day Jetpur pickup (2–4 hrs) vs Standard Handcrafted Delivery (2–4 days).

---

## 5. Preview, Personalization & Photo Fitting

### Benchmarking Mixbook, Popsa, and Framebridge:
1. **Client-Side Non-Destructive Transforms**: Image crop, zoom, and pan happen in browser canvas memory using normalized relative coordinates $(x, y, \text{scale}, \text{rotation})$.
2. **Resolution & Print-Safe Safeguards**:
   - Live PPI (Pixels Per Inch) calculation: Warn if uploaded photo falls below 150 DPI for the selected physical print size.
   - Print-Safe Margin (12mm bleed overlay): Ensure heads, eyes, and critical elements do not get cropped behind the wooden frame rabbet or canvas fold.
3. **Privacy-First Zero-Upload Preview**: Visitors must see their photograph inside the frame, on the mug, or in the magazine spreads *without* uploading private family photos to external servers until they choose to confirm.

---

## 6. Cart, Bag & Buying Flow (WhatsApp-First Indian Commerce)

### Benchmarking Indian Gifting Platforms (Zoomin, Printo, Zapvi, iGiftzi):
- **Frictionless Anonymous Bag**: No forced account creation, password setup, or phone OTP walls before adding products to bag.
- **WhatsApp Direct Order Handoff**:
  - Direct WhatsApp link to studio owner Pankajbhai Sakhija (`+91 94290 70317`).
  - Pre-formatted structured order payload: Product name, SKU, selected size, finish, quantity, computed price, and order reference.
  - Clear instructions: Customer shares photo originals on WhatsApp for master retouching and color proofing before payment.
- **Payment & Fulfilment Rules**:
  - **Home Delivery**: 100% online prepayment via UPI (`9429070317@apl` - *Pankaj Laxmichand Sakhija*). Zero COD.
  - **Collect from Studio**: Pay online or pay cash/UPI at the studio counter in Jetpur.

---

## 7. Product-Specific Tactile Animation Guidelines

| Product Type | Animation Benchmark | Interaction Purpose |
| :--- | :--- | :--- |
| **Frames & Wall Art** | Subtle 3D perspective tilt on mousemove / touch drag. | Simulates physical frame depth, glass reflection, and corner joinery. |
| **3D Photo Mugs** | Inertia-damped horizontal 360° rotation with Cold/Hot thermal switch. | Demonstrates wrap-around print coverage and thermochromic magic reveal. |
| **LED Translights** | Smooth luminance fade simulating internal LED backlighting. | Shows how devotional artwork glows in low-light puja rooms. |
| **Magazines & Photobooks** | PageFlip curl with drop shadow and page turn resistance. | Recreates the tactile delight of turning editorial paper spreads. |
| **Acrylic Blocks** | Prismatic refraction and polished diamond edge highlights. | Conveys heavy optical acrylic thickness and standoff mounting. |

---

## 8. Summary of Rebuild Architecture Decisions

1. **Modular Architecture**: Separate the monolithic `catalogue.tsx` into clean domain modules (`ProductDetailView`, `FrameStudio`, `MugStudio`, `DevotionalSanctum`, `MagazineFlipbook`, `ShoppingBag`).
2. **Dedicated Routes**: Every category (`/products/frames`, `/products/mugs`, `/products/devotional`, `/products/gifts`, `/products/magazines`, `/products/phone-covers`, `/products/canvas`, `/products/acrylic`) and individual product (`/products/:category/:slug`) renders as a full, dedicated page with complete metadata and SEO structured data.
3. **Server-Authoritative Pricing**: Pull prices from authoritative pricing engine (`calculateVariantPriceInr`), with live admin override capabilities in Rajmoti OS (`/desk`).
4. **Preserved High-Value Engineering**: Retain Three.js mug canvas, PageFlip book engine, and translight simulation while wrapping them in clean, responsive, photorealistic UI containers.
