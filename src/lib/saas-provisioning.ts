import { prisma } from "./prisma";
import { sendTransactionalNotification } from "./notifications";
import { setSessionCookie } from "./auth";

export const SAAS_PLANS: Record<
  "STARTER" | "PRO" | "BUSINESS",
  {
    name: string;
    priceFcfa: number;
    commissionRate: number;
    maxProducts: number | null;
    durationDays: number;
    features: string[];
  }
> = {
  STARTER: {
    name: "Starter",
    priceFcfa: 0,
    commissionRate: 0.05,
    maxProducts: 50,
    durationDays: 30,
    features: [
      "Jusqu'à 50 produits & variantes",
      "Vitrine dédiée /s/votre-boutique",
      "Paiements Orange Money, MTN MoMo & COD",
    ],
  },
  PRO: {
    name: "Pro",
    priceFcfa: 15000,
    commissionRate: 0.02,
    maxProducts: null,
    durationDays: 30,
    features: [
      "Produits & variantes illimités",
      "Notifications automatiques & Domaine perso",
      "Badge Partenaire Vérifié + Support prioritaire",
    ],
  },
  BUSINESS: {
    name: "Business",
    priceFcfa: 45000,
    commissionRate: 0.0,
    maxProducts: null,
    durationDays: 30,
    features: [
      "0% de commission sur ventes",
      "Multi-utilisateurs & Hub Logistique",
      "Domaine personnalisé & API prioritaire",
    ],
  },
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;
function safeHex(val: string | undefined, fallback: string): string {
  return val && HEX_COLOR_RE.test(val.trim()) ? val.trim() : fallback;
}

export async function provisionStoreFromSubscription(
  subscriptionId: string,
  actorId?: string,
  refreshSession = false
) {
  const result = await prisma.$transaction(async (tx) => {
    const subscription = await tx.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        store: true,
        payments: { where: { status: "SUCCESS" }, orderBy: { createdAt: "desc" } },
      },
    });

    if (!subscription) {
      throw new Error("Souscription introuvable.");
    }

    // Idempotency: already provisioned
    if (subscription.storeId && subscription.store) {
      return { store: subscription.store, alreadyProvisioned: true, ownerId: subscription.userId };
    }

    if (!subscription.userId || !subscription.draftId) {
      throw new Error("Souscription incomplète (utilisateur ou brouillon manquant).");
    }

    // Absolute business rule: paid plans MUST have a confirmed SUCCESS payment matching priceFcfa
    if (subscription.priceFcfa > 0) {
      const validPayment = subscription.payments.find((p) => p.amountFcfa >= subscription.priceFcfa);
      if (!validPayment) {
        throw new Error("PAIEMENT_REQUIS: Aucun paiement confirmé ne correspond à cette souscription.");
      }
    }

    const draft = await tx.storeDraft.findUnique({ where: { id: subscription.draftId } });
    if (!draft) {
      throw new Error("Brouillon de boutique introuvable.");
    }

    const owner = await tx.user.findUnique({ where: { id: subscription.userId } });
    if (!owner) {
      throw new Error("Compte propriétaire introuvable.");
    }

    const data = JSON.parse(draft.dataJson) as {
      storeName?: string;
      customSlug?: string;
      tagline?: string;
      description?: string;
      logoUrl?: string;
      bannerUrl?: string;
      sector?: string;
      commerceType?: string;
      currency?: string;
      country?: string;
      city?: string;
      quarter?: string;
      address?: string;
      businessPhone?: string;
      whatsappPhone?: string;
      businessEmail?: string;
      primaryColor?: string;
      secondaryColor?: string;
      accentColor?: string;
      buttonColor?: string;
      themePreset?: string;
      rccm?: string;
      niu?: string;
      paymentMethods?: string[];
      deliveryEnabled?: boolean;
      pickupEnabled?: boolean;
      stockManagement?: boolean;
      showPrices?: boolean;
      notificationsEnabled?: boolean;
      productMode?: "EMPTY" | "CUSTOM" | "DEMO";
      initialProducts?: {
        title: string;
        description?: string;
        priceFcfa: number;
        costPriceFcfa?: number;
        stock: number;
        categoryId?: string;
        imageUrl?: string;
      }[];
    };

    const planKey = (subscription.plan in SAAS_PLANS ? subscription.plan : "STARTER") as keyof typeof SAAS_PLANS;
    const planCfg = SAAS_PLANS[planKey];

    const baseSlug = slugify(data.customSlug || data.storeName || draft.slug || "boutique") || "boutique";
    const slugTaken = await tx.store.findUnique({ where: { slug: baseSlug }, select: { id: true } });
    const finalSlug = slugTaken ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;

    const safeConfig = {
      paymentMethods: Array.isArray(data.paymentMethods)
        ? data.paymentMethods
        : ["ORANGE_MONEY", "MTN_MOMO", "CASH_ON_DELIVERY"],
      deliveryEnabled: data.deliveryEnabled !== false,
      pickupEnabled: data.pickupEnabled !== false,
      stockManagement: data.stockManagement !== false,
      showPrices: data.showPrices !== false,
      notificationsEnabled: planKey !== "STARTER" ? data.notificationsEnabled !== false : false,
      customDomainAllowed: planKey !== "STARTER",
      multiUserAllowed: planKey === "BUSINESS",
    };

    const store = await tx.store.create({
      data: {
        name: (data.storeName || draft.storeName || "Ma Boutique").trim(),
        slug: finalSlug,
        tagline: data.tagline?.trim() || `Boutique officielle ${data.storeName || "COMMERCIA"}`,
        description: data.description?.trim() || null,
        logoUrl: data.logoUrl?.trim() || null,
        bannerUrl: data.bannerUrl?.trim() || null,
        primaryColor: safeHex(data.primaryColor, "#0B192C"),
        secondaryColor: safeHex(data.secondaryColor, "#1E3A5F"),
        accentColor: safeHex(data.accentColor, "#F97316"),
        buttonColor: safeHex(data.buttonColor, "#F97316"),
        themePreset: data.themePreset?.trim() || "albedoo",
        sector: data.sector?.trim() || "Commerce général",
        commerceType: data.commerceType?.trim() || "B2C",
        currency: data.currency?.trim() || "FCFA",
        country: data.country?.trim() || "Cameroun",
        plan: planKey,
        status: "ACTIVE",
        city: data.city?.trim() || "Douala",
        quarter: data.quarter?.trim() || null,
        address: data.address?.trim() || null,
        businessPhone: data.businessPhone?.trim() || owner.phone || null,
        whatsappPhone: data.whatsappPhone?.trim() || owner.phone || null,
        businessEmail: data.businessEmail?.trim() || owner.email,
        rccm: data.rccm?.trim() || null,
        niu: data.niu?.trim() || null,
        configJson: JSON.stringify(safeConfig),
        idempotencyKey: `sub-${subscription.id}`,
      },
    });

    const nextEnd = new Date();
    nextEnd.setDate(nextEnd.getDate() + planCfg.durationDays);

    await tx.subscription.update({
      where: { id: subscription.id },
      data: {
        storeId: store.id,
        status: "ACTIVE",
        currentPeriodEnd: nextEnd,
      },
    });

    await tx.storeDraft.update({
      where: { id: draft.id },
      data: { status: "PROVISIONED", slug: finalSlug },
    });

    const nextRole = ["ADMIN", "EXECUTIVE", "SUPER_ADMIN"].includes(owner.role) ? owner.role : "VENDOR";
    await tx.user.update({
      where: { id: owner.id },
      data: {
        role: nextRole,
        storeId: store.id,
        title: owner.title || `Fondateur — ${store.name}`,
      },
    });

    const vendorProfile = await tx.vendorProfile.upsert({
      where: { userId: owner.id },
      create: {
        userId: owner.id,
        companyName: store.name,
        rccm: data.rccm?.trim() || null,
        niu: data.niu?.trim() || null,
        city: store.city,
        status: "APPROVED",
        commissionRate: planCfg.commissionRate,
        verifiedBadge: true,
      },
      update: {
        companyName: store.name,
        commissionRate: planCfg.commissionRate,
        status: "APPROVED",
      },
    });

    const defaultCategory = await tx.category.findFirst({ orderBy: { sortOrder: "asc" } });
    const ts = Date.now().toString().slice(-5);

    if (
      data.productMode === "CUSTOM" &&
      Array.isArray(data.initialProducts) &&
      data.initialProducts.length > 0 &&
      defaultCategory
    ) {
      const capped = planCfg.maxProducts
        ? data.initialProducts.slice(0, planCfg.maxProducts)
        : data.initialProducts;

      for (let i = 0; i < capped.length; i++) {
        const item = capped[i];
        if (!item.title?.trim() || Number(item.priceFcfa) <= 0) continue;
        await tx.product.create({
          data: {
            title: item.title.trim(),
            slug: `${slugify(item.title) || "produit"}-${ts}-${i + 1}`,
            description: item.description?.trim() || item.title.trim(),
            sku: `SKU-${ts}-${i + 1}`,
            priceFcfa: Math.round(Number(item.priceFcfa)),
            costPriceFcfa: Math.max(0, Math.round(Number(item.costPriceFcfa) || Number(item.priceFcfa) * 0.7)),
            initialStock: Math.max(0, Math.round(Number(item.stock) || 10)),
            stock: Math.max(0, Math.round(Number(item.stock) || 10)),
            salesModel: "MARKETPLACE_PARTNER",
            qualityStatus: "APPROVED",
            imageUrl: item.imageUrl?.trim() || "/products/smartphone.jpg",
            isFeatured: i === 0,
            categoryId: item.categoryId || defaultCategory.id,
            storeId: store.id,
            vendorId: vendorProfile.id,
          },
        });
      }
    } else if (data.productMode === "DEMO" && defaultCategory) {
      await tx.product.createMany({
        data: [
          {
            title: `[Démo] Produit Vedette — ${store.name}`,
            slug: `${finalSlug}-demo-1-${ts}`,
            description: "Article de démonstration. Modifiez ou supprimez-le depuis /vendeur.",
            sku: `DEMO-${ts}-1`,
            priceFcfa: 25000,
            costPriceFcfa: 18000,
            compareAtFcfa: 32000,
            initialStock: 15,
            stock: 15,
            salesModel: "MARKETPLACE_PARTNER",
            qualityStatus: "APPROVED",
            imageUrl: "/products/smartphone.jpg",
            isFeatured: true,
            categoryId: defaultCategory.id,
            storeId: store.id,
            vendorId: vendorProfile.id,
          },
          {
            title: `[Démo] Offre Découverte — ${store.name}`,
            slug: `${finalSlug}-demo-2-${ts}`,
            description: "Second article de démonstration. Modifiez ou supprimez-le depuis /vendeur.",
            sku: `DEMO-${ts}-2`,
            priceFcfa: 12500,
            costPriceFcfa: 8500,
            initialStock: 20,
            stock: 20,
            salesModel: "MARKETPLACE_PARTNER",
            qualityStatus: "APPROVED",
            imageUrl: "/products/cosmetic.jpg",
            categoryId: defaultCategory.id,
            storeId: store.id,
            vendorId: vendorProfile.id,
          },
        ],
      });
    }

    if (subscription.priceFcfa > 0) {
      const paidPayment = subscription.payments[0];
      await tx.billingInvoice.create({
        data: {
          invoiceNumber: `INV-SAAS-${Date.now().toString().slice(-7)}`,
          storeId: store.id,
          plan: planKey,
          amountFcfa: subscription.priceFcfa,
          paymentMethod: paidPayment?.method || "ONLINE",
          status: "PAID",
        },
      });
    }

    await tx.auditLog.create({
      data: {
        actorId: actorId || owner.id,
        actorRole: actorId ? "ADMIN" : owner.role,
        action: "STORE_PROVISIONED",
        targetType: "Store",
        targetId: store.id,
        details: `Boutique ${store.name} (/s/${store.slug}) activée pour souscription ${subscription.id} (Plan ${planKey})`,
      },
    });

    return { store, alreadyProvisioned: false, ownerId: owner.id, ownerRole: nextRole, ownerEmail: owner.email };
  });

  if (!result.alreadyProvisioned) {
    if (refreshSession && result.ownerId && result.ownerRole) {
      await setSessionCookie(result.ownerId, result.ownerRole, result.store.id);
    }
    if (result.ownerEmail) {
      sendTransactionalNotification({
        storeId: result.store.id,
        channel: "EMAIL",
        recipient: result.ownerEmail,
        subject: `Félicitations ! Votre boutique ${result.store.name} est activée`,
        message: `Votre boutique COMMERCIA est en ligne sur /s/${result.store.slug}. Accédez à votre espace vendeur sur /vendeur.`,
      }).catch(() => {});
    }
  }

  return result;
}
