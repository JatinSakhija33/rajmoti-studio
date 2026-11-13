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
} from "lucide-react";

export type FrameLayout = "single" | "triptych" | "grid4" | "family5";
export type FrameFinish = "teak" | "charcoal" | "gold" | "acrylic" | "sparkle";

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

const LAYOUTS: Record<
  FrameLayout,
  { name: string; slots: Omit<Slot, "photoUrl" | "zoom" | "panX" | "panY">[] }
> = {
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
  const [currentFinish, setCurrentFinish] = useState<FrameFinish>(finish);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [activeSlotId, setActiveSlotId] = useState<number>(0);
  const [showBleed, setShowBleed] = useState(true);
  const [viewMode, setViewMode] = useState<"closeup" | "room">("closeup");
  const [resolutionWarning, setResolutionWarning] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dragging state for tactile pan
  const isDraggingPhoto = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  // Calculate genuine physical aspect ratio
  const getAspectRatioClass = (sizeStr: string): string => {
    const s = sizeStr.toLowerCase().replace(/\s+/g, "");
    if (s.includes("10×10") || s.includes("10x10") || s.includes("square")) {
      return "aspect-square"; // 1:1
    }
    if (s.includes("10×14") || s.includes("10x14")) {
      return "aspect-[5/7]"; // 1:1.4
    }
    if (s.includes("14×20") || s.includes("14x20")) {
      return "aspect-[7/10]"; // 1:1.428
    }
    // Standard photo sizes (8×12, 12×18, 16×24, 20×30) are 2:3
    return "aspect-[2/3]";
  };

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
      const next = prev.map((s) =>
        s.id === activeSlotId ? { ...s, photoUrl: url, zoom: 1, panX: 0, panY: 0 } : s,
      );
      const urls = next.map((s) => s.photoUrl).filter(Boolean) as string[];
      onPhotosChanged?.(urls);
      return next;
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const updateZoom = (delta: number) => {
    setSlots((prev) =>
      prev.map((s) =>
        s.id === activeSlotId ? { ...s, zoom: Math.min(3, Math.max(0.5, s.zoom + delta)) } : s,
      ),
    );
  };

  const resetActiveSlot = () => {
    setSlots((prev) =>
      prev.map((s) => (s.id === activeSlotId ? { ...s, zoom: 1, panX: 0, panY: 0 } : s)),
    );
  };

  // Tactile Pointer Events for Dragging / Cropping
  const handlePointerDown = (e: React.PointerEvent, slotId: number) => {
    setActiveSlotId(slotId);
    isDraggingPhoto.current = true;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
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

  // Border styles matching physical Rajmoti frames
  const getFrameBorderStyle = () => {
    if (currentFinish === "teak") {
      return "border-[16px] border-[#5A3E26] shadow-[inset_0_0_12px_rgba(0,0,0,0.6),0_18px_40px_rgba(50,30,15,0.28)] rounded-xs";
    }
    if (currentFinish === "charcoal") {
      return "border-[16px] border-[#201D1A] shadow-[inset_0_0_8px_rgba(0,0,0,0.8),0_18px_40px_rgba(0,0,0,0.32)] rounded-xs";
    }
    if (currentFinish === "gold") {
      return "border-[16px] border-[#C4A05D] shadow-[inset_0_0_10px_rgba(255,255,255,0.4),0_18px_45px_rgba(150,110,40,0.22)] rounded-xs";
    }
    if (currentFinish === "sparkle") {
      return "border-[16px] border-[#2A2621] ring-2 ring-[#E0BA70] shadow-[inset_0_0_12px_rgba(224,186,112,0.4),0_20px_45px_rgba(0,0,0,0.25)] rounded-xs";
    }
    // Acrylic block / float
    return "border-[4px] border-white/80 shadow-[0_22px_55px_rgba(0,0,0,0.18)] rounded-xl backdrop-blur-xs";
  };

  const aspectClass = getAspectRatioClass(size);

  return (
    <div className="flex flex-col gap-4">
      {/* Control Bar: Layouts, Finishes & View Mode */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-stone-700 mr-1">Layout:</span>
          {(Object.keys(LAYOUTS) as FrameLayout[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setLayoutType(key)}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                layoutType === key
                  ? "bg-[#29251F] text-amber-100"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
            >
              {LAYOUTS[key].name}
            </button>
          ))}
        </div>

        {/* View Mode Toggle: Close-Up vs Room Context */}
        <div className="flex rounded-lg border border-stone-300 overflow-hidden bg-white p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setViewMode("closeup")}
            className={`py-1 px-2.5 rounded font-medium flex items-center gap-1 transition-colors ${
              viewMode === "closeup"
                ? "bg-[#29251F] text-amber-100"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            <Maximize2 size={12} /> Detail
          </button>
          <button
            type="button"
            onClick={() => setViewMode("room")}
            className={`py-1 px-2.5 rounded font-medium flex items-center gap-1 transition-colors ${
              viewMode === "room"
                ? "bg-[#29251F] text-amber-100"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            <Home size={12} /> Room Context
          </button>
        </div>
      </div>

      {/* Frame Finish Selector */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-stone-700">Moulding Finish:</span>
        {(
          [
            ["teak", "Natural Teak"],
            ["charcoal", "Charcoal Modern"],
            ["gold", "Royal Gold Leaf"],
            ["acrylic", "Diamond Acrylic Float"],
            ["sparkle", "Inner Sparkle (14×20)"],
          ] as const
        ).map(([fKey, fName]) => (
          <button
            key={fKey}
            type="button"
            onClick={() => setCurrentFinish(fKey)}
            className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
              currentFinish === fKey
                ? "border-amber-800 bg-amber-50 text-amber-950 font-semibold"
                : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
            }`}
          >
            {fName}
          </button>
        ))}
      </div>

      {/* Frame Stage: Close-Up or Living Room Wall Preview */}
      {viewMode === "closeup" ? (
        <div className="relative mx-auto w-full max-w-[440px] bg-[#FAF7F1] p-4 rounded-2xl border border-stone-300 flex items-center justify-center overflow-hidden shadow-xs">
          {/* Physical Frame Structure */}
          <div
            className={`relative w-full ${aspectClass} max-h-[380px] bg-[#FCFAF6] transition-all duration-300 ${getFrameBorderStyle()} overflow-hidden`}
          >
            {/* Subtle Glass/Acrylic Reflection Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/8 to-white/25 pointer-events-none z-20" />

            {/* Inner Sparkle Effect Overlay */}
            {currentFinish === "sparkle" && (
              <div className="absolute inset-1.5 border-2 border-amber-300/60 pointer-events-none z-25 shadow-[inset_0_0_8px_rgba(224,186,112,0.4)]" />
            )}

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
                    isActive ? "ring-2 ring-[#B49A72] z-10" : "hover:opacity-90"
                  } ${
                    slot.photoUrl
                      ? "bg-stone-100"
                      : "bg-stone-200/70 border border-dashed border-stone-400/80 flex flex-col items-center justify-center p-2 text-center"
                  }`}
                >
                  {slot.photoUrl ? (
                    <img
                      src={slot.photoUrl}
                      alt={`Photo slot ${slot.id + 1}`}
                      draggable={false}
                      style={{
                        transform: `scale(${slot.zoom}) translate(${slot.panX}px, ${slot.panY}px)`,
                      }}
                      className="size-full object-cover pointer-events-none transition-transform duration-75"
                    />
                  ) : (
                    <div className="text-stone-500 pointer-events-none select-none">
                      <Upload size={16} className="mx-auto mb-1 text-stone-400" />
                      <span className="text-[10px] font-semibold block">Slot {slot.id + 1}</span>
                      <span className="text-[8px] text-stone-400">Click to upload</span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Custom Plaque / Text Overlay */}
            {customText && (
              <div className="absolute bottom-2 inset-x-8 bg-[#29251F]/85 text-amber-100 text-center py-1 px-3 rounded shadow-md z-30 backdrop-blur-xs">
                <span className="font-display text-xs tracking-wide block">{customText}</span>
                {subText && <span className="text-[9px] text-stone-300 block">{subText}</span>}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Room Context Mode: Frame Mounted on Living Room Wall Above Credenza */
        <div className="relative mx-auto w-full max-w-[480px] h-[340px] bg-[#EFECE6] rounded-2xl border border-stone-300 overflow-hidden flex flex-col items-center justify-between p-4 shadow-sm">
          {/* Wall Lamp / Ambient Spot */}
          <div className="absolute -top-12 inset-x-0 h-32 bg-radial from-amber-100/60 to-transparent pointer-events-none" />

          {/* Wall Mounted Frame */}
          <div className="relative z-10 mt-2 flex flex-col items-center">
            <div
              className={`w-[170px] ${aspectClass} bg-[#FCFAF6] ${getFrameBorderStyle()} shadow-[0_24px_50px_rgba(0,0,0,0.35)] overflow-hidden relative`}
            >
              <div className="size-full relative overflow-hidden bg-stone-200">
                {slots[0]?.photoUrl ? (
                  <img src={slots[0].photoUrl} alt="Room preview" className="size-full object-cover" />
                ) : (
                  <div className="size-full flex items-center justify-center text-[10px] text-stone-500 font-display">
                    {size} Frame
                  </div>
                )}
              </div>
            </div>
            <span className="text-[9px] font-bold text-stone-500 tracking-wider uppercase mt-2">
              Wall Scale Preview ({size})
            </span>
          </div>

          {/* Credenza / Mantelpiece Furniture Surface */}
          <div className="w-full relative z-10 flex flex-col items-center">
            <div className="w-[85%] h-5 bg-[#4A3525] rounded-t-sm shadow-md flex justify-between px-6 items-end pb-1">
              {/* Decor Accents: Ceramic bowl and Brass candlestick */}
              <div className="size-3 rounded-full bg-[#E8E1D5] shadow-xs" />
              <div className="w-1.5 h-6 bg-[#C4A05D] rounded-t-xs shadow-xs" />
            </div>
            <div className="w-[88%] h-2 bg-[#362518] shadow-lg" />
          </div>
        </div>
      )}

      {/* Editing Toolbar: Drag to Pan, Zoom & Bleed Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs">
        <div className="flex items-center gap-2">
          <label className="cursor-pointer font-semibold text-xs px-3 py-1.5 rounded-lg bg-[#29251F] text-amber-100 hover:bg-stone-800 flex items-center gap-1.5">
            <Upload size={13} /> Upload Photo (Slot {activeSlotId + 1})
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </label>

          <span className="text-[11px] text-stone-500 hidden sm:inline">
            Drag photo inside frame to reposition
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => updateZoom(-0.1)}
            className="p-1.5 bg-white border border-stone-200 rounded hover:bg-stone-100 text-stone-700"
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
          <button
            type="button"
            onClick={() => updateZoom(0.1)}
            className="p-1.5 bg-white border border-stone-200 rounded hover:bg-stone-100 text-stone-700"
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
          <button
            type="button"
            onClick={resetActiveSlot}
            className="p-1.5 bg-white border border-stone-200 rounded hover:bg-stone-100 text-stone-700"
            title="Reset Pan & Zoom"
          >
            <RotateCcw size={14} />
          </button>
          <button
            type="button"
            onClick={() => setShowBleed((b) => !b)}
            className={`text-xs px-2 py-1 rounded border transition-colors ${
              showBleed
                ? "bg-amber-100 border-amber-300 text-amber-900"
                : "bg-white border-stone-200 text-stone-600"
            }`}
          >
            Bleed {showBleed ? "On" : "Off"}
          </button>
        </div>
      </div>

      {resolutionWarning && (
        <div className="flex items-start gap-1.5 text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-xs">
          <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-700" />
          <span>{resolutionWarning}</span>
        </div>
      )}
    </div>
  );
}
