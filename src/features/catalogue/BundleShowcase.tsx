import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Sparkles,
  ShoppingBag,
  MessageCircle,
  ArrowRight,
  Check,
  Tag,
  ShieldCheck,
  Heart,
} from "lucide-react";
import { CURATED_BUNDLES, type GiftBundle } from "./bundles";
import { useQuote, type QuoteLine } from "./store";
import { whatsappLink } from "@/lib/site";
import { trackEvent } from "@/lib/analytics";
import { toast } from "sonner";

export function BundleShowcase() {
  const [selectedBundleId, setSelectedBundleId] = useState<string>(CURATED_BUNDLES[0].id);
  const [, setQuote] = useQuote();

  const activeBundle = CURATED_BUNDLES.find((b) => b.id === selectedBundleId) || CURATED_BUNDLES[0];

  const handleAddBundleToBag = (bundle: GiftBundle) => {
    const lines: QuoteLine[] = bundle.items.map((item, idx) => ({
      productId: item.id,
      variantId: `${item.id}-bundle-${bundle.id}`,
      quantity: 1,
      personalisation: `Curated Bundle: ${bundle.name} (Piece ${idx + 1}/${bundle.items.length})`,
      packaging: "Premium Studio Gift Box",
      orderType: "Finished",
    }));

    setQuote((prev) => [...prev, ...lines]);

    trackEvent("select_bundle", {
      bundleId: bundle.id,
      price: bundle.bundlePrice,
      savings: bundle.savings,
    });

    toast.success(`'${bundle.name}' added to your bag with ₹${bundle.savings} savings!`);
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-10 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="ed-kicker flex items-center gap-1.5 text-amber-900 font-semibold text-xs tracking-wider uppercase">
            <Sparkles size={14} className="text-amber-700" /> Curated Milestone Sets
          </p>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-stone-900 mt-1">
            Complete Gift Bundles
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-1 leading-relaxed">
            Thoughtfully paired keepsakes that celebrate the occasion from morning tea to living room wall.
          </p>
        </div>

        {/* Bundle Selector Tabs */}
        <div className="flex flex-wrap gap-2">
          {CURATED_BUNDLES.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => {
                setSelectedBundleId(b.id);
                trackEvent("view_item", { itemId: b.id, itemName: b.name, price: b.bundlePrice });
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedBundleId === b.id
                  ? "bg-[#29251F] text-amber-100 shadow-xs"
                  : "bg-[#FAF7F1] text-stone-700 hover:bg-stone-100 border border-stone-200"
              }`}
            >
              {b.name.split(" ")[0]} ({b.badge})
            </button>
          ))}
        </div>
      </div>

      {/* Active Bundle Spotlight */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#FAF7F1] rounded-3xl p-6 sm:p-8 border border-stone-200/80">
        {/* Left Column: Image Mosaic */}
        <div className="lg:col-span-5 space-y-3">
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-white border border-stone-200 shadow-sm">
            <img
              src={activeBundle.heroImage}
              alt={activeBundle.name}
              className="size-full object-cover"
            />
            <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-900 text-white shadow-xs">
              {activeBundle.badge}
            </span>
          </div>

          {/* Component Mini Strip */}
          <div className="grid grid-cols-3 gap-2">
            {activeBundle.items.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl p-2 border border-stone-200 text-center flex flex-col items-center"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="size-10 rounded-lg object-cover mb-1"
                />
                <span className="text-[10px] font-bold text-stone-900 line-clamp-1">{item.name}</span>
                <span className="text-[9px] text-stone-400 font-mono">₹{item.individualPrice}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Narrative, Pricing & Direct Action */}
        <div className="lg:col-span-7 space-y-4">
          <div>
            <span className="text-[10px] font-mono font-bold text-amber-900 uppercase tracking-widest block mb-1">
              CURATED MILESTONE BUNDLE
            </span>
            <h3 className="font-display font-bold text-stone-950 text-2xl sm:text-3xl">
              {activeBundle.name}
            </h3>
            <p className="text-xs font-semibold text-amber-900 mt-1">{activeBundle.tagline}</p>
            <p className="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed">
              {activeBundle.emotionalStory}
            </p>
          </div>

          {/* Included Items Checklist */}
          <div className="p-4 bg-white rounded-2xl border border-stone-200 space-y-2">
            <span className="text-xs font-bold text-stone-900 block">Everything Included in this Set:</span>
            <ul className="space-y-1.5 text-xs text-stone-700">
              {activeBundle.items.map((item, idx) => (
                <li key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-700 shrink-0" />
                    <span>
                      <strong className="text-stone-900">{item.name}</strong> ({item.spec})
                    </span>
                  </div>
                  <span className="text-stone-400 font-mono text-[11px] line-through">
                    ₹{item.individualPrice}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pricing Box */}
          <div className="p-4 bg-white rounded-2xl border border-stone-300 flex items-center justify-between shadow-2xs">
            <div>
              <span className="text-xs text-stone-500 block">Complete Set Price:</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-display font-bold text-stone-950">
                  ₹{activeBundle.bundlePrice}
                </span>
                <span className="text-sm font-mono text-stone-400 line-through">
                  ₹{activeBundle.originalPrice}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full inline-block">
                You Save ₹{activeBundle.savings}
              </span>
              <span className="text-[10px] text-stone-500 block mt-1">Free Jetpur Pickup / Delivery</span>
            </div>
          </div>

          {/* CTA Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleAddBundleToBag(activeBundle)}
              className="flex-1 py-3.5 px-6 rounded-2xl bg-[#29251F] hover:bg-stone-900 text-amber-100 font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-colors"
            >
              <ShoppingBag size={15} />
              <span>Add Complete Bundle to Bag (₹{activeBundle.bundlePrice})</span>
            </button>
            <a
              href={whatsappLink(activeBundle.whatsAppMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3.5 px-5 rounded-2xl bg-[#25D366] text-white hover:bg-[#20b858] font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
            >
              <MessageCircle size={16} />
              <span>Order on WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
