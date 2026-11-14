# RAJMOTI STUDIO — INFORMATION ARCHITECTURE, SITEMAP & ROUTING SPECIFICATION

**Canonical Base URL:** `https://rajmotistudio.in`  
**Brand Identity:** Rajmoti Studio Jetpur (Est. 1982)  
**Primary Contact:** `+91 94290 70317`  

---

## 1. Clean, Semantic, Shareable URL Hierarchy

Rajmoti Studio provides human-readable, context-rich semantic URLs designed for customer sharing on WhatsApp, social media, and local organic SEO ranking in Saurashtra.

| Semantic Path | Type | Intent & Content Description | Canonical URL |
| :--- | :--- | :--- | :--- |
| `/products` | Landing Page | Master Commerce Boutique: 5 Entry Cards, Occasion Collections, Materials, Same-Day, 3-Tap Gift Finder, Bag | `https://rajmotistudio.in/products` |
| `/products/gifts` | Collection | Curated Personalized Gifts: Mugs, Keychains, Blocks, Cushions | `https://rajmotistudio.in/products/gifts` |
| `/products/gifts/anniversary` | Curated Occasion | Curated anniversary gifting showcase with couple keepsakes | `https://rajmotistudio.in/products/gifts/anniversary` |
| `/products/gifts/birthday` | Curated Occasion | Curated birthday keepsakes, milestone prints & custom mugs | `https://rajmotistudio.in/products/gifts/birthday` |
| `/products/frames` | Product Family | Handcrafted Wall Frames & Heritage Multi-Photo Collages | `https://rajmotistudio.in/products/frames` |
| `/products/frames/anniversary-story` | Product Detail | 3-photo and 5-photo couple timeline collage frame | `https://rajmotistudio.in/products/frames/anniversary-story` |
| `/products/mugs/magic-photo-mug` | Product Detail | Thermochromic magic reveal ceramic mug with 360° touch viewer | `https://rajmotistudio.in/products/mugs/magic-photo-mug` |
| `/products/devotional` | Sacred Landing | Sacred Pavitra Murti Collection: 8 Gujarati deities in acrylic & LED | `https://rajmotistudio.in/products/devotional` |
| `/products/devotional/dwarkadhish` | Sacred Detail | Bhagwan Shri Dwarkadhish Swaroop in Acrylic, Teak Frame & LED | `https://rajmotistudio.in/products/devotional/dwarkadhish` |
| `/products/devotional/jalaram-bapa` | Sacred Detail | Pujya Jalaram Bapa (Virpur Dham) Swaroop & Sadavrat Keepsake | `https://rajmotistudio.in/products/devotional/jalaram-bapa` |
| `/products/devotional/khodiyar-maa` | Sacred Detail | Aai Shri Khodiyar Maa (Matel/Rajpara) Sacred Kuldevi Swaroop | `https://rajmotistudio.in/products/devotional/khodiyar-maa` |
| `/products/devotional/umiya-mataji` | Sacred Detail | Jagat Janani Maa Umiya (Unjha Lakshachandi Dham) Swaroop | `https://rajmotistudio.in/products/devotional/umiya-mataji` |
| `/products/magazines/couple-story` | Product Detail | 8–20 curated photo couple magazine with scannable Spotify track QR | `https://rajmotistudio.in/products/magazines/couple-story` |
| `/products/phone-covers` | Product Family | 120+ model impact-resistant custom photo phone covers | `https://rajmotistudio.in/products/phone-covers` |
| `/photography/baby` | Service Page | Studio baby milestone & newborn photography portfolio | `https://rajmotistudio.in/portfolios/baby` |
| `/photography/maternity` | Service Page | Maternity motherhood portraiture in Jetpur | `https://rajmotistudio.in/portfolios/maternity` |
| `/services/photo-restoration` | Service Page | Archival restoration & colorization of old Saurashtra family photos | `https://rajmotistudio.in/services/photo-restoration` |
| `/same-day` | Local Service | Express 2–4 Hour same-day gifting delivery in Jetpur city | `https://rajmotistudio.in/same-day` |

---

## 2. Redirect Rules & Backwards Compatibility

To maintain compatibility with existing customer links, bookmarks, and shared WhatsApp messages:

1. `/gifts` $\longrightarrow$ Permanent 301 redirect or route alias to `/products`
2. `/gifts?product=:id` $\longrightarrow$ Preserved and loaded into product configurator modal at `/products?product=:id`
3. `/photography/:slug` $\longrightarrow$ Routed directly to `/portfolios/:slug` with canonical tag pointing to `/photography/:slug` or `/portfolios/:slug`
4. `/catalogue` $\longrightarrow$ Redirected to `/products#shop-all`

---

## 3. SEO Metadata & Schema.org Specification

Each semantic route generates:
- **Title Tag**: Clear product/service name + "Rajmoti Studio Jetpur"
- **Meta Description**: Descriptive summary of size, materials, and crafting in Jetpur
- **Canonical Link**: Absolute HTTPS URL matching the primary SKU canonical page
- **OpenGraph & Twitter Card**: Rich preview image with 1200×630px high-res photography
- **Structured Data (JSON-LD)**:
  - `Product`: With price currency `INR`, availability, and merchant `Rajmoti Studio`
  - `BreadcrumbList`: Structured hierarchy (Home $\rightarrow$ Products $\rightarrow$ Category $\rightarrow$ Product)
  - `LocalBusiness`: Verified Jetpur studio facts linking official Google Maps profile
