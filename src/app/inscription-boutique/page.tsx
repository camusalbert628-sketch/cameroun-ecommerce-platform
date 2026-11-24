"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Store,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
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
  Building2,
  Sliders,
  Package,
  Rocket,
  HelpCircle,
  Save,
  X,
} from "lucide-react";
import { useApp } from "@/components/Providers";
import { Select } from "@/components/ui/Select";
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

const STEP_META = [
  {
    num: 1,
    short: "Identité",
    title: "Identité de la boutique",
    icon: Store,
    tip: "Choisissez un nom mémorable et un secteur précis : cela adapte automatiquement vos catégories et votre présentation.",
  },
  {
    num: 2,
    short: "Adresse",
    title: "Adresse & identité numérique",
    icon: Globe,
    tip: "Une URL courte et sans chiffres (ex: /s/douala-tech) inspire davantage confiance sur WhatsApp et Facebook.",
  },
  {
    num: 3,
    short: "Design",
    title: "Personnalisation visuelle",
    icon: Palette,
    tip: "Testez nos 4 thèmes ou vos propres couleurs et vérifiez le rendu Bureau & Mobile en temps réel à droite.",
  },
  {
    num: 4,
    short: "Admin",
    title: "Compte & infos administratives",
    icon: Building2,
    tip: "Vos données RCCM et NIU restent strictement privées ; seule la description commerciale est affichée aux clients.",
  },
  {
    num: 5,
    short: "Configuration",
    title: "Configuration & abonnement",
    icon: Sliders,
    tip: "Vous pourrez changer de plan SaaS à tout moment depuis votre espace vendeur sans perdre vos produits.",
  },
  {
    num: 6,
    short: "Produits",
    title: "Premiers produits",
    icon: Package,
    tip: "Ajoutez vos propres articles dès maintenant ou démarrez à vide. L'option démo est clairement séparée.",
  },
  {
    num: 7,
    short: "Publication",
    title: "Récapitulatif & publication",
    icon: Rocket,
    tip: "Relisez chaque bloc et cliquez sur « Modifier » si besoin avant de mettre votre boutique en ligne.",
  },
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
  const router = useRouter();
  const { user, showToast } = useApp();
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
  const [errorStep, setErrorStep] = useState<number | null>(null);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const [createdStore, setCreatedStore] = useState<{
    name: string;
    slug: string;
    plan: string;
    status: string;
  } | null>(null);

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

    fetch("/api/saas/drafts")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.draft?.data) {
          setDraft((prev) => ({
            ...prev,
            ...d.draft.data,
            password: "",
          }));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      setDraft((prev) => ({
        ...prev,
        ownerName: prev.ownerName || user.name || "",
        email: prev.email || user.email || "",
        phone: prev.phone === "+237 6" && user.phone ? user.phone : prev.phone,
      }));
    }
  }, [user]);

  useEffect(() => {
    if (!hydrated || createdStore) return;
    try {
      const { password: _ignored, ...safeDraft } = draft;
      void _ignored;
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(safeDraft));
      setSavedAt(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
    } catch {
      // ignore storage errors
    }

    const syncTimer = setTimeout(() => {
      const { password: _p, ...safeDraft } = draft;
      void _p;
      fetch("/api/saas/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName: draft.storeName,
          customSlug: slugify(draft.customSlug),
          plan: draft.plan,
          data: safeDraft,
        }),
      }).catch(() => {});
    }, 1200);

    return () => clearTimeout(syncTimer);
  }, [draft, hydrated, createdStore]);

  useEffect(() => {
    if (!hydrated || draft.slugEdited) return;
    setDraft((prev) => ({ ...prev, customSlug: slugify(prev.storeName) }));
  }, [draft.storeName, draft.slugEdited, hydrated]);

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

  const handleUploadImage = async (file: File, onSuccess: (url: string) => void, fieldKey: string) => {
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
    if (stepNum === 1 && !draft.storeName.trim()) {
      return "Veuillez saisir le nom commercial de votre boutique.";
    }
    if (stepNum === 2) {
      const clean = slugify(draft.customSlug);
      if (clean.length < 3) return "L'adresse de la boutique doit contenir au moins 3 caractères.";
      if (slugStatus === "taken") return "Cette adresse est déjà utilisée. Choisissez une suggestion ou un autre nom.";
    }
    if (stepNum === 4) {
      if (!draft.ownerName.trim()) return "Veuillez renseigner le nom complet du dirigeant.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) return "Veuillez saisir une adresse email valide.";
      if (!user && draft.password.length < 6) return "Le mot de passe doit contenir au moins 6 caractères.";
    }
    if (stepNum === 6 && draft.productMode === "CUSTOM") {
      const invalid = draft.initialProducts.some((p) => !p.title.trim() || Number(p.priceFcfa) <= 0);
      if (invalid) return "Chaque produit ajouté doit avoir un nom et un prix de vente supérieur à 0.";
    }
    return null;
  };

  const goToStep = (nextStep: number) => {
    setError(null);
    setErrorStep(null);
    if (nextStep > draft.step) {
      const msg = validateStep(draft.step);
      if (msg) {
        setError(msg);
        setErrorStep(draft.step);
        return;
      }
    }
    updateDraft("step", Math.min(7, Math.max(1, nextStep)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveAndExit = () => {
    showToast("Brouillon sauvegardé. Vous pourrez reprendre à tout moment.");
    router.push("/saas");
  };

  const handleResetDraft = () => {
    if (!window.confirm("Réinitialiser tout le brouillon de création de boutique ?")) return;
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setDraft(createDefaultDraft());
    setAcceptedTerms(false);
    setError(null);
    setErrorStep(null);
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
    setErrorStep(null);
    for (const s of [1, 2, 4, 6]) {
      const msg = validateStep(s);
      if (msg) {
        setError(`Étape ${s} : ${msg}`);
        setErrorStep(s);
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
      const { password: _p, ...safeDraft } = draft;
      void _p;
      const res = await fetch("/api/saas/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName: draft.storeName,
          customSlug: slugify(draft.customSlug),
          plan: draft.plan,
          data: {
            ...safeDraft,
            customSlug: slugify(draft.customSlug),
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
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Impossible d'enregistrer votre configuration.");
        return;
      }

      showToast("Configuration enregistrée ! Vérifiez votre souscription.");
      router.push("/boutique/souscription");
    } catch {
      setError("Erreur réseau lors de la sauvegarde. Votre brouillon est conservé.");
    } finally {
      setSubmitting(false);
    }
  };

  if (user && user.accountStatus && user.accountStatus !== "APPROVED") {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <div className="rounded-3xl border border-amber-200 bg-white p-8 shadow-sm text-center space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
            <Lock className="h-7 w-7" />
          </div>
          <span className="inline-block rounded-full bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-800">
            Statut du compte : {user.accountStatus === "REJECTED" ? "Refusé" : "En attente d'approbation"}
          </span>
          <h1 className="text-2xl font-extrabold text-[#0B192C]">
            Approbation de compte requise
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Vous ne pouvez pas encore ouvrir de boutique SaaS tant que votre compte (<strong>{user.email}</strong>) n&apos;a pas été approuvé par un administrateur COMMERCIA.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/compte"
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              Mon compte
            </Link>
            <Link
              href="/"
              className="rounded-xl bg-[#0B192C] px-5 py-3 text-xs font-bold text-white hover:bg-[#1E3A5F]"
            >
              Retour à la boutique
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (createdStore) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-3xl border border-emerald-200 bg-white p-8 shadow-sm text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <div>
            <span className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700">
              Statut : {createdStore.status} · Plan {createdStore.plan}
            </span>
            <h1 className="mt-3 text-3xl font-extrabold text-[#0B192C]">
              {createdStore.name} est en ligne !
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Votre boutique SaaS est publiée et prête à recevoir des commandes.
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
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3.5 text-sm font-extrabold text-white shadow-sm hover:bg-orange-600"
            >
              <LayoutDashboard className="h-4 w-4" /> Accéder à mon espace vendeur
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentMeta = STEP_META[draft.step - 1];
  const progressPercent = Math.round((draft.step / 7) * 100);

  return (
    <div className="min-h-screen bg-slate-50/70 pb-16">
      {/* Compact Premium SaaS Top Header (Full-Width) */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-30">
        <div className="mx-auto flex w-full max-w-[1800px] flex-wrap items-center justify-between gap-3 px-3 sm:px-6 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/logo-albedoo.png"
              alt="Albedo'o"
              className="h-8 w-8 rounded-lg object-contain bg-[#0B192C] p-1 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold text-[#0B192C] truncate">
                  Créez votre boutique professionnelle
                </h1>
                <span className="hidden sm:inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
                  {progressPercent}%
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                Assistant SaaS COMMERCIA · Étape {draft.step}/7 — {currentMeta.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {savedAt && (
              <span className="hidden md:inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                <CheckCircle2 className="h-3 w-3" /> Sauvegardé à {savedAt}
              </span>
            )}
            <button
              type="button"
              onClick={() => setMobilePreviewOpen(true)}
              className="xl:hidden inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-[#0B192C] hover:bg-slate-50 cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5 text-orange-500" /> Aperçu
            </button>
            <button
              type="button"
              onClick={handleSaveAndExit}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" /> Enregistrer et quitter
            </button>
            <button
              type="button"
              onClick={handleResetDraft}
              title="Réinitialiser le brouillon"
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-500 hover:text-red-600 hover:border-red-200 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Réinitialiser</span>
            </button>
          </div>
        </div>

        {/* Full-Width Horizontal Progress Strip (Tablet & Mobile) */}
        <div className="lg:hidden border-t border-slate-100 px-3 sm:px-6 py-2 bg-slate-50">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {STEP_META.map((s) => {
              const active = draft.step === s.num;
              const done = draft.step > s.num;
              const hasErr = errorStep === s.num;
              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => goToStep(s.num)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold shrink-0 cursor-pointer ${
                    hasErr
                      ? "bg-red-50 text-red-700 border border-red-200"
                      : active
                      ? "bg-[#0B192C] text-white"
                      : done
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-white text-slate-500 border border-slate-200"
                  }`}
                >
                  <span>{s.num}.</span>
                  <span>{s.short}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main 3-Zone Workspace (95-98% Width, up to 1800px) */}
      <div className="mx-auto w-full max-w-[1800px] px-3 sm:px-5 lg:px-6 pt-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_minmax(390px,34%)] items-start">
          {/* ZONE 1 — LEFT NAVIGATION & PROGRESS SIDEBAR */}
          <aside className="hidden lg:flex flex-col gap-4 sticky top-20">
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-2">
              <div className="px-2 pb-2 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Parcours de création</span>
                <span className="text-[#0B192C]">{progressPercent}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden mb-2">
                <div
                  className="h-full bg-orange-500 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <nav className="space-y-1">
                {STEP_META.map((s) => {
                  const Icon = s.icon;
                  const active = draft.step === s.num;
                  const done = draft.step > s.num;
                  const hasErr = errorStep === s.num;
                  return (
                    <button
                      key={s.num}
                      type="button"
                      onClick={() => goToStep(s.num)}
                      className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-bold transition cursor-pointer ${
                        hasErr
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : active
                          ? "bg-[#0B192C] text-white shadow-xs"
                          : done
                          ? "text-emerald-800 hover:bg-emerald-50"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-lg text-[11px] shrink-0 ${
                          active
                            ? "bg-orange-500 text-white"
                            : done
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                      </span>
                      <span className="truncate flex-1">{s.num}. {s.short}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Contextual Tip & Assistance */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#0B192C]">
                <HelpCircle className="h-4 w-4 text-orange-500" /> Conseil étape {draft.step}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{currentMeta.tip}</p>
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                Besoin d&apos;aide ?{" "}
                <Link href="/saas" className="font-bold text-orange-600 hover:underline">
                  Voir le guide SaaS
                </Link>
              </div>
            </div>
          </aside>

          {/* ZONE 2 — CENTER CONFIGURATION WORKSPACE */}
          <main className="space-y-5 min-w-0">
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}

            {/* STEP 1: IDENTITÉ */}
            {draft.step === 1 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-6">
                <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-extrabold text-[#0B192C] flex items-center gap-2">
                      <Store className="h-5 w-5 text-orange-500" /> 1. Identité de la boutique
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Renseignez les informations visibles par vos clients dès l&apos;arrivée sur votre vitrine.
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">* Obligatoire</span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="sm:col-span-2 lg:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nom commercial *</label>
                    <input
                      value={draft.storeName}
                      onChange={(e) => updateDraft("storeName", e.target.value)}
                      placeholder="Ex: Douala Tech Store"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Devise</label>
                    <Select
                      value={draft.currency}
                      onChange={(v) => updateDraft("currency", v)}
                      options={[
                        { value: "FCFA", label: "FCFA (XAF)" },
                        { value: "EUR", label: "Euro (€)" },
                        { value: "USD", label: "Dollar ($)" },
                      ]}
                    />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Slogan ou description courte <span className="text-slate-400 font-normal">(Facultatif)</span>
                    </label>
                    <input
                      value={draft.tagline}
                      onChange={(e) => updateDraft("tagline", e.target.value)}
                      placeholder="Ex: Smartphones et accessoires certifiés livrés en 24h à Akwa"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Secteur d&apos;activité</label>
                    <Select
                      value={draft.sector}
                      onChange={(v) => updateDraft("sector", v)}
                      options={SECTORS.map((s) => ({ value: s, label: s }))}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Type de commerce</label>
                    <Select
                      value={draft.commerceType}
                      onChange={(v) => updateDraft("commerceType", v)}
                      options={COMMERCE_TYPES.map((c) => ({ value: c.id, label: c.label }))}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Pays d&apos;activité</label>
                    <input
                      value={draft.country}
                      onChange={(e) => updateDraft("country", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Ville principale</label>
                    <Select
                      value={draft.city}
                      onChange={(v) => updateDraft("city", v)}
                      options={[
                        { value: "Douala", label: "Douala" },
                        { value: "Yaoundé", label: "Yaoundé" },
                        { value: "Bafoussam", label: "Bafoussam" },
                        { value: "Kribi", label: "Kribi" },
                        { value: "Garoua", label: "Garoua" },
                        { value: "Bamenda", label: "Bamenda" },
                      ]}
                    />
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

                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      E-mail professionnel <span className="text-slate-400 font-normal">(Facultatif)</span>
                    </label>
                    <input
                      type="email"
                      value={draft.businessEmail}
                      onChange={(e) => updateDraft("businessEmail", e.target.value)}
                      placeholder="contact@maboutique.cm"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
                    />
                  </div>

                  <div className="lg:col-span-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Logo (PNG/JPG/WebP)</label>
                    <label className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer">
                      {uploadingField === "logo" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 text-orange-500" />}
                      {draft.logoUrl ? "Changer le logo" : "Importer un logo"}
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
                    <p className="mt-1 text-[10px] text-slate-400">Max 2 Mo, format carré conseillé.</p>
                  </div>

                  <div className="sm:col-span-1 lg:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Image de couverture (Bannière)</label>
                    <label className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer">
                      {uploadingField === "banner" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 text-orange-500" />}
                      {draft.bannerUrl ? "Changer l'image de couverture" : "Importer une bannière (1200×400px)"}
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
                    <p className="mt-1 text-[10px] text-slate-400">Affichée en arrière-plan de l&apos;en-tête de votre boutique.</p>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: ADRESSE & IDENTITÉ NUMÉRIQUE */}
            {draft.step === 2 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-5">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-lg font-extrabold text-[#0B192C] flex items-center gap-2">
                    <Globe className="h-5 w-5 text-orange-500" /> 2. Adresse &amp; Identité Numérique
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Définissez l&apos;URL unique de votre boutique. Elle est réservée de façon atomique lors de la publication.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Slug personnalisé *</label>
                  <div className="flex items-center rounded-xl border border-slate-300 overflow-hidden bg-slate-50 focus-within:border-orange-500">
                    <span className="px-3.5 py-3 text-xs font-bold text-slate-500 border-r border-slate-200 shrink-0">
                      albedoo.cm/s/
                    </span>
                    <input
                      value={draft.customSlug}
                      onChange={(e) => {
                        updateDraft("slugEdited", true);
                        updateDraft("customSlug", slugify(e.target.value));
                      }}
                      placeholder="ma-boutique"
                      className="flex-1 bg-white px-3.5 py-3 text-sm font-extrabold text-[#0B192C] focus:outline-none"
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    Lettres minuscules, chiffres et tirets uniquement. Minimum 3 caractères.
                  </p>

                  <div className="mt-3 min-h-[28px]">
                    {slugStatus === "checking" && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Vérification de disponibilité...
                      </span>
                    )}
                    {slugStatus === "available" && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" /> /s/{draft.customSlug} est disponible
                      </span>
                    )}
                    {slugStatus === "taken" && (
                      <div className="space-y-2">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700">
                          <AlertCircle className="h-4 w-4" /> Cette adresse est déjà réservée.
                        </span>
                        {slugSuggestions.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="text-slate-500">Suggestions disponibles :</span>
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
                  <div className="font-bold text-slate-500">Adresse complète de votre vitrine :</div>
                  <div className="text-sm font-extrabold text-[#0B192C] break-all">
                    https://cameroun-ecommerce-platform.vercel.app/s/{draft.customSlug || "ma-boutique"}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: PERSONNALISATION VISUELLE */}
            {draft.step === 3 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-lg font-extrabold text-[#0B192C] flex items-center gap-2">
                    <Palette className="h-5 w-5 text-orange-500" /> 3. Personnalisation visuelle
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sélectionnez un thème professionnel ou personnalisez chaque couleur. L&apos;aperçu s&apos;actualise instantanément.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <label className="block text-xs font-bold text-slate-700">Thèmes prédéfinis</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                          className={`text-left rounded-xl border p-3.5 transition cursor-pointer ${
                            selected ? "border-orange-500 bg-orange-50/40 ring-2 ring-orange-500/20" : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-[#0B192C]">{t.name}</span>
                            <div className="flex gap-1">
                              <span className="h-3.5 w-3.5 rounded-full border border-white shadow-2xs" style={{ backgroundColor: t.primary }} />
                              <span className="h-3.5 w-3.5 rounded-full border border-white shadow-2xs" style={{ backgroundColor: t.secondary }} />
                              <span className="h-3.5 w-3.5 rounded-full border border-white shadow-2xs" style={{ backgroundColor: t.accent }} />
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">{t.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
                  {[
                    { key: "primaryColor" as const, label: "Principale", val: draft.primaryColor },
                    { key: "secondaryColor" as const, label: "Secondaire", val: draft.secondaryColor },
                    { key: "accentColor" as const, label: "Accentuation", val: draft.accentColor },
                    { key: "buttonColor" as const, label: "Boutons", val: draft.buttonColor },
                  ].map((c) => (
                    <div key={c.key}>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">{c.label}</label>
                      <div className="flex items-center gap-2 rounded-xl border border-slate-200 p-1.5 bg-slate-50">
                        <input
                          type="color"
                          value={c.val}
                          onChange={(e) => {
                            updateDraft("themePreset", "custom");
                            updateDraft(c.key, e.target.value);
                          }}
                          className="h-7 w-9 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <span className="text-[11px] font-mono text-slate-600 uppercase">{c.val}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 4: COMPTE & INFOS ADMINISTRATIVES */}
            {draft.step === 4 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-lg font-extrabold text-[#0B192C] flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-orange-500" /> 4. Compte Dirigeant &amp; Informations Administratives
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Vos identifiants de gestion et vos pièces légales (optionnelles et confidentielles).
                  </p>
                </div>

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
                    Données administratives privées (jamais exposées publiquement)
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

            {/* STEP 5: CONFIGURATION & ABONNEMENT */}
            {draft.step === 5 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-lg font-extrabold text-[#0B192C] flex items-center gap-2">
                    <Sliders className="h-5 w-5 text-orange-500" /> 5. Abonnement &amp; Configuration commerciale
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Les options disponibles s&apos;ajustent automatiquement selon votre formule SaaS.
                  </p>
                </div>

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
                            ? "border-orange-500 bg-orange-50/50 ring-2 ring-orange-500/20 shadow-xs"
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
                    <div className="text-xs font-extrabold text-[#0B192C]">Paramètres de fonctionnement</div>
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
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-5">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-lg font-extrabold text-[#0B192C] flex items-center gap-2">
                    <Package className="h-5 w-5 text-orange-500" /> 6. Premiers produits
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ajoutez vos articles réels maintenant ou démarrez avec un catalogue vide.
                  </p>
                </div>

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
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          <input
                            value={prod.title}
                            onChange={(e) => updateProductRow(prod.id, { title: e.target.value })}
                            placeholder="Nom du produit *"
                            className="sm:col-span-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                          />
                          <Select
                            value={prod.categoryId}
                            onChange={(v) => updateProductRow(prod.id, { categoryId: v })}
                            size="sm"
                            options={categories.map((c) => ({ value: c.id, label: c.name }))}
                          />
                          <input
                            type="number"
                            min={1}
                            value={prod.priceFcfa}
                            onChange={(e) => updateProductRow(prod.id, { priceFcfa: e.target.value })}
                            placeholder={`Prix vente (${draft.currency}) *`}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                          />
                          <input
                            type="number"
                            min={0}
                            value={prod.costPriceFcfa}
                            onChange={(e) => updateProductRow(prod.id, { costPriceFcfa: e.target.value })}
                            placeholder={`Prix achat (${draft.currency})`}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                          />
                          <input
                            type="number"
                            min={0}
                            value={prod.stock}
                            onChange={(e) => updateProductRow(prod.id, { stock: e.target.value })}
                            placeholder="Stock disponible"
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                          />
                          <label className="sm:col-span-2 lg:col-span-3 flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 cursor-pointer">
                            {uploadingField === prod.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5 text-orange-500" />}
                            {prod.imageUrl ? "Photo enregistrée ✓" : "Importer une photo produit (PNG/JPG/WebP)"}
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
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-lg font-extrabold text-[#0B192C] flex items-center gap-2">
                    <Rocket className="h-5 w-5 text-orange-500" /> 7. Récapitulatif &amp; Publication
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Vérifiez vos paramètres avant la création définitive de votre boutique.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
                  <div className="rounded-xl border border-slate-200 p-4 space-y-1.5">
                    <div className="flex justify-between font-extrabold text-[#0B192C]">
                      <span>Identité &amp; Adresse</span>
                      <button type="button" onClick={() => goToStep(1)} className="text-orange-600 underline cursor-pointer">Modifier</button>
                    </div>
                    <p><strong>Nom :</strong> {draft.storeName}</p>
                    <p><strong>Secteur :</strong> {draft.sector}</p>
                    <p><strong>URL :</strong> /s/{draft.customSlug}</p>
                    <p><strong>Localisation :</strong> {draft.city}, {draft.country}</p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4 space-y-1.5">
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
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-4 text-sm font-extrabold text-white shadow-sm hover:bg-orange-600 disabled:opacity-60 transition cursor-pointer"
                >
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                  {submitting ? "Enregistrement en cours..." : "CONTINUER VERS LA SOUSCRIPTION & PAIEMENT"}
                </button>
              </div>
            )}

            {/* Step Navigation Footer */}
            <div className="flex items-center justify-between pt-1">
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
          </main>

          {/* ZONE 3 — RIGHT LIVE PREVIEW COLUMN (Always visible on XL+) */}
          <aside className="hidden xl:block sticky top-20">
            <LiveStorePreview draft={draft} />
          </aside>
        </div>
      </div>

      {/* Mobile / Tablet Preview Modal Drawer */}
      {mobilePreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4 xl:hidden">
          <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl bg-white p-4 shadow-2xl max-h-[90vh] overflow-y-auto space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-sm font-extrabold text-[#0B192C]">Aperçu de la boutique</span>
              <button
                type="button"
                onClick={() => setMobilePreviewOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <LiveStorePreview draft={draft} />
          </div>
        </div>
      )}
    </div>
  );
}
