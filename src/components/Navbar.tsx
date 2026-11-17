"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Search,
  User,
  ShieldCheck,
  ChevronDown,
  Menu,
  X,
  MapPin,
  Heart,
  Zap,
  ArrowRight,
} from "lucide-react";
import { useApp, CameroonCity } from "./Providers";
import { formatFcfa, ROLE_LABELS } from "@/lib/format";

const ALL_CATEGORIES = [
  { slug: "telephones-accessoires", name: "Téléphones & Accessoires", priority: true },
  { slug: "electronique-informatique", name: "Électronique & Informatique", priority: true },
  { slug: "beaute-cosmetique", name: "Beauté & Cosmétique", priority: true },
  { slug: "mode-habillement", name: "Mode & Habillement", priority: true },
  { slug: "alimentation-produits-locaux", name: "Alimentation & Produits Locaux", priority: true },
  { slug: "maison-decoration", name: "Maison & Décoration", priority: true },
  { slug: "electromenager", name: "Électroménager", priority: false },
  { slug: "chaussures-maroquinerie", name: "Chaussures & Maroquinerie", priority: false },
  { slug: "bebe-enfants", name: "Bébé & Enfants", priority: false },
  { slug: "sport-loisirs", name: "Sport & Loisirs", priority: false },
  { slug: "automobile-accessoires", name: "Automobile & Accessoires", priority: false },
  { slug: "fournitures-professionnelles", name: "Fournitures Professionnelles", priority: false },
  { slug: "equipements-industriels", name: "Équipements Industriels", priority: false },
];

const CITIES: CameroonCity[] = ["Douala", "Yaoundé", "Bafoussam", "Kribi", "Garoua"];

interface SearchHit {
  id: string;
  title: string;
  slug: string;
  priceFcfa: number;
  imageUrl: string;
  category: { name: string };
}

