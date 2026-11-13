import { useState, useRef, type ChangeEvent } from "react";
import {
  Smartphone,
  Upload,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Sparkles,
  MessageCircle,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { SITE, whatsappLink } from "@/lib/site";

export interface PhoneModel {
  id: string;
  name: string;
  brand: string;
  cameraType: "iphone_pro" | "iphone_dual" | "samsung_vertical" | "oneplus_circle";
}

export const PHONE_BRANDS = ["Apple", "Samsung", "OnePlus", "Vivo", "Oppo", "Realme", "Xiaomi"] as const;
export type PhoneBrand = (typeof PHONE_BRANDS)[number];

export const PHONE_MODELS: PhoneModel[] = [
  { id: "ip15pm", name: "iPhone 15 Pro Max", brand: "Apple", cameraType: "iphone_pro" },
  { id: "ip15p", name: "iPhone 15 Pro", brand: "Apple", cameraType: "iphone_pro" },
  { id: "ip15", name: "iPhone 15", brand: "Apple", cameraType: "iphone_dual" },
  { id: "ip14p", name: "iPhone 14 Pro", brand: "Apple", cameraType: "iphone_pro" },
  { id: "ip13", name: "iPhone 13", brand: "Apple", cameraType: "iphone_dual" },
  { id: "s24u", name: "Galaxy S24 Ultra", brand: "Samsung", cameraType: "samsung_vertical" },
  { id: "s24p", name: "Galaxy S24+", brand: "Samsung", cameraType: "samsung_vertical" },
  { id: "s24", name: "Galaxy S24", brand: "Samsung", cameraType: "samsung_vertical" },
  { id: "s23u", name: "Galaxy S23 Ultra", brand: "Samsung", cameraType: "samsung_vertical" },
  { id: "op12", name: "OnePlus 12", brand: "OnePlus", cameraType: "oneplus_circle" },
  { id: "op12r", name: "OnePlus 12R", brand: "OnePlus", cameraType: "oneplus_circle" },
  { id: "op11", name: "OnePlus 11", brand: "OnePlus", cameraType: "oneplus_circle" },
  { id: "v29", name: "Vivo V29 Pro", brand: "Vivo", cameraType: "samsung_vertical" },
  { id: "rn13p", name: "Redmi Note 13 Pro+", brand: "Xiaomi", cameraType: "iphone_pro" },
];

export type CaseType = "polycarbonate_matte" | "tempered_glass" | "soft_tpu";

export const CASE_TYPES: { id: CaseType; name: string; desc: string; price: number }[] = [
  {
    id: "polycarbonate_matte",
    name: "3D Sublimation Matte",
    desc: "Seamless edge-to-edge wrap, scratch-proof hard polycarbonate",
    price: 399,
  },
  {
    id: "tempered_glass",
    name: "9H Tempered Glass Luxe",
    desc: "Ultra-glossy mirror reflection with protective rubber shock bumper",
    price: 549,
  },
  {
    id: "soft_tpu",
    name: "Soft Silicone Shockproof",
    desc: "Flexible matte touch with 1.5mm raised camera bezel lip",
    price: 349,
  },
];

export function PhoneCoverCustomizer() {
  const [selectedBrand, setSelectedBrand] = useState<PhoneBrand>("Apple");
  const [selectedModelId, setSelectedModelId] = useState<string>("ip15p");
  const [caseType, setCaseType] = useState<CaseType>("polycarbonate_matte");
  const [photoUrl, setPhotoUrl] = useState<string>("/products/frame-sample-wedding.jpg");
  const [customText, setCustomText] = useState<string>("Aarav");
  const [textColor, setTextColor] = useState<"gold" | "white" | "black">("gold");
  const [fitMode, setFitMode] = useState<"cover" | "contain">("cover");
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableModels = PHONE_MODELS.filter((m) => m.brand === selectedBrand);
  const currentModel = PHONE_MODELS.find((m) => m.id === selectedModelId) || availableModels[0] || PHONE_MODELS[0];
  const currentCase = CASE_TYPES.find((c) => c.id === caseType) || CASE_TYPES[0];

  const handleBrandChange = (b: PhoneBrand) => {
    setSelectedBrand(b);
    const firstOfBrand = PHONE_MODELS.find((m) => m.brand === b);
    if (firstOfBrand) setSelectedModelId(firstOfBrand.id);
  };

  const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPhotoUrl(url);
    setZoom(1);
    setPan({ x: 0, y: 0 });
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

  const whatsappMessage = `Namaste ${SITE.name}! 📱 I designed a Custom Photo Phone Case in your Live Studio:
Phone Model: ${currentModel.brand} ${currentModel.name}
Case Type: ${currentCase.name} (₹${currentCase.price})
Personalized Name/Text: "${customText}"
Text Styling: ${textColor}
Could you please confirm phone cover availability and order timeline? Thank you!`;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner */}
      <div className="bg-[#FAF7F1] border border-stone-200 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div>
          <span className="text-[10px] font-bold text-[#8B6D3F] uppercase tracking-wider flex items-center gap-1.5">
            <Smartphone size={13} /> Custom Photo Phone Covers · 200+ Models
          </span>
          <h3 className="font-display text-lg text-stone-900 font-semibold mt-0.5">
            Precision Edge-to-Edge Print & Shock Protection
          </h3>
          <p className="text-xs text-stone-600 mt-0.5">
            High-definition sublimation and 9H tempered glass with exact camera cutout alignment.
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-amber-900 bg-amber-100/70 px-3 py-1 rounded-full border border-amber-300">
          Starting from ₹349
        </span>
      </div>

      {/* Main Grid: Visual Stage on Left, Product Customizer on Right */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left: Phone Case Preview Stage */}
        <div className="relative mx-auto w-full max-w-[340px] aspect-[9/18] bg-stone-900/5 rounded-3xl border border-stone-300 p-6 flex flex-col items-center justify-center shadow-lg overflow-hidden">
          {/* Phone Case Silhouette */}
          <div
            className={`relative w-[210px] h-[420px] rounded-[36px] overflow-hidden transition-all duration-300 shadow-2xl ${
              caseType === "tempered_glass"
                ? "border-[6px] border-stone-950 ring-2 ring-white/30 shadow-[0_25px_50px_rgba(0,0,0,0.4)]"
                : caseType === "soft_tpu"
                ? "border-[7px] border-stone-900 shadow-[0_20px_40px_rgba(0,0,0,0.3)]"
                : "border-[4px] border-stone-300 shadow-[0_20px_45px_rgba(0,0,0,0.25)]"
            }`}
          >
            {/* Customer Photo Container */}
            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="relative size-full overflow-hidden bg-stone-950 cursor-grab active:cursor-grabbing"
              style={{ touchAction: "none" }}
            >
              <img
                src={photoUrl}
                alt="Case photo"
                draggable={false}
                style={{
                  transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                }}
                className={`size-full pointer-events-none transition-transform duration-75 ${
                  fitMode === "contain" ? "object-contain" : "object-cover"
                }`}
              />

              {/* Tempered Glass Reflection Overlay */}
              {caseType === "tempered_glass" && (
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none z-20" />
              )}

              {/* Exact Camera Cutout Simulation */}
              {currentModel.cameraType === "iphone_pro" && (
                <div className="absolute top-4 left-4 size-16 bg-stone-950/95 border-2 border-stone-800 rounded-2xl shadow-xl z-30 p-1.5 flex flex-wrap gap-1">
                  <div className="size-5 rounded-full bg-stone-900 border border-stone-700" />
                  <div className="size-5 rounded-full bg-stone-900 border border-stone-700" />
                  <div className="size-5 rounded-full bg-stone-900 border border-stone-700 mx-auto" />
                </div>
              )}

              {currentModel.cameraType === "iphone_dual" && (
                <div className="absolute top-4 left-4 w-9 h-16 bg-stone-950/95 border-2 border-stone-800 rounded-2xl shadow-xl z-30 p-1 flex flex-col justify-between items-center">
                  <div className="size-5 rounded-full bg-stone-900 border border-stone-700" />
                  <div className="size-5 rounded-full bg-stone-900 border border-stone-700" />
                </div>
              )}

              {currentModel.cameraType === "samsung_vertical" && (
                <div className="absolute top-4 left-4 w-7 h-20 bg-stone-950/95 border-2 border-stone-800 rounded-xl shadow-xl z-30 p-1 flex flex-col justify-between items-center">
                  <div className="size-4 rounded-full bg-stone-900 border border-stone-700" />
                  <div className="size-4 rounded-full bg-stone-900 border border-stone-700" />
                  <div className="size-4 rounded-full bg-stone-900 border border-stone-700" />
                </div>
              )}

              {currentModel.cameraType === "oneplus_circle" && (
                <div className="absolute top-4 left-5 size-16 bg-stone-950/95 border-2 border-stone-800 rounded-full shadow-xl z-30 p-1 flex items-center justify-center">
                  <div className="size-12 rounded-full border border-stone-700 flex items-center justify-center">
                    <span className="text-[7px] text-stone-500 font-mono">HASSELBLAD</span>
                  </div>
                </div>
              )}

              {/* Custom Text Overlay */}
              {customText && (
                <div className="absolute bottom-6 inset-x-3 text-center z-25 pointer-events-none">
                  <span
                    className={`font-display text-base font-bold tracking-widest uppercase ${
                      textColor === "gold"
                        ? "text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                        : textColor === "white"
                        ? "text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                        : "text-stone-950 drop-shadow-[0_2px_4px_rgba(255,255,255,0.8)]"
                    }`}
                  >
                    {customText}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-amber-900 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
            <AlertTriangle size={12} className="text-amber-700 shrink-0" />
            <span>Camera cutout shown — keep faces centered</span>
          </div>
        </div>

        {/* Right: Step-by-Step Customization Panel */}
        <div className="space-y-4">
          {/* Step 1: Select Brand */}
          <div>
            <label className="text-xs font-bold text-stone-800 block mb-1.5">
              1. Select Phone Brand:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PHONE_BRANDS.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => handleBrandChange(b)}
                  className={`py-1.5 px-3 rounded-lg border text-xs font-medium transition-all ${
                    selectedBrand === b
                      ? "bg-[#29251F] text-amber-100 border-[#29251F] font-bold shadow-2xs"
                      : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Select Model */}
          <div>
            <label className="text-xs font-bold text-stone-800 block mb-1.5">
              2. Select Phone Model:
            </label>
            <select
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="w-full border border-stone-300 rounded-lg p-2 text-xs bg-white"
            >
              {availableModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Step 3: Case Type Selection */}
          <div>
            <label className="text-xs font-bold text-stone-800 block mb-1.5">
              3. Select Case Material:
            </label>
            <div className="space-y-1.5">
              {CASE_TYPES.map((c) => {
                const isSelected = caseType === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCaseType(c.id)}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-amber-50 border-amber-800 shadow-2xs"
                        : "bg-white border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold text-stone-900 block">{c.name}</span>
                      <span className="text-[10px] text-stone-500 block">{c.desc}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-900">
                      ₹{c.price}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 4: Photo Controls & Custom Name */}
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-stone-800">Photo Adjustments:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFitMode(fitMode === "cover" ? "contain" : "cover")}
                  className="py-1 px-2 rounded border bg-white text-[11px] font-medium"
                >
                  {fitMode === "cover" ? "Fit Entire Photo" : "Fill Case"}
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(Math.min(3, zoom + 0.15))}
                  className="p-1 rounded border bg-white"
                  title="Zoom in"
                >
                  <ZoomIn size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.15))}
                  className="p-1 rounded border bg-white"
                  title="Zoom out"
                >
                  <ZoomOut size={12} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-stone-700 block mb-1">
                  Custom Name / Monogram:
                </label>
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="e.g. Aarav"
                  className="w-full border border-stone-300 rounded p-1.5 text-xs bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-700 block mb-1">
                  Typography Foil Color:
                </label>
                <div className="flex gap-1">
                  {(["gold", "white", "black"] as const).map((clr) => (
                    <button
                      key={clr}
                      type="button"
                      onClick={() => setTextColor(clr)}
                      className={`flex-1 py-1 rounded border text-[10px] capitalize font-medium ${
                        textColor === clr ? "bg-[#29251F] text-amber-100 font-bold" : "bg-white text-stone-700"
                      }`}
                    >
                      {clr}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <label className="ed-button outline cursor-pointer text-xs flex items-center justify-center gap-1.5 py-2 w-full">
              <Upload size={13} />
              <span>Upload Custom Photo</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Action Order Button */}
          <div className="pt-2">
            <a
              href={whatsappLink(whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="ed-button flex items-center justify-center gap-2 bg-[#25D366] text-white border-[#25D366] hover:bg-[#20b858] text-xs py-3 w-full shadow-xs"
            >
              <MessageCircle size={16} />
              <span>Order Case on WhatsApp (₹{currentCase.price})</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
