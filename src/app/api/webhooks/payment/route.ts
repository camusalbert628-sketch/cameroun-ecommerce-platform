import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/payments";
import { sendTransactionalNotification } from "@/lib/notifications";
import { provisionStoreFromSubscription } from "@/lib/saas-provisioning";

const WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || process.env.AUTH_SECRET || "cameroun-ecommerce-dev-secret-2026";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-webhook-signature");
    const notchSig = req.headers.get("x-notch-signature");

    let signatureValid = false;
    let detectedProvider = "GENERIC";

    if (notchSig && process.env.NOTCHPAY_HASH) {
      detectedProvider = "NOTCHPAY";
      const expectedNotch = crypto.createHmac("sha256", process.env.NOTCHPAY_HASH).update(rawBody).digest("hex");
      signatureValid = notchSig === expectedNotch;
      if (!signatureValid) {
        await prisma.paymentWebhookEvent.create({
          data: { provider: detectedProvider, eventType: "INVALID_SIGNATURE", signatureValid: false, payload: rawBody },
        }).catch(() => {});
        return NextResponse.json({ error: "Signature NotchPay invalide." }, { status: 401 });
      }
    } else if (signature) {
      signatureValid = verifyWebhookSignature(rawBody, signature, WEBHOOK_SECRET);
      if (!signatureValid) {
        await prisma.paymentWebhookEvent.create({
          data: { provider: detectedProvider, eventType: "INVALID_SIGNATURE", signatureValid: false, payload: rawBody },
        }).catch(() => {});
        return NextResponse.json({ error: "Signature webhook invalide." }, { status: 401 });
      }
    } else if (process.env.NODE_ENV === "production" && (process.env.PAYMENT_WEBHOOK_SECRET || process.env.NOTCHPAY_HASH)) {
      return NextResponse.json({ error: "Signature manquante." }, { status: 401 });
    } else {
      signatureValid = true;
    }

    const parsed = JSON.parse(rawBody) as {
      reference?: string;
      status?: string;
      event?: string;
      amount?: number;
      data?: { reference?: string; merchant_reference?: string; status?: string; amount?: number };
      cpm_trans_id?: string;
      cpm_result?: string;
      cpm_amount?: string;
    };

    const reference =
      parsed.reference ||
      parsed.data?.merchant_reference ||
      parsed.data?.reference ||
      parsed.cpm_trans_id;

    let normalizedStatus: "SUCCESS" | "FAILED" | "CANCELLED" | null = null;
    if (
      parsed.status === "SUCCESS" ||
      parsed.event === "payment.complete" ||
      parsed.data?.status === "complete" ||
      parsed.cpm_result === "00"
    ) {
      normalizedStatus = "SUCCESS";
    } else if (parsed.status === "CANCELLED" || parsed.data?.status === "canceled") {
      normalizedStatus = "CANCELLED";
    } else if (
      parsed.status === "FAILED" ||
      parsed.event === "payment.failed" ||
      parsed.data?.status === "failed" ||
      (parsed.cpm_result && parsed.cpm_result !== "00")
    ) {
      normalizedStatus = "FAILED";
    }

    await prisma.paymentWebhookEvent.create({
      data: {
        provider: detectedProvider,
        eventType: parsed.event || normalizedStatus || "UNKNOWN",
        reference: reference || null,
        signatureValid,
        payload: rawBody,
        processedAt: new Date(),
      },
    }).catch(() => {});

    if (!reference || !normalizedStatus) {
      return NextResponse.json({ error: "reference et status requis." }, { status: 400 });
    }

    // 1. Check if this is a SaaS Subscription payment
    const saasPayment = await prisma.saaSPayment.findUnique({
      where: { reference },
      include: { subscription: true },
    });

    if (saasPayment) {
      if (saasPayment.status === normalizedStatus) {
        return NextResponse.json({ ok: true, idempotent: true });
      }

      const reportedAmount = Number(parsed.amount ?? parsed.data?.amount ?? parsed.cpm_amount ?? saasPayment.amountFcfa);
      if (normalizedStatus === "SUCCESS" && reportedAmount < saasPayment.amountFcfa) {
        await prisma.saaSPayment.update({
          where: { id: saasPayment.id },
          data: { status: "FAILED", rawPayload: rawBody, reviewNote: "Montant inférieur au tarif officiel." },
        });
        return NextResponse.json({ error: "Montant invalide." }, { status: 400 });
      }

      await prisma.saaSPayment.update({
        where: { id: saasPayment.id },
        data: {
          status: normalizedStatus,
          rawPayload: rawBody,
          verifiedAt: normalizedStatus === "SUCCESS" ? new Date() : null,
        },
      });

      if (normalizedStatus === "SUCCESS") {
        await provisionStoreFromSubscription(saasPayment.subscriptionId);
      }

      return NextResponse.json({ ok: true, type: "SAAS_SUBSCRIPTION" });
    }

    // 2. Otherwise handle Store Order PaymentTransaction
    const txRecord = await prisma.paymentTransaction.findUnique({
      where: { reference },
      include: { order: true },
    });

    if (!txRecord) {
      return NextResponse.json({ error: "Transaction introuvable." }, { status: 404 });
    }

    if (txRecord.status === normalizedStatus) {
      return NextResponse.json({ ok: true, idempotent: true });
    }

    await prisma.$transaction(async (tx) => {
      await tx.paymentTransaction.update({
        where: { id: txRecord.id },
        data: { status: normalizedStatus, rawPayload: rawBody },
      });

      const isSuccess = normalizedStatus === "SUCCESS";
      await tx.order.update({
        where: { id: txRecord.orderId },
        data: {
          paymentStatus: isSuccess ? "PAID" : "FAILED",
          status: isSuccess ? "CONFIRMED" : "PAYMENT_FAILED",
          events: {
            create: {
              stepCode: isSuccess ? "7_PAYMENT_CONFIRMED" : "7_PAYMENT_FAILED",
              label: isSuccess ? "Paiement confirmé via Webhook" : "Paiement refusé via Webhook",
              description: `Référence ${txRecord.reference} (${txRecord.provider}) — Statut : ${normalizedStatus}`,
              actorName: "Passerelle Paiement",
            },
          },
        },
      });
    });

    if (normalizedStatus === "SUCCESS") {
      await sendTransactionalNotification({
        storeId: txRecord.order.storeId,
        orderId: txRecord.orderId,
        channel: txRecord.order.customerEmail ? "EMAIL" : "WHATSAPP",
        recipient: txRecord.order.customerEmail || txRecord.order.customerPhone,
        subject: `Paiement confirmé — Commande ${txRecord.order.orderNumber}`,
        message: `Votre paiement de ${txRecord.amountFcfa} FCFA a été confirmé. Suivi : /suivi?order=${txRecord.order.orderNumber}`,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook payment error:", error);
    return NextResponse.json({ error: "Erreur traitement webhook." }, { status: 500 });
  }
}
