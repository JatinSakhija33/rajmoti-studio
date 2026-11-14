# Regional Competitor UX Research & Strategic E-Commerce Blueprint
## In-Depth Analysis of 10 Saurashtra Studios (Junagadh & Rajkot) + National Benchmarks (Zoomin & Printo)

*Document Version:* 1.0  
*Prepared for:* Rajmoti Studio (Jetpur)  
*Scope:* Product grouping, checkout flows, mobile UX, photography storytelling, personalization mechanics, weaknesses to avoid, and exact Rajmoti Studio implementations.

---

## 1. Executive Synthesis

Personalized gifting and studio photography in Saurashtra (Rajkot, Junagadh, Jetpur, Gondal) are distinct from tier-1 metro e-commerce. Local customers prioritize **trust, visual clarity, and personal WhatsApp communication** over automated cart-and-coupon algorithms.

When customers visit a photography and gift studio online, they do **not** want to parse through complex database filters, catalogue codes, or generic product tables before being inspired. The experience must be reversed:
$$\text{See Something Beautiful} \longrightarrow \text{Imagine It as Your Own} \longrightarrow \text{Choose Size / Finish} \longrightarrow \text{Personalize} \longrightarrow \text{Review Bag \& WhatsApp Confirmation}$$

---

## 2. In-Depth Competitor Matrix (10 Regional References)

### A. Junagadh Studios & Gifting Leaders

#### 1. iGiftzi (Impression Studio & Gifts)
- **Location:** Rayjibaug / Madhuram / Timbavadi Road, Junagadh - 362001
- **URLs Inspected:** `igiftzi.com`, `igiftzi.in`
- **Core Specialization:** Personalized collage frames (e.g. *Heart of Memories* frame with 18 supporting photos + 1 hero photo), LED frames, customized mugs and cushions.
- **Configurator Experience:** Explicit photo count requirements per design (e.g. "Upload exactly 19 photos"), custom text inputs for anniversary dates and names, digital proofing approval before physical framing.
- **Key Strength to Adapt:** **Photo count clarity & digital proof approval.** Never leave the customer guessing how many photos fit into a collage.
- **Weaknesses to Avoid:** Intermittent mobile site crashes; slow image upload processing on slower 4G mobile networks.
- **Rajmoti Implementation:** Slot-aware templates (1, 3, 4, 5, and 19-photo Heart Collage) with client-side canvas rendering and zero server uploads during preview.

#### 2. Umang Studio & Photo Gift
- **Location:** Mangnath Road & Zanzarda Road, Junagadh
- **URLs Inspected:** `umangstudioandphotogift.com`, `umangstudio.in`
- **Core Specialization:** Combining wedding photography with a physical photo-gifting storefront.
- **Merchandising & Buying Flow:** Visible starting prices on product cards; 1-tap direct WhatsApp purchase links with pre-filled product names.
- **Key Strength to Adapt:** **Seamless transition from portfolio admiration to WhatsApp buying.**
- **Weaknesses to Avoid:** Cluttered layouts with inconsistent font hierarchy and low-resolution sample photography.
- **Rajmoti Implementation:** Clean editorial card designs with "From ₹..." starting prices and instant WhatsApp quotation triggers.

#### 3. CS The Art Office
- **Location:** Junagadh (Led by Brijesh Patel; operating across Saurashtra)
- **URL Inspected:** `cstheartoffice.com`
- **Core Specialization:** High-end cinematic wedding photography and documentary storytelling.
- **Customer Confidence Elements:** Photographer-led personal branding, prominent social proof, Instagram reels embedded naturally, client testimonials with genuine photos.
- **Key Strength to Adapt:** **Artisan craftsmanship identity.** Framing and photography feel human and artistic, not like a factory assembly line.
- **Weaknesses to Avoid:** No interactive gifting or print selection; purely consultation-based portfolio.
- **Rajmoti Implementation:** Elevate Rajmoti's 40-year Jetpur heritage on `/about` and studio pages while keeping `/products` commercial and shopping-focused.

---

### B. Rajkot Studios & Personalized Retailers

