import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { initiatePayment } from "@/lib/payments";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderNumber } = body as { orderNumber?: string };

    if (!orderNumber) {
      return NextResponse.json({ error: "orderNumber requis." }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: { transactions: { orderBy: { createdAt: "desc" }, take: 1 } },
    });

    if (!order) {
      return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
    }

    if (order.paymentStatus === "PAID") {
      return NextResponse.json({ alreadyPaid: true, orderNumber: order.orderNumber });
    }

    const reference = order.paymentReference || `PAY-${order.orderNumber}-${Date.now().toString().slice(-4)}`;
    const origin = req.nextUrl.origin;

    const result = await initiatePayment({
      reference,
      amountFcfa: order.totalFcfa,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      description: `Commande Albedo'o ${order.orderNumber}`,
      paymentMethod: order.paymentMethod,
      callbackUrl: `${origin}/api/webhooks/payment`,
      returnUrl: `${origin}/suivi?order=${encodeURIComponent(order.orderNumber)}`,
    });

    return NextResponse.json({
      reference,
      ...result,
    });
  } catch (error) {
    console.error("Initiate payment error:", error);
    return NextResponse.json({ error: "Erreur lors de l'initialisation du paiement." }, { status: 500 });
  }
}
