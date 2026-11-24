"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Store,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Palette,
  Globe,
  Eye,
  AlertCircle,
} from "lucide-react";
import { useApp } from "@/components/Providers";

const PLANS = [
  {
    id: "STARTER",
    name: "Starter",
    price: "0 FCFA / mois",
    commission: "5% par vente",
    features: ["Jusqu'à 50 produits & variantes", "Vitrine dédiée /s/votre-boutique", "Paiements OM, MoMo & COD"],
  },
  {
    id: "PRO",
    name: "Pro",
    price: "15 000 FCFA / mois",
    commission: "2% par vente",
    recommended: true,
    features: ["Produits & variantes illimités", "Tableau de bord KPIs & Stocks", "Badge Partenaire Vérifié + Domaine perso"],
  },
  {
    id: "BUSINESS",
    name: "Business",
    price: "45 000 FCFA / mois",
    commission: "0% commission",
    features: ["0% de commission sur ventes", "Multi-utilisateurs & Hub Logistique", "Domaine personnalisé & API prioritaire"],
  },
];

const THEME_PRESETS = [
  { name: "Albedo'o", primary: "#0B192C", accent: "#F97316" },
  { name: "Luxe Or", primary: "#111827", accent: "#D97706" },
  { name: "Terroir Vert", primary: "#064E3B", accent: "#10B981" },
  { name: "Tech Indigo", primary: "#1E1B4B", accent: "#6366F1" },
];

