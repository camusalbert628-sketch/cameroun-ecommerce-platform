"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Upload,
  ShieldCheck,
  Loader2,
  Building2,
  Smartphone,
  CreditCard,
  RefreshCw,
} from "lucide-react";
import { formatFcfa } from "@/lib/format";
import { useApp } from "@/components/Providers";

type MethodId = "ORANGE_MONEY" | "MTN_MOMO" | "VISA" | "MASTERCARD" | "BANK_TRANSFER";

interface PaymentRecord {
  id: string;
  method: string;
  reference: string;
  amountFcfa: number;
  status: string;
  proofUrl: string | null;
  reviewNote: string | null;
  createdAt: string;
}

interface SubscriptionPayload {
  id: string;
  plan: string;
  priceFcfa: number;
  status: string;
  store: { id: string; name: string; slug: string; status: string } | null;
  payments: PaymentRecord[];
}

interface ProvidersInfo {
  mobileMoneyConfigured: boolean;
  cardConfigured: boolean;
  bankTransferConfigured: boolean;
  gatewayName: string | null;
  bankDetails: {
    bankName: string;
    beneficiary: string;
    accountNumber: string;
    swift: string;
  };
}

export default function BoutiquePaiementPage({
  params,
}: {
  params: Promise<{ subscriptionId: string }>;
}) {
  const { subscriptionId } = use(params);
  const router = useRouter();
  const { refreshAuth, showToast } = useApp();

  const [subscription, setSubscription] = useState<SubscriptionPayload | null>(null);
  const [providers, setProviders] = useState<ProvidersInfo | null>(null);
  const [method, setMethod] = useState<MethodId>("ORANGE_MONEY");
  const [phone, setPhone] = useState("+237 6");
  const [proofUrl, setProofUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = async () => {
    try {
      const res = await fetch(`/api/saas/payments?subscriptionId=${encodeURIComponent(subscriptionId)}`);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Souscription introuvable.");
        return;
      }
      const data = await res.json();
      setSubscription(data.subscription);
      setProviders(data.providers);

      if (data.subscription?.store?.slug) {
        localStorage.removeItem("albedoo_store_onboarding_draft_v1");
        await refreshAuth();
        showToast("Félicitations ! Votre boutique a été créée avec succès. Bienvenue dans COMMERCIA.");
        router.push("/vendeur");
      }
    } catch {
      setError("Erreur de chargement du paiement.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, [subscriptionId]);

  const handleUploadProof = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload?scope=payment-proof", { method: "POST", body: fd });
      const d = await res.json();
      if (!res.ok) setError(d.error || "Erreur téléversement justificatif.");
      else {
        setProofUrl(d.url);
        showToast("Justificatif téléversé.");
      }
    } catch {
      setError("Erreur réseau lors du téléversement.");
    } finally {
      setUploading(false);
    }
  };

  const handlePay = async () => {
    if (!subscription) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/saas/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId: subscription.id,
          method,
          phone,
          proofUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Impossible d'initier le paiement.");
        return;
      }

      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
        return;
      }

      await loadStatus();
      showToast("Justificatif transmis pour vérification administrative.");
    } catch {
      setError("Erreur réseau lors du paiement.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center text-sm text-slate-500">
        Chargement de l&apos;interface de paiement...
      </div>
    );
  }

  if (!subscription || !providers) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center space-y-4">
        <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
        <h1 className="text-xl font-extrabold text-[#0B192C]">Accès impossible</h1>
        <p className="text-sm text-slate-600">{error}</p>
        <Link href="/inscription-boutique" className="inline-block rounded-xl bg-[#0B192C] px-5 py-3 text-xs font-bold text-white">
          Retour à la création de boutique
        </Link>
      </div>
    );
  }

  const latestPayment = subscription.payments[0];
  const methods: {
    id: MethodId;
    title: string;
    subtitle: string;
    badge: string;
    available: boolean;
    icon: React.ElementType;
  }[] = [
    {
      id: "ORANGE_MONEY",
      title: "Orange Money",
      subtitle: "Paiement mobile instantané (#150#)",
      badge: providers.mobileMoneyConfigured ? providers.gatewayName || "Actif" : "Clé API requise",
      available: providers.mobileMoneyConfigured,
      icon: Smartphone,
    },
    {
      id: "MTN_MOMO",
      title: "MTN Mobile Money",
      subtitle: "Paiement mobile MoMo (*126#)",
      badge: providers.mobileMoneyConfigured ? providers.gatewayName || "Actif" : "Clé API requise",
      available: providers.mobileMoneyConfigured,
      icon: Smartphone,
    },
    {
      id: "VISA",
      title: "Carte Visa",
      subtitle: "Paiement sécurisé 3D Secure",
      badge: providers.cardConfigured ? providers.gatewayName || "Actif" : "Clé API requise",
      available: providers.cardConfigured,
      icon: CreditCard,
    },
    {
      id: "MASTERCARD",
      title: "Mastercard",
      subtitle: "Paiement international sécurisé",
      badge: providers.cardConfigured ? providers.gatewayName || "Actif" : "Clé API requise",
      available: providers.cardConfigured,
      icon: CreditCard,
    },
    {
      id: "BANK_TRANSFER",
      title: "Virement Bancaire",
      subtitle: "Transfert + justificatif vérifié par admin",
      badge: "Opérationnel",
      available: true,
      icon: Building2,
    },
  ];

  const selectedMeta = methods.find((m) => m.id === method)!;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
            Étape 3/3 · Paiement Obligatoire
          </span>
          <h1 className="text-2xl font-extrabold text-[#0B192C]">
            Finaliser votre souscription {subscription.plan}
          </h1>
        </div>
        <button
          type="button"
          onClick={loadStatus}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Vérifier le statut
        </button>
      </div>

      {/* Status Banners (Module 7) */}
      {latestPayment?.status === "MANUAL_REVIEW" && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-800 flex items-start gap-3">
          <Clock className="h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <div className="font-extrabold">Virement bancaire en attente de vérification</div>
            <p className="mt-0.5">
              Référence : <strong>{latestPayment.reference}</strong>. Votre justificatif a été transmis. Un administrateur va vérifier le virement avant d&apos;activer votre boutique.
            </p>
          </div>
        </div>
      )}

      {(latestPayment?.status === "PENDING" || latestPayment?.status === "PROCESSING") && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-xs font-semibold text-blue-800 flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin shrink-0" />
          Nous attendons la confirmation de votre paiement ({latestPayment.reference}). Cliquez sur « Vérifier le statut » après validation sur votre téléphone.
        </div>
      )}

      {(latestPayment?.status === "FAILED" || latestPayment?.status === "CANCELLED") && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            Votre paiement n&apos;a pas abouti ({latestPayment.status}). Votre configuration est conservée, vous pouvez réessayer ci-dessous.
            {latestPayment.reviewNote && <div className="mt-1">Note : {latestPayment.reviewNote}</div>}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Payment Method Selection */}
        <div className="lg:col-span-7 space-y-3">
          <h2 className="text-sm font-extrabold text-[#0B192C]">Choisissez un moyen de paiement</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {methods.map((m) => {
              const Icon = m.icon;
              const selected = method === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethod(m.id)}
                  className={`text-left rounded-2xl border p-4 transition cursor-pointer ${
                    selected
                      ? "border-orange-500 bg-orange-50/50 ring-2 ring-orange-500/20"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Icon className={`h-5 w-5 ${selected ? "text-orange-600" : "text-slate-500"}`} />
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        m.available ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {m.badge}
                    </span>
                  </div>
                  <div className="mt-2 text-sm font-extrabold text-[#0B192C]">{m.title}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{m.subtitle}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Method Action Box */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5 h-fit">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-slate-500">Montant à régler</span>
            <span className="text-xl font-black text-orange-600 tabular-nums">
              {formatFcfa(subscription.priceFcfa)}
            </span>
          </div>

          {method === "BANK_TRANSFER" ? (
            <div className="space-y-3 text-xs">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-1.5">
                <div><strong>Banque :</strong> {providers.bankDetails.bankName}</div>
                <div><strong>Bénéficiaire :</strong> {providers.bankDetails.beneficiary}</div>
                <div><strong>Compte / RIB :</strong> {providers.bankDetails.accountNumber}</div>
                <div><strong>Code SWIFT :</strong> {providers.bankDetails.swift}</div>
                <div><strong>Montant exact :</strong> {formatFcfa(subscription.priceFcfa)}</div>
                <div><strong>Référence à indiquer :</strong> SAAS-{subscription.id.slice(-6).toUpperCase()}</div>
              </div>

              <label className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-100">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 text-orange-500" />}
                {proofUrl ? "Justificatif prêt ✓ (Changer)" : "Téléverser le justificatif de virement"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUploadProof(f);
                  }}
                />
              </label>
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              {(method === "ORANGE_MONEY" || method === "MTN_MOMO") && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Numéro Mobile Money</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+237 6XX XXX XXX"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  />
                </div>
              )}
              {!selectedMeta.available && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-amber-800">
                  Ce moyen de paiement nécessite la configuration de <strong>NOTCHPAY_PUBLIC_KEY</strong> ou <strong>CINETPAY_API_KEY + CINETPAY_SITE_ID</strong>. Vous pouvez utiliser le <strong>Virement Bancaire</strong> dès maintenant.
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            disabled={submitting || (!selectedMeta.available && method !== "BANK_TRANSFER")}
            onClick={handlePay}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3.5 text-sm font-extrabold text-white shadow-sm hover:bg-orange-600 disabled:opacity-50 transition cursor-pointer"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {method === "BANK_TRANSFER"
              ? "Soumettre mon justificatif de virement"
              : `Payer avec ${selectedMeta.title}`}
          </button>

          <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            Aucune donnée bancaire n&apos;est stockée sur nos serveurs.
          </p>
        </div>
      </div>
    </div>
  );
}
