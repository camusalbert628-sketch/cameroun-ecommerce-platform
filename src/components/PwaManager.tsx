"use client";

import React, { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaManager() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    try {
      if (localStorage.getItem("albedoo_pwa_dismissed") === "true") {
        setDismissed(true);
      }
    } catch {
      // ignore
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  if (!deferredPrompt || dismissed) return null;

  const handleInstall = async () => {
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem("albedoo_pwa_dismissed", "true");
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-40 flex items-center gap-3 rounded-2xl bg-[#0B192C] px-4 py-3 text-white shadow-2xl border border-white/15 max-w-xs">
      <img src="/icons/icon-192x192.png" alt="Albedo'o" className="h-10 w-10 rounded-xl shrink-0" />
      <div className="flex-1 min-w-0 text-xs">
        <div className="font-extrabold truncate">Installer Albedo&apos;o</div>
        <div className="text-[11px] text-slate-300">Accès rapide sur votre écran</div>
      </div>
      <button
        onClick={handleInstall}
        className="inline-flex items-center gap-1 rounded-xl bg-orange-500 px-3 py-1.5 text-[11px] font-extrabold text-white hover:bg-orange-600 cursor-pointer shrink-0"
      >
        <Download className="h-3.5 w-3.5" /> Installer
      </button>
      <button
        onClick={handleDismiss}
        className="p-1 text-slate-400 hover:text-white cursor-pointer"
        aria-label="Fermer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
