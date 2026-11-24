"use client";

import React from "react";
import Link from "next/link";
import { WifiOff, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center space-y-5">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0B192C] text-orange-400 shadow-lg">
        <WifiOff className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-extrabold text-[#0B192C]">Vous êtes hors ligne</h1>
      <p className="text-sm text-slate-600 leading-relaxed">
        Impossible de joindre les serveurs <strong>Albedo&apos;o</strong> pour le moment. Vérifiez votre connexion Internet puis réessayez pour consulter les stocks et prix en direct.
      </p>
      <div className="flex justify-center gap-3 pt-2">
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-xs font-extrabold text-white hover:bg-orange-600 cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" /> Réessayer
        </button>
        <Link
          href="/"
          className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold text-[#0B192C] hover:bg-slate-50"
        >
          Accueil
        </Link>
      </div>
    </div>
  );
}
