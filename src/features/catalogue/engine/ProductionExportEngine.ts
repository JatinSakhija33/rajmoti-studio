import { SavedProductDesign, PrintExportBundle, PhysicalSizeSpec } from "./types";

export interface ProductionExportOptions {
  dpi?: number; // Default 300 DPI for photographic silver-halide printing
  bleedMm?: number; // Standard 3mm bleed for physical frame trimming
  includeCutMarks?: boolean;
}

/**
 * Loads an image from a URL, Blob or Data URL into an HTMLImageElement
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load customer photograph for high-res export."));
    img.src = src;
  });
}

/**
 * Production Export Engine for Rajmoti Studio
 * Generates true 300 DPI print-ready production files from client-side saved designs.
 */
export class ProductionExportEngine {
  /**
   * Calculates exact print pixel dimensions and bleed geometry
   */
  static calculateDimensions(
    size: PhysicalSizeSpec,
    dpi = 300,
    bleedMm = 3,
  ) {
    const bleedInches = bleedMm / 25.4;
    const widthInchesWithBleed = size.widthInches + bleedInches * 2;
    const heightInchesWithBleed = size.heightInches + bleedInches * 2;
    const targetWidthPx = Math.round(widthInchesWithBleed * dpi);
    const targetHeightPx = Math.round(heightInchesWithBleed * dpi);
    const visibleWidthPx = Math.round(size.widthInches * dpi);
    const visibleHeightPx = Math.round(size.heightInches * dpi);
    const bleedPx = Math.round(bleedInches * dpi);

    return {
      dpi,
      bleedMm,
      bleedInches,
      bleedPx,
      widthInchesWithBleed,
      heightInchesWithBleed,
      targetWidthPx,
      targetHeightPx,
      visibleWidthPx,
      visibleHeightPx,
    };
  }

  /**
   * Generates a 300 DPI print-ready export bundle from a SavedProductDesign
   */
  static async renderPrintReadyExport(
    design: SavedProductDesign,
    options: ProductionExportOptions = {},
  ): Promise<PrintExportBundle> {
    const dpi = options.dpi || 300;
    const bleedMm = options.bleedMm || 3;
    const dims = ProductionExportEngine.calculateDimensions(design.size, dpi, bleedMm);

    const {
      targetWidthPx,
      targetHeightPx,
      visibleWidthPx,
      visibleHeightPx,
      bleedPx,
      widthInchesWithBleed,
      heightInchesWithBleed,
    } = dims;

    // Create high-resolution rendering canvas
    const canvas = document.createElement("canvas");
    canvas.width = targetWidthPx;
    canvas.height = targetHeightPx;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Unable to initialize 2D canvas context for production export.");
    }

    // High quality rendering flags
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // White background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, targetWidthPx, targetHeightPx);

    // Load customer's primary photo
    const image = await loadImage(design.primaryPhotoUrl);

    // Visible frame area inside bleed
    const visibleWidthPx = Math.round(design.size.widthInches * dpi);
    const visibleHeightPx = Math.round(design.size.heightInches * dpi);

    // Apply primary transform
    const primarySlot = design.slots?.[0];
    const zoom = primarySlot?.zoom || 1.0;
    const panX = primarySlot?.panX ? (primarySlot.panX * dpi) / 96 : 0;
    const panY = primarySlot?.panY ? (primarySlot.panY * dpi) / 96 : 0;
    const rotation = primarySlot?.rotation || 0;

    ctx.save();
    // Clip to bleed boundary
    ctx.beginPath();
    ctx.rect(0, 0, targetWidthPx, targetHeightPx);
    ctx.clip();

    // Center transform point
    const centerX = targetWidthPx / 2 + panX;
    const centerY = targetHeightPx / 2 + panY;

    ctx.translate(centerX, centerY);
    if (rotation !== 0) {
      ctx.rotate((rotation * Math.PI) / 180);
    }

    // Cover-fit calculation
    const imgRatio = image.naturalWidth / image.naturalHeight;
    const canvasRatio = targetWidthPx / targetHeightPx;
    let drawW: number;
    let drawH: number;

    if (imgRatio > canvasRatio) {
      drawH = targetHeightPx * zoom;
      drawW = drawH * imgRatio;
    } else {
      drawW = targetWidthPx * zoom;
      drawH = drawW / imgRatio;
    }

    ctx.drawImage(image, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // Render optional custom text or typography overlay
    if (design.customText) {
      ctx.save();
      ctx.fillStyle = design.finish === "teak" || design.finish === "gold" ? "#FAF7F2" : "#1A1A1A";
      ctx.font = `bold ${Math.round(28 * (dpi / 96))}px 'Playfair Display', Georgia, serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";

      const textY = targetHeightPx - bleedPx - Math.round(40 * (dpi / 96));
      ctx.shadowColor = "rgba(0,0,0,0.4)";
      ctx.shadowBlur = Math.round(8 * (dpi / 96));
      ctx.fillText(design.customText, targetWidthPx / 2, textY);

      if (design.subText) {
        ctx.font = `${Math.round(16 * (dpi / 96))}px Montserrat, sans-serif`;
        ctx.fillText(design.subText, targetWidthPx / 2, textY + Math.round(30 * (dpi / 96)));
      }
      ctx.restore();
    }

    // Draw cutting guides if requested
    if (options.includeCutMarks) {
      ctx.save();
      ctx.strokeStyle = "rgba(200, 20, 20, 0.6)";
      ctx.lineWidth = Math.round(2 * (dpi / 96));
      ctx.strokeRect(bleedPx, bleedPx, visibleWidthPx, visibleHeightPx);
      ctx.restore();
    }

    const dataUrl = canvas.toDataURL("image/png");

    return {
      designId: design.id,
      productId: design.productId,
      widthPx: targetWidthPx,
      heightPx: targetHeightPx,
      dpi,
      bleedMm,
      dataUrl,
      paperFinish: design.paperFinish || "lustre",
      instructions: {
        cuttingSize: `${(widthInchesWithBleed).toFixed(2)}×${(heightInchesWithBleed).toFixed(2)} in (${Math.round(widthInchesWithBleed * 25.4)}×${Math.round(heightInchesWithBleed * 25.4)} mm)`,
        visibleSize: `${design.size.label} (${design.size.metric})`,
        notes: `Finish: ${design.finish.toUpperCase()} | Paper: ${(design.paperFinish || "lustre").toUpperCase()} | Fuji Crystal Archive`,
      },
    };
  }

  /**
   * Helper to download the print bundle directly in the browser
   */
  static triggerPrintDownload(bundle: PrintExportBundle, filename?: string) {
    const a = document.createElement("a");
    a.href = bundle.dataUrl;
    a.download = filename || `Rajmoti-Print-${bundle.productId}-${bundle.widthPx}x${bundle.heightPx}-${bundle.dpi}DPI.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
