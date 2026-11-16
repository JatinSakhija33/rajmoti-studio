import React, { useState, useEffect } from "react";
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
  Gift,
  Package,
  MapPin,
} from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { SITE, whatsappLink } from "@/lib/site";
import { calculateVariantPriceInr } from "@/lib/pricing";
import { PhotoPersonalizer } from "./PhotoPersonalizer";
import { WallSizeVisualizer } from "./WallSizeVisualizer";
import { useQuote, type QuoteLine } from "./store";
import { trackEvent } from "@/lib/analytics";
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

interface GiftAddon {
  id: string;
  label: string;
  desc: string;
  price: number;
}

const GIFT_ADDONS: GiftAddon[] = [
  {
    id: "gift_box",
    label: "Handcrafted Studio Gift Box & Satin Ribbon",
    desc: "Rigid keepsake box, protective tissue, and gold-foiled seal",
    price: 49,
  },
  {
    id: "message_card",
    label: "Personalized Wax-Sealed Message Card",
    desc: "Heavy 300 GSM textured card with your printed handwritten-style note",
    price: 29,
  },
  {
    id: "matching_keychain",
    label: "Matching Double-Sided Pocket Keychain",
    desc: "Miniature keepsake crafted from the same chosen photograph",
    price: 149,
  },
];

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
  const [selectedSize, setSelectedSize] = useState(
    sizes[0] || { id: "12x18", label: "12×18 in", metric: "30×45 cm", widthInches: 12, heightInches: 18 },
  );
  const [selectedFinish, setSelectedFinish] = useState(
    finishes[0] || { id: "teak", label: "Natural Teak Finish", desc: "Hand-finished warm timber border" },
  );
  const [designPath, setDesignPath] = useState<"self" | "rajmoti">("self");
  const [activeImageKey, setActiveImageKey] = useState<"primary" | "angle" | "room" | "detail">("primary");
  const [showPersonalizer, setShowPersonalizer] = useState<boolean>(false);
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string>("");
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [destination, setDestination] = useState<"jetpur" | "saurashtra" | "gujarat">("jetpur");
  const [, setQuote] = useQuote();
  const navigate = useNavigate();

  // Track initial product view
  useEffect(() => {
    trackEvent("view_item", {
      itemId: productId,
      itemName: name,
      category,
      price: basePrice,
    });
  }, [productId, name, category, basePrice]);

  // Dynamic calculated price
  const baseCalculatedPrice =
    calculateVariantPriceInr(productId, selectedSize.label, selectedFinish.id) || basePrice;

  // Add selected addons cost
  const addonsTotal = selectedAddons.reduce((sum, aId) => {
    const addon = GIFT_ADDONS.find((a) => a.id === aId);
    return sum + (addon ? addon.price : 0);
  }, 0);

  const price = baseCalculatedPrice + addonsTotal;
  const mrp = Math.round(price * 1.3);

  // Active displayed image
  const displayImage = images[activeImageKey] || images.primary;

  const toggleAddon = (addonId: string) => {
    setSelectedAddons((prev) => {
      const exists = prev.includes(addonId);
      const next = exists ? prev.filter((id) => id !== addonId) : [...prev, addonId];
      trackEvent("select_gift_addon", {
        itemId: productId,
        addonType: addonId,
        selected: !exists,
      });
      return next;
    });
  };

  // Add to Bag action
  const handleAddToBag = () => {
    const packagingDesc = selectedAddons.includes("gift_box")
      ? "Premium Studio Gift Box"
      : "Standard Archival Box";

    const line: QuoteLine = {
      productId,
      variantId: `${productId}-${selectedSize.id}-${selectedFinish.id}${
        selectedAddons.length ? `+${selectedAddons.join(",")}` : ""
      }`,
      quantity: 1,
      personalisation:
        designPath === "self" ? "Customer Formatted Photo" : "Studio Designer Proofing",
      packaging: packagingDesc,
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

    trackEvent("add_to_cart", {
      itemId: productId,
      itemName: name,
      price,
      quantity: 1,
      variant: `${selectedSize.label} · ${selectedFinish.label}`,
    });

    toast.success(`${name} added to your bag!`);
  };

  // Buy Now action
  const handleBuyNow = () => {
    handleAddToBag();
    trackEvent("begin_checkout", {
      itemId: productId,
      price,
    });
    navigate({ to: "/products", search: { checkout: "open" } });
  };

  // Estimated delivery helper
  const getDeliveryEstimate = () => {
    if (destination === "jetpur") {
      return "Ready for Studio Pickup in 2–4 hours (or next-day morning delivery)";
    }
    if (destination === "saurashtra") {
      return "Estimated delivery within 1–2 business days (Rajkot, Gondal, Junagadh)";
    }
    return "Estimated delivery within 2–3 business days across Gujarat";
  };

  return (
    <div className="editorial bg-[#FCFAF6] min-h-screen text-stone-900">
      <SiteNav />

      <main className="ed-wrap py-8 sm:py-12">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-stone-500 mb-6 font-mono">
          <Link to="/" className="hover:text-stone-900">
            Home
          </Link>
          <ChevronRight size={12} />
          <Link to="/products" className="hover:text-stone-900">
            Products
          </Link>
          <ChevronRight size={12} />
          <Link to={`/products/${category}`} className="hover:text-stone-900 capitalize">
            {categoryLabel}
          </Link>
          <ChevronRight size={12} />
          <span className="text-stone-900 font-bold truncate max-w-[200px]">{name}</span>
        </nav>

        {/* Primary 2-Column Product Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* LEFT: Gallery & Visualizers (60% Desktop) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Main Stage Display */}
            <div className="relative aspect-[4/3] sm:aspect-[16/11] bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
              <img
                src={displayImage}
                alt={`${name} by Rajmoti Studio`}
                className="size-full object-cover"
              />

              {/* Status Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#29251F]/90 text-amber-100 backdrop-blur-xs shadow-xs">
                  {selectedSize.label} · {selectedFinish.label}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-200 backdrop-blur-xs">
                  Handcrafted in Jetpur
                </span>
              </div>

              {/* Live Studio Trigger Button */}
              {onOpenStudio && (
                <button
                  type="button"
                  onClick={() => {
                    trackEvent("start_personalization", { itemId: productId, itemName: name });
                    onOpenStudio();
                  }}
                  className="absolute bottom-4 right-4 py-2 px-3.5 rounded-xl bg-white/95 text-stone-900 hover:bg-white text-xs font-bold shadow-md flex items-center gap-1.5 border border-stone-200 transition-all hover:scale-102"
                >
                  <Sparkles size={14} className="text-amber-700" />
                  <span>Open Live Studio</span>
                </button>
              )}
            </div>

            {/* Thumbnail Navigation Strip */}
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
              {[
                { key: "primary", label: "Front View", src: images.primary },
                ...(images.angle ? [{ key: "angle", label: "Angle & Texture", src: images.angle }] : []),
                ...(images.room ? [{ key: "room", label: "In Living Room", src: images.room }] : []),
                ...(images.detail ? [{ key: "detail", label: "Craft Detail", src: images.detail }] : []),
              ].map((thumb) => (
                <button
                  key={thumb.key}
                  type="button"
                  onClick={() => setActiveImageKey(thumb.key as any)}
                  className={`relative size-18 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                    activeImageKey === thumb.key
                      ? "border-amber-800 ring-2 ring-amber-800/20"
                      : "border-stone-200 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={thumb.src} alt={thumb.label} className="size-full object-cover" />
                  <span className="sr-only">{thumb.label}</span>
                </button>
              ))}
            </div>

            {/* In-Browser Photo Personalizer Toggle Drawer */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  const next = !showPersonalizer;
                  setShowPersonalizer(next);
                  if (next) trackEvent("start_personalization", { itemId: productId, itemName: name });
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-800 flex items-center justify-between shadow-2xs transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Sliders size={14} className="text-amber-800" />
                  <span>
                    {showPersonalizer
                      ? "Hide In-Browser Photo Personalizer"
                      : "Fit & Preview Your Photo (Instant In-Browser Test)"}
                  </span>
                </div>
                <span className="text-[11px] text-amber-800 font-bold">
                  {showPersonalizer ? "Collapse ▲" : "Try Your Photo ▼"}
                </span>
              </button>

              {showPersonalizer && (
                <div className="mt-3 p-4 bg-white rounded-2xl border border-stone-300 shadow-sm animate-in fade-in-50 duration-200">
                  <PhotoPersonalizer
                    targetWidthInches={selectedSize.widthInches}
                    targetHeightInches={selectedSize.heightInches}
                    onPhotoConfirmed={(url) => {
                      setCustomPhotoUrl(url);
                      trackEvent("complete_personalization", { itemId: productId, itemName: name });
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Product Specs, Personalization, Add-ons & Purchasing (40% Desktop) */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                  {categoryLabel} Keepsake
                </span>
                <span className="text-xs text-stone-500 font-mono">SKU: {productId.toUpperCase()}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-display font-bold text-stone-900 leading-tight">
                {name}
              </h1>
              <p className="text-sm text-stone-600 mt-2 leading-relaxed">{description}</p>
            </div>

            {/* Pricing Section */}
            <div className="p-4 bg-[#FAF7F1] rounded-2xl border border-stone-300 flex items-baseline justify-between shadow-2xs">
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
                Includes archival print,
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
                          <div
                            className={`mt-0.5 size-4 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected ? "border-amber-800 bg-amber-800" : "border-stone-400"
                            }`}
                          >
                            {isSelected && <Check size={11} className="text-white" />}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-stone-900 block">{f.label}</span>
                            <span className="text-[11px] text-stone-500 block leading-tight mt-0.5">
                              {f.desc}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Gift Enhancement Add-ons (CRO & AOV Upgrade) */}
            <div className="p-4 bg-white rounded-2xl border border-stone-300 space-y-3">
              <div className="flex items-center gap-1.5">
                <Gift size={15} className="text-amber-800" />
                <label className="text-xs font-bold text-stone-900">
                  Make it a Gift (Optional Enhancements):
                </label>
              </div>

              <div className="space-y-2">
                {GIFT_ADDONS.map((addon) => {
                  const isChecked = selectedAddons.includes(addon.id);
                  return (
                    <div
                      key={addon.id}
                      onClick={() => toggleAddon(addon.id)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between ${
                        isChecked
                          ? "bg-amber-50/70 border-amber-700/60 ring-1 ring-amber-700/20"
                          : "bg-stone-50/60 border-stone-200 hover:bg-stone-100/70"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`mt-0.5 size-4 rounded border flex items-center justify-center shrink-0 ${
                            isChecked ? "bg-amber-900 border-amber-900 text-white" : "border-stone-400 bg-white"
                          }`}
                        >
                          {isChecked && <Check size={11} />}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-stone-900 block">{addon.label}</span>
                          <span className="text-[10px] text-stone-500 block">{addon.desc}</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-stone-900 shrink-0 font-mono">
                        +₹{addon.price}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Design Path Choice */}
            <div>
              <label className="text-xs font-bold text-stone-900 block mb-2">
                Design & Proofing Method:
              </label>
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

            {/* Location & Estimated Delivery Checker */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-800 flex items-center gap-1.5">
                  <MapPin size={13} className="text-amber-800" /> Fulfilment Timeline:
                </span>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value as any)}
                  className="text-xs border border-stone-300 rounded-lg px-2 py-1 bg-white font-medium text-stone-700"
                >
                  <option value="jetpur">Jetpur (Local Pickup / Delivery)</option>
                  <option value="saurashtra">Rajkot / Junagadh / Saurashtra</option>
                  <option value="gujarat">Rest of Gujarat</option>
                </select>
              </div>
              <p className="text-[11px] text-emerald-800 font-medium flex items-center gap-1">
                <Clock size={12} /> {getDeliveryEstimate()}
              </p>
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
                  <span className="text-[11px] text-stone-500">
                    100% online prepayment via UPI. Dispatched with safe cushioning.
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck size={15} className="text-amber-800 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-stone-900 block">Collect at Studio</strong>
                  <span className="text-[11px] text-stone-500">
                    Ready in Jetpur. Pay online or pay cash/UPI at counter.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Long Description & Detailed Specifications */}
        {longDescription && (
          <section className="my-12 p-6 sm:p-10 bg-white rounded-3xl border border-stone-200">
            <h3 className="font-display text-2xl font-bold text-stone-900 mb-4">
              Craftsmanship & Emotional Provenance
            </h3>
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

        {/* Complementary Products Suggestions (Cross-Sell Engine) */}
        {complementaryProducts.length > 0 && (
          <section className="my-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="ed-kicker">Curated Pairings</p>
                <h3 className="text-2xl font-display font-bold text-stone-900">
                  Complementary Keepsakes
                </h3>
              </div>
              <span className="text-xs text-stone-500">Frequently ordered together by Saurashtra families</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {complementaryProducts.map((p) => (
                <Link
                  key={p.id}
                  to={p.link}
                  className="group bg-white rounded-2xl border border-stone-200 p-4 hover:border-amber-800 hover:shadow-lg transition-all flex flex-col justify-between"
                >
                  <div className="aspect-[4/3] rounded-xl overflow-hidden bg-stone-100 mb-3">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="size-full object-cover group-hover:scale-104 transition-transform duration-300"
                    />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-stone-900 text-sm group-hover:text-amber-900 transition-colors">
                      {p.name}
                    </h4>
                    <span className="text-xs font-mono text-stone-500 block mt-1">₹{p.price}</span>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-amber-900">
                    <span>View Keepsake</span>
                    <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Sticky Mobile Purchase Bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 p-3 px-4 flex items-center justify-between shadow-lg">
        <div>
          <span className="text-[10px] text-stone-500 block">Total Price:</span>
          <span className="text-lg font-display font-bold text-stone-950">₹{price}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAddToBag}
            className="py-2.5 px-4 rounded-xl border border-stone-300 text-stone-800 font-bold text-xs bg-white shadow-2xs hover:bg-stone-50"
          >
            Add to Bag
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            className="py-2.5 px-5 rounded-xl bg-amber-900 text-white font-bold text-xs shadow-xs hover:bg-amber-800"
          >
            Buy Now
          </button>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