#### 4. Wedd Wibes Studio
- **Location:** Near Satellite Chowk, Rajkot-Morbi Highway, Rajkot
- **URL Inspected:** `weddwibes.com`
- **Core Specialization:** Contemporary wedding photography and couple love stories.
- **Portfolio Structure:** Named project stories (e.g., "Aarav & Riya · Royal Heritage Mandap"), ceremony categorization (Lagan, Pithi, Sangeet), clear consultation steps.
- **Key Strength to Adapt:** **Story-driven portfolio discovery.** Couples hire photographers when they see complete cohesive stories, not isolated snapshots.
- **Weaknesses to Avoid:** Missing pricing transparency; forces users to wait for offline callback.
- **Rajmoti Implementation:** Showcase named stories in `/stories` and link couple albums directly to the editorial Couple Magazine Studio.

#### 5. Siddhi Baby Photography
- **Location:** Kalavad Road, opposite Satya Sai Hospital, Rajkot
- **URL Inspected:** `siddhibabyphotography.in`
- **Core Specialization:** Dedicated fine-art baby studio (Newborn, Infant, Sitter, 1st Year Cake Smash, Maternity).
- **Deliverables & Package Display:** Transparent deliverables matrix (number of setups, digital files, mini-albums, canvas size included).
- **Key Strength to Adapt:** **Category-specific photography packages with clear physical deliverables.**
- **Weaknesses to Avoid:** Baby photography mixed with wedding inquiries without clear separation.
- **Rajmoti Implementation:** Keep Photography completely segregated from Gifting (`/portfolios/baby`, `/portfolios/maternity`) with clear package comparisons.

#### 6. The Cover Lounge
- **Location:** Satya Sai Hospital Main Road, Rajkot
- **URL Inspected:** `thecoverlounge.in`
- **Core Specialization:** Custom photo mobile covers (200+ models), personalized wallets, keychains, and gift bundles.
- **Customer Navigation:** Recipient-led categories ("Gifts for Him", "Gifts for Her", "Couples Sets").
- **Key Strength to Adapt:** **Recipient-focused gift discovery and matching accessories.**
- **Weaknesses to Avoid:** Overwhelming lists of phone models without clean brand filtering.
- **Rajmoti Implementation:** Curated Gift Finder (Who is it for? + Occasion + Budget) and brand-first phone cover selector.

#### 7. MLab 3D
- **Location:** Rajkot, Gujarat
- **URL Inspected:** `mlab3d.com`
- **Core Specialization:** Custom 3D gifts, acrylic photo lamps, customized keepsakes.
- **Buying Flow:** "Request Custom Creation" option for items not in the standard catalogue.
- **Key Strength to Adapt:** **Custom Order Handling.** If a customer wants an irregular frame size or custom collage, provide an explicit "Custom Request" WhatsApp path.
- **Rajmoti Implementation:** "Need a custom size or design?" banner across `/products` linking to WhatsApp consultation.

#### 8. Hakimi Art Gallery
- **Location:** Pedak Road, Rajkot
- **URL Inspected:** `hakimiartgallery.com`
- **Core Specialization:** Luxury home decor, showpieces, religious artwork, framed art.
- **Merchandising:** Guided selection by aesthetic style, fixed pricing, instant WhatsApp ordering.
- **Key Strength to Adapt:** **Guided Gift Discovery.** Visual category tiles instead of text dropdowns.
- **Rajmoti Implementation:** Interactive 3-Tap Gift Finder on `/products` that highlights matching products in real-time.

#### 9. Rangilu Florist & Gifts
- **Location:** Rajkot
- **URL Inspected:** `rangiluflorist.com`
- **Core Specialization:** Personalized gifts, same-day delivery flags, occasion filters.
- **Key Strength to Adapt:** **Urgency & local same-day availability merchandising.**
- **Weaknesses to Avoid:** Unsubstantiated delivery claims across distant cities without owner confirmation.
- **Rajmoti Implementation:** Dedicated `/same-day` route strictly for Jetpur local area with real cutoff times and studio counter pickup.

#### 10. OurShop Rajkot
- **Location:** Rajkot
- **URL Inspected:** `ourshop.in/rajkot`
- **Core Specialization:** High-variety customized merchandise (pillows, clocks, coasters, keychains, acrylic blocks).
- **Key Strength to Adapt:** **Breadth of tangible keepsakes.**
- **Weaknesses to Avoid:** Crowded marketplace feel; lack of editorial photography; looks generic and drops brand trust.
- **Rajmoti Implementation:** Maintain Rajmoti's warm, premium editorial aesthetic while offering high-demand keepsake items.

