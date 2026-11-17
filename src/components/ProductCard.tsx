"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShoppingCart, Star, ShieldCheck, Truck, Heart, GitCompare, Eye, X, ArrowRight } from "lucide-react";
import { formatFcfa, SALES_MODEL_LABELS } from "@/lib/format";
import { useApp } from "./Providers";

export interface ProductCardData {
  id: string;
  title: string;
  slug: string;
  priceFcfa: number;
  compareAtFcfa?: number | null;
  stock: number;
  salesModel: string;
  warrantyMonths: number;
  leadTimeDaysDouala: number;
  leadTimeDaysYaounde?: number;
  leadTimeDaysOther?: number;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  isSponsored?: boolean;
  category: { name: string; slug: string };
  vendor?: { companyName: string; verifiedBadge: boolean } | null;
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const { addToCart, deliveryCity, wishlist, toggleWishlist, compareIds, toggleCompare } = useApp();
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const modelMeta = SALES_MODEL_LABELS[product.salesModel] || SALES_MODEL_LABELS.DIRECT_RETAIL;
  const discountPct =
    product.compareAtFcfa && product.compareAtFcfa > product.priceFcfa
      ? Math.round(((product.compareAtFcfa - product.priceFcfa) / product.compareAtFcfa) * 100)
      : null;

  const isFav = wishlist.includes(product.id);
  const isCompared = compareIds.includes(product.id);

