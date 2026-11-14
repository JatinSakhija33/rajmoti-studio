# RAJMOTI STUDIO — COMPREHENSIVE STOREFRONT UX AUDIT & COMMERCE UPGRADE REPORT

**Date:** November 2026  
**Auditor:** Senior Product Designer & Local Commerce Architect  
**Brand:** Rajmoti Studio (Jetpur, Saurashtra, Gujarat — Est. 1982)  
**Location:** Station Road / MG Road commercial corridor, Jetpur, Rajkot District  
**Official Google Business Profile:** [https://maps.app.goo.gl/nYgKFSidpihg1Nft6](https://maps.app.goo.gl/nYgKFSidpihg1Nft6)  
**Primary WhatsApp Order Line:** `+91 94290 70317`  
**UPI Recipient ID:** `9429070317@apl` (*Pankaj Laxmichand Sakhija*)  

---

## 1. Executive Summary & Audit Overview

This audit evaluates the transition of Rajmoti Studio from a functional digital prototype and database-heavy catalogue into an emotionally compelling, culturally authentic, high-converting personalized photography and gifting boutique.

### The Prior UX Failure Mode (The "Database Filter Paradox")
Previously, shoppers landing on the storefront were immediately presented with a sterile, top-heavy filter form (`category`, `material`, `shape`, `size`, `printing`, `capacity`, `usage`, `occasion`, `recipient`, `availability`). 
- **The Empty Storefront Bug**: Combining mutually exclusive filters (such as `Category: Gods Devotional Collection` + `Occasion: Anniversary`) produced a `0 matching keepsakes` state with no guidance or recovery path.
- **Administrative Leakage**: Customers saw technical artifacts such as *"Master catalogue CSV"* (an internal export) and *"Product photography pending"* badge placeholders across grid cards.
- **Misaligned Terminology**: Quotations were referred to as *"Your quote list"* or *"shortlist"*, creating friction rather than familiar ecommerce mental models (*"Your Bag"*).
- **Synthetic/Vector Placeholder Aesthetics**: Sample modals displayed abstract geometric silhouettes (vector arches and circular head drawings) instead of photorealistic Saurashtra couples, families, and consecrated deity iconography.

### The New Architecture: Reversed Commerce Flow
The shopping flow is now inverted to match luxury tactile gifting:
$$\text{See Something Beautiful} \longrightarrow \text{Imagine As Your Own} \longrightarrow \text{Select Size \& Finish} \longrightarrow \text{Personalize (Live In-Browser)} \longrightarrow \text{Review Bag \& WhatsApp Confirmation}$$

---

## 2. Comprehensive UX Audit of Core Touchpoints

### 2.1 First Viewport & Visual Hierarchy (`/products`)
| Heuristic | Previous State | Upgraded State | Impact on Conversion |
| :--- | :--- | :--- | :--- |
| **Headline & Brand Promise** | *"Keep a little of what matters"* over a directory link | *"Made personal. Made to keep."* with clear visual value proposition | Establishes immediate emotional warmth and clarity |
| **Primary Visual Entry** | 7 cluttered cards with technical jargon (*"Crafted by master framers"*, *"Live preview engine"*) | **5 Signature Visual Entry Cards**: Personalized Gifts, Devotional Photos, Frames & Prints, Magazines & Albums, Customized Accessories | High-intent customer segment routing in 1 tap |
| **Filter Mechanics** | Mandatory dropdowns at top; strict `&&` across all facets | Semantic category landing pages + smart facet recovery + OR logic within same facets | Zero dead-ends; 100% storefront availability |
| **Administrative Controls** | Public "Master catalogue CSV" button | Completely purged from public storefront; exclusive to `/desk` owner CMS | Protects trade secrets and reduces cognitive load |
| **Cart / Order Mental Model** | "Your quote list", "shortlist", "proposed variants" | **"Your Bag"** with `<ShoppingBag />` icon and badge counter | Matches familiar e-commerce expectations |

---

### 2.2 Product Configuration & Photo Placement System
| Technical Dimension | Specification | Implementation in Rajmoti Studio |
| :--- | :--- | :--- |
| **Photo Fitting** | Intrinsic aspect-ratio matching | Dual `cover` (fill frame) and `contain` (full photo preservation with matting) modes |
| **Focal Point & Panning** | Smooth drag & touch pan | Touch drag and wheel zoom with normalized offset bounds ($x \in [-1, 1], y \in [-1, 1]$) |
| **Bleed & Safe Area** | Mechanical cutting tolerance | Visible print-safe border guides (0.125-inch safe zone indicator) |
| **Resolution Inspection** | DPI/PPI verification | Low-resolution warning triggered if native photo width $< 1200\text{px}$ for $\ge 12\times 18\text{ in}$ prints |
| **Privacy Boundary** | Zero unauthorized server storage | All client-side image processing executed in browser memory (`URL.createObjectURL`); zero telemetry uploads of family portraits |

---

### 2.3 Devotional Collection Architecture
| Attribute | Previous Gift Model | Consecrated Devotional Model |
| :--- | :--- | :--- |
| **Categorization** | Lumped together with novelty mugs and birthday gifts | **Dedicated Sacred Sanctum Journey** (`/products/devotional`) |
| **Deity Swaroop** | Abstract vector art with generic Om symbol | **Consecrated Regional Deities**: Shri Dwarkadhish, Somnath Mahadev, Aai Shri Khodiyar Maa, Pujya Jalaram Bapa (Virpur), Shree Kashtabhanjan Dev Hanumanji, Bhagwan Swaminarayan, Siddhivinayak Ganesha, Radha Krishna Jugal Jodi, Jagat Janani Maa Umiya |
| **Compatible Formats** | Unspecified | Cast Acrylic Block, Teak Finish Wooden Frame, Bitu Acrylic, Illuminated LED Translight |
| **Cultural Propriety** | Romantic anniversary filters active | Consecrated puja occasions only (Griha Pravesh, Diwali, Mandir Sthapana, Daily Darshan); no inappropriate couple tags |

---

### 2.4 Sticky Mobile Commerce Bar
- On viewport widths $< 768\text{px}$, a persistent bottom action drawer anchors:
  - Selected variant summary & calculated INR price
  - Direct **"Buy Now"** button launching instant UPI verification modal
  - Floating contextual **"Order on WhatsApp"** button carrying prefilled SKU details
  - Strict zero-obstruction layout: sits above safe-area inset without blocking content or navigation pills.

---

## 3. Revised Information Architecture (IA) Matrix

```
/ (Homepage)
├── /products (Master Commerce Showcase)
│   ├── /products/gifts (Personalized Gifting Directory)
│   │   ├── /products/gifts/anniversary
│   │   └── /products/gifts/birthday
│   ├── /products/frames (Frames & Multi-Photo Collages)
│   │   └── /products/frames/anniversary-story
│   ├── /products/mugs (Ceramic & Thermochromic Magic Mugs)
│   │   └── /products/mugs/magic-photo-mug
│   ├── /products/devotional (Sacred Mandir Swaroops & Translights)
│   │   ├── /products/devotional/dwarkadhish
│   │   ├── /products/devotional/jalaram-bapa
│   │   ├── /products/devotional/khodiyar-maa
│   │   └── /products/devotional/umiya-mataji
│   ├── /products/magazines (Curated Photobooks & Flipbooks)
│   │   └── /products/magazines/couple-story
│   └── /products/phone-covers (Impact-Resistant Custom Covers)
├── /photography (Studio & Outdoor Portfolios)
│   ├── /photography/baby
│   ├── /photography/maternity
│   ├── /photography/wedding
│   └── /photography/family
├── /services/photo-restoration (Archival Restoration & Digitization)
├── /same-day (Jetpur 2–4 Hr Delivery Service)
└── /desk (Private Owner Operating System — Auth Protected)
```

---

## 4. Payment & Fulfilment Logic Compliance Matrix

1. **Beneficiary Authenticity**:
   - UPI ID: `9429070317@apl`
   - Verified Payee Name: `PANKAJ LAXMICHAND SAKHIJA`
   - Trade Name: `Rajmoti Studio`
2. **Fulfilment Pathways**:
   - **Home Delivery**: 100% online prepayment required. Orders remain in `pending_payment` until UTR verification. COD is strictly disabled.
   - **Collect from Rajmoti Studio**: Customer choice of paying online now or paying cash/UPI at the studio counter upon collection.
3. **WhatsApp Deep Link Contract**:
   - Structured metadata includes `Product Name`, `SKU`, `Size`, `Finish`, `Quantity`, `Personalization Text`, `Calculated Price`, and `Fulfilment Preference`.
   - Never implies that local files are auto-attached by WhatsApp; guides customer to share generated proof or attach original photos directly.
