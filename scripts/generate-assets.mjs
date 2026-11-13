import { writeFileSync, mkdirSync } from "node:fs";

mkdirSync("public/products", { recursive: true });
mkdirSync("public/portfolio", { recursive: true });
mkdirSync("public/deities", { recursive: true });

function createSvgArt({ width = 1200, height = 1500, bgGradient, elements, title, subtitle, kicker, goldAccents = false }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      ${bgGradient}
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="50%">
      <stop offset="0%" stop-color="#E2C17C"/>
      <stop offset="50%" stop-color="#FDF3CD"/>
      <stop offset="100%" stop-color="#B88A3B"/>
    </linearGradient>
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="30" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <filter id="shadow">
      <feDropShadow dx="0" dy="12" stdDeviation="20" flood-color="#000" flood-opacity="0.25"/>
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="${width}" height="${height}" fill="url(#bg)"/>

  <!-- Atmosphere & Studio Lighting -->
  <circle cx="${width * 0.5}" cy="${height * 0.35}" r="${width * 0.45}" fill="#FFF8EE" opacity="0.08" filter="url(#softGlow)"/>
  <circle cx="${width * 0.85}" cy="${height * 0.15}" r="${width * 0.3}" fill="#FFE6B8" opacity="0.12" filter="url(#softGlow)"/>

  <!-- Decorative Inner Border -->
  <rect x="36" y="36" width="${width - 72}" height="${height - 72}" rx="12" fill="none" stroke="${goldAccents ? "url(#gold)" : "#FFFFFF"}" stroke-width="2" opacity="0.4"/>
  <rect x="48" y="48" width="${width - 96}" height="${height - 96}" rx="8" fill="none" stroke="${goldAccents ? "url(#gold)" : "#FFFFFF"}" stroke-width="1" opacity="0.2"/>

  <!-- Main Illustration / Graphic Elements -->
  ${elements}

  <!-- Studio Typography & Branding -->
  <g transform="translate(0, ${height - 220})" text-anchor="middle">
    ${kicker ? `<text x="${width / 2}" y="0" fill="${goldAccents ? "#E2C17C" : "#E2D9CC"}" font-family="'Montserrat', sans-serif" font-size="20" font-weight="600" letter-spacing="6" text-transform="uppercase">${kicker}</text>` : ""}
    ${title ? `<text x="${width / 2}" y="52" fill="#FFFFFF" font-family="'Playfair Display', serif" font-size="44" font-weight="bold">${title}</text>` : ""}
    ${subtitle ? `<text x="${width / 2}" y="95" fill="#E6DAC8" font-family="'Montserrat', sans-serif" font-size="22" letter-spacing="2" opacity="0.95">${subtitle}</text>` : ""}
    <text x="${width / 2}" y="145" fill="#C5B6A0" font-family="'Montserrat', sans-serif" font-size="16" letter-spacing="5">RAJMOTI STUDIO · JETPUR (EST. 1982)</text>
  </g>
</svg>`;
}

// 1. Wedding Sample
writeFileSync("public/products/frame-sample-wedding.svg", createSvgArt({
  bgGradient: '<stop offset="0%" stop-color="#2D1F1A"/><stop offset="50%" stop-color="#4A2E24"/><stop offset="100%" stop-color="#1A120F"/>',
  goldAccents: true,
  kicker: "Royal Heritage Wedding Collection",
  title: "Aarav & Riya",
  subtitle: "24 November 2026 · Rajkot",
  elements: `
    <g filter="url(#shadow)" transform="translate(350, 320)">
      <!-- Arch Gate Backdrop -->
      <path d="M 250 80 C 120 80, 50 180, 50 480 L 450 480 C 450 180, 380 80, 250 80 Z" fill="#42291E" opacity="0.7"/>
      <path d="M 250 100 C 135 100, 75 195, 75 480 L 425 480 C 425 195, 365 100, 250 100 Z" fill="none" stroke="url(#gold)" stroke-width="2" opacity="0.6"/>
      <!-- Silhouettes of Couple in Royal Pose -->
      <circle cx="215" cy="220" r="45" fill="#F4E8D6"/>
      <circle cx="285" cy="235" r="40" fill="#EAD5BA"/>
      <!-- Groom Sherwani & Turban -->
      <path d="M 180 260 Q 215 250 250 260 L 260 520 L 170 520 Z" fill="#8B2522"/>
      <polygon points="195,180 235,180 220,150 200,165" fill="#E2C17C"/>
      <!-- Bride Lehenga & Dupatta -->
      <path d="M 250 270 Q 290 265 320 285 L 350 520 L 250 520 Z" fill="#991B1B"/>
      <path d="M 250 200 Q 320 220 340 380" stroke="url(#gold)" stroke-width="8" fill="none" opacity="0.8"/>
    </g>
  `
}));

// 2. Family Sample
writeFileSync("public/products/frame-sample-family.svg", createSvgArt({
  bgGradient: '<stop offset="0%" stop-color="#242B28"/><stop offset="50%" stop-color="#3A4843"/><stop offset="100%" stop-color="#181F1C"/>',
  goldAccents: false,
  kicker: "Generations of Togetherness",
  title: "The Sakhija Family",
  subtitle: "Cherished Moments at Home",
  elements: `
    <g filter="url(#shadow)" transform="translate(340, 350)">
      <!-- Family group silhouettes -->
      <circle cx="160" cy="210" r="42" fill="#F0E5D8"/>
      <circle cx="260" cy="190" r="45" fill="#F4EADB"/>
      <circle cx="360" cy="215" r="40" fill="#EADECF"/>
      <circle cx="260" cy="300" r="32" fill="#FBF5ED"/>
      <!-- Garments -->
      <path d="M 120 250 C 120 250, 160 240, 200 250 L 205 500 L 115 500 Z" fill="#50665B"/>
      <path d="M 210 235 C 210 235, 260 225, 310 235 L 315 500 L 205 500 Z" fill="#3D4E46"/>
      <path d="M 320 255 C 320 255, 360 245, 400 255 L 405 500 L 315 500 Z" fill="#6B7F74"/>
      <path d="M 225 330 C 225 330, 260 320, 295 330 L 295 500 L 225 500 Z" fill="#C59B5F"/>
    </g>
  `
}));

// 3. Baby Milestone Sample
writeFileSync("public/products/frame-sample-baby.svg", createSvgArt({
  bgGradient: '<stop offset="0%" stop-color="#3B342B"/><stop offset="50%" stop-color="#544B3F"/><stop offset="100%" stop-color="#26211B"/>',
  goldAccents: true,
  kicker: "First Year Milestone Portfolio",
  title: "Baby Shivam",
  subtitle: "6 Months Old · Little Explorer",
  elements: `
    <g filter="url(#shadow)" transform="translate(360, 330)">
      <!-- Woven studio basket -->
      <ellipse cx="240" cy="380" rx="190" ry="85" fill="#8C6E4A"/>
      <ellipse cx="240" cy="365" rx="175" ry="70" fill="#FFF8EE"/>
      <!-- Baby sitting peacefully -->
      <circle cx="240" cy="230" r="58" fill="#FDF4EA"/>
      <path d="M 195 285 Q 240 270 285 285 L 295 400 L 185 400 Z" fill="#E8D5C4"/>
      <!-- Baby crown / floral wreath -->
      <circle cx="240" cy="225" r="64" fill="none" stroke="url(#gold)" stroke-width="5" stroke-dasharray="10 8"/>
    </g>
  `
}));

// 4. Anniversary Sample
writeFileSync("public/products/frame-sample-anniversary.svg", createSvgArt({
  bgGradient: '<stop offset="0%" stop-color="#301A24"/><stop offset="50%" stop-color="#4C2B3A"/><stop offset="100%" stop-color="#1E0E16"/>',
  goldAccents: true,
  kicker: "Silver Jubilee Celebration",
  title: "Pankaj & Geeta",
  subtitle: "25 Glorious Years of Togetherness",
  elements: `
    <g filter="url(#shadow)" transform="translate(350, 330)">
      <!-- Intertwined Hearts / Ring symbol -->
      <path d="M 250 180 C 210 120, 140 160, 180 230 L 250 300 L 320 230 C 360 160, 290 120, 250 180 Z" fill="none" stroke="url(#gold)" stroke-width="4"/>
      <circle cx="205" cy="340" r="44" fill="#F5EADB"/>
      <circle cx="295" cy="350" r="42" fill="#EFE0CE"/>
      <path d="M 160 380 Q 205 370 250 380 L 255 520 L 150 520 Z" fill="#6A3B52"/>
      <path d="M 250 390 Q 295 380 340 390 L 345 520 L 245 520 Z" fill="#884C69"/>
    </g>
  `
}));

// 5. Translight LED Backlit Sample (Rich glowing couple for warm/cool light toggles)
writeFileSync("public/products/translight-sample.svg", createSvgArt({
  bgGradient: '<stop offset="0%" stop-color="#14110E"/><stop offset="50%" stop-color="#2B2117"/><stop offset="100%" stop-color="#0E0C0A"/>',
  goldAccents: true,
  kicker: "Archival Edge-Lit LED Translight",
  title: "Vows in the Golden Hour",
  subtitle: "High-Diffusion Translucent Art Film",
  elements: `
    <g filter="url(#shadow)" transform="translate(350, 290)">
      <!-- Glowing sunburst backlit circle -->
      <circle cx="250" cy="270" r="230" fill="#FFC966" opacity="0.35" filter="url(#softGlow)"/>
      <circle cx="250" cy="270" r="170" fill="#FFE2A3" opacity="0.5" filter="url(#softGlow)"/>
      <circle cx="250" cy="270" r="100" fill="#FFF7DE" opacity="0.7" filter="url(#softGlow)"/>
      <!-- Silhouettes illuminated by backlighting -->
      <circle cx="215" cy="250" r="45" fill="#2E1C12"/>
      <circle cx="285" cy="265" r="40" fill="#2E1C12"/>
      <path d="M 175 295 C 175 295, 215 285, 255 295 L 260 520 L 170 520 Z" fill="#1C110B"/>
      <path d="M 255 305 C 255 305, 295 295, 335 305 L 340 520 L 250 520 Z" fill="#180F0A"/>
      <!-- Golden Light Rim on Edges -->
      <path d="M 215 205 C 235 205, 255 220, 258 245" stroke="#FFE2A3" stroke-width="4" fill="none"/>
      <path d="M 290 225 C 310 225, 325 240, 328 265" stroke="#FFE2A3" stroke-width="4" fill="none"/>
    </g>
  `
}));

// 6. Ceramic Mug Wrap Texture Graphic
writeFileSync("public/products/mug-sample-couple.svg", `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="512" viewBox="0 0 1024 512">
  <defs>
    <linearGradient id="mugBg" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FAF6F0"/>
      <stop offset="50%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#FAF6F0"/>
    </linearGradient>
    <linearGradient id="goldMug" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#B88A3B"/>
      <stop offset="50%" stop-color="#E2C17C"/>
      <stop offset="100%" stop-color="#966C27"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="512" fill="url(#mugBg)"/>
  
  <!-- Central Frame -->
  <rect x="256" y="64" width="512" height="384" rx="16" fill="#2E1C16"/>
  <rect x="264" y="72" width="496" height="368" rx="12" fill="none" stroke="url(#goldMug)" stroke-width="3"/>

  <!-- Couple Graphic -->
  <circle cx="480" cy="220" r="50" fill="#F4E8D6"/>
  <circle cx="545" cy="235" r="45" fill="#EAD5BA"/>
  <path d="M 435 270 Q 480 260 520 270 L 530 400 L 420 400 Z" fill="#991B1B"/>
  <path d="M 515 280 Q 555 270 595 285 L 610 400 L 510 400 Z" fill="#7F1D1D"/>
  
  <!-- Mug Typography -->
  <text x="512" y="340" text-anchor="middle" fill="#FFFFFF" font-family="'Playfair Display', serif" font-size="28" font-weight="bold">Together Forever</text>
  <text x="512" y="375" text-anchor="middle" fill="#E2C17C" font-family="'Montserrat', sans-serif" font-size="14" letter-spacing="3">AARAV &amp; RIYA · 2026</text>
  <text x="512" y="475" text-anchor="middle" fill="#8B6D3F" font-family="'Montserrat', sans-serif" font-size="12" letter-spacing="4">RAJMOTI STUDIO · JETPUR</text>
</svg>`);

// 7. Magazine Editorial Covers & Spreads
writeFileSync("public/products/magazine-cover.svg", createSvgArt({
  bgGradient: '<stop offset="0%" stop-color="#1E1916"/><stop offset="50%" stop-color="#342B25"/><stop offset="100%" stop-color="#14110E"/>',
  goldAccents: true,
  kicker: "Editorial Edition · Issue No. 01",
  title: "The Story of Us",
  subtitle: "Aarav & Riya · 24 Nov 2026",
  elements: `
    <g transform="translate(360, 320)">
      <rect x="0" y="0" width="480" height="540" rx="8" fill="#453830" opacity="0.6"/>
      <rect x="15" y="15" width="450" height="510" rx="6" fill="none" stroke="url(#gold)" stroke-width="2" opacity="0.7"/>
      <circle cx="210" cy="220" r="55" fill="#F4E8D6"/>
      <circle cx="275" cy="235" r="48" fill="#EAD5BA"/>
      <path d="M 160 275 Q 210 260 255 275 L 265 480 L 150 480 Z" fill="#991B1B"/>
      <path d="M 250 285 Q 290 275 330 290 L 340 480 L 240 480 Z" fill="#7F1D1D"/>
    </g>
  `
}));

// 8. 8 Authentic Deities in Gujarati Culture
const deities = [
  { slug: "shrinathji", name: "Shree Shrinathji Swaroop", sub: "Pushtimarg Divine Darshan · Nathdwara", color: "#16283D" },
  { slug: "ganesha", name: "Shree Siddhivinayak Ganesha", sub: "Vighnaharta · Shubh Labh", color: "#4A1C16" },
  { slug: "radha-krishna", name: "Shree Radha Krishna", sub: "Vrindavan Prem Swaroop", color: "#2B1A3F" },
  { slug: "shiva-parvati", name: "Kailash Pati Shiva Parvati", sub: "Mahadev · Somnath Temple", color: "#1C2E2A" },
  { slug: "ram-darbar", name: "Maryada Purushottam Ram Darbar", sub: "Ayodhya Ram Mandir", color: "#422812" },
  { slug: "tirupati-balaji", name: "Sri Venkateswara Balaji", sub: "Govinda · Tirumala Swaroop", color: "#1E182A" },
  { slug: "umiya-mataji", name: "Jagat Janani Maa Umiya", sub: "Kuldevi Darshan · Unjha", color: "#3B141C" },
  { slug: "khodiyar-mataji", name: "Aai Shri Khodiyar Maa", sub: "Matel Dham · Pavaiya Swaroop", color: "#381726" }
];

for (const d of deities) {
  writeFileSync(`public/deities/${d.slug}.svg`, createSvgArt({
    bgGradient: `<stop offset="0%" stop-color="${d.color}"/><stop offset="100%" stop-color="#0F0C09"/>`,
    goldAccents: true,
    kicker: "Pavitra Murti Collection",
    title: d.name,
    subtitle: d.sub,
    elements: `
      <g filter="url(#shadow)" transform="translate(360, 280)">
        <!-- Divine Halo & Shrine Arch -->
        <circle cx="240" cy="270" r="210" fill="#FFD77A" opacity="0.25" filter="url(#softGlow)"/>
        <path d="M 240 70 C 130 70, 70 160, 70 490 L 410 490 C 410 160, 350 70, 240 70 Z" fill="none" stroke="url(#gold)" stroke-width="4"/>
        <circle cx="240" cy="240" r="90" fill="#FFEAA8" opacity="0.3"/>
        <!-- Lotus Base -->
        <ellipse cx="240" cy="480" rx="160" ry="40" fill="url(#gold)"/>
        <text x="240" y="320" text-anchor="middle" fill="#FFF2D6" font-family="'Playfair Display', serif" font-size="70" font-weight="bold">ॐ</text>
      </g>
    `
  }));
}

// 9. Portfolio Specific Images
const portfolioCategories = [
  { slug: "baby-milestone", title: "Baby & Milestone Portraits", sub: "Newborn, Sitter & 1st Birthday" },
  { slug: "maternity-grace", title: "Maternity & Motherhood", sub: "Fine Art Maternity Portraits" },
  { slug: "wedding-mandap", title: "Weddings & Traditional Ceremonies", sub: "Lagan, Pithi, Mandap & Reception" },
  { slug: "family-heritage", title: "Heritage Family Portraits", sub: "Generations Together in Jetpur" },
  { slug: "birthday-celebration", title: "Birthday Cake & Milestones", sub: "Joyful Celebrations" },
  { slug: "couple-prewedding", title: "Pre-Wedding & Couple Stories", sub: "Romantic Editorial Portraits" }
];

for (const p of portfolioCategories) {
  writeFileSync(`public/portfolio/${p.slug}.svg`, createSvgArt({
    bgGradient: '<stop offset="0%" stop-color="#2B231D"/><stop offset="50%" stop-color="#44372E"/><stop offset="100%" stop-color="#1C1613"/>',
    goldAccents: true,
    kicker: "Rajmoti Studio Portfolio",
    title: p.title,
    subtitle: p.sub,
    elements: `
      <g transform="translate(380, 340)">
        <rect x="0" y="0" width="440" height="480" rx="12" fill="#58483D" opacity="0.5"/>
        <rect x="12" y="12" width="416" height="456" rx="8" fill="none" stroke="url(#gold)" stroke-width="2" opacity="0.6"/>
        <circle cx="220" cy="200" r="70" fill="#F4E8D6"/>
        <path d="M 140 270 C 140 270, 220 250, 300 270 L 310 460 L 130 460 Z" fill="#991B1B" opacity="0.9"/>
      </g>
    `
  }));
}

console.log("Art-directed photographic assets generated successfully!");
