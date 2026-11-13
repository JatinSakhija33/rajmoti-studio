import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Check,
  Eye,
  AlertCircle,
  Home,
  Maximize2,
  Sparkles,
  Move,
  CheckCircle2,
  Maximize,
  Minimize,
  Sliders,
} from "lucide-react";

export type FrameLayout = "single" | "triptych" | "grid4" | "family5";
export type FrameFinish = "teak" | "charcoal" | "gold" | "acrylic" | "sparkle" | "canvas";
export type FitMode = "cover" | "contain";

export interface FrameSizeOption {
  id: string;
  label: string;
  metric: string;
  widthInches: number;
  heightInches: number;
  ratio: string; // e.g. "2 / 3"
  popular?: boolean;
}

export const FRAME_SIZES: FrameSizeOption[] = [
  { id: "8x12", label: "8×12 in", metric: "20×30 cm", widthInches: 8, heightInches: 12, ratio: "2 / 3" },
  { id: "10x10", label: "10×10 in", metric: "25×25 cm", widthInches: 10, heightInches: 10, ratio: "1 / 1" },
  { id: "10x14", label: "10×14 in", metric: "25×35 cm", widthInches: 10, heightInches: 14, ratio: "5 / 7" },
  { id: "12x18", label: "12×18 in", metric: "30×45 cm", widthInches: 12, heightInches: 18, ratio: "2 / 3", popular: true },
  { id: "14x20", label: "14×20 in", metric: "35×50 cm", widthInches: 14, heightInches: 20, ratio: "7 / 10" },
  { id: "16x24", label: "16×24 in", metric: "40×60 cm", widthInches: 16, heightInches: 24, ratio: "2 / 3" },
  { id: "18x24", label: "18×24 in", metric: "45×60 cm", widthInches: 18, heightInches: 24, ratio: "3 / 4" },
  { id: "20x30", label: "20×30 in", metric: "50×75 cm", widthInches: 20, heightInches: 30, ratio: "2 / 3", popular: true },
];

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
  fitMode: FitMode;
  imgWidth?: number;
  imgHeight?: number;
}

const LAYOUTS: Record<
  FrameLayout,
  { name: string; slots: Omit<Slot, "photoUrl" | "zoom" | "panX" | "panY" | "fitMode" | "imgWidth" | "imgHeight">[] }
> = {
  single: {
    name: "Classic Single Frame",
    slots: [{ id: 0, x: 4, y: 4, width: 92, height: 92 }],
  },
  triptych: {
    name: "3-Photo Anniversary Story",
    slots: [
      { id: 0, x: 4, y: 7, width: 29, height: 86 },
      { id: 1, x: 35.5, y: 7, width: 29, height: 86 },
      { id: 2, x: 67, y: 7, width: 29, height: 86 },
    ],
  },
  grid4: {
    name: "4-Photo Family Moments",
    slots: [
      { id: 0, x: 5, y: 5, width: 43, height: 43 },
      { id: 1, x: 52, y: 5, width: 43, height: 43 },
      { id: 2, x: 5, y: 52, width: 43, height: 43 },
      { id: 3, x: 52, y: 52, width: 43, height: 43 },
    ],
  },
  family5: {
    name: "5-Photo Heritage Collage",
    slots: [
      { id: 0, x: 5, y: 5, width: 53, height: 90 },
      { id: 1, x: 61, y: 5, width: 34, height: 20 },
      { id: 2, x: 61, y: 28, width: 34, height: 20 },
      { id: 3, x: 61, y: 51, width: 34, height: 20 },
      { id: 4, x: 61, y: 74, width: 34, height: 21 },
    ],
  },
};

const DEFAULT_FRAME_SAMPLES = [
  "/products/frame-sample-wedding.jpg",
  "/products/frame-sample-anniversary.jpg",
  "/products/frame-sample-family.jpg",
  "/products/frame-sample-baby.jpg",
  "/products/frame-sample-wedding.jpg",
];

interface FrameCollageCanvasProps {
  size?: string;
  finish?: FrameFinish;
  customText?: string;
  subText?: string;
  onPhotosChanged?: (urls: string[]) => void;
  onSizeChange?: (sizeLabel: string) => void;
}