export function Navbar() {
  const {
    cartCount,
    setCartDrawerOpen,
    deliveryCity,
    setDeliveryCity,
    wishlist,
    user,
    demoUsers,
    switchDemoUser,
  } = useApp();

  const [search, setSearch] = useState("");
  const [searchCategory, setSearchCategory] = useState("all");
  const [suggestions, setSuggestions] = useState<SearchHit[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [cityMenuOpen, setCityMenuOpen] = useState(false);
  const [megaDrawerOpen, setMegaDrawerOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (search.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      const params = new URLSearchParams({ q: search.trim() });
      if (searchCategory !== "all") params.set("category", searchCategory);
      const res = await fetch(`/api/products?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions((data.products || []).slice(0, 5));
        setShowSuggestions(true);
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [search, searchCategory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (searchCategory !== "all") params.set("category", searchCategory);
    router.push(`/catalogue?${params.toString()}`);
  };

  const handleRoleSwitch = async (email: string, targetRoute: string) => {
    await switchDemoUser(email);
    setRoleMenuOpen(false);
    router.push(targetRoute);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full shadow-md">
        {/* Tier 1: Top Utility & 5 Interfaces Bar */}
        <div className="bg-[#081220] text-[11px] text-slate-300 border-b border-white/10">
          <div className="mx-auto flex max-w-[1680px] flex-wrap items-center justify-between gap-2 px-4 py-1.5">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                Contrôle Qualité Certifié
              </span>
              <span className="hidden md:inline text-slate-500">|</span>
              <span className="hidden md:inline text-slate-300">
                Orange Money · MTN MoMo · Visa/MC · Paiement à la livraison*
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden lg:flex items-center gap-1">
                <span className="text-slate-400 mr-1">Interfaces Chap. 13 :</span>
                <Link href="/" className="rounded px-2 py-0.5 hover:bg-white/10 transition">
                  Client
                </Link>
                <Link href="/vendeur" className="rounded px-2 py-0.5 text-emerald-300 hover:bg-white/10 transition">
                  Vendeur
                </Link>
                <Link href="/logistique" className="rounded px-2 py-0.5 text-orange-300 hover:bg-white/10 transition">
                  Logistique
                </Link>
                <Link href="/admin" className="rounded px-2 py-0.5 text-sky-300 hover:bg-white/10 transition">
                  Admin
                </Link>
                <Link
                  href="/direction"
                  className="rounded bg-white/15 px-2 py-0.5 font-bold text-white hover:bg-white/25 transition"
                >
                  Direction (4 Associés)
                </Link>
              </div>

              <div className="relative">
                <button
                  onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                  className="inline-flex items-center gap-1 rounded bg-[#1E3A5F] px-2.5 py-0.5 font-semibold text-white hover:bg-[#274b7a] transition cursor-pointer"
                >
                  <User className="h-3 w-3 text-orange-400" />
                  <span>{user ? `${user.name.split(" ")[0]} (${user.role})` : "Basculer de profil"}</span>
                  <ChevronDown className="h-3 w-3" />
                </button>

                {roleMenuOpen && (
                  <div className="absolute right-0 mt-1.5 w-72 rounded-xl border border-slate-200 bg-white p-2 text-slate-800 shadow-2xl z-50">
                    <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Comptes & Rôles (Démo Instantanée)
                    </div>
                    {demoUsers.map((du) => {
                      const meta = ROLE_LABELS[du.role] || ROLE_LABELS.CLIENT;
                      return (
                        <button
                          key={du.id}
                          onClick={() => handleRoleSwitch(du.email, meta.route)}
                          className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs hover:bg-slate-50 transition cursor-pointer"
                        >
                          <div>
                            <div className="font-semibold text-slate-900">{du.name}</div>
                            <div className="text-[11px] text-slate-500">{du.email}</div>
                          </div>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.color}`}>
                            {meta.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tier 2: Main Amazon-style Bar */}
        <div className="bg-[#0B192C] text-white">
          <div className="mx-auto flex max-w-[1680px] items-center gap-3 sm:gap-4 px-4 py-2.5">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0 rounded-lg p-0.5 hover:ring-1 hover:ring-white/30 transition">
              <div className="rounded-xl bg-white px-3 py-1.5 shadow-md">
                <img
                  src="/logo-albedoo.png"
                  alt="Albedo'o — La valeur en mouvement."
                  className="h-10 sm:h-12 md:h-13 w-auto object-contain"
                />
              </div>
            </Link>

            {/* Deliver To City Selector (Amazon Style) */}
            <div className="relative hidden md:block shrink-0">
              <button
                onClick={() => setCityMenuOpen(!cityMenuOpen)}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-left hover:ring-1 hover:ring-white/30 transition cursor-pointer"
              >
                <MapPin className="h-4 w-4 text-orange-400 shrink-0 mt-1" />
                <div className="leading-tight">
                  <div className="text-[10px] text-slate-300">Livrer à</div>
                  <div className="text-xs font-extrabold text-white flex items-center gap-1">
                    {deliveryCity} <ChevronDown className="h-3 w-3 text-slate-400" />
                  </div>
                </div>
              </button>

              {cityMenuOpen && (
                <div className="absolute left-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 text-slate-800 shadow-2xl z-50">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase text-slate-400">
                    Choisir votre ville au Cameroun
                  </div>
                  {CITIES.map((city) => (
                    <button
                      key={city}
                      onClick={() => {
                        setDeliveryCity(city);
                        setCityMenuOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition cursor-pointer ${
                        deliveryCity === city
                          ? "bg-[#0B192C] text-white"
                          : "hover:bg-slate-100 text-slate-800"
                      }`}
                    >
                      <span>{city}</span>
                      <span className="text-[10px] opacity-75">
                        {city === "Douala" ? "24h" : city === "Yaoundé" ? "24-48h" : "2-4j"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Unified Amazon Search Bar with Category Dropdown + Autocomplete */}
            <div ref={searchRef} className="relative flex-1">
              <form onSubmit={handleSearch} className="flex w-full overflow-hidden rounded-xl bg-white ring-2 ring-transparent focus-within:ring-orange-500">
                <select
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value)}
                  className="hidden sm:block max-w-[155px] border-r border-slate-200 bg-slate-100 px-2.5 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="all">Toutes catégories</option>
                  {ALL_CATEGORIES.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={search}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher sur Albedo'o : smartphone, café, onduleur, mode..."
                  className="flex-1 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="flex items-center justify-center bg-orange-500 px-4 sm:px-5 text-white hover:bg-orange-600 transition cursor-pointer"
                  aria-label="Rechercher"
                >
                  <Search className="h-5 w-5" />
                </button>
              </form>

              {/* Live Autocomplete Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1.5 rounded-xl border border-slate-200 bg-white text-slate-900 shadow-2xl z-50 overflow-hidden">
                  <div className="bg-slate-50 px-3.5 py-1.5 text-[10px] font-bold uppercase text-slate-400">
                    Suggestions produits
                  </div>
                  {suggestions.map((hit) => (
                    <Link
                      key={hit.id}
                      href={`/produit/${hit.slug}`}
                      onClick={() => setShowSuggestions(false)}
                      className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-slate-50 transition border-t border-slate-100"
                    >
                      <img src={hit.imageUrl} alt={hit.title} className="h-10 w-12 rounded object-cover bg-slate-100" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">{hit.title}</div>
                        <div className="text-[11px] text-slate-500">{hit.category.name}</div>
                      </div>
                      <div className="text-xs font-extrabold text-[#0B192C] tabular-nums">
                        {formatFcfa(hit.priceFcfa)}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Right Account, Orders, Wishlist & Cart */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <Link
                href="/compte"
                className="hidden sm:flex flex-col rounded-lg px-2.5 py-1 leading-tight hover:ring-1 hover:ring-white/30 transition"
              >
                <span className="text-[10px] text-slate-300">
                  {user ? `Bonjour, ${user.name.split(" ")[0]}` : "Bonjour, Identifiez-vous"}
                </span>
                <span className="text-xs font-extrabold text-white">
                  Compte & Fidélité {user ? `(${user.loyaltyPoints} pts)` : ""}
                </span>
              </Link>

              <Link
                href="/suivi"
                className="hidden lg:flex flex-col rounded-lg px-2.5 py-1 leading-tight hover:ring-1 hover:ring-white/30 transition"
              >
                <span className="text-[10px] text-slate-300">Retours &</span>
                <span className="text-xs font-extrabold text-white">Commandes</span>
              </Link>

              <Link
                href="/catalogue?favorites=true"
                className="relative hidden md:flex items-center justify-center rounded-lg p-2 hover:ring-1 hover:ring-white/30 transition"
                title="Mes Favoris"
              >
                <Heart className="h-5 w-5 text-slate-200" />
                {wishlist.length > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white">
                    {wishlist.length}
                  </span>
                )}
              </Link>

              <button
                onClick={() => setCartDrawerOpen(true)}
                className="relative flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 hover:bg-white/20 transition cursor-pointer"
              >
                <ShoppingCart className="h-5 w-5 text-orange-400" />
                <span className="hidden sm:inline text-xs font-extrabold">Panier</span>
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1.5 text-[11px] font-extrabold text-white">
                  {cartCount}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Tier 3: Sub-Navigation Strip */}
        <div className="bg-[#1E3A5F] text-xs text-white border-t border-white/10">
          <div className="mx-auto flex max-w-[1680px] items-center gap-1 sm:gap-2 overflow-x-auto px-4 py-1.5 no-scrollbar">
            <button
              onClick={() => setMegaDrawerOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-extrabold hover:bg-white/15 shrink-0 cursor-pointer"
            >
              <Menu className="h-4 w-4" />
              Toutes les catégories
            </button>
            <Link
              href="/catalogue?deals=flash"
              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-semibold text-orange-300 hover:bg-white/15 shrink-0"
            >
              <Zap className="h-3.5 w-3.5" /> Ventes Flash
            </Link>
            <Link
              href="/catalogue?salesModel=DIRECT_RETAIL"
              className="rounded-md px-2.5 py-1 font-medium hover:bg-white/15 shrink-0"
            >
              Stock Propre Garanti
            </Link>
            <Link
              href="/catalogue?salesModel=MARKETPLACE_PARTNER"
              className="rounded-md px-2.5 py-1 font-medium hover:bg-white/15 shrink-0"
            >
              Partenaires Vérifiés
            </Link>
            <Link
              href="/catalogue?category=alimentation-produits-locaux"
              className="rounded-md px-2.5 py-1 font-medium text-emerald-300 hover:bg-white/15 shrink-0"
            >
              Terroir Camerounais
            </Link>
            <Link
              href="/catalogue?salesModel=ON_ORDER"
              className="rounded-md px-2.5 py-1 font-medium hover:bg-white/15 shrink-0"
            >
              Sur Commande
            </Link>
            <Link
              href="/vendeur"
              className="ml-auto rounded-md bg-white/10 px-2.5 py-1 font-bold hover:bg-white/20 shrink-0"
            >
              Vendre sur la plateforme
            </Link>
          </div>
        </div>
      </header>

      {/* Amazon-style Left Mega-Drawer (13 Categories + 5 Interfaces) */}
      {megaDrawerOpen && (
        <div className="fixed inset-0 z-50 flex bg-black/55 backdrop-blur-xs">
          <div className="flex h-full w-full max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-[#0B192C] px-5 py-4 text-white">
              <div className="flex items-center gap-2 font-extrabold">
                <User className="h-5 w-5 text-orange-400" />
                <span>{user ? `Bonjour, ${user.name}` : "Explorer la plateforme"}</span>
              </div>
              <button
                onClick={() => setMegaDrawerOpen(false)}
                className="rounded-lg p-1 text-slate-300 hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-orange-600 mb-2">
                  Catégories Prioritaires (Lancement)
                </h3>
                <div className="space-y-1">
                  {ALL_CATEGORIES.filter((c) => c.priority).map((c) => (
                    <Link
                      key={c.slug}
                      href={`/catalogue?category=${c.slug}`}
                      onClick={() => setMegaDrawerOpen(false)}
                      className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
                    >
                      <span>{c.name}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                    </Link>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                  Catalogue Étendu (13 Catégories)
                </h3>
                <div className="space-y-1">
                  {ALL_CATEGORIES.filter((c) => !c.priority).map((c) => (
                    <Link
                      key={c.slug}
                      href={`/catalogue?category=${c.slug}`}
                      onClick={() => setMegaDrawerOpen(false)}
                      className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                    >
                      <span>{c.name}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                    </Link>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#1E3A5F] mb-2">
                  5 Interfaces Métiers (Chapitre 13)
                </h3>
                <div className="grid grid-cols-1 gap-1.5 text-xs font-bold">
                  <Link href="/vendeur" onClick={() => setMegaDrawerOpen(false)} className="rounded-lg bg-emerald-50 px-3 py-2.5 text-emerald-800">
                    C. Espace Vendeur Partenaire
                  </Link>
                  <Link href="/logistique" onClick={() => setMegaDrawerOpen(false)} className="rounded-lg bg-orange-50 px-3 py-2.5 text-orange-800">
                    D. Gestionnaire Logistique (13 étapes)
                  </Link>
                  <Link href="/admin" onClick={() => setMegaDrawerOpen(false)} className="rounded-lg bg-sky-50 px-3 py-2.5 text-sky-800">
                    B. Administration & Contrôle Qualité
                  </Link>
                  <Link href="/direction" onClick={() => setMegaDrawerOpen(false)} className="rounded-lg bg-[#0B192C] px-3 py-2.5 text-white">
                    E. Tableau de Bord Direction (4 Associés)
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMegaDrawerOpen(false)} />
        </div>
      )}
    </>
  );
}
