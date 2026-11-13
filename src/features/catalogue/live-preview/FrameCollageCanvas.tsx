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
  Smartphone,
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

const DEFAULT_FRAME_SAMPLES = [
  "/products/frame-sample-wedding.jpg",
  "/products/frame-sample-anniversary.jpg",
  "/products/frame-sample-family.jpg",
  "/products/frame-sample-baby.jpg",
  "/products/frame-sample-wedding.jpg",
];

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

  // Calculate genuine physical aspect ratio
  const getAspectRatioValue = (sizeStr: string, orient: "portrait" | "landscape"): string => {
    const s = sizeStr.toLowerCase().replace(/\s+/g, "");
    if (s.includes("10×10") || s.includes("10x10") || s.includes("square")) {
      return "1 / 1";
    }
    if (s.includes("10×14") || s.includes("10x14")) {
      return orient === "portrait" ? "5 / 7" : "7 / 5";
    }
    if (s.includes("14×20") || s.includes("14x20")) {
      return orient === "portrait" ? "7 / 10" : "10 / 7";
    }
    // Standard photo sizes (8×12, 12×18, 16×24, 20×30) are 2:3
    return orient === "portrait" ? "2 / 3" : "3 / 2";
  };

  // Initialize slots with beautiful default photography
  useEffect(() => {
    const config = LAYOUTS[layoutType];
    setSlots(
      config.slots.map((s, idx) => ({
        ...s,
        photoUrl: DEFAULT_FRAME_SAMPLES[idx % DEFAULT_FRAME_SAMPLES.length],
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
      prev.map((s) =>
        s.id === activeSlotId
          ? {
              ...s,
              photoUrl: DEFAULT_FRAME_SAMPLES[activeSlotId % DEFAULT_FRAME_SAMPLES.length],
              zoom: 1,
              panX: 0,
              panY: 0,
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

  // Subtle 3D perspective tilt on mouse movement
  const handleMouseMoveStage = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: -(y * 6), y: x * 6 });
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
    // Acrylic block / float
    return "border-[4px] border-white/80 shadow-[0_22px_55px_rgba(0,0,0,0.18)] rounded-xl backdrop-blur-xs";
  };

  const supportsOrientation = !size.toLowerCase().includes("10×10") && !size.toLowerCase().includes("square");

  return (
    <div className="flex flex-col gap-4">
      {/* Control Bar: Layouts, Finishes & Orientation */}
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
            ["sparkle", "Inner Sparkle Inlay"],
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
      </div>

      {/* Frame Stage: Close-Up or Living Room Wall Preview */}
      {viewMode === "closeup" ? (
        <div
          onMouseMove={handleMouseMoveStage}
          onMouseLeave={handleMouseLeaveStage}
          className="relative mx-auto w-full max-w-[500px] h-[450px] bg-[#FAF7F1] p-6 rounded-2xl border border-stone-300 flex items-center justify-center overflow-hidden shadow-xs"
        >
          {/* Physical Frame Structure: Sized by height with aspect ratio preserving portrait dimensions */}
          <div
            style={{
              aspectRatio: getAspectRatioValue(size, orientation),
              transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
              transition: "transform 0.15s ease-out",
            }}
            className={`relative h-full max-h-[400px] max-w-full bg-[#FCFAF6] ${getFrameBorderStyle()} overflow-hidden shadow-2xl`}
          >
            {/* Subtle Glass/Acrylic Reflection Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/8 to-white/20 pointer-events-none z-20" />

            {/* Inner Sparkle Effect Overlay */}
            {currentFinish === "sparkle" && (
              <div className="absolute inset-1.5 border-2 border-amber-300/60 pointer-events-none z-25 shadow-[inset_0_0_8px_rgba(224,186,112,0.4)]" />
            )}

            {/* Safe Print Bleed Overlay */}
            {showBleed && (
              <div className="absolute inset-3 border border-dashed border-amber-400/70 pointer-events-none z-30 flex items-start justify-end p-1">
                <span className="text-[8px] font-bold tracking-wider uppercase bg-[#29251F]/80 text-white px-1 py-0.5 rounded">
                  Safe Margin
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
                      className="size-full object-cover pointer-events-none transition-transform duration-75"
                    />
                  )}
                </div>
              );
            })}

            {/* Custom Plaque / Text Overlay */}
            {customText && (
              <div className="absolute bottom-2 inset-x-6 bg-[#29251F]/85 text-amber-100 text-center py-1 px-3 rounded shadow-md z-30 backdrop-blur-xs">
                <p className="font-display text-xs font-semibold tracking-wide">{customText}</p>
                {subText && <p className="text-[9px] text-[#C4A05D]">{subText}</p>}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Living Room Wall Context Mode */
        <div className="relative mx-auto w-full max-w-[500px] h-[450px] bg-gradient-to-b from-[#EFEAE2] to-[#D5CDC2] rounded-2xl border border-stone-300 p-8 flex flex-col items-center justify-between overflow-hidden shadow-inner">
          <div className="w-full flex justify-between items-center text-[10px] text-stone-500">
            <span>Living Room Scale Context</span>
            <span>Natural Ambient Light</span>
          </div>

          {/* Wall Mounted Frame */}
          <div
            style={{ aspectRatio: getAspectRatioValue(size, orientation) }}
            className={`relative h-[250px] max-w-full bg-[#FCFAF6] ${getFrameBorderStyle()} overflow-hidden shadow-[0_25px_50px_rgba(0,0,0,0.35)]`}
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
                    className="size-full object-cover pointer-events-none"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Couch / Console Table Silhouette */}
          <div className="w-4/5 h-8 bg-stone-700/20 rounded-t-xl" />
        </div>
      )}

      {/* Tactile Adjustments Bar: Slot Controls & Photo Upload */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-stone-700">Slot {activeSlotId + 1}:</span>
          <button
            type="button"
            onClick={() => updateZoom(0.15)}
            className="p-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-100"
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
          <button
            type="button"
            onClick={() => updateZoom(-0.15)}
            className="p-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-100"
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
          <button
            type="button"
            onClick={resetActiveSlot}
            className="p-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-100"
            title="Reset to Studio Sample"
          >
            <RotateCcw size={14} />
          </button>
          <span className="text-[11px] text-stone-400 ml-1 hidden sm:inline">
            Drag to pan position
          </span>
        </div>

        {/* Upload Action */}
        <label className="ed-button outline cursor-pointer text-xs flex items-center gap-1.5 py-1.5 px-3">
          <Upload size={13} />
          <span>Personalize Slot {activeSlotId + 1}</span>
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
