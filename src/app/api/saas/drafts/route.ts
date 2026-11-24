import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }

  const draft = await prisma.storeDraft.findFirst({
    where: { userId: user.id, status: { in: ["DRAFT", "PENDING_PAYMENT"] } },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({
    draft: draft
      ? {
          id: draft.id,
          status: draft.status,
          updatedAt: draft.updatedAt,
          data: JSON.parse(draft.dataJson),
        }
      : null,
  });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }
    if (user.accountStatus !== "APPROVED") {
      return NextResponse.json(
        { error: "Votre compte est en attente d'approbation par un administrateur avant de pouvoir créer une boutique." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { storeName, customSlug, plan, data } = body as {
      storeName?: string;
      customSlug?: string;
      plan?: string;
      data?: Record<string, unknown>;
    };

    if (!data || typeof data !== "object") {
      return NextResponse.json({ error: "Données de brouillon invalides." }, { status: 400 });
    }

    const existing = await prisma.storeDraft.findFirst({
      where: { userId: user.id, status: { in: ["DRAFT", "PENDING_PAYMENT"] } },
      orderBy: { updatedAt: "desc" },
    });

    const draft = existing
      ? await prisma.storeDraft.update({
          where: { id: existing.id },
          data: {
            storeName: storeName?.trim() || existing.storeName,
            slug: customSlug?.trim() || existing.slug,
            plan: plan || existing.plan,
            dataJson: JSON.stringify(data),
          },
        })
      : await prisma.storeDraft.create({
          data: {
            userId: user.id,
            storeName: storeName?.trim() || null,
            slug: customSlug?.trim() || null,
            plan: plan || "PRO",
            dataJson: JSON.stringify(data),
            status: "DRAFT",
          },
        });

    return NextResponse.json({ draftId: draft.id, updatedAt: draft.updatedAt });
  } catch (error) {
    console.error("Save draft error:", error);
    return NextResponse.json({ error: "Erreur sauvegarde brouillon." }, { status: 500 });
  }
}
