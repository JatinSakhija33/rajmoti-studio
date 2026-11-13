import React, { useState, useRef } from "react";
import {
  Upload,
  Sparkles,
  RotateCw,
  Heart,
  Square,
  Circle,
  RectangleHorizontal,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Layers,
} from "lucide-react";
import { SITE, whatsappLink } from "@/lib/site";

export type KeychainShape = "square" | "rectangle" | "heart" | "round";
export type KeychainMaterial = "acrylic" | "teak" | "metallic";
export type KeychainSide = "front" | "back";

interface KeychainCustomizerProps {
  defaultPhotoUrl?: string;
  onPhotoUploaded?: (frontUrl: string, backUrl?: string) => void;
}

export function KeychainCustomizer({
  defaultPhotoUrl = "/products/frame-sample-anniversary.jpg",
  onPhotoUploaded,
}: KeychainCustomizerProps) {
  const [shape, setShape] = useState<KeychainShape>("rectangle");
  const [material, setMaterial] = useState<KeychainMaterial>("acrylic");
  const [activeSide, setActiveSide] = useState<KeychainSide>("front");
  const [frontPhotoUrl, setFrontPhotoUrl] = useState<string>(defaultPhotoUrl);
  const [backPhotoUrl, setBackPhotoUrl] = useState<string>("/products/frame-sample-wedding.jpg");
  const [backMode, setBackMode] = useState<"photo" | "text">("text");
  const [backText, setBackText] = useState<string>("Forever · 2026");
  const [backSubtext, setBackSubtext] = useState<string>("Aarav & Riya");
  const [isRotating, setIsRotating] = useState(false);
  const [warning, setWarning] = useState("");

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  const handleFrontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setFrontPhotoUrl(url);
    onPhotoUploaded?.(url, backPhotoUrl);

    const img = new Image();
    img.src = url;
    img.onload = () => {
      if (img.naturalWidth < 600 || img.naturalHeight < 600) {
        setWarning("Photo resolution is a bit low, but sufficient for keychain scale.");
      } else {
        setWarning("");
      }
    };
  };

  const handleBackUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setBackPhotoUrl(url);
    onPhotoUploaded?.(frontPhotoUrl, url);
  };

  const handleFlip = () => {
    setIsRotating(true);
    setTimeout(() => {
      setActiveSide((prev) => (prev === "front" ? "back" : "front"));
      setIsRotating(false);
    }, 250);
  };

  const getPrice = () => {
    if (material === "metallic") return 249;
    if (material === "acrylic") return 199;
    return 149; // teak wood MDF
  };

  const getWhatsAppMessage = () => {
    return (
      `Namaste Rajmoti Studio! 🔑 I designed a custom Photo Keychain in your Live Studio:\n` +
      `• Shape: ${shape.toUpperCase()}\n` +
      `• Material: ${material === "acrylic" ? "Clear Acrylic" : material === "teak" ? "Teak Finish Wood" : "Brushed Metallic"}\n` +
      `• Front: Personal Photo\n` +
      `• Back: ${backMode === "text" ? `Custom Inscription ("${backText}" - "${backSubtext}")` : "Second Photo"}\n` +
      `• Indicative Price: ₹${getPrice()}\n\n` +
      `Could you please verify production time and confirm where to send my original photo on WhatsApp?`
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Configurator Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-200">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
            Pocket Keepsake Studio
          </span>
          <h3 className="text-xl font-display font-bold text-stone-900">
            Double-Sided Custom Keychain
          </h3>
        </div>

        {/* Shape Pills */}
        <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200">
          <button
            type="button"
            onClick={() => setShape("rectangle")}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
              shape === "rectangle" ? "bg-white text-stone-900 shadow-xs font-bold" : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <RectangleHorizontal size={13} />
            Rect (40×60mm)
          </button>
          <button
            type="button"
            onClick={() => setShape("square")}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
              shape === "square" ? "bg-white text-stone-900 shadow-xs font-bold" : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Square size={13} />
            Square (45mm)
          </button>
          <button
            type="button"
            onClick={() => setShape("round")}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
              shape === "round" ? "bg-white text-stone-900 shadow-xs font-bold" : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Circle size={13} />
            Round (50mm)
          </button>
          <button
            type="button"
            onClick={() => setShape("heart")}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
              shape === "heart" ? "bg-white text-stone-900 shadow-xs font-bold" : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Heart size={13} />
            Heart (50mm)
          </button>
        </div>
      </div>

      {/* Main Studio Arena */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-[#FDFBF7] p-6 rounded-2xl border border-stone-200">
        {/* Left: Interactive Keychain Stage */}
        <div className="flex flex-col items-center justify-center space-y-4">
          {/* Metal Ring & Chain Visual */}
          <div className="flex flex-col items-center">
            {/* Stainless Steel Ring */}
            <div className="size-14 rounded-full border-4 border-stone-400 bg-stone-100 shadow-md flex items-center justify-center relative">
              <div className="size-8 rounded-full border border-stone-300" />
            </div>
            {/* Chain links */}
            <div className="w-1.5 h-3 bg-stone-400 rounded-full -my-0.5" />
            <div className="w-1.5 h-3 bg-stone-300 rounded-full -my-0.5" />
          </div>

          {/* Keychain Fob */}
          <div
            onClick={handleFlip}
            className={`cursor-pointer relative overflow-hidden transition-all duration-300 transform shadow-2xl flex items-center justify-center ${
              isRotating ? "rotate-y-90 scale-95 opacity-50" : "rotate-y-0 scale-100 opacity-100"
            } ${
              shape === "rectangle"
                ? "w-44 h-60 rounded-2xl"
                : shape === "square"
                ? "w-52 h-52 rounded-2xl"
                : shape === "round"
                ? "w-52 h-52 rounded-full"
                : "w-52 h-52 rounded-t-[50%] rounded-b-[20%] clip-path-heart"
            } ${
              material === "acrylic"
                ? "border-4 border-white/80 bg-white/40 backdrop-blur-md shadow-[0_15px_35px_rgba(0,0,0,0.2)] ring-1 ring-black/10"
                : material === "teak"
                ? "border-[6px] border-[#5A3E26] bg-[#3B2516] shadow-[0_15px_35px_rgba(40,20,10,0.3)]"
                : "border-4 border-amber-300 bg-gradient-to-br from-amber-100 to-amber-300 shadow-[0_15px_35px_rgba(200,160,80,0.3)]"
            }`}
          >
            {/* Keychain Content */}
            {activeSide === "front" ? (
              <div className="relative size-full overflow-hidden">
                <img
                  src={frontPhotoUrl}
                  alt="Keychain Front Preview"
                  className="size-full object-cover"
                />
                {/* Surface Reflection Gloss */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-white/40 pointer-events-none" />
                <div className="absolute top-2 left-2 bg-stone-900/70 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                  FRONT
                </div>
              </div>
            ) : backMode === "photo" ? (
              <div className="relative size-full overflow-hidden">
                <img
                  src={backPhotoUrl}
                  alt="Keychain Back Preview"
                  className="size-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-white/40 pointer-events-none" />
                <div className="absolute top-2 left-2 bg-stone-900/70 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                  BACK (PHOTO)
                </div>
              </div>
            ) : (
              <div className="relative size-full p-4 flex flex-col items-center justify-center text-center bg-stone-950 text-amber-100">
                <Sparkles size={18} className="text-amber-400 mb-1" />
                <p className="font-display font-bold text-base text-amber-200 tracking-wide">
                  {backText || "Forever"}
                </p>
                <p className="text-[11px] text-stone-300 mt-1 font-mono">
                  {backSubtext || "Aarav & Riya"}
                </p>
                <div className="absolute top-2 left-2 bg-stone-800 text-stone-300 text-[9px] font-bold px-2 py-0.5 rounded-full">
                  BACK (ENGRAVED)
                </div>
              </div>
            )}

            {/* Keychain Drill Hole */}
            <div className="absolute top-3 inset-x-0 mx-auto size-3 rounded-full bg-stone-900/80 border border-stone-400/50 shadow-inner" />
          </div>

          {/* Flip Action Button */}
          <button
            type="button"
            onClick={handleFlip}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-stone-300 hover:border-amber-700 text-xs font-semibold text-stone-700 shadow-xs transition-all"
          >
            <RotateCw size={13} className="text-amber-800" />
            Tap to Flip to {activeSide === "front" ? "Back Side" : "Front Side"}
          </button>
        </div>

        {/* Right: Personalization Form & Materials */}
        <div className="space-y-5">
          {/* Material Selection */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-2">
              Select Material Finish
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMaterial("acrylic")}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  material === "acrylic"
                    ? "bg-[#29251F] text-amber-100 border-[#29251F] shadow-xs"
                    : "bg-white text-stone-800 border-stone-200 hover:border-amber-700"
                }`}
              >
                <span className="text-xs font-bold block">Clear Acrylic</span>
                <span className="text-[10px] text-stone-400 block mt-0.5">₹199 · High Gloss</span>
              </button>

              <button
                type="button"
                onClick={() => setMaterial("teak")}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  material === "teak"
                    ? "bg-[#29251F] text-amber-100 border-[#29251F] shadow-xs"
                    : "bg-white text-stone-800 border-stone-200 hover:border-amber-700"
                }`}
              >
                <span className="text-xs font-bold block">Teak Wood Finish</span>
                <span className="text-[10px] text-stone-400 block mt-0.5">₹149 · Organic Wood</span>
              </button>

              <button
                type="button"
                onClick={() => setMaterial("metallic")}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  material === "metallic"
                    ? "bg-[#29251F] text-amber-100 border-[#29251F] shadow-xs"
                    : "bg-white text-stone-800 border-stone-200 hover:border-amber-700"
                }`}
              >
                <span className="text-xs font-bold block">Brushed Metallic</span>
                <span className="text-[10px] text-stone-400 block mt-0.5">₹249 · Gold / Silver</span>
              </button>
            </div>
          </div>

          {/* Photo Controls */}
          <div className="space-y-3 pt-2 border-t border-stone-200">
            {/* Front Photo Upload */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-stone-200">
              <div>
                <span className="text-xs font-bold text-stone-900 block">Front Side Photo</span>
                <span className="text-[11px] text-stone-500">Portrait or couple close-up</span>
              </div>
              <input
                ref={frontInputRef}
                type="file"
                accept="image/*"
                onChange={handleFrontUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => frontInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold"
              >
                <Upload size={13} />
                Change Front
              </button>
            </div>

            {/* Back Side Mode */}
            <div className="p-3 rounded-xl bg-white border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-stone-900 block">Back Side Customization</span>
                  <span className="text-[11px] text-stone-500">Choose custom text or 2nd photo</span>
                </div>
                <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg border border-stone-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setBackMode("text")}
                    className={`px-2 py-1 rounded font-medium ${
                      backMode === "text" ? "bg-white font-bold text-stone-900 shadow-xs" : "text-stone-600"
                    }`}
                  >
                    Text / Date
                  </button>
                  <button
                    type="button"
                    onClick={() => setBackMode("photo")}
                    className={`px-2 py-1 rounded font-medium ${
                      backMode === "photo" ? "bg-white font-bold text-stone-900 shadow-xs" : "text-stone-600"
                    }`}
                  >
                    2nd Photo
                  </button>
                </div>
              </div>

              {backMode === "text" ? (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-[10px] font-semibold text-stone-600 block mb-1">Headline / Date</span>
                    <input
                      type="text"
                      value={backText}
                      onChange={(e) => setBackText(e.target.value)}
                      placeholder="e.g. 24.11.2026"
                      className="w-full text-xs p-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-stone-600 block mb-1">Names / Blessing</span>
                    <input
                      type="text"
                      value={backSubtext}
                      onChange={(e) => setBackSubtext(e.target.value)}
                      placeholder="e.g. Aarav & Riya"
                      className="w-full text-xs p-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-stone-600">Select second photograph for reverse</span>
                  <input
                    ref={backInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBackUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => backInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold"
                  >
                    <Upload size={13} />
                    Upload 2nd Photo
                  </button>
                </div>
              )}
            </div>
          </div>

          {warning && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0 text-amber-700" />
              <span>{warning}</span>
            </div>
          )}

          {/* Pricing & WhatsApp Order Action */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-stone-500 block">Indicative Studio Price</span>
              <span className="text-2xl font-bold font-display text-stone-900">
                ₹{getPrice()}
              </span>
            </div>

            <a
              href={whatsappLink(getWhatsAppMessage())}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] text-white hover:bg-[#20b858] font-bold text-xs transition-all shadow-md"
            >
              <MessageCircle size={16} />
              Order Keychain on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
