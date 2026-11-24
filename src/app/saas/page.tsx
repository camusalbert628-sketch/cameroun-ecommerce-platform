import React from "react";
import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Store,
  ShieldCheck,
  CreditCard,
  BarChart3,
  Globe,
  ExternalLink,
} from "lucide-react";

const PLANS = [
  {
    name: "Starter",
    price: "0 FCFA",
    period: "/ mois",
    commission: "5% par vente",
    desc: "Idéal pour tester votre activité en ligne sans frais fixes.",
    features: [
      "Vitrine complète identique à Albedo'o",
      "Jusqu'à 50 produits & variantes",
      "Paiements Orange Money, MTN MoMo & COD",
      "Gestion automatique des ruptures de stock",
    ],
  },
  {
    name: "Pro",
    price: "15 000 FCFA",
    period: "/ mois",
    commission: "2% par vente",
    recommended: true,
    desc: "Pour les boutiques en croissance cherchant performance et autonomie.",
    features: [
      "Produits & variantes illimités",
      "Domaine personnalisé (ex: boutique.mamarque.cm)",
      "Notifications WhatsApp & Email automatisées",
      "Tableau de bord KPIs & Entonnoir de conversion",
    ],
  },
  {
    name: "Business",
    price: "45 000 FCFA",
    period: "/ mois",
    commission: "0% commission",
    desc: "Pour les entreprises établies et distributeurs multi-villes.",
    features: [
      "0% de commission sur toutes vos ventes",
      "Multi-utilisateurs (Logistique, Admin, Direction)",
      "Facturation DGI / OHADA & SAV structuré",
      "Support prioritaire & intégration API",
    ],
  },
];

export default function SaasLandingPage() {
  return (
    <div className="bg-slate-50 pb-16">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0B192C] via-[#122643] to-[#1E3A5F] text-white py-16">
        <div className="mx-auto max-w-[1680px] px-4 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-orange-500/20 border border-orange-400/30 px-3.5 py-1 text-xs font-bold text-orange-300">
              <Sparkles className="h-3.5 w-3.5" />
              Services SaaS Albedo&apos;o
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight">
              Lancez votre propre boutique en ligne avec le <span className="text-orange-400">même rendu qu&apos;Albedo&apos;o</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              En plus d&apos;être votre boutique en ligne de référence au Cameroun, Albedo&apos;o met sa technologie complète à votre service : créez votre boutique en 2 minutes et profitez de la même interface Amazon-grade, des paiements Mobile Money et du suivi logistique.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/inscription-boutique"
                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3.5 text-sm font-extrabold text-white shadow-lg hover:bg-orange-600 transition"
              >
                Créer ma boutique maintenant <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/s/kamertech"
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-bold text-white hover:bg-white/20 transition"
              >
                Voir un exemple de boutique client <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 grid grid-cols-2 gap-4">
            {[
              { icon: Store, title: "Même rendu que Albedo'o", desc: "Carrousels, Quadrants, Fiches A+ & Zoom inclus" },
              { icon: CreditCard, title: "OM · MoMo · Visa", desc: "Encaissement local & Paiement à la livraison" },
              { icon: ShieldCheck, title: "Stocks & Variantes", desc: "Blocage ruptures & alertes automatiques" },
              { icon: Globe, title: "Domaine Propre", desc: "Votre marque blanche en .cm ou .com" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur-xs">
                  <Icon className="h-6 w-6 text-orange-400 mb-2.5" />
                  <div className="text-sm font-extrabold">{item.title}</div>
                  <p className="mt-1 text-xs text-slate-300">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="mx-auto max-w-[1680px] px-4 mt-14">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B192C]">
            Tarifs transparents en FCFA
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Démarrez gratuitement avec Starter et évoluez à votre rythme vers Pro ou Business.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`rounded-3xl border bg-white p-7 shadow-sm flex flex-col justify-between ${
                p.recommended ? "border-orange-500 ring-2 ring-orange-500/20 shadow-xl" : "border-slate-200"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-extrabold text-[#0B192C]">{p.name}</h3>
                  {p.recommended && (
                    <span className="rounded-full bg-orange-500 px-3 py-0.5 text-[10px] font-extrabold text-white">
                      Populaire
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-[#0B192C]">{p.price}</span>
                  <span className="text-xs text-slate-500">{p.period}</span>
                </div>
                <div className="mt-1 text-xs font-bold text-emerald-700">{p.commission}</div>
                <p className="mt-3 text-xs text-slate-600">{p.desc}</p>

                <ul className="mt-5 space-y-2.5 text-xs text-slate-700">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href="/inscription-boutique"
                className={`mt-7 block w-full rounded-xl py-3 text-center text-xs font-extrabold transition ${
                  p.recommended
                    ? "bg-orange-500 text-white hover:bg-orange-600"
                    : "bg-[#0B192C] text-white hover:bg-[#1E3A5F]"
                }`}
              >
                Choisir {p.name}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Live Demo Storefronts */}
      <section className="mx-auto max-w-5xl px-4 mt-14">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-orange-500" />
            <div>
              <div className="text-sm font-extrabold text-[#0B192C]">Exemples de boutiques en ligne actives</div>
              <div className="text-xs text-slate-500">Toutes propulsées par le même moteur visuel Albedo&apos;o</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            <Link href="/s/albedoo" className="rounded-lg bg-[#0B192C] px-4 py-2 text-white hover:bg-[#1E3A5F]">
              Boutique Albedo&apos;o
            </Link>
            <Link href="/s/kamertech" className="rounded-lg border border-slate-200 px-4 py-2 text-[#0B192C] hover:bg-slate-50">
              Boutique KamerTech
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
