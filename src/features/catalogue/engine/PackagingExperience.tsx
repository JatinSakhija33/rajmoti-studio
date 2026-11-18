import React, { useState } from "react";
import { Package, Gift, Sparkles, Check, ShieldCheck, HeartHandshake } from "lucide-react";

interface PackagingFeature {
  id: string;
  title: string;
  desc: string;
  tag: string;
}

const SIGNATURE_FEATURES: PackagingFeature[] = [
  {
    id: "box",
    title: "Midnight Teal Rigid Box",
    desc: "1200 GSM recycled rigid board embossed with gold foil 'Rajmoti Studio · Handcrafted in Jetpur' calligraphy.",
    tag: "Archival Keepsake",
  },
  {
    id: "ribbon",
    title: "Lustrous Emerald Satin Ribbon",
    desc: "Hand-tied double-loop silk satin bow that unties smoothly without tearing the box.",
    tag: "Hand-Finished",
  },
  {
    id: "wax",
    title: "Deckle-Edged Wax-Sealed Card",
    desc: "Cotton rag paper with your personalized handwritten or printed message, sealed with deep maroon botanical wax stamp.",
    tag: "Personal Touch",
  },
  {
    id: "protection",
    title: "Corner Shock Armor & Tissue",
    desc: "Multi-layer corner guards and acid-free archival tissue to protect glass and acrylic during transit.",
    tag: "Damage-Free Promise",
  },
];

export function PackagingExperience() {
  const [activeMode, setActiveMode] = useState<"signature" | "standard">("signature");
  const [selectedFeature, setSelectedFeature] = useState<string>("box");

  return (
    <section className="ed-wrap my-14">
      <div className="bg-[#FAF7F2] border border-amber-900/15 rounded-3xl p-6 sm:p-10 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-950 mb-2">
              <Gift size={13} className="text-emerald-800" />
              Gifting Experience Unboxing
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-stone-900">
              The Unboxing Moment Matters
            </h2>
            <p className="text-sm text-stone-600 mt-1 max-w-xl">
              Whether you are sending an anniversary surprise or handing over wedding keepsakes, the presentation is as thoughtful as the photograph inside.
            </p>
          </div>

          {/* Toggle between Signature Box vs Standard Delivery */}
          <div className="inline-flex p-1 rounded-xl bg-stone-200/80 border border-stone-300 self-start">
            <button
              type="button"
              onClick={() => setActiveMode("signature")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeMode === "signature"
                  ? "bg-stone-900 text-amber-100 shadow-xs"
                  : "text-stone-700 hover:text-stone-900"
              }`}
            >
              <Sparkles size={13} className="text-amber-400" />
              Signature Hamper (+₹49)
            </button>
            <button
              type="button"
              onClick={() => setActiveMode("standard")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeMode === "standard"
                  ? "bg-white text-stone-900 shadow-xs"
                  : "text-stone-700 hover:text-stone-900"
              }`}
            >
              Standard Safe Transit
            </button>
          </div>
        </div>

        {/* Presentation Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Main Visual */}
          <div className="lg:col-span-6 relative aspect-square rounded-3xl overflow-hidden border border-stone-300 shadow-md">
            <img
              src={
                activeMode === "signature"
                  ? "/products/visuals/gift-box-signature-hamper.jpg"
                  : "/products/visuals/flatlay-keepsakes-novelty.jpg"
              }
              alt="Rajmoti Studio Gift Box and Packaging Experience"
              className="size-full object-cover transition-all duration-300"
            />
            <div className="absolute top-4 left-4 bg-[#29251F]/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-amber-200">
              {activeMode === "signature" ? "Signature Studio Hamper · ₹49" : "Standard Archival Box · Included"}
            </div>
          </div>

          {/* Feature Breakdown */}
          <div className="lg:col-span-6 space-y-3.5">
            {activeMode === "signature" ? (
              <>
                <div className="mb-2">
                  <h3 className="text-xl font-display font-bold text-stone-900">
                    Signature Hamper Inclusions:
                  </h3>
                  <p className="text-xs text-stone-500">
                    Hand-assembled by our finishing team in Jetpur before hand-delivery.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {SIGNATURE_FEATURES.map((feat) => (
                    <div
                      key={feat.id}
                      onClick={() => setSelectedFeature(feat.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        selectedFeature === feat.id
                          ? "bg-white border-amber-800 shadow-xs ring-1 ring-amber-800/20"
                          : "bg-white/60 border-stone-200 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-stone-900">{feat.title}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-semibold">
                          {feat.tag}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed">{feat.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex items-center justify-between text-xs text-stone-600">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-700" />
                    Zero plastic packing peanuts
                  </span>
                  <span className="font-semibold text-amber-900">Add to any product for +₹49</span>
                </div>
              </>
            ) : (
              <div className="p-6 bg-white rounded-2xl border border-stone-200 space-y-4">
                <div className="size-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700">
                  <Package size={20} />
                </div>
                <h3 className="text-lg font-bold text-stone-900">Standard Safe Courier Packaging</h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Included with every order at no extra charge. Built for safe road transit across Saurashtra with 5-ply corrugated carton, heavy-duty bubble wrap, and molded corner protectors.
                </p>
                <ul className="space-y-2 text-xs text-stone-700 font-medium">
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-700" />
                    5-ply shock-resistant corrugated outer box
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-700" />
                    Rigid reinforced frame corner guards
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-700" />
                    Moisture-sealed poly wrap for monsoons
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
