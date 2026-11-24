"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  TrendingUp,
  ShieldCheck,
  ExternalLink,
  PauseCircle,
  PlayCircle,
  Users,
  Ticket,
  ShoppingBag,
  Activity,
  Lock,
  Plus,
  Trash2,
  FileText,
  Search,
  RefreshCw,
} from "lucide-react";
import { formatFcfa } from "@/lib/format";
import { useApp } from "@/components/Providers";

interface TenantStoreRow {
  id: string;
  name: string;
  slug: string;
  customDomain: string | null;
  plan: string;
  status: string;
  city: string;
  createdAt: string;
  subscriptions: { priceFcfa: number; status: string; currentPeriodEnd: string }[];
  _count: { products: number; orders: number; users: number };
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  city: string;
  loyaltyPoints: number;
  storeId: string | null;
  store: { name: string; slug: string } | null;
  createdAt: string;
}

interface OrderRow {
  id: string;
  orderNumber: string;
  customerName: string;
  city: string;
  totalFcfa: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  createdAt: string;
  store: { name: string; slug: string } | null;
}

interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  plan: string;
  amountFcfa: number;
  status: string;
  paymentMethod: string;
  paidAt: string;
  store: { name: string; slug: string };
}

interface NotificationRow {
  id: string;
  channel: string;
  recipient: string;
  subject: string;
  status: string;
  createdAt: string;
}

interface CouponRow {
  id: string;
  code: string;
  discountType: string;
  value: number;
  minOrderFcfa: number;
  usedCount: number;
  maxUses: number | null;
  active: boolean;
  expiresAt: string | null;
}

interface SystemHealth {
  database: string;
  blobConfigured: boolean;
  pushConfigured: boolean;
  paymentGateway: string;
  emailProvider: string;
  whatsappProvider: string;
}

type TabId = "stores" | "users" | "coupons" | "orders" | "system";

