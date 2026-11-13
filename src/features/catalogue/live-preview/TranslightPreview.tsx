import { useState, type ChangeEvent } from "react";
import { Lightbulb, LightbulbOff, Upload, Sparkles, Sun, Moon, ArrowRight, MessageCircle } from "lucide-react";
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
  const [photoUrl, setPhotoUrl] = useState<string>(
    defaultPhotoUrl || "/products/translight-sample.svg",
  );
  const [isLightOn, setIsLightOn] = useState<boolean>(true);
  const [colorTemp, setColorTemp] = useState<"warm" | "pure">("warm"); // 3000K Warm vs 4000K Pure
  const [isCustomPhoto, setIsCustomPhoto] = useState<boolean>(!!defaultPhotoUrl);

  const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPhotoUrl(url);
    setIsCustomPhoto(true);
    onPhotoUploaded?.(url);
  };

  const whatsappUrl = whatsappLink(
    `Namaste ${SITE.name}! 💡 I am interested in ordering a Backlit LED Translight Frame:
Size: ${size}
Lighting Profile: ${colorTemp === "warm" ? "Warm Temple Golden (3000K)" : "Pure Architectural White (4000K)"}
Could you please share production lead time and framing details? Thank you!`,
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Light & Color Temperature Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-stone-100/90 rounded-2xl border border-stone-200">
        <div>
          <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-600" />
            Backlit LED Translight ({size} Portrait)
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
        className={`relative mx-auto w-full max-w-[460px] h-[440px] rounded-2xl overflow-hidden p-6 flex items-center justify-center transition-all duration-700 shadow-xl ${
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
          className={`relative h-full max-h-[390px] rounded-xs border-[12px] border-[#0A0908] overflow-hidden flex items-center justify-center transition-all duration-700 ${
            isLightOn
              ? colorTemp === "warm"
                ? "shadow-[inset_0_0_24px_rgba(255,230,170,0.45),0_0_50px_rgba(255,190,90,0.4)]"
                : "shadow-[inset_0_0_24px_rgba(220,240,255,0.45),0_0_50px_rgba(180,210,255,0.4)]"
              : "shadow-[inset_0_0_20px_rgba(0,0,0,0.9)]"
          }`}
        >
          <div className="relative size-full overflow-hidden bg-black">
            <img
              src={photoUrl}
              alt="Translight illuminated artwork"
              className={`size-full object-cover transition-all duration-700 ${
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
