"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Star,
  LayoutGrid,
  List,
  ShieldCheck,
  Truck,
  ShoppingCart,
  X,
  SlidersHorizontal,
} from "lucide-react";
import { ProductCard, ProductCardData } from "@/components/ProductCard";
import { useApp } from "@/components/Providers";
import { formatFcfa, SALES_MODEL_LABELS } from "@/lib/format";

const CATEGORIES = [
  { slug: "all", name: "Toutes les catégories" },
  { slug: "telephones-accessoires", name: "Téléphones & Accessoires" },
  { slug: "electronique-informatique", name: "Électronique & Informatique" },
  { slug: "beaute-cosmetique", name: "Beauté & Cosmétique" },
  { slug: "mode-habillement", name: "Mode & Habillement" },
  { slug: "alimentation-produits-locaux", name: "Alimentation & Produits Locaux" },
  { slug: "maison-decoration", name: "Maison & Décoration" },
  { slug: "electromenager", name: "Électroménager" },
  { slug: "chaussures-maroquinerie", name: "Chaussures & Maroquinerie" },
  { slug: "bebe-enfants", name: "Bébé & Enfants" },
  { slug: "sport-loisirs", name: "Sport & Loisirs" },
  { slug: "automobile-accessoires", name: "Automobile & Accessoires" },
  { slug: "fournitures-professionnelles", name: "Fournitures Professionnelles" },
  { slug: "equipements-industriels", name: "Équipements Industriels" },
];

const PRICE_RANGES = [
  { id: "all", label: "Tous les prix", min: 0, max: Infinity },
  { id: "u25", label: "Moins de 25 000 FCFA", min: 0, max: 25000 },
  { id: "25_100", label: "25 000 à 100 000 FCFA", min: 25000, max: 100000 },
  { id: "100_300", label: "100 000 à 300 000 FCFA", min: 100000, max: 300000 },
  { id: "o300", label: "Plus de 300 000 FCFA", min: 300000, max: Infinity },
];

interface FullProduct extends ProductCardData {
  description?: string;
}

