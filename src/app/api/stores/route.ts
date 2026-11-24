import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";

const PLAN_PRICES: Record<string, { priceFcfa: number; commissionRate: number }> = {
  STARTER: { priceFcfa: 0, commissionRate: 0.05 },
  PRO: { priceFcfa: 15000, commissionRate: 0.02 },
  BUSINESS: { priceFcfa: 45000, commissionRate: 0.0 },
};

export async function GET() {
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
    const body = await req.json();
    const {
      ownerName,
      email,
      password,
      phone,
      storeName,
      tagline,
      city,
      primaryColor,
      plan,
      rccm,
    } = body as {
      ownerName?: string;
      email?: string;
      password?: string;
      phone?: string;
      storeName?: string;
      tagline?: string;
      city?: string;
      primaryColor?: string;
      plan?: string;
      rccm?: string;
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

    const slugBase = storeName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const slug = `${slugBase || "boutique"}-${Date.now().toString().slice(-4)}`;

    const selectedPlan = plan && PLAN_PRICES[plan] ? plan : "STARTER";
    const planConfig = PLAN_PRICES[selectedPlan];
    const passwordHash = await bcrypt.hash(password, 10);
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);

    const created = await prisma.$transaction(async (tx) => {
      const store = await tx.store.create({
        data: {
          name: storeName.trim(),
          slug,
          tagline: tagline?.trim() || `Boutique officielle ${storeName.trim()} au Cameroun`,
          primaryColor: primaryColor || "#0B192C",
          accentColor: "#F97316",
          plan: selectedPlan,
          status: "ACTIVE",
          city: city || "Douala",
          rccm: rccm?.trim() || null,
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

      await tx.vendorProfile.create({
        data: {
          userId: user.id,
          companyName: store.name,
          rccm: rccm?.trim() || null,
          city: city || "Douala",
          status: "APPROVED",
          commissionRate: planConfig.commissionRate,
          verifiedBadge: true,
        },
      });

      return { store, user };
    });

    await setSessionCookie(created.user.id, created.user.role, created.store.id);

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
