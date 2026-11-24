"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { User, Gift, LogOut, Package, ArrowRight, Store, ShieldAlert } from "lucide-react";
import { useApp } from "@/components/Providers";
import { formatFcfa, ORDER_STATUS_META, ROLE_LABELS } from "@/lib/format";

interface OrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  totalFcfa: number;
  city: string;
  createdAt: string;
}

function CompteContent() {
  const { user, refreshAuth, logout, showToast } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const unauthorized = searchParams.get("error") === "unauthorized";

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("+237 6");
  const [city, setCity] = useState("Douala");
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderSummary[]>([]);

  useEffect(() => {
    if (user) {
      fetch("/api/orders?mine=true")
        .then((r) => r.json())
        .then((d) => setOrders(d.orders || []));
    } else {
      setOrders([]);
    }
  }, [user]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const endpoint = mode === "login" ? "/api/auth" : "/api/auth/register";
    const payload =
      mode === "login"
        ? { email, password }
        : { name, email, password, phone, city };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      await refreshAuth();
      showToast(mode === "login" ? "Connexion réussie." : "Compte créé (+100 pts fidélité) !");
      if (redirectTo) {
        router.push(redirectTo);
      }
    } else {
      const d = await res.json();
      setError(d.error || "Erreur d'authentification.");
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-5">
          {unauthorized && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs font-semibold text-amber-800">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              Votre rôle actuel ne permet pas d&apos;accéder à cette interface protégée.
            </div>
          )}

          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
              }}
              className={`flex-1 rounded-lg py-2 transition cursor-pointer ${
                mode === "login" ? "bg-[#0B192C] text-white shadow-xs" : "text-slate-600"
              }`}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError(null);
              }}
              className={`flex-1 rounded-lg py-2 transition cursor-pointer ${
                mode === "register" ? "bg-[#0B192C] text-white shadow-xs" : "text-slate-600"
              }`}
            >
              Créer un compte Client
            </button>
          </div>

          <div>
            <h1 className="text-2xl font-extrabold text-[#0B192C]">
              {mode === "login" ? "Connexion à votre espace" : "Créer un compte Client"}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Accédez à vos commandes, points de fidélité ou à votre espace marchand sécurisé.
            </p>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-3">
            {mode === "register" && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nom complet *</label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Jean-Paul Mbarga"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Téléphone</label>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Ville</label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                    >
                      <option value="Douala">Douala</option>
                      <option value="Yaoundé">Yaoundé</option>
                      <option value="Bafoussam">Bafoussam</option>
                      <option value="Kribi">Kribi</option>
                      <option value="Garoua">Garoua</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.cm"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mot de passe *</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-[#0B192C] py-3 text-sm font-bold text-white hover:bg-[#1E3A5F] transition cursor-pointer"
            >
              {mode === "login" ? "Se connecter" : "Créer mon compte (+100 pts)"}
            </button>
          </form>
        </div>

        {/* SaaS Merchant Onboarding CTA */}
        <div className="rounded-2xl bg-gradient-to-br from-[#0B192C] to-[#1E3A5F] text-white p-8 shadow-lg flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-500/20 border border-orange-400/30 px-3 py-1 text-xs font-bold text-orange-300">
              <Store className="h-3.5 w-3.5" /> Vous êtes commerçant ou entreprise ?
            </div>
            <h2 className="text-2xl font-extrabold">Lancez votre propre boutique SaaS sur Albedo&apos;o</h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Obtenez votre vitrine dédiée en marque blanche, gérez vos variantes et stocks en temps réel, et encaissez par Orange Money, MTN MoMo et Visa/Mastercard.
            </p>
          </div>
          <Link
            href="/inscription-boutique"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3.5 text-sm font-extrabold text-white hover:bg-orange-600 transition"
          >
            Ouvrir ma boutique maintenant <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  const roleMeta = ROLE_LABELS[user.role] || ROLE_LABELS.CLIENT;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0B192C] text-white">
            <User className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#0B192C]">{user.name}</h1>
            <p className="text-xs text-slate-500">
              {user.email} · {user.city} {user.quarter ? `(${user.quarter})` : ""}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${roleMeta.color}`}>
                {roleMeta.label}
              </span>
              {user.store && (
                <Link
                  href={`/s/${user.store.slug}`}
                  className="inline-block rounded-full bg-orange-100 px-2.5 py-0.5 text-[11px] font-bold text-orange-800 hover:bg-orange-200"
                >
                  Boutique : {user.store.name} ({user.store.plan})
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user.role !== "CLIENT" && (
            <Link
              href={roleMeta.route}
              className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-bold text-white hover:bg-orange-600 transition"
            >
              Ouvrir mon espace métier <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" /> Déconnexion
          </button>
        </div>
      </div>

      {/* Loyalty Program (Chapitre 18) */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0B192C] to-[#1E3A5F] p-6 text-white flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Gift className="h-8 w-8 text-orange-400" />
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-300 font-semibold">
              Programme de Fidélité (Chapitre 18)
            </div>
            <div className="text-2xl font-extrabold tabular-nums">
              {user.loyaltyPoints} points disponibles
            </div>
          </div>
        </div>
        <div className="text-xs text-slate-300">
          100 points = <strong>1 000 FCFA</strong> de réduction directe au checkout (utilisable jusqu&apos;à 10% du panier).
        </div>
      </div>

      {/* Orders */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-extrabold text-[#0B192C] flex items-center gap-2">
          <Package className="h-5 w-5 text-[#1E3A5F]" /> Mes Commandes Récentes
        </h2>
        {orders.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune commande associée à ce compte pour l&apos;instant.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {orders.map((o) => {
              const st = ORDER_STATUS_META[o.status] || ORDER_STATUS_META.CONFIRMED;
              return (
                <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <div className="font-bold text-slate-900">{o.orderNumber}</div>
                    <div className="text-xs text-slate-500">
                      {new Date(o.createdAt).toLocaleDateString("fr-FR")} · {o.city}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${st.color}`}>
                      {st.label}
                    </span>
                    <span className="font-extrabold text-[#0B192C] tabular-nums">{formatFcfa(o.totalFcfa)}</span>
                    <Link
                      href={`/suivi?order=${o.orderNumber}`}
                      className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-[#1E3A5F] hover:bg-slate-200"
                    >
                      Suivre
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ComptePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl px-4 py-12 text-sm text-slate-500">Chargement...</div>}>
      <CompteContent />
    </Suspense>
  );
}
