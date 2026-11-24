"use client";

import React, { useEffect, useState } from "react";
import { Bell, Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PwaManager() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [pushReady, setPushReady] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      "PushManager" in window &&
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      Notification.permission === "default"
    ) {
      try {
        if (localStorage.getItem("albedoo_push_dismissed") !== "true") {
          setPushReady(true);
        }
      } catch {
        setPushReady(true);
      }
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

  const handleInstall = async () => {
    if (!deferredPrompt) return;
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

  const handleEnablePush = async () => {
    try {
      const permission = await Notification.requestPermission();
      setPushReady(false);
      localStorage.setItem("albedoo_push_dismissed", "true");
      if (permission !== "granted") return;

      const reg = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) return;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const json = sub.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
        }),
      });
    } catch {
      setPushReady(false);
    }
  };

  if (deferredPrompt && !dismissed) {
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

  if (pushReady) {
    return (
      <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2.5 rounded-2xl bg-[#0B192C] px-3.5 py-2.5 text-white shadow-xl border border-white/15 max-w-xs">
        <Bell className="h-4 w-4 text-amber-400 shrink-0" />
        <span className="text-xs font-medium">Alertes livraison en direct ?</span>
        <button
          onClick={handleEnablePush}
          className="rounded-lg bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-amber-600 cursor-pointer shrink-0"
        >
          Activer
        </button>
        <button
          onClick={() => {
            setPushReady(false);
            try {
              localStorage.setItem("albedoo_push_dismissed", "true");
            } catch {
              // ignore
            }
          }}
          className="p-1 text-slate-400 hover:text-white cursor-pointer"
          aria-label="Fermer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return null;
}
