"use client";

import React, { useState } from "react";
import {
  Eye,
  Globe,
  ShieldCheck,
  ShoppingCart,
  MapPin,
  Monitor,
  Smartphone,
  Maximize2,
  X,
  Search,
  Star,
} from "lucide-react";
import type { OnboardingDraft } from "./types";

function StorefrontMockup({
  draft,
  viewMode,
  expanded,
}: {
  draft: OnboardingDraft;
  viewMode: "desktop" | "mobile";
  expanded?: boolean;
}) {
  const previewSlug = draft.customSlug || "ma-boutique";
  const isMobileFrame = viewMode === "mobile";

  const displayProducts =
    draft.productMode === "CUSTOM" && draft.initialProducts.length > 0
      ? draft.initialProducts.slice(0, isMobileFrame ? 2 : 4).map((p, idx) => ({
          id: p.id || String(idx),
          title: p.title || `Produit ${idx + 1}`,
          price:
            Number(p.priceFcfa) > 0
              ? `${Number(p.priceFcfa).toLocaleString("fr-FR")} ${draft.currency}`
              : `25 000 ${draft.currency}`,
          imageUrl: p.imageUrl,
        }))
      : [
          {
            id: "1",
            title: "Produit Vedette",
            price: `25 000 ${draft.currency}`,
            imageUrl: "/products/smartphone.jpg",
          },
          {
            id: "2",
            title: "Offre Découverte",
            price: `12 500 ${draft.currency}`,
            imageUrl: "/products/cosmetic.jpg",
          },
          ...(isMobileFrame
            ? []
            : [
                {
                  id: "3",
                  title: "Sélection Premium",
                  price: `45 000 ${draft.currency}`,
                  imageUrl: "/products/coffee.jpg",
                },
                {
                  id: "4",
                  title: "Nouveauté Atelier",
                  price: `18 500 ${draft.currency}`,
                  imageUrl: "/products/shirt.jpg",
                },
              ]),
        ];

  return (
    <div
      className={`mx-auto overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm transition-all duration-300 ${
        isMobileFrame ? "max-w-[330px] border-4 border-slate-800 rounded-[28px]" : "w-full"
      }`}
    >
      {/* Browser Address Bar */}
      <div className="flex items-center justify-between gap-2 bg-slate-100 px-3 py-1.5 border-b border-slate-200 text-[10px] text-slate-500">
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-red-400" />
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
        </div>
        <div className="flex-1 truncate rounded-md bg-white px-2.5 py-0.5 text-center font-medium text-slate-600 border border-slate-200/80">
          albedoo.cm/s/{previewSlug}
        </div>
      </div>

      {/* Store Utility Bar */}
      <div className="flex items-center justify-between bg-white px-3 py-1.5 border-b border-slate-100 text-[10px]">
        <div className="flex items-center gap-1.5 font-semibold text-emerald-700 truncate">
          <ShieldCheck className="h-3 w-3 shrink-0" />
          <span className="truncate">Boutique Vérifiée · {draft.city || "Douala"}</span>
        </div>
        <span className="inline-flex items-center gap-1 text-slate-400 shrink-0">
          <MapPin className="h-2.5 w-2.5" /> {draft.country || "Cameroun"}
        </span>
      </div>

      {/* Store Navbar */}
      <div className="flex items-center justify-between gap-2 bg-white px-3 py-2 border-b border-slate-100">
        <div className="flex items-center gap-2 min-w-0">
          {draft.logoUrl ? (
            <img
              src={draft.logoUrl}
              alt="Logo"
              className="h-7 w-7 rounded-lg object-cover border border-slate-200 shrink-0"
            />
          ) : (
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black text-white shrink-0"
              style={{ backgroundColor: draft.accentColor }}
            >
              {(draft.storeName || "M").slice(0, 1).toUpperCase()}
            </div>
          )}
          <span className="text-xs font-extrabold text-[#0B192C] truncate">
            {draft.storeName || "Ma Boutique Cameroun"}
          </span>
        </div>
        {!isMobileFrame && (
          <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] text-slate-400 w-36">
            <Search className="h-2.5 w-2.5" /> Rechercher...
          </div>
        )}
        <div
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold text-white shrink-0"
          style={{ backgroundColor: draft.primaryColor }}
        >
          <ShoppingCart className="h-2.5 w-2.5" /> 0
        </div>
      </div>

      {/* Hero Banner */}
      <div
        className="relative p-4 sm:p-5 text-white transition-all"
        style={{
          background: draft.bannerUrl
            ? `linear-gradient(to right, ${draft.primaryColor}E8, ${draft.secondaryColor}CC), url(${draft.bannerUrl}) center/cover`
            : `linear-gradient(135deg, ${draft.primaryColor}, ${draft.secondaryColor})`,
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-1.5">
              <span
                className="rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase text-white"
                style={{ backgroundColor: draft.accentColor }}
              >
                {draft.sector.split(" ")[0]}
              </span>
              <span className="text-[9px] text-white/80 font-semibold">{draft.plan}</span>
            </div>
            <div className="text-sm sm:text-base font-extrabold truncate">
              {draft.storeName || "Ma Boutique Cameroun"}
            </div>
            <div className="text-[11px] text-white/85 line-clamp-2">
              {draft.tagline || `Découvrez nos offres certifiées à ${draft.city}.`}
            </div>
            <div className="pt-1">
              <span
                className="inline-block rounded-lg px-3 py-1 text-[10px] font-bold text-white shadow-sm"
                style={{ backgroundColor: draft.buttonColor }}
              >
                Découvrir le catalogue
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto bg-white px-3 py-2 border-b border-slate-100 text-[10px]">
        {["Tous", "Nouveautés", "Promos", draft.sector.split(" ")[0]].map((cat, idx) => (
          <span
            key={cat + idx}
            className={`rounded-full px-2.5 py-0.5 font-semibold shrink-0 ${
              idx === 0 ? "text-white" : "bg-slate-100 text-slate-600"
            }`}
            style={idx === 0 ? { backgroundColor: draft.primaryColor } : undefined}
          >
            {cat}
          </span>
        ))}
      </div>

      {/* Product Cards Grid */}
      <div
        className={`p-3 grid gap-2.5 ${
          isMobileFrame ? "grid-cols-2" : expanded ? "grid-cols-4" : "grid-cols-2"
        }`}
      >
        {displayProducts.map((prod) => (
          <div
            key={prod.id}
            className="rounded-xl bg-white p-2 border border-slate-200/80 flex flex-col justify-between shadow-2xs"
          >
            <div>
              <div className="h-20 rounded-lg bg-slate-100 mb-2 overflow-hidden flex items-center justify-center">
                {prod.imageUrl ? (
                  <img src={prod.imageUrl} alt={prod.title} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[9px] text-slate-400">Photo produit</span>
                )}
              </div>
              <div className="flex items-center gap-0.5 text-amber-400 mb-0.5">
                <Star className="h-2.5 w-2.5 fill-amber-400" />
                <span className="text-[9px] font-bold text-slate-500">4.9</span>
              </div>
              <div className="text-[11px] font-bold text-[#0B192C] truncate">{prod.title}</div>
              {draft.showPrices && (
                <div className="text-[11px] font-extrabold mt-0.5 tabular-nums" style={{ color: draft.primaryColor }}>
                  {prod.price}
                </div>
              )}
            </div>
            <div
              className="mt-2 flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-bold text-white"
              style={{ backgroundColor: draft.buttonColor }}
            >
              <ShoppingCart className="h-2.5 w-2.5" /> Ajouter
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LiveStorePreview({ draft }: { draft: OnboardingDraft }) {
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#0B192C]">
            <Eye className="h-3.5 w-3.5 text-orange-500" /> Aperçu en direct
          </span>

          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("desktop")}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold transition cursor-pointer ${
                viewMode === "desktop" ? "bg-white text-[#0B192C] shadow-2xs" : "text-slate-500"
              }`}
            >
              <Monitor className="h-3 w-3" /> Bureau
            </button>
            <button
              type="button"
              onClick={() => setViewMode("mobile")}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold transition cursor-pointer ${
                viewMode === "mobile" ? "bg-white text-[#0B192C] shadow-2xs" : "text-slate-500"
              }`}
            >
              <Smartphone className="h-3 w-3" /> Mobile
            </button>
            <button
              type="button"
              onClick={() => setExpanded(true)}
              title="Agrandir l'aperçu"
              className="rounded-md p-1 text-slate-500 hover:bg-white hover:text-[#0B192C] cursor-pointer"
            >
              <Maximize2 className="h-3 w-3" />
            </button>
          </div>
        </div>

        <StorefrontMockup draft={draft} viewMode={viewMode} />

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <span className="inline-flex items-center gap-1 truncate">
            <Globe className="h-3 w-3 text-slate-400 shrink-0" />
            /s/{draft.customSlug || "ma-boutique"}
          </span>
          <span className="font-semibold text-emerald-700 shrink-0">Temps réel</span>
        </div>
      </div>

      {/* Expanded Fullscreen Preview Modal */}
      {expanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-5xl rounded-2xl bg-white p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-extrabold text-[#0B192C]">
                  Prévisualisation agrandie — {draft.storeName || "Ma Boutique"}
                </span>
                <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5">
                  <button
                    type="button"
                    onClick={() => setViewMode("desktop")}
                    className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold cursor-pointer ${
                      viewMode === "desktop" ? "bg-white text-[#0B192C] shadow-2xs" : "text-slate-500"
                    }`}
                  >
                    <Monitor className="h-3.5 w-3.5" /> Bureau
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("mobile")}
                    className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold cursor-pointer ${
                      viewMode === "mobile" ? "bg-white text-[#0B192C] shadow-2xs" : "text-slate-500"
                    }`}
                  >
                    <Smartphone className="h-3.5 w-3.5" /> Mobile
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <StorefrontMockup draft={draft} viewMode={viewMode} expanded />
          </div>
        </div>
      )}
    </>
  );
}