export default function SuperAdminPage() {
  const { showToast } = useApp();
  const [activeTab, setActiveTab] = useState<TabId>("stores");
  const [stores, setStores] = useState<TenantStoreRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [recentOrders, setRecentOrders] = useState<OrderRow[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [metrics, setMetrics] = useState({
    totalStores: 0,
    activeStores: 0,
    mrrFcfa: 0,
    arrFcfa: 0,
    gmvFcfa: 0,
    totalOrders: 0,
    paidOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
    totalCoupons: 0,
  });

  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [storeQuery, setStoreQuery] = useState("");
  const [userQuery, setUserQuery] = useState("");

  // New coupon form
  const [newCode, setNewCode] = useState("");
  const [newType, setNewType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [newValue, setNewValue] = useState("10");
  const [newMinOrder, setNewMinOrder] = useState("5000");

  const loadData = async () => {
    setLoading(true);
    setForbidden(false);
    try {
      const [saRes, couponRes] = await Promise.all([
        fetch("/api/super-admin"),
        fetch("/api/coupons"),
      ]);

      if (saRes.status === 403 || saRes.status === 401) {
        setForbidden(true);
        setLoading(false);
        return;
      }

      if (saRes.ok) {
        const data = await saRes.json();
        setStores(data.stores || []);
        setUsers(data.users || []);
        setRecentOrders(data.recentOrders || []);
        setInvoices(data.invoices || []);
        setNotifications(data.notifications || []);
        setHealth(data.systemHealth || null);
        if (data.metrics) setMetrics(data.metrics);
      }

      if (couponRes.ok) {
        const cData = await couponRes.json();
        setCoupons(cData.coupons || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateStore = async (storeId: string, patch: { status?: string; plan?: string }, label: string) => {
    const res = await fetch("/api/super-admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId, ...patch }),
    });
    if (res.ok) {
      showToast(label);
      loadData();
    } else {
      showToast("Erreur lors de la mise à jour boutique.");
    }
  };

  const updateUserRole = async (userId: string, role: string, name: string) => {
    const res = await fetch("/api/super-admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    if (res.ok) {
      showToast(`${name} → ${role}`);
      loadData();
    } else {
      showToast("Erreur lors de la modification du rôle.");
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: newCode,
        discountType: newType,
        value: Number(newValue),
        minOrderFcfa: Number(newMinOrder) || 0,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      showToast(`Code promo ${data.coupon.code} créé`);
      setNewCode("");
      loadData();
    } else {
      showToast(data.error || "Impossible de créer le code promo.");
    }
  };

  const handleDeleteCoupon = async (id: string, code: string) => {
    const res = await fetch(`/api/coupons?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (res.ok) {
      showToast(`Code promo ${code} supprimé`);
      loadData();
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[1680px] px-4 py-16 text-center text-sm text-slate-500">
        Chargement du Cockpit Super-Admin...
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
          <Lock className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-extrabold text-[#0B192C]">Accès Super-Admin Requis</h1>
        <p className="text-sm text-slate-600">
          Cette console est réservée aux comptes <strong>SUPER_ADMIN</strong>, <strong>EXECUTIVE</strong> ou <strong>ADMIN</strong>.
          Connectez-vous ou basculez de profil depuis votre compte.
        </p>
        <Link
          href="/compte"
          className="inline-flex items-center justify-center rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white hover:bg-orange-600"
        >
          Se connecter / Basculer de rôle
        </Link>
      </div>
    );
  }

  const filteredStores = stores.filter(
    (s) =>
      s.name.toLowerCase().includes(storeQuery.toLowerCase()) ||
      s.slug.toLowerCase().includes(storeQuery.toLowerCase()) ||
      s.city.toLowerCase().includes(storeQuery.toLowerCase())
  );

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(userQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(userQuery.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-[1680px] px-4 py-8 space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#0B192C] to-[#1E3A5F] p-7 text-white shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
            Albedo&apos;o · Cockpit Super-Admin SaaS
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            Administration Globale &amp; Pilotage Multi-Boutiques
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Contrôle des boutiques locataires, utilisateurs, codes promo, revenus FCFA et santé système.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadData}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/20 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Actualiser
          </button>
          <Link
            href="/inscription-boutique"
            className="rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-extrabold text-white hover:bg-orange-600 transition"
          >
            + Nouvelle boutique SaaS
          </Link>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
            <span>MRR SaaS</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-1.5 text-xl font-extrabold text-emerald-700 tabular-nums">
            {formatFcfa(metrics.mrrFcfa)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500">ARR Projeté</div>
          <div className="mt-1.5 text-xl font-extrabold text-[#0B192C] tabular-nums">
            {formatFcfa(metrics.arrFcfa)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500">Volume Ventes (GMV)</div>
          <div className="mt-1.5 text-xl font-extrabold text-orange-600 tabular-nums">
            {formatFcfa(metrics.gmvFcfa)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
            <span>Boutiques</span>
            <Building2 className="h-4 w-4 text-[#1E3A5F]" />
          </div>
          <div className="mt-1.5 text-xl font-extrabold text-[#0B192C]">
            {metrics.activeStores} / {metrics.totalStores}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
            <span>Commandes</span>
            <ShoppingBag className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-1.5 text-xl font-extrabold text-[#0B192C]">
            {metrics.paidOrders} / {metrics.totalOrders} payées
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
            <span>Utilisateurs / Produits</span>
            <Users className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-1.5 text-xl font-extrabold text-[#0B192C]">
            {metrics.totalUsers} / {metrics.totalProducts}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: "stores" as TabId, label: `Boutiques SaaS (${stores.length})`, icon: Building2 },
          { id: "users" as TabId, label: `Utilisateurs & Rôles (${users.length})`, icon: Users },
          { id: "coupons" as TabId, label: `Codes Promo (${coupons.length})`, icon: Ticket },
          { id: "orders" as TabId, label: `Commandes & Factures (${recentOrders.length})`, icon: ShoppingBag },
          { id: "system" as TabId, label: "Système & Logs", icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
                active
                  ? "bg-[#0B192C] text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: BOUTIQUES SAAS */}
      {activeTab === "stores" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 overflow-x-auto">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-extrabold text-[#0B192C]">
              Boutiques Enregistrées ({filteredStores.length})
            </h2>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={storeQuery}
                onChange={(e) => setStoreQuery(e.target.value)}
                placeholder="Rechercher boutique, slug, ville..."
                className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase">
                <th className="py-3 pr-4">Boutique</th>
                <th className="py-3 pr-4">Ville / Domaine</th>
                <th className="py-3 pr-4">Plan SaaS</th>
                <th className="py-3 pr-4">Abonnement</th>
                <th className="py-3 pr-4">Catalogue / Cmd</th>
                <th className="py-3 pr-4">Statut</th>
                <th className="py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStores.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="py-3 pr-4">
                    <div className="font-bold text-[#0B192C]">{s.name}</div>
                    <div className="text-[11px] text-slate-500">/s/{s.slug}</div>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="text-slate-700">{s.city}</div>
                    {s.customDomain && (
                      <div className="text-[10px] font-semibold text-indigo-600">{s.customDomain}</div>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <select
                      value={s.plan}
                      onChange={(e) =>
                        updateStore(s.id, { plan: e.target.value }, `${s.name} → Plan ${e.target.value}`)
                      }
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-[#1E3A5F]"
                    >
                      <option value="STARTER">STARTER</option>
                      <option value="PRO">PRO</option>
                      <option value="BUSINESS">BUSINESS</option>
                    </select>
                  </td>
                  <td className="py-3 pr-4 tabular-nums">
                    {s.subscriptions[0] ? `${formatFcfa(s.subscriptions[0].priceFcfa)}/mois` : "Gratuit"}
                  </td>
                  <td className="py-3 pr-4">
                    {s._count.products} prod · {s._count.orders} cmd · {s._count.users} mbr
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        s.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 text-right space-x-2 whitespace-nowrap">
                    <Link
                      href={`/s/${s.slug}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                    >
                      Vitrine <ExternalLink className="h-3 w-3" />
                    </Link>
                    <button
                      onClick={() =>
                        updateStore(
                          s.id,
                          { status: s.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" },
                          `Boutique ${s.name} → ${s.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE"}`
                        )
                      }
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold cursor-pointer ${
                        s.status === "ACTIVE"
                          ? "bg-red-50 text-red-700 hover:bg-red-100"
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      }`}
                    >
                      {s.status === "ACTIVE" ? (
                        <>
                          <PauseCircle className="h-3 w-3" /> Suspendre
                        </>
                      ) : (
                        <>
                          <PlayCircle className="h-3 w-3" /> Activer
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: UTILISATEURS & ROLES */}
      {activeTab === "users" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 overflow-x-auto">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-extrabold text-[#0B192C]">
              Comptes Utilisateurs ({filteredUsers.length})
            </h2>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Rechercher nom, email, rôle..."
                className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase">
                <th className="py-3 pr-4">Utilisateur</th>
                <th className="py-3 pr-4">Ville / Tél</th>
                <th className="py-3 pr-4">Boutique liée</th>
                <th className="py-3 pr-4">Fidélité</th>
                <th className="py-3 pr-4">Rôle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="py-3 pr-4">
                    <div className="font-bold text-[#0B192C]">{u.name}</div>
                    <div className="text-[11px] text-slate-500">{u.email}</div>
                  </td>
                  <td className="py-3 pr-4">
                    <div>{u.city}</div>
                    {u.phone && <div className="text-[11px] text-slate-500">{u.phone}</div>}
                  </td>
                  <td className="py-3 pr-4">
                    {u.store ? (
                      <Link href={`/s/${u.store.slug}`} className="font-semibold text-orange-600 hover:underline">
                        {u.store.name}
                      </Link>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 font-semibold tabular-nums">{u.loyaltyPoints} pts</td>
                  <td className="py-3 pr-4">
                    <select
                      value={u.role}
                      onChange={(e) => updateUserRole(u.id, e.target.value, u.name)}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-[#0B192C]"
                    >
                      <option value="CLIENT">CLIENT</option>
                      <option value="VENDOR">VENDOR</option>
                      <option value="LOGISTICS">LOGISTICS</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="EXECUTIVE">EXECUTIVE</option>
                      <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: CODES PROMO */}
      {activeTab === "coupons" && (
        <div className="grid gap-6 lg:grid-cols-12">
          <form
            onSubmit={handleCreateCoupon}
            className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 h-fit"
          >
            <h2 className="text-base font-extrabold text-[#0B192C] flex items-center gap-2">
              <Plus className="h-4 w-4 text-orange-500" /> Créer un Code Promo
            </h2>
            <div>
              <label className="text-xs font-semibold text-slate-600">Code</label>
              <input
                type="text"
                required
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder="EX: DOUALA20"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold uppercase"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as "PERCENT" | "FIXED")}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold"
                >
                  <option value="PERCENT">Pourcentage (%)</option>
                  <option value="FIXED">Montant fixe (FCFA)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Valeur</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Commande minimum (FCFA)</label>
              <input
                type="number"
                min={0}
                value={newMinOrder}
                onChange={(e) => setNewMinOrder(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-orange-500 py-2.5 text-xs font-extrabold text-white hover:bg-orange-600 cursor-pointer"
            >
              Publier le code promo
            </button>
          </form>

          <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm overflow-x-auto">
            <h2 className="text-base font-extrabold text-[#0B192C] mb-4">
              Codes Promo Actifs ({coupons.length})
            </h2>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase">
                  <th className="py-3 pr-4">Code</th>
                  <th className="py-3 pr-4">Remise</th>
                  <th className="py-3 pr-4">Minimum</th>
                  <th className="py-3 pr-4">Utilisations</th>
                  <th className="py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coupons.map((c) => (
                  <tr key={c.id}>
                    <td className="py-3 pr-4 font-extrabold text-[#0B192C]">{c.code}</td>
                    <td className="py-3 pr-4 font-semibold text-emerald-700">
                      {c.discountType === "PERCENT" ? `-${c.value}%` : `-${formatFcfa(c.value)}`}
                    </td>
                    <td className="py-3 pr-4 tabular-nums">{formatFcfa(c.minOrderFcfa)}</td>
                    <td className="py-3 pr-4">
                      {c.usedCount}
                      {c.maxUses ? ` / ${c.maxUses}` : ""}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleDeleteCoupon(c.id, c.code)}
                        className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-700 hover:bg-red-100 cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" /> Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: COMMANDES & FACTURATION SAAS */}
      {activeTab === "orders" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm overflow-x-auto">
            <h2 className="text-base font-extrabold text-[#0B192C] mb-4">
              Dernières Commandes Multi-Boutiques ({recentOrders.length})
            </h2>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase">
                  <th className="py-3 pr-4">N° Commande</th>
                  <th className="py-3 pr-4">Client / Ville</th>
                  <th className="py-3 pr-4">Boutique</th>
                  <th className="py-3 pr-4">Montant</th>
                  <th className="py-3 pr-4">Paiement</th>
                  <th className="py-3 text-right">Facture</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="py-3 pr-4 font-bold text-[#0B192C]">{o.orderNumber}</td>
                    <td className="py-3 pr-4">
                      {o.customerName} <span className="text-slate-400">· {o.city}</span>
                    </td>
                    <td className="py-3 pr-4">{o.store?.name || "Albedo'o Direct"}</td>
                    <td className="py-3 pr-4 font-bold tabular-nums">{formatFcfa(o.totalFcfa)}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          o.paymentStatus === "PAID"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {o.paymentMethod} · {o.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/facture/${encodeURIComponent(o.orderNumber)}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-[#1E3A5F] hover:bg-slate-100"
                      >
                        <FileText className="h-3 w-3" /> PDF
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm overflow-x-auto">
            <h2 className="text-base font-extrabold text-[#0B192C] mb-4">
              Factures Abonnements SaaS ({invoices.length})
            </h2>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase">
                  <th className="py-3 pr-4">N° Facture</th>
                  <th className="py-3 pr-4">Boutique</th>
                  <th className="py-3 pr-4">Plan</th>
                  <th className="py-3 pr-4">Montant</th>
                  <th className="py-3 pr-4">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="py-3 pr-4 font-bold text-[#0B192C]">{inv.invoiceNumber}</td>
                    <td className="py-3 pr-4">{inv.store.name}</td>
                    <td className="py-3 pr-4 font-semibold">{inv.plan}</td>
                    <td className="py-3 pr-4 font-bold tabular-nums">{formatFcfa(inv.amountFcfa)}</td>
                    <td className="py-3 pr-4">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: SYSTEME & LOGS */}
      {activeTab === "system" && (
        <div className="space-y-6">
          {health && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {[
                { label: "Base de données", value: health.database, ok: true },
                { label: "Stockage Vercel Blob", value: health.blobConfigured ? "Connecté" : "Inline", ok: health.blobConfigured },
                { label: "Push Web VAPID", value: health.pushConfigured ? "Actif" : "Inactif", ok: health.pushConfigured },
                { label: "Passerelle Paiement", value: health.paymentGateway, ok: true },
                { label: "Fournisseur Email", value: health.emailProvider, ok: true },
                { label: "Fournisseur WhatsApp", value: health.whatsappProvider, ok: true },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-[11px] font-semibold text-slate-500">{item.label}</div>
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs font-extrabold text-[#0B192C]">
                    <ShieldCheck className={`h-4 w-4 ${item.ok ? "text-emerald-600" : "text-amber-500"}`} />
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm overflow-x-auto">
            <h2 className="text-base font-extrabold text-[#0B192C] mb-4">
              Journaux des Notifications ({notifications.length})
            </h2>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase">
                  <th className="py-3 pr-4">Canal</th>
                  <th className="py-3 pr-4">Destinataire</th>
                  <th className="py-3 pr-4">Sujet</th>
                  <th className="py-3 pr-4">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {notifications.map((n) => (
                  <tr key={n.id}>
                    <td className="py-3 pr-4 font-bold">{n.channel}</td>
                    <td className="py-3 pr-4">{n.recipient}</td>
                    <td className="py-3 pr-4">{n.subject}</td>
                    <td className="py-3 pr-4">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                        {n.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
