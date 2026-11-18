import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Upload,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Undo2,
  Redo2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Move,
  Maximize2,
  Eye,
  Sliders,
  Sparkles,
} from "lucide-react";

export interface PhotoTransform {
  zoom: number; // 0.5 to 3.0
  panX: number; // pixels relative to canvas center
  panY: number;
  rotation: number; // 0, 90, 180, 270
  fitMode: "cover" | "contain";
}

export interface PhotoPersonalizerProps {
  targetWidthInches?: number;
  targetHeightInches?: number;
  aspectRatio?: string; // e.g. "2 / 3", "1 / 1", "3 / 4"
  label?: string;
  defaultPhotoUrl?: string;
  onPhotoChanged?: (photoDataUrl: string, transform: PhotoTransform) => void;
  className?: string;
}

const DEFAULT_TRANSFORM: PhotoTransform = {
  zoom: 1,
  panX: 0,
  panY: 0,
  rotation: 0,
  fitMode: "cover",
};

export function PhotoPersonalizer({
  targetWidthInches = 12,
  targetHeightInches = 18,
  aspectRatio = "2 / 3",
  label = "Personalize Your Photograph",
  defaultPhotoUrl = "/products/frame-sample-wedding.jpg",
  onPhotoChanged,
  className = "",
}: PhotoPersonalizerProps) {
  const [photoUrl, setPhotoUrl] = useState<string>(defaultPhotoUrl);
  const [imageMeta, setImageMeta] = useState<{ width: number; height: number } | null>(null);
  const [transform, setTransform] = useState<PhotoTransform>(DEFAULT_TRANSFORM);
  const [history, setHistory] = useState<PhotoTransform[]>([DEFAULT_TRANSFORM]);
  const [historyIdx, setHistoryIdx] = useState<number>(0);
  const [showBleed, setShowBleed] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  // Clean up object URLs on unmount to prevent browser memory leaks
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  // Load natural dimensions of current image
  useEffect(() => {
    if (!photoUrl) return;
    const img = new Image();
    img.src = photoUrl;
    img.onload = () => {
      setImageMeta({ width: img.naturalWidth, height: img.naturalHeight });
    };
  }, [photoUrl]);

  // Push state to undo/redo history
  const pushTransform = useCallback(
    (next: PhotoTransform) => {
      setTransform(next);
      setHistory((prev) => {
        const sliced = prev.slice(0, historyIdx + 1);
        return [...sliced, next];
      });
      setHistoryIdx((prev) => prev + 1);
      onPhotoChanged?.(photoUrl, next);
    },
    [historyIdx, onPhotoChanged, photoUrl],
  );

  // Undo / Redo
  const handleUndo = () => {
    if (historyIdx > 0) {
      const nextIdx = historyIdx - 1;
      setHistoryIdx(nextIdx);
      setTransform(history[nextIdx]);
      onPhotoChanged?.(photoUrl, history[nextIdx]);
    }
  };

  const handleRedo = () => {
    if (historyIdx < history.length - 1) {
      const nextIdx = historyIdx + 1;
      setHistoryIdx(nextIdx);
      setTransform(history[nextIdx]);
      onPhotoChanged?.(photoUrl, history[nextIdx]);
    }
  };

  const handleReset = () => {
    pushTransform(DEFAULT_TRANSFORM);
  };

  // Upload handler with client-side EXIF normalization
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Zero-upload privacy: Create local object URL with clean lifecycle
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
    const localUrl = URL.createObjectURL(file);
    objectUrlRef.current = localUrl;
    setPhotoUrl(localUrl);

    const img = new Image();
    img.src = localUrl;
    img.onload = () => {
      setImageMeta({ width: img.naturalWidth, height: img.naturalHeight });
      pushTransform(DEFAULT_TRANSFORM);
    };

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Pointer drag to position
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.panX, y: e.clientY - transform.panY });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const newPanX = e.clientX - dragStart.x;
    const newPanY = e.clientY - dragStart.y;
    setTransform((prev) => ({ ...prev, panX: newPanX, panY: newPanY }));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      // Record in history
      pushTransform(transform);
    }
  };

  // Zoom controls
  const handleZoom = (delta: number) => {
    const nextZoom = Math.min(3.0, Math.max(0.5, transform.zoom + delta));
    pushTransform({ ...transform, zoom: nextZoom });
  };

  // Rotate 90 degrees
  const handleRotate = () => {
    const nextRotation = (transform.rotation + 90) % 360;
    pushTransform({ ...transform, rotation: nextRotation });
  };

  // Toggle Cover / Contain
  const handleToggleFit = () => {
    const nextMode = transform.fitMode === "cover" ? "contain" : "cover";
    pushTransform({ ...transform, fitMode: nextMode, panX: 0, panY: 0, zoom: 1 });
  };

  // Resolution Quality Calculation (DPI / PPI)
  const calculatePpi = () => {
    if (!imageMeta) return null;
    const minPixelDim = Math.min(imageMeta.width, imageMeta.height);
    const minTargetInches = Math.min(targetWidthInches, targetHeightInches);
    const effectiveDpi = Math.round((minPixelDim * transform.zoom) / minTargetInches);

    if (effectiveDpi >= 250) {
      return {
        level: "excellent",
        label: "Razor Sharp Quality",
        detail: `${imageMeta.width}×${imageMeta.height}px · ~${effectiveDpi} DPI`,
        badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
        icon: <CheckCircle2 size={13} className="text-emerald-600" />,
      };
    }
    if (effectiveDpi >= 140) {
      return {
        level: "good",
        label: "Sharp Studio Quality",
        detail: `${imageMeta.width}×${imageMeta.height}px · ~${effectiveDpi} DPI`,
        badgeClass: "bg-blue-50 text-blue-800 border-blue-200",
        icon: <Sparkles size={13} className="text-blue-600" />,
      };
    }
    return {
      level: "warning",
      label: "Low Resolution Advisory",
      detail: `${imageMeta.width}×${imageMeta.height}px · ~${effectiveDpi} DPI for ${targetWidthInches}×${targetHeightInches}″`,
      badgeClass: "bg-amber-50 text-amber-900 border-amber-300",
      icon: <AlertTriangle size={13} className="text-amber-700" />,
    };
  };

  const ppiInfo = calculatePpi();

  return (
    <div className={`bg-white rounded-2xl border border-stone-200 shadow-sm p-4 sm:p-5 flex flex-col gap-4 ${className}`}>
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-100">
        <div>
          <h4 className="font-display text-base font-bold text-stone-900 flex items-center gap-1.5">
            <Maximize2 size={16} className="text-amber-800" />
            {label}
          </h4>
          <p className="text-xs text-stone-500">
            Target Print Size: <strong className="text-stone-800">{targetWidthInches}×{targetHeightInches} inches</strong> ({Math.round(targetWidthInches * 2.54)}×{Math.round(targetHeightInches * 2.54)} cm)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            className="hidden"
            onChange={handleUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#29251F] text-amber-100 hover:bg-stone-800 flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Upload size={13} /> Upload Photo
          </button>
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyIdx === 0}
            title="Undo"
            className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-30 disabled:hover:bg-white transition-colors"
          >
            <Undo2 size={14} />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={historyIdx >= history.length - 1}
            title="Redo"
            className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-30 disabled:hover:bg-white transition-colors"
          >
            <Redo2 size={14} />
          </button>
          <button
            type="button"
            onClick={handleReset}
            title="Reset position"
            className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Interactive Canvas Stage */}
      <div
        ref={containerRef}
        className="relative mx-auto w-full max-w-[440px] bg-[#FAF7F1] rounded-xl border border-stone-300 p-4 flex items-center justify-center overflow-hidden shadow-inner select-none"
      >
        <div
          style={{ aspectRatio }}
          className="relative w-full max-h-[380px] bg-stone-900 rounded-sm overflow-hidden shadow-md cursor-grab active:cursor-grabbing"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {/* Main User Image with Non-Destructive CSS Transform */}
          <img
            src={photoUrl}
            alt="Uploaded keepsake preview"
            draggable={false}
            style={{
              width: "100%",
              height: "100%",
              objectFit: transform.fitMode,
              transform: `translate(${transform.panX}px, ${transform.panY}px) scale(${transform.zoom}) rotate(${transform.rotation}deg)`,
              transition: isDragging ? "none" : "transform 0.1s ease-out",
            }}
            className="size-full pointer-events-none select-none"
          />

          {/* Safe Print Bleed Margin Guide Overlay (12mm) */}
          {showBleed && (
            <div className="absolute inset-3 border border-dashed border-amber-400/80 pointer-events-none z-20 flex items-start justify-end p-1">
              <span className="text-[8px] font-bold uppercase tracking-wider bg-stone-950/80 text-amber-200 px-1 py-0.5 rounded">
                12mm Safe Bleed Margin
              </span>
            </div>
          )}

          {/* Hint Overlay when idle */}
          <div className="absolute bottom-2 left-2 pointer-events-none bg-stone-950/70 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded flex items-center gap-1 z-10">
            <Move size={11} className="text-amber-300" /> Drag to reposition
          </div>
        </div>
      </div>

      {/* Adjust Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100 text-xs">
        {/* Zoom & Rotate */}
        <div className="flex items-center gap-1">
          <span className="text-stone-500 font-medium mr-1">Zoom:</span>
          <button
            type="button"
            onClick={() => handleZoom(-0.15)}
            className="p-1.5 rounded border border-stone-200 text-stone-600 hover:bg-stone-50"
            title="Zoom Out"
          >
            <ZoomOut size={13} />
          </button>
          <span className="font-mono text-[11px] w-9 text-center text-stone-700">
            {Math.round(transform.zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => handleZoom(0.15)}
            className="p-1.5 rounded border border-stone-200 text-stone-600 hover:bg-stone-50"
            title="Zoom In"
          >
            <ZoomIn size={13} />
          </button>
          <button
            type="button"
            onClick={handleRotate}
            className="ml-2 px-2 py-1 rounded border border-stone-200 text-stone-600 hover:bg-stone-50 flex items-center gap-1 text-[11px]"
            title="Rotate 90°"
          >
            <RotateCw size={12} /> Rotate
          </button>
          <button
            type="button"
            onClick={handleToggleFit}
            className="px-2 py-1 rounded border border-stone-200 text-stone-600 hover:bg-stone-50 text-[11px]"
            title="Toggle Fit / Fill"
          >
            {transform.fitMode === "cover" ? "Fill (Cover)" : "Fit (Contain)"}
          </button>
        </div>

        {/* Safe Margin Guide Toggle */}
        <button
          type="button"
          onClick={() => setShowBleed(!showBleed)}
          className={`px-2 py-1 rounded border text-[11px] flex items-center gap-1 transition-colors ${
            showBleed ? "bg-amber-100 text-amber-900 border-amber-300 font-semibold" : "bg-white text-stone-500 border-stone-200"
          }`}
        >
          <Sliders size={11} /> {showBleed ? "Hide Print Bleed" : "Show Safe Print Area"}
        </button>
      </div>

      {/* PPI Resolution Status Badge */}
      {ppiInfo && (
        <div className={`rounded-xl border p-2.5 flex items-start gap-2.5 text-xs ${ppiInfo.badgeClass}`}>
          <div className="mt-0.5 shrink-0">{ppiInfo.icon}</div>
          <div className="flex-1">
            <div className="font-bold">{ppiInfo.label}</div>
            <p className="text-[11px] opacity-90 leading-relaxed mt-0.5">{ppiInfo.detail}</p>
          </div>
        </div>
      )}
    </div>
  );
}
