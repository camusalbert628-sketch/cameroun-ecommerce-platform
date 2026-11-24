"use client";

import React, { useEffect, useState } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  Wallet,
  Users,
  BarChart3,
  MapPin,
  Layers,
  Info,
} from "lucide-react";
import { formatFcfa } from "@/lib/format";

interface AnalyticsData {
  kpis: {
    gmvFcfa: number;
    chiffreAffairesFcfa: number;
    margeBruteFcfa: number;
    beneficeNetEstimeFcfa: number;
    panierMoyenFcfa: number;
    totalOrders: number;
    validOrdersCount: number;
    tauxAnnulation: number;
    tauxRetour: number;
    delaiMoyenLivraisonHeures: number;
    tauxConversion: number;
    tauxFidelisation: number;
    cacFcfa: number;
    ltvFcfa: number;
    roas: number;
    rotationStocksJours: number;
    tresorerieDisponibleFcfa: number;
    totalStockValueFcfa: number;
    directSalesRevenue: number;
    marketplaceGmv: number;
    marketplaceCommissions: number;
    deliveryRevenue: number;
  };
  byCity: { city: string; orders: number; gmv: number }[];
  byCategory: { category: string; gmv: number; units: number }[];
  funnel?: { pageViews: number; addToCarts: number; paidOrders: number };
}

