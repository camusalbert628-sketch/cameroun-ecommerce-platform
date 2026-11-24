import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { initiatePayment } from "@/lib/payments";

const ALLOWED_METHODS = ["ORANGE_MONEY", "MTN_MOMO", "VISA", "MASTERCARD", "BANK_TRANSFER"] as const;

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }

  const subscriptionId = req.nextUrl.searchParams.get("subscriptionId");
  if (!subscriptionId) {
    return NextResponse.json({ error: "subscriptionId requis." }, { status: 400 });
  }

  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: {
      store: { select: { id: true, name: true, slug: true, status: true } },
      payments: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!sub) return NextResponse.json({ error: "Souscription introuvable." }, { status: 404 });
  if (sub.userId !== user.id && !["ADMIN", "EXECUTIVE", "SUPER_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const notchConfigured = Boolean(process.env.NOTCHPAY_PUBLIC_KEY);
  const cinetConfigured = Boolean(process.env.CINETPAY_API_KEY && process.env.CINETPAY_SITE_ID);

  return NextResponse.json({
    subscription: sub,
    providers: {
      mobileMoneyConfigured: notchConfigured || cinetConfigured,
      cardConfigured: notchConfigured || cinetConfigured,
      bankTransferConfigured: true,
      gatewayName: notchConfigured ? "NotchPay" : cinetConfigured ? "CinetPay" : null,
      bankDetails: {
        bankName: process.env.BANK_NAME || "Afriland First Bank Cameroun",
        beneficiary: process.env.BANK_BENEFICIARY || "COMMERCIA / ALBEDO'O SARL",
        accountNumber: process.env.BANK_ACCOUNT || "10005-00012-08492011001-44",
        swift: process.env.BANK_SWIFT || "ACBCCMCX",
      },
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }

    const body = await req.json();
    const { subscriptionId, method, phone, proofUrl } = body as {
      subscriptionId?: string;
      method?: string;
      phone?: string;
      proofUrl?: string;
    };

    if (!subscriptionId || !method || !ALLOWED_METHODS.includes(method as (typeof ALLOWED_METHODS)[number])) {
      return NextResponse.json({ error: "Souscription ou moyen de paiement invalide." }, { status: 400 });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { store: true },
    });

    if (!subscription || subscription.userId !== user.id) {
      return NextResponse.json({ error: "Souscription introuvable ou non autorisée." }, { status: 403 });
    }

    if (subscription.storeId) {
      return NextResponse.json({
        alreadyProvisioned: true,
        store: subscription.store,
      });
    }

    const reference = `SAAS-${subscription.plan}-${Date.now().toString().slice(-8)}`;

    if (method === "BANK_TRANSFER") {
      if (!proofUrl?.trim()) {
        return NextResponse.json(
          { error: "Veuillez téléverser votre justificatif de virement bancaire." },
          { status: 400 }
        );
      }

      const payment = await prisma.saaSPayment.create({
        data: {
          subscriptionId: subscription.id,
          userId: user.id,
          method: "BANK_TRANSFER",
          provider: "BANK_TRANSFER",
          reference,
          amountFcfa: subscription.priceFcfa,
          currency: subscription.currency,
          status: "MANUAL_REVIEW",
          proofUrl: proofUrl.trim(),
        },
      });

      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          actorRole: user.role,
          action: "BANK_TRANSFER_PROOF_SUBMITTED",
          targetType: "SaaSPayment",
          targetId: payment.id,
          details: `Justificatif soumis pour souscription ${subscription.id} (${subscription.priceFcfa} FCFA)`,
        },
      });

      return NextResponse.json({ payment, status: "MANUAL_REVIEW" }, { status: 201 });
    }

    const notchConfigured = Boolean(process.env.NOTCHPAY_PUBLIC_KEY);
    const cinetConfigured = Boolean(process.env.CINETPAY_API_KEY && process.env.CINETPAY_SITE_ID);

    if (!notchConfigured && !cinetConfigured) {
      return NextResponse.json(
        {
          error:
            "La passerelle de paiement en ligne (NotchPay / CinetPay) n'est pas encore configurée sur le serveur. Utilisez le Virement Bancaire ou configurez NOTCHPAY_PUBLIC_KEY / CINETPAY_API_KEY.",
          missingEnvVars: ["NOTCHPAY_PUBLIC_KEY", "CINETPAY_API_KEY", "CINETPAY_SITE_ID"],
        },
        { status: 503 }
      );
    }

    const payment = await prisma.saaSPayment.create({
      data: {
        subscriptionId: subscription.id,
        userId: user.id,
        method,
        provider: notchConfigured ? "NOTCHPAY" : "CINETPAY",
        reference,
        amountFcfa: subscription.priceFcfa,
        currency: subscription.currency,
        status: "PENDING",
      },
    });

    const origin = req.nextUrl.origin;
    const mappedMethod =
      method === "VISA" || method === "MASTERCARD" ? "CARD_VISA_MC" : method;

    const init = await initiatePayment({
      reference,
      amountFcfa: subscription.priceFcfa,
      customerName: user.name,
      customerEmail: user.email,
      customerPhone: phone?.trim() || user.phone || "+237600000000",
      description: `Abonnement SaaS ${subscription.plan} — COMMERCIA`,
      paymentMethod: mappedMethod,
      callbackUrl: `${origin}/api/webhooks/payment`,
      returnUrl: `${origin}/boutique/paiement/${subscription.id}?ref=${encodeURIComponent(reference)}`,
    });

    await prisma.saaSPayment.update({
      where: { id: payment.id },
      data: {
        status: "PROCESSING",
        providerTxId: init.providerReference || null,
      },
    });

    return NextResponse.json({
      paymentId: payment.id,
      reference,
      authorizationUrl: init.authorizationUrl,
      providerMode: init.providerMode,
    });
  } catch (error) {
    console.error("SaaS payment initiate error:", error);
    return NextResponse.json({ error: "Erreur lors de l'initialisation du paiement." }, { status: 500 });
  }
}
