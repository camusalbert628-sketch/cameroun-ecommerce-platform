import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { provisionStoreFromSubscription } from "@/lib/saas-provisioning";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
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

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentification obligatoire." }, { status: 401 });
    }
    if (user.accountStatus !== "APPROVED") {
      return NextResponse.json(
        { error: "Compte non approuvé : un administrateur doit valider votre compte avant toute création de boutique." },
        { status: 403 }
      );
    }

    const ip = getClientIp(req.headers);
    const rl = checkRateLimit(`stores:create:${ip}`, 6, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Trop de créations depuis cette adresse. Réessayez dans ${rl.retryAfterSec}s.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { subscriptionId } = body as { subscriptionId?: string };

    if (!subscriptionId) {
      return NextResponse.json(
        {
          error:
            "Création directe bloquée : veuillez finaliser votre configuration, souscrire et confirmer le paiement avant le provisionnement.",
        },
        { status: 402 }
      );
    }

    const subscription = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
    if (!subscription || (subscription.userId !== user.id && !["ADMIN", "SUPER_ADMIN"].includes(user.role))) {
      return NextResponse.json({ error: "Souscription introuvable ou non autorisée." }, { status: 403 });
    }

    const provisioned = await provisionStoreFromSubscription(subscription.id, user.id, true);
    return NextResponse.json({ store: provisioned.store }, { status: provisioned.alreadyProvisioned ? 200 : 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur lors du provisionnement.";
    if (message.startsWith("PAIEMENT_REQUIS")) {
      return NextResponse.json({ error: message }, { status: 402 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
