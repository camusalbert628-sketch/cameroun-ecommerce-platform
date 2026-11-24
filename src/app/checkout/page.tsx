"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Select } from "@/components/ui/Select";
import {
  CheckCircle2,
  AlertCircle,
  Truck,
  CreditCard,
  ShieldCheck,
  ArrowRight,
  Gift,
} from "lucide-react";
import { useApp } from "@/components/Providers";
import { formatFcfa, DELIVERY_METHOD_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/format";

interface DeliveryZoneRow {
  id: string;
  city: string;
  zoneName: string;
  feeFcfa: number;
  estimatedDays: string;
  supportsCod: boolean;
  codMaxFcfa: number;
  relayPointName: string | null;
}

const FALLBACK_ZONE: DeliveryZoneRow = {
  id: "default",
  city: "Douala",
  zoneName: "Douala Centre",
  feeFcfa: 1500,
  estimatedDays: "24h",
  supportsCod: true,
  codMaxFcfa: 150000,
  relayPointName: "Hub Akwa",
};

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart, user, refreshAuth } = useApp();
  const [customerName, setCustomerName] = useState(user?.name || "");
  const [customerPhone, setCustomerPhone] = useState(user?.phone || "+237 6");
  const [customerEmail, setCustomerEmail] = useState(user?.email || "");
  const [zones, setZones] = useState<DeliveryZoneRow[]>([FALLBACK_ZONE]);
  const [selectedZoneId, setSelectedZoneId] = useState("default");

  useEffect(() => {
    fetch("/api/zones")
      .then((r) => r.json())
      .then((d) => {
        if (d.zones?.length > 0) {
          setZones(d.zones);
          setSelectedZoneId(d.zones[0].id);
        }
      })
      .catch(() => {});
  }, []);
  const [quarter, setQuarter] = useState(user?.quarter || "");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("INTERNAL_DOUALA");
  const [paymentMethod, setPaymentMethod] = useState("ORANGE_MONEY");
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountFcfa: number; label: string } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<{
    orderNumber: string;
    status: string;
    paymentStatus: string;
    paymentReference: string | null;
    totalFcfa: number;
  } | null>(null);
  const [outOfStockAlerts, setOutOfStockAlerts] = useState<string[]>([]);

  const zone = zones.find((z) => z.id === selectedZoneId) || zones[0] || FALLBACK_ZONE;
  const hasOnOrder = cart.some((i) => i.salesModel === "ON_ORDER");
  const codAllowed = zone.supportsCod && !hasOnOrder && cartTotal <= zone.codMaxFcfa;

  let deliveryFee = zone.feeFcfa;
  if (deliveryMethod === "STORE_PICKUP") deliveryFee = 0;
  else if (deliveryMethod === "RELAY_POINT") deliveryFee = Math.max(500, Math.round(zone.feeFcfa * 0.6));

  const loyaltyDiscount =
    useLoyaltyPoints && user && user.loyaltyPoints >= 100
      ? Math.min(Math.floor(user.loyaltyPoints / 100) * 1000, Math.round(cartTotal * 0.1))
      : 0;

  const couponDiscount = appliedCoupon ? appliedCoupon.discountFcfa : 0;
  const finalTotal = Math.max(0, cartTotal + deliveryFee - loyaltyDiscount - couponDiscount);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponError(null);
    setCouponLoading(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput.trim(), subtotalFcfa: cartTotal }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setAppliedCoupon(null);
        setCouponError(data.error || "Code promo invalide.");
      } else {
        setAppliedCoupon({ code: data.code, discountFcfa: data.discountFcfa, label: data.label });
      }
    } catch {
      setCouponError("Erreur de vérification.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerEmail,
          city: zone.city,
          quarter: quarter || zone.city,
          deliveryAddress,
          deliveryMethod,
          paymentMethod,
          useLoyaltyPoints,
          couponCode: appliedCoupon?.code || undefined,
          items: cart.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Impossible de valider la commande.");
      } else {
        setCreatedOrder(data.order);
        setOutOfStockAlerts(data.outOfStockAlerts || []);
        clearCart();
        refreshAuth();

        if (paymentMethod !== "CASH_ON_DELIVERY" && data.order?.orderNumber) {
          try {
            const initRes = await fetch("/api/payments/initiate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderNumber: data.order.orderNumber }),
            });
            if (initRes.ok) {
              const initData = await initRes.json();
              if (initData.authorizationUrl) {
                window.location.href = initData.authorizationUrl;
                return;
              }
            }
          } catch {
            // fallback to built-in confirmation view
          }
        }
      }
    } catch {
      setError("Erreur réseau lors de la commande.");
    } finally {
      setSubmitting(false);
    }
  };

  if (createdOrder) {
    const isFailed = createdOrder.paymentStatus === "FAILED";
    return (
      <div className="mx-auto max-w-2xl px-4 py-14">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg text-center space-y-5">
          {isFailed ? (
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
              <AlertCircle className="h-9 w-9" />
            </div>
          ) : (
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-9 w-9" />
            </div>
          )}

          <h1 className="text-2xl font-extrabold text-[#0B192C]">
            {isFailed ? "Paiement échoué — Relance requise" : "Commande enregistrée avec succès !"}
          </h1>

          <p className="text-sm text-slate-600">
            Numéro de suivi : <strong className="text-[#0B192C]">{createdOrder.orderNumber}</strong>
            {createdOrder.paymentReference && (
              <> · Référence : <strong>{createdOrder.paymentReference}</strong></>
            )}
          </p>

          <div className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-[#0B192C]">
            Montant total : {formatFcfa(createdOrder.totalFcfa)}
          </div>

          {outOfStockAlerts.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left text-xs text-amber-900 space-y-1">
              <div className="font-extrabold">Alerte Rupture de Stock détectée suite à cette vente :</div>
              {outOfStockAlerts.map((msg) => (
                <div key={msg}>• {msg}</div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link
              href={`/suivi?order=${createdOrder.orderNumber}`}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0B192C] px-6 py-3 text-sm font-bold text-white hover:bg-[#1E3A5F] transition"
            >
              Suivre ma commande (13 étapes) <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/catalogue"
              className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Continuer mes achats
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-extrabold text-[#0B192C]">Aucun article à commander</h1>
        <Link href="/catalogue" className="mt-4 inline-block rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white">
          Retour au catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-extrabold text-[#0B192C] mb-2">Finaliser la commande</h1>
      <p className="text-sm text-slate-600 mb-8">
        Livraison adaptée au marché camerounais et paiements locaux sécurisés (Chapitre 11 & 15).
      </p>

      {error && (
        <div className="mb-6 flex items-center gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-6">
          {/* Customer Info */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-[#0B192C]">1. Coordonnées & Adresse au Cameroun</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nom complet *</label>
                <input
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ex: Jean-Paul Mbarga"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#1E3A5F] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Téléphone Mobile Money / WhatsApp *
                </label>
                <input
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+237 6XX XX XX XX"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#1E3A5F] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Zone / Ville *</label>
                <Select
                  value={selectedZoneId}
                  onChange={(zId) => {
                    setSelectedZoneId(zId);
                    const z = zones.find((x) => x.id === zId);
                    if (z && z.city !== "Douala" && deliveryMethod === "INTERNAL_DOUALA") {
                      setDeliveryMethod(z.city === "Yaoundé" ? "PARTNER_COURIER" : "INTERCITY_TRANSPORT");
                    }
                    if (z && !z.supportsCod && paymentMethod === "CASH_ON_DELIVERY") {
                      setPaymentMethod("ORANGE_MONEY");
                    }
                  }}
                  options={zones.map((z) => ({
                    value: z.id,
                    label: `${z.zoneName} (${formatFcfa(z.feeFcfa)})`,
                  }))}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Quartier *</label>
                <input
                  required
                  value={quarter}
                  onChange={(e) => setQuarter(e.target.value)}
                  placeholder="Ex: Bonapriso, Bastos, Makepe..."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#1E3A5F] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Indications précises de livraison (repère) *
              </label>
              <input
                required
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Ex: Face station Total, immeuble bleu 2e étage"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#1E3A5F] focus:outline-none"
              />
            </div>
          </div>

          {/* Delivery Method (Chapitre 11) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
            <h2 className="text-base font-extrabold text-[#0B192C] flex items-center gap-2">
              <Truck className="h-4 w-4 text-orange-500" /> 2. Mode de livraison (Chapitre 11)
            </h2>
            <div className="grid grid-cols-1 gap-2.5">
              {Object.entries(DELIVERY_METHOD_LABELS).map(([key, meta]) => {
                const disabled = key === "INTERNAL_DOUALA" && zone.city !== "Douala";
                return (
                  <label
                    key={key}
                    className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition ${
                      disabled
                        ? "opacity-40 cursor-not-allowed bg-slate-50 border-slate-200"
                        : deliveryMethod === key
                        ? "border-[#0B192C] bg-[#0B192C]/5"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value={key}
                      disabled={disabled}
                      checked={deliveryMethod === key}
                      onChange={() => setDeliveryMethod(key)}
                      className="mt-1"
                    />
                    <div className="flex-1 text-xs">
                      <div className="font-bold text-slate-900">{meta.label}</div>
                      <div className="text-slate-500">
                        {key === "RELAY_POINT" ? `Point relais : ${zone.relayPointName || zone.city}` : meta.description}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Payment Method (Chapitre 15) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
            <h2 className="text-base font-extrabold text-[#0B192C] flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-600" /> 3. Moyen de paiement (Chapitre 15)
            </h2>
            <div className="grid grid-cols-1 gap-2.5">
              {Object.entries(PAYMENT_METHOD_LABELS).map(([key, meta]) => {
                const isCodDisabled = key === "CASH_ON_DELIVERY" && !codAllowed;
                return (
                  <label
                    key={key}
                    className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition ${
                      isCodDisabled
                        ? "opacity-50 cursor-not-allowed bg-slate-50 border-slate-200"
                        : paymentMethod === key
                        ? "border-emerald-600 bg-emerald-50/60"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={key}
                      disabled={isCodDisabled}
                      checked={paymentMethod === key}
                      onChange={() => setPaymentMethod(key)}
                      className="mt-1"
                    />
                    <div className="flex-1 text-xs">
                      <div className="flex items-center gap-2 font-bold text-slate-900">
                        <span className="rounded bg-[#0B192C] px-1.5 py-0.5 text-[10px] text-white">
                          {meta.badge}
                        </span>
                        {meta.label}
                      </div>
                      <div className="mt-0.5 text-slate-500">
                        {isCodDisabled
                          ? `Indisponible : ${
                              hasOnOrder
                                ? "article Sur Commande dans le panier"
                                : !zone.supportsCod
                                ? `zone ${zone.city} en prépaiement uniquement`
                                : `montant > ${formatFcfa(zone.codMaxFcfa)}`
                            }`
                          : meta.feesNote}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            {(paymentMethod === "ORANGE_MONEY" || paymentMethod === "MTN_MOMO") && (
              <div className="mt-3 rounded-xl border border-orange-200 bg-orange-50/70 p-3.5 text-xs text-slate-800 space-y-1">
                <div className="font-extrabold text-[#0B192C]">
                  {paymentMethod === "ORANGE_MONEY"
                    ? "Instruction Orange Money (#150*50#)"
                    : "Instruction MTN Mobile Money (*126#)"}
                </div>
                <p className="text-slate-600">
                  Une invite de confirmation sécurisée de <strong>{formatFcfa(finalTotal)}</strong> sera envoyée sur le numéro{" "}
                  <strong>{customerPhone || "+237 6..."}</strong> dès validation.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 sticky top-28">
            <h2 className="text-lg font-extrabold text-[#0B192C]">Résumé de votre commande</h2>
            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.productId} className="flex justify-between py-2.5 text-xs">
                  <span className="font-medium text-slate-700 pr-2">
                    {item.quantity}x {item.title}
                  </span>
                  <span className="font-bold text-slate-900 tabular-nums shrink-0">
                    {formatFcfa(item.priceFcfa * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {user && user.loyaltyPoints >= 100 && (
              <label className="flex items-center justify-between rounded-xl border border-orange-200 bg-orange-50 p-3 text-xs cursor-pointer">
                <span className="flex items-center gap-2 font-semibold text-orange-900">
                  <Gift className="h-4 w-4 text-orange-500" />
                  Utiliser mes points fidélité ({user.loyaltyPoints} pts)
                </span>
                <input
                  type="checkbox"
                  checked={useLoyaltyPoints}
                  onChange={(e) => setUseLoyaltyPoints(e.target.checked)}
                />
              </label>
            )}

            <div className="space-y-2 border-t border-slate-100 pt-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Code promo (ex: ALBEDOO10)"
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold uppercase focus:border-orange-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponInput.trim()}
                  className="rounded-xl bg-[#0B192C] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#1E3A5F] disabled:opacity-50 cursor-pointer"
                >
                  {couponLoading ? "..." : "Appliquer"}
                </button>
              </div>
              {couponError && <p className="text-xs text-red-600">{couponError}</p>}
              {appliedCoupon && (
                <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                  <span>Code {appliedCoupon.code} ({appliedCoupon.label})</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedCoupon(null);
                      setCouponInput("");
                    }}
                    className="text-emerald-800 underline cursor-pointer"
                  >
                    Retirer
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-4 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Sous-total</span>
                <span className="font-semibold tabular-nums">{formatFcfa(cartTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Livraison ({zone.city})</span>
                <span className="font-semibold tabular-nums">
                  {deliveryFee === 0 ? "Gratuit (Retrait)" : formatFcfa(deliveryFee)}
                </span>
              </div>
              {loyaltyDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Remise fidélité</span>
                  <span className="tabular-nums">-{formatFcfa(loyaltyDiscount)}</span>
                </div>
              )}
              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Code promo ({appliedCoupon?.code})</span>
                  <span className="tabular-nums">-{formatFcfa(couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-extrabold text-[#0B192C]">
                <span>Total à payer</span>
                <span className="tabular-nums">{formatFcfa(finalTotal)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-4 text-sm font-bold text-white shadow-lg hover:bg-orange-600 disabled:opacity-50 transition cursor-pointer"
            >
              <ShieldCheck className="h-4 w-4" />
              {submitting ? "Traitement sécurisé..." : "Confirmer et payer"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

