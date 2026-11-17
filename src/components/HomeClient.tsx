"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Zap,
  ShieldCheck,
  Truck,
  CreditCard,
  ArrowRight,
  Sparkles,
  LayoutDashboard,
  Store,
  Clock,
  GitCompare,
  X,
} from "lucide-react";
import { ProductCard, ProductCardData } from "./ProductCard";
import { useApp } from "./Providers";
import { formatFcfa } from "@/lib/format";

const HERO_SLIDES = [
  {
    badge: "Lancement Officiel · Cameroun",
    title: "La Marketplace de Confiance : High-Tech & Smartphones Certifiés",
    subtitle:
      "Produits scellés d'origine, contrôle qualité physique au Hub Akwa et livraison en 24h à Douala.",
    cta: "Découvrir le High-Tech",
    href: "/catalogue?category=telephones-accessoires",
    bg: "from-[#0B192C] via-[#122643] to-[#1E3A5F]",
    accent: "text-orange-400",
    heroImg: "/products/smartphone.jpg",
    heroSecondaryImg: "/products/laptop.jpg",
    heroLabel: "Livraison 24h Douala · Garantie 12 mois",
  },
  {
    badge: "Terroir & Savoir-Faire Local",
    title: "Café de l'Ouest, Poivre de Penja IGP & Cosmétiques Naturels",
    subtitle:
      "Soutenez les producteurs et marques camerounaises vérifiées avec paiement direct Orange Money & MTN MoMo.",
    cta: "Explorer le Terroir",
    href: "/catalogue?category=alimentation-produits-locaux",
    bg: "from-[#064E3B] via-[#0B192C] to-[#1E3A5F]",
    accent: "text-emerald-300",
    heroImg: "/products/coffee.jpg",
    heroSecondaryImg: "/products/cosmetic.jpg",
    heroLabel: "100% Terroir Camerounais · Qualité Contrôlée",
  },
  {
    badge: "Énergie & Équipements Pro",
    title: "Ventilateurs Solaires, Onduleurs APC & Solutions PME",
    subtitle:
      "Protégez votre foyer et votre entreprise contre les coupures. Paiement sécurisé et garantie jusqu'à 12 mois.",
    cta: "Voir l'Équipement Pro",
    href: "/catalogue?category=electromenager",
    bg: "from-[#1E293B] via-[#0B192C] to-[#172554]",
    accent: "text-sky-300",
    heroImg: "/products/laptop.jpg",
    heroSecondaryImg: "/products/smartphone.jpg",
    heroLabel: "Équipements Certifiés · Facture OHADA",
  },
];

const TABS = [
  { id: "all", label: "Tout voir" },
  { id: "tech", label: "High-Tech & Bureautique", slugs: ["telephones-accessoires", "electronique-informatique", "fournitures-professionnelles"] },
  { id: "terroir", label: "Terroir & Beauté", slugs: ["alimentation-produits-locaux", "beaute-cosmetique"] },
  { id: "lifestyle", label: "Mode, Maison & Sport", slugs: ["mode-habillement", "maison-decoration", "chaussures-maroquinerie", "sport-loisirs", "bebe-enfants"] },
  { id: "energy", label: "Énergie, Auto & Pro", slugs: ["electromenager", "automobile-accessoires", "equipements-industriels"] },
];

