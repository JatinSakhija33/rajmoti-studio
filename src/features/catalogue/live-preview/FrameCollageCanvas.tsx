import React, { useState, useRef, useEffect } from "react";
import { Upload, RotateCcw, ZoomIn, ZoomOut, Check, Eye, AlertCircle } from "lucide-react";

export type FrameLayout = "single" | "triptych" | "grid4" | "family5";
export type FrameFinish = "teak" | "charcoal" | "gold" | "acrylic";

interface Slot {
  id: number;
  x: number; // percentage
  y: number;
  width: number;
  height: number;
  photoUrl?: string;
  zoom: number;
  panX: number;
  panY: number;
}

const LAYOUTS: Record<FrameLayout, { name: string; slots: Omit<Slot, "photoUrl" | "zoom" | "panX" | "panY">[] }> = {
  single: {
    name: "Classic Single Frame",
    slots: [{ id: 0, x: 5, y: 5, width: 90, height: 90 }],
  },
  triptych: {
    name: "3-Photo Anniversary Story",
    slots: [
      { id: 0, x: 5, y: 8, width: 28, height: 84 },
      { id: 1, x: 36, y: 8, width: 28, height: 84 },
      { id: 2, x: 67, y: 8, width: 28, height: 84 },
    ],
  },
  grid4: {
    name: "4-Photo Family Moments",
    slots: [
      { id: 0, x: 6, y: 6, width: 42, height: 42 },
      { id: 1, x: 52, y: 6, width: 42, height: 42 },
      { id: 2, x: 6, y: 52, width: 42, height: 42 },
      { id: 3, x: 52, y: 52, width: 42, height: 42 },
    ],
  },
  family5: {
    name: "5-Photo Heritage Collage",
    slots: [
      { id: 0, x: 6, y: 6, width: 52, height: 88 },
      { id: 1, x: 61, y: 6, width: 33, height: 20 },
      { id: 2, x: 61, y: 28, width: 33, height: 20 },
      { id: 3, x: 61, y: 50, width: 33, height: 20 },
      { id: 4, x: 61, y: 72, width: 33, height: 22 },
    ],
  },
};

interface FrameCollageCanvasProps {
  size: string;
  finish?: FrameFinish;
  customText?: string;
  subText?: string;
  onPhotosChanged?: (urls: string[]) => void;
}

