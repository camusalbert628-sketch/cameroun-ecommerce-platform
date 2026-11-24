"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Loader2,
  ShieldCheck,
  Store,
  AlertCircle,
} from "lucide-react";
import { formatFcfa } from "@/lib/format";
import { useApp } from "@/components/Providers";

interface DraftSummary {
  id: string;
  status: string;
  data: {
    storeName?: string;
    customSlug?: string;
    sector?: string;
    logoUrl?: string;
    city?: string;
    country?: string;
    productMode?: string;
    initialProducts?: unknown[];
  };
}

interface PricingInfo {
  name: string;
  priceFcfa: number;
  commissionRate: number;
  durationDays: number;
  features: string[];
}

export default function BoutiqueSouscriptionPage() {
  const router = useRouter();
  const { refreshAuth, showToast } = useApp();
  const [draft, setDraft] = useState<DraftSummary | null>(null);
  const [pricing, setPricing] = useState<PricingInfo | null>(null);
  const [planKey, setPlanKey] = useState<string>("PRO");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/saas/subscriptions")
      .then(async (r) => {
        if (!r.ok) {
          const d = await r.json().catch(() => ({}));
          setError(d.error || "Aucun brouillon trouvé. Veuillez configurer votre boutique.");
          return;
        }
        const d = await r.json();
        setDraft(d.draft);
        setPricing(d.pricing);
        setPlanKey(d.planKey);
      })
      .catch(() => setError("Erreur réseau lors du chargement de votre souscription."))
      .finally(() => setLoading(false));
  }, []);

  const handleProceed = async () => {
    if (!draft) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/saas/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId: draft.id,
          activateIfFree: pricing?.priceFcfa === 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Impossible de créer la souscription.");
        return;
      }

      if (!data.requiresPayment && data.store) {
        localStorage.removeItem("albedoo_store_onboarding_draft_v1");
        await refreshAuth();
        showToast("Félicitations ! Votre boutique Starter est activée.");
        router.push("/vendeur");
        return;
      }

      router.push(`/boutique/paiement/${data.subscriptionId}`);
    } catch {
      setError("Erreur réseau lors de la création de la souscription.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center text-sm text-slate-500">
        Chargement du récapitulatif de souscription...
      </div>
    );
  }

  if (!draft || !pricing) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center space-y-4">
        <AlertCircle className="mx-auto h-10 w-10 text-amber-500" />
        <h1 className="text-xl font-extrabold text-[#0B192C]">Configuration requise</h1>
        <p className="text-sm text-slate-600">{error || "Veuillez d'abord configurer votre boutique."}</p>
        <Link
          href="/inscription-boutique"
          className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white hover:bg-orange-600"
        >
          Retour à l&apos;assistant de création
        </Link>
      </div>
    );
  }

  const productCount =
    draft.data.productMode === "CUSTOM"
      ? draft.data.initialProducts?.length || 0
      : draft.data.productMode === "DEMO"
      ? 2
      : 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
            Étape 2/3 · Souscription SaaS
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B192C] mt-1">
            Récapitulatif de votre engagement
          </h1>
        </div>
        <Link
          href="/inscription-boutique"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Modifier la boutique
        </Link>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Store Summary */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-5">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
            {draft.data.logoUrl ? (
              <img src={draft.data.logoUrl} alt="Logo" className="h-14 w-14 rounded-xl object-cover border border-slate-200" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#0B192C] text-white">
                <Store className="h-7 w-7 text-orange-400" />
              </div>
            )}
            <div>
              <h2 className="text-lg font-extrabold text-[#0B192C]">{draft.data.storeName || "Ma Boutique"}</h2>
              <p className="text-xs text-slate-500">
                {draft.data.sector} · {draft.data.city}, {draft.data.country}
              </p>
              <p className="text-xs font-bold text-orange-600 mt-0.5">/s/{draft.data.customSlug}</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Formule sélectionnée</span>
              <span className="font-extrabold text-[#0B192C]">{pricing.name} ({planKey})</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Commission sur ventes</span>
              <span className="font-bold text-emerald-700">{Math.round(pricing.commissionRate * 100)}%</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Produits pré-configurés</span>
              <span className="font-bold text-[#0B192C]">{productCount} article(s)</span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="text-xs font-extrabold text-[#0B192C]">Fonctionnalités incluses :</div>
            <ul className="space-y-1.5 text-xs text-slate-600">
              {pricing.features.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Official Server-Computed Pricing */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5 h-fit">
          <h2 className="text-base font-extrabold text-[#0B192C]">Détail tarifaire officiel</h2>

          <div className="space-y-2.5 text-sm border-b border-slate-100 pb-4">
            <div className="flex justify-between text-slate-600">
              <span>Abonnement {pricing.name}</span>
              <span className="font-semibold tabular-nums">{formatFcfa(pricing.priceFcfa)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Durée de validité</span>
              <span className="font-semibold">{pricing.durationDays} jours</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Frais de mise en service</span>
              <span className="font-semibold text-emerald-700">Offert</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-lg font-black text-[#0B192C]">
            <span>Total à payer</span>
            <span className="tabular-nums text-orange-600">{formatFcfa(pricing.priceFcfa)}</span>
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={handleProceed}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3.5 text-sm font-extrabold text-white shadow-sm hover:bg-orange-600 disabled:opacity-60 transition cursor-pointer"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            {pricing.priceFcfa === 0
              ? "Activer ma boutique Starter"
              : "Procéder au paiement sécurisé"}
            <ArrowRight className="h-4 w-4" />
          </button>

          <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            Votre boutique sera automatiquement activée dès confirmation effective du paiement.
          </p>
        </div>
      </div>
    </div>
  );
}
