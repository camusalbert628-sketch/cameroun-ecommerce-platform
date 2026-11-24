import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/payments";
import { sendTransactionalNotification } from "@/lib/notifications";

const WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || process.env.AUTH_SECRET || "cameroun-ecommerce-dev-secret-2026";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-webhook-signature");
    const notchSig = req.headers.get("x-notch-signature");

    if (notchSig && process.env.NOTCHPAY_HASH) {
      const expectedNotch = crypto.createHmac("sha256", process.env.NOTCHPAY_HASH).update(rawBody).digest("hex");
      if (notchSig !== expectedNotch) {
        return NextResponse.json({ error: "Signature NotchPay invalide." }, { status: 401 });
      }
    } else if (signature) {
      if (!verifyWebhookSignature(rawBody, signature, WEBHOOK_SECRET)) {
        return NextResponse.json({ error: "Signature webhook invalide." }, { status: 401 });
      }
    } else if (process.env.NODE_ENV === "production" && process.env.PAYMENT_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Signature manquante." }, { status: 401 });
    }

    const parsed = JSON.parse(rawBody) as {
      reference?: string;
      status?: "SUCCESS" | "FAILED" | string;
      event?: string;
      data?: { reference?: string; merchant_reference?: string; status?: string };
      cpm_trans_id?: string;
      cpm_result?: string;
    };

    const reference =
      parsed.reference ||
      parsed.data?.merchant_reference ||
      parsed.data?.reference ||
      parsed.cpm_trans_id;

    let normalizedStatus: "SUCCESS" | "FAILED" | null = null;
    if (parsed.status === "SUCCESS" || parsed.event === "payment.complete" || parsed.data?.status === "complete" || parsed.cpm_result === "00") {
      normalizedStatus = "SUCCESS";
    } else if (parsed.status === "FAILED" || parsed.event === "payment.failed" || parsed.data?.status === "failed" || (parsed.cpm_result && parsed.cpm_result !== "00")) {
      normalizedStatus = "FAILED";
    }

    if (!reference || !normalizedStatus) {
      return NextResponse.json({ error: "reference et status requis." }, { status: 400 });
    }

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