export function FrameCollageCanvas({
  size = "12×18 in",
  finish = "teak",
  customText = "",
  subText = "",
  onPhotosChanged,
  onSizeChange,
}: FrameCollageCanvasProps) {
  const [selectedSize, setSelectedSize] = useState<string>(size);
  const [layoutType, setLayoutType] = useState<FrameLayout>("single");
  const [currentFinish, setCurrentFinish] = useState<FrameFinish>(finish);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [activeSlotId, setActiveSlotId] = useState<number>(0);
  const [showBleed, setShowBleed] = useState(false);
  const [viewMode, setViewMode] = useState<"closeup" | "room">("closeup");
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dragging state for tactile pan
  const isDraggingPhoto = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  // Find size config
  const currentSizeConfig =
    FRAME_SIZES.find((s) => s.label.toLowerCase() === selectedSize.toLowerCase()) ||
    FRAME_SIZES.find((s) => s.label.includes(selectedSize.split(" ")[0])) ||
    FRAME_SIZES[3]; // default 12x18

  // Calculate genuine physical aspect ratio
  const getAspectRatioValue = (): string => {
    if (currentSizeConfig.id === "10x10") return "1 / 1";
    if (currentSizeConfig.id === "10x14") return orientation === "portrait" ? "5 / 7" : "7 / 5";
    if (currentSizeConfig.id === "14x20") return orientation === "portrait" ? "7 / 10" : "10 / 7";
    if (currentSizeConfig.id === "18x24") return orientation === "portrait" ? "3 / 4" : "4 / 3";
    return orientation === "portrait" ? "2 / 3" : "3 / 2";
  };

  // Initialize slots
  useEffect(() => {
    const config = LAYOUTS[layoutType];
    setSlots(
      config.slots.map((s, idx) => ({
        ...s,
        photoUrl: DEFAULT_FRAME_SAMPLES[idx % DEFAULT_FRAME_SAMPLES.length],
        zoom: 1,
        panX: 0,
        panY: 0,
        fitMode: "cover",
        imgWidth: 1920,
        imgHeight: 1280,
      })),
    );
    setActiveSlotId(0);
  }, [layoutType]);

  const handleSelectSize = (sz: FrameSizeOption) => {
    setSelectedSize(sz.label);
    if (sz.id === "10x10") {
      setOrientation("portrait");
    }
    onSizeChange?.(sz.label);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);

    const img = new Image();
    img.src = url;
    img.onload = () => {
      setSlots((prev) => {
        const next = prev.map((s) =>
          s.id === activeSlotId
            ? {
                ...s,
                photoUrl: url,
                zoom: 1,
                panX: 0,
                panY: 0,
                fitMode: "cover",
                imgWidth: img.naturalWidth,
                imgHeight: img.naturalHeight,
              }
            : s,
        );
        const urls = next.map((s) => s.photoUrl).filter(Boolean) as string[];
        onPhotosChanged?.(urls);
        return next;
      });
    };

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const updateZoom = (delta: number) => {
    setSlots((prev) =>
      prev.map((s) =>
        s.id === activeSlotId ? { ...s, zoom: Math.min(3, Math.max(0.5, s.zoom + delta)) } : s,
      ),
    );
  };

  const toggleFitMode = () => {
    setSlots((prev) =>
      prev.map((s) =>
        s.id === activeSlotId
          ? { ...s, fitMode: s.fitMode === "cover" ? "contain" : "cover", panX: 0, panY: 0, zoom: 1 }
          : s,
      ),
    );
  };

  const resetActiveSlot = () => {
    setSlots((prev) =>
      prev.map((s) =>
        s.id === activeSlotId
          ? {
              ...s,
              photoUrl: DEFAULT_FRAME_SAMPLES[activeSlotId % DEFAULT_FRAME_SAMPLES.length],
              zoom: 1,
              panX: 0,
              panY: 0,
              fitMode: "cover",
              imgWidth: 1920,
              imgHeight: 1280,
            }
          : s,
      ),
    );
  };

  // Pointer drag to pan
  const handlePointerDown = (e: React.PointerEvent, slotId: number) => {
    setActiveSlotId(slotId);
    isDraggingPhoto.current = true;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent, slotId: number) => {
    if (!isDraggingPhoto.current || activeSlotId !== slotId) return;
    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;
    dragStartPos.current = { x: e.clientX, y: e.clientY };

    setSlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, panX: s.panX + dx, panY: s.panY + dy } : s)),
    );
  };

  const handlePointerUp = () => {
    isDraggingPhoto.current = false;
  };

  // 3D perspective tilt
  const handleMouseMoveStage = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: -(y * 5), y: x * 5 });
  };

  const handleMouseLeaveStage = () => {
    setTilt({ x: 0, y: 0 });
  };

  // Border styles matching physical Rajmoti frames
  const getFrameBorderStyle = () => {
    if (currentFinish === "teak") {
      return "border-[16px] border-[#5A3E26] shadow-[inset_0_0_12px_rgba(0,0,0,0.6),0_20px_45px_rgba(50,30,15,0.28)] rounded-xs";
    }
    if (currentFinish === "charcoal") {
      return "border-[16px] border-[#201D1A] shadow-[inset_0_0_8px_rgba(0,0,0,0.8),0_20px_45px_rgba(0,0,0,0.32)] rounded-xs";
    }
    if (currentFinish === "gold") {
      return "border-[16px] border-[#C4A05D] shadow-[inset_0_0_10px_rgba(255,255,255,0.4),0_20px_45px_rgba(150,110,40,0.22)] rounded-xs";
    }
    if (currentFinish === "sparkle") {
      return "border-[16px] border-[#2A2621] ring-2 ring-[#E0BA70] shadow-[inset_0_0_12px_rgba(224,186,112,0.4),0_20px_45px_rgba(0,0,0,0.25)] rounded-xs";
    }
    if (currentFinish === "canvas") {
      return "border-[10px] border-[#ECE7DE] shadow-[inset_0_0_15px_rgba(0,0,0,0.3),0_22px_45px_rgba(0,0,0,0.25)] rounded-xs";
    }
    // Acrylic block / float
    return "border-[4px] border-white/80 shadow-[0_22px_55px_rgba(0,0,0,0.18)] rounded-xl backdrop-blur-xs";
  };

  const supportsOrientation = currentSizeConfig.id !== "10x10";
  const activeSlot = slots.find((s) => s.id === activeSlotId) || slots[0];

  // Resolution Quality Calculator
  const getResolutionStatus = () => {
    if (!activeSlot || !activeSlot.imgWidth || !activeSlot.imgHeight) return null;
    const minDim = Math.min(activeSlot.imgWidth, activeSlot.imgHeight);
    const targetInches = Math.min(currentSizeConfig.widthInches, currentSizeConfig.heightInches);
    const estDpi = Math.round(minDim / targetInches);

    if (estDpi >= 250) {
      return {
        level: "excellent",
        text: `Razor Sharp (${activeSlot.imgWidth}×${activeSlot.imgHeight}px · ~${estDpi} DPI)`,
        badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
      };
    }
    if (estDpi >= 140) {
      return {
        level: "good",
        text: `Sharp Studio Print (${activeSlot.imgWidth}×${activeSlot.imgHeight}px · ~${estDpi} DPI)`,
        badge: "bg-blue-50 text-blue-800 border-blue-200",
      };
    }
    return {
      level: "warn",
      text: `Low Resolution Advisory: ${activeSlot.imgWidth}×${activeSlot.imgHeight}px (~${estDpi} DPI) for ${selectedSize}`,
      badge: "bg-amber-50 text-amber-900 border-amber-300",
    };
  };

  const resStatus = getResolutionStatus();

  return (
    <div className="flex flex-col gap-4">
      {/* SECTION 1: SIZE SELECTOR (MANDATED FOR ALL SIZES) */}
      <div className="bg-[#FAF7F1] border border-stone-300 rounded-xl p-3 shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Maximize2 size={14} className="text-amber-800" />
            <span className="text-xs font-bold text-stone-900">Select Frame Size & Aspect Ratio:</span>
          </div>
          <span className="text-[11px] font-mono text-stone-500">
            Selected: <strong className="text-amber-900">{currentSizeConfig.label}</strong> ({currentSizeConfig.metric})
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-1.5">
          {FRAME_SIZES.map((sz) => {
            const isSelected = selectedSize.toLowerCase().includes(sz.id.replace("x", "×")) || selectedSize.toLowerCase().includes(sz.label.toLowerCase());
            return (
              <button
                key={sz.id}
                type="button"
                onClick={() => handleSelectSize(sz)}
                className={`py-1.5 px-2 rounded-lg border text-xs text-center transition-all flex flex-col items-center justify-center ${
                  isSelected
                    ? "bg-[#29251F] text-amber-100 border-[#29251F] shadow-xs font-bold"
                    : "bg-white text-stone-700 border-stone-200 hover:border-amber-700 hover:bg-stone-50"
                }`}
              >
                <span className="text-xs">{sz.label}</span>
                <span className={`text-[9px] ${isSelected ? "text-amber-300" : "text-stone-400"}`}>
                  {sz.metric}
                </span>
                {sz.popular && (
                  <span className="text-[8px] uppercase tracking-tighter text-amber-400 font-bold">
                    Popular
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: Control Bar: Layouts, Finishes & Orientation */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-stone-700 mr-1">Layout:</span>
          {(Object.keys(LAYOUTS) as FrameLayout[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setLayoutType(key)}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                layoutType === key
                  ? "bg-[#29251F] text-amber-100 font-bold shadow-2xs"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
            >
              {LAYOUTS[key].name}
            </button>
          ))}
        </div>

        {/* Orientation Toggle */}
        {supportsOrientation && (
          <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg border border-stone-200 text-xs">
            <button
              type="button"
              onClick={() => setOrientation("portrait")}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                orientation === "portrait"
                  ? "bg-white text-stone-900 shadow-2xs font-bold"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              Portrait
            </button>
            <button
              type="button"
              onClick={() => setOrientation("landscape")}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                orientation === "landscape"
                  ? "bg-white text-stone-900 shadow-2xs font-bold"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              Landscape
            </button>
          </div>
        )}

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg border border-stone-200 text-xs">
          <button
            type="button"
            onClick={() => setViewMode("closeup")}
            className={`px-2.5 py-1 rounded flex items-center gap-1 font-medium ${
              viewMode === "closeup"
                ? "bg-white text-stone-900 shadow-2xs font-bold"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            <Eye size={12} /> Studio Close-up
          </button>
          <button
            type="button"
            onClick={() => setViewMode("room")}
            className={`px-2.5 py-1 rounded flex items-center gap-1 font-medium ${
              viewMode === "room"
                ? "bg-white text-stone-900 shadow-2xs font-bold"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            <Home size={12} /> Living Room
          </button>
        </div>
      </div>

      {/* Frame Finishes */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-stone-700">Finish:</span>
        {(
          [
            ["teak", "Saurashtra Teak Wood"],
            ["charcoal", "Matte Charcoal Wood"],
            ["gold", "Royal Gold Leaf"],
            ["acrylic", "Clear Acrylic Block"],
            ["sparkle", "Inner Sparkle Inlay (14×20)"],
            ["canvas", "Gallery Canvas Wrap"],
          ] as [FrameFinish, string][]
        ).map(([fKey, fName]) => (
          <button
            key={fKey}
            type="button"
            onClick={() => setCurrentFinish(fKey)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
              currentFinish === fKey
                ? "border-amber-800 bg-amber-50 text-amber-950 font-bold shadow-2xs"
                : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
            }`}
          >
            {fName}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setShowBleed(!showBleed)}
          className={`ml-auto px-2 py-1 rounded text-[11px] border flex items-center gap-1 ${
            showBleed ? "bg-amber-100 text-amber-900 border-amber-300 font-semibold" : "bg-white text-stone-500 border-stone-200"
          }`}
        >
          <Sliders size={11} /> {showBleed ? "Hide Print Bleed Margin" : "Show Print Safe Margin"}
        </button>
      </div>

      {/* Stage: Close-up vs Room */}
      {viewMode === "closeup" ? (
        <div
          onMouseMove={handleMouseMoveStage}
          onMouseLeave={handleMouseLeaveStage}
          className="relative mx-auto w-full max-w-[520px] h-[460px] bg-[#FAF7F1] p-6 rounded-2xl border border-stone-300 flex items-center justify-center overflow-hidden shadow-xs"
        >
          {/* Physical Frame Structure: Sized by height with aspect ratio preserving dimensions */}
          <div
            style={{
              aspectRatio: getAspectRatioValue(),
              transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
              transition: "transform 0.15s ease-out",
            }}
            className={`relative h-full max-h-[410px] max-w-full bg-[#FCFAF6] ${getFrameBorderStyle()} overflow-hidden shadow-2xl`}
          >
            {/* Subtle Glass/Acrylic Reflection Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/8 to-white/20 pointer-events-none z-20" />

            {/* Acrylic Standoff Studs for Acrylic finish */}
            {currentFinish === "acrylic" && (
              <>
                <div className="absolute top-2 left-2 size-3 rounded-full bg-gradient-to-br from-stone-200 to-stone-400 border border-stone-500 shadow-sm z-30" />
                <div className="absolute top-2 right-2 size-3 rounded-full bg-gradient-to-br from-stone-200 to-stone-400 border border-stone-500 shadow-sm z-30" />
                <div className="absolute bottom-2 left-2 size-3 rounded-full bg-gradient-to-br from-stone-200 to-stone-400 border border-stone-500 shadow-sm z-30" />
                <div className="absolute bottom-2 right-2 size-3 rounded-full bg-gradient-to-br from-stone-200 to-stone-400 border border-stone-500 shadow-sm z-30" />
              </>
            )}

            {/* Inner Sparkle Effect Overlay */}
            {currentFinish === "sparkle" && (
              <div className="absolute inset-2 border-2 border-amber-300/70 pointer-events-none z-25 shadow-[inset_0_0_10px_rgba(224,186,112,0.5)]" />
            )}

            {/* Safe Print Bleed Overlay */}
            {showBleed && (
              <div className="absolute inset-3 border border-dashed border-amber-500/80 pointer-events-none z-30 flex items-start justify-end p-1">
                <span className="text-[8px] font-bold tracking-wider uppercase bg-[#29251F]/85 text-white px-1 py-0.5 rounded">
                  Safe Print Margin (12mm)
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
                  onPointerDown={(e) => handlePointerDown(e, slot.id)}
                  onPointerMove={(e) => handlePointerMove(e, slot.id)}
                  onPointerUp={handlePointerUp}
                  style={{
                    left: `${slot.x}%`,
                    top: `${slot.y}%`,
                    width: `${slot.width}%`,
                    height: `${slot.height}%`,
                    touchAction: "none",
                  }}
                  className={`absolute overflow-hidden cursor-grab active:cursor-grabbing transition-shadow ${
                    isActive ? "ring-2 ring-[#B49A72] z-10" : "hover:opacity-95"
                  } ${slot.photoUrl ? "bg-stone-100" : "bg-stone-200"}`}
                >
                  {slot.photoUrl && (
                    <img
                      src={slot.photoUrl}
                      alt={`Photo slot ${slot.id + 1}`}
                      draggable={false}
                      style={{
                        transform: `scale(${slot.zoom}) translate(${slot.panX}px, ${slot.panY}px)`,
                      }}
                      className={`size-full pointer-events-none transition-transform duration-75 ${
                        slot.fitMode === "contain" ? "object-contain bg-stone-900/10" : "object-cover"
                      }`}
                    />
                  )}
                </div>
              );
            })}

            {/* Custom Plaque / Text Overlay */}
            {customText && (
              <div className="absolute bottom-2.5 inset-x-6 bg-[#29251F]/90 text-amber-100 text-center py-1.5 px-3 rounded shadow-md z-30 backdrop-blur-xs">
                <p className="font-display text-xs font-semibold tracking-wide">{customText}</p>
                {subText && <p className="text-[9px] text-[#C4A05D]">{subText}</p>}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Living Room Wall Context Mode */
        <div className="relative mx-auto w-full max-w-[520px] h-[460px] bg-gradient-to-b from-[#EFEAE2] to-[#D5CDC2] rounded-2xl border border-stone-300 p-8 flex flex-col items-center justify-between overflow-hidden shadow-inner">
          <div className="w-full flex justify-between items-center text-[10px] text-stone-500">
            <span>Living Room Scale Context ({selectedSize})</span>
            <span>Natural Ambient Light</span>
          </div>

          {/* Wall Mounted Frame */}
          <div
            style={{ aspectRatio: getAspectRatioValue() }}
            className={`relative h-[260px] max-w-full bg-[#FCFAF6] ${getFrameBorderStyle()} overflow-hidden shadow-[0_25px_50px_rgba(0,0,0,0.35)]`}
          >
            {slots.map((slot) => (
              <div
                key={slot.id}
                style={{
                  left: `${slot.x}%`,
                  top: `${slot.y}%`,
                  width: `${slot.width}%`,
                  height: `${slot.height}%`,
                }}
                className="absolute overflow-hidden bg-stone-100"
              >
                {slot.photoUrl && (
                  <img
                    src={slot.photoUrl}
                    alt=""
                    className={`size-full pointer-events-none ${
                      slot.fitMode === "contain" ? "object-contain" : "object-cover"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="w-4/5 h-8 bg-stone-700/20 rounded-t-xl" />
        </div>
      )}

      {/* SECTION 3: PROPER PHOTO FITTING & RESOLUTION ADVISORY */}
      {resStatus && (
        <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${resStatus.badge}`}>
          <div className="flex items-center gap-2">
            {resStatus.level === "excellent" ? (
              <CheckCircle2 size={15} className="text-emerald-700 shrink-0" />
            ) : resStatus.level === "good" ? (
              <Check size={15} className="text-blue-700 shrink-0" />
            ) : (
              <AlertCircle size={15} className="text-amber-700 shrink-0" />
            )}
            <span>{resStatus.text}</span>
          </div>
          <span className="text-[10px] uppercase font-mono tracking-wider opacity-80">
            Smart Aspect Auto-Fit
          </span>
        </div>
      )}

      {/* SECTION 4: TACTILE ADJUSTMENTS: CROP/FIT, ZOOM, PAN & UPLOAD */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-stone-800">Slot {activeSlotId + 1} Tools:</span>

          {/* Fill vs Contain toggle */}
          <button
            type="button"
            onClick={toggleFitMode}
            className="py-1 px-2.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 flex items-center gap-1 font-medium"
            title="Toggle between Filling Frame and Showing Full Photo"
          >
            {activeSlot?.fitMode === "cover" ? (
              <>
                <Minimize size={13} />
                <span>Fit Entire Photo</span>
              </>
            ) : (
              <>
                <Maximize size={13} />
                <span>Fill Frame (Crop)</span>
              </>
            )}
          </button>

          {/* Zoom controls */}
          <div className="flex items-center border border-stone-300 rounded-lg overflow-hidden bg-white">
            <button
              type="button"
              onClick={() => updateZoom(0.15)}
              className="p-1.5 hover:bg-stone-100 text-stone-700"
              title="Zoom In"
            >
              <ZoomIn size={13} />
            </button>
            <span className="px-1.5 text-[10px] font-mono text-stone-500">
              {Math.round((activeSlot?.zoom || 1) * 100)}%
            </span>
            <button
              type="button"
              onClick={() => updateZoom(-0.15)}
              className="p-1.5 hover:bg-stone-100 text-stone-700"
              title="Zoom Out"
            >
              <ZoomOut size={13} />
            </button>
          </div>

          <button
            type="button"
            onClick={resetActiveSlot}
            className="p-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 text-stone-600"
            title="Reset Slot"
          >
            <RotateCcw size={13} />
          </button>

          <span className="text-[11px] text-stone-400 hidden md:inline">
            Drag photo to pan position
          </span>
        </div>

        {/* Upload Action */}
        <label className="ed-button outline cursor-pointer text-xs flex items-center gap-1.5 py-1.5 px-3">
          <Upload size={13} />
          <span>Upload for Slot {activeSlotId + 1}</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
}
