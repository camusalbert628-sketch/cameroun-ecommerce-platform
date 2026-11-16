import React from "react";
import Link from "next/link";
import { ShieldCheck, Truck, CreditCard, PhoneCall } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-[#0B192C] text-slate-300">
      <div className="mx-auto max-w-[1680px] px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1E3A5F] text-white font-bold border border-orange-500/40">
                CM
              </div>
              <span className="font-extrabold text-white">[NOM DE L&apos;ENTREPRISE]</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              Plateforme hybride de commerce électronique au Cameroun (Vente directe, Vendeurs partenaires vérifiés et Sur commande). Qualité contrôlée, prix transparents en FCFA et livraison suivie.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
              <span className="rounded bg-white/10 px-2 py-1 text-orange-300 font-semibold">Orange Money</span>
              <span className="rounded bg-white/10 px-2 py-1 text-amber-300 font-semibold">MTN MoMo</span>
              <span className="rounded bg-white/10 px-2 py-1 text-sky-300 font-semibold">Visa / Mastercard</span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white mb-3">Espace Client</h3>
            <ul className="space-y-2 text-xs">
              <li><Link href="/catalogue" className="hover:text-white transition">Catalogue complet</Link></li>
              <li><Link href="/suivi" className="hover:text-white transition">Suivre ma commande (13 étapes)</Link></li>
              <li><Link href="/compte" className="hover:text-white transition">Programme de fidélité & SAV</Link></li>
              <li><Link href="/panier" className="hover:text-white transition">Mon panier</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white mb-3">Interfaces Métiers (Chap. 13)</h3>
            <ul className="space-y-2 text-xs">
              <li><Link href="/vendeur" className="hover:text-emerald-300 transition">Interface Vendeur Partenaire</Link></li>
              <li><Link href="/logistique" className="hover:text-orange-300 transition">Interface Gestionnaire Logistique</Link></li>
              <li><Link href="/admin" className="hover:text-sky-300 transition">Interface Administrateur & QC</Link></li>
              <li><Link href="/direction" className="hover:text-white font-semibold transition">Tableau de Bord Direction (4 Associés)</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white mb-3">Engagements & Conformité</h3>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Contrôle qualité physique avant expédition</span>
              </li>
              <li className="flex items-start gap-2">
                <Truck className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
                <span>Hubs logistiques Douala (Akwa) & Yaoundé (Bastos)</span>
              </li>
              <li className="flex items-start gap-2">
                <CreditCard className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                <span>Facturation conforme OHADA / DGI Cameroun</span>
              </li>
              <li className="flex items-start gap-2">
                <PhoneCall className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Support WhatsApp Business & SAV 7j/7</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 [NOM DE L&apos;ENTREPRISE] — Droit OHADA & Réglementation Camerounaise du Commerce Électronique.</p>
          <p>Devise officielle : FCFA (XAF) · Version 1.0</p>
        </div>
      </div>
    </footer>
  );
}

