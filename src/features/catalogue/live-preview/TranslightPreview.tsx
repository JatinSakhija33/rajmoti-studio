import { useState, useRef, type ChangeEvent } from "react";
import {
  Lightbulb,
  LightbulbOff,
  Upload,
  Sparkles,
  Sun,
  Moon,
  MessageCircle,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { SITE, whatsappLink } from "@/lib/site";

export interface TranslightSizeOption {
  id: string;
  label: string;
  metric: string;
  widthInches: number;
  heightInches: number;
  ratio: string;
}

export const TRANSLIGHT_SIZES: TranslightSizeOption[] = [
  { id: "12x18", label: "12×18 in", metric: "30×45 cm", widthInches: 12, heightInches: 18, ratio: "2 / 3" },
  { id: "16x24", label: "16×24 in", metric: "40×60 cm", widthInches: 16, heightInches: 24, ratio: "2 / 3" },
];

interface TranslightPreviewProps {
  size?: string;
  defaultPhotoUrl?: string;
  onPhotoUploaded?: (url: string) => void;
  onSizeChange?: (sizeLabel: string) => void;
}

export function TranslightPreview({
  size = "12×18 in",
  defaultPhotoUrl,
  onPhotoUploaded,
  onSizeChange,
}: TranslightPreviewProps) {
  const [selectedSize, setSelectedSize] = useState<string>(size);
  const [photoUrl, setPhotoUrl] = useState<string>(
    defaultPhotoUrl || "/products/translight-sample.jpg",
  );
  const [isLightOn, setIsLightOn] = useState<boolean>(true);
  const [colorTemp, setColorTemp] = useState<"warm" | "pure">("warm"); // 3000K Warm vs 4000K Pure
  const [isCustomPhoto, setIsCustomPhoto] = useState<boolean>(!!defaultPhotoUrl);
  const [fitMode, setFitMode] = useState<"cover" | "contain">("cover");
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imgDim, setImgDim] = useState<{ width: number; height: number }>({ width: 1920, height: 1280 });

  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const currentSizeConfig =
    TRANSLIGHT_SIZES.find((s) => s.label.toLowerCase() === selectedSize.toLowerCase()) ||
    TRANSLIGHT_SIZES[0];

  const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPhotoUrl(url);
    setIsCustomPhoto(true);
    setZoom(1);
    setPan({ x: 0, y: 0 });

    const img = new Image();
    img.src = url;
    img.onload = () => {
      setImgDim({ width: img.naturalWidth, height: img.naturalHeight });
    };

    onPhotoUploaded?.(url);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    dragStart.current = { x: e.clientX, y: e.clientY };
    setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  const estDpi = Math.round(Math.min(imgDim.width, imgDim.height) / currentSizeConfig.widthInches);

  const whatsappUrl = whatsappLink(
    `Namaste ${SITE.name}! 💡 I am interested in ordering a Backlit LED Translight Frame:
Size: ${currentSizeConfig.label} (${currentSizeConfig.metric})
Lighting Profile: ${colorTemp === "warm" ? "Warm Temple Golden (3000K)" : "Pure Architectural White (4000K)"}
Could you please share production lead time and framing details? Thank you!`,
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Size Selector */}
      <div className="bg-[#FAF7F1] border border-stone-300 rounded-xl p-3 shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Maximize2 size={14} className="text-amber-800" />
            <span className="text-xs font-bold text-stone-900">Select Translight Size:</span>
          </div>
          <span className="text-[11px] font-mono text-stone-500">
            Selected: <strong className="text-amber-900">{currentSizeConfig.label}</strong> ({currentSizeConfig.metric})
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {TRANSLIGHT_SIZES.map((sz) => {
            const isSelected = selectedSize.toLowerCase().includes(sz.id.replace("x", "×")) || selectedSize.toLowerCase().includes(sz.label.toLowerCase());
            return (
              <button
                key={sz.id}
                type="button"
                onClick={() => {
                  setSelectedSize(sz.label);
                  onSizeChange?.(sz.label);
                }}
                className={`py-2 px-3 rounded-lg border text-xs text-center transition-all flex items-center justify-between ${
                  isSelected
                    ? "bg-[#29251F] text-amber-100 border-[#29251F] shadow-xs font-bold"
                    : "bg-white text-stone-700 border-stone-200 hover:border-amber-700 hover:bg-stone-50"
                }`}
              >
                <span className="text-xs font-bold">{sz.label}</span>
                <span className={`text-[10px] ${isSelected ? "text-amber-300" : "text-stone-400"}`}>
                  {sz.metric} · Internal LED Panel
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Light & Color Temperature Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-stone-100/90 rounded-2xl border border-stone-200">
        <div>
          <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-600" />
            Backlit LED Translight ({currentSizeConfig.label})
          </span>
          <span className="text-[11px] text-stone-500">
            Internal edge-lit LED diffusion with optical film
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Color Temperature (3000K vs 4000K) */}
          {isLightOn && (
            <div className="flex rounded-lg border border-stone-300 overflow-hidden bg-white p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setColorTemp("warm")}
                className={`py-1 px-2.5 rounded font-medium flex items-center gap-1 transition-colors ${
                  colorTemp === "warm"
                    ? "bg-amber-100 text-amber-950 font-bold shadow-2xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <Sun size={12} className="text-amber-600" />
                <span>3000K Warm</span>
              </button>
              <button
                type="button"
                onClick={() => setColorTemp("pure")}
                className={`py-1 px-2.5 rounded font-medium flex items-center gap-1 transition-colors ${
                  colorTemp === "pure"
                    ? "bg-stone-200 text-stone-950 font-bold shadow-2xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <Moon size={12} className="text-blue-500" />
                <span>4000K Pure</span>
              </button>
            </div>
          )}

          {/* Light Power Switch */}
          <div className="flex rounded-lg border border-stone-300 overflow-hidden bg-white p-0.5">
            <button
              type="button"
              onClick={() => setIsLightOn(false)}
              className={`py-1.5 px-3 rounded font-medium flex items-center gap-1.5 text-xs transition-colors ${
                !isLightOn ? "bg-stone-900 text-white shadow-xs font-bold" : "text-stone-600 hover:bg-stone-100"
              }`}
            >
              <LightbulbOff size={13} /> Off
            </button>
            <button
              type="button"
              onClick={() => setIsLightOn(true)}
              className={`py-1.5 px-3 rounded font-medium flex items-center gap-1.5 text-xs transition-colors ${
                isLightOn ? "bg-amber-600 text-white shadow-xs font-bold" : "text-stone-600 hover:bg-stone-100"
              }`}
            >
              <Lightbulb size={13} /> Light On
            </button>
          </div>
        </div>
      </div>

      {/* Visual Translight Stage: Fixed Portrait Aspect Ratio */}
      <div
        className={`relative mx-auto w-full max-w-[480px] h-[450px] rounded-2xl overflow-hidden p-6 flex items-center justify-center transition-all duration-700 shadow-xl ${
          isLightOn
            ? colorTemp === "warm"
              ? "bg-[#14120E] shadow-[0_0_80px_rgba(250,190,90,0.35)]"
              : "bg-[#101316] shadow-[0_0_80px_rgba(180,210,250,0.3)]"
            : "bg-[#24211E]"
        }`}
      >
        {/* Sleek Aluminum Frame Chassis: Preserving True 2:3 Portrait */}
        <div
          style={{ aspectRatio: "2 / 3" }}
          className={`relative h-full max-h-[400px] rounded-xs border-[14px] border-[#0A0908] overflow-hidden flex items-center justify-center transition-all duration-700 ${
            isLightOn
              ? colorTemp === "warm"
                ? "shadow-[inset_0_0_24px_rgba(255,230,170,0.45),0_0_50px_rgba(255,190,90,0.4)]"
                : "shadow-[inset_0_0_24px_rgba(220,240,255,0.45),0_0_50px_rgba(180,210,255,0.4)]"
              : "shadow-[inset_0_0_20px_rgba(0,0,0,0.9)]"
          }`}
        >
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="relative size-full overflow-hidden bg-black cursor-grab active:cursor-grabbing"
            style={{ touchAction: "none" }}
          >
            <img
              src={photoUrl}
              alt="Translight illuminated artwork"
              draggable={false}
              style={{
                transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
              }}
              className={`size-full pointer-events-none transition-all duration-75 ${
                fitMode === "contain" ? "object-contain" : "object-cover"
              } ${
                isLightOn
                  ? colorTemp === "warm"
                    ? "brightness-125 contrast-110 saturate-120 drop-shadow-[0_0_25px_rgba(255,220,150,0.4)]"
                    : "brightness-130 contrast-115 saturate-105 drop-shadow-[0_0_25px_rgba(200,230,255,0.4)]"
                  : "brightness-65 contrast-90 opacity-70"
              }`}
            />

            {/* Backlit Diffusion Light Layer */}
            {isLightOn && (
              <div
                className={`absolute inset-0 pointer-events-none mix-blend-screen transition-opacity duration-700 ${
                  colorTemp === "warm"
                    ? "bg-gradient-to-t from-amber-400/25 via-transparent to-amber-200/25"
                    : "bg-gradient-to-t from-blue-200/25 via-transparent to-cyan-100/25"
                }`}
              />
            )}

            {/* Ambient Room Edge Reflections */}
            <div className="absolute inset-0 pointer-events-none border border-white/10" />
          </div>
        </div>
      </div>

      {/* Resolution Quality Bar */}
      <div className="p-2 rounded-xl bg-stone-50 border border-stone-200 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          {estDpi >= 150 ? (
            <CheckCircle2 size={14} className="text-emerald-700 shrink-0" />
          ) : (
            <AlertCircle size={14} className="text-amber-700 shrink-0" />
          )}
          <span>
            Resolution: {imgDim.width}×{imgDim.height}px (~{estDpi} DPI for {currentSizeConfig.label})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFitMode(fitMode === "cover" ? "contain" : "cover")}
            className="py-1 px-2 rounded border bg-white text-[11px] font-medium flex items-center gap-1"
          >
            {fitMode === "cover" ? <Minimize size={12} /> : <Maximize size={12} />}
            <span>{fitMode === "cover" ? "Fit Entire Photo" : "Fill Frame"}</span>
          </button>
          <div className="flex items-center border border-stone-300 rounded bg-white">
            <button
              type="button"
              onClick={() => setZoom(Math.min(3, zoom + 0.15))}
              className="p-1 hover:bg-stone-100"
              title="Zoom in"
            >
              <ZoomIn size={12} />
            </button>
            <span className="px-1 text-[10px] font-mono">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoom(Math.max(0.5, zoom - 0.15))}
              className="p-1 hover:bg-stone-100"
              title="Zoom out"
            >
              <ZoomOut size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Action Controls & Upload */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
        <label className="ed-button outline cursor-pointer text-xs flex items-center gap-2 py-2.5 px-4 w-full sm:w-auto justify-center">
          <Upload size={14} />
          <span>{isCustomPhoto ? "Replace With Another Photo" : "Personalize With My Photo"}</span>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </label>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ed-button flex items-center justify-center gap-2 bg-[#25D366] text-white border-[#25D366] hover:bg-[#20b858] text-xs py-2.5 px-4 w-full sm:w-auto shadow-xs"
        >
          <MessageCircle size={15} />
          <span>Inquire Translight on WhatsApp</span>
        </a>
      </div>
    </div>
  );
}
