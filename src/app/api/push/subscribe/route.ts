import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const { endpoint, keys, storeId } = body as {
      endpoint?: string;
      keys?: { p256dh?: string; auth?: string };
      storeId?: string;
    };

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: "Abonnement push invalide." }, { status: 400 });
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: {
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userId: user?.id || null,
        storeId: storeId || user?.storeId || null,
      },
      update: {
        p256dh: keys.p256dh,
        auth: keys.auth,
        userId: user?.id || undefined,
        storeId: storeId || user?.storeId || undefined,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Push subscribe error:", error);
    return NextResponse.json({ error: "Erreur enregistrement notifications push." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { endpoint } = body as { endpoint?: string };
    if (endpoint) {
      await prisma.pushSubscription.deleteMany({ where: { endpoint } });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Push unsubscribe error:", error);
    return NextResponse.json({ error: "Erreur désinscription." }, { status: 500 });
  }
}
