import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { sendTransactionalNotification } from "@/lib/notifications";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !["ADMIN", "LOGISTICS", "VENDOR", "CLIENT"].includes(user.role)) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const { status, assignedCourier, qcCheckedBy, trackingNotes, paymentStatus, eventLabel, eventDescription } = body;

    const data: Record<string, unknown> = {};
    if (status) data.status = status;
    if (assignedCourier !== undefined) data.assignedCourier = assignedCourier;
    if (qcCheckedBy !== undefined) data.qcCheckedBy = qcCheckedBy;
    if (trackingNotes !== undefined) data.trackingNotes = trackingNotes;
    if (paymentStatus) data.paymentStatus = paymentStatus;

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...data,
        events: eventLabel
          ? {
              create: {
                stepCode: status || "UPDATE",
                label: eventLabel,
                description: eventDescription || `Statut mis à jour vers ${status}`,
                actorName: `${user.name} (${user.role})`,
              },
            }
          : undefined,
      },
      include: {
        items: { include: { product: true } },
        events: { orderBy: { createdAt: "asc" } },
      },
    });

    if (status && eventLabel) {
      sendTransactionalNotification({
        storeId: order.storeId,
        orderId: order.id,
        channel: "WHATSAPP",
        recipient: order.customerPhone,
        subject: `Mise à jour ${order.orderNumber} : ${eventLabel}`,
        message: eventDescription || `Votre commande est désormais au statut : ${status}.`,
      }).catch(() => {});
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Update order error:", error);
    return NextResponse.json({ error: "Erreur de mise à jour commande." }, { status: 500 });
  }
}

