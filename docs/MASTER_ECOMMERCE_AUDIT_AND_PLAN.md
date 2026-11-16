# RAJMOTI STUDIO — E-COMMERCE AUDIT & MASTER IMPLEMENTATION PLAN
## Transforming Photography & Gifting into a High-Converting, Emotion-Driven Boutique

---

### Executive Summary

Rajmoti Studio possesses an exceptional foundation: a rich 40+ year heritage in Jetpur, Gujarat (Est. 1982), specialized fine-art photography capabilities, client-side non-destructive personalization tools, and an authentic local customer relationship. 

However, previous storefront iterations functioned largely as technical catalogues or product directories rather than an emotion-led digital boutique. This document establishes the comprehensive technical and psychological blueprint to convert visitors into confident buyers and repeat gifting patrons.

---

## 1. Existing Website Audit

### 1.1 Architecture & Stack
- **Framework & Routing**: TanStack Router (`v1.168.25`) with TanStack Start SSR primitives on Vite (`v7.3.1`) and React 19.
- **Styling & Design System**: Tailwind CSS v4, Playfair Display serif typography, Montserrat sans-serif, and handcrafted warm ivory/earth palettes (`#FAF7F1`, `#29251F`, `#B49A72`).
- **3D & Canvas Rendering**: Three.js (`v0.187.0`) for real-time 360° ceramic and thermochromic mugs, Konva/React-Konva for canvas compositing.
- **Backend & Database**: Dual-mode architecture:
  1. *Supabase Engine* (`@supabase/supabase-js v2.108.2`) for authenticated desk management, client inquiries, bookings, and image storage.
  2. *Reactive Client Storage* (`store.ts` via `useSyncExternalStore`) for local cart, style favorites, and seed catalog persistence.
- **Payment & Fulfilment Engine**:
  - UPI ID: `9429070317@apl`
  - Registered Beneficiary: `PANKAJ LAXMICHAND SAKHIJA`
  - Two strict fulfillment modes:
    1. *Home Delivery*: 100% online prepayment required via dynamic UPI QR / pay link. Zero COD.
    2. *Collect from Rajmoti Studio*: Choice between Online Prepayment or Pay at Counter upon collection.

### 1.2 Working Assets to Preserve
1. **Interactive Craftsmanship Studios**:
   - `ThreePhotoMug.tsx`: Real-time 3D WebGL cylinder with thermal cold/hot chai reveal simulation.
   - `PhotoPersonalizer.tsx`: Client-side drag/pan/zoom, 90° rotation, 12mm print-safe margin guide, and live DPI resolution calculator ($\ge 250$ Razor Sharp, $150–249$ Good, $<150$ Advisory).
   - `FrameCollageCanvas.tsx`: 6 curated artistic templates and wall-scale room visualizer.
   - `CoupleMagazineFlipbook.tsx`: Interactive tactile photobook flipbook with spread previews.
   - `TranslightPreview.tsx`: Diffused optical LED backlighting simulator.
2. **Local SEO & Structured Data**: Comprehensive JSON-LD LocalBusiness metadata, verified Google Maps link (`https://maps.app.goo.gl/nYgKFSidpihg1Nft6`), and geo-coordinates in Jetpur (PIN 360370).
3. **Data Integrity**: Cleaned terminology eliminating unverified claims ("Saurashtra Teak Wood" $\to$ "Natural Teak Finish Wood", "Royal Gold Leaf" $\to$ "Classic Gold Bevel Finish", "master framers" $\to$ studio craftspeople).

### 1.3 Key Friction Points & Gaps
1. **Homepage Navigation & Copy**: Homepage hero and feature sections still have links pointing to legacy `/gifts` instead of the semantic `/products` showroom. Copy focuses on technical product specs rather than the emotional impact of gifting.
2. **Choice Overload**: The catalog has 110 products across 404 variants without an interactive, guided path for first-time gift shoppers.
3. **Missing Gift Add-ons & Bundles**: Cross-sells (gift wrapping, message cards, matching keychains) and pre-curated sets (Anniversary Memory Set, Baby Milestone Collection) are not yet integrated into the product detail page and cart flow.
4. **Lack of Privacy-First E-Commerce Analytics**: No structured event bus tracking funnel progression (e.g. `gift_finder_completed`, `photo_personalization_started`, `bundle_added`, `checkout_initiated`).

---

## 2. Consumer Psychology & Conversion Architecture

To transform the platform into an emotion-driven commerce engine, we embed 10 core psychological principles:

