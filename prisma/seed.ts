import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Cameroon E-Commerce Platform database...");

  // Clean existing data in dependency order
  await prisma.orderEvent.deleteMany();
  await prisma.claim.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.review.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.vendorProfile.deleteMany();
  await prisma.deliveryZone.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("Demo2026!", 10);

  // 1. Users
  const clientUser = await prisma.user.create({
    data: {
      name: "Jean-Paul Mbarga",
      email: "client@exemple.cm",
      passwordHash,
      phone: "+237 699 12 34 56",
      role: "CLIENT",
      city: "Douala",
      quarter: "Bonapriso",
      loyaltyPoints: 450,
    },
  });

  const vendorUser1 = await prisma.user.create({
    data: {
      name: "Alain Nguema",
      email: "vendeur.tech@exemple.cm",
      passwordHash,
      phone: "+237 677 45 89 10",
      role: "VENDOR",
      city: "Douala",
      quarter: "Akwa",
    },
  });

  const vendorUser2 = await prisma.user.create({
    data: {
      name: "Aïcha Bello",
      email: "vendeur.beaute@exemple.cm",
      passwordHash,
      phone: "+237 691 22 33 44",
      role: "VENDOR",
      city: "Yaoundé",
      quarter: "Bastos",
    },
  });

  await prisma.user.create({
    data: {
      name: "Samuel Fotso",
      email: "logistique@exemple.cm",
      passwordHash,
      phone: "+237 655 78 90 12",
      role: "LOGISTICS",
      title: "Responsable Hub Logistique Douala",
      city: "Douala",
      quarter: "Akwa",
    },
  });

  await prisma.user.create({
    data: {
      name: "Clarisse Tchoumi",
      email: "admin@exemple.cm",
      passwordHash,
      phone: "+237 690 11 22 33",
      role: "ADMIN",
      title: "Administratrice Plateforme",
      city: "Douala",
      quarter: "Bonanjo",
    },
  });

  await prisma.user.create({
    data: {
      name: "Associé 1 — Direction Générale",
      email: "dg@exemple.cm",
      passwordHash,
      phone: "+237 699 00 00 01",
      role: "EXECUTIVE",
      title: "Directeur Général (Collège des 4 Associés)",
      city: "Douala",
      quarter: "Bonanjo",
    },
  });

  // 2. Vendor Profiles
  const vendorTech = await prisma.vendorProfile.create({
    data: {
      userId: vendorUser1.id,
      companyName: "KamerTech Distribution SARL",
      rccm: "RC/DLA/2023/B/1842",
      niu: "M032314589012K",
      city: "Douala",
      status: "APPROVED",
      commissionRate: 0.12,
      verifiedBadge: true,
      balanceFcfa: 685000,
    },
  });

  const vendorBeaute = await prisma.vendorProfile.create({
    data: {
      userId: vendorUser2.id,
      companyName: "Éclat Naturel Cameroun",
      rccm: "RC/YAO/2024/A/0912",
      niu: "M012409871234P",
      city: "Yaoundé",
      status: "APPROVED",
      commissionRate: 0.15,
      verifiedBadge: true,
      balanceFcfa: 245000,
    },
  });

  // 3. Categories (All 13 from cahier de charge)
  const categoriesData = [
    { name: "Téléphones & Accessoires", slug: "telephones-accessoires", description: "Smartphones officiels, chargeurs certifiés, coques et écouteurs.", icon: "Smartphone", isPriorityLaunch: true, sortOrder: 1 },
    { name: "Électronique & Informatique", slug: "electronique-informatique", description: "Ordinateurs portables, onduleurs, accessoires réseau et bureau.", icon: "Laptop", isPriorityLaunch: true, sortOrder: 2 },
    { name: "Beauté & Cosmétique", slug: "beaute-cosmetique", description: "Soins capillaires, dermocosmétique, parfums et produits naturels.", icon: "Sparkles", isPriorityLaunch: true, sortOrder: 3 },
    { name: "Mode & Habillement", slug: "mode-habillement", description: "Prêt-à-porter, tenues professionnelles et créations locales.", icon: "Shirt", isPriorityLaunch: true, sortOrder: 4 },
    { name: "Alimentation & Produits Locaux", slug: "alimentation-produits-locaux", description: "Café, cacao, miel du Cameroun, épices et épicerie fine locale.", icon: "Coffee", isPriorityLaunch: true, sortOrder: 5 },
    { name: "Maison & Décoration", slug: "maison-decoration", description: "Linge de maison, luminaires, rangement et décoration intérieure.", icon: "Home", isPriorityLaunch: true, sortOrder: 6 },
    { name: "Électroménager", slug: "electromenager", description: "Mixeurs, ventilateurs solaires, micro-ondes et petit électroménager.", icon: "Refrigerator", isPriorityLaunch: false, sortOrder: 7 },
    { name: "Chaussures & Maroquinerie", slug: "chaussures-maroquinerie", description: "Chaussures de ville, baskets, sacs en cuir et bagagerie.", icon: "ShoppingBag", isPriorityLaunch: false, sortOrder: 8 },
    { name: "Bébé & Enfants", slug: "bebe-enfants", description: "Puériculture, couches, vêtements et jeux éducatifs.", icon: "Baby", isPriorityLaunch: false, sortOrder: 9 },
    { name: "Sport & Loisirs", slug: "sport-loisirs", description: "Équipements fitness, maillots, ballons et accessoires sport.", icon: "Dumbbell", isPriorityLaunch: false, sortOrder: 10 },
    { name: "Automobile & Accessoires", slug: "automobile-accessoires", description: "Batteries, dashcams, kits de secours et entretien auto.", icon: "Car", isPriorityLaunch: false, sortOrder: 11 },
    { name: "Fournitures Professionnelles", slug: "fournitures-professionnelles", description: "Papeterie, imprimantes, consommables PME et mobilier.", icon: "Briefcase", isPriorityLaunch: false, sortOrder: 12 },
    { name: "Équipements Industriels", slug: "equipements-industriels", description: "Groupes électrogènes, outillage lourd et équipements sur commande.", icon: "Wrench", isPriorityLaunch: false, sortOrder: 13 },
  ];

  const categories: Record<string, string> = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.create({ data: cat });
    categories[cat.slug] = created.id;
  }

  // 4. Delivery Zones
  await prisma.deliveryZone.createMany({
    data: [
      { city: "Douala", zoneName: "Douala Centre (Akwa, Bonanjo, Bonapriso, Bali)", feeFcfa: 1500, estimatedDays: "24h", supportsCod: true, codMaxFcfa: 150000, relayPointName: "Hub Akwa — Bd de la Liberté" },
      { city: "Douala", zoneName: "Douala Périphérie (Bonamoussadi, Makepe, Ndokotti, Bonabéri)", feeFcfa: 2000, estimatedDays: "24h - 48h", supportsCod: true, codMaxFcfa: 150000, relayPointName: "Relais Bonamoussadi — Carrefour" },
      { city: "Yaoundé", zoneName: "Yaoundé Centre (Bastos, Centre-Ville, Hippodrome, Essos)", feeFcfa: 2500, estimatedDays: "24h - 48h", supportsCod: true, codMaxFcfa: 150000, relayPointName: "Relais Bastos — Nouvelle Route" },
      { city: "Yaoundé", zoneName: "Yaoundé Périphérie (Biyem-Assi, Odza, Mimboman)", feeFcfa: 3000, estimatedDays: "48h", supportsCod: true, codMaxFcfa: 100000, relayPointName: "Relais Biyem-Assi — Acacias" },
      { city: "Bafoussam", zoneName: "Bafoussam Urbain", feeFcfa: 3500, estimatedDays: "2 - 3 jours", supportsCod: false, codMaxFcfa: 0, relayPointName: "Agence Transport Centre" },
      { city: "Kribi", zoneName: "Kribi Centre", feeFcfa: 3500, estimatedDays: "2 - 3 jours", supportsCod: false, codMaxFcfa: 0, relayPointName: "Relais Kribi Port" },
      { city: "Garoua", zoneName: "Garoua Urbain", feeFcfa: 5000, estimatedDays: "3 - 5 jours", supportsCod: false, codMaxFcfa: 0, relayPointName: "Relais Garoua Plateau" },
      { city: "Limbé", zoneName: "Limbé & Buéa", feeFcfa: 3500, estimatedDays: "2 - 3 jours", supportsCod: false, codMaxFcfa: 0, relayPointName: "Relais Mile 4 Limbé" },
    ],
  });

  // 5. Products (Mix of Direct Retail, Marketplace Partner, On Order)
  const productsData = [
    {
      title: "Samsung Galaxy A55 5G — 256 Go (Version Officielle)",
      slug: "samsung-galaxy-a55-5g-256go",
      description: "Smartphone Samsung Galaxy A55 5G 256 Go / 8 Go RAM, écran Super AMOLED 6,6\", triple capteur 50 MP, batterie 5000 mAh. Scellé d'usine avec garantie constructeur 12 mois au Cameroun.",
      sku: "TEL-SAM-A55-256",
      priceFcfa: 245000,
      costPriceFcfa: 205000,
      compareAtFcfa: 275000,
      stock: 18,
      salesModel: "DIRECT_RETAIL",
      qualityStatus: "APPROVED",
      warrantyMonths: 12,
      leadTimeDaysDouala: 1,
      leadTimeDaysYaounde: 2,
      leadTimeDaysOther: 4,
      imageUrl: "/products/smartphone.jpg",
      specsJson: JSON.stringify({ Stockage: "256 Go", RAM: "8 Go", Écran: "6,6\" Super AMOLED 120Hz", Batterie: "5000 mAh", Réseau: "5G Dual SIM" }),
      rating: 4.9,
      reviewCount: 24,
      isFeatured: true,
      isSponsored: false,
      categoryId: categories["telephones-accessoires"],
      vendorId: null,
    },
    {
      title: "Chargeur Rapide Anker 65W GaN USB-C + Câble Tressé",
      slug: "chargeur-anker-65w-gan",
      description: "Chargeur secteur haute puissance 65W compatible ordinateurs portables et smartphones. Protection contre les surtensions adaptée au réseau électrique local.",
      sku: "ACC-ANK-65W",
      priceFcfa: 22500,
      costPriceFcfa: 15000,
      compareAtFcfa: 28000,
      stock: 45,
      salesModel: "DIRECT_RETAIL",
      qualityStatus: "APPROVED",
      warrantyMonths: 12,
      leadTimeDaysDouala: 1,
      leadTimeDaysYaounde: 2,
      leadTimeDaysOther: 3,
      imageUrl: "/products/charger.jpg",
      specsJson: JSON.stringify({ Puissance: "65W GaN", Ports: "2x USB-C + 1x USB-A", Protection: "Anti-surtension intégrée" }),
      rating: 4.8,
      reviewCount: 31,
      isFeatured: true,
      isSponsored: false,
      categoryId: categories["telephones-accessoires"],
      vendorId: null,
    },
    {
      title: "HP EliteBook 840 G8 — Core i5 11e Gén / 16 Go / 512 Go SSD",
      slug: "hp-elitebook-840-g8-i5",
      description: "Ordinateur portable professionnel reconditionné Grade A+, testé en 25 points par notre partenaire KamerTech. Clavier AZERTY rétroéclairé, autonomie 7h+.",
      sku: "INF-HP-840G8",
      priceFcfa: 315000,
      costPriceFcfa: 277200,
      compareAtFcfa: 350000,
      stock: 9,
      salesModel: "MARKETPLACE_PARTNER",
      qualityStatus: "APPROVED",
      warrantyMonths: 6,
      leadTimeDaysDouala: 1,
      leadTimeDaysYaounde: 2,
      leadTimeDaysOther: 4,
      imageUrl: "/products/laptop.jpg",
      specsJson: JSON.stringify({ Processeur: "Intel Core i5-1145G7", Mémoire: "16 Go DDR4", Stockage: "512 Go NVMe SSD", Écran: "14\" Full HD IPS" }),
      rating: 4.8,
      reviewCount: 15,
      isFeatured: true,
      isSponsored: true,
      categoryId: categories["electronique-informatique"],
      vendorId: vendorTech.id,
    },
    {
      title: "Onduleur APC Back-UPS 1200VA / 650W — Protection Totale",
      slug: "onduleur-apc-1200va",
      description: "Indispensable pour protéger ordinateurs, box internet et TV contre les coupures et variations de tension. 6 prises protégées + régulateur AVR.",
      sku: "INF-APC-1200",
      priceFcfa: 78000,
      costPriceFcfa: 68640,
      compareAtFcfa: 89000,
      stock: 14,
      salesModel: "MARKETPLACE_PARTNER",
      qualityStatus: "APPROVED",
      warrantyMonths: 12,
      leadTimeDaysDouala: 1,
      leadTimeDaysYaounde: 2,
      leadTimeDaysOther: 4,
      imageUrl: "/products/ups.jpg",
      specsJson: JSON.stringify({ Capacité: "1200 VA / 650 W", Autonomie: "25 - 45 min", Régulation: "AVR automatique" }),
      rating: 4.9,
      reviewCount: 19,
      isFeatured: false,
      isSponsored: false,
      categoryId: categories["electronique-informatique"],
      vendorId: vendorTech.id,
    },
    {
      title: "Coffret Beurre de Karité Pur & Huile de Moringa du Cameroun",
      slug: "coffret-karite-moringa-cameroun",
      description: "Soin 100% naturel pressé à froid dans l'Adamaoua et conditionné à Yaoundé. Hydratation intense peau et cheveux, sans conservateurs chimiques.",
      sku: "BEA-ENC-KAR01",
      priceFcfa: 14500,
      costPriceFcfa: 9500,
      compareAtFcfa: 18000,
      stock: 60,
      salesModel: "MARKETPLACE_PARTNER",
      qualityStatus: "APPROVED",
      warrantyMonths: 0,
      leadTimeDaysDouala: 2,
      leadTimeDaysYaounde: 1,
      leadTimeDaysOther: 3,
      imageUrl: "/products/cosmetic.jpg",
      specsJson: JSON.stringify({ Origine: "Adamaoua / Yaoundé", Contenance: "250 ml + 100 ml", Certification: "100% Naturel pressé à froid" }),
      rating: 4.9,
      reviewCount: 42,
      isFeatured: true,
      isSponsored: false,
      categoryId: categories["beaute-cosmetique"],
      vendorId: vendorBeaute.id,
    },
    {
      title: "Café Arabica des Hauts Plateaux de l'Ouest — Grains 500g",
      slug: "cafe-arabica-ouest-500g",
      description: "Torréfaction artisanale de Bafoussam, arôme riche et notes chocolatées. Conditionné sous valve fraîcheur pour préserver toute l'authenticité du terroir.",
      sku: "ALI-CAF-500G",
      priceFcfa: 7500,
      costPriceFcfa: 4800,
      compareAtFcfa: 9000,
      stock: 85,
      salesModel: "DIRECT_RETAIL",
      qualityStatus: "APPROVED",
      warrantyMonths: 0,
      leadTimeDaysDouala: 1,
      leadTimeDaysYaounde: 1,
      leadTimeDaysOther: 3,
      imageUrl: "/products/coffee.jpg",
      specsJson: JSON.stringify({ Provenance: "Ouest Cameroun", Poids: "500 g", Torréfaction: "Moyenne — Grains entiers" }),
      rating: 5.0,
      reviewCount: 38,
      isFeatured: true,
      isSponsored: false,
      categoryId: categories["alimentation-produits-locaux"],
      vendorId: null,
    },
    {
      title: "Poivre Blanc de Penja IGP — Bocal Hermétique 200g",
      slug: "poivre-blanc-penja-igp-200g",
      description: "Véritable Poivre Blanc de Penja certifié Indication Géographique Protégée (IGP). Récolté à maturité dans le Moungo, reconnu par les plus grands chefs.",
      sku: "ALI-PEN-200G",
      priceFcfa: 9500,
      costPriceFcfa: 6200,
      compareAtFcfa: null,
      stock: 52,
      salesModel: "DIRECT_RETAIL",
      qualityStatus: "APPROVED",
      warrantyMonths: 0,
      leadTimeDaysDouala: 1,
      leadTimeDaysYaounde: 2,
      leadTimeDaysOther: 3,
      imageUrl: "/products/spice.jpg",
      specsJson: JSON.stringify({ Origine: "Penja (Moungo)", Label: "IGP Certifié", Poids: "200 g" }),
      rating: 4.9,
      reviewCount: 29,
      isFeatured: false,
      isSponsored: false,
      categoryId: categories["alimentation-produits-locaux"],
      vendorId: null,
    },
    {
      title: "Chemise Lin & Coton Coupe Executive — Collection Ndop",
      slug: "chemise-lin-coton-ndop",
      description: "Chemise élégante confectionnée au Cameroun avec finitions discrètes inspirées du motif Ndop. Tissu respirant adapté au climat tropical.",
      sku: "MOD-NDO-CH01",
      priceFcfa: 24000,
      costPriceFcfa: 15500,
      compareAtFcfa: 29000,
      stock: 25,
      salesModel: "DIRECT_RETAIL",
      qualityStatus: "APPROVED",
      warrantyMonths: 0,
      leadTimeDaysDouala: 1,
      leadTimeDaysYaounde: 2,
      leadTimeDaysOther: 4,
      imageUrl: "/products/shirt.jpg",
      specsJson: JSON.stringify({ Matière: "70% Coton, 30% Lin", Tailles: "M, L, XL, XXL", Confection: "Atelier Douala" }),
      rating: 4.7,
      reviewCount: 14,
      isFeatured: true,
      isSponsored: false,
      categoryId: categories["mode-habillement"],
      vendorId: null,
    },
    {
      title: "Parure de Lit 4 Pièces Percale de Coton — Blanc Hôtelier",
      slug: "parure-lit-percale-blanc",
      description: "Drap housse, drap plat et 2 taies d'oreiller en percale de coton 220 fils. Douceur durable et résistance aux lavages fréquents.",
      sku: "MAI-PAR-220",
      priceFcfa: 32000,
      costPriceFcfa: 21000,
      compareAtFcfa: 38000,
      stock: 19,
      salesModel: "DIRECT_RETAIL",
      qualityStatus: "APPROVED",
      warrantyMonths: 0,
      leadTimeDaysDouala: 1,
      leadTimeDaysYaounde: 2,
      leadTimeDaysOther: 4,
      imageUrl: "/products/home.jpg",
      specsJson: JSON.stringify({ Dimensions: "180 x 200 cm (King)", Matière: "100% Coton 220 fils", Contenu: "4 pièces" }),
      rating: 4.8,
      reviewCount: 11,
      isFeatured: false,
      isSponsored: false,
      categoryId: categories["maison-decoration"],
      vendorId: null,
    },
    {
      title: "Ventilateur Solaire Rechargeable 16\" + Panneau & 2 Ampoules LED",
      slug: "ventilateur-solaire-rechargeable-16",
      description: "Ventilateur hybride secteur/solaire avec batterie lithium intégrée (autonomie 10h) et port USB pour charger vos téléphones durant les coupures.",
      sku: "ELE-VEN-SOL16",
      priceFcfa: 48500,
      costPriceFcfa: 35000,
      compareAtFcfa: 55000,
      stock: 16,
      salesModel: "DIRECT_RETAIL",
      qualityStatus: "APPROVED",
      warrantyMonths: 6,
      leadTimeDaysDouala: 1,
      leadTimeDaysYaounde: 2,
      leadTimeDaysOther: 4,
      imageUrl: "/products/fan.jpg",
      specsJson: JSON.stringify({ Diamètre: "16 pouces", Batterie: "Lithium 12V 7Ah", Autonomie: "Jusqu'à 10 heures", Bonus: "Panneau 20W + 2 ampoules" }),
      rating: 4.9,
      reviewCount: 33,
      isFeatured: true,
      isSponsored: false,
      categoryId: categories["electromenager"],
      vendorId: null,
    },
    {
      title: "Groupe Électrogène Insonorisé 5,5 kVA — Démarrage Électrique",
      slug: "groupe-electrogene-5-5kva-sur-commande",
      description: "Équipement professionnel sur commande avec livraison et mise en service possible à Douala et Yaoundé. Idéal PME, cliniques et bureaux.",
      sku: "IND-GEN-5500",
      priceFcfa: 680000,
      costPriceFcfa: 560000,
      compareAtFcfa: null,
      stock: 3,
      salesModel: "ON_ORDER",
      qualityStatus: "APPROVED",
      warrantyMonths: 12,
      leadTimeDaysDouala: 5,
      leadTimeDaysYaounde: 6,
      leadTimeDaysOther: 10,
      imageUrl: "/products/generator.jpg",
      specsJson: JSON.stringify({ Puissance: "5,5 kVA / 4400 W", Carburant: "Essence 4 temps", Niveau_Sonore: "68 dB (Insonorisé)" }),
      rating: 4.8,
      reviewCount: 5,
      isFeatured: false,
      isSponsored: false,
      categoryId: categories["equipements-industriels"],
      vendorId: null,
    },
    {
      title: "Écouteurs Sans Fil ANC Pro — Réduction de Bruit Active",
      slug: "ecouteurs-anc-pro",
      description: "En attente de validation contrôle qualité (exemple de produit soumis par vendeur partenaire).",
      sku: "ACC-ANC-PRO",
      priceFcfa: 18500,
      costPriceFcfa: 14000,
      compareAtFcfa: 25000,
      stock: 30,
      salesModel: "MARKETPLACE_PARTNER",
      qualityStatus: "PENDING_QC",
      warrantyMonths: 3,
      leadTimeDaysDouala: 1,
      leadTimeDaysYaounde: 2,
      leadTimeDaysOther: 4,
      imageUrl: "/products/earbuds.jpg",
      specsJson: JSON.stringify({ Autonomie: "24h avec boîtier", Bluetooth: "5.3", Réduction_Bruit: "ANC -35dB" }),
      rating: 4.5,
      reviewCount: 0,
      isFeatured: false,
      isSponsored: false,
      categoryId: categories["telephones-accessoires"],
      vendorId: vendorTech.id,
    },
    {
      title: "Mocassins Cuir Véritable Executive — Noir Classique",
      slug: "mocassins-cuir-executive-noir",
      description: "Chaussures de ville en cuir souple cousu Blake, semelle antidérapante durable. Idéal bureau et cérémonies.",
      sku: "CHA-MOC-42",
      priceFcfa: 38000,
      costPriceFcfa: 24500,
      compareAtFcfa: 45000,
      stock: 22,
      salesModel: "DIRECT_RETAIL",
      qualityStatus: "APPROVED",
      warrantyMonths: 3,
      leadTimeDaysDouala: 1,
      leadTimeDaysYaounde: 2,
      leadTimeDaysOther: 4,
      imageUrl: "/products/shoes.jpg",
      specsJson: JSON.stringify({ Matière: "100% Cuir pleine fleur", Pointures: "40 à 45", Semelle: "Caoutchouc antidérapant" }),
      rating: 4.8,
      reviewCount: 17,
      isFeatured: true,
      isSponsored: false,
      categoryId: categories["chaussures-maroquinerie"],
      vendorId: null,
    },
    {
      title: "Sac Porte-Documents Cuir Business 15,6\" — Étanche",
      slug: "sac-porte-documents-cuir-15",
      description: "Sacoche professionnelle avec compartiment ordinateur rembourré, port USB externe et bandoulière renforcée.",
      sku: "MAR-SAC-156",
      priceFcfa: 29500,
      costPriceFcfa: 19000,
      compareAtFcfa: 36000,
      stock: 15,
      salesModel: "DIRECT_RETAIL",
      qualityStatus: "APPROVED",
      warrantyMonths: 6,
      leadTimeDaysDouala: 1,
      leadTimeDaysYaounde: 2,
      leadTimeDaysOther: 4,
      imageUrl: "/products/bag.jpg",
      specsJson: JSON.stringify({ Compatibilité: "Laptop jusqu'à 15,6\"", Matière: "Cuir synthétique haute densité", Étanchéité: "Résistant à la pluie" }),
      rating: 4.7,
      reviewCount: 12,
      isFeatured: false,
      isSponsored: false,
      categoryId: categories["chaussures-maroquinerie"],
      vendorId: null,
    },
    {
      title: "Kit Puériculture & Soins Bébé Doux — 6 Pièces Hypoallergénique",
      slug: "kit-puericulture-bebe-6-pieces",
      description: "Coffret complet avec thermomètre digital, brosse douce, mouche-bébé et soins sans paraben testés dermatologiquement.",
      sku: "BEB-KIT-06",
      priceFcfa: 19500,
      costPriceFcfa: 12500,
      compareAtFcfa: 24000,
      stock: 28,
      salesModel: "DIRECT_RETAIL",
      qualityStatus: "APPROVED",
      warrantyMonths: 6,
      leadTimeDaysDouala: 1,
      leadTimeDaysYaounde: 2,
      leadTimeDaysOther: 3,
      imageUrl: "/products/baby.jpg",
      specsJson: JSON.stringify({ Contenu: '6 accessoires essentiels', Norme: 'Sans BPA / Hypoallergenique', Age: '0 - 24 mois' }),
      rating: 4.9,
      reviewCount: 21,
      isFeatured: false,
      isSponsored: false,
      categoryId: categories["bebe-enfants"],
      vendorId: null,
    },
    {
      title: "Kit Haltères Réglables 20 kg + Barre de Jonction — Mallette",
      slug: "kit-halteres-reglables-20kg",
      description: "Ensemble complet pour musculation à domicile, disques revêtus anti-choc et poignées antidérapantes.",
      sku: "SPO-HAL-20K",
      priceFcfa: 34000,
      costPriceFcfa: 22000,
      compareAtFcfa: 42000,
      stock: 11,
      salesModel: "DIRECT_RETAIL",
      qualityStatus: "APPROVED",
      warrantyMonths: 6,
      leadTimeDaysDouala: 1,
      leadTimeDaysYaounde: 2,
      leadTimeDaysOther: 4,
      imageUrl: "/products/sport.jpg",
      specsJson: JSON.stringify({ Poids_Total: "20 kg modulable", Rangement: "Mallette rigide incluse" }),
      rating: 4.8,
      reviewCount: 16,
      isFeatured: false,
      isSponsored: false,
      categoryId: categories["sport-loisirs"],
      vendorId: null,
    },
    {
      title: "Booster Démarreur Auto 12V 20000mAh + Compresseur Pneus",
      slug: "booster-auto-12v-compresseur",
      description: "Démarrez votre véhicule en 10 secondes sans autre voiture. Sert aussi de batterie externe et gonfleur de pneus digital.",
      sku: "AUT-BOO-12V",
      priceFcfa: 49000,
      costPriceFcfa: 34000,
      compareAtFcfa: 58000,
      stock: 13,
      salesModel: "DIRECT_RETAIL",
      qualityStatus: "APPROVED",
      warrantyMonths: 12,
      leadTimeDaysDouala: 1,
      leadTimeDaysYaounde: 2,
      leadTimeDaysOther: 4,
      imageUrl: "/products/car.jpg",
      specsJson: JSON.stringify({ Capacité: "20 000 mAh / 12V", Courant_Crête: "1500A", Fonctions: "Booster + Compresseur + Powerbank" }),
      rating: 4.9,
      reviewCount: 27,
      isFeatured: true,
      isSponsored: false,
      categoryId: categories["automobile-accessoires"],
      vendorId: null,
    },
    {
      title: "Imprimante Multifonction Wi-Fi Réservoirs d'Encre Haute Capacité",
      slug: "imprimante-multifonction-wifi-encre",
      description: "Impression, scan et copie ultra-économique pour bureaux et PME au Cameroun. Jusqu'à 7 500 pages couleur par recharge.",
      sku: "PRO-IMP-WIFI",
      priceFcfa: 135000,
      costPriceFcfa: 118800,
      compareAtFcfa: 155000,
      stock: 8,
      salesModel: "MARKETPLACE_PARTNER",
      qualityStatus: "APPROVED",
      warrantyMonths: 12,
      leadTimeDaysDouala: 1,
      leadTimeDaysYaounde: 2,
      leadTimeDaysOther: 4,
      imageUrl: "/products/printer.jpg",
      specsJson: JSON.stringify({ Fonctions: "Impression / Scan / Copie", Connectivité: "Wi-Fi + USB", Autonomie: "Bouteilles d'encre incluses" }),
      rating: 4.8,
      reviewCount: 19,
      isFeatured: true,
      isSponsored: false,
      categoryId: categories["fournitures-professionnelles"],
      vendorId: vendorTech.id,
    },
  ];

  const createdProducts: Record<string, { id: string; priceFcfa: number; costPriceFcfa: number; vendorId: string | null }> = {};
  for (const p of productsData) {
    const prod = await prisma.product.create({ data: p });
    createdProducts[p.sku] = {
      id: prod.id,
      priceFcfa: prod.priceFcfa,
      costPriceFcfa: prod.costPriceFcfa,
      vendorId: prod.vendorId,
    };
  }

  // 5b. Seed Variants on flagship products
  await prisma.productVariant.createMany({
    data: [
      { productId: createdProducts["TEL-SAM-A55-256"].id, label: "128 Go · Noir Graphite", sku: "TEL-SAM-A55-128N", usesCustomPrice: true, priceFcfa: 225000, initialStock: 12, stock: 12, colorHex: "#0F172A" },
      { productId: createdProducts["TEL-SAM-A55-256"].id, label: "256 Go · Bleu Nuit", sku: "TEL-SAM-A55-256B", usesCustomPrice: false, priceFcfa: 245000, initialStock: 18, stock: 18, colorHex: "#1E3A5F" },
      { productId: createdProducts["MOD-NDO-CH01"].id, label: "Taille M · Blanc Ndop", sku: "MOD-NDO-CH01-M", usesCustomPrice: false, priceFcfa: 24000, initialStock: 8, stock: 8, colorHex: "#F8FAFC" },
      { productId: createdProducts["MOD-NDO-CH01"].id, label: "Taille L · Blanc Ndop", sku: "MOD-NDO-CH01-L", usesCustomPrice: false, priceFcfa: 24000, initialStock: 10, stock: 10, colorHex: "#F8FAFC" },
      { productId: createdProducts["MOD-NDO-CH01"].id, label: "Taille XL · Bleu Nuit", sku: "MOD-NDO-CH01-XL", usesCustomPrice: true, priceFcfa: 25500, initialStock: 7, stock: 7, colorHex: "#0B192C" },
      { productId: createdProducts["CHA-MOC-42"].id, label: "Pointure 41 · Noir", sku: "CHA-MOC-41", usesCustomPrice: false, priceFcfa: 38000, initialStock: 6, stock: 6, colorHex: "#0F172A" },
      { productId: createdProducts["CHA-MOC-42"].id, label: "Pointure 42 · Noir", sku: "CHA-MOC-42N", usesCustomPrice: false, priceFcfa: 38000, initialStock: 9, stock: 9, colorHex: "#0F172A" },
      { productId: createdProducts["CHA-MOC-42"].id, label: "Pointure 43 · Marron", sku: "CHA-MOC-43M", usesCustomPrice: true, priceFcfa: 39500, initialStock: 7, stock: 7, colorHex: "#78350F" },
      { productId: createdProducts["ALI-CAF-500G"].id, label: "Grains Entiers 500g", sku: "ALI-CAF-500-GR", usesCustomPrice: false, priceFcfa: 7500, initialStock: 50, stock: 50 },
      { productId: createdProducts["ALI-CAF-500G"].id, label: "Moulu Filtre 500g", sku: "ALI-CAF-500-MO", usesCustomPrice: true, priceFcfa: 7800, initialStock: 35, stock: 35 },
    ],
  });

  // 6. Orders + OrderEvents + Claims (realistic historical & active orders)
  const o1 = await prisma.order.create({
    data: {
      orderNumber: "CMD-2026-0101",
      userId: clientUser.id,
      customerName: "Jean-Paul Mbarga",
      customerPhone: "+237 699 12 34 56",
      customerEmail: "client@exemple.cm",
      city: "Douala",
      quarter: "Bonapriso",
      deliveryAddress: "Rue des Cocotiers, Imm. B, Apt 4",
      deliveryMethod: "INTERNAL_DOUALA",
      paymentMethod: "ORANGE_MONEY",
      paymentStatus: "PAID",
      paymentReference: "OM-CM-98451203",
      status: "DELIVERED",
      subtotalFcfa: 267500,
      deliveryFeeFcfa: 1500,
      discountFcfa: 0,
      totalFcfa: 269000,
      commissionTotalFcfa: 0,
      assignedCourier: "Moussa (Flotte Interne #02)",
      qcCheckedBy: "Samuel Fotso",
      items: {
        create: [
          {
            productId: createdProducts["TEL-SAM-A55-256"].id,
            quantity: 1,
            unitPriceFcfa: 245000,
            costPriceFcfa: 205000,
            commissionFcfa: 0,
          },
          {
            productId: createdProducts["ACC-ANK-65W"].id,
            quantity: 1,
            unitPriceFcfa: 22500,
            costPriceFcfa: 15000,
            commissionFcfa: 0,
          },
        ],
      },
      events: {
        create: [
          { stepCode: "7_ORDER_RECEIVED", label: "Commande reçue", description: "Commande enregistrée et paiement Orange Money confirmé (OM-CM-98451203).", actorName: "Système Paiement" },
          { stepCode: "3_QC_PASSED", label: "Contrôle qualité validé", description: "Scellé d'usine vérifié et numéro IMEI enregistré.", actorName: "Samuel Fotso (Logistique)" },
          { stepCode: "9_PACKED", label: "Emballage sécurisé", description: "Colis scellé avec étiquette de suivi CMD-2026-0101.", actorName: "Hub Akwa" },
          { stepCode: "10_SHIPPED", label: "Expédiée", description: "Remis au livreur interne Moussa pour tournée Bonapriso.", actorName: "Samuel Fotso" },
          { stepCode: "12_CONFIRMED_DELIVERY", label: "Réception confirmée", description: "Remis en main propre contre code OTP client.", actorName: "Moussa (Livreur)" },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      orderNumber: "CMD-2026-0102",
      customerName: "Nadine Essomba",
      customerPhone: "+237 678 90 12 34",
      city: "Yaoundé",
      quarter: "Bastos",
      deliveryAddress: "Derrière l'Ambassade, Villa 12",
      deliveryMethod: "PARTNER_COURIER",
      paymentMethod: "MTN_MOMO",
      paymentStatus: "PAID",
      paymentReference: "MOMO-CM-5541209",
      status: "SHIPPED",
      subtotalFcfa: 315000,
      deliveryFeeFcfa: 2500,
      discountFcfa: 0,
      totalFcfa: 317500,
      commissionTotalFcfa: 37800,
      assignedCourier: "Express Yaoundé Partenaire",
      qcCheckedBy: "Samuel Fotso",
      items: {
        create: [
          {
            productId: createdProducts["INF-HP-840G8"].id,
            vendorId: vendorTech.id,
            quantity: 1,
            unitPriceFcfa: 315000,
            costPriceFcfa: 277200,
            commissionFcfa: 37800,
          },
        ],
      },
      events: {
        create: [
          { stepCode: "7_ORDER_RECEIVED", label: "Commande reçue", description: "Paiement MTN MoMo validé.", actorName: "Système Paiement" },
          { stepCode: "3_QC_PASSED", label: "Contrôle qualité validé", description: "Test batterie et écran effectué au hub avant expédition.", actorName: "Samuel Fotso" },
          { stepCode: "10_SHIPPED", label: "Expédiée vers Yaoundé", description: "En cours d'acheminement vers le relais Bastos.", actorName: "Hub Akwa" },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      orderNumber: "CMD-2026-0103",
      customerName: "Patrick Kamdem",
      customerPhone: "+237 695 44 55 66",
      city: "Douala",
      quarter: "Bonamoussadi",
      deliveryAddress: "Carrefour Bonamoussadi, Résidence Émeraude",
      deliveryMethod: "INTERNAL_DOUALA",
      paymentMethod: "CASH_ON_DELIVERY",
      paymentStatus: "PENDING",
      status: "PREPARING",
      subtotalFcfa: 63000,
      deliveryFeeFcfa: 2000,
      discountFcfa: 0,
      totalFcfa: 65000,
      commissionTotalFcfa: 2175,
      qcCheckedBy: "Samuel Fotso",
      items: {
        create: [
          {
            productId: createdProducts["ELE-VEN-SOL16"].id,
            quantity: 1,
            unitPriceFcfa: 48500,
            costPriceFcfa: 35000,
            commissionFcfa: 0,
          },
          {
            productId: createdProducts["BEA-ENC-KAR01"].id,
            vendorId: vendorBeaute.id,
            quantity: 1,
            unitPriceFcfa: 14500,
            costPriceFcfa: 9500,
            commissionFcfa: 2175,
          },
        ],
      },
      events: {
        create: [
          { stepCode: "7_ORDER_RECEIVED", label: "Commande confirmée (COD)", description: "Éligible paiement à la livraison (< 150 000 FCFA, Douala).", actorName: "Système Commandes" },
          { stepCode: "8_PREPARING", label: "En préparation", description: "Consolidation des articles au hub Akwa.", actorName: "Samuel Fotso" },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      orderNumber: "CMD-2026-0104",
      customerName: "Sandrine Ngo Bikaï",
      customerPhone: "+237 671 33 22 11",
      city: "Bafoussam",
      quarter: "Tamdja",
      deliveryAddress: "Face Station Total Tamdja",
      deliveryMethod: "INTERCITY_TRANSPORT",
      paymentMethod: "ORANGE_MONEY",
      paymentStatus: "PAID",
      paymentReference: "OM-CM-77412900",
      status: "CONFIRMED",
      subtotalFcfa: 41000,
      deliveryFeeFcfa: 3500,
      discountFcfa: 0,
      totalFcfa: 44500,
      commissionTotalFcfa: 0,
      items: {
        create: [
          {
            productId: createdProducts["ALI-CAF-500G"].id,
            quantity: 2,
            unitPriceFcfa: 7500,
            costPriceFcfa: 4800,
            commissionFcfa: 0,
          },
          {
            productId: createdProducts["MOD-NDO-CH01"].id,
            quantity: 1,
            unitPriceFcfa: 24000,
            costPriceFcfa: 15500,
            commissionFcfa: 0,
          },
        ],
      },
      events: {
        create: [
          { stepCode: "7_ORDER_RECEIVED", label: "Commande confirmée", description: "Paiement Orange Money reçu. Prête pour contrôle qualité.", actorName: "Système Paiement" },
        ],
      },
    },
  });

  const o5 = await prisma.order.create({
    data: {
      orderNumber: "CMD-2026-0105",
      userId: clientUser.id,
      customerName: "Jean-Paul Mbarga",
      customerPhone: "+237 699 12 34 56",
      city: "Douala",
      quarter: "Akwa",
      deliveryAddress: "Boulevard de la Liberté",
      deliveryMethod: "STORE_PICKUP",
      paymentMethod: "CARD_VISA_MC",
      paymentStatus: "PAID",
      paymentReference: "VISA-3DS-102938",
      status: "RETURN_REQUESTED",
      subtotalFcfa: 78000,
      deliveryFeeFcfa: 0,
      discountFcfa: 0,
      totalFcfa: 78000,
      commissionTotalFcfa: 9360,
      items: {
        create: [
          {
            productId: createdProducts["INF-APC-1200"].id,
            vendorId: vendorTech.id,
            quantity: 1,
            unitPriceFcfa: 78000,
            costPriceFcfa: 68640,
            commissionFcfa: 9360,
          },
        ],
      },
      events: {
        create: [
          { stepCode: "7_ORDER_RECEIVED", label: "Commande confirmée", description: "Paiement Carte Visa 3D Secure validé.", actorName: "Système Paiement" },
          { stepCode: "12_CONFIRMED_DELIVERY", label: "Retirée en magasin", description: "Client a récupéré le colis au Hub Akwa.", actorName: "Hub Akwa" },
          { stepCode: "13_RETURN_REQUESTED", label: "Demande de retour ouverte", description: "Client signale un bip continu au démarrage de l'onduleur.", actorName: "Jean-Paul Mbarga" },
        ],
      },
    },
  });

  // 7. Claims (SAV & Retours)
  await prisma.claim.create({
    data: {
      ticketNumber: "SAV-2026-001",
      orderId: o5.id,
      userId: clientUser.id,
      type: "RETURN",
      status: "IN_REVIEW",
      reason: "L'onduleur émet un signal sonore continu même branché sur secteur. Demande d'échange standard ou remboursement sous garantie.",
      refundAmountFcfa: 78000,
    },
  });

  await prisma.claim.create({
    data: {
      ticketNumber: "SAV-2026-002",
      orderId: o1.id,
      userId: clientUser.id,
      type: "WARRANTY",
      status: "RESOLVED",
      reason: "Demande de duplicata de facture officielle avec numéro NIU pour garantie constructeur.",
      resolutionNote: "Facture PDF envoyée par email et WhatsApp Business.",
      refundAmountFcfa: 0,
    },
  });

  // 8. Reviews
  await prisma.review.createMany({
    data: [
      {
        productId: createdProducts["TEL-SAM-A55-256"].id,
        authorName: "Jean-Paul M.",
        city: "Douala",
        rating: 5,
        comment: "Livré en moins de 24h à Bonapriso, boîte scellée d'origine avec facture conforme. Très rassurant comparé aux vendeurs informels.",
        verifiedPurchase: true,
      },
      {
        productId: createdProducts["ALI-CAF-500G"].id,
        authorName: "Marie-Claire T.",
        city: "Yaoundé",
        rating: 5,
        comment: "Excellent café de l'Ouest, emballage impeccable et livraison rapide au point relais de Bastos.",
        verifiedPurchase: true,
      },
      {
        productId: createdProducts["INF-HP-840G8"].id,
        authorName: "Brice N.",
        city: "Douala",
        rating: 5,
        comment: "PC comme neuf, batterie tient toute la journée. Le contrôle qualité avant expédition fait vraiment la différence.",
        verifiedPurchase: true,
      },
    ],
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


