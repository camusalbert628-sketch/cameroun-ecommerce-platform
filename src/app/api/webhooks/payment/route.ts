import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || process.env.AUTH_SECRET || "cameroun-ecommerce-dev-secret-2026";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-webhook-signature");

    if (signature) {
      const expected = crypto.createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");
      if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
        return NextResponse.json({ error: "Signature webhook invalide." }, { status: 401 });
      }
    } else if (process.env.NODE_ENV === "production" && process.env.PAYMENT_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Signature manquante." }, { status: 401 });
    }

    const payload = JSON.parse(rawBody) as {
      reference: string;
      status: "SUCCESS" | "FAILED";
      provider?: string;
    };

    if (!payload.reference || !payload.status) {
      return NextResponse.json({ error: "reference et status requis." }, { status: 400 });
    }

    const txRecord = await prisma.paymentTransaction.findUnique({
      where: { reference: payload.reference },
      include: { order: true },
    });

    if (!txRecord) {
      return NextResponse.json({ error: "Transaction introuvable." }, { status: 404 });
    }

    // Idempotency guard
    if (txRecord.status === payload.status) {
      return NextResponse.json({ ok: true, idempotent: true });
    }

    await prisma.$transaction(async (tx) => {
      await tx.paymentTransaction.update({
        where: { id: txRecord.id },
        data: { status: payload.status, rawPayload: rawBody },
      });

      const isSuccess = payload.status === "SUCCESS";
      await tx.order.update({
        where: { id: txRecord.orderId },
        data: {
          paymentStatus: isSuccess ? "PAID" : "FAILED",
          status: isSuccess ? "CONFIRMED" : "PAYMENT_FAILED",
          events: {
            create: {
              stepCode: isSuccess ? "7_PAYMENT_CONFIRMED" : "7_PAYMENT_FAILED",
              label: isSuccess ? "Paiement confirmé via Webhook" : "Paiement refusé via Webhook",
              description: `Référence ${txRecord.reference} (${txRecord.provider}) — Statut : ${payload.status}`,
              actorName: "Passerelle Paiement",
            },
          },
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook payment error:", error);
    return NextResponse.json({ error: "Erreur traitement webhook." }, { status: 500 });
  }
}