function toSlug(val: string) {
  return val
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function InscriptionBoutiquePage() {
  const { refreshAuth, showToast } = useApp();
  const router = useRouter();

  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("+237 6");
  const [storeName, setStoreName] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  const [tagline, setTagline] = useState("");
  const [city, setCity] = useState("Douala");
  const [primaryColor, setPrimaryColor] = useState("#0B192C");
  const [accentColor, setAccentColor] = useState("#F97316");
  const [rccm, setRccm] = useState("");
  const [niu, setNiu] = useState("");
  const [plan, setPlan] = useState("PRO");
  const [seedSampleProducts, setSeedSampleProducts] = useState(true);
  const [afterCreateTarget, setAfterCreateTarget] = useState<"storefront" | "dashboard">("storefront");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slugEdited) {
      setCustomSlug(toSlug(storeName));
    }
  }, [storeName, slugEdited]);

  useEffect(() => {
    const clean = toSlug(customSlug);
    if (clean.length < 3) {
      setSlugStatus("idle");
      return;
    }
    setSlugStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/stores?checkSlug=${encodeURIComponent(clean)}`);
        if (res.ok) {
          const data = await res.json();
          setSlugStatus(data.available ? "available" : "taken");
        }
      } catch {
        setSlugStatus("idle");
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [customSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerName,
          email,
          password,
          phone,
          storeName,
          customSlug: toSlug(customSlug),
          tagline,
          city,
          primaryColor,
          accentColor,
          rccm,
          niu,
          plan,
          seedSampleProducts,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Impossible de créer votre boutique.");
      } else {
        await refreshAuth();
        showToast(`Boutique « ${data.store.name} » créée avec succès !`);
        router.push(afterCreateTarget === "dashboard" ? "/vendeur" : `/s/${data.store.slug}`);
      }
    } catch {
      setError("Erreur réseau lors de la création.");
    } finally {
      setSubmitting(false);
    }
  };

  const previewSlug = toSlug(customSlug) || "ma-boutique";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      <div className="rounded-3xl bg-gradient-to-r from-[#0B192C] to-[#1E3A5F] p-8 text-white shadow-xl">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-orange-300 mb-3">
          <Sparkles className="h-3.5 w-3.5" /> Plateforme SaaS Multi-Boutiques · Albedo&apos;o
        </div>
        <h1 className="text-3xl font-extrabold">Créez votre boutique en ligne au Cameroun en 2 minutes</h1>
        <p className="mt-2 text-sm text-slate-300 max-w-2xl">
          Lancez votre vitrine personnalisée avec le rendu Albedo&apos;o, gestion des variantes, paiements Orange Money / MTN MoMo, codes promo et facturation OHADA.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Form Columns */}
          <div className="lg:col-span-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Step 1: Account */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h2 className="text-base font-extrabold text-[#0B192C]">1. Compte Dirigeant</h2>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nom complet *</label>
                <input
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Ex: Marc Fotso"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email professionnel *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@maboutique.cm"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mot de passe (min. 6 car.) *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Téléphone WhatsApp / MoMo</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">RCCM (Optionnel)</label>
                  <input
                    value={rccm}
                    onChange={(e) => setRccm(e.target.value)}
                    placeholder="RC/DLA/2026/..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">NIU (Optionnel)</label>
                  <input
                    value={niu}
                    onChange={(e) => setNiu(e.target.value)}
                    placeholder="M0326..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Store Identity */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h2 className="text-base font-extrabold text-[#0B192C] flex items-center gap-2">
                <Store className="h-4 w-4 text-orange-500" /> 2. Identité &amp; Design
              </h2>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nom de la boutique *</label>
                <input
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Ex: Douala Tech Store"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Adresse de votre boutique
                </label>
                <div className="flex items-center rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                  <span className="px-2.5 text-xs font-semibold text-slate-500 border-r border-slate-200">
                    /s/
                  </span>
                  <input
                    value={customSlug}
                    onChange={(e) => {
                      setSlugEdited(true);
                      setCustomSlug(toSlug(e.target.value));
                    }}
                    placeholder="douala-tech-store"
                    className="flex-1 bg-white px-2.5 py-2 text-xs font-bold text-[#0B192C] focus:outline-none"
                  />
                </div>
                {slugStatus === "available" && (
                  <p className="mt-1 text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> /s/{previewSlug} est disponible
                  </p>
                )}
                {slugStatus === "taken" && (
                  <p className="mt-1 text-[11px] font-semibold text-amber-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Déjà utilisé — un suffixe unique sera ajouté
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Slogan</label>
                <input
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Ex: Smartphones certifiés à Akwa"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ville principale</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm"
                >
                  <option value="Douala">Douala</option>
                  <option value="Yaoundé">Yaoundé</option>
                  <option value="Bafoussam">Bafoussam</option>
                  <option value="Kribi">Kribi</option>
                  <option value="Garoua">Garoua</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Palette className="h-3.5 w-3.5 text-orange-500" /> Palettes rapides
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {THEME_PRESETS.map((t) => (
                    <button
                      key={t.name}
                      type="button"
                      onClick={() => {
                        setPrimaryColor(t.primary);
                        setAccentColor(t.accent);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-bold hover:bg-slate-50 cursor-pointer"
                    >
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: t.primary }} />
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: t.accent }} />
                      {t.name}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[11px] text-slate-500">Couleur principale</span>
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="mt-1 h-9 w-full rounded-xl border border-slate-200 p-1 cursor-pointer"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500">Couleur d&apos;accent</span>
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="mt-1 h-9 w-full rounded-xl border border-slate-200 p-1 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Live Preview Column */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 sticky top-24">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-orange-500" /> Aperçu en direct
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                  <Globe className="h-3 w-3" /> /s/{previewSlug}
                </span>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                <div className="p-4 text-white" style={{ backgroundColor: primaryColor }}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold truncate">
                      {storeName.trim() || "Ma Boutique Cameroun"}
                    </span>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-extrabold text-white"
                      style={{ backgroundColor: accentColor }}
                    >
                      {plan}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-white/80 truncate">
                    {tagline.trim() || `Boutique officielle à ${city}`}
                  </p>
                </div>
                <div className="p-3 grid grid-cols-2 gap-2">
                  {[1, 2].map((idx) => (
                    <div key={idx} className="rounded-lg bg-white p-2 border border-slate-200">
                      <div className="h-14 rounded bg-slate-100 mb-2 flex items-center justify-center text-[10px] text-slate-400">
                        Produit {idx}
                      </div>
                      <div className="h-2.5 w-3/4 rounded bg-slate-200 mb-1.5" />
                      <div
                        className="rounded px-2 py-1 text-center text-[10px] font-bold text-white"
                        style={{ backgroundColor: accentColor }}
                      >
                        Ajouter
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={seedSampleProducts}
                  onChange={(e) => setSeedSampleProducts(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  <strong className="text-[#0B192C]">Pré-remplir avec 2 produits démo</strong>
                  <span className="block text-[11px] text-slate-500">
                    Votre vitrine est immédiatement présentable et modifiable dans /vendeur.
                  </span>
                </span>
              </label>

              <div className="space-y-1.5 text-xs">
                <span className="font-bold text-slate-700">Après création, ouvrir :</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAfterCreateTarget("storefront")}
                    className={`rounded-xl border px-3 py-2 text-[11px] font-bold cursor-pointer ${
                      afterCreateTarget === "storefront"
                        ? "border-orange-500 bg-orange-50 text-orange-700"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    Ma Vitrine
                  </button>
                  <button
                    type="button"
                    onClick={() => setAfterCreateTarget("dashboard")}
                    className={`rounded-xl border px-3 py-2 text-[11px] font-bold cursor-pointer ${
                      afterCreateTarget === "dashboard"
                        ? "border-orange-500 bg-orange-50 text-orange-700"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    Espace Vendeur
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: SaaS Plan */}
        <div className="space-y-4">
          <h2 className="text-lg font-extrabold text-[#0B192C]">3. Choisissez votre Plan SaaS</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {PLANS.map((p) => {
              const selected = plan === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlan(p.id)}
                  className={`text-left rounded-2xl border p-6 transition cursor-pointer ${
                    selected
                      ? "border-orange-500 bg-orange-50/50 ring-2 ring-orange-500/20 shadow-md"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base font-extrabold text-[#0B192C]">{p.name}</span>
                    {p.recommended && (
                      <span className="rounded-full bg-orange-500 px-2.5 py-0.5 text-[10px] font-extrabold text-white">
                        Recommandé
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-2xl font-black text-[#0B192C]">{p.price}</div>
                  <div className="text-xs font-bold text-emerald-700 mt-0.5">{p.commission}</div>
                  <ul className="mt-4 space-y-2 text-xs text-slate-600">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-4 text-sm font-extrabold text-white shadow-lg hover:bg-orange-600 disabled:opacity-50 transition cursor-pointer"
        >
          <ShieldCheck className="h-5 w-5" />
          {submitting ? "Création de votre espace SaaS..." : "Lancer ma boutique maintenant"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
