"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { User, Gift, LogOut, Package, ArrowRight } from "lucide-react";
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

export default function ComptePage() {
  const { user, demoUsers, switchDemoUser, refreshAuth, logout, showToast } = useApp();
  const [email, setEmail] = useState("client@exemple.cm");
  const [password, setPassword] = useState("Demo2026!");
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      await refreshAuth();
      showToast("Connexion réussie.");
    } else {
      const d = await res.json();
      setError(d.error || "Identifiants invalides.");
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h1 className="text-2xl font-extrabold text-[#0B192C]">Connexion Espace Personnel</h1>
          <p className="text-xs text-slate-500">
            Accédez à vos commandes, points de fidélité ou à votre interface métier.
          </p>
          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</div>
          )}
          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mot de passe</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-[#0B192C] py-3 text-sm font-bold text-white hover:bg-[#1E3A5F] transition cursor-pointer"
            >
              Se connecter
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-900 text-white p-6 shadow-sm space-y-3">
          <h2 className="text-lg font-extrabold">Accès Rapide (Comptes de Démonstration)</h2>
          <p className="text-xs text-slate-400">
            Mot de passe universel : <code className="text-orange-300">Demo2026!</code> — Cliquez sur un profil pour l&apos;activer instantanément :
          </p>
          <div className="space-y-2 pt-2">
            {demoUsers.map((du) => (
              <button
                key={du.id}
                onClick={() => switchDemoUser(du.email)}
                className="flex w-full items-center justify-between rounded-xl bg-white/10 px-3.5 py-2.5 text-left text-xs hover:bg-white/20 transition cursor-pointer"
              >
                <div>
                  <div className="font-bold">{du.name}</div>
                  <div className="text-slate-400">{du.email}</div>
                </div>
                <span className="rounded-full bg-orange-500 px-2.5 py-0.5 text-[10px] font-bold">
                  {ROLE_LABELS[du.role]?.label || du.role}
                </span>
              </button>
            ))}
          </div>
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
            <span className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${roleMeta.color}`}>
              {roleMeta.label}
            </span>
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

