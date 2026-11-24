"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, TrendingUp, ShieldCheck, ExternalLink, PauseCircle, PlayCircle } from "lucide-react";
import { formatFcfa } from "@/lib/format";
import { useApp } from "@/components/Providers";

interface TenantStoreRow {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  city: string;
  createdAt: string;
  subscriptions: { priceFcfa: number; status: string; currentPeriodEnd: string }[];
  _count: { products: number; orders: number; users: number };
}

export default function SuperAdminPage() {
  const { showToast } = useApp();
  const [stores, setStores] = useState<TenantStoreRow[]>([]);
  const [metrics, setMetrics] = useState({ totalStores: 0, activeStores: 0, mrrFcfa: 0, arrFcfa: 0 });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const res = await fetch("/api/super-admin");
    if (res.ok) {
      const data = await res.json();
      setStores(data.stores || []);
      setMetrics(data.metrics || { totalStores: 0, activeStores: 0, mrrFcfa: 0, arrFcfa: 0 });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleStatus = async (store: TenantStoreRow) => {
    const nextStatus = store.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    const res = await fetch("/api/super-admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId: store.id, status: nextStatus }),
    });
    if (res.ok) {
      showToast(`Boutique ${store.name} → ${nextStatus}`);
      loadData();
    }
  };

  if (loading) {
    return <div className="mx-auto max-w-[1680px] px-4 py-12 text-sm text-slate-500">Chargement de la console SaaS...</div>;
  }

  return (
    <div className="mx-auto max-w-[1680px] px-4 py-8 space-y-8">
      <div className="rounded-3xl bg-gradient-to-r from-[#0B192C] to-[#1E3A5F] p-8 text-white shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
            Console Super-Admin SaaS
          </span>
          <h1 className="text-3xl font-extrabold mt-1">Pilotage Multi-Boutiques &amp; Abonnements</h1>
          <p className="text-xs text-slate-300 mt-1">
            Suivi du MRR / ARR en FCFA, gestion des locataires (tenants) et conformité des boutiques.
          </p>
        </div>
        <Link
          href="/inscription-boutique"
          className="rounded-xl bg-orange-500 px-5 py-3 text-xs font-extrabold text-white hover:bg-orange-600 transition"
        >
          + Nouvelle boutique SaaS
        </Link>
      </div>

      {/* SaaS Revenue KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>MRR (Revenu Mensuel Récurrent)</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-700 tabular-nums">{formatFcfa(metrics.mrrFcfa)}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">ARR (Revenu Annuel Récurrent)</div>
          <div className="mt-2 text-2xl font-extrabold text-[#0B192C] tabular-nums">{formatFcfa(metrics.arrFcfa)}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>Boutiques Actives</span>
            <ShieldCheck className="h-4 w-4 text-[#1E3A5F]" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-[#0B192C]">{metrics.activeStores} / {metrics.totalStores}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>Architecture</span>
            <Building2 className="h-4 w-4 text-orange-500" />
          </div>
          <div className="mt-2 text-lg font-extrabold text-[#0B192C]">Multi-Tenant Isolé</div>
        </div>
      </div>

      {/* Tenant Stores Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm overflow-x-auto">
        <h2 className="text-base font-extrabold text-[#0B192C] mb-4">Boutiques Enregistrées ({stores.length})</h2>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 uppercase">
              <th className="py-3 pr-4">Boutique</th>
              <th className="py-3 pr-4">Ville</th>
              <th className="py-3 pr-4">Plan SaaS</th>
              <th className="py-3 pr-4">Abonnement</th>
              <th className="py-3 pr-4">Produits / Cmd</th>
              <th className="py-3 pr-4">Statut</th>
              <th className="py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {stores.map((s) => (
              <tr key={s.id}>
                <td className="py-3.5 pr-4">
                  <div className="font-bold text-[#0B192C] text-sm">{s.name}</div>
                  <div className="text-slate-400">/s/{s.slug}</div>
                </td>
                <td className="py-3.5 pr-4">{s.city}</td>
                <td className="py-3.5 pr-4">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-bold text-[#0B192C]">{s.plan}</span>
                </td>
                <td className="py-3.5 pr-4 font-bold tabular-nums">
                  {formatFcfa(s.subscriptions[0]?.priceFcfa ?? 0)} / mois
                </td>
                <td className="py-3.5 pr-4">
                  {s._count.products} prod. · {s._count.orders} cmd
                </td>
                <td className="py-3.5 pr-4">
                  <span
                    className={`rounded-full px-2.5 py-0.5 font-bold ${
                      s.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {s.status}
                  </span>
                </td>
                <td className="py-3.5 text-right flex justify-end gap-2">
                  <Link
                    href={`/s/${s.slug}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 font-semibold text-[#1E3A5F] hover:bg-slate-50"
                  >
                    Vitrine <ExternalLink className="h-3 w-3" />
                  </Link>
                  <button
                    onClick={() => toggleStatus(s)}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-bold text-white cursor-pointer ${
                      s.status === "ACTIVE" ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
                    }`}
                  >
                    {s.status === "ACTIVE" ? (
                      <>
                        <PauseCircle className="h-3.5 w-3.5" /> Suspendre
                      </>
                    ) : (
                      <>
                        <PlayCircle className="h-3.5 w-3.5" /> Activer
                      </>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
