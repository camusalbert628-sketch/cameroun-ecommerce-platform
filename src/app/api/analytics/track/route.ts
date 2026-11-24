import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventType, storeId, productId } = body as {
      eventType?: string;
      storeId?: string;
      productId?: string;
    };

    if (!eventType || !["PAGE_VIEW", "ADD_TO_CART", "CHECKOUT_STARTED", "ORDER_PAID"].includes(eventType)) {
      return NextResponse.json({ error: "Type d'événement invalide." }, { status: 400 });
    }

    await prisma.analyticsEvent.create({
      data: {
        eventType,
        storeId: storeId || null,
        productId: productId || null,
      },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
