import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }

  const isStaff = ["ADMIN", "LOGISTICS", "EXECUTIVE", "SUPER_ADMIN"].includes(user.role);
  const where = isStaff
    ? {}
    : user.role === "VENDOR" && user.storeId
    ? { order: { storeId: user.storeId } }
    : { userId: user.id };

  const claims = await prisma.claim.findMany({
    where,
    include: {
      order: { select: { orderNumber: true, customerName: true, totalFcfa: true, city: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ claims });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const { orderNumber, type, reason } = body as {
      orderNumber: string;
      type: string;
      reason: string;
    };

    if (!orderNumber || !type || !reason) {
      return NextResponse.json({ error: "Numéro de commande, type et motif requis." }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber: orderNumber.trim().toUpperCase() },
    });

    if (!order) {
      return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
    }

    const ticketNumber = `SAV-2026-${Math.floor(100 + Math.random() * 900)}`;
    const claim = await prisma.claim.create({
      data: {
        ticketNumber,
        orderId: order.id,
        userId: user?.id ?? null,
        type,
        status: "OPEN",
        reason,
        refundAmountFcfa: type === "RETURN" || type === "REFUND" ? order.totalFcfa : 0,
      },
      include: {
        order: { select: { orderNumber: true, customerName: true, totalFcfa: true, city: true } },
      },
    });

    if (type === "RETURN") {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "RETURN_REQUESTED",
          events: {
            create: {
              stepCode: "13_RETURN_REQUESTED",
              label: "Demande de retour ouverte",
              description: `Ticket ${ticketNumber} : ${reason}`,
              actorName: order.customerName,
            },
          },
        },
      });
    }

    return NextResponse.json({ claim }, { status: 201 });
  } catch (error) {
    console.error("Claim error:", error);
    return NextResponse.json({ error: "Erreur lors de la création de la réclamation." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["ADMIN", "LOGISTICS"].includes(user.role)) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
    }

    const body = await req.json();
    const { id, status, resolutionNote } = body as {
      id: string;
      status: string;
      resolutionNote?: string;
    };

    const claim = await prisma.claim.update({
      where: { id },
      data: { status, resolutionNote },
      include: { order: true },
    });

    if (status === "RESOLVED" && (claim.type === "RETURN" || claim.type === "REFUND")) {
      await prisma.order.update({
        where: { id: claim.orderId },
        data: {
          status: "REFUNDED",
          paymentStatus: "REFUNDED",
          events: {
            create: {
              stepCode: "13_REFUNDED",
              label: "Remboursement effectué",
              description: resolutionNote || `Ticket ${claim.ticketNumber} clôturé avec remboursement.`,
              actorName: user.name,
            },
          },
        },
      });
    }

    return NextResponse.json({ claim });
  } catch (error) {
    console.error("Update claim error:", error);
    return NextResponse.json({ error: "Erreur de mise à jour SAV." }, { status: 500 });
  }
}

