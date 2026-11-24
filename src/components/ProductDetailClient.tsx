"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Star,
  ArrowLeft,
  Clock,
  Award,
  Zap,
  Heart,
  MessageSquarePlus,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
} from "lucide-react";
import { formatFcfa, SALES_MODEL_LABELS } from "@/lib/format";
import { useApp, CameroonCity } from "./Providers";
import { ProductCard, ProductCardData } from "./ProductCard";

interface ReviewItem {
  id: string;
  authorName: string;
  city: string;
  rating: number;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string;
}

interface ProductDetailProps {
  product: {
    id: string;
    title: string;
    slug: string;
    description: string;
    sku: string;
    priceFcfa: number;
    compareAtFcfa: number | null;
    stock: number;
    salesModel: string;
    warrantyMonths: number;
    leadTimeDaysDouala: number;
    leadTimeDaysYaounde: number;
    leadTimeDaysOther: number;
    imageUrl: string;
    specsJson: string;
    rating: number;
    reviewCount: number;
    category: { name: string; slug: string };
    vendor: { companyName: string; city: string; verifiedBadge: boolean } | null;
    variants?: { id: string; label: string; sku: string; priceFcfa: number; stock: number; colorHex: string | null }[];
    reviews: ReviewItem[];
  };
  relatedProducts: ProductCardData[];
}

