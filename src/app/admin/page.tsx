"use client";

import React, { useEffect, useState } from "react";
import { Settings, ShieldCheck, XCircle, CheckCircle2, MessageSquareWarning } from "lucide-react";
import { useApp } from "@/components/Providers";
import { formatFcfa, ORDER_STATUS_META } from "@/lib/format";

interface AdminProduct {
  id: string;
  title: string;
  sku: string;
  priceFcfa: number;
  stock: number;
  salesModel: string;
  qualityStatus: string;
  vendor?: { companyName: string } | null;
  category: { name: string };
  variants?: { id: string; label: string; stock: number }[];
}

interface AdminClaim {
  id: string;
  ticketNumber: string;
  type: string;
  status: string;
  reason: string;
  refundAmountFcfa: number;
  order: { orderNumber: string; customerName: string; totalFcfa: number; city: string };
}

interface AdminOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  city: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  totalFcfa: number;
}

export default function AdminPage() {
  const { user, switchDemoUser, showToast } = useApp();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [claims, setClaims] = useState<AdminClaim[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);

  const hasAccess = user && ["ADMIN", "EXECUTIVE"].includes(user.role);

  const loadAll = async () => {
    const [pRes, cRes, oRes] = await Promise.all([
      fetch("/api/products?includeAll=true"),
      fetch("/api/claims"),
      fetch("/api/orders"),
    ]);
    if (pRes.ok) setProducts((await pRes.json()).products || []);
    if (cRes.ok) setClaims((await cRes.json()).claims || []);
    if (oRes.ok) setOrders((await oRes.json()).orders || []);
  };

  useEffect(() => {
    if (hasAccess) loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!hasAccess) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
          <Settings className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-extrabold text-[#0B192C]">Interface Administrateur (Chap. 13.B)</h1>
        <p className="text-sm text-slate-600">
          Activez le profil Administrateur pour valider le contrôle qualité des produits partenaires, gérer les litiges SAV et superviser les commandes.
        </p>
        <button
          onClick={() => switchDemoUser("admin@exemple.cm")}
          className="rounded-xl bg-[#0B192C] px-6 py-3 text-sm font-bold text-white hover:bg-[#1E3A5F] cursor-pointer"
        >
          Activer : Clarisse Tchoumi (Administratrice)
        </button>
      </div>
    );
  }

  const handleQcUpdate = async (id: string, qualityStatus: "APPROVED" | "REJECTED") => {
    const res = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qualityStatus }),
    });
    if (res.ok) {
      showToast(`Produit ${qualityStatus === "APPROVED" ? "approuvé et publié" : "rejeté"}.`);
      loadAll();
    }
  };

  const handleResolveClaim = async (id: string, status: "RESOLVED" | "REJECTED") => {
    const res = await fetch("/api/claims", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        status,
        resolutionNote:
          status === "RESOLVED"
            ? "Ticket clôturé et remboursement/échange validé par l'administrateur."
            : "Demande non éligible selon les CGV.",
      }),
    });
    if (res.ok) {
      showToast(`Ticket SAV mis à jour (${status}).`);
      loadAll();
    }
  };

  const pendingProducts = products.filter((p) => p.qualityStatus === "PENDING_QC");

  const outOfStockAlerts: string[] = [];
  products.forEach((p) => {
    if (p.variants && p.variants.length > 0) {
      p.variants.forEach((v) => {
        if (v.stock <= 0) outOfStockAlerts.push(`Variante épuisée : ${v.label} (${p.title})`);
      });
    } else if (p.stock <= 0) {
      outOfStockAlerts.push(`Produit épuisé : ${p.title}`);
    }
  });

  return (
    <div className="mx-auto max-w-[1680px] px-4 py-8 space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-sky-600">
          Interface B — Administration & Contrôle Qualité (Chapitre 10, 12 & 13.B)
        </span>
        <h1 className="text-3xl font-extrabold text-[#0B192C]">Console d&apos;Administration Plateforme</h1>
      </div>

      {outOfStockAlerts.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-xs text-red-800 space-y-1">
          <div className="font-extrabold text-sm">Alertes Ruptures de Stock ({outOfStockAlerts.length})</div>
          {outOfStockAlerts.map((m) => (
            <div key={m} className="font-semibold">• {m}</div>
          ))}
        </div>
      )}

      {/* Pending QC Queue */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-extrabold text-[#0B192C] flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-amber-600" />
          File de Contrôle Qualité Avant Publication ({pendingProducts.length})
        </h2>
        {pendingProducts.length === 0 ? (
          <p className="text-xs text-slate-600">Tous les produits soumis ont été contrôlés.</p>
        ) : (
          <div className="space-y-3">
            {pendingProducts.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-4 border border-amber-200"
              >
                <div className="text-xs">
                  <div className="text-sm font-bold text-slate-900">{p.title}</div>
                  <div className="text-slate-500">
                    {p.category.name} · Vendeur : <strong>{p.vendor?.companyName || "Interne"}</strong> ·{" "}
                    {formatFcfa(p.priceFcfa)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleQcUpdate(p.id, "APPROVED")}
                    className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Approuver & Publier
                  </button>
                  <button
                    onClick={() => handleQcUpdate(p.id, "REJECTED")}
                    className="inline-flex items-center gap-1 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-red-700 cursor-pointer"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Rejeter
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SAV & Claims */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-base font-extrabold text-[#0B192C] flex items-center gap-2">
          <MessageSquareWarning className="h-5 w-5 text-orange-500" />
          Gestion des Réclamations, Retours & Remboursements ({claims.length})
        </h2>
        <div className="divide-y divide-slate-100">
          {claims.map((c) => (
            <div key={c.id} className="py-4 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-[#0B192C] text-sm">{c.ticketNumber}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-bold text-slate-700">{c.type}</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 font-bold ${
                      c.status === "RESOLVED"
                        ? "bg-emerald-100 text-emerald-800"
                        : c.status === "REJECTED"
                        ? "bg-red-100 text-red-800"
                        : "bg-orange-100 text-orange-800"
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
                <div className="text-slate-600">
                  Commande <strong>{c.order.orderNumber}</strong> · {c.order.customerName} ({c.order.city}) ·{" "}
                  Montant : <strong>{formatFcfa(c.order.totalFcfa)}</strong>
                </div>
                <p className="text-slate-800">{c.reason}</p>
              </div>
              {c.status !== "RESOLVED" && c.status !== "REJECTED" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleResolveClaim(c.id, "RESOLVED")}
                    className="rounded-xl bg-emerald-600 px-3.5 py-2 font-bold text-white hover:bg-emerald-700 cursor-pointer"
                  >
                    Valider & Rembourser
                  </button>
                  <button
                    onClick={() => handleResolveClaim(c.id, "REJECTED")}
                    className="rounded-xl border border-slate-200 px-3.5 py-2 font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Rejeter
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* All Orders Overview */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-base font-extrabold text-[#0B192C]">Supervision des Commandes ({orders.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase">
                <th className="py-2.5 pr-4">Commande</th>
                <th className="py-2.5 pr-4">Client</th>
                <th className="py-2.5 pr-4">Ville</th>
                <th className="py-2.5 pr-4">Paiement</th>
                <th className="py-2.5 pr-4">Statut</th>
                <th className="py-2.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((o) => {
                const st = ORDER_STATUS_META[o.status] || ORDER_STATUS_META.CONFIRMED;
                return (
                  <tr key={o.id}>
                    <td className="py-3 pr-4 font-bold text-[#0B192C]">{o.orderNumber}</td>
                    <td className="py-3 pr-4">{o.customerName}</td>
                    <td className="py-3 pr-4">{o.city}</td>
                    <td className="py-3 pr-4">
                      {o.paymentMethod} ({o.paymentStatus})
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full border px-2.5 py-0.5 font-bold ${st.color}`}>{st.label}</span>
                    </td>
                    <td className="py-3 text-right font-extrabold tabular-nums">{formatFcfa(o.totalFcfa)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

