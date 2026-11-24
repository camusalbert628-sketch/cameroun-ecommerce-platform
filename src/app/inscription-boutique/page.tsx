"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Store, CheckCircle2, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
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
    features: ["Produits & variantes illimités", "Tableau de bord KPIs & Stocks", "Badge Partenaire Vérifié + Support prioritaire"],
  },
  {
    id: "BUSINESS",
    name: "Business",
    price: "45 000 FCFA / mois",
    commission: "0% commission",
    features: ["0% de commission sur ventes", "Multi-utilisateurs & Hub Logistique", "Domaine personnalisé & API"],
  },
];

export default function InscriptionBoutiquePage() {
  const { refreshAuth, showToast } = useApp();
  const router = useRouter();

  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("+237 6");
  const [storeName, setStoreName] = useState("");
  const [tagline, setTagline] = useState("");
  const [city, setCity] = useState("Douala");
  const [primaryColor, setPrimaryColor] = useState("#0B192C");
  const [rccm, setRccm] = useState("");
  const [plan, setPlan] = useState("PRO");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          tagline,
          city,
          primaryColor,
          rccm,
          plan,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Impossible de créer votre boutique.");
      } else {
        await refreshAuth();
        showToast(`Boutique « ${data.store.name} » créée avec succès !`);
        router.push(`/s/${data.store.slug}`);
      }
    } catch {
      setError("Erreur réseau lors de la création.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
      <div className="rounded-3xl bg-gradient-to-r from-[#0B192C] to-[#1E3A5F] p-8 text-white shadow-xl">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-orange-300 mb-3">
          <Sparkles className="h-3.5 w-3.5" /> Plateforme SaaS Multi-Boutiques · Albedo&apos;o
        </div>
        <h1 className="text-3xl font-extrabold">Créez votre boutique en ligne au Cameroun en 2 minutes</h1>
        <p className="mt-2 text-sm text-slate-300 max-w-2xl">
          Lancez votre vitrine professionnelle avec gestion des variantes, alertes de rupture de stock, paiements Orange Money / MTN MoMo et facturation OHADA.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1 & 2 */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-[#0B192C] flex items-center gap-2">
              <Store className="h-4 w-4 text-orange-500" /> 2. Identité de la Boutique
            </h2>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nom commercial de la boutique *</label>
              <input
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Ex: Douala Tech Store"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Slogan / Description courte</label>
              <input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Ex: Smartphones et accessoires certifiés à Akwa"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ville principale</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                >
                  <option value="Douala">Douala</option>
                  <option value="Yaoundé">Yaoundé</option>
                  <option value="Bafoussam">Bafoussam</option>
                  <option value="Kribi">Kribi</option>
                  <option value="Garoua">Garoua</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Couleur de marque</label>
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 p-1 cursor-pointer"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">RCCM (Optionnel)</label>
              <input
                value={rccm}
                onChange={(e) => setRccm(e.target.value)}
                placeholder="Ex: RC/DLA/2026/B/1234"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
              />
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