---

## 3. National Benchmark Lessons (Zoomin & Printo)

1. **Zoomin (Photo Books & Framing):**
   - Seamless cover finish selection (Hardcover Velvet Matte vs. Lustre Gloss).
   - Real-time preview of spine width based on page count (8, 12, 16, 20 pages).
   - Clear DPI warnings when a customer uploads a low-res WhatsApp image.
2. **Printo (Personalized Print & Merchandising):**
   - 3-step configurator: Size $\rightarrow$ Paper/Material $\rightarrow$ Quantity & Personalization.
   - Non-destructive image cropping (Fill Frame vs. Fit Photo) to prevent cutting heads or paghdis.

---

## 4. The 10 Best Features Combined for Rajmoti Studio

| # | Master Feature | Source Inspiration | Rajmoti Studio Implementation |
|---|---|---|---|
| **1** | Photo Count & Bleed Specification | iGiftzi & Zoomin | Exact photo slots (1, 3, 4, 5, 19) with 12mm print-safe bleed in `FrameCollageCanvas`. |
| **2** | 1-Tap WhatsApp Buying with Preserved Bag | Umang Studio & The Cover Lounge | "Your Bag" preserves products, calculates totals, and generates structured WhatsApp orders. |
| **3** | Photographic Story Galleries | Wedd Wibes & CS The Art Office | Named couple stories and authentic Gujarati wedding/milestone portfolio in `/stories`. |
| **4** | Category-Specific Studio Booking | Siddhi Baby Photography | Clean separation of Photography from Gifts; package deliverables clearly itemized. |
| **5** | Recipient & Occasion Collections | The Cover Lounge & Hakimi | Curated collections: "Anniversary & Couples", "Baby & Milestones", "Gifts for Parents". |
| **6** | Custom Product / Irregular Size Requests | MLab 3D | "Custom Keepsake Request" CTA for custom frame mouldings or non-catalogue sizes. |
| **7** | Interactive 3-Tap Gift Finder | Hakimi Art Gallery | Tap Recipient $\rightarrow$ Occasion $\rightarrow$ Budget for instant recommendation. |
| **8** | Same-Day Jetpur Urgency Badging | Rangilu Florist | Clear Jetpur-only cutoff times (2:00 PM Delivery / 6:00 PM Pickup) on `/same-day`. |
| **9** | Real Wall-Size Visualizer | National benchmark | Visual room simulator comparing 8×12, 12×18, 16×24, and 20×30 against furniture. |
| **10** | Regional Devotional Sanctuaries | Regional Saurashtra culture | 10 regional Gujarati deities with sacred mantras in Bitu Acrylic, Teak Finish & Translight. |

---

## 5. Architectural Implementation Plan

```
[MAIN NAVIGATION]
Home  │  Photography  │  Products  │  Collections  │  Our Studio  │  Contact
                         │
                         ├── 1. Personalized Gifts (Mugs, Keychains, Phone Covers)
                         ├── 2. God Photos & Devotional (10 Regional Deities)
                         ├── 3. Frames & Collages (Teak, Charcoal, Gold, Acrylic, Translight)
                         ├── 4. Albums & Magazines (Couple Story Photobooks)
                         └── 5. Curated Gift Finder (3-Tap Discovery)
```

1. **Navigation Overhaul:** Rename "Photo Gifts" to "Products" (`/products`). Keep `/gifts` as an automatic redirect.
2. **Products Landing Page (`/products`):**
   - High-impact visual hero: *"Made personal. Made to keep."*
   - 4 Hero Visual Collections with direct jump links and live previewers.
   - 3-Tap Interactive Gift Finder.
   - Interactive Wall-Size Comparison Guide.
   - "Shop All Products" directory with smart non-conflicting filters.
3. **Filter Logic Correction:**
   - Selecting a Category automatically clears conflicting occasion/material filters.
   - Zero-result state features a prominent "Reset All Filters" button and displays popular recommended items immediately.
4. **Checkout Language:**
   - Replace "Your quote list" with "Your Bag" (`<ShoppingBag />`).
   - Remove "Master catalogue CSV" from customer-facing storefront (preserved in `/desk`).