export function ProductDetailClient({ product, relatedProducts }: ProductDetailProps) {
  const { addToCart, deliveryCity, setDeliveryCity, wishlist, toggleWishlist, user, showToast, addRecentlyViewed } = useApp();

  useEffect(() => {
    addRecentlyViewed(product.id);
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType: "PAGE_VIEW", productId: product.id }),
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    product.variants && product.variants.length > 0 ? product.variants[0].id : null
  );
  const [qty, setQty] = useState(1);
  const [stockError, setStockError] = useState<string | null>(null);
  const [zoomActive, setZoomActive] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const [activeThumbIdx, setActiveThumbIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [aplusTab, setAplusTab] = useState(0);
  const brandScrollRef = React.useRef<HTMLDivElement>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>(product.reviews);
  const [avgRating, setAvgRating] = useState(product.rating);
  const [totalReviews, setTotalReviews] = useState(product.reviewCount);

  // Interactive Review Form
  const [revName, setRevName] = useState(user?.name || "");
  const [revCity, setRevCity] = useState(deliveryCity);
  const [revRating, setRevRating] = useState(5);
  const [revComment, setRevComment] = useState("");
  const [submittingRev, setSubmittingRev] = useState(false);

  const router = useRouter();
  const modelMeta = SALES_MODEL_LABELS[product.salesModel] || SALES_MODEL_LABELS.DIRECT_RETAIL;
  const activeVariant = product.variants?.find((v) => v.id === selectedVariantId) || null;
  const activePrice = activeVariant ? activeVariant.priceFcfa : product.priceFcfa;
  const activeStock = activeVariant ? activeVariant.stock : product.stock;
  const activeSku = activeVariant ? activeVariant.sku : product.sku;

  let specs: Record<string, string> = {};
  try {
    specs = JSON.parse(product.specsJson || "{}");
  } catch {
    specs = {};
  }

  const estimatedDays =
    deliveryCity === "Douala"
      ? product.leadTimeDaysDouala
      : deliveryCity === "Yaoundé"
      ? product.leadTimeDaysYaounde
      : product.leadTimeDaysOther;

  const discountPct =
    product.compareAtFcfa && product.compareAtFcfa > product.priceFcfa
      ? Math.round(((product.compareAtFcfa - product.priceFcfa) / product.compareAtFcfa) * 100)
      : null;

  const isFav = wishlist.includes(product.id);

  const validateAndGetError = (requestedQty: number): string | null => {
    if (activeStock <= 0) {
      return activeVariant
        ? `Vente impossible : cette variante (${activeVariant.label}) est actuellement en rupture de stock. Quantité disponible : 0.`
        : `Vente impossible : ce produit est actuellement en rupture de stock. Quantité disponible : 0.`;
    }
    if (requestedQty > activeStock) {
      return `Quantité insuffisante : vous essayez de vendre ${requestedQty} unités alors que seulement ${activeStock} sont disponibles en stock. Veuillez corriger la quantité demandée.`;
    }
    return null;
  };

  const handleAdd = () => {
    const err = validateAndGetError(qty);
    if (err) {
      setStockError(err);
      return;
    }
    setStockError(null);
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType: "ADD_TO_CART", productId: product.id }),
    }).catch(() => {});
    addToCart(
      {
        productId: product.id,
        slug: product.slug,
        title: product.title,
        priceFcfa: activePrice,
        imageUrl: product.imageUrl,
        salesModel: product.salesModel,
        vendorName: product.vendor?.companyName,
        variantId: activeVariant?.id,
        variantLabel: activeVariant?.label,
        maxStock: activeStock,
      },
      qty
    );
  };

  const handleBuyNow = () => {
    const err = validateAndGetError(qty);
    if (err) {
      setStockError(err);
      return;
    }
    setStockError(null);
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType: "ADD_TO_CART", productId: product.id }),
    }).catch(() => {});
    addToCart(
      {
        productId: product.id,
        slug: product.slug,
        title: product.title,
        priceFcfa: activePrice,
        imageUrl: product.imageUrl,
        salesModel: product.salesModel,
        vendorName: product.vendor?.companyName,
        variantId: activeVariant?.id,
        variantLabel: activeVariant?.label,
        maxStock: activeStock,
      },
      qty
    );
    router.push("/checkout");
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revName.trim() || !revComment.trim()) return;
    setSubmittingRev(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          authorName: revName,
          city: revCity,
          rating: revRating,
          comment: revComment,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setReviews([data.review, ...reviews]);
        setAvgRating(data.rating);
        setTotalReviews(data.reviewCount);
        setRevComment("");
        showToast("Merci ! Votre avis vérifié a été publié.");
      }
    } finally {
      setSubmittingRev(false);
    }
  };

  // Amazon-style Rating Histogram
  const starCounts = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((r) => r.rating === stars).length;
    const pct = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : stars === 5 ? 80 : stars === 4 ? 20 : 0;
    return { stars, pct };
  });

  return (
    <div className="mx-auto max-w-[1680px] px-4 py-8">
      <div className="mb-6 flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link href="/catalogue" className="inline-flex items-center gap-1 text-[#1E3A5F] hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Catalogue
        </Link>
        <span>/</span>
        <Link href={`/catalogue?category=${product.category.slug}`} className="hover:underline">
          {product.category.name}
        </Link>
        <span>/</span>
        <span className="truncate text-slate-800">{product.title}</span>
      </div>

      {/* Amazon-style 3-Column Layout: Larger Image + Left Variant/Thumb Strip (5) + Details (4) + Buy Box (3) */}
      <div className="grid grid-cols-1 gap-7 lg:grid-cols-12">
        {/* Col 1: Left Vertical Thumbnail/Variant Strip + Larger Featured Image */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex gap-3">
            {/* Vertical Thumbnail & Variant Strip (like Amazon's left column) */}
            <div className="flex flex-col gap-2 w-16 shrink-0">
              {[
                { label: "Vue principale", img: product.imageUrl, variantId: null as string | null, color: null as string | null },
                ...(product.variants || []).map((v) => ({
                  label: v.label,
                  img: product.imageUrl,
                  variantId: v.id,
                  color: v.colorHex,
                })),
              ]
                .slice(0, 6)
                .map((thumb, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onMouseEnter={() => setActiveThumbIdx(idx)}
                    onClick={() => {
                      setActiveThumbIdx(idx);
                      if (thumb.variantId) {
                        setSelectedVariantId(thumb.variantId);
                      }
                    }}
                    title={thumb.label}
                    className={`relative aspect-square w-full overflow-hidden rounded-xl border-2 bg-white transition cursor-pointer ${
                      activeThumbIdx === idx
                        ? "border-orange-500 ring-2 ring-orange-500/20"
                        : "border-slate-200 hover:border-[#1E3A5F]"
                    }`}
                  >
                    <img src={thumb.img} alt={thumb.label} className="h-full w-full object-cover" />
                    {thumb.color && (
                      <span
                        className="absolute bottom-1 right-1 h-3 w-3 rounded-full border border-white shadow"
                        style={{ backgroundColor: thumb.color }}
                      />
                    )}
                  </button>
                ))}
            </div>

            {/* Larger Featured Image with Cursor-Following Zoom */}
            <div className="flex-1">
              <div
                onMouseEnter={() => setZoomActive(true)}
                onMouseLeave={() => {
                  setZoomActive(false);
                  setZoomOrigin({ x: 50, y: 50 });
                }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  setZoomOrigin({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
                }}
                onClick={() => setLightboxOpen(true)}
                className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm cursor-zoom-in aspect-square flex items-center justify-center"
              >
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  style={{
                    transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                    transform: zoomActive ? "scale(2.1)" : "scale(1)",
                  }}
                  className="h-full w-full object-cover transition-transform duration-200 ease-out"
                />
                <div className="pointer-events-none absolute left-3 bottom-3 rounded-lg bg-black/60 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-xs">
                  {zoomActive ? "Zoom actif" : "Survolez pour zoomer"}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist(product.id, product.title);
                  }}
                  className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full shadow-md cursor-pointer ${
                    isFav ? "bg-rose-500 text-white" : "bg-white/90 text-slate-600 hover:text-rose-500"
                  }`}
                >
                  <Heart className={`h-4 w-4 ${isFav ? "fill-white" : ""}`} />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="mt-2 flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-[#1E3A5F] hover:text-orange-600 cursor-pointer"
              >
                <Maximize2 className="h-3.5 w-3.5" /> Cliquez pour voir la vue complète
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              {modelMeta.label}
            </div>
            <p className="text-emerald-800">{modelMeta.description}</p>
          </div>
        </div>

        {/* Col 2: Title, Price, Specs, Description */}
        <div className="lg:col-span-4 space-y-5">
          <div className="border-b border-slate-200 pb-4">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`rounded-md px-2.5 py-0.5 text-[11px] font-bold ${modelMeta.badgeClass}`}>
                {modelMeta.shortLabel}
              </span>
              <span className="text-xs font-semibold text-slate-500">SKU : {activeSku}</span>
            </div>

            <h1 className="text-2xl font-extrabold text-[#0B192C] leading-snug">{product.title}</h1>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1 font-bold text-amber-500">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {avgRating.toFixed(1)} ({totalReviews} avis vérifiés)
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-emerald-700 font-semibold">
                {product.vendor ? `Boutique : ${product.vendor.companyName}` : "Vendu par Albedo'o"}
              </span>
            </div>
          </div>

          <div className="border-b border-slate-200 pb-4">
            <div className="flex items-baseline gap-3">
              {discountPct && <span className="text-xl font-bold text-orange-600">-{discountPct}%</span>}
              <span className="text-3xl font-extrabold text-[#0B192C] tabular-nums">
                {formatFcfa(activePrice)}
              </span>
            </div>
            {product.compareAtFcfa && product.compareAtFcfa > activePrice && (
              <div className="text-xs text-slate-500 mt-0.5">
                Prix conseillé : <span className="line-through tabular-nums">{formatFcfa(product.compareAtFcfa)}</span>
              </div>
            )}
            <p className="mt-1 text-xs text-slate-500">
              Tous prix TTC · Facture conforme DGI / OHADA incluse.
            </p>
          </div>

          {/* Amazon-style Variant Selector */}
          {product.variants && product.variants.length > 0 && (
            <div className="border-b border-slate-200 pb-4 space-y-2.5">
              <div className="text-xs font-bold text-slate-700">
                Option sélectionnée : <span className="text-[#0B192C]">{activeVariant?.label}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => {
                  const isSel = v.id === activeVariant?.id;
                  const isOut = v.stock <= 0;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        setSelectedVariantId(v.id);
                        if (v.stock <= 0) {
                          setStockError(
                            `Vente impossible : cette variante (${v.label}) est actuellement en rupture de stock. Quantité disponible : 0.`
                          );
                        } else {
                          setStockError(null);
                        }
                      }}
                      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition cursor-pointer ${
                        isOut
                          ? "border-red-200 bg-red-50/70 text-red-700"
                          : isSel
                          ? "border-orange-500 bg-orange-50 text-[#0B192C] ring-2 ring-orange-500/20"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                      }`}
                    >
                      {v.colorHex && (
                        <span
                          className="h-3.5 w-3.5 rounded-full border border-slate-300"
                          style={{ backgroundColor: v.colorHex }}
                        />
                      )}
                      <span>{v.label}</span>
                      <span className="text-[11px] font-semibold text-slate-500 tabular-nums">
                        {isOut ? "· Épuisée (0)" : `(${formatFcfa(v.priceFcfa)})`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h2 className="text-sm font-extrabold text-[#0B192C]">À propos de cet article</h2>
            <p className="text-sm leading-relaxed text-slate-700">{product.description}</p>
            {Object.keys(specs).length > 0 && (
              <div className="grid grid-cols-1 gap-2 pt-1">
                {Object.entries(specs).map(([k, v]) => (
                  <div key={k} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs border border-slate-100">
                    <span className="font-semibold text-slate-500">{k.replace(/_/g, " ")}</span>
                    <span className="font-bold text-slate-900">{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Col 3: Amazon-style Buy Box */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-md space-y-4 sticky top-36">
            <div className="text-2xl font-extrabold text-[#0B192C] tabular-nums">
              {formatFcfa(activePrice)}
            </div>

            <div className="text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                <Truck className="h-4 w-4 text-orange-500 shrink-0" />
                <span>
                  Livraison à{" "}
                  <select
                    value={deliveryCity}
                    onChange={(e) => setDeliveryCity(e.target.value as CameroonCity)}
                    className="font-extrabold text-[#1E3A5F] underline bg-transparent cursor-pointer focus:outline-none"
                  >
                    {(["Douala", "Yaoundé", "Bafoussam", "Kribi", "Garoua"] as CameroonCity[]).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                <Clock className="h-3.5 w-3.5" />
                Délai estimé : {estimatedDays} jour{estimatedDays > 1 ? "s" : ""} ouvré{estimatedDays > 1 ? "s" : ""}
              </div>
            </div>

            <div className={`text-sm font-extrabold ${activeStock > 0 ? "text-emerald-700" : "text-red-600"}`}>
              {activeStock > 0
                ? `En stock (${activeStock} unités)`
                : activeVariant
                ? `Variante épuisée : ${activeVariant.label} (0)`
                : `Produit épuisé : ${product.title} (0)`}
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
              <span className="font-bold text-slate-700">Quantité :</span>
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => {
                  const val = Math.max(1, Number(e.target.value) || 1);
                  setQty(val);
                  setStockError(validateAndGetError(val));
                }}
                className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1 text-center font-extrabold text-[#0B192C] focus:outline-none"
              />
            </div>

            {stockError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-[11px] font-semibold text-red-700 leading-snug">
                {stockError}
              </div>
            )}

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleAdd}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-orange-500 py-3 text-xs font-extrabold text-white shadow hover:bg-orange-600 transition cursor-pointer"
              >
                <ShoppingCart className="h-4 w-4" />
                Ajouter au panier
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#0B192C] py-3 text-xs font-extrabold text-white shadow hover:bg-[#1E3A5F] transition cursor-pointer"
              >
                <Zap className="h-4 w-4 text-orange-400" />
                Acheter maintenant
              </button>
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-1.5 text-[11px] text-slate-600">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Paiement OM · MoMo · Visa · COD*</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-[#1E3A5F] shrink-0" />
                <span>
                  {product.warrantyMonths > 0
                    ? `Garantie ${product.warrantyMonths} mois incluse`
                    : "Produit contrôlé avant expédition"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Amazon-Style Large Full-Width "De la marque" Brand Story Panel */}
      <section className="mt-12 space-y-3">
        <h2 className="text-xl font-extrabold text-[#0B192C]">De la marque</h2>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-r from-[#0B192C] via-[#1E3A5F] to-[#EA580C]/90 min-h-[500px] shadow-lg">
          {/* Background Product / Lifestyle Visual */}
          <img
            src={product.imageUrl}
            alt={product.title}
            className="pointer-events-none absolute left-0 top-0 h-full w-full md:w-1/2 object-cover opacity-55 mix-blend-luminosity"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0B192C]/75 via-[#0B192C]/40 to-orange-500/35" />

          {/* Huge Bold Display Headline at Top-Right (Amazon Brand Story Style) */}
          <div className="relative z-10 px-8 pt-6 pb-4 text-right">
            <div className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white/95 drop-shadow-sm leading-none">
              {product.category.name}
            </div>
            <div className="mt-1 text-lg sm:text-2xl lg:text-3xl font-extrabold text-orange-200/95 drop-shadow-sm">
              {product.title}
            </div>
          </div>

          {/* Left / Right Floating Scroll Arrows */}
          <button
            type="button"
            onClick={() => brandScrollRef.current?.scrollBy({ left: -360, behavior: "smooth" })}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-30 flex h-11 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white/95 text-slate-800 shadow-lg hover:bg-white cursor-pointer"
            aria-label="Défiler à gauche"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => brandScrollRef.current?.scrollBy({ left: 360, behavior: "smooth" })}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-30 flex h-11 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white/95 text-slate-800 shadow-lg hover:bg-white cursor-pointer"
            aria-label="Défiler à droite"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Horizontally Scrollable Overlaid Cards Inside the Large Panel */}
          <div
            ref={brandScrollRef}
            className="relative z-20 flex items-end gap-5 overflow-x-auto px-12 pb-6 pt-16 snap-x scroll-smooth"
          >
            {/* Left Dark Translucent Caption Box over Hero Image */}
            <div className="min-w-[270px] sm:min-w-[300px] snap-start self-end rounded-xl bg-black/70 p-4 text-white backdrop-blur-sm border border-white/10">
              <div className="text-sm font-extrabold text-white">
                {product.vendor ? product.vendor.companyName : "Albedo'o"}
              </div>
              <p className="mt-1.5 text-xs text-slate-200 leading-relaxed">
                Innovant : Sélection certifiée, contrôle qualité physique au Hub Akwa et traçabilité complète jusqu&apos;à votre porte au Cameroun.
              </p>
            </div>

            {/* Center Tall White Editorial "À propos de nous" Card */}
            <div className="min-w-[290px] sm:min-w-[320px] min-h-[340px] snap-start rounded-xl bg-white p-6 shadow-2xl flex flex-col justify-between">
              <div>
                <div className="text-2xl font-black text-orange-500 tracking-tight mb-4">
                  {product.vendor ? product.vendor.companyName.split(" ")[0] : "Albedo'o"}
                </div>
                <div className="text-xs font-extrabold text-[#0B192C] mb-2">À propos de nous</div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {product.description}
                </p>
                <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                  Chaque article commercialisé bénéficie d&apos;une vérification rigoureuse, d&apos;un prix transparent en FCFA et d&apos;une facture conforme DGI / OHADA.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-bold text-emerald-700">
                ✓ {modelMeta.shortLabel} · Garantie {product.warrantyMonths > 0 ? `${product.warrantyMonths} mois` : "Conformité"}
              </div>
            </div>

            {/* Right Visual Feature Card 1 */}
            <div className="min-w-[260px] sm:min-w-[290px] h-[340px] snap-start relative overflow-hidden rounded-xl bg-slate-900 shadow-2xl border border-white/15">
              <img src={product.imageUrl} alt={product.title} className="h-full w-full object-cover" />
              <div className="absolute inset-x-3 bottom-3 rounded-lg bg-white/90 px-3.5 py-2.5 backdrop-blur-xs">
                <div className="text-xs font-extrabold text-[#0B192C]">Qualité &amp; Authenticité</div>
                <div className="text-[11px] text-slate-600">Contrôle physique avant expédition</div>
              </div>
            </div>

            {/* Right Visual Feature Card 2 */}
            <div className="min-w-[260px] sm:min-w-[290px] h-[340px] snap-start relative overflow-hidden rounded-xl bg-gradient-to-br from-[#0B192C] to-emerald-900 shadow-2xl border border-white/15 flex flex-col justify-between p-5 text-white">
              <div>
                <span className="rounded bg-emerald-500 px-2 py-0.5 text-[10px] font-extrabold uppercase">
                  Livraison Cameroun
                </span>
                <div className="mt-3 text-xl font-extrabold leading-snug">
                  Douala {product.leadTimeDaysDouala * 24}h · Yaoundé {product.leadTimeDaysYaounde * 24}h
                </div>
                <p className="mt-2 text-xs text-slate-200 leading-relaxed">
                  Flotte interne, points relais Akwa/Bastos et transport interurbain sécurisé.
                </p>
              </div>
              <div className="rounded-lg bg-white/95 px-3.5 py-2.5 text-[#0B192C]">
                <div className="text-xs font-extrabold">Prêt à commander</div>
                <div className="text-[11px] text-slate-600">OM · MTN MoMo · Visa · COD*</div>
              </div>
            </div>

            {/* Right Visual Feature Card 3 (Quick Buy) */}
            <div className="min-w-[250px] sm:min-w-[270px] h-[340px] snap-start rounded-xl bg-white p-5 shadow-2xl flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold uppercase text-orange-600">Offre Directe</div>
                <div className="mt-1 text-lg font-extrabold text-[#0B192C] line-clamp-2">{product.title}</div>
                <div className="mt-3 text-2xl font-black text-[#0B192C] tabular-nums">
                  {formatFcfa(activePrice)}
                </div>
                <div className="mt-1 text-xs text-emerald-700 font-bold">
                  {activeStock > 0 ? `En stock (${activeStock} disponibles)` : "Rupture de stock"}
                </div>
              </div>
              <button
                type="button"
                onClick={handleAdd}
                className="w-full rounded-xl bg-orange-500 py-3 text-xs font-extrabold text-white hover:bg-orange-600 transition cursor-pointer"
              >
                Ajouter au panier
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Second Large Panel: Person Using the Corresponding Product (Amazon A+ Lifestyle Banner) */}
      <section className="mt-8">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-[#EAF2FB] via-white to-slate-100 shadow-md">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[420px]">
            {/* Left Large Lifestyle Photo of Person Using the Product */}
            <div className="lg:col-span-6 relative min-h-[300px] lg:min-h-[420px] overflow-hidden bg-slate-900">
              <img
                src={`/lifestyle/${product.category.slug}.jpg`}
                alt={`Utilisation en situation réelle : ${product.title}`}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
              <div className="absolute left-5 bottom-5 right-5 text-white">
                <span className="inline-block rounded-full bg-orange-500 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider">
                  En situation réelle · {product.category.name}
                </span>
                <div className="mt-2 text-lg sm:text-xl font-extrabold leading-snug">
                  Conçu pour votre quotidien au Cameroun
                </div>
              </div>
            </div>

            {/* Right Editorial & Feature Icons Grid (like Amazon A+ Image 2) */}
            <div className="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-center space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B192C] leading-tight">
                  {product.title}
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Pensé pour une utilisation immédiate, fiable et durable. Profitez d&apos;une expérience d&apos;achat sans mauvaise surprise grâce à notre contrôle qualité physique et notre service après-vente local.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {[
                  { icon: ShieldCheck, title: "Qualité Vérifiée", desc: "Contrôle Hub Akwa" },
                  { icon: Truck, title: `Douala ${product.leadTimeDaysDouala * 24}h`, desc: "Livraison suivie" },
                  { icon: Zap, title: "Prêt à l'emploi", desc: "Notice & support" },
                  { icon: Award, title: product.warrantyMonths > 0 ? `Garantie ${product.warrantyMonths} mois` : "Conformité 100%", desc: "SAV structuré" },
                  { icon: CheckCircle2, title: "OM · MoMo · Visa", desc: "Paiement sécurisé" },
                  { icon: Clock, title: "Suivi 13 étapes", desc: "Facture DGI/OHADA" },
                ].map((feat) => {
                  const Icon = feat.icon;
                  return (
                    <div
                      key={feat.title}
                      className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs flex flex-col items-center text-center"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0B192C]/5 text-[#1E3A5F] mb-2">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="text-xs font-extrabold text-[#0B192C]">{feat.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{feat.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Amazon A+ Content Interactive Showcase with Dark Navigation Tabs */}
      <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex overflow-x-auto bg-[#0B192C] text-xs font-bold text-slate-300">
          {[
            "Atouts & Caractéristiques",
            "Parcours Commande (01 · 02 · 03)",
            "Paiements & Sécurité Cameroun",
          ].map((tabLabel, idx) => (
            <button
              key={tabLabel}
              type="button"
              onClick={() => setAplusTab(idx)}
              className={`px-5 py-3.5 whitespace-nowrap border-b-2 transition cursor-pointer ${
                aplusTab === idx
                  ? "border-orange-500 text-white bg-white/5"
                  : "border-transparent hover:text-white"
              }`}
            >
              {tabLabel}
            </button>
          ))}
        </div>

        <div className="p-6 sm:p-8 bg-gradient-to-br from-slate-50 to-blue-50/40">
          {aplusTab === 0 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:items-center">
              <div className="md:col-span-5">
                <img src={product.imageUrl} alt={product.title} className="w-full rounded-2xl border border-slate-200 bg-white object-cover aspect-[4/3] shadow-sm" />
              </div>
              <div className="md:col-span-7 space-y-4">
                <h3 className="text-xl font-extrabold text-[#0B192C]">{product.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{product.description}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {[
                    { title: "Qualité QC", sub: "100% vérifié" },
                    { title: `Douala ${product.leadTimeDaysDouala * 24}h`, sub: "Flotte dédiée" },
                    { title: "OM / MoMo", sub: "Paiement direct" },
                    { title: `${product.warrantyMonths} mois`, sub: "Garantie SAV" },
                  ].map((b) => (
                    <div key={b.title} className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-xs">
                      <div className="text-xs font-extrabold text-[#0B192C]">{b.title}</div>
                      <div className="text-[11px] text-slate-500">{b.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {aplusTab === 1 && (
            <div className="space-y-4">
              <div className="text-center max-w-xl mx-auto">
                <h3 className="text-xl font-extrabold text-[#0B192C]">Commande &amp; Livraison Simplifiée</h3>
                <p className="text-xs text-slate-600 mt-1">Du clic jusqu&apos;à la réception en main propre avec code OTP.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
                {[
                  { num: "01", title: "Choisissez votre variante", desc: "Sélectionnez l'option, la quantité et validez votre panier en FCFA." },
                  { num: "02", title: "Contrôle Qualité au Hub", desc: "Nos équipes vérifient physiquement l'article avant l'emballage scellé." },
                  { num: "03", title: "Livraison & Confirmation", desc: "Suivez les 13 étapes en direct et recevez votre facture OHADA." },
                ].map((step) => (
                  <div key={step.num} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                    <div className="text-3xl font-extrabold text-[#1E3A5F]/25">{step.num}</div>
                    <div className="mt-1 text-sm font-extrabold text-[#0B192C]">{step.title}</div>
                    <p className="mt-1 text-xs text-slate-600">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {aplusTab === 2 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="text-sm font-extrabold text-orange-600">Orange Money &amp; MTN MoMo</div>
                <p className="mt-1.5 text-xs text-slate-600">Confirmation USSD instantanée et sécurisée sans frais cachés.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="text-sm font-extrabold text-[#1E3A5F]">Visa / Mastercard 3D Secure</div>
                <p className="mt-1.5 text-xs text-slate-600">Acceptation des cartes locales et internationales en FCFA.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="text-sm font-extrabold text-emerald-700">Paiement à la livraison*</div>
                <p className="mt-1.5 text-xs text-slate-600">Disponible à Douala &amp; Yaoundé jusqu&apos;à 150 000 FCFA (hors Sur Commande).</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Lightbox Full View Modal */}
      {lightboxOpen && (
        <div
          onClick={() => setLightboxOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
        >
          <div className="relative max-w-3xl w-full rounded-2xl bg-white p-4" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute right-3 top-3 rounded-full bg-slate-100 p-2 text-slate-700 hover:bg-slate-200 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <img src={product.imageUrl} alt={product.title} className="w-full max-h-[75vh] object-contain rounded-xl" />
            <div className="mt-2 text-center text-xs font-bold text-[#0B192C]">{product.title}</div>
          </div>
        </div>
      )}

      {/* Amazon-Style Customer Reviews + Rating Histogram + Interactive Form */}
      <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-12 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-lg font-extrabold text-[#0B192C]">Commentaires clients</h2>
          <div className="flex items-center gap-2">
            <div className="flex text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-5 w-5 ${i < Math.round(avgRating) ? "fill-amber-400" : "text-slate-300"}`} />
              ))}
            </div>
            <span className="text-base font-extrabold text-[#0B192C]">{avgRating.toFixed(1)} sur 5</span>
          </div>
          <p className="text-xs text-slate-500">{totalReviews} évaluations globales vérifiées</p>

          {/* Rating Histogram Bars */}
          <div className="space-y-2 pt-2">
            {starCounts.map((row) => (
              <div key={row.stars} className="flex items-center gap-2.5 text-xs">
                <span className="w-12 font-semibold text-[#1E3A5F]">{row.stars} étoiles</span>
                <div className="flex-1 h-4 rounded bg-slate-100 overflow-hidden border border-slate-200">
                  <div className="h-full bg-amber-400" style={{ width: `${row.pct}%` }} />
                </div>
                <span className="w-9 text-right font-semibold text-slate-600 tabular-nums">{row.pct}%</span>
              </div>
            ))}
          </div>

          {/* Submit a review */}
          <form onSubmit={handleSubmitReview} className="mt-6 border-t border-slate-200 pt-5 space-y-3">
            <h3 className="text-sm font-extrabold text-[#0B192C] flex items-center gap-1.5">
              <MessageSquarePlus className="h-4 w-4 text-orange-500" /> Donner votre avis
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <input
                required
                value={revName}
                onChange={(e) => setRevName(e.target.value)}
                placeholder="Votre nom"
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs"
              />
              <select
                value={revRating}
                onChange={(e) => setRevRating(Number(e.target.value))}
                className="rounded-lg border border-slate-200 px-2 py-2 text-xs font-bold"
              >
                <option value={5}>5 ★ Excellent</option>
                <option value={4}>4 ★ Très bien</option>
                <option value={3}>3 ★ Correct</option>
                <option value={2}>2 ★ Moyen</option>
                <option value={1}>1 ★ Décevant</option>
              </select>
            </div>
            <textarea
              required
              rows={2}
              value={revComment}
              onChange={(e) => setRevComment(e.target.value)}
              placeholder="Partagez votre expérience avec cet article..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
            />
            <button
              type="submit"
              disabled={submittingRev}
              className="w-full rounded-xl bg-[#0B192C] py-2.5 text-xs font-bold text-white hover:bg-[#1E3A5F] cursor-pointer"
            >
              {submittingRev ? "Publication..." : "Publier mon avis"}
            </button>
          </form>
        </div>

        <div className="lg:col-span-8 space-y-4">
          <h3 className="text-sm font-extrabold text-[#0B192C]">Meilleurs avis du Cameroun</h3>
          {reviews.length === 0 ? (
            <p className="text-xs text-slate-500">Aucun avis pour le moment sur cet article.</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-900">
                      {r.authorName} · <span className="text-slate-500 font-normal">{r.city}</span>
                    </span>
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      Achat vérifié
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500 mb-1.5">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{r.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Related Products Shelf */}
      {relatedProducts.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-extrabold text-[#0B192C] mb-4">
            Les clients ayant consulté cet article ont également acheté
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
