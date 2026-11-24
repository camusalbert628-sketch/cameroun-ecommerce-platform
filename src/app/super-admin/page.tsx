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
  Package,
  Store,
  AlertTriangle,
  MapPin,
  Send,
  Star,
  KeyRound,
} from "lucide-react";
import { formatFcfa } from "@/lib/format";
import { useApp } from "@/components/Providers";
import { Select } from "@/components/ui/Select";

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
}

interface VendorRow {
  id: string;
  companyName: string;
  rccm: string | null;
  niu: string | null;
  city: string;
  status: string;
  commissionRate: number;
  verifiedBadge: boolean;
  balanceFcfa: number;
  user: { name: string; email: string; phone: string | null };
  _count: { products: number };
}

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  _count: { products: number };
}

interface ProductRow {
  id: string;
  title: string;
  slug: string;
  sku: string;
  priceFcfa: number;
  stock: number;
  qualityStatus: string;
  isFeatured: boolean;
  isSponsored: boolean;
  category: { name: string };
  store: { name: string; slug: string } | null;
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
  assignedCourier: string | null;
  createdAt: string;
  store: { name: string; slug: string } | null;
}

interface ClaimRow {
  id: string;
  ticketNumber: string;
  type: string;
  status: string;
  reason: string;
  refundAmountFcfa: number;
  resolutionNote: string | null;
  order: { orderNumber: string; customerName: string; totalFcfa: number };
}

interface ReviewRow {
  id: string;
  authorName: string;
  city: string;
  rating: number;
  comment: string;
  product: { title: string; slug: string };
}

interface ZoneRow {
  id: string;
  city: string;
  zoneName: string;
  feeFcfa: number;
  estimatedDays: string;
  supportsCod: boolean;
  codMaxFcfa: number;
}

interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  plan: string;
  amountFcfa: number;
  status: string;
  store: { name: string; slug: string };
}

interface NotificationRow {
  id: string;
  channel: string;
  recipient: string;
  subject: string;
  status: string;
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
}

interface SystemHealth {
  database: string;
  blobConfigured: boolean;
  pushConfigured: boolean;
  paymentGateway: string;
  emailProvider: string;
  whatsappProvider: string;
}

type TabId =
  | "stores"
  | "users"
  | "vendors"
  | "catalog"
  | "orders"
  | "claims"
  | "zones"
  | "coupons"
  | "system";

