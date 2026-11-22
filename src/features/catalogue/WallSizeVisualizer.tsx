import { useState } from "react";
import { Maximize2, Sparkles, Check, ArrowRight } from "lucide-react";

interface WallSize {
  id: string;
  label: string;
  metric: string;
  widthInches: number;
  heightInches: number;
  widthScalePercent: number; // proportional percentage of wall space
  viewingDistance: string;
  bestFor: string;
  popular?: boolean;
}

const WALL_SIZES: WallSize[] = [
  {
    id: "8x12",
    label: "8×12 in",
    metric: "20×30 cm",
    widthInches: 8,
    heightInches: 12,
    widthScalePercent: 12,
    viewingDistance: "1.5 – 3 feet",
    bestFor: "Desk, side console table, bedside corner",
  },
  {
    id: "10x14",
    label: "10×14 in",
    metric: "25×35 cm",
    widthInches: 10,
    heightInches: 14,
    widthScalePercent: 15,
    viewingDistance: "2 – 4 feet",
    bestFor: "Study nook, entryway, bedroom side wall",
  },
  {
    id: "12x18",
    label: "12×18 in",
    metric: "30×45 cm",
    widthInches: 12,
    heightInches: 18,
    widthScalePercent: 19,
    viewingDistance: "3 – 6 feet",
    bestFor: "Living room accent wall, couple bedroom portrait",
    popular: true,
  },
  {
    id: "16x24",
    label: "16×24 in",
    metric: "40×60 cm",
    widthInches: 16,
    heightInches: 24,
    widthScalePercent: 25,
    viewingDistance: "4 – 8 feet",
    bestFor: "Above 2-seater sofa, main hallway, family collage",
  },
  {
    id: "20x30",
    label: "20×30 in",
    metric: "50×75 cm",
    widthInches: 20,
    heightInches: 30,
    widthScalePercent: 32,
    viewingDistance: "6 – 12 feet",
    bestFor: "Statement wall above 3-seater sofa or dining table",
    popular: true,
  },
];

interface WallSizeVisualizerProps {
  onSelectSize?: (sizeLabel: string) => void;
  sampleImageUrl?: string;
}

