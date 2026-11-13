import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Clock,
  MapPin,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  MessageCircle,
  AlertCircle,
  PackageCheck,
  Store,
  Truck,
} from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { SITE, whatsappLink } from "@/lib/site";

export const Route = createFileRoute("/same-day")({
  head: () => ({
    meta: [
      {
        title: "Same-Day Personalised Photo Gifts in Jetpur — Handcrafted Today | Rajmoti Studio",
      },
      {
        name: "description",
        content:
          "Need a thoughtful anniversary or birthday gift today in Jetpur? Ceramic mugs, 8×12 teak frames, acrylic blocks and keychains handcrafted in 2–4 hours. Counter pickup or Jetpur local delivery.",
      },
    ],
  }),
  component: SameDayGiftsPage,
});

interface SameDayProduct {
  id: string;
  name: string;
  category: string;
  turnaround: string;
  pricePickup: number;
  priceDelivery: number;
  imageUrl: string;
  tag: string;
  description: string;
  requiresPhotoCount: string;
}

const SAME_DAY_PRODUCTS: SameDayProduct[] = [
  {
    id: "sd-mug-white",
    name: "Classic White Ceramic Photo Mug",
    category: "Drinkware",
    turnaround: "2 hours",
    pricePickup: 299,
    priceDelivery: 349,
    imageUrl: "/products/mug-sample-couple.jpg",
    tag: "Most Popular · Instant Gift",
    description: "Grade-A glossy ceramic mug printed with your family or couple portrait. Microwave & dishwasher safe.",
    requiresPhotoCount: "1 photo",
  },
  {
    id: "sd-mug-magic",
    name: "Thermochromic Magic Reveal Mug",
    category: "Drinkware",
    turnaround: "2 to 3 hours",
    pricePickup: 499,
    priceDelivery: 549,
    imageUrl: "/products/mug-sample-couple.jpg",
    tag: "Magical Surprise",
    description: "Appears sleek matte black when empty. Reveals your hidden photo and anniversary date when hot chai or coffee is poured.",
    requiresPhotoCount: "1 photo",
  },
  {
    id: "sd-frame-8x12",
    name: "8×12 Instant Photo Frame",
    category: "Framing",
    turnaround: "2 to 4 hours",
    pricePickup: 499,
    priceDelivery: 569,
    imageUrl: "/products/frame-sample-wedding.jpg",
    tag: "Wood Frame",
    description: "Solid wood frame moulding with clear protective glass. Ready to hang or table-stand. Available finishes vary by stock.",
    requiresPhotoCount: "1 photo",
  },
  {
    id: "sd-acrylic-8x12",
    name: "8×12 Acrylic Photo Block",
    category: "Substrates",
    turnaround: "3 to 4 hours",
    pricePickup: 799,
    priceDelivery: 869,
    imageUrl: "/products/frame-sample-anniversary.jpg",
    tag: "Modern Acrylic",
    description: "Solid crystal acrylic block with polished edges. Stands independently on desks, sideboards, or mantels.",
    requiresPhotoCount: "1 photo",
  },
  {
    id: "sd-keychain-double",
    name: "Double-Sided Keepsake Keychain",
    category: "Keepsakes",
    turnaround: "1 to 2 hours",
    pricePickup: 199,
    priceDelivery: 249,
    imageUrl: "/products/frame-sample-family.jpg",
    tag: "Pocket Keepsake",
    description: "Gloss acrylic or wood finish with your photo on the front and custom anniversary date, initials, or text on the reverse.",
    requiresPhotoCount: "1 or 2 photos",
  },
];

const JETPUR_LOCALITIES = [
  "Main Market / City Area",
  "Kanakiya Plot",
  "Navagadh & GIDC",
  "Dhoraji Road",
  "Junagadh Road & Bypass",
  "Sardar Chowk & Main Bazar",
  "Bhadreshwar Temple Area",
  "Shreeji Nagar & Vasant Plot",
];