export function FrameCollageCanvas({
  size,
  finish = "teak",
  customText = "",
  subText = "",
  onPhotosChanged,
}: FrameCollageCanvasProps) {
  const [layoutType, setLayoutType] = useState<FrameLayout>("single");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [activeSlotId, setActiveSlotId] = useState<number>(0);
  const [showBleed, setShowBleed] = useState(true);
  const [resolutionWarning, setResolutionWarning] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize slots when layout changes
  useEffect(() => {
    const config = LAYOUTS[layoutType];
    setSlots(
      config.slots.map((s) => ({
        ...s,
        photoUrl: undefined,
        zoom: 1,
        panX: 0,
        panY: 0,
      })),
    );
    setActiveSlotId(0);
  }, [layoutType]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);

    const img = new Image();
    img.src = url;
    img.onload = () => {
      if (img.naturalWidth < 1200 || img.naturalHeight < 1200) {
        setResolutionWarning(
          `Resolution check: Photo is ${img.naturalWidth}×${img.naturalHeight}px. For best 300 DPI print quality, original camera photos are recommended.`,
        );
      } else {
        setResolutionWarning("");
      }
    };

    setSlots((prev) => {
      const next = prev.map((s) => (s.id === activeSlotId ? { ...s, photoUrl: url, zoom: 1, panX: 0, panY: 0 } : s));
      const urls = next.map((s) => s.photoUrl).filter(Boolean) as string[];
      onPhotosChanged?.(urls);
      return next;
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const updateZoom = (delta: number) => {
    setSlots((prev) =>
      prev.map((s) => (s.id === activeSlotId ? { ...s, zoom: Math.min(3, Math.max(0.5, s.zoom + delta)) } : s)),
    );
  };

  // Border styles matching physical Rajmoti frames
  const getFrameBorderStyle = () => {
    if (finish === "teak") {
      return "border-[16px] border-[#5A3E26] shadow-[inset_0_0_12px_rgba(0,0,0,0.6),0_16px_36px_rgba(50,30,15,0.25)] rounded-sm";
    }
    if (finish === "charcoal") {
      return "border-[16px] border-[#221F1C] shadow-[inset_0_0_8px_rgba(0,0,0,0.8),0_16px_36px_rgba(0,0,0,0.3)] rounded-sm";
    }
    if (finish === "gold") {
      return "border-[16px] border-[#B89758] shadow-[inset_0_0_10px_rgba(255,255,255,0.4),0_16px_40px_rgba(150,110,40,0.2)] rounded-sm";
    }
    // Acrylic block
    return "border-[4px] border-white/80 shadow-[0_20px_50px_rgba(0,0,0,0.18)] rounded-xl backdrop-blur-sm";
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Layout Selection Pills */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-2">
        <span className="text-xs font-semibold text-stone-700">Frame Composition:</span>
        <div className="flex flex-wrap gap-1">
          {(Object.keys(LAYOUTS) as FrameLayout[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setLayoutType(key)}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                layoutType === key ? "bg-[#29251F] text-amber-100" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
            >
              {LAYOUTS[key].name}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Frame Canvas Stage */}
      <div className="relative mx-auto w-full max-w-[480px] aspect-[4/3] bg-[#FAF7F1] p-3 rounded-2xl flex items-center justify-center overflow-hidden">
        {/* Frame Structure */}
        <div
          className={`relative size-full bg-[#FCFAF6] transition-all duration-300 ${getFrameBorderStyle()} overflow-hidden`}
        >
          {/* Subtle Glass/Acrylic Reflection Overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/30 pointer-events-none z-20" />

          {/* Safe Print Bleed Overlay */}
          {showBleed && (
            <div className="absolute inset-3 border border-dashed border-amber-400/70 pointer-events-none z-30 flex items-start justify-end p-1">
              <span className="text-[8px] font-bold tracking-wider uppercase bg-[#29251F]/80 text-white px-1 py-0.5 rounded">
                Safe Bleed Margin
              </span>
            </div>
          )}

          {/* Slots Grid */}
          {slots.map((slot) => {
            const isActive = slot.id === activeSlotId;
            return (
              <div
                key={slot.id}
                onClick={() => setActiveSlotId(slot.id)}
                style={{
                  left: `${slot.x}%`,
                  top: `${slot.y}%`,
                  width: `${slot.width}%`,
                  height: `${slot.height}%`,
                }}
                className={`absolute overflow-hidden cursor-pointer transition-all ${
                  isActive ? "ring-2 ring-[#B49A72] z-10" : "hover:opacity-90"
                } ${slot.photoUrl ? "bg-stone-100" : "bg-stone-200/70 border border-dashed border-stone-400/80 flex flex-col items-center justify-center p-2 text-center"}`}
              >
                {slot.photoUrl ? (
                  <img
                    src={slot.photoUrl}
                    alt={`Photo slot ${slot.id + 1}`}
                    style={{
                      transform: `scale(${slot.zoom}) translate(${slot.panX}px, ${slot.panY}px)`,
                    }}
                    className="size-full object-cover transition-transform duration-100"
                  />
                ) : (
                  <div className="text-stone-500 flex flex-col items-center gap-1">
                    <Upload size={16} />
                    <span className="text-[10px] font-medium">Slot {slot.id + 1}</span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Custom Inscription / Dedication Plaque on the Bottom */}
          {(customText || subText) && (
            <div className="absolute bottom-2 inset-x-0 z-30 flex flex-col items-center justify-center pointer-events-none px-4">
              <div className="bg-[#FAF7F1]/90 backdrop-blur-sm border border-[#EAE4DC] px-3 py-1 rounded-md shadow-sm text-center">
                {customText && <p className="font-display text-xs text-stone-900 font-semibold tracking-wide">{customText}</p>}
                {subText && <p className="text-[9px] text-[#B49A72] tracking-wider uppercase font-medium">{subText}</p>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Slot Adjustment Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs">
        <div className="flex items-center gap-2">
          <span className="font-medium text-stone-700">Selected: Slot {activeSlotId + 1}</span>
          <label className="cursor-pointer text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#29251F] text-white hover:bg-stone-800 flex items-center gap-1.5">
            <Upload size={13} /> Upload Photo
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={handlePhotoUpload}
            />
          </label>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => updateZoom(0.1)}
            className="p-1.5 rounded border border-stone-300 bg-white hover:bg-stone-100"
            title="Zoom in"
          >
            <ZoomIn size={14} />
          </button>
          <button
            type="button"
            onClick={() => updateZoom(-0.1)}
            className="p-1.5 rounded border border-stone-300 bg-white hover:bg-stone-100"
            title="Zoom out"
          >
            <ZoomOut size={14} />
          </button>
          <button
            type="button"
            onClick={() => setShowBleed(!showBleed)}
            className={`p-1.5 rounded border text-xs font-medium ${
              showBleed ? "bg-amber-100 border-amber-300 text-amber-900" : "bg-white border-stone-300"
            }`}
            title="Toggle print bleed margin"
          >
            <Eye size={14} className="inline mr-1" /> Bleed
          </button>
        </div>
      </div>

      {resolutionWarning && (
        <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <span>{resolutionWarning}</span>
        </div>
      )}
    </div>
  );
}