export function WallSizeVisualizer({
  onSelectSize,
  sampleImageUrl = "/products/frame-sample-wedding.jpg",
}: WallSizeVisualizerProps) {
  const [activeSize, setActiveSize] = useState<WallSize>(WALL_SIZES[2]); // default 12x18
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");

  const aspectRatio =
    orientation === "portrait"
      ? `${activeSize.widthInches} / ${activeSize.heightInches}`
      : `${activeSize.heightInches} / ${activeSize.widthInches}`;

  const widthStyle =
    orientation === "portrait"
      ? `${activeSize.widthScalePercent}%`
      : `${activeSize.widthScalePercent * (activeSize.heightInches / activeSize.widthInches)}%`;

  return (
    <div className="bg-[#FAF7F1] border border-amber-900/15 rounded-3xl p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <p className="ed-kicker flex items-center gap-1.5 text-amber-900 font-semibold text-xs tracking-wider uppercase">
            <Maximize2 size={14} className="text-amber-700" /> Wall Size Comparison Guide
          </p>
          <h2 className="text-2xl sm:text-3xl font-display text-stone-900 mt-1">
            See how each size fits on your wall.
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-xl leading-relaxed">
            Scaled proportionately above a standard 7-foot living room sofa so you can choose with confidence.
          </p>
        </div>

        {/* Orientation Toggle */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 self-start sm:self-auto text-xs">
          <button
            type="button"
            onClick={() => setOrientation("portrait")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
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
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              orientation === "landscape"
                ? "bg-white text-stone-900 shadow-2xs font-bold"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            Landscape
          </button>
        </div>
      </div>

      {/* Size Selection Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
        {WALL_SIZES.map((sz) => {
          const isSelected = activeSize.id === sz.id;
          return (
            <button
              key={sz.id}
              type="button"
              onClick={() => {
                setActiveSize(sz);
                onSelectSize?.(sz.label);
              }}
              className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center relative ${
                isSelected
                  ? "bg-[#29251F] text-amber-100 border-[#29251F] shadow-sm font-bold"
                  : "bg-white text-stone-700 border-stone-200 hover:border-amber-700 hover:bg-stone-50"
              }`}
            >
              {sz.popular && (
                <span
                  className={`text-[9px] uppercase tracking-wider font-bold mb-0.5 ${
                    isSelected ? "text-amber-400" : "text-amber-800"
                  }`}
                >
                  Most Popular
                </span>
              )}
              <span className="text-sm font-bold">{sz.label}</span>
              <span className={`text-[10px] mt-0.5 ${isSelected ? "text-amber-200" : "text-stone-400"}`}>
                {sz.metric}
              </span>
            </button>
          );
        })}
      </div>

      {/* Realistic Living Room Stage */}
      <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] max-h-[420px] rounded-2xl overflow-hidden bg-gradient-to-b from-[#EFEAE2] to-[#DFD7CB] border border-stone-300 shadow-inner flex flex-col justify-between items-center p-4 sm:p-6">
        {/* Subtle Ambient Wall Texture & Spotlighting */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.6)_0%,transparent_70%)] pointer-events-none" />

        {/* Proportional Framed Artwork on Wall */}
        <div className="relative z-10 w-full flex-1 flex items-center justify-center pb-8 sm:pb-12">
          <div
            style={{
              width: widthStyle,
              aspectRatio: aspectRatio,
              maxWidth: "85%",
              transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            className="relative bg-white border-[6px] sm:border-[10px] border-[#3B2B20] shadow-[0_16px_40px_rgba(30,15,5,0.35),0_2px_8px_rgba(0,0,0,0.15)] rounded-xs overflow-hidden"
          >
            <img
              src={sampleImageUrl}
              alt="Sample artwork preview on wall"
              className="size-full object-cover"
            />
            {/* Inner mount matting */}
            <div className="absolute inset-0 border-[4px] sm:border-[8px] border-amber-50/90 pointer-events-none shadow-inner" />
            {/* Subtle glass reflection overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Scaled Sofa Mockup at Bottom */}
        <div className="relative z-10 w-[78%] sm:w-[65%] max-w-[620px] flex flex-col items-center pointer-events-none">
          {/* Sofa Backrest */}
          <div className="w-full h-10 sm:h-14 bg-[#4A433B] rounded-t-2xl shadow-md border-t border-stone-500/30 flex items-center justify-around px-4">
            <div className="w-1/3 h-full border-r border-stone-700/30" />
            <div className="w-1/3 h-full border-r border-stone-700/30" />
          </div>
          {/* Sofa Base Cushion */}
          <div className="w-full h-6 sm:h-8 bg-[#3D372F] rounded-b-lg shadow-lg flex items-center justify-center">
            <span className="text-[10px] sm:text-xs text-stone-400 font-medium tracking-widest uppercase opacity-80">
              Standard 3-Seater Sofa (7 ft / 210 cm)
            </span>
          </div>
        </div>
      </div>

      {/* Selected Size Recommendations Details */}
      <div className="mt-5 p-4 rounded-xl bg-white border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-stone-900 text-base">
              {activeSize.label} ({activeSize.metric})
            </span>
            <span className="text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-semibold">
              Viewing distance: {activeSize.viewingDistance}
            </span>
          </div>
          <p className="text-xs text-stone-600">
            <strong className="text-stone-800">Best placed:</strong> {activeSize.bestFor}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onSelectSize?.(activeSize.label)}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 bg-[#29251F] text-amber-100 text-xs font-semibold px-4 py-2 rounded-xl hover:bg-stone-900 transition-colors shadow-2xs"
        >
          Choose this size <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}
