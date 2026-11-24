"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Store,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  Palette,
  Globe,
  AlertCircle,
  Upload,
  Plus,
  Trash2,
  Lock,
  Eye,
  RotateCcw,
  ExternalLink,
  LayoutDashboard,
  Loader2,
} from "lucide-react";
import { useApp } from "@/components/Providers";
import { LiveStorePreview } from "@/components/onboarding/LiveStorePreview";
import {
  COMMERCE_TYPES,
  PLANS,
  SECTORS,
  THEME_PRESETS,
  slugify,
  type InitialProductDraft,
  type OnboardingDraft,
} from "@/components/onboarding/types";

const DRAFT_STORAGE_KEY = "albedoo_store_onboarding_draft_v1";

const STEP_LABELS = [
  { num: 1, short: "Identité", title: "Identité de la boutique" },
  { num: 2, short: "Adresse", title: "Adresse & identité numérique" },
  { num: 3, short: "Design", title: "Personnalisation visuelle" },
  { num: 4, short: "Admin", title: "Compte & infos administratives" },
  { num: 5, short: "Config", title: "Configuration & abonnement" },
  { num: 6, short: "Produits", title: "Premiers produits" },
  { num: 7, short: "Publier", title: "Récapitulatif & publication" },
];

function createDefaultDraft(): OnboardingDraft {
  return {
    step: 1,
    idempotencyKey: `store-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    storeName: "",
    tagline: "",
    logoUrl: "",
    bannerUrl: "",
    sector: "Commerce général",
    commerceType: "B2C",
    currency: "FCFA",
    country: "Cameroun",
    city: "Douala",
    businessPhone: "+237 6",
    businessEmail: "",
    customSlug: "",
    slugEdited: false,
    themePreset: "albedoo",
    primaryColor: "#0B192C",
    secondaryColor: "#1E3A5F",
    accentColor: "#F97316",
    buttonColor: "#F97316",
    ownerName: "",
    email: "",
    password: "",
    phone: "+237 6",
    whatsappPhone: "+237 6",
    rccm: "",
    niu: "",
    address: "",
    quarter: "",
    description: "",
    plan: "PRO",
    paymentMethods: ["ORANGE_MONEY", "MTN_MOMO", "CASH_ON_DELIVERY"],
    deliveryEnabled: true,
    pickupEnabled: true,
    stockManagement: true,
    showPrices: true,
    notificationsEnabled: true,
    productMode: "CUSTOM",
    initialProducts: [],
  };
}

export default function InscriptionBoutiquePage() {
  const { refreshAuth, showToast } = useApp();
  const [draft, setDraft] = useState<OnboardingDraft>(createDefaultDraft);
  const [hydrated, setHydrated] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [slugSuggestions, setSlugSuggestions] = useState<string[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdStore, setCreatedStore] = useState<{ name: string; slug: string; plan: string; status: string } | null>(null);

  // Restore saved draft on mount (password is intentionally never persisted in localStorage)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<OnboardingDraft>;
        setDraft((prev) => ({
          ...prev,
          ...parsed,
          password: "",
          idempotencyKey: parsed.idempotencyKey || prev.idempotencyKey,
        }));
      }
    } catch {
      // ignore invalid draft
    }
    setHydrated(true);

    fetch("/api/products")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.categories) setCategories(d.categories);
      })
      .catch(() => {});
  }, []);

  // Auto-save draft progressively
  useEffect(() => {
    if (!hydrated || createdStore) return;
    try {
      const { password: _ignored, ...safeDraft } = draft;
      void _ignored;
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(safeDraft));
      setSavedAt(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
    } catch {
      // ignore storage quota errors
    }
  }, [draft, hydrated, createdStore]);

  // Auto-generate slug from storeName if user hasn't edited slug manually
  useEffect(() => {
    if (!hydrated || draft.slugEdited) return;
    setDraft((prev) => ({ ...prev, customSlug: slugify(prev.storeName) }));
  }, [draft.storeName, draft.slugEdited, hydrated]);

  // Live slug availability check
  useEffect(() => {
    const clean = slugify(draft.customSlug);
    if (clean.length < 3) {
      setSlugStatus("idle");
      setSlugSuggestions([]);
      return;
    }
    setSlugStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/stores?checkSlug=${encodeURIComponent(clean)}`);
        if (res.ok) {
          const data = await res.json();
          setSlugStatus(data.available ? "available" : "taken");
          setSlugSuggestions(data.suggestions || []);
        }
      } catch {
        setSlugStatus("idle");
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [draft.customSlug]);

  const updateDraft = <K extends keyof OnboardingDraft>(key: K, value: OnboardingDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleUploadImage = async (
    file: File,
    onSuccess: (url: string) => void,
    fieldKey: string
  ) => {
    setError(null);
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Format d'image invalide. Utilisez PNG, JPG ou WebP.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Image trop volumineuse (maximum 2 Mo).");
      return;
    }

    setUploadingField(fieldKey);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload?scope=onboarding", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de l'envoi de l'image.");
      } else {
        onSuccess(data.url);
        showToast("Image téléchargée avec succès.");
      }
    } catch {
      setError("Erreur réseau lors de l'envoi de l'image.");
    } finally {
      setUploadingField(null);
    }
  };

  const validateStep = (stepNum: number): string | null => {
    if (stepNum === 1) {
      if (!draft.storeName.trim()) return "Veuillez saisir le nom commercial de votre boutique.";
    }
    if (stepNum === 2) {
      const clean = slugify(draft.customSlug);
      if (clean.length < 3) return "L'adresse de la boutique doit contenir au moins 3 caractères.";
      if (slugStatus === "taken") return "Cette adresse est déjà utilisée. Choisissez une suggestion ou un autre nom.";
    }
    if (stepNum === 4) {
      if (!draft.ownerName.trim()) return "Veuillez renseigner le nom complet du dirigeant.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) return "Veuillez saisir une adresse email valide.";
      if (draft.password.length < 6) return "Le mot de passe doit contenir au moins 6 caractères.";
    }
    if (stepNum === 6 && draft.productMode === "CUSTOM") {
      const invalid = draft.initialProducts.some((p) => !p.title.trim() || Number(p.priceFcfa) <= 0);
      if (invalid) return "Chaque produit ajouté doit avoir un nom et un prix de vente supérieur à 0.";
    }
    return null;
  };

  const goToStep = (nextStep: number) => {
    setError(null);
    if (nextStep > draft.step) {
      const msg = validateStep(draft.step);
      if (msg) {
        setError(msg);
        return;
      }
    }
    updateDraft("step", Math.min(7, Math.max(1, nextStep)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleResetDraft = () => {
    if (!window.confirm("Réinitialiser tout le brouillon de création de boutique ?")) return;
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setDraft(createDefaultDraft());
    setAcceptedTerms(false);
    setError(null);
    showToast("Brouillon réinitialisé.");
  };

  const addProductRow = () => {
    const newProd: InitialProductDraft = {
      id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: "",
      description: "",
      priceFcfa: "15000",
      costPriceFcfa: "10000",
      stock: "10",
      categoryId: categories[0]?.id || "",
      imageUrl: "",
    };
    updateDraft("initialProducts", [...draft.initialProducts, newProd]);
  };

  const updateProductRow = (id: string, patch: Partial<InitialProductDraft>) => {
    updateDraft(
      "initialProducts",
      draft.initialProducts.map((p) => (p.id === id ? { ...p, ...patch } : p))
    );
  };

  const removeProductRow = (id: string) => {
    updateDraft(
      "initialProducts",
      draft.initialProducts.filter((p) => p.id !== id)
    );
  };

  const handleSubmit = async () => {
    setError(null);
    for (const s of [1, 2, 4, 6]) {
      const msg = validateStep(s);
      if (msg) {
        setError(`Étape ${s} : ${msg}`);
        updateDraft("step", s);
        return;
      }
    }
    if (!acceptedTerms) {
      setError("Veuillez accepter les conditions d'utilisation et la politique de confidentialité.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: draft.idempotencyKey,
          ownerName: draft.ownerName,
          email: draft.email,
          password: draft.password,
          phone: draft.phone,
          storeName: draft.storeName,
          customSlug: slugify(draft.customSlug),
          tagline: draft.tagline,
          description: draft.description,
          logoUrl: draft.logoUrl,
          bannerUrl: draft.bannerUrl,
          sector: draft.sector,
          commerceType: draft.commerceType,
          currency: draft.currency,
          country: draft.country,
          city: draft.city,
          quarter: draft.quarter,
          address: draft.address,
          businessPhone: draft.businessPhone,
          whatsappPhone: draft.whatsappPhone,
          businessEmail: draft.businessEmail,
          primaryColor: draft.primaryColor,
          secondaryColor: draft.secondaryColor,
          accentColor: draft.accentColor,
          buttonColor: draft.buttonColor,
          themePreset: draft.themePreset,
          plan: draft.plan,
          rccm: draft.rccm,
          niu: draft.niu,
          commercialConfig: {
            paymentMethods: draft.paymentMethods,
            deliveryEnabled: draft.deliveryEnabled,
            pickupEnabled: draft.pickupEnabled,
            stockManagement: draft.stockManagement,
            showPrices: draft.showPrices,
            notificationsEnabled: draft.notificationsEnabled,
          },
          productMode:
            draft.productMode === "CUSTOM" && draft.initialProducts.length === 0
              ? "EMPTY"
              : draft.productMode,
          initialProducts: draft.initialProducts.map((p) => ({
            title: p.title,
            description: p.description,
            priceFcfa: Number(p.priceFcfa),
            costPriceFcfa: Number(p.costPriceFcfa) || 0,
            stock: Number(p.stock) || 0,
            categoryId: p.categoryId || undefined,
            imageUrl: p.imageUrl || undefined,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Impossible de créer la boutique.");
        return;
      }

      localStorage.removeItem(DRAFT_STORAGE_KEY);
      await refreshAuth();
      setCreatedStore(data.store);
      showToast(`Boutique « ${data.store.name} » publiée !`);
    } catch {
      setError("Erreur réseau lors de la création. Votre brouillon est conservé.");
    } finally {
      setSubmitting(false);
    }
  };

  if (createdStore) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-3xl border border-emerald-200 bg-white p-8 shadow-xl text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <div>
            <span className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700">
              Statut : {createdStore.status} · Plan {createdStore.plan}
            </span>
            <h1 className="mt-3 text-3xl font-extrabold text-[#0B192C]">
              Félicitations ! {createdStore.name} est en ligne
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Votre espace e-commerce isolé est prêt. Vous pouvez partager votre adresse publique ou gérer vos commandes depuis votre espace vendeur.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm font-bold text-[#0B192C]">
            URL publique : <span className="text-orange-600">/s/{createdStore.slug}</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href={`/s/${createdStore.slug}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-extrabold text-[#0B192C] hover:bg-slate-50"
            >
              <ExternalLink className="h-4 w-4" /> Voir ma boutique
            </Link>
            <Link
              href="/vendeur"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3.5 text-sm font-extrabold text-white shadow-lg hover:bg-orange-600"
            >
              <LayoutDashboard className="h-4 w-4" /> Accéder à mon espace vendeur
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const showLivePreview = draft.step === 1 || draft.step === 2 || draft.step === 3 || draft.step === 6;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-r from-[#0B192C] to-[#1E3A5F] p-6 sm:p-8 text-white shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-orange-300 mb-2">
            <Sparkles className="h-3.5 w-3.5" /> Assistant de Création SaaS · COMMERCIA / Albedo&apos;o
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">Créez votre boutique professionnelle</h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-300">
            Étape {draft.step} sur 7 : <strong>{STEP_LABELS[draft.step - 1].title}</strong>
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {savedAt && (
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] text-emerald-300 font-semibold">
              Brouillon sauvegardé ({savedAt})
            </span>
          )}
          <button
            type="button"
            onClick={handleResetDraft}
            className="inline-flex items-center gap-1 rounded-xl bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-white/20 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Réinitialiser
          </button>
        </div>
      </div>

      {/* Horizontal Stepper (Desktop) & Progress Bar (Mobile) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="hidden md:grid grid-cols-7 gap-2">
          {STEP_LABELS.map((s) => {
            const active = draft.step === s.num;
            const done = draft.step > s.num;
            return (
              <button
                key={s.num}
                type="button"
                onClick={() => (s.num <= draft.step ? goToStep(s.num) : goToStep(s.num))}
                className={`flex flex-col items-center rounded-xl p-2 text-center transition cursor-pointer ${
                  active
                    ? "bg-[#0B192C] text-white shadow-sm"
                    : done
                    ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
              >
                <span className="text-[10px] font-black uppercase">Étape {s.num}</span>
                <span className="text-xs font-bold mt-0.5 truncate w-full">{s.short}</span>
              </button>
            );
          })}
        </div>
        <div className="md:hidden space-y-2">
          <div className="flex justify-between text-xs font-bold text-[#0B192C]">
            <span>{STEP_LABELS[draft.step - 1].title}</span>
            <span>{draft.step} / 7</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-orange-500 transition-all duration-300"
              style={{ width: `${(draft.step / 7) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Main Content + Optional Live Preview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className={showLivePreview ? "lg:col-span-7 space-y-6" : "lg:col-span-12 space-y-6"}>
          {/* STEP 1: IDENTITÉ */}
          {draft.step === 1 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
              <h2 className="text-lg font-extrabold text-[#0B192C] flex items-center gap-2">
                <Store className="h-5 w-5 text-orange-500" /> Étape 1 — Identité de la boutique
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nom commercial *</label>
                  <input
                    value={draft.storeName}
                    onChange={(e) => updateDraft("storeName", e.target.value)}
                    placeholder="Ex: Douala Tech Store"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Slogan ou description courte</label>
                  <input
                    value={draft.tagline}
                    onChange={(e) => updateDraft("tagline", e.target.value)}
                    placeholder="Ex: Smartphones et accessoires certifiés à Akwa"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Secteur d&apos;activité</label>
                  <select
                    value={draft.sector}
                    onChange={(e) => updateDraft("sector", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  >
                    {SECTORS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Type de commerce</label>
                  <select
                    value={draft.commerceType}
                    onChange={(e) => updateDraft("commerceType", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  >
                    {COMMERCE_TYPES.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pays</label>
                  <input
                    value={draft.country}
                    onChange={(e) => updateDraft("country", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ville principale</label>
                  <select
                    value={draft.city}
                    onChange={(e) => updateDraft("city", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  >
                    <option value="Douala">Douala</option>
                    <option value="Yaoundé">Yaoundé</option>
                    <option value="Bafoussam">Bafoussam</option>
                    <option value="Kribi">Kribi</option>
                    <option value="Garoua">Garoua</option>
                    <option value="Bamenda">Bamenda</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Devise</label>
                  <select
                    value={draft.currency}
                    onChange={(e) => updateDraft("currency", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  >
                    <option value="FCFA">FCFA (XAF)</option>
                    <option value="EUR">Euro (€)</option>
                    <option value="USD">Dollar ($)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Téléphone professionnel</label>
                  <input
                    value={draft.businessPhone}
                    onChange={(e) => updateDraft("businessPhone", e.target.value)}
                    placeholder="+237 6XX XXX XXX"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">E-mail professionnel (facultatif)</label>
                  <input
                    type="email"
                    value={draft.businessEmail}
                    onChange={(e) => updateDraft("businessEmail", e.target.value)}
                    placeholder="contact@maboutique.cm"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
                  />
                </div>

                {/* Logo & Banner Upload */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Logo (PNG/JPG/WebP, max 2 Mo)</label>
                  <label className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer">
                    {uploadingField === "logo" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 text-orange-500" />}
                    {draft.logoUrl ? "Changer le logo" : "Télécharger un logo"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUploadImage(f, (url) => updateDraft("logoUrl", url), "logo");
                      }}
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Image de couverture (optionnel)</label>
                  <label className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer">
                    {uploadingField === "banner" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 text-orange-500" />}
                    {draft.bannerUrl ? "Changer la couverture" : "Télécharger une bannière"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUploadImage(f, (url) => updateDraft("bannerUrl", url), "banner");
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: ADRESSE & IDENTITÉ NUMÉRIQUE */}
          {draft.step === 2 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
              <h2 className="text-lg font-extrabold text-[#0B192C] flex items-center gap-2">
                <Globe className="h-5 w-5 text-orange-500" /> Étape 2 — Adresse &amp; Identité Numérique
              </h2>
              <p className="text-xs text-slate-600">
                Choisissez l&apos;adresse web unique de votre boutique. Les caractères spéciaux et accents sont automatiquement normalisés.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">URL personnalisée *</label>
                <div className="flex items-center rounded-xl border border-slate-300 overflow-hidden bg-slate-50 focus-within:border-orange-500">
                  <span className="px-3 py-3 text-xs font-bold text-slate-500 border-r border-slate-200 shrink-0">
                    albedoo.cm/s/
                  </span>
                  <input
                    value={draft.customSlug}
                    onChange={(e) => {
                      updateDraft("slugEdited", true);
                      updateDraft("customSlug", slugify(e.target.value));
                    }}
                    placeholder="ma-boutique"
                    className="flex-1 bg-white px-3 py-3 text-sm font-extrabold text-[#0B192C] focus:outline-none"
                  />
                </div>

                <div className="mt-2 min-h-[24px]">
                  {slugStatus === "checking" && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Vérification de disponibilité...
                    </span>
                  )}
                  {slugStatus === "available" && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" /> /s/{draft.customSlug} est disponible !
                    </span>
                  )}
                  {slugStatus === "taken" && (
                    <div className="space-y-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600">
                        <AlertCircle className="h-4 w-4" /> Cette adresse est déjà prise.
                      </span>
                      {slugSuggestions.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="text-slate-500">Suggestions :</span>
                          {slugSuggestions.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => {
                                updateDraft("slugEdited", true);
                                updateDraft("customSlug", s);
                              }}
                              className="rounded-lg bg-orange-50 border border-orange-200 px-2.5 py-1 font-bold text-orange-700 hover:bg-orange-100 cursor-pointer"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs space-y-1">
                <div className="font-bold text-slate-500">Aperçu de l&apos;adresse complète :</div>
                <div className="text-sm font-extrabold text-[#0B192C] break-all">
                  https://cameroun-ecommerce-platform.vercel.app/s/{draft.customSlug || "ma-boutique"}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PERSONNALISATION VISUELLE */}
          {draft.step === 3 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
              <h2 className="text-lg font-extrabold text-[#0B192C] flex items-center gap-2">
                <Palette className="h-5 w-5 text-orange-500" /> Étape 3 — Personnalisation visuelle
              </h2>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Thèmes professionnels</label>
                <div className="grid grid-cols-2 gap-3">
                  {THEME_PRESETS.map((t) => {
                    const selected = draft.themePreset === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() =>
                          setDraft((prev) => ({
                            ...prev,
                            themePreset: t.id,
                            primaryColor: t.primary,
                            secondaryColor: t.secondary,
                            accentColor: t.accent,
                            buttonColor: t.button,
                          }))
                        }
                        className={`text-left rounded-xl border p-3 transition cursor-pointer ${
                          selected ? "border-orange-500 bg-orange-50/40 ring-2 ring-orange-500/20" : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-[#0B192C]">{t.name}</span>
                          <div className="flex gap-1">
                            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: t.primary }} />
                            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: t.accent }} />
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{t.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Principale</label>
                  <input
                    type="color"
                    value={draft.primaryColor}
                    onChange={(e) => {
                      updateDraft("themePreset", "custom");
                      updateDraft("primaryColor", e.target.value);
                    }}
                    className="h-10 w-full rounded-xl border border-slate-200 p-1 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Secondaire</label>
                  <input
                    type="color"
                    value={draft.secondaryColor}
                    onChange={(e) => {
                      updateDraft("themePreset", "custom");
                      updateDraft("secondaryColor", e.target.value);
                    }}
                    className="h-10 w-full rounded-xl border border-slate-200 p-1 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Accentuation</label>
                  <input
                    type="color"
                    value={draft.accentColor}
                    onChange={(e) => {
                      updateDraft("themePreset", "custom");
                      updateDraft("accentColor", e.target.value);
                    }}
                    className="h-10 w-full rounded-xl border border-slate-200 p-1 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Boutons</label>
                  <input
                    type="color"
                    value={draft.buttonColor}
                    onChange={(e) => {
                      updateDraft("themePreset", "custom");
                      updateDraft("buttonColor", e.target.value);
                    }}
                    className="h-10 w-full rounded-xl border border-slate-200 p-1 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: COMPTE & INFOS ADMINISTRATIVES */}
          {draft.step === 4 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              <h2 className="text-lg font-extrabold text-[#0B192C]">
                Étape 4 — Compte Dirigeant &amp; Informations Administratives
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nom du dirigeant *</label>
                  <input
                    value={draft.ownerName}
                    onChange={(e) => updateDraft("ownerName", e.target.value)}
                    placeholder="Ex: Marc Fotso"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email de connexion *</label>
                  <input
                    type="email"
                    value={draft.email}
                    onChange={(e) => updateDraft("email", e.target.value)}
                    placeholder="dirigeant@maboutique.cm"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mot de passe (min. 6 car.) *</label>
                  <input
                    type="password"
                    value={draft.password}
                    onChange={(e) => updateDraft("password", e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp professionnel</label>
                  <input
                    value={draft.whatsappPhone}
                    onChange={(e) => updateDraft("whatsappPhone", e.target.value)}
                    placeholder="+237 6XX XXX XXX"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#0B192C]">
                  <Lock className="h-4 w-4 text-amber-600" />
                  Informations administratives privées (jamais affichées publiquement)
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">RCCM (Facultatif)</label>
                    <input
                      value={draft.rccm}
                      onChange={(e) => updateDraft("rccm", e.target.value)}
                      placeholder="Ex: RC/DLA/2026/B/1234"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">NIU (Facultatif)</label>
                    <input
                      value={draft.niu}
                      onChange={(e) => updateDraft("niu", e.target.value)}
                      placeholder="Ex: M032614908821K"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Quartier</label>
                    <input
                      value={draft.quarter}
                      onChange={(e) => updateDraft("quarter", e.target.value)}
                      placeholder="Ex: Akwa / Bastos"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Adresse physique</label>
                    <input
                      value={draft.address}
                      onChange={(e) => updateDraft("address", e.target.value)}
                      placeholder="Rue, immeuble, repère..."
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-1">
                  <Eye className="h-3.5 w-3.5 text-emerald-600" /> Description détaillée (Publique)
                </div>
                <textarea
                  rows={3}
                  value={draft.description}
                  onChange={(e) => updateDraft("description", e.target.value)}
                  placeholder="Présentez votre entreprise, vos garanties et vos délais de livraison..."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
                />
              </div>
            </div>
          )}

          {/* STEP 5: CONFIGURATION COMMERCIALE & ABONNEMENT */}
          {draft.step === 5 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              <h2 className="text-lg font-extrabold text-[#0B192C]">
                Étape 5 — Abonnement &amp; Configuration commerciale
              </h2>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {PLANS.map((p) => {
                  const selected = draft.plan === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => updateDraft("plan", p.id)}
                      className={`text-left rounded-2xl border p-5 transition cursor-pointer ${
                        selected
                          ? "border-orange-500 bg-orange-50/50 ring-2 ring-orange-500/20 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-extrabold text-[#0B192C]">{p.name}</span>
                        {p.recommended && (
                          <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-extrabold text-white">
                            Recommandé
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 text-xl font-black text-[#0B192C]">{p.price}</div>
                      <div className="text-xs font-bold text-emerald-700">{p.commission}</div>
                      <ul className="mt-3 space-y-1.5 text-[11px] text-slate-600">
                        {p.features.map((f) => (
                          <li key={f} className="flex items-start gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 border-t border-slate-100 pt-5">
                <div className="space-y-2">
                  <div className="text-xs font-extrabold text-[#0B192C]">Méthodes de paiement acceptées</div>
                  {[
                    { id: "ORANGE_MONEY", label: "Orange Money" },
                    { id: "MTN_MOMO", label: "MTN Mobile Money" },
                    { id: "CARD_VISA_MC", label: "Carte Visa / Mastercard" },
                    { id: "CASH_ON_DELIVERY", label: "Paiement à la livraison (COD)" },
                  ].map((pm) => {
                    const checked = draft.paymentMethods.includes(pm.id);
                    return (
                      <label key={pm.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...draft.paymentMethods, pm.id]
                              : draft.paymentMethods.filter((x) => x !== pm.id);
                            updateDraft("paymentMethods", next);
                          }}
                        />
                        {pm.label}
                      </label>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-extrabold text-[#0B192C]">Options de fonctionnement</div>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input type="checkbox" checked={draft.deliveryEnabled} onChange={(e) => updateDraft("deliveryEnabled", e.target.checked)} />
                    Livraison à domicile activée
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input type="checkbox" checked={draft.pickupEnabled} onChange={(e) => updateDraft("pickupEnabled", e.target.checked)} />
                    Retrait en boutique (gratuit)
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input type="checkbox" checked={draft.stockManagement} onChange={(e) => updateDraft("stockManagement", e.target.checked)} />
                    Gestion automatique du stock
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input type="checkbox" checked={draft.showPrices} onChange={(e) => updateDraft("showPrices", e.target.checked)} />
                    Afficher les prix publiquement
                  </label>
                  <label className={`flex items-center gap-2 text-xs ${draft.plan === "STARTER" ? "text-slate-400" : "text-slate-700 cursor-pointer"}`}>
                    <input
                      type="checkbox"
                      disabled={draft.plan === "STARTER"}
                      checked={draft.plan !== "STARTER" && draft.notificationsEnabled}
                      onChange={(e) => updateDraft("notificationsEnabled", e.target.checked)}
                    />
                    Notifications commerciales auto {draft.plan === "STARTER" ? "(Plan Pro/Business)" : ""}
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: PREMIERS PRODUITS */}
          {draft.step === 6 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
              <h2 className="text-lg font-extrabold text-[#0B192C]">Étape 6 — Premiers produits</h2>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { id: "CUSTOM" as const, title: "Ajouter mes produits", desc: "Saisissez vos vrais articles dès maintenant" },
                  { id: "EMPTY" as const, title: "Boutique vide", desc: "Je remplirai mon catalogue plus tard" },
                  { id: "DEMO" as const, title: "2 produits démo", desc: "Exemples clairement marqués [Démo]" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      updateDraft("productMode", opt.id);
                      if (opt.id === "CUSTOM" && draft.initialProducts.length === 0) {
                        addProductRow();
                      }
                    }}
                    className={`text-left rounded-xl border p-3.5 transition cursor-pointer ${
                      draft.productMode === opt.id
                        ? "border-orange-500 bg-orange-50/50 ring-2 ring-orange-500/20"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="text-xs font-extrabold text-[#0B192C]">{opt.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>

              {draft.productMode === "CUSTOM" && (
                <div className="space-y-4">
                  {draft.initialProducts.map((prod, idx) => (
                    <div key={prod.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-[#0B192C]">Produit #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeProductRow(prod.id)}
                          className="text-xs font-bold text-red-600 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Retirer
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <input
                          value={prod.title}
                          onChange={(e) => updateProductRow(prod.id, { title: e.target.value })}
                          placeholder="Nom du produit *"
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                        />
                        <select
                          value={prod.categoryId}
                          onChange={(e) => updateProductRow(prod.id, { categoryId: e.target.value })}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min={1}
                          value={prod.priceFcfa}
                          onChange={(e) => updateProductRow(prod.id, { priceFcfa: e.target.value })}
                          placeholder={`Prix de vente (${draft.currency}) *`}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                        />
                        <input
                          type="number"
                          min={0}
                          value={prod.costPriceFcfa}
                          onChange={(e) => updateProductRow(prod.id, { costPriceFcfa: e.target.value })}
                          placeholder={`Prix d'achat (${draft.currency})`}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                        />
                        <input
                          type="number"
                          min={0}
                          value={prod.stock}
                          onChange={(e) => updateProductRow(prod.id, { stock: e.target.value })}
                          placeholder="Quantité en stock"
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                        />
                        <label className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 cursor-pointer">
                          {uploadingField === prod.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5 text-orange-500" />}
                          {prod.imageUrl ? "Image ajoutée ✓" : "Photo produit"}
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleUploadImage(f, (url) => updateProductRow(prod.id, { imageUrl: url }), prod.id);
                            }}
                          />
                        </label>
                      </div>
                      <input
                        value={prod.description}
                        onChange={(e) => updateProductRow(prod.id, { description: e.target.value })}
                        placeholder="Description courte du produit..."
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addProductRow}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-[#0B192C] hover:bg-slate-50 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5 text-orange-500" /> Ajouter un autre produit
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 7: RÉCAPITULATIF & PUBLICATION */}
          {draft.step === 7 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              <h2 className="text-lg font-extrabold text-[#0B192C]">
                Étape 7 — Récapitulatif &amp; Publication
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
                <div className="rounded-xl border border-slate-200 p-4 space-y-1">
                  <div className="flex justify-between font-extrabold text-[#0B192C]">
                    <span>Identité &amp; Adresse</span>
                    <button type="button" onClick={() => goToStep(1)} className="text-orange-600 underline cursor-pointer">Modifier</button>
                  </div>
                  <p><strong>Nom :</strong> {draft.storeName}</p>
                  <p><strong>Secteur :</strong> {draft.sector}</p>
                  <p><strong>URL :</strong> /s/{draft.customSlug}</p>
                  <p><strong>Localisation :</strong> {draft.city}, {draft.country}</p>
                </div>

                <div className="rounded-xl border border-slate-200 p-4 space-y-1">
                  <div className="flex justify-between font-extrabold text-[#0B192C]">
                    <span>Dirigeant &amp; Abonnement</span>
                    <button type="button" onClick={() => goToStep(5)} className="text-orange-600 underline cursor-pointer">Modifier</button>
                  </div>
                  <p><strong>Dirigeant :</strong> {draft.ownerName} ({draft.email})</p>
                  <p><strong>Plan :</strong> {draft.plan}</p>
                  <p><strong>Paiements :</strong> {draft.paymentMethods.join(", ")}</p>
                  <p>
                    <strong>Catalogue initial :</strong>{" "}
                    {draft.productMode === "CUSTOM"
                      ? `${draft.initialProducts.length} produit(s)`
                      : draft.productMode === "DEMO"
                      ? "2 produits démo"
                      : "Boutique vide"}
                  </p>
                </div>
              </div>

              <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  J&apos;accepte les <strong>Conditions Générales d&apos;Utilisation</strong> et la <strong>Politique de Confidentialité</strong> de COMMERCIA / Albedo&apos;o.
                </span>
              </label>

              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-4 text-sm font-extrabold text-white shadow-lg hover:bg-orange-600 disabled:opacity-60 transition cursor-pointer"
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                {submitting ? "Création sécurisée en cours..." : "CRÉER MA BOUTIQUE"}
              </button>
            </div>
          )}

          {/* Step Navigation Controls */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              disabled={draft.step === 1}
              onClick={() => goToStep(draft.step - 1)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" /> Précédent
            </button>

            {draft.step < 7 && (
              <button
                type="button"
                onClick={() => goToStep(draft.step + 1)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B192C] px-6 py-3 text-xs font-extrabold text-white hover:bg-[#1E3A5F] cursor-pointer"
              >
                Continuer <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Live Storefront Preview Column */}
        {showLivePreview && (
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-24">
              <LiveStorePreview draft={draft} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