| Principle | Strategic Objective | Concrete Implementation |
| :--- | :--- | :--- |
| **1. Emotional Visualization** | Shift focus from physical object to emotional outcome | Replace raw product specifications with evocative headlines ("Your Favourite Memory, Beautifully Framed") and warm room settings. |
| **2. Endowment Effect** | Foster psychological ownership prior to purchase | Live client-side PhotoPersonalizer lets users see their actual photograph, names, and vows embedded into the frame or mug in real time. |
| **3. Transparent Anchoring** | Clarify quality tiers without artificial markups | Present transparent tiers: *Essential* (Clean Moulding), *Signature* (Archival Matted), *Heritage* (Inner Sparkle/Double Glazed). |
| **4. Authentic Social Proof** | Overcome purchase hesitation | Feature genuine Saurashtra family stories and verified customer reviews without fabricated ratings. |
| **5. Operational Urgency** | Facilitate deadline-driven gift decisions | Display verified local Jetpur turnaround ("Ready for studio pickup in 2–4 hours" or "Same-Day in Jetpur for orders before 2 PM"). |
| **6. Unboxing Experience** | Treat packaging as part of the emotional gift | Offer optional handcrafted gift packaging: embossed studio box, satin ribbon, and printed personalized message cards. |
| **7. Identity & Storytelling** | Celebrate milestone narratives | Organize products into narrative collections: *Our Journey Together*, *First Birthday Milestone*, *Sacred Kuldevi Sanctum*. |
| **8. Cognitive Ease** | Eliminate decision paralysis | 4-step interactive Smart Gift Finder (Recipient $\to$ Occasion $\to$ Budget $\to$ Style) recommending top 3 perfect matches. |
| **9. Craftsmanship Authority** | Differentiate from cheap dropshippers | Highlight 40+ years of photo lab heritage, archival pigment printing, and hand-finished framing in Jetpur. |
| **10. Thoughtful Reciprocity** | Provide upfront value with zero risk | Free live DPI resolution check, complimentary photo aspect autofit, and direct WhatsApp framing consultation. |

---

## 3. Prioritized Implementation Roadmap

### Phase P0: Core Commerce & Emotional Merchandising (Immediate)
- [x] Audit codebase, routing, and data models.
- [ ] **Homepage Transformation**: Rebuild `src/routes/index.tsx` into a 10-section emotion-led gift discovery hub:
  1. *Hero*: "Every Memory Deserves Something Beautiful." with primary CTA to explore personalized gifts and secondary to photography.
  2. *Shop by Occasion*: Visual entry cards (Anniversary, Birthday, Wedding, Baby Milestone, Festivals).
  3. *Shop by Recipient*: Visual filters (For Partner, For Parents, For Couples, For Kids).
  4. *Personalized Bestsellers*: Curated keepsakes with live pricing and variant counts.
  5. *Create Your Own Gift*: Prominent photo upload callout.
  6. *Fine-Art Photography Services*: Links to baby, maternity, family, and wedding sessions.
  7. *Curated Collections*: Tiered and themed groupings (Gifts Under ₹499, Luxury Keepsakes, Devotional Sanctum).
  8. *Why Rajmoti*: Provenance, archival quality, 40+ year Jetpur trust.
  9. *Customer Stories*: Authorized client keepsakes and heartfelt feedback.
  10. *Local Studio Identity*: Physical studio details, Google Maps, WhatsApp desk.
- [ ] **Navigation & Link Audit**: Update all site headers, hero CTAs, and footer links to point to `/products`.

### Phase P1: Revenue & Conversion Optimization
- [ ] **Smart Gift Finder 2.0**: Enhance `GiftFinder.tsx` with 4 interactive questions (Recipient, Occasion, Budget, Style) and instant deterministic scoring matching active products.
- [ ] **PDP Upgrades (`ProductDetailPage.tsx`)**:
  - Add optional gifting add-ons (Gift Wrapping +₹49, Personalized Greeting Card +₹29, Matching Couple Keychain +₹149).
  - Add dynamic delivery date estimation based on location (Jetpur same-day vs Saurashtra courier).
- [ ] **Curated Gift Bundles**:
  - *Anniversary Memory Set* (Framed Story + Keychain + Box).
  - *Baby's First Year Collection* (Milestone Frame + Mini Book).
  - *Family Heritage Trio* (Central Portrait + 2 Tabletop Stands).
- [ ] **Photography-to-Commerce Integration**: Service pages dynamically linking to relevant physical products (e.g. Wedding shoot $\to$ Lay-flat flush mount album & 20×30 wall frame).
- [ ] **Privacy-First Analytics Event Bus**: Implement `src/lib/analytics.ts` tracking standard e-commerce funnel events (`view_item`, `select_gift_filter`, `customize_photo_start`, `add_to_cart`, `begin_checkout`, `order_submitted`) with zero sensitive photo data leakage.

### Phase P2: Retention & Studio Operations
- [ ] Occasion Reminder Program opt-in flow (Save anniversary or birthday for advance reminder).
- [ ] Desk CRM order and bundle fulfillment tracking.
- [ ] Complete test suite verification and build pass.
