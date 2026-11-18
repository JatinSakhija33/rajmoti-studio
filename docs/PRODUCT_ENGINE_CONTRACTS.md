# Rajmoti Studio — Product Engineering Contracts & Component Interfaces

**Branch**: `feature/rajmoti-product-engine`  
**Team**: Product Engineering Team  
**Integration Status**: Verified, Tested, Ready for Antigravity UI Styling

---

## 1. Architectural Principles

1. **Separation of Concerns**:
   - Customer Image Uploads & Decoded Metadata (`PhotoSlotTransform`)
   - Saved Design Configuration (`SavedProductDesign`)
   - Interactive In-Browser Previews (`<ProductVisualizer />`, `<ThreePhotoMug />`, etc.)
   - Physical Product Specifications (`PhysicalSizeSpec`)
   - High-Resolution Production Print Engine (`ProductionExportEngine`)
2. **Resolution Fidelity**:
   - Customer print files are **never** produced from screen-resolution marketing mockups.
   - The export engine calculates true **300 DPI** output directly from customer original files with standard 3mm bleed margins.
3. **Client-Side Privacy**:
   - All interactive image transformations, cropping, and WebGL textures run 100% locally in the browser with explicit `URL.revokeObjectURL` cleanup to eliminate memory leaks.

---

## 2. Core Data Models (`src/features/catalogue/engine/types.ts`)

### `SavedProductDesign`
```typescript
export interface SavedProductDesign {
  id: string;                         // e.g. "DSG-FRM-001-k9f2b"
  productId: string;                  // e.g. "FRM-001"
  productFamily: ProductFamily;        // "frame" | "mug" | "translight" | "album" | ...
  size: PhysicalSizeSpec;             // Authoritative physical dimensions
  finish: FrameFinishType;            // "teak" | "charcoal" | "gold" | "acrylic" | ...
  paperFinish?: PaperFinishType;      // "matte" | "glossy" | "lustre"
  primaryPhotoUrl: string;            // Customer's calibrated photograph
  slots?: PhotoSlotTransform[];       // For multi-photo collages & spreads
  isLedOn?: boolean;                  // For translight dual-state
  ledColorTemp?: "warm" | "pure";     // 3000K Warm vs 6000K Pure White
  mugType?: "magic" | "white" | "black";
  coverType?: "hardcover" | "softcover";
  customText?: string;                // e.g. "Aarav & Meera"
  subText?: string;                   // e.g. "25th November 2024"
  dateCreated: string;                // ISO timestamp
  highResExportReady: boolean;
}
```

### `PhysicalSizeSpec`
```typescript
export interface PhysicalSizeSpec {
  id: string;                 // "8x12" | "10x10" | "12x18" | "16x24" | "20x30"
  label: string;              // "12×18 in"
  metric: string;             // "30×45 cm"
  widthInches: number;        // 12
  heightInches: number;       // 18
  aspectRatio: string;        // "2 / 3"
  aspectRatioValue: number;   // 0.6667
  popular?: boolean;
}
```

---

## 3. Reusable Visualizer Component Contract (`<ProductVisualizer />`)

Antigravity or any UI author can drop `<ProductVisualizer />` into modal dialogs, drawers, or product detail pages without touching internal rendering math:

### Component Props
```typescript
export interface ProductVisualizerProps {
  productId: string;
  productFamily: ProductFamily;
  size?: PhysicalSizeSpec;
  finish?: FrameFinishType;
  primaryPhotoUrl?: string;
  slots?: PhotoSlotTransform[];
  customText?: string;
  subText?: string;
  onDesignChanged?: (design: SavedProductDesign) => void;
  onExportReady?: (bundle: PrintExportBundle) => void;
  className?: string;
}
```

### Usage Example
```tsx
import { ProductVisualizer } from "@/features/catalogue/engine/ProductVisualizer";
import { RAJMOTI_FRAME_SIZES } from "@/features/catalogue/engine/types";

export function CustomizerModal() {
  return (
    <ProductVisualizer
      productId="FRM-001"
      productFamily="frame"
      size={RAJMOTI_FRAME_SIZES[3]} // 12x18 in
      finish="teak"
      primaryPhotoUrl="/products/visuals/frame-teak-living-room.jpg"
      customText="Together Forever"
      onDesignChanged={(design) => {
        console.log("Updated design configuration:", design);
      }}
      onExportReady={(bundle) => {
        console.log("300 DPI Export Ready:", bundle.dataUrl);
      }}
    />
  );
}
```

---

## 4. Specialized Preview Engines

| Engine Component | Target Products | Tech Stack & Capabilities |
| :--- | :--- | :--- |
| `<ThreePhotoMug />` | Magic mugs, gloss white, matte black | Three.js WebGL cylinder with wrap texture, orbit drag controls, and cold/hot thermal reveal. |
| `<FrameCollageCanvas />` | Single frames, triptych, 4-grid, family 5-photo | Aspect-calibrated canvas with solid wood / acrylic bevel borders, shadow depth, and room scale. |
| `<TranslightPreview />` | Backlit LED translights | Dual-state ambient switch (Daylight OFF vs. 3000K Warm Glow ON) with gold foil shimmer. |
| `<CoupleMagazineFlipbook />`| Editorial magazines, flush mount albums | `page-flip` lay-flat dual page turn engine with custom vows and Spotify song QR codes. |
| `<GiftTemplateEngine />` | Clocks, cushions, desk plaques, puzzles, keychains, phone covers | Aspect-calibrated SVG/HTML5 overlays with Roman numerals, velvet wrinkles, wood stands, and camera cutouts. |

---

## 5. High-Resolution 300 DPI Print Export API

```typescript
import { ProductionExportEngine } from "@/features/catalogue/engine/ProductionExportEngine";

// Generates 300 DPI production print bundle with 3mm bleed
const printBundle = await ProductionExportEngine.renderPrintReadyExport(savedDesign, {
  dpi: 300,
  bleedMm: 3,
  includeCutMarks: true,
});

// Triggers direct download in the browser
ProductionExportEngine.triggerPrintDownload(printBundle);
```

### Output Bundle Specification
- **Resolution**: 300 DPI standard photographic silver-halide
- **Dimensions**:
  - `8×12 in` -> `2471×3671 px` (with 3mm bleed)
  - `12×18 in` -> `3671×5471 px` (with 3mm bleed)
  - `16×24 in` -> `4871×7271 px` (with 3mm bleed)
  - `20×30 in` -> `6071×9071 px` (with 3mm bleed)
- **Metadata**: Cutting size in mm, visible size in inches, and paper finish (lustre/matte).