function CatalogueContent() {
  const searchParams = useSearchParams();
  const { wishlist, addToCart, deliveryCity } = useApp();

  const [products, setProducts] = useState<FullProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const [category, setCategory] = useState(searchParams.get("category") || "all");
  const [salesModel, setSalesModel] = useState(searchParams.get("salesModel") || "all");
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [onlyFavorites, setOnlyFavorites] = useState(searchParams.get("favorites") === "true");
  const [onlyDeals, setOnlyDeals] = useState(searchParams.get("deals") === "flash");
  const [minRating, setMinRating] = useState(0);
  const [priceRangeId, setPriceRangeId] = useState("all");
  const [sort, setSort] = useState("featured");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    setCategory(searchParams.get("category") || "all");
    setSalesModel(searchParams.get("salesModel") || "all");
    setQuery(searchParams.get("q") || "");
    setOnlyFavorites(searchParams.get("favorites") === "true");
    setOnlyDeals(searchParams.get("deals") === "flash");
  }, [searchParams]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (category !== "all") params.set("category", category);
      if (salesModel !== "all") params.set("salesModel", salesModel);
      if (query.trim()) params.set("q", query.trim());

      const res = await fetch(`/api/products?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
      setLoading(false);
    };
    fetchProducts();
  }, [category, salesModel, query]);

  const activeRange = PRICE_RANGES.find((r) => r.id === priceRangeId) || PRICE_RANGES[0];

  const filtered = products.filter((p) => {
    if (onlyFavorites && !wishlist.includes(p.id)) return false;
    if (onlyDeals && !(p.compareAtFcfa && p.compareAtFcfa > p.priceFcfa)) return false;
    if (minRating > 0 && p.rating < minRating) return false;
    if (p.priceFcfa < activeRange.min || p.priceFcfa > activeRange.max) return false;
    return true;
  });

  const sortedProducts = [...filtered].sort((a, b) => {
    if (sort === "price_asc") return a.priceFcfa - b.priceFcfa;
    if (sort === "price_desc") return b.priceFcfa - a.priceFcfa;
    if (sort === "rating") return b.rating - a.rating;
    return 0;
  });

  const resetAll = () => {
    setCategory("all");
    setSalesModel("all");
    setQuery("");
    setOnlyFavorites(false);
    setOnlyDeals(false);
    setMinRating(0);
    setPriceRangeId("all");
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Top Results Bar */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1680px] flex-wrap items-center justify-between gap-3 px-4 py-3 text-xs">
          <div className="font-semibold text-slate-700">
            <strong className="text-[#0B192C]">{sortedProducts.length}</strong> résultat(s)
            {query && (
              <>
                {" "}
                pour <span className="font-bold text-orange-600">&laquo; {query} &raquo;</span>
              </>
            )}
            {onlyFavorites && <span className="ml-2 rounded bg-rose-100 px-2 py-0.5 text-rose-700 font-bold">Mes Favoris</span>}
            {onlyDeals && <span className="ml-2 rounded bg-orange-100 px-2 py-0.5 text-orange-700 font-bold">Ventes Flash</span>}
          </div>

          <div className="flex items-center gap-2.5">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="featured">Trier par : Pertinence</option>
              <option value="price_asc">Prix : du moins cher au plus cher</option>
              <option value="price_desc">Prix : du plus cher au moins cher</option>
              <option value="rating">Moyenne des avis clients</option>
            </select>

            <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              <button
                onClick={() => setViewMode("grid")}
                className={`rounded-md p-1.5 cursor-pointer ${viewMode === "grid" ? "bg-[#0B192C] text-white" : "text-slate-500"}`}
                title="Vue Grille"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`rounded-md p-1.5 cursor-pointer ${viewMode === "list" ? "bg-[#0B192C] text-white" : "text-slate-500"}`}
                title="Vue Liste détaillée"
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Amazon Left Facet Sidebar + Right Results */}
      <div className="mx-auto max-w-[1680px] px-4 py-6 flex flex-col lg:flex-row gap-6">
        {/* Left Faceted Sidebar */}
        <aside className="w-full lg:w-64 shrink-0 space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-5 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="font-extrabold text-[#0B192C] flex items-center gap-1.5 text-sm">
                <SlidersHorizontal className="h-4 w-4 text-orange-500" /> Filtres
              </span>
              <button onClick={resetAll} className="text-[11px] font-bold text-[#1E3A5F] hover:underline cursor-pointer">
                Réinitialiser
              </button>
            </div>

            {/* Search inside results */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Mot-clé ou SKU..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-2.5 text-xs focus:border-[#1E3A5F] focus:bg-white focus:outline-none"
              />
            </div>

            {/* Quick toggles */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                <input type="checkbox" checked={onlyDeals} onChange={(e) => setOnlyDeals(e.target.checked)} />
                <span>Offres & Ventes Flash uniquement</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                <input type="checkbox" checked={onlyFavorites} onChange={(e) => setOnlyFavorites(e.target.checked)} />
                <span>Mes Favoris ({wishlist.length})</span>
              </label>
            </div>

            {/* Categories Facet */}
            <div>
              <h3 className="font-extrabold text-[#0B192C] mb-2">Catégories</h3>
              <ul className="space-y-1 max-h-56 overflow-y-auto pr-1">
                {CATEGORIES.map((c) => (
                  <li key={c.slug}>
                    <button
                      onClick={() => setCategory(c.slug)}
                      className={`w-full text-left rounded-md px-2 py-1 transition cursor-pointer ${
                        category === c.slug
                          ? "bg-[#0B192C] text-white font-bold"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {c.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Customer Rating Facet */}
            <div>
              <h3 className="font-extrabold text-[#0B192C] mb-2">Moyenne des avis</h3>
              <div className="space-y-1">
                {[4.5, 4, 0].map((r) => (
                  <button
                    key={r}
                    onClick={() => setMinRating(r)}
                    className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1 cursor-pointer ${
                      minRating === r ? "bg-amber-50 font-bold text-[#0B192C]" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {r === 0 ? (
                      <span>Toutes les notes</span>
                    ) : (
                      <>
                        <span className="inline-flex text-amber-400">
                          {Array.from({ length: 4 }).map((_, idx) => (
                            <Star key={idx} className="h-3.5 w-3.5 fill-amber-400" />
                          ))}
                        </span>
                        <span>{r}★ et plus</span>
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Facet */}
            <div>
              <h3 className="font-extrabold text-[#0B192C] mb-2">Budget (FCFA)</h3>
              <div className="space-y-1">
                {PRICE_RANGES.map((pr) => (
                  <button
                    key={pr.id}
                    onClick={() => setPriceRangeId(pr.id)}
                    className={`w-full text-left rounded-md px-2 py-1 cursor-pointer ${
                      priceRangeId === pr.id
                        ? "bg-[#1E3A5F] text-white font-bold"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {pr.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Business Model Facet */}
            <div>
              <h3 className="font-extrabold text-[#0B192C] mb-2">Mode de vente (Hybride)</h3>
              <div className="space-y-1">
                {[
                  { id: "all", label: "Tous les modèles" },
                  { id: "DIRECT_RETAIL", label: "Stock Propre (Vente directe)" },
                  { id: "MARKETPLACE_PARTNER", label: "Vendeur Partenaire Vérifié" },
                  { id: "ON_ORDER", label: "Sur Commande" },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSalesModel(m.id)}
                    className={`w-full text-left rounded-md px-2 py-1 cursor-pointer ${
                      salesModel === m.id
                        ? "bg-emerald-600 text-white font-bold"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Right Product Results */}
        <div className="flex-1">
          {/* Active Filter Chips */}
          {(category !== "all" || salesModel !== "all" || priceRangeId !== "all" || minRating > 0 || onlyDeals || onlyFavorites) && (
            <div className="mb-4 flex flex-wrap gap-2 text-xs">
              {category !== "all" && (
                <button
                  onClick={() => setCategory("all")}
                  className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-300 px-3 py-1 font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Catégorie: {category} <X className="h-3 w-3" />
                </button>
              )}
              {salesModel !== "all" && (
                <button
                  onClick={() => setSalesModel("all")}
                  className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-300 px-3 py-1 font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Modèle: {salesModel} <X className="h-3 w-3" />
                </button>
              )}
              {priceRangeId !== "all" && (
                <button
                  onClick={() => setPriceRangeId("all")}
                  className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-300 px-3 py-1 font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  {activeRange.label} <X className="h-3 w-3" />
                </button>
              )}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-80 animate-pulse rounded-2xl bg-slate-200" />
              ))}
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <p className="text-base font-bold text-slate-800">Aucun article ne correspond à ces critères.</p>
              <button
                onClick={resetAll}
                className="mt-4 rounded-xl bg-[#0B192C] px-5 py-2.5 text-sm font-bold text-white cursor-pointer"
              >
                Afficher tout le catalogue
              </button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {sortedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {sortedProducts.map((product) => {
                const modelMeta = SALES_MODEL_LABELS[product.salesModel] || SALES_MODEL_LABELS.DIRECT_RETAIL;
                return (
                  <div
                    key={product.id}
                    className="flex flex-col sm:flex-row gap-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition"
                  >
                    <Link href={`/produit/${product.slug}`} className="sm:w-52 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                      <img src={product.imageUrl} alt={product.title} className="h-40 w-full object-cover" />
                    </Link>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${modelMeta.badgeClass}`}>
                            {modelMeta.shortLabel}
                          </span>
                          <span className="text-[11px] font-bold text-[#1E3A5F] uppercase">{product.category.name}</span>
                        </div>
                        <Link href={`/produit/${product.slug}`} className="text-base font-extrabold text-[#0B192C] hover:text-orange-600">
                          {product.title}
                        </Link>
                        <div className="mt-1 flex items-center gap-2 text-xs text-amber-500 font-bold">
                          <Star className="h-3.5 w-3.5 fill-amber-400" /> {product.rating.toFixed(1)} ({product.reviewCount} avis)
                        </div>
                        {product.description && (
                          <p className="mt-2 text-xs text-slate-600 line-clamp-2">{product.description}</p>
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                        <div>
                          <span className="text-xl font-extrabold text-[#0B192C] tabular-nums">{formatFcfa(product.priceFcfa)}</span>
                          <div className="flex items-center gap-2 text-[11px] text-emerald-700 font-semibold mt-0.5">
                            <Truck className="h-3.5 w-3.5 text-orange-500" />
                            Livraison {deliveryCity} : {product.leadTimeDaysDouala * 24}h-{product.leadTimeDaysOther || 4}j
                            <span className="text-slate-300">|</span>
                            <ShieldCheck className="h-3.5 w-3.5" /> Contrôle qualité inclus
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            addToCart({
                              productId: product.id,
                              slug: product.slug,
                              title: product.title,
                              priceFcfa: product.priceFcfa,
                              imageUrl: product.imageUrl,
                              salesModel: product.salesModel,
                              vendorName: product.vendor?.companyName,
                            })
                          }
                          className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-extrabold text-white hover:bg-orange-600 cursor-pointer"
                        >
                          <ShoppingCart className="h-3.5 w-3.5" /> Ajouter au panier
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CataloguePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1680px] px-4 py-12 text-sm text-slate-500">Chargement du catalogue...</div>}>
      <CatalogueContent />
    </Suspense>
  );
}
