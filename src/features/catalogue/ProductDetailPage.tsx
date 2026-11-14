import React, { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowLeft,
  ShoppingBag,
  Sparkles,
  MessageCircle,
  ShieldCheck,
  Truck,
  RotateCcw,
  Check,
  Sliders,
  ChevronRight,
  Maximize2,
  Clock,
  Heart,
  Share2,
} from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { SITE, whatsappLink } from "@/lib/site";
import { calculateVariantPriceInr } from "@/lib/pricing";
import { PhotoPersonalizer } from "./PhotoPersonalizer";
import { WallSizeVisualizer } from "./WallSizeVisualizer";
import { useQuote, type QuoteLine } from "./store";
import { toast } from "sonner";

export interface ProductDetailProps {
  productId: string;
  name: string;
  category: string;
  categoryLabel: string;
  basePrice: number;
  description: string;
  longDescription?: string;
  images: {
    primary: string;
    angle?: string;
    room?: string;
    detail?: string;
  };
  sizes: {
    id: string;
    label: string;
    metric: string;
    widthInches: number;
    heightInches: number;
    popular?: boolean;
  }[];
  finishes: {
    id: string;
    label: string;
    desc: string;
  }[];
  specifications: {
    material: string;
    printType: string;
    turnaround: string;
    origin: string;
  };
  complementaryProducts?: {
    id: string;
    name: string;
    price: number;
    image: string;
    link: string;
  }[];
  onOpenStudio?: () => void;
}

