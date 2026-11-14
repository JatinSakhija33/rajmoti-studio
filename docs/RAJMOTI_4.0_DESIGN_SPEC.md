# RAJMOTI STUDIO 4.0 — COMMERCE DESIGN & ARCHITECTURE SPECIFICATION

## 1. Creative Direction & Brand Identity
- **Tone**: Warm, tactile, photographic luxury editorial boutique. Handcrafted in Jetpur, Gujarat (Est. 1982).
- **Palette**: Warm ivory (`#FCF9F3`, `#FAF7F1`), rich dark charcoal text (`#1C1917`, `#29251F`), earthy amber/gold accents (`#B49A72`, `#92400E`), natural warm wood (`#5A3E26`), and deep sanctum navy (`#16283D`).
- **Typography**: Playfair Display (editorial serifs for headlines and storytelling), Montserrat (clean geometric sans-serif for product specifications, pricing, and filters).
- **Core Standard**: Every product must look desirable, physical, and emotionally meaningful *before* the visitor is asked to customize anything.

---

## 2. Route Matrix & Information Architecture

```
/products                          -> Curated Showroom Landing Page
├── /gifts                         -> Personalized Gifts Department
│   ├── /birthday                  -> Birthday & Milestone Gifts
│   ├── /anniversary               -> Anniversary & Romantic Couple Gifts
│   ├── /couples                   -> Romantic Keepsakes & Custom Sets
│   ├── /family                    -> Heritage Family Portraits & Collages
│   └── /baby                      -> Baby Milestones & First Year Keepsakes
├── /devotional                    -> Sacred Gujarati Mandir Sanctum (10 Deities)
│   ├── /dwarkadhish               -> Consecrated Shri Dwarkadhish Swaroop
│   ├── /jalaram-bapa              -> Pujya Jalaram Bapa (Virpur Dham)
│   ├── /khodiyar-maa              -> Aai Shri Khodiyar Maa
│   └── /somnath                   -> Somnath Mahadev Jyotirlinga
├── /frames                        -> Handcrafted Wall Frames & Heritage Collages
│   └── /:slug                     -> Dedicated Frame PDP (e.g. /frames/anniversary-story)
├── /mugs                          -> 3D Ceramic & Thermochromic Magic Mugs
│   └── /:slug                     -> Dedicated Mug PDP (e.g. /mugs/magic-photo-mug)
├── /acrylic                       -> Diamond Polished Floating Acrylic Blocks
├── /canvas                        -> Fine Art Stretched Cotton Canvas
├── /translight                    -> Backlit Illuminated LED Translights
├── /magazines                     -> Couple Story Editorial Flipbooks (8–20 Photos)
├── /albums                        -> Flush Mount Wedding & Family Heirloom Albums
├── /keychains                     -> Double-Sided Acrylic & Wood Keychains
├── /phone-covers                  -> Impact Resistant Customized Photo Cases
├── /printing                      -> Archival Fine Art Photo Prints
└── /services
    └── /photo-restoration         -> Archival Heirloom Photo Restoration
```

---

## 3. Dedicated Product Detail Page (PDP) Layout Specifications

### Desktop Viewport (>= 1024px):
1. **Left Column (60% width)**:
   - Sticky physical product gallery.
   - Large primary interactive canvas/photograph (aspect ratio matches physical SKU).
   - Interactive modal trigger ("Open Live 3D / Collage Studio").
   - Multi-angle thumbnail strip (Front, Angle, Room Context, Detail Texture).
