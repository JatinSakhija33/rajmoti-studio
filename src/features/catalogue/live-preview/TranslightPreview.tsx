import React, { useState } from "react";
import { Lightbulb, LightbulbOff, Upload, Sparkles, AlertCircle, Sun, Moon } from "lucide-react";
import { SITE, whatsappLink } from "@/lib/site";

interface TranslightPreviewProps {
  size?: string;
  defaultPhotoUrl?: string;
  onPhotoUploaded?: (url: string) => void;
}

export function TranslightPreview({
  size = "12×18 in",
  defaultPhotoUrl,
  onPhotoUploaded,
}: TranslightPreviewProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(defaultPhotoUrl || null);
  const [isLightOn, setIsLightOn] = useState<boolean>(true);
  const [colorTemp, setColorTemp] = useState<"warm" | "pure">("warm"); // 3000K Warm vs 4000K Pure
  const [resolutionWarning, setResolutionWarning] = useState("");

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPhotoUrl(url);
    onPhotoUploaded?.(url);

    const img = new Image();
    img.src = url;
    img.onload = () => {
      if (img.naturalWidth < 1500 || img.naturalHeight < 1500) {
        setResolutionWarning(
          `Resolution advisory: Photo is ${img.naturalWidth}×${img.naturalHeight}px. Translight backlighting illuminates fine details; original high-resolution camera originals are recommended.`,
        );
      } else {
        setResolutionWarning("");
      }
    };
  };

  const whatsappUrl = whatsappLink(
    `Namaste ${SITE.name}! 💡 I am interested in ordering a Backlit LED Translight Frame:
Size: ${size}
Lighting Profile: ${colorTemp === "warm" ? "Warm Temple Golden (3000K)" : "Pure Divine White (4000K)"}
Could you please share the specifications and delivery timeline? Thank you!`,
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Light & Color Temperature Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-stone-100/90 rounded-xl border border-stone-200">
        <div>
          <span className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-600" />
            Translight Backlit LED Simulation ({size})
          </span>
          <span className="text-[11px] text-stone-500">
            Internal edge-lit LED panel with high-diffusion optical film
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Color Temperature (3000K vs 4000K) */}
          {isLightOn && (
            <div className="flex rounded-lg border border-stone-300 overflow-hidden bg-white p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setColorTemp("warm")}
                className={`py-1 px-2 rounded font-medium flex items-center gap-1 transition-colors ${
                  colorTemp === "warm" ? "bg-amber-100 text-amber-900 font-semibold" : "text-stone-600"
                }`}
              >
                3000K Warm
              </button>
              <button
                type="button"
                onClick={() => setColorTemp("pure")}
                className={`py-1 px-2 rounded font-medium flex items-center gap-1 transition-colors ${
                  colorTemp === "pure" ? "bg-stone-200 text-stone-900 font-semibold" : "text-stone-600"
                }`}
              >
                4000K Pure
              </button>
            </div>
          )}

          {/* Light Power Switch */}
          <div className="flex rounded-lg border border-stone-300 overflow-hidden bg-white p-0.5">
            <button
              type="button"
              onClick={() => setIsLightOn(false)}
              className={`py-1.5 px-3 rounded font-medium flex items-center gap-1.5 text-xs transition-colors ${
                !isLightOn ? "bg-stone-800 text-white shadow-xs" : "text-stone-600 hover:bg-stone-100"
              }`}
            >
              <LightbulbOff size={13} /> Off
            </button>
            <button
              type="button"
              onClick={() => setIsLightOn(true)}
              className={`py-1.5 px-3 rounded font-medium flex items-center gap-1.5 text-xs transition-colors ${
                isLightOn ? "bg-amber-600 text-white shadow-xs" : "text-stone-600 hover:bg-stone-100"
              }`}
            >
              <Lightbulb size={13} /> Light On
            </button>
          </div>
        </div>
      </div>

      {/* Visual Translight Stage */}
      <div
        className={`relative mx-auto w-full max-w-[440px] aspect-[2/3] max-h-[380px] rounded-2xl overflow-hidden p-6 flex items-center justify-center transition-all duration-700 ${
          isLightOn
            ? colorTemp === "warm"
              ? "bg-[#14120E] shadow-[0_0_70px_rgba(250,190,90,0.3)]"
              : "bg-[#101316] shadow-[0_0_70px_rgba(180,210,250,0.28)]"
            : "bg-[#24211E]"
        }`}
      >
        {/* Sleek Aluminum Frame Chassis */}
        <div
          className={`relative size-full rounded-xs border-[12px] border-[#0A0908] overflow-hidden flex items-center justify-center transition-all duration-700 ${
            isLightOn
              ? colorTemp === "warm"
                ? "shadow-[inset_0_0_24px_rgba(255,230,170,0.45),0_0_40px_rgba(255,190,90,0.38)]"
                : "shadow-[inset_0_0_24px_rgba(220,240,255,0.45),0_0_40px_rgba(180,210,255,0.38)]"
              : "shadow-[inset_0_0_15px_rgba(0,0,0,0.85)]"
          }`}
        >
          {photoUrl ? (
            <div className="relative size-full overflow-hidden bg-black">
              <img
                src={photoUrl}
                alt="Translight photograph preview"
                className={`size-full object-cover transition-all duration-700 ${
                  isLightOn
                    ? colorTemp === "warm"
                      ? "brightness-125 contrast-110 saturate-120 drop-shadow-[0_0_20px_rgba(255,220,150,0.35)]"
                      : "brightness-130 contrast-115 saturate-105 drop-shadow-[0_0_20px_rgba(200,230,255,0.35)]"
                    : "brightness-70 contrast-95 opacity-75"
                }`}
              />
              {/* Backlit Diffusion Light Layer */}
              {isLightOn && (
                <div
                  className={`absolute inset-0 pointer-events-none mix-blend-screen transition-opacity duration-700 ${
                    colorTemp === "warm"
                      ? "bg-gradient-to-t from-amber-400/20 via-transparent to-amber-200/20"
                      : "bg-gradient-to-t from-blue-200/20 via-transparent to-cyan-100/20"
                  }`}
                />
              )}
            </div>
          ) : (
            <div className="size-full bg-stone-900/90 flex flex-col items-center justify-center p-6 text-center text-stone-300">
              <Upload size={28} className="mb-2 text-stone-400" />
              <span className="font-display font-semibold text-sm text-stone-200 block">
                Rajmoti Backlit Translight · {size}
              </span>
              <span className="text-[11px] text-stone-400 mt-1 max-w-[240px]">
                High-diffusion LED light illuminates your family, devotional or milestone portrait evenly across every corner.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Photo Uploader */}
      <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs space-y-2">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-stone-800">Preview your photograph on Translight</span>
          <label className="cursor-pointer text-xs font-semibold text-[#8B6D3F] hover:underline flex items-center gap-1">
            <Upload size={13} /> Choose photo
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </label>
        </div>

        {photoUrl ? (
          <p className="text-[11px] text-emerald-700">
            ✓ Photo rendered with internal backlighting simulation. Switch Light Off / On to compare.
          </p>
        ) : (
          <p className="text-[11px] text-stone-500">
            Processed locally on your device. Never uploaded until order submission.
          </p>
        )}

        {resolutionWarning && (
          <div className="flex items-start gap-1.5 text-amber-900 bg-amber-50 p-2 rounded border border-amber-200 text-[11px]">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{resolutionWarning}</span>
          </div>
        )}
      </div>

      {/* Direct Order on WhatsApp CTA */}
      <div className="flex justify-end pt-1">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ed-button flex items-center gap-2 bg-[#25D366] text-white border-[#25D366] hover:bg-[#20b858] text-xs font-semibold px-4 py-2 rounded-xl"
        >
          <Sparkles size={14} /> Order Translight on WhatsApp
        </a>
      </div>
    </div>
  );
}
