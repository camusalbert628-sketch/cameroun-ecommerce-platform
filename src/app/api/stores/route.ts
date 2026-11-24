import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sendTransactionalNotification } from "@/lib/notifications";

const PLAN_PRICES: Record<string, { priceFcfa: number; commissionRate: number; maxProducts: number | null }> = {
  STARTER: { priceFcfa: 0, commissionRate: 0.05, maxProducts: 50 },
  PRO: { priceFcfa: 15000, commissionRate: 0.02, maxProducts: null },
  BUSINESS: { priceFcfa: 45000, commissionRate: 0.0, maxProducts: null },
};

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

function safeHex(val: string | undefined, fallback: string): string {
  return val && HEX_COLOR_RE.test(val.trim()) ? val.trim() : fallback;
}

export async function GET(req: NextRequest) {
  const checkSlug = req.nextUrl.searchParams.get("checkSlug");
  if (checkSlug !== null) {
    const clean = slugify(checkSlug);
    if (clean.length < 3) {
      return NextResponse.json({
        available: false,
        slug: clean,
        suggestions: [],
        reason: "Minimum 3 caractères requis.",
      });
    }

    const existing = await prisma.store.findUnique({ where: { slug: clean }, select: { id: true } });
    if (!existing) {
      return NextResponse.json({ available: true, slug: clean, suggestions: [] });
    }

    const candidates = [`${clean}-cm`, `${clean}-shop`, `${clean}-store`, `${clean}-officiel`];
    const taken = await prisma.store.findMany({
      where: { slug: { in: candidates } },
      select: { slug: true },
    });
    const takenSet = new Set(taken.map((t) => t.slug));
    const suggestions = candidates.filter((c) => !takenSet.has(c)).slice(0, 3);

    return NextResponse.json({ available: false, slug: clean, suggestions });
  }

  // Public list — never expose private administrative fields (RCCM, NIU, private email/phone)
  const stores = await prisma.store.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      slug: true,
      tagline: true,
      logoUrl: true,
      bannerUrl: true,
      primaryColor: true,
      secondaryColor: true,
      accentColor: true,
      buttonColor: true,
      sector: true,
      plan: true,
      city: true,
      _count: { select: { products: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ stores });
}

