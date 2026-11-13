import React, { useState } from "react";
import { Lightbulb, LightbulbOff, Upload, Sparkles, AlertCircle } from "lucide-react";

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
          `Resolution advisory: Photo is ${img.naturalWidth}×${img.naturalHeight}px. Translight backlighting highlights fine details; original high-resolution photos are recommended.`,
        );
      } else {
        setResolutionWarning("");
      }
    };
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Light Toggle Switch Bar */}
      <div className="flex justify-between items-center p-3 bg-stone-100/80 rounded-xl border border-stone-200">
        <div>
          <span className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-600" />
            Translight Backlit LED Simulation
          </span>
          <span className="text-[11px] text-stone-500">Preview the actual illumination in dark/ambient rooms</span>
        </div>
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

      {/* Visual Translight Stage */}
      <div
        className={`relative mx-auto w-full max-w-[440px] aspect-[4/3] rounded-2xl overflow-hidden p-6 flex items-center justify-center transition-all duration-700 ${
          isLightOn ? "bg-[#181614] shadow-[0_0_60px_rgba(240,190,100,0.25)]" : "bg-[#29251F]"
        }`}
      >
        {/* Sleek Aluminum Frame Molding */}
        <div
          className={`relative size-full rounded-sm border-[10px] border-[#0F0E0C] overflow-hidden flex items-center justify-center transition-all duration-700 ${
            isLightOn
              ? "shadow-[inset_0_0_20px_rgba(255,240,200,0.4),0_0_35px_rgba(255,200,100,0.35)]"
              : "shadow-[inset_0_0_15px_rgba(0,0,0,0.8)]"
          }`}
        >
          {photoUrl ? (
            <div className="relative size-full overflow-hidden bg-black">
              <img
                src={photoUrl}
                alt="Translight photograph preview"
                className={`size-full object-cover transition-all duration-700 ${
                  isLightOn
                    ? "brightness-125 contrast-110 saturate-115 drop-shadow-[0_0_20px_rgba(255,230,170,0.3)]"
                    : "brightness-75 contrast-95 opacity-80"
                }`}
              />
              {/* Backlit Diffusion Film simulation */}
              {isLightOn && (
                <div className="absolute inset-0 bg-gradient-to-t from-amber-400/15 via-transparent to-amber-200/15 pointer-events-none mix-blend-screen" />
              )}
            </div>
          ) : (
            <div
              className={`size-full flex flex-col items-center justify-center p-6 text-center transition-colors duration-700 ${
                isLightOn ? "bg-[#FFF9EC] text-stone-800" : "bg-stone-900 text-stone-400"
              }`}
            >
              <Lightbulb size={32} className={isLightOn ? "text-amber-500 animate-pulse mb-2" : "text-stone-600 mb-2"} />
              <p className="font-display text-lg font-semibold">{size} Translight Frame</p>
              <p className="text-xs mt-1">Upload your photograph to simulate high-lumen backlighting</p>
            </div>
          )}

          {/* Ambient Edge Reflections */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
        </div>
      </div>

      {/* Upload Action */}
      <div className="flex items-center justify-between p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs">
        <div>
          <span className="font-semibold text-stone-800 block">Translight Backlit Image</span>
          <span className="text-[11px] text-stone-500">{size} · 5mm Archival Acrylic Sheet</span>
        </div>
        <label className="cursor-pointer text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#29251F] text-amber-100 hover:bg-stone-800 flex items-center gap-1.5">
          <Upload size={13} /> {photoUrl ? "Change Image" : "Upload Image"}
          <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handlePhotoUpload} />
        </label>
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