2. **Right Column (40% width)**:
   - Breadcrumb navigation (`Home > Products > Frames > Royal Heritage Frame`).
   - Product title and subtitle.
   - Live Price (`₹1,499`) with MRP strikethrough and savings badge.
   - **Size Selector**: 8×12, 10×10, 10×14, 12×18, 14×20, 16×24, 18×24, 20×30 in with metric equivalents.
   - **Finish / Material Selector**: Saurashtra Teak Finish, Charcoal Matte, Royal Gold Leaf, Floating Acrylic.
   - **Design Path Choice**:
     - *Personalize It Yourself* (Client-side interactive cropper/canvas)
     - *Let Rajmoti Design It* (Expert studio proofing via WhatsApp)
   - **Action Buttons**:
     - Primary: **Buy Now** (Adds to bag and prompts instant WhatsApp confirmation)
     - Secondary: **Add to Bag** (Adds line item to floating bag)
     - Tertiary: **Chat with Pankajbhai on WhatsApp** (Prefilled product question)
   - **Fulfilment & Delivery Transparency**:
     - Same-Day eligible badge for Jetpur orders placed before 4 PM.
     - 100% online prepayment required for Home Delivery (UPI `9429070317@apl`).
     - Studio Pickup option with pay at counter.
3. **Bottom Section**:
   - Tabbed specifications: Physical Materials & Dimensions, Print Technology (Archival Pigment), Care Instructions.
   - Wall Size Comparison Visualizer widget.
   - Complementary Product Recommendations (e.g., Frame + Matching Mug bundle).

### Mobile Viewport (< 1024px):
- Swipeable gallery with pagination dots at top.
- Clear product title, rating/reviews, and sticky bottom bar containing Price + Buy Now button.
- Clean expandable accordion sections for Dimensions, Materials, and FAQs.

---

## 4. Shared Photo Personalization Engine (`PhotoCanvasEditor.tsx`)
A unified client-side image fitting foundation shared across Frames, Mugs, Translights, and Magazines:
- **Zero Upload Privacy**: Images processed entirely within HTML5 `<canvas>` via `URL.createObjectURL()`. No private customer images sent to external servers.
- **EXIF Handling**: Normalized orientation matrix ensuring smartphone camera uploads don't appear sideways or inverted.
- **Non-Destructive Coordinate State**:
  $$\{ x: \text{number}, y: \text{number}, \text{zoom}: [0.5, 3.0], \text{rotation}: 0 | 90 | 180 | 270, \text{fitMode}: \text{'cover'} | \text{'contain'} \}$$
- **Live PPI Resolution Calculator**:
  $$\text{DPI} = \frac{\min(\text{imageWidth}, \text{imageHeight})}{\min(\text{physicalWidthInches}, \text{physicalHeightInches})}$$
  - $\ge 250$ DPI: Razor Sharp (Green badge)
  - $150 - 249$ DPI: Good Print Quality (Blue badge)
  - $< 150$ DPI: Low Resolution Warning (Amber advisory recommending sharper source photo)
- **Print Bleed Margin**: 12mm toggleable dashed safe-zone overlay.

---

## 5. Curated Artistic Collage Engine
Replaces equal square grids with 6 occasion-specific master design templates:
1. **Anniversary Memory Story**: 3-photo vertical triptych with date banner & couple name calligraphy.
2. **Royal Wedding Mosaic**: Hero full-bleed vertical portrait flanked by 4 candid reception moments.
3. **Romantic Couple Story**: Archival duo-frame with proposal date, latitude/longitude coordinates, and dedication.
4. **Birthday & Milestone**: 4-photo grid with milestone number and personalized wishes.
5. **Baby's First Year**: Hero center portrait encircled by 4 newborn growth milestones.
6. **Heritage Family Legacy**: 5-photo heirloom collage with family surname and ancestral village notation.

---

## 6. Admin Pricing & Availability Management (Rajmoti OS)
- **Authoritative Data Source**: Real product catalogue backed by server-side models in `src/features/catalogue/store.ts` and `src/lib/pricing.ts`.
- **Admin Control**: Studio owner Pankajbhai can configure prices, sizes, availability toggles, and sample photos via `/desk` without code changes.
- **Strict Factual Guardrails**: No unverified teak or fake luxury claims. All dimensions, materials, and turnaround times reflect true Jetpur workshop operations.
