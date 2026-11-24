import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { SAAS_PLANS, provisionStoreFromSubscription } from "@/lib/saas-provisioning";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    const draft = await prisma.storeDraft.findFirst({
      where: { userId: user.id, status: { in: ["DRAFT", "PENDING_PAYMENT"] } },
      orderBy: { updatedAt: "desc" },
    });
    if (!draft) {
      return NextResponse.json({ error: "Aucun brouillon de boutique trouvé." }, { status: 404 });
    }
    const draftData = JSON.parse(draft.dataJson);
    const planKey = (draft.plan in SAAS_PLANS ? draft.plan : "PRO") as keyof typeof SAAS_PLANS;
    return NextResponse.json({
      draft: { id: draft.id, status: draft.status, data: draftData },
      pricing: SAAS_PLANS[planKey],
      planKey,
    });
  }

  const subscription = await prisma.subscription.findUnique({
    where: { id },
    include: {
      store: { select: { id: true, name: true, slug: true, status: true } },
      payments: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!subscription) {
    return NextResponse.json({ error: "Souscription introuvable." }, { status: 404 });
  }

  const isAdmin = ["ADMIN", "EXECUTIVE", "SUPER_ADMIN"].includes(user.role);
  if (subscription.userId !== user.id && !isAdmin) {
    return NextResponse.json({ error: "Accès refusé à cette souscription." }, { status: 403 });
  }

  const draft = subscription.draftId
    ? await prisma.storeDraft.findUnique({ where: { id: subscription.draftId } })
    : null;

  const planKey = (subscription.plan in SAAS_PLANS ? subscription.plan : "STARTER") as keyof typeof SAAS_PLANS;

  return NextResponse.json({
    subscription,
    planDetails: SAAS_PLANS[planKey],
    draft: draft ? { id: draft.id, storeName: draft.storeName, slug: draft.slug, data: JSON.parse(draft.dataJson) } : null,
  });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }

    const body = await req.json();
    const { draftId, activateIfFree } = body as { draftId?: string; activateIfFree?: boolean };

    const draft = draftId
      ? await prisma.storeDraft.findUnique({ where: { id: draftId } })
      : await prisma.storeDraft.findFirst({
          where: { userId: user.id, status: { in: ["DRAFT", "PENDING_PAYMENT"] } },
          orderBy: { updatedAt: "desc" },
        });

    if (!draft || draft.userId !== user.id) {
      return NextResponse.json({ error: "Brouillon de boutique introuvable." }, { status: 404 });
    }

    const draftData = JSON.parse(draft.dataJson) as { plan?: string; storeName?: string; customSlug?: string };
    const planKey = (
      draftData.plan && draftData.plan in SAAS_PLANS
        ? draftData.plan
        : draft.plan in SAAS_PLANS
        ? draft.plan
        : "PRO"
    ) as keyof typeof SAAS_PLANS;

    // Server strictly determines official price — never from client
    const officialPlan = SAAS_PLANS[planKey];

    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + officialPlan.durationDays);

    // Reuse existing PENDING_PAYMENT subscription for same draft if plan matches
    let subscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        draftId: draft.id,
        status: "PENDING_PAYMENT",
        storeId: null,
      },
      orderBy: { createdAt: "desc" },
    });

    if (subscription) {
      subscription = await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          plan: planKey,
          priceFcfa: officialPlan.priceFcfa,
          currentPeriodEnd: periodEnd,
        },
      });
    } else {
      subscription = await prisma.subscription.create({
        data: {
          userId: user.id,
          draftId: draft.id,
          plan: planKey,
          priceFcfa: officialPlan.priceFcfa,
          currency: "FCFA",
          status: "PENDING_PAYMENT",
          currentPeriodEnd: periodEnd,
        },
      });
    }

    await prisma.storeDraft.update({
      where: { id: draft.id },
      data: { status: "PENDING_PAYMENT" },
    });

    // Only STARTER (0 FCFA) can be provisioned without monetary payment
    if (officialPlan.priceFcfa === 0 && activateIfFree) {
      const provisioned = await provisionStoreFromSubscription(subscription.id, undefined, true);
      return NextResponse.json({
        subscriptionId: subscription.id,
        requiresPayment: false,
        store: provisioned.store,
      });
    }

    return NextResponse.json({
      subscriptionId: subscription.id,
      requiresPayment: officialPlan.priceFcfa > 0,
      amountFcfa: officialPlan.priceFcfa,
      plan: planKey,
    });
  } catch (error) {
    console.error("Create SaaS subscription error:", error);
    return NextResponse.json({ error: "Erreur lors de la création de la souscription." }, { status: 500 });
  }
}