interface InitialProductInput {
  title: string;
  description?: string;
  priceFcfa: number;
  costPriceFcfa?: number;
  stock: number;
  categoryId?: string;
  imageUrl?: string;
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const rl = checkRateLimit(`stores:create:${ip}`, 6, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Trop de créations depuis cette adresse. Réessayez dans ${rl.retryAfterSec}s.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const {
      idempotencyKey,
      ownerName,
      email,
      password,
      phone,
      storeName,
      customSlug,
      tagline,
      description,
      logoUrl,
      bannerUrl,
      sector,
      commerceType,
      currency,
      country,
      city,
      quarter,
      address,
      businessPhone,
      whatsappPhone,
      businessEmail,
      primaryColor,
      secondaryColor,
      accentColor,
      buttonColor,
      themePreset,
      plan,
      rccm,
      niu,
      commercialConfig,
      productMode,
      initialProducts,
    } = body as {
      idempotencyKey?: string;
      ownerName?: string;
      email?: string;
      password?: string;
      phone?: string;
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
      plan?: string;
      rccm?: string;
      niu?: string;
      commercialConfig?: Record<string, unknown>;
      productMode?: "EMPTY" | "CUSTOM" | "DEMO";
      initialProducts?: InitialProductInput[];
    };

    // Idempotency protection against double submission / retries
    if (idempotencyKey?.trim()) {
      const existingByKey = await prisma.store.findUnique({
        where: { idempotencyKey: idempotencyKey.trim() },
      });
      if (existingByKey) {
        return NextResponse.json({ store: existingByKey, idempotent: true }, { status: 200 });
      }
    }

    if (!ownerName?.trim() || !email?.trim() || !password || password.length < 6 || !storeName?.trim()) {
      return NextResponse.json(
        { error: "Nom du dirigeant, email, mot de passe (≥ 6 car.) et nom de boutique sont requis." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json({ error: "Adresse email invalide." }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return NextResponse.json({ error: "Un compte utilise déjà cet email." }, { status: 409 });
    }

    const requestedSlug = slugify(customSlug?.trim() || storeName);
    if (requestedSlug.length < 3) {
      return NextResponse.json(
        { error: "L'adresse (slug) de la boutique doit contenir au moins 3 caractères alphanumériques." },
        { status: 400 }
      );
    }

    // Strict slug uniqueness check (never force numeric suffix silently when user chose an unavailable slug)
    const slugTaken = await prisma.store.findUnique({ where: { slug: requestedSlug }, select: { id: true } });
    if (slugTaken) {
      return NextResponse.json(
        { error: `L'adresse /s/${requestedSlug} est déjà réservée. Veuillez en choisir une autre.` },
        { status: 409 }
      );
    }

    const selectedPlan = plan && PLAN_PRICES[plan] ? plan : "STARTER";
    const planConfig = PLAN_PRICES[selectedPlan];
    const passwordHash = await bcrypt.hash(password, 10);
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);

    // Server-side plan capability enforcement (never trust client toggles blindly)
    const safeConfig = {
      paymentMethods: Array.isArray(commercialConfig?.paymentMethods)
        ? commercialConfig.paymentMethods
        : ["ORANGE_MONEY", "MTN_MOMO", "CASH_ON_DELIVERY"],
      deliveryEnabled: commercialConfig?.deliveryEnabled !== false,
      pickupEnabled: commercialConfig?.pickupEnabled !== false,
      stockManagement: commercialConfig?.stockManagement !== false,
      showPrices: commercialConfig?.showPrices !== false,
      notificationsEnabled: selectedPlan !== "STARTER" ? commercialConfig?.notificationsEnabled !== false : false,
      customDomainAllowed: selectedPlan !== "STARTER",
      multiUserAllowed: selectedPlan === "BUSINESS",
    };

    const defaultCategory = await prisma.category.findFirst({ orderBy: { sortOrder: "asc" } });

    const created = await prisma.$transaction(async (tx) => {
      const store = await tx.store.create({
        data: {
          name: storeName.trim(),
          slug: requestedSlug,
          tagline: tagline?.trim() || `Boutique officielle ${storeName.trim()}`,
          description: description?.trim() || null,
          logoUrl: logoUrl?.trim() || null,
          bannerUrl: bannerUrl?.trim() || null,
          primaryColor: safeHex(primaryColor, "#0B192C"),
          secondaryColor: safeHex(secondaryColor, "#1E3A5F"),
          accentColor: safeHex(accentColor, "#F97316"),
          buttonColor: safeHex(buttonColor, "#F97316"),
          themePreset: themePreset?.trim() || "albedoo",
          sector: sector?.trim() || "Commerce général",
          commerceType: commerceType?.trim() || "B2C",
          currency: currency?.trim() || "FCFA",
          country: country?.trim() || "Cameroun",
          plan: selectedPlan,
          status: "ACTIVE",
          city: city?.trim() || "Douala",
          quarter: quarter?.trim() || null,
          address: address?.trim() || null,
          businessPhone: businessPhone?.trim() || phone?.trim() || null,
          whatsappPhone: whatsappPhone?.trim() || phone?.trim() || null,
          businessEmail: businessEmail?.trim() || normalizedEmail,
          rccm: rccm?.trim() || null,
          niu: niu?.trim() || null,
          configJson: JSON.stringify(safeConfig),
          idempotencyKey: idempotencyKey?.trim() || null,
        },
      });

      await tx.subscription.create({
        data: {
          storeId: store.id,
          plan: selectedPlan,
          priceFcfa: planConfig.priceFcfa,
          status: "ACTIVE",
          currentPeriodEnd: nextMonth,
        },
      });

      const user = await tx.user.create({
        data: {
          name: ownerName.trim(),
          email: normalizedEmail,
          passwordHash,
          phone: phone?.trim() || businessPhone?.trim() || null,
          city: city?.trim() || "Douala",
          quarter: quarter?.trim() || null,
          role: "VENDOR",
          title: `Fondateur — ${store.name}`,
          storeId: store.id,
        },
      });

      const vendorProfile = await tx.vendorProfile.create({
        data: {
          userId: user.id,
          companyName: store.name,
          rccm: rccm?.trim() || null,
          niu: niu?.trim() || null,
          city: city?.trim() || "Douala",
          status: "APPROVED",
          commissionRate: planConfig.commissionRate,
          verifiedBadge: true,
        },
      });

      const ts = Date.now().toString().slice(-5);

      if (productMode === "CUSTOM" && Array.isArray(initialProducts) && initialProducts.length > 0 && defaultCategory) {
        const capped = planConfig.maxProducts
          ? initialProducts.slice(0, planConfig.maxProducts)
          : initialProducts;

        for (let i = 0; i < capped.length; i++) {
          const item = capped[i];
          if (!item.title?.trim() || Number(item.priceFcfa) <= 0) continue;
          const pSlug = `${slugify(item.title) || "produit"}-${ts}-${i + 1}`;
          await tx.product.create({
            data: {
              title: item.title.trim(),
              slug: pSlug,
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
      } else if (productMode === "DEMO" && defaultCategory) {
        await tx.product.createMany({
          data: [
            {
              title: `[Démo] Produit Vedette — ${store.name}`,
              slug: `${requestedSlug}-demo-1-${ts}`,
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
              slug: `${requestedSlug}-demo-2-${ts}`,
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

      return { store, user };
    });

    await setSessionCookie(created.user.id, created.user.role, created.store.id);

    sendTransactionalNotification({
      storeId: created.store.id,
      channel: "EMAIL",
      recipient: created.user.email,
      subject: `Bienvenue sur COMMERCIA / Albedo'o SaaS — ${created.store.name}`,
      message: `Votre boutique est en ligne sur /s/${created.store.slug}. Gérez vos produits depuis /vendeur.`,
    }).catch(() => {});

    return NextResponse.json(
      {
        store: {
          id: created.store.id,
          name: created.store.name,
          slug: created.store.slug,
          plan: created.store.plan,
          status: created.store.status,
          city: created.store.city,
        },
        user: {
          id: created.user.id,
          name: created.user.name,
          email: created.user.email,
          role: created.user.role,
          storeId: created.store.id,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const code = (error as { code?: string })?.code;
    if (code === "P2002") {
      return NextResponse.json(
        { error: "Cette adresse de boutique ou cet email vient d'être réservé. Veuillez réessayer." },
        { status: 409 }
      );
    }
    console.error("Create store error:", error);
    return NextResponse.json({ error: "Erreur lors de la création de la boutique SaaS." }, { status: 500 });
  }
}