export default function DirectionPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => setData(d));
  }, []);

  if (!data) {
    return <div className="mx-auto max-w-[1680px] px-4 py-12 text-sm text-slate-500">Chargement des KPIs de direction...</div>;
  }

  const { kpis, byCity, byCategory, funnel } = data;
  const maxCityGmv = Math.max(...byCity.map((c) => c.gmv), 1);
  const maxCatGmv = Math.max(...byCategory.map((c) => c.gmv), 1);

  return (
    <div className="mx-auto max-w-[1680px] px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-[#0B192C] to-[#1E3A5F] p-6 sm:p-8 text-white shadow-lg">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
            Interface E — Collège des 4 Associés (Chapitre 7, 13.E & 25)
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1 flex items-center gap-2.5">
            <LayoutDashboard className="h-7 w-7 text-orange-400" />
            Tableau de Bord Stratégique de Direction
          </h1>
          <p className="mt-1 text-xs text-slate-300">
            Pilotage hebdomadaire et mensuel en FCFA · Distinction stricte GMV / Chiffre d&apos;affaires / Marge brute / Bénéfice net.
          </p>
        </div>
      </div>

      {/* 4 Associates Governance Bar (Chapitre 7) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { role: "Associé 1 — Directeur Général", focus: "Stratégie, Finance, Pacte & Expansion" },
          { role: "Associé 2 — Dir. Commercial & Appro.", focus: "Fournisseurs, Marges, Contrôle Qualité" },
          { role: "Associé 3 — Dir. Marketing & Comm.", focus: "CAC, ROAS, Fidélisation & Marque" },
          { role: "Associé 4 — Dir. Technique & Opérations", focus: "Plateforme, Paiements & Logistique" },
        ].map((a) => (
          <div key={a.role} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#0B192C]">
              <Users className="h-4 w-4 text-orange-500 shrink-0" />
              {a.role}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">{a.focus}</div>
          </div>
        ))}
      </div>

      {/* Primary Financial KPIs (Chapitre 6 & 25) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">GMV (Volume Brut Marchandises)</div>
          <div className="mt-2 text-2xl font-extrabold text-[#0B192C] tabular-nums">{formatFcfa(kpis.gmvFcfa)}</div>
          <div className="mt-1 text-[11px] text-slate-400">
            Σ Total commandes validées ({kpis.validOrdersCount} cmd)
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">Chiffre d&apos;Affaires Réel (CA)</div>
          <div className="mt-2 text-2xl font-extrabold text-[#1E3A5F] tabular-nums">
            {formatFcfa(kpis.chiffreAffairesFcfa)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Ventes directes + Commissions + Livraison
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">Marge Brute</div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-700 tabular-nums">
            {formatFcfa(kpis.margeBruteFcfa)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            (Ventes directes - Coût d&apos;achat) + Commissions
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">Résultat Net Estimé</div>
          <div className="mt-2 text-2xl font-extrabold text-orange-600 tabular-nums">
            {formatFcfa(kpis.beneficeNetEstimeFcfa)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Marge brute - Charges fixes mensuelles (hyp.)
          </div>
        </div>
      </div>

      {/* All Chapter 25 Operational & Marketing KPIs */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#0B192C] flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            Indicateurs de Pilotage (Chapitre 25)
          </h2>
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
            <Info className="h-3.5 w-3.5" /> Calculs temps réel + hypothèses d&apos;acquisition
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { label: "Panier Moyen", val: formatFcfa(kpis.panierMoyenFcfa), formula: "GMV / Commandes valides" },
            { label: "Taux de Conversion", val: `${kpis.tauxConversion}%`, formula: "Commandes / Visiteurs (hyp.)" },
            { label: "CAC (Coût Acq.)", val: formatFcfa(kpis.cacFcfa), formula: "Budget Mkt / Nouveaux clients" },
            { label: "LTV Client", val: formatFcfa(kpis.ltvFcfa), formula: "Panier × Fréq. × Marge" },
            { label: "ROAS Pub", val: `${kpis.roas}x`, formula: "Revenu Pub / Dépense Pub" },
            { label: "Taux d'Annulation", val: `${kpis.tauxAnnulation}%`, formula: "Annulées / Total commandes" },
            { label: "Taux de Retour", val: `${kpis.tauxRetour}%`, formula: "Retours / Commandes valides" },
            { label: "Délai Moyen Livr.", val: `${kpis.delaiMoyenLivraisonHeures}h`, formula: "Moy. Expédition → Réception" },
            { label: "Taux de Fidélisation", val: `${kpis.tauxFidelisation}%`, formula: "Clients récurrents / Total" },
            { label: "Rotation Stocks", val: `${kpis.rotationStocksJours} j`, formula: "Stock moyen / Coût ventes × 30" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-500">{item.label}</div>
              <div className="mt-1 text-lg font-extrabold text-[#0B192C] tabular-nums">{item.val}</div>
              <div className="mt-1 text-[10px] text-slate-400">{item.formula}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts: Geographic & Category & Hybrid Split */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Hybrid Model Split */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-[#0B192C] flex items-center gap-2">
            <Layers className="h-4 w-4 text-orange-500" /> Structure du Modèle Hybride
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-bold mb-1">
                <span>Vente Directe (Stock Propre)</span>
                <span className="tabular-nums">{formatFcfa(kpis.directSalesRevenue)}</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-[#0B192C] rounded-full"
                  style={{
                    width: `${Math.min(100, Math.round((kpis.directSalesRevenue / Math.max(kpis.gmvFcfa, 1)) * 100))}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-bold mb-1">
                <span>GMV Marketplace Partenaires</span>
                <span className="tabular-nums">{formatFcfa(kpis.marketplaceGmv)}</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full"
                  style={{
                    width: `${Math.min(100, Math.round((kpis.marketplaceGmv / Math.max(kpis.gmvFcfa, 1)) * 100))}%`,
                  }}
                />
              </div>
              <div className="mt-1 text-[11px] text-emerald-700 font-semibold">
                Commissions perçues : {formatFcfa(kpis.marketplaceCommissions)}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-semibold text-slate-600">
                <Wallet className="h-4 w-4 text-[#1E3A5F]" /> Trésorerie disponible
              </span>
              <span className="font-extrabold text-[#0B192C] tabular-nums">
                {formatFcfa(kpis.tresorerieDisponibleFcfa)}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>Valeur stock propre immobilisé</span>
              <span className="font-bold tabular-nums">{formatFcfa(kpis.totalStockValueFcfa)}</span>
            </div>
          </div>
        </div>

        {/* By City */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-[#0B192C] flex items-center gap-2">
            <MapPin className="h-4 w-4 text-emerald-600" /> Répartition Géographique (GMV)
          </h3>
          <div className="space-y-3 text-xs">
            {byCity.map((c) => (
              <div key={c.city}>
                <div className="flex justify-between font-semibold mb-1">
                  <span>{c.city} ({c.orders} cmd)</span>
                  <span className="font-bold tabular-nums">{formatFcfa(c.gmv)}</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full"
                    style={{ width: `${Math.round((c.gmv / maxCityGmv) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By Category */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-[#0B192C] flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[#1E3A5F]" /> Ventes par Catégorie
          </h3>
          <div className="space-y-3 text-xs">
            {byCategory.map((c) => (
              <div key={c.category}>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="truncate pr-2">{c.category}</span>
                  <span className="font-bold tabular-nums shrink-0">{formatFcfa(c.gmv)}</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-[#1E3A5F] rounded-full"
                    style={{ width: `${Math.round((c.gmv / maxCatGmv) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Real Conversion Funnel */}
      {funnel && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-[#0B192C]">
            Entonnoir de Conversion Temps Réel (Tracking SaaS)
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
              <div className="text-xs font-semibold text-slate-500">1. Vues Fiches Produits</div>
              <div className="mt-1 text-2xl font-extrabold text-[#0B192C] tabular-nums">{funnel.pageViews}</div>
            </div>
            <div className="rounded-xl bg-orange-50 p-4 border border-orange-200">
              <div className="text-xs font-semibold text-orange-700">2. Ajouts au Panier</div>
              <div className="mt-1 text-2xl font-extrabold text-orange-600 tabular-nums">{funnel.addToCarts}</div>
            </div>
            <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-200">
              <div className="text-xs font-semibold text-emerald-700">3. Commandes Enregistrées</div>
              <div className="mt-1 text-2xl font-extrabold text-emerald-700 tabular-nums">{funnel.paidOrders}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