  const etaText =
    deliveryCity === "Douala"
      ? `Livré en ${product.leadTimeDaysDouala * 24}h à Douala`
      : deliveryCity === "Yaoundé"
      ? `Livré en ${product.leadTimeDaysYaounde || 2}j à Yaoundé`
      : `Livré en ${product.leadTimeDaysOther || 4}j à ${deliveryCity}`;

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:border-[#1E3A5F]/40">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <Link href={`/produit/${product.slug}`} className="block h-full w-full">
          <img
            src={product.imageUrl}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-110"
          />
        </Link>

        <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1">
          <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold shadow-sm ${modelMeta.badgeClass}`}>
            {modelMeta.shortLabel}
          </span>
          {discountPct && (
            <span className="rounded-md bg-orange-500 px-2 py-0.5 text-[10px] font-extrabold text-white shadow-sm">
              -{discountPct}%
            </span>
          )}
        </div>

        {/* Wishlist & Compare */}
        <div className="absolute right-2.5 top-2.5 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => toggleWishlist(product.id, product.title)}
            className={`flex h-8 w-8 items-center justify-center rounded-full shadow-md backdrop-blur transition cursor-pointer ${
              isFav ? "bg-rose-500 text-white" : "bg-white/90 text-slate-600 hover:text-rose-500"
            }`}
            title="Ajouter aux favoris"
          >
            <Heart className={`h-4 w-4 ${isFav ? "fill-white" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => toggleCompare(product.id)}
            className={`flex h-8 w-8 items-center justify-center rounded-full shadow-md backdrop-blur transition cursor-pointer ${
              isCompared ? "bg-[#0B192C] text-white" : "bg-white/90 text-slate-600 hover:text-[#0B192C]"
            }`}
            title="Comparer ce produit"
          >
            <GitCompare className="h-4 w-4" />
          </button>
        </div>

        {/* Quick View Hover Trigger */}
        <button
          type="button"
          onClick={() => setQuickViewOpen(true)}
          className="absolute inset-x-3 bottom-2.5 flex items-center justify-center gap-1.5 rounded-xl bg-[#0B192C]/85 py-1.5 text-[11px] font-bold text-white opacity-0 backdrop-blur-xs transition-opacity duration-200 group-hover:opacity-100 hover:bg-[#0B192C] cursor-pointer"
        >
          <Eye className="h-3.5 w-3.5 text-orange-400" /> Aperçu rapide
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#1E3A5F] truncate">
            {product.category.name}
          </span>
          <span className="inline-flex items-center gap-0.5 text-xs font-bold text-amber-500 shrink-0">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {product.rating.toFixed(1)}
            <span className="text-[11px] text-slate-400 font-normal">({product.reviewCount})</span>
          </span>
        </div>

        <Link
          href={`/produit/${product.slug}`}
          className="mb-1.5 line-clamp-2 text-sm font-bold text-slate-900 group-hover:text-orange-600 transition leading-snug"
        >
          {product.title}
        </Link>

        {product.vendor ? (
          <div className="mb-2 inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{product.vendor.companyName}</span>
          </div>
        ) : (
          <div className="mb-2 inline-flex items-center gap-1 text-[11px] text-[#1E3A5F] font-semibold">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            <span>Expédié par Albedo&apos;o</span>
          </div>
        )}

        <div className="mt-auto pt-2 border-t border-slate-100">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-extrabold text-[#0B192C] tabular-nums">
              {formatFcfa(product.priceFcfa)}
            </span>
            {product.compareAtFcfa && product.compareAtFcfa > product.priceFcfa && (
              <span className="text-xs text-slate-400 line-through tabular-nums">
                {formatFcfa(product.compareAtFcfa)}
              </span>
            )}
          </div>

          <div className="mt-1.5 flex items-center justify-between text-[11px]">
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
              <Truck className="h-3.5 w-3.5 text-orange-500" />
              {etaText}
            </span>
            <span className={product.stock > 0 ? "text-slate-500 font-medium" : "text-red-600 font-bold"}>
              {product.stock > 0 ? `${product.stock} disp.` : "Rupture"}
            </span>
          </div>

          <button
            disabled={product.stock <= 0}
            onClick={() =>
              addToCart({
                productId: product.id,
                slug: product.slug,
                title: product.title,
                priceFcfa: product.priceFcfa,
                imageUrl: product.imageUrl,
                salesModel: product.salesModel,
                vendorName: product.vendor?.companyName,
                maxStock: product.stock,
              })
            }
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-3 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-orange-600 disabled:opacity-40 transition cursor-pointer"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Ajouter au panier
          </button>
        </div>
      </div>

      {/* Quick View Modal */}
      {quickViewOpen && (
        <div
          onClick={() => setQuickViewOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl grid grid-cols-1 sm:grid-cols-2 gap-6"
          >
            <button
              onClick={() => setQuickViewOpen(false)}
              className="absolute right-3 top-3 rounded-full bg-slate-100 p-1.5 text-slate-600 hover:bg-slate-200 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="overflow-hidden rounded-xl bg-slate-100 aspect-square">
              <img src={product.imageUrl} alt={product.title} className="h-full w-full object-cover" />
            </div>
            <div className="flex flex-col justify-between space-y-3">
              <div>
                <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold mb-1.5 ${modelMeta.badgeClass}`}>
                  {modelMeta.shortLabel}
                </span>
                <h3 className="text-base font-extrabold text-[#0B192C] leading-snug">{product.title}</h3>
                <div className="mt-1.5 flex items-center gap-1 text-xs font-bold text-amber-500">
                  <Star className="h-3.5 w-3.5 fill-amber-400" /> {product.rating.toFixed(1)} ({product.reviewCount} avis)
                </div>
                <div className="mt-3 text-2xl font-black text-[#0B192C] tabular-nums">
                  {formatFcfa(product.priceFcfa)}
                </div>
                <div className="mt-1 text-xs font-semibold text-emerald-700">{etaText}</div>
                <div className="mt-0.5 text-xs text-slate-500">
                  Stock : <strong>{product.stock}</strong> unité(s) · Garantie {product.warrantyMonths} mois
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  disabled={product.stock <= 0}
                  onClick={() => {
                    setQuickViewOpen(false);
                    addToCart({
                      productId: product.id,
                      slug: product.slug,
                      title: product.title,
                      priceFcfa: product.priceFcfa,
                      imageUrl: product.imageUrl,
                      salesModel: product.salesModel,
                      vendorName: product.vendor?.companyName,
                      maxStock: product.stock,
                    });
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-2.5 text-xs font-extrabold text-white hover:bg-orange-600 cursor-pointer"
                >
                  <ShoppingCart className="h-4 w-4" /> Ajouter au panier
                </button>
                <Link
                  href={`/produit/${product.slug}`}
                  onClick={() => setQuickViewOpen(false)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-[#0B192C] hover:bg-slate-50"
                >
                  Voir la fiche &amp; variantes <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