export function HomeClient({
  products,
}: {
  products: ProductCardData[];
}) {
  const { user, deliveryCity, compareIds, toggleCompare, addToCart, recentlyViewedIds } = useApp();
  const [slideIdx, setSlideIdx] = useState(0);
  const [activeTab, setActiveTab] = useState("all");
  const [secondsLeft, setSecondsLeft] = useState(4 * 3600 + 22 * 60 + 15);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 4 * 3600));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const hrs = String(Math.floor(secondsLeft / 3600)).padStart(2, "0");
  const mins = String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, "0");
  const secs = String(secondsLeft % 60).padStart(2, "0");

  const slide = HERO_SLIDES[slideIdx];
  const flashDeals = products.filter((p) => p.compareAtFcfa && p.compareAtFcfa > p.priceFcfa).slice(0, 6);

  const techQuad = products.filter((p) =>
    ["telephones-accessoires", "electronique-informatique"].includes(p.category.slug)
  ).slice(0, 4);
  const terroirQuad = products.filter((p) =>
    ["alimentation-produits-locaux", "beaute-cosmetique"].includes(p.category.slug)
  ).slice(0, 4);
  const homeQuad = products.filter((p) =>
    ["maison-decoration", "mode-habillement", "electromenager", "chaussures-maroquinerie"].includes(p.category.slug)
  ).slice(0, 4);

  const filteredByTab =
    activeTab === "all"
      ? products
      : products.filter((p) => {
          const tab = TABS.find((t) => t.id === activeTab);
          return tab?.slugs?.includes(p.category.slug);
        });

  const comparedProducts = products.filter((p) => compareIds.includes(p.id));
  const recentlyViewedProducts = recentlyViewedIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is ProductCardData => Boolean(p));

  return (
    <div className="bg-slate-100 pb-12">
      {/* 1. Amazon-Style Hero Carousel with Real Product Visuals */}
      <section className={`relative overflow-hidden bg-gradient-to-br ${slide.bg} text-white pb-24 pt-10 sm:pt-12 transition-colors duration-500`}>
        <div className="mx-auto max-w-[1680px] px-4 relative z-10">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className={`inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold ${slide.accent}`}>
                <Sparkles className="h-3.5 w-3.5" />
                {slide.badge}
              </span>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                {slide.title}
              </h1>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-xl">
                {slide.subtitle}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href={slide.href}
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-extrabold text-white shadow-lg hover:bg-orange-600 transition"
                >
                  {slide.cta} <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/suivi"
                  className="rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/20 transition"
                >
                  Suivre une commande
                </Link>
              </div>
            </div>

            {/* Right-side Real Hero Product Visuals */}
            <div className="lg:col-span-5 hidden sm:block">
              <div className="relative flex items-center justify-center gap-4">
                <div className="w-64 overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl transform -rotate-2">
                  <img src={slide.heroImg} alt={slide.title} className="h-56 w-full object-cover" />
                  <div className="bg-white px-3 py-2 text-[11px] font-extrabold text-[#0B192C]">
                    {slide.heroLabel}
                  </div>
                </div>
                <div className="hidden xl:block w-48 overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl transform rotate-3 translate-y-4">
                  <img src={slide.heroSecondaryImg} alt={slide.badge} className="h-44 w-full object-cover" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Carousel Controls */}
        <button
          onClick={() => setSlideIdx((slideIdx - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
          className="hidden sm:flex absolute left-3 top-1/3 -translate-y-1/2 h-11 w-11 items-center justify-center rounded-full bg-black/25 text-white hover:bg-black/45 cursor-pointer z-20"
          aria-label="Précédent"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={() => setSlideIdx((slideIdx + 1) % HERO_SLIDES.length)}
          className="hidden sm:flex absolute right-3 top-1/3 -translate-y-1/2 h-11 w-11 items-center justify-center rounded-full bg-black/25 text-white hover:bg-black/45 cursor-pointer z-20"
          aria-label="Suivant"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* Bottom fade into slate-100 */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-100 to-transparent" />
      </section>

      {/* 2. Overlapping 4-Column Amazon Quadrant Bento Cards */}
      <section className="mx-auto max-w-[1680px] px-4 -mt-16 relative z-20">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Quadrant 1 */}
          <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
            <h2 className="text-base font-extrabold text-[#0B192C] mb-3">Électronique & High-Tech</h2>
            <div className="grid grid-cols-2 gap-2.5 flex-1">
              {techQuad.map((p) => (
                <Link key={p.id} href={`/produit/${p.slug}`} className="group block">
                  <div className="aspect-square overflow-hidden rounded-lg bg-slate-100">
                    <img src={p.imageUrl} alt={p.title} className="h-full w-full object-cover group-hover:scale-105 transition" />
                  </div>
                  <div className="mt-1 truncate text-[11px] font-semibold text-slate-700 group-hover:text-orange-600">
                    {p.title}
                  </div>
                </Link>
              ))}
            </div>
            <Link href="/catalogue?category=electronique-informatique" className="mt-3 text-xs font-bold text-[#1E3A5F] hover:text-orange-600">
              Voir tout le High-Tech →
            </Link>
          </div>

          {/* Quadrant 2 */}
          <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
            <h2 className="text-base font-extrabold text-[#0B192C] mb-3">Terroir & Beauté Cameroun</h2>
            <div className="grid grid-cols-2 gap-2.5 flex-1">
              {terroirQuad.map((p) => (
                <Link key={p.id} href={`/produit/${p.slug}`} className="group block">
                  <div className="aspect-square overflow-hidden rounded-lg bg-slate-100">
                    <img src={p.imageUrl} alt={p.title} className="h-full w-full object-cover group-hover:scale-105 transition" />
                  </div>
                  <div className="mt-1 truncate text-[11px] font-semibold text-slate-700 group-hover:text-orange-600">
                    {p.title}
                  </div>
                </Link>
              ))}
            </div>
            <Link href="/catalogue?category=alimentation-produits-locaux" className="mt-3 text-xs font-bold text-[#1E3A5F] hover:text-orange-600">
              Découvrir le Terroir →
            </Link>
          </div>

          {/* Quadrant 3 */}
          <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
            <h2 className="text-base font-extrabold text-[#0B192C] mb-3">Maison, Mode & Solaire</h2>
            <div className="grid grid-cols-2 gap-2.5 flex-1">
              {homeQuad.map((p) => (
                <Link key={p.id} href={`/produit/${p.slug}`} className="group block">
                  <div className="aspect-square overflow-hidden rounded-lg bg-slate-100">
                    <img src={p.imageUrl} alt={p.title} className="h-full w-full object-cover group-hover:scale-105 transition" />
                  </div>
                  <div className="mt-1 truncate text-[11px] font-semibold text-slate-700 group-hover:text-orange-600">
                    {p.title}
                  </div>
                </Link>
              ))}
            </div>
            <Link href="/catalogue?category=maison-decoration" className="mt-3 text-xs font-bold text-[#1E3A5F] hover:text-orange-600">
              Explorer la sélection →
            </Link>
          </div>

          {/* Quadrant 4: Account, Delivery City & Trust */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-md space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600">
                Votre Expérience ({deliveryCity})
              </span>
              <h2 className="text-base font-extrabold text-[#0B192C] mt-0.5">
                {user ? `Bienvenue, ${user.name.split(" ")[0]}` : "Connectez-vous pour vos avantages"}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {user
                  ? `Vous disposez de ${user.loyaltyPoints} points fidélité utilisables dès maintenant.`
                  : "Cumulez des points fidélité, suivez vos livraisons en 13 étapes et gérez vos retours."}
              </p>
              <Link
                href="/compte"
                className="mt-3 block w-full rounded-xl bg-orange-500 py-2.5 text-center text-xs font-extrabold text-white hover:bg-orange-600 transition"
              >
                {user ? "Accéder à mon compte" : "Se connecter / Tester les rôles"}
              </Link>
            </div>

            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-[#0B192C]">
                <CreditCard className="h-4 w-4 text-emerald-600" />
                Orange Money · MTN MoMo · Visa
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <ShieldCheck className="h-4 w-4 text-[#1E3A5F]" />
                Paiement à la livraison (Douala/Yaoundé)*
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Truck className="h-4 w-4 text-orange-500" />
                Hubs Akwa & Bastos
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Ventes Flash Horizontal Carousel */}
      <section className="mx-auto max-w-[1680px] px-4 mt-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-extrabold text-white">
                <Zap className="h-4 w-4" /> VENTES FLASH
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#0B192C]">
                Offres du Jour au Cameroun
              </h2>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-[#0B192C]">
              <Clock className="h-4 w-4 text-orange-500" />
              <span>Se termine dans :</span>
              <span className="rounded bg-[#0B192C] px-2 py-1 text-white tabular-nums">{hrs}h</span>:
              <span className="rounded bg-[#0B192C] px-2 py-1 text-white tabular-nums">{mins}m</span>:
              <span className="rounded bg-orange-500 px-2 py-1 text-white tabular-nums">{secs}s</span>
            </div>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2 snap-x no-scrollbar">
            {flashDeals.map((p, idx) => {
              const pct = p.compareAtFcfa
                ? Math.round(((p.compareAtFcfa - p.priceFcfa) / p.compareAtFcfa) * 100)
                : 15;
              const soldPct = 55 + ((idx * 11) % 35);
              return (
                <div
                  key={p.id}
                  className="min-w-[230px] max-w-[240px] snap-start rounded-xl border border-slate-200 bg-slate-50/60 p-3 flex flex-col justify-between hover:border-orange-400 transition"
                >
                  <div>
                    <Link href={`/produit/${p.slug}`} className="group relative block aspect-[4/3] overflow-hidden rounded-lg bg-white mb-2.5">
                      <img src={p.imageUrl} alt={p.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
                      <span className="absolute left-2 top-2 rounded bg-orange-500 px-2 py-0.5 text-[10px] font-extrabold text-white">
                        -{pct}%
                      </span>
                    </Link>
                    <Link href={`/produit/${p.slug}`} className="line-clamp-2 text-xs font-bold text-slate-900 hover:text-orange-600">
                      {p.title}
                    </Link>
                    <div className="mt-1.5 flex items-baseline gap-2">
                      <span className="text-sm font-extrabold text-[#0B192C] tabular-nums">
                        {formatFcfa(p.priceFcfa)}
                      </span>
                      {p.compareAtFcfa && (
                        <span className="text-[11px] text-slate-400 line-through tabular-nums">
                          {formatFcfa(p.compareAtFcfa)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    <div>
                      <div className="flex justify-between text-[10px] font-semibold text-slate-500 mb-1">
                        <span>Stock limité</span>
                        <span className="text-orange-600">{soldPct}% réclamé</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div className="h-full bg-orange-500 rounded-full" style={{ width: `${soldPct}%` }} />
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        addToCart({
                          productId: p.id,
                          slug: p.slug,
                          title: p.title,
                          priceFcfa: p.priceFcfa,
                          imageUrl: p.imageUrl,
                          salesModel: p.salesModel,
                          vendorName: p.vendor?.companyName,
                        })
                      }
                      className="w-full rounded-lg bg-[#0B192C] py-2 text-[11px] font-bold text-white hover:bg-[#1E3A5F] cursor-pointer"
                    >
                      Ajouter au panier
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Dense Amazon-Style Product Grid with Category Tabs */}
      <section className="mx-auto max-w-[1680px] px-4 mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-2xl font-extrabold text-[#0B192C]">
              Meilleures Ventes & Catalogue Complet
            </h2>
            <p className="text-xs text-slate-600">
              Survolez pour ajouter aux favoris ou comparer jusqu&apos;à 3 articles côte à côte.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                  activeTab === t.id
                    ? "bg-[#0B192C] text-white shadow-sm"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {filteredByTab.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 4b. Recently Viewed Strip (Amazon-style personalization) */}
      {recentlyViewedProducts.length > 0 && (
        <section className="mx-auto max-w-[1680px] px-4 mt-10">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-extrabold text-[#0B192C]">
                Vos articles récemment consultés
              </h2>
              <Link href="/catalogue" className="text-xs font-bold text-[#1E3A5F] hover:text-orange-600">
                Voir tout le catalogue →
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-1 no-scrollbar">
              {recentlyViewedProducts.map((p) => (
                <Link
                  key={p.id}
                  href={`/produit/${p.slug}`}
                  className="min-w-[180px] max-w-[190px] rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 hover:border-orange-400 transition shrink-0"
                >
                  <img src={p.imageUrl} alt={p.title} className="h-28 w-full object-cover rounded-lg bg-white mb-2" />
                  <div className="text-xs font-bold text-slate-900 line-clamp-2">{p.title}</div>
                  <div className="mt-1 text-xs font-extrabold text-[#0B192C] tabular-nums">{formatFcfa(p.priceFcfa)}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. 5 Interfaces Banner */}
      <section className="mx-auto max-w-[1680px] px-4 mt-10">
        <div className="rounded-3xl bg-gradient-to-r from-[#0B192C] to-[#1E3A5F] p-7 sm:p-9 text-white shadow-xl flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400">
              Architecture Complète (Chapitre 13 & 25)
            </span>
            <h2 className="text-2xl font-extrabold">
              Pilotez la Marketplace, la Logistique et les 4 Associés en temps réel
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Basculez à tout moment sur les interfaces Vendeur Partenaire, Gestionnaire Logistique (13 étapes), Administrateur QC ou Tableau de Bord de Direction.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              href="/direction"
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-xs font-extrabold text-white hover:bg-orange-600 transition"
            >
              <LayoutDashboard className="h-4 w-4" /> Direction (KPIs)
            </Link>
            <Link
              href="/vendeur"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-xs font-extrabold text-white hover:bg-white/20 transition"
            >
              <Store className="h-4 w-4" /> Portail Vendeur
            </Link>
          </div>
        </div>
      </section>

      {/* Floating Product Comparator Bar */}
      {compareIds.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-2xl bg-[#0B192C] px-5 py-3 text-white shadow-2xl border border-white/15">
          <GitCompare className="h-4 w-4 text-orange-400" />
          <span className="text-xs font-bold">{compareIds.length} produit(s) à comparer</span>
          <button
            onClick={() => setCompareModalOpen(true)}
            className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-orange-600 cursor-pointer"
          >
            Comparer maintenant
          </button>
        </div>
      )}

      {/* Product Comparison Modal */}
      {compareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-4xl rounded-3xl bg-white p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
              <h3 className="text-lg font-extrabold text-[#0B192C]">Comparateur de Produits</h3>
              <button onClick={() => setCompareModalOpen(false)} className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {comparedProducts.map((p) => (
                <div key={p.id} className="rounded-2xl border border-slate-200 p-4 space-y-2.5">
                  <div className="flex justify-between items-start">
                    <img src={p.imageUrl} alt={p.title} className="h-24 w-full object-cover rounded-xl bg-slate-100" />
                  </div>
                  <div className="text-xs font-bold text-slate-900">{p.title}</div>
                  <div className="text-base font-extrabold text-[#0B192C]">{formatFcfa(p.priceFcfa)}</div>
                  <div className="text-xs text-slate-600">Catégorie : {p.category.name}</div>
                  <div className="text-xs text-slate-600">Note : {p.rating}/5 ({p.reviewCount} avis)</div>
                  <div className="text-xs text-slate-600">Garantie : {p.warrantyMonths} mois</div>
                  <div className="text-xs text-emerald-700 font-semibold">Douala : {p.leadTimeDaysDouala * 24}h</div>
                  <button
                    onClick={() => toggleCompare(p.id)}
                    className="w-full rounded-lg border border-slate-200 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Retirer
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

