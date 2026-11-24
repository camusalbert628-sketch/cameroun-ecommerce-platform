export interface InitialProductDraft {
  id: string;
  title: string;
  description: string;
  priceFcfa: string;
  costPriceFcfa: string;
  stock: string;
  categoryId: string;
  imageUrl: string;
}

export interface OnboardingDraft {
  step: number;
  idempotencyKey: string;
  // Step 1: Identité
  storeName: string;
  tagline: string;
  logoUrl: string;
  bannerUrl: string;
  sector: string;
  commerceType: string;
  currency: string;
  country: string;
  city: string;
  businessPhone: string;
  businessEmail: string;
  // Step 2: Adresse numérique
  customSlug: string;
  slugEdited: boolean;
  // Step 3: Personnalisation visuelle
  themePreset: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  buttonColor: string;
  // Step 4: Compte & Admin
  ownerName: string;
  email: string;
  password: string;
  phone: string;
  whatsappPhone: string;
  rccm: string;
  niu: string;
  address: string;
  quarter: string;
  description: string;
  // Step 5: Configuration commerciale & Plan
  plan: "STARTER" | "PRO" | "BUSINESS";
  paymentMethods: string[];
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  stockManagement: boolean;
  showPrices: boolean;
  notificationsEnabled: boolean;
  // Step 6: Premiers produits
  productMode: "EMPTY" | "CUSTOM" | "DEMO";
  initialProducts: InitialProductDraft[];
}

export const SECTORS = [
  "Alimentation et restauration",
  "Mode et habillement",
  "Cosmétiques et beauté",
  "Électronique et informatique",
  "Téléphones et accessoires",
  "Commerce général",
  "Pharmacie et parapharmacie",
  "Quincaillerie et matériaux",
  "Agriculture et élevage",
  "Autres activités",
];

export const COMMERCE_TYPES = [
  { id: "B2C", label: "Vente aux particuliers (B2C)" },
  { id: "B2B", label: "Vente aux professionnels / Gros (B2B)" },
  { id: "HYBRID", label: "Hybride (Détail & Gros)" },
];

export const THEME_PRESETS = [
  {
    id: "albedoo",
    name: "Albedo'o",
    desc: "Frais, moderne et commercial",
    primary: "#0B192C",
    secondary: "#1E3A5F",
    accent: "#F97316",
    button: "#F97316",
  },
  {
    id: "luxe-or",
    name: "Luxe Or",
    desc: "Élégant et premium",
    primary: "#111827",
    secondary: "#1F2937",
    accent: "#D97706",
    button: "#B45309",
  },
  {
    id: "terroir-vert",
    name: "Terroir Vert",
    desc: "Naturel et alimentaire",
    primary: "#064E3B",
    secondary: "#047857",
    accent: "#10B981",
    button: "#059669",
  },
  {
    id: "tech-indigo",
    name: "Tech Indigo",
    desc: "Technologique et contemporain",
    primary: "#1E1B4B",
    secondary: "#312E81",
    accent: "#6366F1",
    button: "#4F46E5",
  },
];

export const PLANS = [
  {
    id: "STARTER" as const,
    name: "Starter",
    price: "0 FCFA / mois",
    commission: "5% par vente",
    maxProducts: 50,
    features: [
      "Jusqu'à 50 produits & variantes",
      "Vitrine dédiée /s/votre-boutique",
      "Paiements Orange Money, MTN MoMo & COD",
    ],
  },
  {
    id: "PRO" as const,
    name: "Pro",
    price: "15 000 FCFA / mois",
    commission: "2% par vente",
    maxProducts: null,
    recommended: true,
    features: [
      "Produits & variantes illimités",
      "Notifications automatiques & Domaine perso",
      "Badge Partenaire Vérifié + Support prioritaire",
    ],
  },
  {
    id: "BUSINESS" as const,
    name: "Business",
    price: "45 000 FCFA / mois",
    commission: "0% commission",
    maxProducts: null,
    features: [
      "0% de commission sur ventes",
      "Multi-utilisateurs & Hub Logistique",
      "Domaine personnalisé & API prioritaire",
    ],
  },
];

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}
