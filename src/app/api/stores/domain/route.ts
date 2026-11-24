import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.storeId) {
      return NextResponse.json({ error: "Authentification boutique requise." }, { status: 403 });
    }

    const store = await prisma.store.findUnique({ where: { id: user.storeId } });
    if (!store) {
      return NextResponse.json({ error: "Boutique introuvable." }, { status: 404 });
    }

    if (store.plan === "STARTER") {
      return NextResponse.json(
        { error: "Les domaines personnalisés sont réservés aux plans Pro et Business." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { customDomain } = body as { customDomain?: string };

    const cleanDomain = customDomain
      ? customDomain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "")
      : null;

    const updated = await prisma.store.update({
      where: { id: store.id },
      data: { customDomain: cleanDomain },
    });

    return NextResponse.json({ store: updated });
  } catch (error) {
    console.error("Update customDomain error:", error);
    return NextResponse.json({ error: "Ce domaine est déjà utilisé ou invalide." }, { status: 400 });
  }
}
