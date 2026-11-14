import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, SunMedium, Flame, Check, ArrowRight, MessageCircle, ShoppingBag, Eye, Info } from "lucide-react";
import { REGIONAL_DEITIES, type RegionalDeity } from "./devotionalData";
import { SITE, whatsappLink } from "@/lib/site";
import { toast } from "sonner";
import { useQuote } from "./store";

export function DevotionalLanding({ selectedDeitySlug }: { selectedDeitySlug?: string }) {
  const [, setQuote] = useQuote();
  const initialDeity =
    REGIONAL_DEITIES.find((d) => d.slug === selectedDeitySlug) || REGIONAL_DEITIES[0];

  const [activeDeity, setActiveDeity] = useState<RegionalDeity>(initialDeity);
  const [selectedFormat, setSelectedFormat] = useState<"acrylic" | "frame" | "translight" | "bitu">("acrylic");
  const [selectedSize, setSelectedSize] = useState<string>("12×18 in");
  const [isLightOn, setIsLightOn] = useState(true);

  const formatLabels: Record<"acrylic" | "frame" | "translight" | "bitu", string> = {
    acrylic: "Cast Optical Acrylic",
    frame: "Teak Finish Wooden Frame",
    translight: "Backlit LED Translight",
    bitu: "Bitu Acrylic Mandir Plaque",
  };

  const getFormatPrice = (): number => {
    if (selectedFormat === "translight") {
      return selectedSize.includes("16×24") ? 2850 : 1950;
    }
    if (selectedFormat === "acrylic") {
      return selectedSize.includes("16×24") ? 2450 : selectedSize.includes("12×18") ? 1450 : 950;
    }
    if (selectedFormat === "bitu") {
      return selectedSize.includes("12×18") ? 1650 : 1150;
    }
    return selectedSize.includes("16×24") ? 1650 : selectedSize.includes("12×18") ? 1250 : 850;
  };

  const currentPrice = getFormatPrice();

  const handleDeityChange = (d: RegionalDeity) => {
    setActiveDeity(d);
    if (!d.availableFormats.includes(selectedFormat)) {
      setSelectedFormat(d.availableFormats[0]);
    }
    const availableSizes = d.sizes[selectedFormat] || ["12×18 in"];
    setSelectedSize(availableSizes[0]);
  };

  const handleFormatChange = (fmt: "acrylic" | "frame" | "translight" | "bitu") => {
    setSelectedFormat(fmt);
    const availableSizes = activeDeity.sizes[fmt] || ["12×18 in"];
    if (!availableSizes.includes(selectedSize)) {
      setSelectedSize(availableSizes[0]);
    }
  };

  const whatsappOrderUrl = whatsappLink(
    `Namaste ${SITE.name}! 🪔 I would like to order a sacred Devotional Swaroop:
Deity: ${activeDeity.nameGu} (${activeDeity.nameEn})
Dham: ${activeDeity.dham}
Format: ${formatLabels[selectedFormat]}
Size: ${selectedSize}
Price: ₹${currentPrice}
Could you please confirm the crafting timing and studio collection or delivery? Thank you!`,
  );

  const handleAddToBag = () => {
    setQuote((prev) => [
      ...prev,
      {
        productId: `GOD-${activeDeity.slug.toUpperCase()}`,
        variantId: `${selectedFormat}-${selectedSize.replace(/\s+/g, "")}`,
        quantity: 1,
        personalisation: `${activeDeity.nameEn} · ${formatLabels[selectedFormat]}`,
        packaging: "Sacred Gift Box",
        orderType: "Finished",
      },
    ]);
    toast.success(`Added ${activeDeity.nameGu} to your bag.`);
  };

  return (
    <div className="bg-[#FCF9F3] text-stone-900 min-h-dvh">
      {/* Devotional Hero Header */}
      <section className="ed-wrap pt-10 pb-8 text-center max-w-4xl mx-auto">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-100/80 text-amber-900 border border-amber-800/20 mb-3 tracking-wider uppercase">
          <Flame size={13} className="text-amber-700" /> પવિત્ર દેવ દર્શન સંગ્રહ · Sacred Devotional Sanctum
        </span>
        <h1 className="font-display text-4xl sm:text-5xl text-stone-950 font-bold leading-tight">
          Cherished sacred images for your home & mandir.
        </h1>
        <p className="text-stone-600 text-sm sm:text-base mt-3 max-w-2xl mx-auto leading-relaxed">
          Crafted with deep reverence in Jetpur. Consecrated Gujarati deities rendered across cast optical acrylic, gold and teak wooden frames, and illuminated LED translights.
        </p>
      </section>

      {/* Main Interactive Sanctum Display */}
      <section className="ed-wrap my-6">
        <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-10 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Interactive Preview Frame / Light Switch (7 cols) */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-b from-[#FAF6EE] to-[#EFE8DA] border border-stone-200">
            {/* Aspect Ratio Preview */}
            <div
              style={{ aspectRatio: "2 / 3" }}
              className={`relative w-full max-w-[340px] rounded-xs overflow-hidden transition-all duration-700 shadow-2xl flex items-center justify-center ${
                selectedFormat === "acrylic"
                  ? "border-4 border-white/90 shadow-[0_20px_50px_rgba(0,0,0,0.3)] ring-1 ring-black/10"
                  : selectedFormat === "frame"
                  ? "border-[16px] border-[#4A321E] shadow-[inset_0_0_15px_rgba(0,0,0,0.8),0_25px_60px_rgba(40,20,10,0.4)]"
                  : selectedFormat === "bitu"
                  ? "border-[10px] border-[#2A1E14] ring-2 ring-amber-400/50 shadow-xl"
                  : `border-[14px] border-[#0A0908] ${
                      isLightOn
                        ? "shadow-[0_0_80px_rgba(255,200,80,0.5),inset_0_0_20px_rgba(255,230,150,0.4)]"
                        : "shadow-[inset_0_0_25px_rgba(0,0,0,0.95)]"
                    }`
              }`}
            >
              <img
                src={activeDeity.imageUrl}
                alt={activeDeity.nameEn}
                className={`size-full object-cover transition-all duration-700 ${
                  selectedFormat === "translight" && !isLightOn
                    ? "brightness-50 contrast-90"
                    : "brightness-105 contrast-105"
                }`}
              />

              {/* Translight Golden Radiance */}
              {selectedFormat === "translight" && isLightOn && (
                <div className="absolute inset-0 bg-gradient-to-t from-amber-400/30 via-transparent to-amber-200/25 pointer-events-none mix-blend-screen" />
              )}

              {/* Mantra Plaque Overlay */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 text-center pointer-events-none">
                <span className="text-amber-300 font-bold text-xs sm:text-sm block tracking-wide">
                  {activeDeity.nameGu}
                </span>
                <span className="text-white/80 text-[10px] sm:text-xs block mt-0.5 font-medium">
                  {activeDeity.mantra}
                </span>
              </div>
            </div>

            {/* Translight Toggle Button */}
            {selectedFormat === "translight" && (
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsLightOn(!isLightOn)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm ${
                    isLightOn
                      ? "bg-amber-400 text-stone-950 shadow-amber-300/40"
                      : "bg-stone-800 text-stone-300"
                  }`}
                >
                  <SunMedium size={14} />
                  {isLightOn ? "Light ON (Sanctum Glow)" : "Light OFF (Daylight View)"}
                </button>
              </div>
            )}
          </div>

          {/* Right: Customization Controls (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <span className="text-[11px] font-bold text-amber-900 tracking-wider uppercase block">
                {activeDeity.dham}
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 mt-0.5">
                {activeDeity.nameEn}
              </h2>
              <p className="text-stone-600 text-xs sm:text-sm mt-2 leading-relaxed">
                {activeDeity.description}
              </p>
            </div>

            {/* Format Selector */}
            <div>
              <label className="text-xs font-bold text-stone-700 block uppercase tracking-wider mb-2">
                1. Select Sacred Material Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                {activeDeity.availableFormats.map((fmt) => {
                  const isSelected = selectedFormat === fmt;
                  return (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => handleFormatChange(fmt)}
                      className={`p-2.5 rounded-xl border text-left transition-all text-xs ${
                        isSelected
                          ? "bg-[#29251F] text-amber-100 border-[#29251F] shadow-sm font-bold"
                          : "bg-white text-stone-700 border-stone-200 hover:border-amber-700 hover:bg-stone-50"
                      }`}
                    >
                      <span className="block font-bold">{formatLabels[fmt]}</span>
                      <span className={`text-[10px] block mt-0.5 ${isSelected ? "text-amber-300" : "text-stone-400"}`}>
                        {fmt === "translight" ? "Illuminated LED" : fmt === "acrylic" ? "Depth & Clarity" : "Heritage Wood"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Size Selector */}
            <div>
              <label className="text-xs font-bold text-stone-700 block uppercase tracking-wider mb-2">
                2. Select Dimensions
              </label>
              <div className="flex flex-wrap gap-2">
                {(activeDeity.sizes[selectedFormat] || ["12×18 in"]).map((sz) => {
                  const isSelected = selectedSize === sz;
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                        isSelected
                          ? "bg-amber-100 text-amber-950 border-amber-800 shadow-2xs"
                          : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price & Primary Buy Actions */}
            <div className="pt-4 border-t border-stone-200 flex flex-col gap-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-stone-500 font-medium">Owner-set Studio Price:</span>
                <span className="font-display font-bold text-3xl text-stone-900">
                  ₹{currentPrice.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleAddToBag}
                  className="flex-1 bg-[#29251F] text-amber-100 font-bold text-xs py-3 rounded-xl hover:bg-stone-900 transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <ShoppingBag size={15} /> Add to Bag · ₹{currentPrice}
                </button>

                <a
                  href={whatsappOrderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-[#25D366] text-white font-bold text-xs py-3 rounded-xl hover:bg-[#20b858] transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <MessageCircle size={16} /> Order on WhatsApp
                </a>
              </div>
              <p className="text-[11px] text-stone-500 text-center">
                Studio collection in Jetpur or home delivery across Saurashtra. Fully packed in protective thermocol & rigid wooden crate.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Grid of All 10 Consecrated Deities */}
      <section className="ed-wrap my-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display text-2xl font-bold text-stone-900">
              Explore All Consecrated Regional Swaroops
            </h3>
            <p className="text-stone-600 text-xs mt-0.5">
              Select any deity swaroop to preview across frame finishes and sizes.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {REGIONAL_DEITIES.map((d) => {
            const isSelected = activeDeity.id === d.id;
            return (
              <div
                key={d.id}
                onClick={() => handleDeityChange(d)}
                className={`cursor-pointer rounded-2xl bg-white border p-3.5 transition-all flex flex-col justify-between ${
                  isSelected
                    ? "border-amber-800 ring-2 ring-amber-800/20 shadow-md"
                    : "border-stone-200 hover:border-amber-700 hover:shadow-sm"
                }`}
              >
                <div>
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-stone-950 mb-3">
                    <img
                      src={d.imageUrl}
                      alt={d.nameEn}
                      className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 left-2 bg-stone-900/80 backdrop-blur-xs text-amber-300 text-[9px] font-bold px-2 py-0.5 rounded-full">
                      {d.dham.split("·")[0]}
                    </div>
                  </div>
                  <span className="text-[10px] text-amber-900 font-bold block">{d.nameGu}</span>
                  <h4 className="font-display font-bold text-stone-900 text-xs mt-0.5 line-clamp-1">
                    {d.nameEn}
                  </h4>
                </div>

                <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-stone-900">
                    From ₹{d.startingPrice}
                  </span>
                  <span className="text-[11px] font-semibold text-amber-800 flex items-center gap-0.5">
                    Select <ArrowRight size={11} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