export function ProductDetailPage({
  productId,
  name,
  category,
  categoryLabel,
  basePrice,
  description,
  longDescription,
  images,
  sizes,
  finishes,
  specifications,
  complementaryProducts = [],
  onOpenStudio,
}: ProductDetailProps) {
  const [selectedSize, setSelectedSize] = useState(sizes[0] || { id: "12x18", label: "12×18 in", metric: "30×45 cm", widthInches: 12, heightInches: 18 });
  const [selectedFinish, setSelectedFinish] = useState(finishes[0] || { id: "teak", label: "Natural Teak Finish", desc: "Hand-finished warm timber border" });
  const [designPath, setDesignPath] = useState<"self" | "rajmoti">("self");
  const [activeImageKey, setActiveImageKey] = useState<"primary" | "angle" | "room" | "detail">("primary");
  const [showPersonalizer, setShowPersonalizer] = useState<boolean>(false);
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string>("");
  const [, setQuote] = useQuote();
  const navigate = useNavigate();

  // Dynamic calculated price
  const price = calculateVariantPriceInr(productId, selectedSize.label, selectedFinish.id) || basePrice;
  const mrp = Math.round(price * 1.3);

  // Active displayed image
  const displayImage = images[activeImageKey] || images.primary;

  // Add to Bag action
  const handleAddToBag = () => {
    const line: QuoteLine = {
      productId,
      variantId: `${productId}-${selectedSize.id}-${selectedFinish.id}`,
      quantity: 1,
      personalisation: designPath === "self" ? "Customer Formatted Photo" : "Studio Designer Proofing",
      packaging: "Standard Archival Box",
      orderType: "Finished",
    };

    setQuote((prev) => {
      const existing = prev.findIndex((p) => p.productId === line.productId && p.variantId === line.variantId);
      if (existing >= 0) {
        const next = [...prev];
        next[existing] = { ...next[existing], quantity: next[existing].quantity + 1 };
        return next;
      }
      return [...prev, line];
    });

    toast.success(`Added ${name} (${selectedSize.label}) to your bag`);
  };

  // Direct Buy Now / WhatsApp Checkout
  const handleBuyNow = () => {
    handleAddToBag();
    const orderText = `Namaste Rajmoti Studio! 📸 I would like to order:
*Product:* ${name}
*SKU:* ${productId}
*Size:* ${selectedSize.label} (${selectedSize.metric})
*Finish:* ${selectedFinish.label}
*Design Path:* ${designPath === "self" ? "I have my photo ready" : "Please help me design it"}
*Price:* ₹${price}

Could you please confirm the delivery schedule and guide me on sharing the high-res photo? Thank you!`;

    window.open(whatsappLink(SITE.whatsappNumber, orderText), "_blank");
  };

  return (
    <div className="editorial bg-[#FCF9F3] text-stone-900 min-h-dvh">
      <SiteNav />

      <main className="ed-wrap py-6 sm:py-10">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-xs text-stone-500 mb-6">
          <Link to="/" className="hover:text-amber-900 transition-colors">Home</Link>
          <ChevronRight size={12} className="text-stone-400" />
          <Link to="/products" className="hover:text-amber-900 transition-colors">Products</Link>
          <ChevronRight size={12} className="text-stone-400" />
          <Link to={`/products/${category}`} className="hover:text-amber-900 transition-colors capitalize">
            {categoryLabel}
          </Link>
          <ChevronRight size={12} className="text-stone-400" />
          <span className="text-stone-900 font-semibold line-clamp-1">{name}</span>
        </nav>

        {/* Primary PDP Two-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Interactive Visual Showcase & Thumbnail Strip */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="relative aspect-[4/3] sm:aspect-[1/1] max-h-[520px] bg-[#FAF7F1] rounded-3xl border border-stone-300 p-4 sm:p-8 flex items-center justify-center overflow-hidden shadow-xs">
              <img
                src={displayImage}
                alt={name}
                className="size-full object-contain drop-shadow-xl transition-all duration-300"
              />

              {/* Floating Live Studio Trigger */}
              {onOpenStudio && (
                <button
                  type="button"
                  onClick={onOpenStudio}
                  className="absolute bottom-4 right-4 bg-stone-900/90 hover:bg-stone-900 text-amber-100 text-xs font-semibold px-4 py-2 rounded-full backdrop-blur-md border border-amber-800/40 shadow-lg flex items-center gap-1.5 transition-all hover:scale-105"
                >
                  <Sparkles size={13} className="text-amber-400" />
                  <span>Open Live Studio</span>
                </button>
              )}

              {/* Same Day Badge */}
              <div className="absolute top-4 left-4 bg-amber-100/95 text-amber-950 text-[11px] font-bold px-3 py-1 rounded-full border border-amber-300/60 shadow-xs flex items-center gap-1">
                <Clock size={12} className="text-amber-700" />
                Same-Day Ready in Jetpur
              </div>
            </div>

            {/* Thumbnail Strip */}
            <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
              {[
                { key: "primary", label: "Front View", src: images.primary },
                images.angle && { key: "angle", label: "3D Perspective", src: images.angle },
                images.room && { key: "room", label: "Room Context", src: images.room },
                images.detail && { key: "detail", label: "Texture & Joinery", src: images.detail },
              ]
                .filter(Boolean)
                .map((thumb: any) => (
                  <button
                    key={thumb.key}
                    type="button"
                    onClick={() => setActiveImageKey(thumb.key)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                      activeImageKey === thumb.key
                        ? "border-[#29251F] shadow-sm scale-102"
                        : "border-stone-200 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={thumb.src} alt={thumb.label} className="size-full object-cover" />
                  </button>
                ))}
            </div>

            {/* Toggle Inline Photo Personalizer */}
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setShowPersonalizer(!showPersonalizer)}
                className="w-full py-3 px-4 rounded-2xl bg-white border border-stone-200 hover:border-amber-800 flex items-center justify-between transition-all shadow-2xs group"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-stone-900 group-hover:text-amber-900">
                  <Maximize2 size={16} className="text-amber-700" />
                  <span>{showPersonalizer ? "Hide In-Browser Photo Fitting" : "Preview With Your Own Photograph (In-Browser)"}</span>
                </div>
                <span className="text-xs font-semibold text-amber-800">{showPersonalizer ? "Collapse ▲" : "Try Preview ▼"}</span>
              </button>

              {showPersonalizer && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                  <PhotoPersonalizer
                    targetWidthInches={selectedSize.widthInches}
                    targetHeightInches={selectedSize.heightInches}
                    label={`Format Your Photo for ${selectedSize.label}`}
                    onPhotoChanged={(url) => setCustomPhotoUrl(url)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Title, Size Selector, Price, and Actions */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-800">
                  {specifications.origin} · {categoryLabel}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-display font-bold text-stone-900 leading-tight">
                {name}
              </h1>
              <p className="text-sm text-stone-600 mt-2 leading-relaxed">
                {description}
              </p>
            </div>

            {/* Pricing Section */}
            <div className="p-4 bg-[#FAF7F1] rounded-2xl border border-stone-300 flex items-baseline justify-between">
              <div>
                <span className="text-xs text-stone-500 block">All-inclusive Price:</span>
                <div className="flex items-baseline gap-2.5 mt-0.5">
                  <span className="text-3xl font-display font-bold text-stone-950">₹{price}</span>
                  <span className="text-sm font-mono text-stone-400 line-through">₹{mrp}</span>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Save ₹{mrp - price}
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-mono text-stone-500 text-right">
                Includes printing,
                <br />
                framing & GST
              </span>
            </div>

            {/* Size Selector */}
            {sizes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-stone-900">Select Physical Size:</label>
                  <span className="text-[11px] font-mono text-stone-500">
                    Selected: <strong>{selectedSize.label}</strong> ({selectedSize.metric})
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {sizes.map((sz) => {
                    const isSelected = selectedSize.id === sz.id;
                    return (
                      <button
                        key={sz.id}
                        type="button"
                        onClick={() => setSelectedSize(sz)}
                        className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? "bg-[#29251F] text-amber-100 border-[#29251F] shadow-xs"
                            : "bg-white text-stone-800 border-stone-200 hover:border-amber-700 hover:bg-stone-50"
                        }`}
                      >
                        <span className="text-xs font-bold">{sz.label}</span>
                        <span className={`text-[10px] ${isSelected ? "text-amber-300" : "text-stone-400"}`}>
                          {sz.metric}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Material / Finish Selector */}
            {finishes.length > 0 && (
              <div>
                <label className="text-xs font-bold text-stone-900 block mb-2">
                  Choose Finish & Craftsmanship:
                </label>
                <div className="space-y-2">
                  {finishes.map((f) => {
                    const isSelected = selectedFinish.id === f.id;
                    return (
                      <div
                        key={f.id}
                        onClick={() => setSelectedFinish(f)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between ${
                          isSelected
                            ? "bg-white border-amber-800 ring-1 ring-amber-800/30 shadow-xs"
                            : "bg-stone-50 border-stone-200 hover:bg-white"
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className={`mt-0.5 size-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected ? "border-amber-800 bg-amber-800" : "border-stone-400"
                          }`}>
                            {isSelected && <Check size={11} className="text-white" />}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-stone-900 block">{f.label}</span>
                            <span className="text-[11px] text-stone-500 block leading-tight mt-0.5">{f.desc}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Design Path Choice */}
            <div>
              <label className="text-xs font-bold text-stone-900 block mb-2">Design & Proofing Method:</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setDesignPath("self")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    designPath === "self"
                      ? "bg-[#29251F] text-amber-100 border-[#29251F]"
                      : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                  }`}
                >
                  <span className="font-bold block">1. I Have My Photo</span>
                  <span className="text-[10px] opacity-80 block mt-0.5">I will share directly on WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDesignPath("rajmoti")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    designPath === "rajmoti"
                      ? "bg-[#29251F] text-amber-100 border-[#29251F]"
                      : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                  }`}
                >
                  <span className="font-bold block">2. Let Rajmoti Design It</span>
                  <span className="text-[10px] opacity-80 block mt-0.5">Retouching & typography included</span>
                </button>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={handleBuyNow}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-amber-900 hover:bg-amber-800 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all hover:scale-101"
              >
                <span>Buy Now · ₹{price}</span>
                <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onClick={handleAddToBag}
                className="py-3.5 px-6 rounded-2xl bg-white border border-stone-300 text-stone-800 font-bold text-sm hover:bg-stone-50 transition-all flex items-center justify-center gap-2 shadow-2xs"
              >
                <ShoppingBag size={16} />
                <span>Add to Bag</span>
              </button>
            </div>

            {/* Quick Fulfilment Reassurance */}
            <div className="pt-4 border-t border-stone-200 grid grid-cols-2 gap-3 text-xs text-stone-600">
              <div className="flex items-start gap-2">
                <Truck size={15} className="text-amber-800 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-stone-900 block">Home Delivery</strong>
                  <span className="text-[11px] text-stone-500">100% online prepayment via UPI. Dispatched with safe cushioning.</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck size={15} className="text-amber-800 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-stone-900 block">Collect at Studio</strong>
                  <span className="text-[11px] text-stone-500">Ready in Jetpur. Pay online or pay cash/UPI at counter.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Long Description & Detailed Specifications */}
        {longDescription && (
          <section className="my-12 p-6 sm:p-10 bg-white rounded-3xl border border-stone-200">
            <h3 className="font-display text-2xl font-bold text-stone-900 mb-4">Craftsmanship & Details</h3>
            <div className="prose text-stone-600 text-sm leading-relaxed max-w-none">
              <p>{longDescription}</p>
            </div>
          </section>
        )}

        {/* Wall Size Visualizer Widget */}
        {selectedSize && (
          <section className="my-10">
            <WallSizeVisualizer
              onSelectSize={(szLabel) => {
                const found = sizes.find((s) => s.label === szLabel);
                if (found) setSelectedSize(found);
              }}
            />
          </section>
        )}

        {/* Complementary Products Suggestions */}
        {complementaryProducts.length > 0 && (
          <section className="my-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="ed-kicker">Curated Pairings</p>
                <h3 className="text-2xl font-display font-bold text-stone-900">Complementary Keepsakes</h3>
              </div>
              <span className="text-xs text-stone-500">Frequently ordered together by Saurashtra families</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {complementaryProducts.map((p) => (
                <Link
                  key={p.id}
                  to={p.link}
                  className="bg-white rounded-2xl border border-stone-200 p-3 hover:border-amber-700 hover:shadow-md transition-all group flex flex-col justify-between"
                >
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-stone-100 mb-2.5">
                    <img src={p.image} alt={p.name} className="size-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-stone-900 group-hover:text-amber-900 line-clamp-1">{p.name}</h4>
                    <span className="text-xs font-mono font-bold text-stone-700 mt-1 block">From ₹{p.price}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
