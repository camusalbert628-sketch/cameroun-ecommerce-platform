"use client";

import React, { useEffect, useState } from "react";
import { Store, PlusCircle, Package, Wallet, ShieldCheck, AlertCircle, Upload, CreditCard, Globe, Bell } from "lucide-react";
import { useApp } from "@/components/Providers";
import { formatFcfa, ORDER_STATUS_META } from "@/lib/format";

interface VendorProduct {
  id: string;
  title: string;
  sku: string;
  priceFcfa: number;
  stock: number;
  qualityStatus: string;
  category: { name: string };
  variants?: { id: string; label: string; priceFcfa: number; stock: number }[];
}

interface VendorOrder {
  id: string;
  orderNumber: string;
  city: string;
  status: string;
  totalFcfa: number;
  commissionTotalFcfa: number;
  createdAt: string;
  items: { id: string; quantity: number; unitPriceFcfa: number; commissionFcfa: number; product: { title: string } }[];
}

export default function VendeurPage() {
  const { user, showToast } = useApp();
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  // New product form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceFcfa, setPriceFcfa] = useState("25000");
  const [stock, setStock] = useState("15");
  const [categoryId, setCategoryId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadingImg, setUploadingImg] = useState(false);

  // SaaS Billing state
  const [billing, setBilling] = useState<{
    store?: { plan: string; name: string; slug: string; customDomain?: string | null };
    productCount: number;
    maxProducts: number | null;
    commissionRate: number;
    invoices: { id: string; invoiceNumber: string; plan: string; amountFcfa: number; createdAt: string }[];
  } | null>(null);
  const [customDomainInput, setCustomDomainInput] = useState("");
  const [notifications, setNotifications] = useState<
    { id: string; channel: string; recipient: string; subject: string; status: string; createdAt: string }[]
  >([]);

  // Variant form state
  const [variantProductId, setVariantProductId] = useState<string | null>(null);
  const [varLabel, setVarLabel] = useState("");
  const [varUsesCustomPrice, setVarUsesCustomPrice] = useState(false);
  const [varPrice, setVarPrice] = useState("");
  const [varStock, setVarStock] = useState("10");

  const isVendor = user?.role === "VENDOR" && user.vendorProfile;

  const loadData = async () => {
    const [pRes, oRes, bRes, nRes] = await Promise.all([
      fetch("/api/products?includeAll=true"),
      fetch(`/api/orders?vendorId=${user?.vendorProfile?.id || ""}`),
      fetch("/api/billing"),
      fetch("/api/notifications"),
    ]);
    if (bRes.ok) {
      const bData = await bRes.json();
      setBilling(bData);
      if (bData.store?.customDomain) setCustomDomainInput(bData.store.customDomain);
    }
    if (nRes.ok) {
      const nData = await nRes.json();
      setNotifications(nData.notifications || []);
    }
    if (pRes.ok) {
      const pData = await pRes.json();
      const allP = pData.products || [];
      setProducts(
        allP.filter((p: { vendorId: string | null }) => p.vendorId === user?.vendorProfile?.id)
      );
      // Extract unique categories
      const catMap = new Map<string, string>();
      allP.forEach((p: { category: { id: string; name: string } }) =>
        catMap.set(p.category.id, p.category.name)
      );
      const cats = Array.from(catMap.entries()).map(([id, name]) => ({ id, name }));
      setCategories(cats);
      if (cats.length > 0 && !categoryId) setCategoryId(cats[0].id);
    }
    if (oRes.ok) {
      const oData = await oRes.json();
      setOrders(oData.orders || []);
    }
  };

  useEffect(() => {
    if (isVendor) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!isVendor) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <Store className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-extrabold text-[#0B192C]">Interface Vendeur Partenaire (Chap. 13.C)</h1>
        <p className="text-sm text-slate-600">
          Connectez-vous avec un compte Vendeur Partenaire ou créez votre boutique SaaS pour gérer vos produits, variantes et stocks.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <a
            href="/compte?redirect=/vendeur"
            className="rounded-xl bg-[#0B192C] px-5 py-3 text-sm font-bold text-white hover:bg-[#1E3A5F]"
          >
            Se connecter
          </a>
          <a
            href="/inscription-boutique"
            className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700"
          >
            Créer ma boutique SaaS
          </a>
        </div>
      </div>
    );
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        setImageUrl(data.url);
        showToast("Image produit chargée avec succès.");
      } else {
        const err = await res.json();
        showToast(err.error || "Erreur lors de l'envoi de l'image.");
      }
    } finally {
      setUploadingImg(false);
    }
  };

  const handleSaveDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/stores/domain", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customDomain: customDomainInput }),
    });
    if (res.ok) {
      showToast("Domaine personnalisé enregistré !");
      loadData();
    } else {
      const err = await res.json();
      showToast(err.error || "Erreur lors de l'enregistrement du domaine.");
    }
  };

  const handleUpgradePlan = async (plan: string) => {
    const res = await fetch("/api/billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, paymentMethod: "ORANGE_MONEY" }),
    });
    if (res.ok) {
      showToast(`Abonnement mis à niveau vers le plan ${plan} !`);
      loadData();
    } else {
      const err = await res.json();
      showToast(err.error || "Erreur lors de la mise à niveau.");
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        priceFcfa: Number(priceFcfa),
        stock: Number(stock),
        categoryId,
        imageUrl: imageUrl || undefined,
      }),
    });
    if (res.ok) {
      setTitle("");
      setDescription("");
      setImageUrl("");
      showToast("Produit soumis au contrôle qualité (PENDING_QC) avant publication.");
      loadData();
    } else {
      const err = await res.json();
      showToast(err.error || "Impossible d'ajouter le produit.");
    }
  };

  const handleStockAdjust = async (id: string, addQty: number) => {
    const res = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addStock: addQty }),
    });
    if (res.ok) {
      showToast(`Réapprovisionnement (+${addQty}) effectué en tenant compte du stock existant.`);
      loadData();
    }
  };

  const handleRestockVariant = async (productId: string, variantId: string, addQty: number) => {
    const res = await fetch(`/api/products/${productId}/variants`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId, addStock: addQty }),
    });
    if (res.ok) {
      showToast(`Variante réapprovisionnée (+${addQty} unités).`);
      loadData();
    }
  };

  const handleAddVariant = async (e: React.FormEvent, productId: string) => {
    e.preventDefault();
    const res = await fetch(`/api/products/${productId}/variants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: varLabel,
        usesCustomPrice: varUsesCustomPrice,
        priceFcfa: varUsesCustomPrice ? Number(varPrice) : undefined,
        initialStock: Number(varStock),
      }),
    });
    if (res.ok) {
      showToast("Variante enregistrée avec prix et stock initial.");
      setVariantProductId(null);
      setVarLabel("");
      setVarUsesCustomPrice(false);
      setVarPrice("");
      setVarStock("10");
      loadData();
    } else {
      const err = await res.json();
      showToast(err.error || "Erreur lors de l'ajout de la variante.");
    }
  };

  const vp = user.vendorProfile!;
  const grossSales = orders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.unitPriceFcfa * i.quantity, 0),
    0
  );
  const totalCommissions = orders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.commissionFcfa, 0),
    0
  );

  // Out-of-stock alerts detection
  const outOfStockMessages: string[] = [];
  products.forEach((p) => {
    if (p.variants && p.variants.length > 0) {
      p.variants.forEach((v) => {
        if (v.stock <= 0) {
          outOfStockMessages.push(`Variante épuisée : ${v.label} (${p.title})`);
        }
      });
    } else if (p.stock <= 0) {
      outOfStockMessages.push(`Produit épuisé : ${p.title}`);
    }
  });

  return (
    <div className="mx-auto max-w-[1680px] px-4 py-8 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
            Interface C — Portail Vendeur Partenaire
          </span>
          <h1 className="text-3xl font-extrabold text-[#0B192C]">{vp.companyName}</h1>
          <p className="text-xs text-slate-500">
            Commission plateforme : <strong>{Math.round(vp.commissionRate * 100)}%</strong> · Statut : Partenaire Agréé Vérifié
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      {outOfStockMessages.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 space-y-1">
          <div className="font-extrabold flex items-center gap-1.5 text-sm">
            <AlertCircle className="h-4 w-4 text-red-600" />
            Alertes Ruptures de Stock ({outOfStockMessages.length})
          </div>
          {outOfStockMessages.map((msg) => (
            <div key={msg} className="font-semibold">• {msg}</div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Ventes Brutes Partenaire</span>
            <Store className="h-4 w-4 text-[#1E3A5F]" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-[#0B192C] tabular-nums">{formatFcfa(grossSales)}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Commissions Plateforme</span>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-orange-600 tabular-nums">{formatFcfa(totalCommissions)}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Revenu Net Vendeur</span>
            <Wallet className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-700 tabular-nums">
            {formatFcfa(grossSales - totalCommissions)}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Articles en Catalogue</span>
            <Package className="h-4 w-4 text-[#1E3A5F]" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-[#0B192C]">{products.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Submit new product */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-[#0B192C] flex items-center gap-2">
              <PlusCircle className="h-4 w-4 text-emerald-600" />
              Soumettre un nouveau produit
            </h2>
            <p className="text-xs text-slate-500">
              Tout nouvel article passe en statut <strong>PENDING_QC</strong> pour validation qualité par l&apos;administrateur avant mise en ligne.
            </p>
            <form onSubmit={handleAddProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nom du produit</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Routeur 4G Huawei B311..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Prix (FCFA)</label>
                  <input
                    type="number"
                    required
                    value={priceFcfa}
                    onChange={(e) => setPriceFcfa(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Stock initial</label>
                  <input
                    type="number"
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catégorie</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Photo du produit (max 2 Mo)</label>
                <label className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer">
                  <Upload className="h-4 w-4 text-[#1E3A5F]" />
                  <span>{uploadingImg ? "Chargement..." : imageUrl ? "Image prête ✓ (Changer)" : "Choisir une image (.jpg, .png, .webp)"}</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description & Garantie</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition cursor-pointer"
              >
                Soumettre au Contrôle Qualité
              </button>
            </form>
          </div>
        </div>

        {/* Products & Orders */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-extrabold text-[#0B192C] mb-4">Mes Produits & Stocks</h2>
            <div className="divide-y divide-slate-100">
              {products.map((p) => (
                <div key={p.id} className="py-3.5 text-xs space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{p.title}</div>
                      <div className="text-slate-500">
                        {p.sku} · {formatFcfa(p.priceFcfa)}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 font-bold ${
                          p.qualityStatus === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {p.qualityStatus === "APPROVED" ? "Publié (QC OK)" : "En attente QC"}
                      </span>
                      <button
                        onClick={() => handleStockAdjust(p.id, 5)}
                        className="rounded-lg border border-slate-200 px-2.5 py-1 font-semibold hover:bg-slate-50 cursor-pointer"
                      >
                        Stock: {p.stock} (+5 réappro)
                      </button>
                      <button
                        onClick={() => {
                          setVariantProductId(variantProductId === p.id ? null : p.id);
                          setVarUsesCustomPrice(false);
                          setVarPrice(String(p.priceFcfa));
                        }}
                        className="rounded-lg bg-[#0B192C] px-2.5 py-1 font-bold text-white hover:bg-[#1E3A5F] cursor-pointer"
                      >
                        + Variante
                      </button>
                    </div>
                  </div>

                  {p.variants && p.variants.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pl-2">
                      {p.variants.map((v) => (
                        <span
                          key={v.id}
                          className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold ${
                            v.stock <= 0 ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {v.stock <= 0 ? `Variante épuisée : ${v.label}` : `${v.label} · ${formatFcfa(v.priceFcfa)} (${v.stock})`}
                          <button
                            type="button"
                            onClick={() => handleRestockVariant(p.id, v.id, 5)}
                            className="rounded bg-white px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200 hover:bg-emerald-50 cursor-pointer"
                            title="Réapprovisionner +5"
                          >
                            +5
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {variantProductId === p.id && (
                    <form
                      onSubmit={(e) => handleAddVariant(e, p.id)}
                      className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Libellé de la variante * (ex: Pointure 39, 512 Go)
                          </label>
                          <input
                            required
                            value={varLabel}
                            onChange={(e) => setVarLabel(e.target.value)}
                            placeholder="Ex: Pointure 39"
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Quantité initiale disponible *
                          </label>
                          <input
                            type="number"
                            min={0}
                            required
                            value={varStock}
                            onChange={(e) => setVarStock(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 rounded-lg bg-white p-3 border border-slate-200">
                        <div className="text-[11px] font-bold text-[#0B192C]">
                          Souhaitez-vous attribuer un prix spécifique à cette variante ?
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              checked={!varUsesCustomPrice}
                              onChange={() => setVarUsesCustomPrice(false)}
                            />
                            <span>Conserver le prix initial ({formatFcfa(p.priceFcfa)})</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              checked={varUsesCustomPrice}
                              onChange={() => setVarUsesCustomPrice(true)}
                            />
                            <span>Attribuer un prix spécifique</span>
                          </label>
                        </div>

                        {varUsesCustomPrice && (
                          <div className="pt-1">
                            <input
                              type="number"
                              min={100}
                              required
                              value={varPrice}
                              onChange={(e) => setVarPrice(e.target.value)}
                              placeholder="Nouveau prix en FCFA"
                              className="w-full sm:w-56 rounded-lg border border-slate-200 px-3 py-1.5 text-xs"
                            />
                          </div>
                        )}
                      </div>

                      <button
                        type="submit"
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer"
                      >
                        Enregistrer la variante
                      </button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-extrabold text-[#0B192C] mb-4 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> Commandes Partenaire
            </h2>
            <div className="divide-y divide-slate-100">
              {orders.map((o) => {
                const st = ORDER_STATUS_META[o.status] || ORDER_STATUS_META.CONFIRMED;
                return (
                  <div key={o.id} className="py-3 text-xs flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900">{o.orderNumber} · {o.city}</div>
                      <div className="text-slate-500">
                        {o.items.map((i) => `${i.quantity}x ${i.product.title}`).join(", ")}
                      </div>
                    </div>
                    <span className={`rounded-full border px-2.5 py-0.5 font-bold ${st.color}`}>{st.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {billing?.store && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-extrabold text-[#0B192C] flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-orange-500" /> Mon Abonnement SaaS ({billing.store.plan})
                </h2>
                <span className="text-xs font-bold text-slate-500">
                  Quota produits : {billing.productCount} / {billing.maxProducts ?? "Illimité"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {["STARTER", "PRO", "BUSINESS"].map((planId) => (
                  <button
                    key={planId}
                    type="button"
                    disabled={billing.store?.plan === planId}
                    onClick={() => handleUpgradePlan(planId)}
                    className={`rounded-xl px-3.5 py-2 font-bold transition cursor-pointer ${
                      billing.store?.plan === planId
                        ? "bg-emerald-100 text-emerald-800 cursor-default"
                        : "bg-[#0B192C] text-white hover:bg-[#1E3A5F]"
                    }`}
                  >
                    {billing.store?.plan === planId ? `Plan actif : ${planId}` : `Passer au plan ${planId}`}
                  </button>
                ))}
              </div>
              {billing.invoices.length > 0 && (
                <div className="border-t border-slate-100 pt-3 space-y-1 text-xs">
                  <div className="font-bold text-slate-700">Dernières factures SaaS :</div>
                  {billing.invoices.slice(0, 3).map((inv) => (
                    <div key={inv.id} className="flex justify-between text-slate-600">
                      <span>{inv.invoiceNumber} ({inv.plan})</span>
                      <span className="font-bold text-[#0B192C]">{formatFcfa(inv.amountFcfa)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Custom Domain (PRO / BUSINESS) */}
              <form onSubmit={handleSaveDomain} className="border-t border-slate-100 pt-4 space-y-2">
                <div className="text-xs font-bold text-[#0B192C] flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-[#1E3A5F]" /> Domaine Personnalisé (Plans Pro &amp; Business)
                </div>
                <div className="flex gap-2">
                  <input
                    value={customDomainInput}
                    onChange={(e) => setCustomDomainInput(e.target.value)}
                    placeholder="Ex: boutique.mamarque.cm"
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-[#1E3A5F] px-4 py-2 text-xs font-bold text-white hover:bg-[#0B192C] cursor-pointer"
                  >
                    Lier
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Automated Notifications Log */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
            <h2 className="text-base font-extrabold text-[#0B192C] flex items-center gap-2">
              <Bell className="h-4 w-4 text-emerald-600" /> Journal Notifications (WhatsApp / Email)
            </h2>
            {notifications.length === 0 ? (
              <p className="text-xs text-slate-500">Aucune notification envoyée pour le moment.</p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="py-2.5 text-xs flex items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900">{n.subject}</div>
                      <div className="text-slate-500">
                        {n.channel} → {n.recipient}
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      {n.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

