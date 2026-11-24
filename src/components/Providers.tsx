"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { X, ShoppingCart, Trash2, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { formatFcfa } from "@/lib/format";

export interface CartItem {
  productId: string;
  slug: string;
  title: string;
  priceFcfa: number;
  imageUrl: string;
  salesModel: string;
  vendorName?: string;
  variantId?: string;
  variantLabel?: string;
  maxStock?: number;
  quantity: number;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "CLIENT" | "VENDOR" | "LOGISTICS" | "ADMIN" | "EXECUTIVE" | "SUPER_ADMIN";
  accountStatus?: "PENDING" | "APPROVED" | "REJECTED";
  title?: string | null;
  city: string;
  quarter?: string | null;
  phone?: string | null;
  loyaltyPoints: number;
  storeId?: string | null;
  store?: { id: string; name: string; slug: string; plan: string } | null;
  vendorProfile?: {
    id: string;
    companyName: string;
    commissionRate: number;
  } | null;
}

export type CameroonCity = "Douala" | "Yaoundé" | "Bafoussam" | "Kribi" | "Garoua";

interface AppContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  updateQty: (productId: string, qty: number, variantId?: string) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
  cartDrawerOpen: boolean;
  setCartDrawerOpen: (open: boolean) => void;
  deliveryCity: CameroonCity;
  setDeliveryCity: (city: CameroonCity) => void;
  wishlist: string[];
  toggleWishlist: (productId: string, title?: string) => void;
  compareIds: string[];
  toggleCompare: (productId: string) => void;
  recentlyViewedIds: string[];
  addRecentlyViewed: (productId: string) => void;
  user: SessionUser | null;
  refreshAuth: () => Promise<void>;
  logout: () => Promise<void>;
  toast: string | null;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function Providers({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [deliveryCity, setDeliveryCityState] = useState<CameroonCity>("Douala");
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([]);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem("cm_ecom_cart");
      if (saved) setCart(JSON.parse(saved));
      const savedCity = localStorage.getItem("cm_ecom_city") as CameroonCity | null;
      if (savedCity) setDeliveryCityState(savedCity);
      const savedWish = localStorage.getItem("cm_ecom_wishlist");
      if (savedWish) setWishlist(JSON.parse(savedWish));
      const savedRecent = localStorage.getItem("cm_ecom_recent");
      if (savedRecent) setRecentlyViewedIds(JSON.parse(savedRecent));
    } catch {
      // ignore
    }
    refreshAuth();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("cm_ecom_cart", JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  const setDeliveryCity = (city: CameroonCity) => {
    setDeliveryCityState(city);
    try {
      localStorage.setItem("cm_ecom_city", city);
    } catch {
      // ignore
    }
    showToast(`Zone de livraison définie sur : ${city}`);
  };

  const toggleWishlist = (productId: string, title?: string) => {
    setWishlist((prev) => {
      const exists = prev.includes(productId);
      const next = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
      try {
        localStorage.setItem("cm_ecom_wishlist", JSON.stringify(next));
      } catch {
        // ignore
      }
      showToast(exists ? "Retiré de vos favoris" : `Ajouté aux favoris${title ? ` : ${title}` : ""}`);
      return next;
    });
  };

  const toggleCompare = (productId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(productId)) return prev.filter((id) => id !== productId);
      if (prev.length >= 3) {
        showToast("Maximum 3 produits dans le comparateur.");
        return prev;
      }
      return [...prev, productId];
    });
  };

  const addRecentlyViewed = (productId: string) => {
    setRecentlyViewedIds((prev) => {
      const next = [productId, ...prev.filter((id) => id !== productId)].slice(0, 8);
      try {
        localStorage.setItem("cm_ecom_recent", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const refreshAuth = async () => {
    try {
      const res = await fetch("/api/auth");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch {
      // ignore
    }
  };

  const logout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    setUser(null);
    showToast("Déconnexion effectuée.");
  };

  const addToCart = (item: Omit<CartItem, "quantity">, qty = 1) => {
    const avail = item.maxStock;
    if (typeof avail === "number" && avail <= 0) {
      showToast(
        item.variantLabel
          ? `Vente impossible : cette variante (${item.variantLabel}) est actuellement en rupture de stock. Quantité disponible : 0.`
          : `Vente impossible : ce produit est actuellement en rupture de stock. Quantité disponible : 0.`
      );
      return;
    }

    const existing = cart.find(
      (i) => i.productId === item.productId && (i.variantId || "") === (item.variantId || "")
    );
    const totalRequested = (existing?.quantity || 0) + qty;
    if (typeof avail === "number" && totalRequested > avail) {
      showToast(
        `Quantité insuffisante : vous essayez de vendre ${totalRequested} unités alors que seulement ${avail} sont disponibles en stock. Veuillez corriger la quantité demandée.`
      );
      return;
    }

    setCart((prev) => {
      const ex = prev.find(
        (i) => i.productId === item.productId && (i.variantId || "") === (item.variantId || "")
      );
      if (ex) {
        return prev.map((i) =>
          i.productId === item.productId && (i.variantId || "") === (item.variantId || "")
            ? { ...i, quantity: i.quantity + qty, maxStock: item.maxStock ?? i.maxStock }
            : i
        );
      }
      return [...prev, { ...item, quantity: qty }];
    });
    setCartDrawerOpen(true);
  };

  const updateQty = (productId: string, qty: number, variantId?: string) => {
    if (qty <= 0) {
      removeFromCart(productId, variantId);
      return;
    }
    const target = cart.find(
      (i) => i.productId === productId && (i.variantId || "") === (variantId || "")
    );
    if (target && typeof target.maxStock === "number" && qty > target.maxStock) {
      showToast(
        `Quantité insuffisante : vous essayez de vendre ${qty} unités alors que seulement ${target.maxStock} sont disponibles en stock. Veuillez corriger la quantité demandée.`
      );
      return;
    }
    setCart((prev) =>
      prev.map((i) =>
        i.productId === productId && (i.variantId || "") === (variantId || "")
          ? { ...i, quantity: qty }
          : i
      )
    );
  };

  const removeFromCart = (productId: string, variantId?: string) => {
    setCart((prev) =>
      prev.filter((i) => !(i.productId === productId && (i.variantId || "") === (variantId || "")))
    );
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cart.reduce((s, i) => s + i.priceFcfa * i.quantity, 0);

  return (
    <AppContext.Provider
      value={{
        cart,
        addToCart,
        updateQty,
        removeFromCart,
        clearCart,
        cartCount,
        cartTotal,
        cartDrawerOpen,
        setCartDrawerOpen,
        deliveryCity,
        setDeliveryCity,
        wishlist,
        toggleWishlist,
        compareIds,
        toggleCompare,
        recentlyViewedIds,
        addRecentlyViewed,
        user,
        refreshAuth,
        logout,
        toast,
        showToast,
      }}
    >
      {children}

      {/* Amazon-style Slide-over Cart Drawer */}
      {cartDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
          <div className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-[#0B192C] px-5 py-4 text-white">
              <div className="flex items-center gap-2 font-bold">
                <ShoppingCart className="h-5 w-5 text-orange-400" />
                <span>Votre Panier ({cartCount})</span>
              </div>
              <button
                onClick={() => setCartDrawerOpen(false)}
                className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white cursor-pointer"
                aria-label="Fermer le panier"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <ShoppingCart className="h-12 w-12 text-slate-300 mb-3" />
                <p className="font-bold text-slate-800">Votre panier est vide</p>
                <p className="text-xs text-slate-500 mt-1">Ajoutez des articles pour commander en 1 clic.</p>
              </div>
            ) : (
              <>
                <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-2.5 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>
                    Livraison sélectionnée : <strong>{deliveryCity}</strong> · Contrôle qualité inclus.
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 px-5">
                  {cart.map((item) => (
                    <div key={`${item.productId}-${item.variantId || "base"}`} className="flex gap-3 py-4">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="h-16 w-20 rounded-lg object-cover bg-slate-100 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/produit/${item.slug}`}
                          onClick={() => setCartDrawerOpen(false)}
                          className="text-xs font-bold text-slate-900 hover:text-[#1E3A5F] line-clamp-2"
                        >
                          {item.title}
                        </Link>
                        {item.variantLabel && (
                          <div className="text-[11px] font-semibold text-orange-600 mt-0.5">
                            Variante : {item.variantLabel}
                          </div>
                        )}
                        <div className="mt-1 text-sm font-extrabold text-[#0B192C] tabular-nums">
                          {formatFcfa(item.priceFcfa)}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 text-xs">
                            <button
                              onClick={() => updateQty(item.productId, item.quantity - 1, item.variantId)}
                              className="px-2.5 py-1 font-bold hover:bg-slate-200 rounded-l-lg cursor-pointer"
                            >
                              -
                            </button>
                            <span className="px-2.5 font-bold">{item.quantity}</span>
                            <button
                              onClick={() => updateQty(item.productId, item.quantity + 1, item.variantId)}
                              className="px-2.5 py-1 font-bold hover:bg-slate-200 rounded-r-lg cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.productId, item.variantId)}
                            className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-200 bg-slate-50 p-5 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-semibold text-slate-600">Sous-total panier</span>
                    <span className="text-xl font-extrabold text-[#0B192C] tabular-nums">
                      {formatFcfa(cartTotal)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    Orange Money · MTN MoMo · Visa/MC · Paiement à la livraison*
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <Link
                      href="/panier"
                      onClick={() => setCartDrawerOpen(false)}
                      className="flex items-center justify-center rounded-xl border border-slate-300 bg-white py-3 text-xs font-bold text-slate-800 hover:bg-slate-100 transition"
                    >
                      Voir le panier
                    </Link>
                    <Link
                      href="/checkout"
                      onClick={() => setCartDrawerOpen(false)}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-orange-500 py-3 text-xs font-bold text-white shadow-md hover:bg-orange-600 transition"
                    >
                      Commander <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-xl bg-[#0B192C] px-4 py-3 text-sm font-medium text-white shadow-2xl border border-white/10">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          {toast}
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside Providers");
  return ctx;
}
