import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sendTransactionalNotification } from "@/lib/notifications";

const PLAN_PRICES: Record<string, { priceFcfa: number; commissionRate: number }> = {
  STARTER: { priceFcfa: 0, commissionRate: 0.05 },
  PRO: { priceFcfa: 15000, commissionRate: 0.02 },
  BUSINESS: { priceFcfa: 45000, commissionRate: 0.0 },
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET(req: NextRequest) {
  const checkSlug = req.nextUrl.searchParams.get("checkSlug");
  if (checkSlug !== null) {
    const clean = slugify(checkSlug);
    if (clean.length < 3) {
      return NextResponse.json({ available: false, slug: clean, reason: "Minimum 3 caractères." });
    }
    const existing = await prisma.store.findUnique({ where: { slug: clean }, select: { id: true } });
    return NextResponse.json({ available: !existing, slug: clean });
  }

  const stores = await prisma.store.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      slug: true,
      tagline: true,
      logoUrl: true,
      primaryColor: true,
      accentColor: true,
      plan: true,
      city: true,
      _count: { select: { products: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ stores });
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const rl = checkRateLimit(`stores:create:${ip}`, 5, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Trop de créations depuis cette adresse. Réessayez dans ${rl.retryAfterSec}s.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const {
      ownerName,
      email,
      password,
      phone,
      storeName,
      customSlug,
      tagline,
      city,
      primaryColor,
      accentColor,
      plan,
      rccm,
      niu,
      seedSampleProducts = true,
    } = body as {
      ownerName?: string;
      email?: string;
      password?: string;
      phone?: string;
      storeName?: string;
      customSlug?: string;
      tagline?: string;
      city?: string;
      primaryColor?: string;
      accentColor?: string;
      plan?: string;
      rccm?: string;
      niu?: string;
      seedSampleProducts?: boolean;
    };

    if (!ownerName?.trim() || !email?.trim() || !password || password.length < 6 || !storeName?.trim()) {
      return NextResponse.json(
        { error: "Tous les champs obligatoires doivent être renseignés (mot de passe ≥ 6 caractères)." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return NextResponse.json({ error: "Un compte utilise déjà cet email." }, { status: 409 });
    }

    const baseSlug = slugify(customSlug?.trim() || storeName) || "boutique";
    const slugTaken = await prisma.store.findUnique({ where: { slug: baseSlug }, select: { id: true } });
    const slug = slugTaken ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;

    const selectedPlan = plan && PLAN_PRICES[plan] ? plan : "STARTER";
    const planConfig = PLAN_PRICES[selectedPlan];
    const passwordHash = await bcrypt.hash(password, 10);
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);

    const defaultCategory = seedSampleProducts
      ? await prisma.category.findFirst({ orderBy: { sortOrder: "asc" } })
      : null;

    const created = await prisma.$transaction(async (tx) => {
      const store = await tx.store.create({
        data: {
          name: storeName.trim(),
          slug,
          tagline: tagline?.trim() || `Boutique officielle ${storeName.trim()} au Cameroun`,
          primaryColor: primaryColor || "#0B192C",
          accentColor: accentColor || "#F97316",
          plan: selectedPlan,
          status: "ACTIVE",
          city: city || "Douala",
          rccm: rccm?.trim() || null,
          niu: niu?.trim() || null,
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
          phone: phone?.trim() || null,
          city: city || "Douala",
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
          city: city || "Douala",
          status: "APPROVED",
          commissionRate: planConfig.commissionRate,
          verifiedBadge: true,
        },
      });

      if (seedSampleProducts && defaultCategory) {
        const ts = Date.now().toString().slice(-5);
        await tx.product.createMany({
          data: [
            {
              title: `Produit Vedette — ${store.name}`,
              slug: `${slug}-produit-vedette-${ts}`,
              description: `Article de démonstration prêt à être personnalisé depuis votre espace vendeur.`,
              sku: `SKU-${ts}-1`,
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
              title: `Offre Découverte — ${store.name}`,
              slug: `${slug}-offre-decouverte-${ts}`,
              description: `Second article exemple. Modifiez le titre, le prix FCFA et la photo dans /vendeur.`,
              sku: `SKU-${ts}-2`,
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
      subject: `Bienvenue sur Albedo'o SaaS — ${created.store.name}`,
      message: `Votre boutique est en ligne sur /s/${created.store.slug}. Gérez vos produits depuis /vendeur.`,
    }).catch(() => {});

    return NextResponse.json(
      {
        store: created.store,
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
  } catch (error) {
    console.error("Create store error:", error);
    return NextResponse.json({ error: "Erreur lors de la création de la boutique SaaS." }, { status: 500 });
  }
}
