"use client";

import React, { useEffect, useState } from "react";
import { Truck, CheckCircle2, PackageCheck, RotateCcw, AlertTriangle } from "lucide-react";
import { useApp } from "@/components/Providers";
import { formatFcfa, ORDER_STATUS_META, DELIVERY_METHOD_LABELS } from "@/lib/format";

interface LogisticsOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  city: string;
  quarter: string;
  deliveryMethod: string;
  status: string;
  totalFcfa: number;
  assignedCourier: string | null;
  qcCheckedBy: string | null;
  items: { id: string; quantity: number; product: { title: string } }[];
}

const LOGISTICS_STEPS = [
  "1. Approvisionnement",
  "2. Réception Hub",
  "3. Contrôle Qualité",
  "4. Enregistrement",
  "5. Stockage",
  "6. Publication",
  "7. Réception Cmd",
  "8. Préparation",
  "9. Emballage",
  "10. Expédition",
  "11. Livraison",
  "12. Confirmation",
  "13. Retours",
];

export default function LogistiquePage() {
  const { user, switchDemoUser, showToast } = useApp();
  const [orders, setOrders] = useState<LogisticsOrder[]>([]);
  const [courierInput, setCourierInput] = useState<Record<string, string>>({});

  const hasAccess = user && ["LOGISTICS", "ADMIN", "EXECUTIVE"].includes(user.role);

  const loadOrders = async () => {
    const res = await fetch("/api/orders");
    if (res.ok) {
      const data = await res.json();
      setOrders(data.orders || []);
    }
  };

  useEffect(() => {
    if (hasAccess) loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!hasAccess) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
          <Truck className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-extrabold text-[#0B192C]">Interface Gestionnaire Logistique (Chap. 13.D)</h1>
        <p className="text-sm text-slate-600">
          Activez le profil Gestionnaire Logistique pour piloter la réception, le contrôle qualité, l&apos;emballage et les expéditions.
        </p>
        <button
          onClick={() => switchDemoUser("logistique@exemple.cm")}
          className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white hover:bg-orange-600 cursor-pointer"
        >
          Activer : Samuel Fotso (Hub Akwa Douala)
        </button>
      </div>
    );
  }

  const updateOrderStatus = async (
    order: LogisticsOrder,
    newStatus: string,
    eventLabel: string,
    eventDescription: string
  ) => {
    const courier = courierInput[order.id] || order.assignedCourier || "Flotte Interne Douala";
    const res = await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: newStatus,
        assignedCourier: courier,
        qcCheckedBy: user?.name,
        paymentStatus: newStatus === "DELIVERED" ? "PAID" : undefined,
        eventLabel,
        eventDescription,
      }),
    });
    if (res.ok) {
      showToast(`${order.orderNumber} → ${eventLabel}`);
      loadOrders();
    }
  };

  return (
    <div className="mx-auto max-w-[1680px] px-4 py-8 space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
          Interface D — Gestionnaire Logistique (Chapitre 11 & 13.D)
        </span>
        <h1 className="text-3xl font-extrabold text-[#0B192C]">Hub Logistique & Expéditions</h1>
        <p className="text-sm text-slate-600">
          Pilotage opérationnel des 13 étapes du circuit des marchandises — Douala, Yaoundé et Réseau National.
        </p>
      </div>

      {/* 13 Steps Strip */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm overflow-x-auto">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          Chaîne Logistique Standardisée (13 Étapes — Chapitre 11)
        </div>
        <div className="flex items-center gap-1.5 min-w-max">
          {LOGISTICS_STEPS.map((step) => (
            <span
              key={step}
              className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-semibold text-[#0B192C]"
            >
              {step}
            </span>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="space-y-4">
        {orders.map((order) => {
          const st = ORDER_STATUS_META[order.status] || ORDER_STATUS_META.CONFIRMED;
          return (
            <div
              key={order.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-base font-extrabold text-[#0B192C]">{order.orderNumber}</span>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${st.color}`}>
                    {st.label}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {order.city} ({order.quarter}) · {DELIVERY_METHOD_LABELS[order.deliveryMethod]?.label}
                  </span>
                </div>
                <div className="text-xs text-slate-700">
                  <strong>Client :</strong> {order.customerName} ({order.customerPhone}) ·{" "}
                  <strong>Montant :</strong> {formatFcfa(order.totalFcfa)}
                </div>
                <div className="text-xs text-slate-500">
                  Articles : {order.items.map((i) => `${i.quantity}x ${i.product.title}`).join(" | ")}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder={order.assignedCourier || "Nom livreur / agence..."}
                  value={courierInput[order.id] ?? ""}
                  onChange={(e) => setCourierInput({ ...courierInput, [order.id]: e.target.value })}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs w-44"
                />

                {order.status === "CONFIRMED" && (
                  <button
                    onClick={() =>
                      updateOrderStatus(
                        order,
                        "PREPARING",
                        "Contrôle qualité & Préparation",
                        "Articles contrôlés, enregistrés et en cours d'emballage."
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-700 cursor-pointer"
                  >
                    <PackageCheck className="h-3.5 w-3.5" /> Valider QC & Préparer
                  </button>
                )}

                {order.status === "PREPARING" && (
                  <button
                    onClick={() =>
                      updateOrderStatus(
                        order,
                        "SHIPPED",
                        "Expédiée",
                        `Colis remis au livreur / transporteur (${courierInput[order.id] || order.assignedCourier || "Flotte Interne"}).`
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-3.5 py-2 text-xs font-bold text-white hover:bg-orange-600 cursor-pointer"
                  >
                    <Truck className="h-3.5 w-3.5" /> Expédier
                  </button>
                )}

                {order.status === "SHIPPED" && (
                  <>
                    <button
                      onClick={() =>
                        updateOrderStatus(
                          order,
                          "DELIVERED",
                          "Réception confirmée",
                          "Livraison confirmée auprès du client."
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Confirmer Livraison
                    </button>
                    <button
                      onClick={() =>
                        updateOrderStatus(
                          order,
                          "DELIVERY_FAILED",
                          "Livraison échouée",
                          "Client injoignable — replanification requise (Chapitre 12)."
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-700 cursor-pointer"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" /> Échec
                    </button>
                  </>
                )}

                {order.status === "RETURN_REQUESTED" && (
                  <button
                    onClick={() =>
                      updateOrderStatus(
                        order,
                        "RETURNED",
                        "Retour réceptionné au Hub",
                        "Produit retourné inspecté au Hub Akwa."
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-purple-700 cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Réceptionner Retour
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

