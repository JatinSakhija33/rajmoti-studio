import React, { useState, useEffect } from "react";
import {
  ProductFamily,
  PhysicalSizeSpec,
  FrameFinishType,
  PhotoSlotTransform,
  SavedProductDesign,
  PrintExportBundle,
  RAJMOTI_FRAME_SIZES,
} from "./types";
import { ProductionExportEngine } from "./ProductionExportEngine";
import { ThreePhotoMug } from "../live-preview/ThreePhotoMug";
import { FrameCollageCanvas } from "../live-preview/FrameCollageCanvas";
import { TranslightPreview } from "../live-preview/TranslightPreview";
import { CoupleMagazineFlipbook } from "../live-preview/CoupleMagazineFlipbook";
import { GiftTemplateEngine, NoveltyProductType } from "./GiftTemplateEngine";
import { Download, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

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

export function ProductVisualizer({
  productId,
  productFamily,
  size = RAJMOTI_FRAME_SIZES[3], // Default 12×18 in
  finish = "teak",
  primaryPhotoUrl = "/products/frame-sample-wedding.jpg",
  slots,
  customText,
  subText,
  onDesignChanged,
  onExportReady,
  className = "",
}: ProductVisualizerProps) {
  const [currentDesign, setCurrentDesign] = useState<SavedProductDesign>({
    id: `DSG-${productId}-${Date.now().toString(36)}`,
    productId,
    productFamily,
    size,
    finish,
    primaryPhotoUrl,
    slots,
    customText,
    subText,
    dateCreated: new Date().toISOString(),
    highResExportReady: true,
  });

  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Sync state if props change
  useEffect(() => {
    setCurrentDesign((prev) => {
      const next = {
        ...prev,
        productId,
        productFamily,
        size,
        finish,
        primaryPhotoUrl,
        customText,
        subText,
      };
      onDesignChanged?.(next);
      return next;
    });
  }, [productId, productFamily, size, finish, primaryPhotoUrl, customText, subText, onDesignChanged]);

  const handleExport300Dpi = async () => {
    try {
      setIsExporting(true);
      const bundle = await ProductionExportEngine.renderPrintReadyExport(currentDesign, {
        dpi: 300,
        bleedMm: 3,
        includeCutMarks: true,
      });
      onExportReady?.(bundle);
      ProductionExportEngine.triggerPrintDownload(bundle);
      toast.success("High-Resolution 300 DPI production file generated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate print-ready export.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={`product-visualizer-container flex flex-col gap-4 ${className}`}>
      {/* 1. MUG VISUALIZER */}
      {productFamily === "mug" && (
        <ThreePhotoMug
          mugType="magic"
          defaultPhotoUrl={primaryPhotoUrl}
          onPhotoUploaded={(url) => {
            const next = { ...currentDesign, primaryPhotoUrl: url };
            setCurrentDesign(next);
            onDesignChanged?.(next);
          }}
        />
      )}

      {/* 2. FRAME / ACRYLIC / CANVAS COLLAGE VISUALIZER */}
      {(productFamily === "frame" || productFamily === "acrylic" || productFamily === "canvas") && (
        <FrameCollageCanvas
          initialLayout="single"
          initialFinish={finish === "acrylic" ? "acrylic" : finish === "gold" ? "gold" : "teak"}
        />
      )}

      {/* 3. TRANSLIGHT LED ILLUMINATED VISUALIZER */}
      {productFamily === "translight" && (
        <TranslightPreview />
      )}

      {/* 4. MAGAZINE & ALBUM FLIPBOOK */}
      {(productFamily === "magazine" || productFamily === "album") && (
        <CoupleMagazineFlipbook />
      )}

      {/* 5. NOVELTY GIFTS (Clocks, Cushions, Plaques, Puzzles, Keychains, Phone Covers) */}
      {(productFamily === "clock" ||
        productFamily === "cushion" ||
        productFamily === "plaque" ||
        productFamily === "puzzle" ||
        productFamily === "keychain" ||
        productFamily === "phone_cover") && (
        <GiftTemplateEngine
          productType={productFamily as NoveltyProductType}
          defaultPhotoUrl={primaryPhotoUrl}
          customText={customText}
          subText={subText}
          onPhotoUploaded={(url) => {
            const next = { ...currentDesign, primaryPhotoUrl: url };
            setCurrentDesign(next);
            onDesignChanged?.(next);
          }}
        />
      )}

      {/* High-Resolution Production Export Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-700" />
          <span className="text-xs font-semibold text-stone-800">
            Design Calibrated: {currentDesign.size.label} · {currentDesign.finish.toUpperCase()} Finish
          </span>
        </div>

        <button
          type="button"
          disabled={isExporting}
          onClick={handleExport300Dpi}
          className="px-4 py-2 rounded-xl bg-stone-900 text-white hover:bg-stone-800 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
        >
          <Download size={14} className="text-amber-400" />
          <span>{isExporting ? "Generating 300 DPI Export..." : "Generate 300 DPI Lab Print"}</span>
        </button>
      </div>
    </div>
  );
}
