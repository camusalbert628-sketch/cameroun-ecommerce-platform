"use client";

import React from "react";
import Link from "next/link";
import { Trash2, ArrowRight, ShoppingBag, ShieldCheck } from "lucide-react";
import { useApp } from "@/components/Providers";
import { formatFcfa, SALES_MODEL_LABELS } from "@/lib/format";

export default function PanierPage() {
  const { cart, updateQty, removeFromCart, cartTotal } = useApp();

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-[#1E3A5F]">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-extrabold text-[#0B192C]">Votre panier est vide</h1>
        <p className="mt-2 text-sm text-slate-600">
          Découvrez nos produits certifiés en vente directe, chez nos vendeurs partenaires ou sur commande.
        </p>
        <Link
          href="/catalogue"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white hover:bg-orange-600 transition"
        >
          Parcourir le catalogue <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-extrabold text-[#0B192C] mb-6">Votre Panier</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-4">
          {cart.map((item) => {
            const modelMeta = SALES_MODEL_LABELS[item.salesModel] || SALES_MODEL_LABELS.DIRECT_RETAIL;
            return (
              <div
                key={`${item.productId}-${item.variantId || "base"}`}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="h-20 w-24 rounded-xl object-cover bg-slate-100 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold mb-1 ${modelMeta.badgeClass}`}>
                    {modelMeta.shortLabel}
                  </span>
                  <Link href={`/produit/${item.slug}`} className="block font-bold text-slate-900 hover:text-[#1E3A5F] truncate">
                    {item.title}
                  </Link>
                  {item.variantLabel && (
                    <div className="text-xs font-semibold text-orange-600">Variante : {item.variantLabel}</div>
                  )}
                  <div className="mt-1 text-sm font-extrabold text-[#0B192C] tabular-nums">
                    {formatFcfa(item.priceFcfa)}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50">
                    <button
                      onClick={() => updateQty(item.productId, item.quantity - 1, item.variantId)}
                      className="px-3 py-1.5 text-sm font-bold hover:bg-slate-200 rounded-l-xl cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-3 text-sm font-bold tabular-nums">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.productId, item.quantity + 1, item.variantId)}
                      className="px-3 py-1.5 text-sm font-bold hover:bg-slate-200 rounded-r-xl cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.productId, item.variantId)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 sticky top-28">
            <h2 className="text-lg font-extrabold text-[#0B192C]">Récapitulatif</h2>
            <div className="space-y-2 text-sm border-b border-slate-100 pb-4">
              <div className="flex justify-between text-slate-600">
                <span>Sous-total articles</span>
                <span className="font-bold text-slate-900 tabular-nums">{formatFcfa(cartTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Frais de livraison</span>
                <span className="text-xs text-slate-500">Calculés à l&apos;étape suivante</span>
              </div>
            </div>

            <div className="flex justify-between items-baseline">
              <span className="font-bold text-slate-900">Total estimé</span>
              <span className="text-xl font-extrabold text-[#0B192C] tabular-nums">{formatFcfa(cartTotal)}</span>
            </div>

            <Link
              href="/checkout"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3.5 text-sm font-bold text-white shadow-md hover:bg-orange-600 transition"
            >
              Passer à la commande <ArrowRight className="h-4 w-4" />
            </Link>

            <div className="flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Paiement sécurisé Orange Money, MTN MoMo, Visa/Mastercard ou à la livraison (Douala & Yaoundé ≤ 150 000 FCFA).</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

