"use client";

import React from "react";
import { Eye, Globe, ShieldCheck, ShoppingCart, MapPin } from "lucide-react";
import type { OnboardingDraft } from "./types";

export function LiveStorePreview({ draft }: { draft: OnboardingDraft }) {
  const previewSlug = draft.customSlug || "ma-boutique";
  const displayProducts =
    draft.productMode === "CUSTOM" && draft.initialProducts.length > 0
      ? draft.initialProducts.slice(0, 2).map((p, idx) => ({
          id: p.id || String(idx),
          title: p.title || `Produit ${idx + 1}`,
          price: Number(p.priceFcfa) > 0 ? `${Number(p.priceFcfa).toLocaleString("fr-FR")} ${draft.currency}` : `25 000 ${draft.currency}`,
          imageUrl: p.imageUrl,
        }))
      : [
          { id: "1", title: "Produit Vedette", price: `25 000 ${draft.currency}`, imageUrl: "/products/smartphone.jpg" },
          { id: "2", title: "Offre Découverte", price: `12 500 ${draft.currency}`, imageUrl: "/products/cosmetic.jpg" },
        ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between text-xs font-bold text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <Eye className="h-3.5 w-3.5 text-orange-500" /> Aperçu en direct de votre vitrine
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 truncate max-w-[160px]">
          <Globe className="h-3 w-3 shrink-0" /> /s/{previewSlug}
        </span>
      </div>

      {/* Simulated Browser Frame */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-inner">
        {/* Mini Top Bar */}
        <div className="flex items-center justify-between bg-white px-3 py-2 border-b border-slate-100 text-[10px]">
          <div className="flex items-center gap-1.5 font-bold text-slate-700 truncate">
            <ShieldCheck className="h-3 w-3 text-emerald-600 shrink-0" />
            <span className="truncate">{draft.storeName || "Ma Boutique Cameroun"}</span>
          </div>
          <span className="inline-flex items-center gap-1 text-slate-400 shrink-0">
            <MapPin className="h-2.5 w-2.5" /> {draft.city || "Douala"}
          </span>
        </div>

        {/* Hero Banner */}
        <div
          className="relative p-4 text-white transition-all"
          style={{
            background: draft.bannerUrl
              ? `linear-gradient(to right, ${draft.primaryColor}E6, ${draft.secondaryColor}CC), url(${draft.bannerUrl}) center/cover`
              : `linear-gradient(135deg, ${draft.primaryColor}, ${draft.secondaryColor})`,
          }}
        >
          <div className="flex items-center gap-3">
            {draft.logoUrl ? (
              <img
                src={draft.logoUrl}
                alt="Logo"
                className="h-11 w-11 rounded-xl object-cover bg-white p-0.5 shadow shrink-0"
              />
            ) : (
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl text-base font-black text-white shadow shrink-0"
                style={{ backgroundColor: draft.accentColor }}
              >
                {(draft.storeName || "M").slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span
                  className="rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase text-white"
                  style={{ backgroundColor: draft.accentColor }}
                >
                  {draft.sector.split(" ")[0]}
                </span>
                <span className="text-[9px] text-white/80 font-semibold">{draft.plan}</span>
              </div>
              <div className="mt-0.5 text-sm font-extrabold truncate">
                {draft.storeName || "Ma Boutique Cameroun"}
              </div>
              <div className="text-[10px] text-white/80 truncate">
                {draft.tagline || `Boutique officielle à ${draft.city}`}
              </div>
            </div>
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="p-3 grid grid-cols-2 gap-2.5">
          {displayProducts.map((prod) => (
            <div key={prod.id} className="rounded-lg bg-white p-2 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="h-16 rounded bg-slate-100 mb-1.5 overflow-hidden flex items-center justify-center">
                  {prod.imageUrl ? (
                    <img src={prod.imageUrl} alt={prod.title} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[9px] text-slate-400">Image produit</span>
                  )}
                </div>
                <div className="text-[10px] font-bold text-[#0B192C] truncate">{prod.title}</div>
                {draft.showPrices && (
                  <div className="text-[10px] font-extrabold mt-0.5" style={{ color: draft.primaryColor }}>
                    {prod.price}
                  </div>
                )}
              </div>
              <div
                className="mt-2 flex items-center justify-center gap-1 rounded-md px-2 py-1 text-[9px] font-bold text-white"
                style={{ backgroundColor: draft.buttonColor }}
              >
                <ShoppingCart className="h-2.5 w-2.5" /> Ajouter
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