export function SameDayGiftsPage() {
  const [selectedProduct, setSelectedProduct] = useState<SameDayProduct>(SAME_DAY_PRODUCTS[0]);
  const [fulfilmentMode, setFulfilmentMode] = useState<"pickup" | "delivery">("pickup");
  const [selectedLocality, setSelectedLocality] = useState(JETPUR_LOCALITIES[0]);

  const handleWhatsAppEnquiry = (prod: SameDayProduct) => {
    const price = fulfilmentMode === "pickup" ? prod.pricePickup : prod.priceDelivery;
    const msg = `Namaste Pankajbhai (Rajmoti Studio)! ⚡\n\nI am inquiring about TODAY'S SAME-DAY GIFTS in Jetpur:\n• Item: ${prod.name} (₹${price})\n• Fulfilment: ${
      fulfilmentMode === "pickup" ? "Studio Counter Pickup (Today)" : `Local Jetpur Delivery to ${selectedLocality}`
    }\n• Turnaround: ~${prod.turnaround}\n\nDo you have capacity in the workshop right now to craft this today? I have my photo ready to share on WhatsApp!`;
    window.open(whatsappLink(msg), "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 flex flex-col font-sans selection:bg-amber-900 selection:text-white">
      <SiteNav />

      <main className="flex-1 pb-20">
        {/* Hero Section */}
        <section className="relative pt-12 pb-16 px-4 sm:px-6 lg:px-8 border-b border-stone-200/80 bg-gradient-to-b from-amber-50/50 to-[#FDFBF7]">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100/80 border border-amber-300 text-amber-900 text-xs font-semibold uppercase tracking-wider">
              <Sparkles size={14} className="text-amber-700" />
              Jetpur Local Workshop Service
            </div>

            <h1 className="text-3xl sm:text-5xl font-display font-bold text-stone-900 tracking-tight leading-tight">
              Thoughtful gifts, even at the last minute.
            </h1>

            <p className="text-stone-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Did a birthday or anniversary sneak up on you? Don't settle for generic flowers or chocolates. We craft personalized ceramic mugs, teak collage frames, and acrylic keepsakes right here in our Jetpur workshop today.
            </p>

            {/* Cutoff Time Notification Banner */}
            <div className="mt-6 inline-flex flex-col sm:flex-row items-center gap-4 bg-white border border-amber-200 rounded-2xl p-4 shadow-sm text-left max-w-2xl mx-auto">
              <div className="size-11 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
                <Clock size={22} />
              </div>
              <div className="text-xs space-y-1">
                <div className="font-bold text-stone-900 flex items-center gap-1.5">
                  <span>Today's Production Cutoff:</span>
                  <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-mono">
                    2:00 PM Delivery · 6:00 PM Pickup
                  </span>
                </div>
                <p className="text-stone-600 leading-normal">
                  Orders submitted before cutoff are handcrafted and ready the same evening. Later orders are prioritized for next-morning collection.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Studio Capacity Advisory */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
          <div className="bg-[#2D241E] text-amber-100 rounded-2xl p-4 sm:p-5 shadow-lg border border-amber-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-amber-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-white block">Daily Studio Production Limit:</span>
                <span className="text-amber-200/90">
                  To ensure careful attention to detail, same-day personalized gifts are subject to daily studio capacity and stock confirmation.
                </span>
              </div>
            </div>
            <div className="text-xs text-stone-300 font-medium whitespace-nowrap bg-stone-900/60 px-3 py-1.5 rounded-lg border border-stone-700">
              Jetpur Studio · Gujarat 360370
            </div>
          </div>
        </section>

        {/* Product Selection & Live Availability */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs uppercase tracking-widest text-amber-800 font-bold">In-Stock Jetpur Workshop Blanks</p>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-stone-900 mt-1">
                Select your same-day keepsake.
              </h2>
            </div>

            {/* Fulfilment Choice Filter */}
            <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-xl border border-stone-200">
              <button
                type="button"
                onClick={() => setFulfilmentMode("pickup")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  fulfilmentMode === "pickup"
                    ? "bg-white text-stone-900 shadow-xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <Store size={14} className="text-amber-800" />
                Studio Pickup (Zero Wait)
              </button>
              <button
                type="button"
                onClick={() => setFulfilmentMode("delivery")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  fulfilmentMode === "delivery"
                    ? "bg-white text-stone-900 shadow-xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <Truck size={14} className="text-amber-800" />
                Jetpur Local Doorstep
              </button>
            </div>
          </div>

          {/* Delivery Locality Selector (shown if Delivery chosen) */}
          {fulfilmentMode === "delivery" && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-900">
                <MapPin size={16} className="text-amber-700" />
                <span>Select Jetpur Delivery Area:</span>
              </div>
              <select
                value={selectedLocality}
                onChange={(e) => setSelectedLocality(e.target.value)}
                className="bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs font-medium text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                {JETPUR_LOCALITIES.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SAME_DAY_PRODUCTS.map((prod) => {
              const price = fulfilmentMode === "pickup" ? prod.pricePickup : prod.priceDelivery;
              const isSelected = selectedProduct.id === prod.id;

              return (
                <div
                  key={prod.id}
                  onClick={() => setSelectedProduct(prod)}
                  className={`cursor-pointer rounded-2xl bg-white border transition-all duration-300 overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? "border-amber-700 shadow-xl ring-2 ring-amber-700/20"
                      : "border-stone-200 hover:border-amber-400 hover:shadow-md"
                  }`}
                >
                  <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden">
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      className="size-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute top-3 left-3 bg-stone-900/85 backdrop-blur-md text-amber-100 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                      {prod.tag}
                    </div>
                    <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md text-stone-800 text-[11px] font-semibold px-2 py-0.5 rounded shadow-xs flex items-center gap-1">
                      <Clock size={12} className="text-amber-800" />
                      {prod.turnaround}
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-stone-500 font-mono">
                        <span>{prod.category}</span>
                        <span>{prod.requiresPhotoCount}</span>
                      </div>
                      <h3 className="font-display text-lg font-bold text-stone-900 mt-1">
                        {prod.name}
                      </h3>
                      <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                        {prod.description}
                      </p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-stone-500 block">
                          {fulfilmentMode === "pickup" ? "Studio Pickup Price" : "Delivered in Jetpur"}
                        </span>
                        <span className="text-xl font-bold font-display text-stone-900">
                          ₹{price}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWhatsAppEnquiry(prod);
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#25D366] text-white hover:bg-[#20b858] font-bold text-xs transition-all shadow-sm"
                      >
                        <MessageCircle size={15} />
                        Ask Today's Slots
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3-Step Simple Process */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-12 border-t border-stone-200">
          <div className="text-center mb-8">
            <h3 className="font-display text-2xl font-bold text-stone-900">How Same-Day Jetpur Ordering Works</h3>
            <p className="text-xs text-stone-600 mt-1">No complicated software. Direct human coordination with Pankajbhai.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div className="p-4 rounded-xl bg-white border border-stone-200 space-y-2">
              <div className="size-9 rounded-full bg-amber-100 text-amber-900 font-bold font-mono text-sm flex items-center justify-center mx-auto">
                1
              </div>
              <h4 className="font-bold text-sm text-stone-900">Tap WhatsApp & Confirm</h4>
              <p className="text-xs text-stone-600">
                Send your selected item. We verify blank stock and current machine availability within minutes.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-stone-200 space-y-2">
              <div className="size-9 rounded-full bg-amber-100 text-amber-900 font-bold font-mono text-sm flex items-center justify-center mx-auto">
                2
              </div>
              <h4 className="font-bold text-sm text-stone-900">Send Original Photo</h4>
              <p className="text-xs text-stone-600">
                Attach your high-resolution portrait directly in WhatsApp. We verify face framing and sharpness with you.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-stone-200 space-y-2">
              <div className="size-9 rounded-full bg-amber-100 text-amber-900 font-bold font-mono text-sm flex items-center justify-center mx-auto">
                3
              </div>
              <h4 className="font-bold text-sm text-stone-900">Collect or Receive</h4>
              <p className="text-xs text-stone-600">
                Pick up at the studio counter in Jetpur (pay at pickup), or receive doorstep delivery in Jetpur town.
              </p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
