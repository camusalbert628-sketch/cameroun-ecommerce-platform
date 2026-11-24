"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User,
  Gift,
  LogOut,
  Package,
  ArrowRight,
  Store,
  ShieldAlert,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useApp } from "@/components/Providers";
import { Select } from "@/components/ui/Select";
import { formatFcfa, ORDER_STATUS_META, ROLE_LABELS } from "@/lib/format";

interface OrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  totalFcfa: number;
  city: string;
  createdAt: string;
}

function getPasswordStrength(pwd: string): { label: string; color: string; width: string } {
  if (!pwd) return { label: "", color: "bg-slate-200", width: "0%" };
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { label: "Faible", color: "bg-red-500", width: "25%" };
  if (score === 2) return { label: "Moyen", color: "bg-amber-500", width: "55%" };
  if (score === 3) return { label: "Bon", color: "bg-emerald-500", width: "80%" };
  return { label: "Fort", color: "bg-emerald-600", width: "100%" };
}

function CompteContent() {
  const { user, refreshAuth, logout, showToast } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const errParam = searchParams.get("error");
  const resetTokenParam = searchParams.get("resetToken");

  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [phone, setPhone] = useState("+237 6");
  const [city, setCity] = useState("Douala");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [googleConfigured, setGoogleConfigured] = useState<boolean>(true);
  const [orders, setOrders] = useState<OrderSummary[]>([]);

  useEffect(() => {
    fetch("/api/auth/google/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && typeof d.configured === "boolean") setGoogleConfigured(d.configured);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (errParam === "google_not_configured") {
      setError("L'authentification Google OAuth n'est pas encore configurée sur le serveur (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET requis).");
    } else if (errParam === "google_oauth_failed" || errParam === "google_token_error") {
      setError("La connexion avec Google a échoué. Veuillez réessayer ou utiliser votre email.");
    }
  }, [errParam]);

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
    setInfoMsg(null);

    if (mode === "forgot") {
      setSubmitting(true);
      try {
        const res = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const d = await res.json();
        if (res.ok) setInfoMsg(d.message || "Email de réinitialisation envoyé.");
        else setError(d.error || "Erreur lors de l'envoi.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (mode === "register") {
      if (!lastName.trim() || !firstName.trim()) {
        setError("Nom et prénom requis.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Les mots de passe ne correspondent pas.");
        return;
      }
      if (!acceptedTerms) {
        setError("Veuillez accepter les conditions d'utilisation.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const endpoint = mode === "login" ? "/api/auth" : "/api/auth/register";
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const payload =
        mode === "login"
          ? { email, password }
          : { name: fullName, email, password, phone, city };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await refreshAuth();
        showToast(mode === "login" ? "Connexion réussie." : "Compte créé (+100 pts fidélité) !");
        if (redirectTo && redirectTo.startsWith("/")) {
          router.push(redirectTo);
        }
      } else {
        const d = await res.json();
        setError(d.error || "Erreur d'authentification.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleAuth = () => {
    if (!googleConfigured) {
      setError("Google OAuth nécessite GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET dans les variables d'environnement.");
      return;
    }
    const target = redirectTo && redirectTo.startsWith("/") ? redirectTo : "/inscription-boutique";
    window.location.href = `/api/auth/google?redirect=${encodeURIComponent(target)}`;
  };

  const handleResetConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTokenParam || password.length < 6) return;
    setSubmitting(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: resetTokenParam, password }),
    });
    const d = await res.json();
    setSubmitting(false);
    if (res.ok) {
      showToast("Mot de passe mis à jour ! Connectez-vous.");
      router.replace("/compte");
    } else {
      setError(d.error || "Lien invalide.");
    }
  };

  if (resetTokenParam && !user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <form onSubmit={handleResetConfirm} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h1 className="text-xl font-extrabold text-[#0B192C]">Nouveau mot de passe</h1>
          {error && <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</div>}
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nouveau mot de passe (min. 6 car.)"
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-[#0B192C] py-3 text-sm font-bold text-white cursor-pointer"
          >
            {submitting ? "Mise à jour..." : "Enregistrer le mot de passe"}
          </button>
        </form>
      </div>
    );
  }

  if (!user) {
    const strength = getPasswordStrength(password);
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-5">
          {errParam === "unauthorized" && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs font-semibold text-amber-800">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              Votre rôle actuel ne permet pas d&apos;accéder à cette interface protégée.
            </div>
          )}

          {redirectTo === "/inscription-boutique" && (
            <div className="flex items-center gap-2 rounded-xl bg-orange-50 border border-orange-200 p-3 text-xs font-semibold text-orange-800">
              <Store className="h-4 w-4 shrink-0" />
              Connectez-vous ou créez un compte pour lancer la création de votre boutique SaaS.
            </div>
          )}

          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
                setInfoMsg(null);
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
                setInfoMsg(null);
              }}
              className={`flex-1 rounded-lg py-2 transition cursor-pointer ${
                mode === "register" ? "bg-[#0B192C] text-white shadow-xs" : "text-slate-600"
              }`}
            >
              Créer un compte
            </button>
          </div>

          <div>
            <h1 className="text-2xl font-extrabold text-[#0B192C]">
              {mode === "login"
                ? "Connexion à votre espace"
                : mode === "register"
                ? "Créer un compte COMMERCIA"
                : "Mot de passe oublié"}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Accédez à vos commandes, points de fidélité ou à votre assistant de création SaaS.
            </p>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          {infoMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" /> {infoMsg}
            </div>
          )}

          {mode !== "forgot" && (
            <>
              <button
                type="button"
                onClick={handleGoogleAuth}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-300 bg-white py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z" />
                  <path fill="#FBBC05" d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z" />
                </svg>
                {mode === "login" ? "Se connecter avec Google" : "S'inscrire avec Google"}
              </button>
              <div className="relative flex items-center py-1">
                <div className="flex-grow border-t border-slate-200" />
                <span className="mx-3 shrink text-[11px] font-semibold text-slate-400">ou par e-mail</span>
                <div className="flex-grow border-t border-slate-200" />
              </div>
            </>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-3">
            {mode === "register" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nom *</label>
                    <input
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Ex: Mbarga"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Prénom *</label>
                    <input
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Ex: Jean-Paul"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                    />
                  </div>
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
                    <Select
                      value={city}
                      onChange={setCity}
                      options={[
                        { value: "Douala", label: "Douala" },
                        { value: "Yaoundé", label: "Yaoundé" },
                        { value: "Bafoussam", label: "Bafoussam" },
                        { value: "Kribi", label: "Kribi" },
                        { value: "Garoua", label: "Garoua" },
                      ]}
                    />
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

            {mode !== "forgot" && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Mot de passe *</label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode("forgot");
                        setError(null);
                      }}
                      className="text-[11px] font-semibold text-orange-600 hover:underline cursor-pointer"
                    >
                      Mot de passe oublié ?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 pr-10 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {mode === "register" && password && (
                  <div className="mt-1.5 space-y-1">
                    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full transition-all ${strength.color}`} style={{ width: strength.width }} />
                    </div>
                    <p className="text-[10px] font-semibold text-slate-500">Robustesse : {strength.label}</p>
                  </div>
                )}
              </div>
            )}

            {mode === "register" && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Confirmation mot de passe *</label>
                  <input
                    type={showPwd ? "text" : "password"}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  />
                </div>
                <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>J&apos;accepte les conditions d&apos;utilisation de COMMERCIA / Albedo&apos;o.</span>
                </label>
              </>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B192C] py-3 text-sm font-bold text-white hover:bg-[#1E3A5F] disabled:opacity-60 transition cursor-pointer"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "login"
                ? "Se connecter"
                : mode === "register"
                ? "Créer mon compte (+100 pts)"
                : "Envoyer le lien"}
            </button>

            {mode === "forgot" && (
              <button
                type="button"
                onClick={() => setMode("login")}
                className="w-full text-center text-xs font-semibold text-slate-500 hover:text-[#0B192C] cursor-pointer"
              >
                ← Retour à la connexion
              </button>
            )}
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
