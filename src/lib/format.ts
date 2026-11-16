export function formatFcfa(amount: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(Math.round(amount))} FCFA`;
}

export const SALES_MODEL_LABELS: Record<
  string,
  { label: string; shortLabel: string; badgeClass: string; description: string }
> = {
  DIRECT_RETAIL: {
    label: "Vente Directe (Stock Propre)",
    shortLabel: "Stock Propre",
    badgeClass: "bg-[#0B192C] text-white",
    description: "Marchandise acquise, contrôlée et expédiée directement depuis notre entrepôt.",
  },
  MARKETPLACE_PARTNER: {
    label: "Vendeur Partenaire Vérifié",
    shortLabel: "Partenaire Vérifié",
    badgeClass: "bg-emerald-600 text-white",
    description: "Commercialisé par un partenaire agréé avec contrôle qualité et garantie plateforme.",
  },
  ON_ORDER: {
    label: "Sur Commande",
    shortLabel: "Sur Commande",
    badgeClass: "bg-orange-500 text-white",
    description: "Approvisionnement dédié à la commande avec délai confirmé et traçabilité complète.",
  },
};

export const ORDER_STATUS_META: Record<
  string,
  { label: string; color: string; stepIndex: number }
> = {
  PENDING_PAYMENT: { label: "En attente de paiement", color: "bg-amber-100 text-amber-800 border-amber-200", stepIndex: 1 },
  PAYMENT_FAILED: { label: "Paiement échoué", color: "bg-red-100 text-red-800 border-red-200", stepIndex: 1 },
  CONFIRMED: { label: "Confirmée", color: "bg-blue-100 text-blue-800 border-blue-200", stepIndex: 2 },
  PREPARING: { label: "En préparation & Contrôle QC", color: "bg-indigo-100 text-indigo-800 border-indigo-200", stepIndex: 3 },
  SHIPPED: { label: "Expédiée", color: "bg-orange-100 text-orange-800 border-orange-200", stepIndex: 4 },
  DELIVERED: { label: "Livrée & Confirmée", color: "bg-emerald-100 text-emerald-800 border-emerald-200", stepIndex: 5 },
  DELIVERY_FAILED: { label: "Livraison échouée", color: "bg-rose-100 text-rose-800 border-rose-200", stepIndex: 4 },
  CANCELLED: { label: "Annulée", color: "bg-slate-200 text-slate-700 border-slate-300", stepIndex: 0 },
  RETURN_REQUESTED: { label: "Retour demandé", color: "bg-purple-100 text-purple-800 border-purple-200", stepIndex: 5 },
  RETURNED: { label: "Retournée", color: "bg-purple-200 text-purple-900 border-purple-300", stepIndex: 5 },
  REFUNDED: { label: "Remboursée", color: "bg-teal-100 text-teal-800 border-teal-200", stepIndex: 5 },
};

export const PAYMENT_METHOD_LABELS: Record<
  string,
  { label: string; feesNote: string; badge: string }
> = {
  ORANGE_MONEY: {
    label: "Orange Money (OM)",
    feesNote: "Confirmation instantanée USSD #150# · Frais 1,5%",
    badge: "OM",
  },
  MTN_MOMO: {
    label: "MTN Mobile Money (MoMo)",
    feesNote: "Confirmation instantanée *126# · Frais 1,5%",
    badge: "MoMo",
  },
  CARD_VISA_MC: {
    label: "Carte Bancaire Visa / Mastercard",
    feesNote: "Paiement 3D Secure · Frais passerelle 2,9%",
    badge: "CB",
  },
  CASH_ON_DELIVERY: {
    label: "Paiement à la livraison (sous conditions)",
    feesNote: "Éligible Douala & Yaoundé jusqu'à 150 000 FCFA (hors produits sur commande)",
    badge: "COD",
  },
};

export const DELIVERY_METHOD_LABELS: Record<
  string,
  { label: string; description: string }
> = {
  INTERNAL_DOUALA: {
    label: "Livraison Express Flotte Interne (Douala)",
    description: "Livraison 24h par nos livreurs dédiés à Douala.",
  },
  PARTNER_COURIER: {
    label: "Livreur Partenaire Urbain",
    description: "Livraison à domicile sous 24h-48h (Douala & Yaoundé).",
  },
  INTERCITY_TRANSPORT: {
    label: "Transport Interurbain Agréé",
    description: "Expédition sécurisée vers Bafoussam, Bamenda, Garoua, Kribi, Limbé...",
  },
  RELAY_POINT: {
    label: "Point Relais Partenaire",
    description: "Retrait flexible en point relais sécurisé (frais réduits).",
  },
  STORE_PICKUP: {
    label: "Retrait en Magasin / Hub Logistique",
    description: "Retrait gratuit au hub central (Akwa Douala / Bastos Yaoundé).",
  },
};

export const ROLE_LABELS: Record<string, { label: string; route: string; color: string }> = {
  CLIENT: { label: "Client", route: "/", color: "bg-slate-100 text-slate-800" },
  VENDOR: { label: "Vendeur Partenaire", route: "/vendeur", color: "bg-emerald-100 text-emerald-800" },
  LOGISTICS: { label: "Gestionnaire Logistique", route: "/logistique", color: "bg-orange-100 text-orange-800" },
  ADMIN: { label: "Administrateur", route: "/admin", color: "bg-blue-100 text-blue-800" },
  EXECUTIVE: { label: "Direction (4 Associés)", route: "/direction", color: "bg-[#0B192C] text-white" },
};