export default function SuperAdminPage() {
  const { showToast } = useApp();
  const [activeTab, setActiveTab] = useState<TabId>("stores");

  const [stores, setStores] = useState<TenantStoreRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [recentOrders, setRecentOrders] = useState<OrderRow[]>([]);
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [zones, setZones] = useState<ZoneRow[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [saasPayments, setSaasPayments] = useState<
    {
      id: string;
      reference: string;
      method: string;
      amountFcfa: number;
      status: string;
      proofUrl: string | null;
      reviewNote: string | null;
      subscription: { plan: string; store: { name: string; slug: string } | null };
    }[]
  >([]);
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
    openClaims: 0,
    pushSubscribers: 0,
    analyticsEvents: 0,
  });

  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  const [storeQuery, setStoreQuery] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [orderQuery, setOrderQuery] = useState("");

  // Forms
  const [newCode, setNewCode] = useState("");
  const [newType, setNewType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [newValue, setNewValue] = useState("10");
  const [newMinOrder, setNewMinOrder] = useState("5000");

  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");

  const [zoneCity, setZoneCity] = useState("Douala");
  const [zoneName, setZoneName] = useState("");
  const [zoneFee, setZoneFee] = useState("1500");
  const [zoneDays, setZoneDays] = useState("24h");

  const [pushTitle, setPushTitle] = useState("");
  const [pushMessage, setPushMessage] = useState("");
  const [pushUrl, setPushUrl] = useState("/");

  const loadData = async () => {
    setLoading(true);
    setForbidden(false);
    try {
      const res = await fetch("/api/super-admin");
      if (res.status === 403 || res.status === 401) {
        setForbidden(true);
        setLoading(false);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setStores(data.stores || []);
        setUsers(data.users || []);
        setVendors(data.vendors || []);
        setCategories(data.categories || []);
        setProducts(data.products || []);
        setRecentOrders(data.recentOrders || []);
        setClaims(data.claims || []);
        setReviews(data.reviews || []);
        setZones(data.zones || []);
        setCoupons(data.coupons || []);
        setInvoices(data.invoices || []);
        setSaasPayments(data.saasPayments || []);
        setNotifications(data.notifications || []);
        setHealth(data.systemHealth || null);
        if (data.metrics) setMetrics(data.metrics);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const patchEntity = async (payload: Record<string, unknown>, okMessage: string) => {
    const res = await fetch("/api/super-admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      showToast(okMessage);
      loadData();
    } else {
      const err = await res.json().catch(() => ({}));
      showToast(err.error || "Erreur de mise à jour.");
    }
  };

  const deleteEntity = async (entity: string, id: string, label: string) => {
    if (!window.confirm(`Confirmer la suppression définitive de : ${label} ?`)) return;
    const res = await fetch(`/api/super-admin?entity=${encodeURIComponent(entity)}&id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      showToast(`${label} supprimé`);
      loadData();
    } else {
      const err = await res.json().catch(() => ({}));
      showToast(err.error || "Suppression impossible.");
    }
  };

  const handleResetUserPassword = async (u: UserRow) => {
    const pwd = window.prompt(`Nouveau mot de passe pour ${u.email} (min. 6 caractères) :`);
    if (!pwd || pwd.length < 6) return;
    await patchEntity({ userId: u.id, newPassword: pwd }, `Mot de passe mis à jour pour ${u.email}`);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/super-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "CATEGORY", name: catName, description: catDesc }),
    });
    if (res.ok) {
      showToast(`Catégorie ${catName} créée`);
      setCatName("");
      setCatDesc("");
      loadData();
    }
  };

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/super-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity: "ZONE",
        city: zoneCity,
        zoneName,
        feeFcfa: Number(zoneFee),
        estimatedDays: zoneDays,
      }),
    });
    if (res.ok) {
      showToast(`Zone ${zoneCity} - ${zoneName} créée`);
      setZoneName("");
      loadData();
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
      showToast(data.error || "Erreur création code promo.");
    }
  };

  const handleBroadcastPush = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/super-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity: "BROADCAST_PUSH",
        title: pushTitle,
        message: pushMessage,
        url: pushUrl,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      showToast(`Push envoyé à ${data.sent}/${data.total} abonnés`);
      setPushTitle("");
      setPushMessage("");
    } else {
      showToast(data.error || "Erreur envoi Push.");
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[1680px] px-4 py-16 text-center text-sm text-slate-500">
        Chargement du Centre de Contrôle Super-Admin...
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
          Cette console contrôle l&apos;ensemble de la plateforme (boutiques, utilisateurs, commandes, finance, KYC).
          Connectez-vous avec un rôle <strong>SUPER_ADMIN</strong>, <strong>EXECUTIVE</strong> ou <strong>ADMIN</strong>.
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

  const filteredProducts = products.filter(
    (p) =>
      p.title.toLowerCase().includes(productQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(productQuery.toLowerCase())
  );

  const filteredOrders = recentOrders.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(orderQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(orderQuery.toLowerCase()) ||
      o.city.toLowerCase().includes(orderQuery.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-[1680px] px-4 py-8 space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#0B192C] to-[#1E3A5F] p-7 text-white shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
            Albedo&apos;o · Contrôle Total Super-Admin
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            Tour de Contrôle Globale de la Plateforme
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Administration complète : boutiques SaaS, utilisateurs, vendeurs KYC, catalogue, commandes, litiges, livraison, promos &amp; système.
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
            <span>MRR / ARR SaaS</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-1 text-lg font-extrabold text-emerald-700 tabular-nums">{formatFcfa(metrics.mrrFcfa)}</div>
          <div className="text-[10px] text-slate-400">ARR : {formatFcfa(metrics.arrFcfa)}</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500">Volume Ventes (GMV)</div>
          <div className="mt-1 text-lg font-extrabold text-orange-600 tabular-nums">{formatFcfa(metrics.gmvFcfa)}</div>
          <div className="text-[10px] text-slate-400">{metrics.paidOrders}/{metrics.totalOrders} commandes payées</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500">Boutiques SaaS</div>
          <div className="mt-1 text-lg font-extrabold text-[#0B192C]">{metrics.activeStores} / {metrics.totalStores}</div>
          <div className="text-[10px] text-slate-400">Actives / Total</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500">Utilisateurs &amp; Produits</div>
          <div className="mt-1 text-lg font-extrabold text-[#0B192C]">{metrics.totalUsers} / {metrics.totalProducts}</div>
          <div className="text-[10px] text-slate-400">{vendors.length} vendeurs partenaires</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500">Litiges / Réclamations</div>
          <div className="mt-1 text-lg font-extrabold text-amber-600">{metrics.openClaims} ouverts</div>
          <div className="text-[10px] text-slate-400">{reviews.length} avis publiés</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500">Trafic &amp; Push PWA</div>
          <div className="mt-1 text-lg font-extrabold text-indigo-700">{metrics.analyticsEvents} évts</div>
          <div className="text-[10px] text-slate-400">{metrics.pushSubscribers} abonnés Push</div>
        </div>
      </div>

      {/* 9 Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: "stores" as TabId, label: `Boutiques (${stores.length})`, icon: Building2 },
          { id: "users" as TabId, label: `Utilisateurs (${users.length})`, icon: Users },
          { id: "vendors" as TabId, label: `Vendeurs KYC (${vendors.length})`, icon: Store },
          { id: "catalog" as TabId, label: `Catalogue & Cat. (${products.length})`, icon: Package },
          { id: "orders" as TabId, label: `Commandes & Factures (${recentOrders.length})`, icon: ShoppingBag },
          { id: "claims" as TabId, label: `Litiges & Avis (${claims.length})`, icon: AlertTriangle },
          { id: "zones" as TabId, label: `Zones Livraison (${zones.length})`, icon: MapPin },
          { id: "coupons" as TabId, label: `Codes Promo (${coupons.length})`, icon: Ticket },
          { id: "system" as TabId, label: "Système, Push & Logs", icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
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
            <h2 className="text-base font-extrabold text-[#0B192C]">Boutiques SaaS ({filteredStores.length})</h2>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={storeQuery}
                onChange={(e) => setStoreQuery(e.target.value)}
                placeholder="Rechercher boutique, slug, ville..."
                className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs"
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
                <th className="py-3 pr-4">Stats</th>
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
                    <div>{s.city}</div>
                    {s.customDomain && <div className="text-[10px] font-semibold text-indigo-600">{s.customDomain}</div>}
                  </td>
                  <td className="py-3 pr-4">
                    <Select
                      size="xs"
                      value={s.plan}
                      onChange={(v) => patchEntity({ storeId: s.id, plan: v }, `${s.name} → ${v}`)}
                      className="w-28"
                      buttonClassName="font-bold text-[#1E3A5F]"
                      options={[
                        { value: "STARTER", label: "STARTER" },
                        { value: "PRO", label: "PRO" },
                        { value: "BUSINESS", label: "BUSINESS" },
                      ]}
                    />
                  </td>
                  <td className="py-3 pr-4 tabular-nums">
                    {s.subscriptions[0] ? `${formatFcfa(s.subscriptions[0].priceFcfa)}/mois` : "Gratuit"}
                  </td>
                  <td className="py-3 pr-4">{s._count.products} prod · {s._count.orders} cmd · {s._count.users} mbr</td>
                  <td className="py-3 pr-4">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${s.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 text-right space-x-1.5 whitespace-nowrap">
                    <Link href={`/s/${s.slug}`} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100">
                      Vitrine <ExternalLink className="h-3 w-3" />
                    </Link>
                    <button
                      onClick={() => patchEntity({ storeId: s.id, status: s.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" }, `${s.name} mis à jour`)}
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold cursor-pointer ${s.status === "ACTIVE" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}
                    >
                      {s.status === "ACTIVE" ? <><PauseCircle className="h-3 w-3" /> Suspendre</> : <><PlayCircle className="h-3 w-3" /> Activer</>}
                    </button>
                    <button
                      onClick={() => deleteEntity("STORE", s.id, s.name)}
                      className="inline-flex items-center rounded-lg bg-red-50 p-1.5 text-red-700 hover:bg-red-100 cursor-pointer"
                      title="Supprimer la boutique"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
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
            <h2 className="text-base font-extrabold text-[#0B192C]">Comptes Utilisateurs ({filteredUsers.length})</h2>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Rechercher nom, email, rôle..."
                className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs"
              />
            </div>
          </div>

          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase">
                <th className="py-3 pr-4">Utilisateur</th>
                <th className="py-3 pr-4">Ville / Tél</th>
                <th className="py-3 pr-4">Boutique liée</th>
                <th className="py-3 pr-4">Points Fidélité</th>
                <th className="py-3 pr-4">Rôle</th>
                <th className="py-3 text-right">Actions</th>
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
                    <Select
                      size="xs"
                      value={u.storeId || ""}
                      onChange={(v) => patchEntity({ userId: u.id, assignStoreId: v || null }, `Boutique assignée à ${u.name}`)}
                      className="w-40"
                      options={[
                        { value: "", label: "Aucune (Plateforme)" },
                        ...stores.map((s) => ({ value: s.id, label: s.name })),
                      ]}
                    />
                  </td>
                  <td className="py-3 pr-4">
                    <button
                      onClick={() => {
                        const pts = window.prompt(`Points fidélité pour ${u.name} :`, String(u.loyaltyPoints));
                        if (pts !== null) patchEntity({ userId: u.id, loyaltyPoints: Number(pts) }, `Points mis à jour`);
                      }}
                      className="font-bold text-[#1E3A5F] underline cursor-pointer tabular-nums"
                    >
                      {u.loyaltyPoints} pts
                    </button>
                  </td>
                  <td className="py-3 pr-4">
                    <Select
                      size="xs"
                      value={u.role}
                      onChange={(v) => patchEntity({ userId: u.id, role: v }, `${u.name} → ${v}`)}
                      className="w-32"
                      buttonClassName="font-bold text-[#0B192C]"
                      options={[
                        { value: "CLIENT", label: "CLIENT" },
                        { value: "VENDOR", label: "VENDOR" },
                        { value: "LOGISTICS", label: "LOGISTICS" },
                        { value: "ADMIN", label: "ADMIN" },
                        { value: "EXECUTIVE", label: "EXECUTIVE" },
                        { value: "SUPER_ADMIN", label: "SUPER_ADMIN" },
                      ]}
                    />
                  </td>
                  <td className="py-3 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      onClick={() => handleResetUserPassword(u)}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
                    >
                      <KeyRound className="h-3 w-3" /> MDP
                    </button>
                    <button
                      onClick={() => deleteEntity("USER", u.id, u.email)}
                      className="inline-flex items-center rounded-lg bg-red-50 p-1.5 text-red-700 hover:bg-red-100 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: VENDEURS & KYC */}
      {activeTab === "vendors" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm overflow-x-auto">
          <h2 className="text-base font-extrabold text-[#0B192C] mb-4">Vendeurs Partenaires &amp; KYC ({vendors.length})</h2>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase">
                <th className="py-3 pr-4">Entreprise / Contact</th>
                <th className="py-3 pr-4">RCCM / NIU</th>
                <th className="py-3 pr-4">Commission</th>
                <th className="py-3 pr-4">Solde</th>
                <th className="py-3 pr-4">Badge Vérifié</th>
                <th className="py-3 pr-4">Statut KYC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vendors.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50">
                  <td className="py-3 pr-4">
                    <div className="font-bold text-[#0B192C]">{v.companyName}</div>
                    <div className="text-[11px] text-slate-500">{v.user.name} · {v.user.email}</div>
                  </td>
                  <td className="py-3 pr-4 text-[11px]">
                    <div>RCCM: {v.rccm || "—"}</div>
                    <div>NIU: {v.niu || "—"}</div>
                  </td>
                  <td className="py-3 pr-4">
                    <button
                      onClick={() => {
                        const rate = window.prompt(`Taux de commission (ex: 0.12 pour 12%) :`, String(v.commissionRate));
                        if (rate !== null) patchEntity({ entity: "VENDOR", vendorId: v.id, commissionRate: Number(rate) }, `Commission mise à jour`);
                      }}
                      className="font-bold text-indigo-700 underline cursor-pointer"
                    >
                      {Math.round(v.commissionRate * 100)}%
                    </button>
                  </td>
                  <td className="py-3 pr-4 font-bold tabular-nums">{formatFcfa(v.balanceFcfa)}</td>
                  <td className="py-3 pr-4">
                    <button
                      onClick={() => patchEntity({ entity: "VENDOR", vendorId: v.id, verifiedBadge: !v.verifiedBadge }, `Badge modifié`)}
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold cursor-pointer ${v.verifiedBadge ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                    >
                      {v.verifiedBadge ? "Vérifié ✓" : "Non vérifié"}
                    </button>
                  </td>
                  <td className="py-3 pr-4">
                    <Select
                      size="xs"
                      value={v.status}
                      onChange={(val) => patchEntity({ entity: "VENDOR", vendorId: v.id, status: val }, `KYC ${v.companyName} → ${val}`)}
                      className="w-28"
                      buttonClassName="font-bold"
                      options={[
                        { value: "PENDING", label: "PENDING" },
                        { value: "APPROVED", label: "APPROVED" },
                        { value: "SUSPENDED", label: "SUSPENDED" },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: CATALOGUE & CATEGORIES */}
      {activeTab === "catalog" && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-12">
            <form onSubmit={handleCreateCategory} className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 h-fit">
              <h2 className="text-sm font-extrabold text-[#0B192C] flex items-center gap-2">
                <Plus className="h-4 w-4 text-orange-500" /> Nouvelle Catégorie
              </h2>
              <input
                type="text"
                required
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="Nom de la catégorie"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
              />
              <input
                type="text"
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                placeholder="Description courte"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
              />
              <button type="submit" className="w-full rounded-xl bg-orange-500 py-2 text-xs font-bold text-white hover:bg-orange-600 cursor-pointer">
                Ajouter la catégorie
              </button>
            </form>

            <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm overflow-x-auto">
              <h2 className="text-sm font-extrabold text-[#0B192C] mb-3">Catégories ({categories.length})</h2>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <div key={c.id} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">
                    <span className="font-bold text-[#0B192C]">{c.name}</span>
                    <span className="text-slate-400">({c._count.products})</span>
                    {c._count.products === 0 && (
                      <button onClick={() => deleteEntity("CATEGORY", c.id, c.name)} className="text-red-500 hover:text-red-700 cursor-pointer">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 overflow-x-auto">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-extrabold text-[#0B192C]">Modération &amp; Stock Produits ({filteredProducts.length})</h2>
              <input
                type="text"
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                placeholder="Rechercher produit ou SKU..."
                className="w-full sm:w-72 rounded-xl border border-slate-200 px-3 py-2 text-xs"
              />
            </div>

            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase">
                  <th className="py-3 pr-4">Produit</th>
                  <th className="py-3 pr-4">Boutique / Cat.</th>
                  <th className="py-3 pr-4">Prix</th>
                  <th className="py-3 pr-4">Stock</th>
                  <th className="py-3 pr-4">Mise en avant</th>
                  <th className="py-3 pr-4">Contrôle Qualité</th>
                  <th className="py-3 text-right">Suppr.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3 pr-4">
                      <Link href={`/produit/${p.slug}`} className="font-bold text-[#0B192C] hover:underline">{p.title}</Link>
                      <div className="text-[10px] text-slate-400">{p.sku}</div>
                    </td>
                    <td className="py-3 pr-4 text-[11px]">
                      <div>{p.store?.name || "Albedo'o Direct"}</div>
                      <div className="text-slate-400">{p.category.name}</div>
                    </td>
                    <td className="py-3 pr-4">
                      <button
                        onClick={() => {
                          const pr = window.prompt(`Nouveau prix (FCFA) pour ${p.title} :`, String(p.priceFcfa));
                          if (pr) patchEntity({ entity: "PRODUCT", productId: p.id, priceFcfa: Number(pr) }, `Prix mis à jour`);
                        }}
                        className="font-bold text-orange-600 underline cursor-pointer tabular-nums"
                      >
                        {formatFcfa(p.priceFcfa)}
                      </button>
                    </td>
                    <td className="py-3 pr-4">
                      <button
                        onClick={() => {
                          const st = window.prompt(`Nouveau stock pour ${p.title} :`, String(p.stock));
                          if (st !== null) patchEntity({ entity: "PRODUCT", productId: p.id, stock: Number(st) }, `Stock mis à jour`);
                        }}
                        className="font-bold underline cursor-pointer tabular-nums"
                      >
                        {p.stock} u.
                      </button>
                    </td>
                    <td className="py-3 pr-4 space-x-1">
                      <button
                        onClick={() => patchEntity({ entity: "PRODUCT", productId: p.id, isFeatured: !p.isFeatured }, `Vedette modifié`)}
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold cursor-pointer ${p.isFeatured ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-500"}`}
                      >
                        Vedette
                      </button>
                      <button
                        onClick={() => patchEntity({ entity: "PRODUCT", productId: p.id, isSponsored: !p.isSponsored }, `Sponsorisé modifié`)}
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold cursor-pointer ${p.isSponsored ? "bg-indigo-100 text-indigo-800" : "bg-slate-100 text-slate-500"}`}
                      >
                        Sponsor
                      </button>
                    </td>
                    <td className="py-3 pr-4">
                      <Select
                        size="xs"
                        value={p.qualityStatus}
                        onChange={(val) => patchEntity({ entity: "PRODUCT", productId: p.id, qualityStatus: val }, `QC ${p.title} → ${val}`)}
                        className="w-32"
                        buttonClassName="font-bold"
                        options={[
                          { value: "PENDING_QC", label: "PENDING_QC" },
                          { value: "APPROVED", label: "APPROVED" },
                          { value: "REJECTED", label: "REJECTED" },
                        ]}
                      />
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => deleteEntity("PRODUCT", p.id, p.title)}
                        className="inline-flex items-center rounded-lg bg-red-50 p-1.5 text-red-700 hover:bg-red-100 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: COMMANDES & FACTURES SAAS */}
      {activeTab === "orders" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 overflow-x-auto">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-extrabold text-[#0B192C]">Contrôle des Commandes ({filteredOrders.length})</h2>
              <input
                type="text"
                value={orderQuery}
                onChange={(e) => setOrderQuery(e.target.value)}
                placeholder="Rechercher N°, client, ville..."
                className="w-full sm:w-72 rounded-xl border border-slate-200 px-3 py-2 text-xs"
              />
            </div>

            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase">
                  <th className="py-3 pr-4">Commande</th>
                  <th className="py-3 pr-4">Client / Ville</th>
                  <th className="py-3 pr-4">Montant</th>
                  <th className="py-3 pr-4">Paiement</th>
                  <th className="py-3 pr-4">Statut Logistique</th>
                  <th className="py-3 pr-4">Livreur</th>
                  <th className="py-3 text-right">Facture / Suppr.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="py-3 pr-4">
                      <div className="font-bold text-[#0B192C]">{o.orderNumber}</div>
                      <div className="text-[10px] text-slate-400">{o.store?.name || "Albedo'o Direct"}</div>
                    </td>
                    <td className="py-3 pr-4">{o.customerName} · {o.city}</td>
                    <td className="py-3 pr-4 font-bold tabular-nums">{formatFcfa(o.totalFcfa)}</td>
                    <td className="py-3 pr-4">
                      <Select
                        size="xs"
                        value={o.paymentStatus}
                        onChange={(val) => patchEntity({ entity: "ORDER", orderId: o.id, paymentStatus: val }, `Paiement ${o.orderNumber} → ${val}`)}
                        className="w-28"
                        buttonClassName="font-bold"
                        options={[
                          { value: "PENDING", label: "PENDING" },
                          { value: "PAID", label: "PAID" },
                          { value: "FAILED", label: "FAILED" },
                          { value: "REFUNDED", label: "REFUNDED" },
                        ]}
                      />
                    </td>
                    <td className="py-3 pr-4">
                      <Select
                        size="xs"
                        value={o.status}
                        onChange={(val) => patchEntity({ entity: "ORDER", orderId: o.id, status: val }, `Statut ${o.orderNumber} → ${val}`)}
                        className="w-36"
                        buttonClassName="font-bold"
                        options={[
                          { value: "PENDING_PAYMENT", label: "PENDING_PAYMENT" },
                          { value: "CONFIRMED", label: "CONFIRMED" },
                          { value: "QC_PASSED", label: "QC_PASSED" },
                          { value: "IN_TRANSIT", label: "IN_TRANSIT" },
                          { value: "DELIVERED", label: "DELIVERED" },
                          { value: "CANCELLED", label: "CANCELLED" },
                        ]}
                      />
                    </td>
                    <td className="py-3 pr-4">
                      <button
                        onClick={() => {
                          const c = window.prompt(`Nom du livreur pour ${o.orderNumber} :`, o.assignedCourier || "");
                          if (c !== null) patchEntity({ entity: "ORDER", orderId: o.id, assignedCourier: c }, `Livreur assigné`);
                        }}
                        className="text-[11px] font-semibold text-indigo-700 underline cursor-pointer"
                      >
                        {o.assignedCourier || "Assigner"}
                      </button>
                    </td>
                    <td className="py-3 text-right space-x-1.5 whitespace-nowrap">
                      <Link href={`/facture/${encodeURIComponent(o.orderNumber)}`} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-bold text-[#1E3A5F]">
                        <FileText className="h-3 w-3" /> PDF
                      </Link>
                      <button
                        onClick={() => deleteEntity("ORDER", o.id, o.orderNumber)}
                        className="inline-flex items-center rounded-lg bg-red-50 p-1.5 text-red-700 hover:bg-red-100 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm overflow-x-auto">
            <h2 className="text-base font-extrabold text-[#0B192C] mb-4">
              Paiements SaaS &amp; Virements à vérifier ({saasPayments.length})
            </h2>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase">
                  <th className="py-3 pr-4">Référence</th>
                  <th className="py-3 pr-4">Méthode / Plan</th>
                  <th className="py-3 pr-4">Montant</th>
                  <th className="py-3 pr-4">Justificatif</th>
                  <th className="py-3 pr-4">Statut</th>
                  <th className="py-3 text-right">Validation Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {saasPayments.map((sp) => (
                  <tr key={sp.id}>
                    <td className="py-3 pr-4 font-bold text-[#0B192C]">{sp.reference}</td>
                    <td className="py-3 pr-4">
                      {sp.method} · <span className="font-semibold">{sp.subscription.plan}</span>
                      {sp.subscription.store && (
                        <div className="text-[10px] text-emerald-700">Boutique : {sp.subscription.store.name}</div>
                      )}
                    </td>
                    <td className="py-3 pr-4 font-bold tabular-nums">{formatFcfa(sp.amountFcfa)}</td>
                    <td className="py-3 pr-4">
                      {sp.proofUrl ? (
                        <a
                          href={sp.proofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-orange-600 underline"
                        >
                          Voir justificatif
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          sp.status === "SUCCESS"
                            ? "bg-emerald-50 text-emerald-700"
                            : sp.status === "MANUAL_REVIEW"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {sp.status}
                      </span>
                    </td>
                    <td className="py-3 text-right space-x-1.5 whitespace-nowrap">
                      {sp.status === "MANUAL_REVIEW" && (
                        <>
                          <button
                            onClick={() =>
                              patchEntity(
                                { entity: "SAAS_PAYMENT", paymentId: sp.id, decision: "APPROVE" },
                                `Paiement ${sp.reference} validé et boutique activée !`
                              )
                            }
                            className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 cursor-pointer"
                          >
                            Valider &amp; Activer
                          </button>
                          <button
                            onClick={() => {
                              const note = window.prompt("Motif du refus :") || "Justificatif non conforme";
                              patchEntity(
                                { entity: "SAAS_PAYMENT", paymentId: sp.id, decision: "REJECT", reviewNote: note },
                                `Paiement ${sp.reference} refusé`
                              );
                            }}
                            className="rounded-lg bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-700 hover:bg-red-100 cursor-pointer"
                          >
                            Refuser
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm overflow-x-auto">
            <h2 className="text-base font-extrabold text-[#0B192C] mb-4">Factures Abonnements SaaS ({invoices.length})</h2>
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
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">{inv.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: LITIGES & AVIS */}
      {activeTab === "claims" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm overflow-x-auto">
            <h2 className="text-base font-extrabold text-[#0B192C] mb-4">Réclamations &amp; Litiges SAV ({claims.length})</h2>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase">
                  <th className="py-3 pr-4">Ticket / Cmd</th>
                  <th className="py-3 pr-4">Type &amp; Motif</th>
                  <th className="py-3 pr-4">Remboursement</th>
                  <th className="py-3 pr-4">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {claims.map((c) => (
                  <tr key={c.id}>
                    <td className="py-3 pr-4">
                      <div className="font-bold text-[#0B192C]">{c.ticketNumber}</div>
                      <div className="text-[11px] text-slate-500">{c.order.orderNumber} · {c.order.customerName}</div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="font-bold text-amber-700">{c.type}</span> — {c.reason}
                    </td>
                    <td className="py-3 pr-4">
                      <button
                        onClick={() => {
                          const amt = window.prompt(`Montant remboursement (FCFA) :`, String(c.refundAmountFcfa));
                          if (amt !== null) patchEntity({ entity: "CLAIM", claimId: c.id, refundAmountFcfa: Number(amt) }, `Montant enregistré`);
                        }}
                        className="font-bold underline cursor-pointer tabular-nums"
                      >
                        {formatFcfa(c.refundAmountFcfa)}
                      </button>
                    </td>
                    <td className="py-3 pr-4">
                      <Select
                        size="xs"
                        value={c.status}
                        onChange={(val) => patchEntity({ entity: "CLAIM", claimId: c.id, status: val }, `Ticket ${c.ticketNumber} → ${val}`)}
                        className="w-28"
                        buttonClassName="font-bold"
                        options={[
                          { value: "OPEN", label: "OPEN" },
                          { value: "IN_REVIEW", label: "IN_REVIEW" },
                          { value: "APPROVED", label: "APPROVED" },
                          { value: "RESOLVED", label: "RESOLVED" },
                          { value: "REJECTED", label: "REJECTED" },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm overflow-x-auto">
            <h2 className="text-base font-extrabold text-[#0B192C] mb-4">Modération des Avis Clients ({reviews.length})</h2>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase">
                  <th className="py-3 pr-4">Auteur</th>
                  <th className="py-3 pr-4">Produit</th>
                  <th className="py-3 pr-4">Note</th>
                  <th className="py-3 pr-4">Commentaire</th>
                  <th className="py-3 text-right">Suppr.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reviews.map((r) => (
                  <tr key={r.id}>
                    <td className="py-3 pr-4 font-bold">{r.authorName} <span className="text-slate-400">({r.city})</span></td>
                    <td className="py-3 pr-4">{r.product.title}</td>
                    <td className="py-3 pr-4 font-bold text-amber-600 inline-flex items-center gap-1"><Star className="h-3 w-3 fill-amber-500" /> {r.rating}/5</td>
                    <td className="py-3 pr-4 max-w-md truncate">{r.comment}</td>
                    <td className="py-3 text-right">
                      <button onClick={() => deleteEntity("REVIEW", r.id, `Avis de ${r.authorName}`)} className="rounded-lg bg-red-50 p-1.5 text-red-700 cursor-pointer">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: ZONES LIVRAISON */}
      {activeTab === "zones" && (
        <div className="grid gap-6 lg:grid-cols-12">
          <form onSubmit={handleCreateZone} className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3 h-fit">
            <h2 className="text-base font-extrabold text-[#0B192C] flex items-center gap-2">
              <Plus className="h-4 w-4 text-orange-500" /> Ajouter une Zone de Livraison
            </h2>
            <input type="text" required value={zoneCity} onChange={(e) => setZoneCity(e.target.value)} placeholder="Ville (ex: Douala, Yaoundé, Bafoussam)" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs" />
            <input type="text" required value={zoneName} onChange={(e) => setZoneName(e.target.value)} placeholder="Quartier / Secteur (ex: Akwa, Bastos)" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs" />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" required value={zoneFee} onChange={(e) => setZoneFee(e.target.value)} placeholder="Tarif FCFA" className="rounded-xl border border-slate-200 px-3 py-2 text-xs" />
              <input type="text" required value={zoneDays} onChange={(e) => setZoneDays(e.target.value)} placeholder="Délai (ex: 24h)" className="rounded-xl border border-slate-200 px-3 py-2 text-xs" />
            </div>
            <button type="submit" className="w-full rounded-xl bg-orange-500 py-2.5 text-xs font-extrabold text-white hover:bg-orange-600 cursor-pointer">
              Enregistrer la zone
            </button>
          </form>

          <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm overflow-x-auto">
            <h2 className="text-base font-extrabold text-[#0B192C] mb-4">Tarifs &amp; Zones Actives ({zones.length})</h2>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase">
                  <th className="py-3 pr-4">Ville / Zone</th>
                  <th className="py-3 pr-4">Tarif</th>
                  <th className="py-3 pr-4">Délai</th>
                  <th className="py-3 pr-4">Paiement livraison (COD)</th>
                  <th className="py-3 text-right">Suppr.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {zones.map((z) => (
                  <tr key={z.id}>
                    <td className="py-3 pr-4 font-bold text-[#0B192C]">{z.city} — {z.zoneName}</td>
                    <td className="py-3 pr-4">
                      <button
                        onClick={() => {
                          const fee = window.prompt(`Nouveau tarif (FCFA) pour ${z.zoneName} :`, String(z.feeFcfa));
                          if (fee !== null) patchEntity({ entity: "ZONE", zoneId: z.id, feeFcfa: Number(fee) }, `Tarif mis à jour`);
                        }}
                        className="font-bold text-orange-600 underline cursor-pointer tabular-nums"
                      >
                        {formatFcfa(z.feeFcfa)}
                      </button>
                    </td>
                    <td className="py-3 pr-4">{z.estimatedDays}</td>
                    <td className="py-3 pr-4">
                      <button
                        onClick={() => patchEntity({ entity: "ZONE", zoneId: z.id, supportsCod: !z.supportsCod }, `COD modifié`)}
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold cursor-pointer ${z.supportsCod ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                      >
                        {z.supportsCod ? `Oui (max ${formatFcfa(z.codMaxFcfa)})` : "Non"}
                      </button>
                    </td>
                    <td className="py-3 text-right">
                      <button onClick={() => deleteEntity("ZONE", z.id, z.zoneName)} className="rounded-lg bg-red-50 p-1.5 text-red-700 cursor-pointer">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 8: CODES PROMO */}
      {activeTab === "coupons" && (
        <div className="grid gap-6 lg:grid-cols-12">
          <form onSubmit={handleCreateCoupon} className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 h-fit">
            <h2 className="text-base font-extrabold text-[#0B192C] flex items-center gap-2">
              <Plus className="h-4 w-4 text-orange-500" /> Créer un Code Promo
            </h2>
            <input type="text" required value={newCode} onChange={(e) => setNewCode(e.target.value.toUpperCase())} placeholder="EX: DOUALA20" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold uppercase" />
            <div className="grid grid-cols-2 gap-3">
              <Select
                size="sm"
                value={newType}
                onChange={(v) => setNewType(v as "PERCENT" | "FIXED")}
                buttonClassName="font-semibold"
                options={[
                  { value: "PERCENT", label: "Pourcentage (%)" },
                  { value: "FIXED", label: "Montant fixe (FCFA)" },
                ]}
              />
              <input type="number" required min={1} value={newValue} onChange={(e) => setNewValue(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold" />
            </div>
            <input type="number" min={0} value={newMinOrder} onChange={(e) => setNewMinOrder(e.target.value)} placeholder="Minimum FCFA" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold" />
            <button type="submit" className="w-full rounded-xl bg-orange-500 py-2.5 text-xs font-extrabold text-white hover:bg-orange-600 cursor-pointer">
              Publier le code promo
            </button>
          </form>

          <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm overflow-x-auto">
            <h2 className="text-base font-extrabold text-[#0B192C] mb-4">Codes Promo ({coupons.length})</h2>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase">
                  <th className="py-3 pr-4">Code</th>
                  <th className="py-3 pr-4">Remise</th>
                  <th className="py-3 pr-4">Minimum</th>
                  <th className="py-3 pr-4">Utilisations</th>
                  <th className="py-3 pr-4">Statut</th>
                  <th className="py-3 text-right">Suppr.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coupons.map((c) => (
                  <tr key={c.id}>
                    <td className="py-3 pr-4 font-extrabold text-[#0B192C]">{c.code}</td>
                    <td className="py-3 pr-4 font-semibold text-emerald-700">{c.discountType === "PERCENT" ? `-${c.value}%` : `-${formatFcfa(c.value)}`}</td>
                    <td className="py-3 pr-4 tabular-nums">{formatFcfa(c.minOrderFcfa)}</td>
                    <td className="py-3 pr-4">{c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ""}</td>
                    <td className="py-3 pr-4">
                      <button
                        onClick={() => patchEntity({ entity: "COUPON", couponId: c.id, active: !c.active }, `Code ${c.code} modifié`)}
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold cursor-pointer ${c.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                      >
                        {c.active ? "Actif" : "Inactif"}
                      </button>
                    </td>
                    <td className="py-3 text-right">
                      <button onClick={() => deleteEntity("COUPON", c.id, c.code)} className="rounded-lg bg-red-50 p-1.5 text-red-700 cursor-pointer">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 9: SYSTEME, PUSH & LOGS */}
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

          <div className="grid gap-6 lg:grid-cols-12">
            <form onSubmit={handleBroadcastPush} className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3 h-fit">
              <h2 className="text-base font-extrabold text-[#0B192C] flex items-center gap-2">
                <Send className="h-4 w-4 text-orange-500" /> Diffuser un Push PWA ({metrics.pushSubscribers} abonnés)
              </h2>
              <input type="text" required value={pushTitle} onChange={(e) => setPushTitle(e.target.value)} placeholder="Titre de l'alerte (ex: Vente Flash Douala !)" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs" />
              <textarea required rows={3} value={pushMessage} onChange={(e) => setPushMessage(e.target.value)} placeholder="Message de la notification..." className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs" />
              <input type="text" value={pushUrl} onChange={(e) => setPushUrl(e.target.value)} placeholder="Lien cible (ex: /catalogue)" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs" />
              <button type="submit" className="w-full rounded-xl bg-[#0B192C] py-2.5 text-xs font-extrabold text-white hover:bg-[#1E3A5F] cursor-pointer">
                Envoyer à tous les appareils
              </button>
            </form>

            <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm overflow-x-auto">
              <h2 className="text-base font-extrabold text-[#0B192C] mb-4">Journaux des Notifications ({notifications.length})</h2>
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
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">{n.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
