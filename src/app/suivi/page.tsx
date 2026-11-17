"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, PackageCheck, CheckCircle2, AlertTriangle, MessageSquarePlus, FileText, Printer, X } from "lucide-react";
import { formatFcfa, ORDER_STATUS_META, PAYMENT_METHOD_LABELS, DELIVERY_METHOD_LABELS } from "@/lib/format";
import { useApp } from "@/components/Providers";

interface OrderDetail {
  id: string;
  orderNumber: string;
  customerName: string;
  city: string;
  quarter: string;
  deliveryMethod: string;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  totalFcfa: number;
  assignedCourier?: string | null;
  createdAt: string;
  items: { id: string; quantity: number; unitPriceFcfa: number; product: { title: string } }[];
  events: { id: string; label: string; description: string; actorName: string; createdAt: string }[];
}

function SuiviContent() {
  const searchParams = useSearchParams();
  const { showToast } = useApp();
  const [orderNum, setOrderNum] = useState(searchParams.get("order") || "CMD-2026-0101");
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFoundMsg, setNotFoundMsg] = useState(false);

  // SAV Form
  const [claimType, setClaimType] = useState("RETURN");
  const [claimReason, setClaimReason] = useState("");
  const [claimSent, setClaimSent] = useState<string | null>(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  const fetchOrder = async (num: string) => {
    if (!num.trim()) return;
    setLoading(true);
    setNotFoundMsg(false);
    const res = await fetch(`/api/orders?orderNumber=${encodeURIComponent(num.trim())}`);
    if (res.ok) {
      const data = await res.json();
      if (data.orders?.length > 0) {
        setOrder(data.orders[0]);
      } else {
        setOrder(null);
        setNotFoundMsg(true);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrder(orderNum);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrder(orderNum);
  };

  const handleOpenClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !claimReason.trim()) return;
    const res = await fetch("/api/claims", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderNumber: order.orderNumber,
        type: claimType,
        reason: claimReason,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setClaimSent(data.claim.ticketNumber);
      setClaimReason("");
      showToast(`Ticket SAV ${data.claim.ticketNumber} créé.`);
      fetchOrder(order.orderNumber);
    }
  };

  const statusMeta = order ? ORDER_STATUS_META[order.status] || ORDER_STATUS_META.CONFIRMED : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-[#0B192C]">Suivi de Commande & SAV</h1>
        <p className="mt-1 text-sm text-slate-600">
          Traçabilité complète du circuit des marchandises (Chapitre 11) et gestion des retours/réclamations (Chapitre 12).
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={orderNum}
            onChange={(e) => setOrderNum(e.target.value)}
            placeholder="Ex: CMD-2026-0101, CMD-2026-0102, CMD-2026-0103..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-semibold uppercase focus:border-[#1E3A5F] focus:bg-white focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-[#0B192C] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#1E3A5F] transition cursor-pointer"
        >
          Rechercher
        </button>
      </form>

      <div className="flex flex-wrap gap-2 text-xs">
        <span className="text-slate-500 font-medium py-1">Commandes exemples :</span>
        {["CMD-2026-0101", "CMD-2026-0102", "CMD-2026-0103", "CMD-2026-0104", "CMD-2026-0105"].map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setOrderNum(id);
              fetchOrder(id);
            }}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-semibold text-[#1E3A5F] hover:bg-slate-50 cursor-pointer"
          >
            {id}
          </button>
        ))}
      </div>

      {loading && <div className="h-48 animate-pulse rounded-2xl bg-slate-200" />}

      {notFoundMsg && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm font-semibold text-amber-800 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Aucune commande trouvée avec le numéro {orderNum}.
        </div>
      )}

      {order && statusMeta && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <div className="text-xs text-slate-500">Commande N°</div>
                  <div className="text-xl font-extrabold text-[#0B192C]">{order.orderNumber}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setInvoiceOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-[#1E3A5F] hover:bg-slate-100 cursor-pointer"
                  >
                    <FileText className="h-3.5 w-3.5" /> Facture OHADA
                  </button>
                  <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusMeta.color}`}>
                    {statusMeta.label}
                  </span>
                </div>
              </div>

              {/* Amazon-style 5-Stage Progress Bar */}
              <div className="py-2">
                <div className="grid grid-cols-5 gap-1 text-center text-[10px] font-bold">
                  {[
                    { idx: 1, label: "Reçue" },
                    { idx: 2, label: "Confirmée" },
                    { idx: 3, label: "Contrôle QC" },
                    { idx: 4, label: "Expédiée" },
                    { idx: 5, label: "Livrée" },
                  ].map((st) => {
                    const active = statusMeta.stepIndex >= st.idx;
                    return (
                      <div key={st.idx} className="space-y-1.5">
                        <div className={`h-2 rounded-full ${active ? "bg-emerald-500" : "bg-slate-200"}`} />
                        <span className={active ? "text-emerald-700" : "text-slate-400"}>{st.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500">Client :</span>{" "}
                  <strong className="text-slate-900">{order.customerName}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Destination :</span>{" "}
                  <strong className="text-slate-900">{order.city} ({order.quarter})</strong>
                </div>
                <div>
                  <span className="text-slate-500">Livraison :</span>{" "}
                  <strong className="text-slate-900">
                    {DELIVERY_METHOD_LABELS[order.deliveryMethod]?.label || order.deliveryMethod}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500">Paiement :</span>{" "}
                  <strong className="text-slate-900">
                    {PAYMENT_METHOD_LABELS[order.paymentMethod]?.label || order.paymentMethod} ({order.paymentStatus})
                  </strong>
                </div>
              </div>

              {order.assignedCourier && (
                <div className="rounded-xl bg-blue-50 px-3.5 py-2.5 text-xs font-semibold text-[#1E3A5F]">
                  Livreur / Transporteur assigné : {order.assignedCourier}
                </div>
              )}

              <div className="border-t border-slate-100 pt-4 space-y-2">
                <div className="text-xs font-bold text-slate-700">Articles commandés :</div>
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-xs text-slate-700">
                    <span>{item.quantity}x {item.product.title}</span>
                    <span className="font-bold tabular-nums">{formatFcfa(item.unitPriceFcfa * item.quantity)}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-slate-100 pt-2 text-sm font-extrabold text-[#0B192C]">
                  <span>Total</span>
                  <span className="tabular-nums">{formatFcfa(order.totalFcfa)}</span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-extrabold text-[#0B192C] mb-4 flex items-center gap-2">
                <PackageCheck className="h-4 w-4 text-emerald-600" />
                Journal Logistique & Contrôle Qualité
              </h2>
              <div className="space-y-4">
                {order.events.map((ev) => (
                  <div key={ev.id} className="flex gap-3">
                    <div className="mt-1">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-900">{ev.label}</span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(ev.createdAt).toLocaleString("fr-FR")}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-0.5">{ev.description}</p>
                      <span className="text-[10px] font-semibold text-[#1E3A5F]">Par : {ev.actorName}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SAV / Return Ticket */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h2 className="text-base font-extrabold text-[#0B192C] flex items-center gap-2">
                <MessageSquarePlus className="h-4 w-4 text-orange-500" />
                Ouvrir un ticket SAV / Retour (Chap. 12)
              </h2>
              <p className="text-xs text-slate-600">
                Un problème de conformité, un retour ou une activation de garantie ? Déclarez votre demande ici.
              </p>

              {claimSent && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-800">
                  Ticket <strong>{claimSent}</strong> enregistré. Notre équipe SAV vous répond sous 24h.
                </div>
              )}

              <form onSubmit={handleOpenClaim} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Type de demande</label>
                  <select
                    value={claimType}
                    onChange={(e) => setClaimType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="RETURN">Demande de retour produit</option>
                    <option value="REFUND">Demande de remboursement</option>
                    <option value="QUALITY_ISSUE">Problème qualité / Non-conformité</option>
                    <option value="DELIVERY_DELAY">Retard de livraison</option>
                    <option value="WARRANTY">Activation de garantie</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Description détaillée</label>
                  <textarea
                    required
                    rows={3}
                    value={claimReason}
                    onChange={(e) => setClaimReason(e.target.value)}
                    placeholder="Expliquez le motif de votre demande..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-orange-500 py-2.5 text-sm font-bold text-white hover:bg-orange-600 transition cursor-pointer"
                >
                  Envoyer la demande SAV
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Official Invoice Modal (DGI / OHADA) */}
      {invoiceOpen && order && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl space-y-6">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="text-lg font-extrabold text-[#0B192C]">Albedo&apos;o</div>
                <div className="text-xs text-slate-500">Douala, Cameroun · Conforme DGI / OHADA</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B192C] px-3 py-1.5 text-xs font-bold text-white cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" /> Imprimer
                </button>
                <button onClick={() => setInvoiceOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="font-bold text-slate-400 uppercase">Facturé à</div>
                <div className="font-bold text-slate-900 mt-1">{order.customerName}</div>
                <div className="text-slate-600">{order.city} — {order.quarter}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-400 uppercase">Facture N°</div>
                <div className="font-bold text-slate-900 mt-1">FAC-{order.orderNumber}</div>
                <div className="text-slate-600">Date : {new Date(order.createdAt).toLocaleDateString("fr-FR")}</div>
              </div>
            </div>

            <table className="w-full text-xs border-t border-b border-slate-200">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="py-2">Désignation</th>
                  <th className="py-2 text-center">Qté</th>
                  <th className="py-2 text-right">Total TTC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items.map((i) => (
                  <tr key={i.id}>
                    <td className="py-2.5 font-semibold text-slate-900">{i.product.title}</td>
                    <td className="py-2.5 text-center">{i.quantity}</td>
                    <td className="py-2.5 text-right font-bold tabular-nums">{formatFcfa(i.unitPriceFcfa * i.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-between items-center text-base font-extrabold text-[#0B192C]">
              <span>NET À PAYER (FCFA)</span>
              <span className="tabular-nums">{formatFcfa(order.totalFcfa)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SuiviPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl px-4 py-12 text-sm text-slate-500">Chargement...</div>}>
      <SuiviContent />
    </Suspense>
  );
}

