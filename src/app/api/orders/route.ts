import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { sendTransactionalNotification } from "@/lib/notifications";

class StockValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StockValidationError";
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderNumber = searchParams.get("orderNumber");
  const status = searchParams.get("status");
  const vendorId = searchParams.get("vendorId");
  const mine = searchParams.get("mine") === "true";

  const where: Record<string, unknown> = {};
  if (orderNumber) {
    where.orderNumber = orderNumber.trim().toUpperCase();
  }
  if (status && status !== "all") {
    where.status = status;
  }
  if (vendorId) {
    where.items = { some: { vendorId } };
  }
  if (mine) {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ orders: [] });
    where.userId = user.id;
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      items: { include: { product: true } },
      events: { orderBy: { createdAt: "asc" } },
      claims: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ orders });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const {
      customerName,
      customerPhone,
      customerEmail,
      city,
      quarter,
      deliveryAddress,
      deliveryMethod,
      paymentMethod,
      zoneId,
      items,
      useLoyaltyPoints,
    } = body as {
      customerName: string;
      customerPhone: string;
      customerEmail?: string;
      city: string;
      quarter: string;
      deliveryAddress: string;
      deliveryMethod: string;
      paymentMethod: string;
      zoneId?: string;
      items: { productId: string; variantId?: string; quantity: number }[];
      useLoyaltyPoints?: boolean;
    };

    if (!customerName || !customerPhone || !city || !quarter || !deliveryAddress || !items?.length) {
      return NextResponse.json(
        { error: "Veuillez remplir toutes les informations de livraison et le panier." },
        { status: 400 }
      );
    }

    const isSimulatedFailure = false;

    // Atomic transaction for stock verification + order creation + decrement
    const result = await prisma.$transaction(async (tx) => {
      let subtotalFcfa = 0;
      let commissionTotalFcfa = 0;
      let hasOnOrder = false;
      const outOfStockAlerts: string[] = [];

      const orderItemsData: {
        productId: string;
        vendorId: string | null;
        variantId: string | null;
        variantLabel: string | null;
        quantity: number;
        unitPriceFcfa: number;
        costPriceFcfa: number;
        commissionFcfa: number;
      }[] = [];

      for (const item of items) {
        const qty = Math.round(Number(item.quantity));
        if (qty <= 0) {
          throw new StockValidationError("La quantité demandée doit être supérieure à 0.");
        }

        const prod = await tx.product.findUnique({
          where: { id: item.productId },
          include: { vendor: true, variants: true },
        });

        if (!prod) {
          throw new StockValidationError("Un des produits sélectionnés est introuvable.");
        }
        if (prod.salesModel === "ON_ORDER") hasOnOrder = true;

        let unitPriceFcfa = prod.priceFcfa;
        let variantId: string | null = null;
        let variantLabel: string | null = null;

        if (item.variantId) {
          const variant = prod.variants.find((v) => v.id === item.variantId);
          if (!variant) {
            throw new StockValidationError(`Variante introuvable pour ${prod.title}.`);
          }
          if (variant.stock <= 0) {
            throw new StockValidationError(
              `Vente impossible : cette variante (${variant.label}) est actuellement en rupture de stock. Quantité disponible : 0.`
            );
          }
          if (qty > variant.stock) {
            throw new StockValidationError(
              `Quantité insuffisante pour ${prod.title} (${variant.label}) : vous essayez de vendre ${qty} unités alors que seulement ${variant.stock} sont disponibles en stock. Veuillez corriger la quantité demandée.`
            );
          }

          unitPriceFcfa = variant.priceFcfa;
          variantId = variant.id;
          variantLabel = variant.label;

          if (!isSimulatedFailure) {
            const newVariantStock = variant.stock - qty;
            await tx.productVariant.update({
              where: { id: variant.id },
              data: { stock: newVariantStock },
            });
            if (newVariantStock === 0) {
              outOfStockAlerts.push(`Variante épuisée : ${variant.label} (${prod.title})`);
            }
          }
        } else {
          if (prod.stock <= 0) {
            throw new StockValidationError(
              `Vente impossible : le produit « ${prod.title} » est actuellement en rupture de stock. Quantité disponible : 0.`
            );
          }
          if (qty > prod.stock) {
            throw new StockValidationError(
              `Quantité insuffisante pour « ${prod.title} » : vous essayez de vendre ${qty} unités alors que seulement ${prod.stock} sont disponibles en stock. Veuillez corriger la quantité demandée.`
            );
          }

          if (!isSimulatedFailure) {
            const newProdStock = prod.stock - qty;
            await tx.product.update({
              where: { id: prod.id },
              data: { stock: newProdStock },
            });
            if (newProdStock === 0) {
              outOfStockAlerts.push(`Produit épuisé : ${prod.title}`);
            }
          }
        }

        const lineTotal = unitPriceFcfa * qty;
        subtotalFcfa += lineTotal;

        const rate = prod.vendor?.commissionRate ?? 0;
        const commission = prod.vendorId ? Math.round(lineTotal * rate) : 0;
        commissionTotalFcfa += commission;

        orderItemsData.push({
          productId: prod.id,
          vendorId: prod.vendorId,
          variantId,
          variantLabel,
          quantity: qty,
          unitPriceFcfa,
          costPriceFcfa: prod.costPriceFcfa,
          commissionFcfa: commission,
        });
      }

      // Delivery fee lookup
      let deliveryFeeFcfa = 2000;
      let zone = null;
      if (zoneId) {
        zone = await tx.deliveryZone.findUnique({ where: { id: zoneId } });
      }
      if (!zone) {
        zone = await tx.deliveryZone.findFirst({ where: { city } });
      }
      if (deliveryMethod === "STORE_PICKUP") {
        deliveryFeeFcfa = 0;
      } else if (deliveryMethod === "RELAY_POINT") {
        deliveryFeeFcfa = zone ? Math.max(500, Math.round(zone.feeFcfa * 0.6)) : 1000;
      } else if (zone) {
        deliveryFeeFcfa = zone.feeFcfa;
      }

      // Conditional Cash on Delivery check (Chapitre 15)
      if (paymentMethod === "CASH_ON_DELIVERY") {
        if (hasOnOrder) {
          throw new StockValidationError(
            "Le paiement à la livraison n'est pas disponible pour les produits Sur Commande."
          );
        }
        if (zone && !zone.supportsCod) {
          throw new StockValidationError(
            `Le paiement à la livraison n'est pas encore disponible pour ${city}. Veuillez utiliser Orange Money, MTN MoMo ou Carte Bancaire.`
          );
        }
        if (subtotalFcfa > (zone?.codMaxFcfa ?? 150000)) {
          throw new StockValidationError(
            `Le paiement à la livraison est plafonné à ${(zone?.codMaxFcfa ?? 150000).toLocaleString("fr-FR")} FCFA.`
          );
        }
      }

      let discountFcfa = 0;
      if (useLoyaltyPoints && user && user.loyaltyPoints >= 100) {
        discountFcfa = Math.min(Math.floor(user.loyaltyPoints / 100) * 1000, Math.round(subtotalFcfa * 0.1));
      }

      const totalFcfa = Math.max(0, subtotalFcfa + deliveryFeeFcfa - discountFcfa);

      let paymentStatus = "PENDING";
      let status = "CONFIRMED";
      let paymentReference: string | null = null;

      if (paymentMethod === "CASH_ON_DELIVERY") {
        paymentStatus = "PENDING";
        status = "CONFIRMED";
      } else if (isSimulatedFailure) {
        paymentStatus = "FAILED";
        status = "PAYMENT_FAILED";
        paymentReference = `ERR-${Date.now().toString().slice(-6)}`;
      } else {
        paymentStatus = "PAID";
        status = "CONFIRMED";
        const prefix =
          paymentMethod === "ORANGE_MONEY"
            ? "OM-CM"
            : paymentMethod === "MTN_MOMO"
            ? "MOMO-CM"
            : "CB-3DS";
        paymentReference = `${prefix}-${Date.now().toString().slice(-8)}`;
      }

      const orderNumber = `CMD-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: user?.id ?? null,
          customerName,
          customerPhone,
          customerEmail: customerEmail || null,
          city,
          quarter,
          deliveryAddress,
          deliveryMethod,
          paymentMethod,
          paymentStatus,
          paymentReference,
          status,
          subtotalFcfa,
          deliveryFeeFcfa,
          discountFcfa,
          totalFcfa,
          commissionTotalFcfa,
          items: { create: orderItemsData },
          events: {
            create: [
              {
                stepCode: isSimulatedFailure ? "7_PAYMENT_FAILED" : "7_ORDER_RECEIVED",
                label: isSimulatedFailure ? "Paiement échoué" : "Commande confirmée",
                description: isSimulatedFailure
                  ? `Échec d'autorisation ${paymentMethod}. Relance client requise (Chapitre 12).`
                  : paymentMethod === "CASH_ON_DELIVERY"
                  ? "Commande validée en Paiement à la Livraison (sous conditions)."
                  : `Paiement ${paymentMethod} confirmé (${paymentReference}).`,
                actorName: "Système Commandes",
              },
            ],
          },
        },
        include: {
          items: { include: { product: true } },
          events: true,
        },
      });

      await tx.paymentTransaction.create({
        data: {
          orderId: order.id,
          provider: paymentMethod,
          reference: paymentReference || `COD-${order.orderNumber}`,
          amountFcfa: totalFcfa,
          status: paymentStatus === "PAID" ? "SUCCESS" : "PENDING",
        },
      });

      await tx.analyticsEvent.create({
        data: {
          eventType: "ORDER_PAID",
          storeId: order.storeId,
        },
      });

      if (!isSimulatedFailure && user) {
        const earned = Math.floor(totalFcfa / 1000);
        const spent = discountFcfa > 0 ? Math.floor(discountFcfa / 1000) * 100 : 0;
        await tx.user.update({
          where: { id: user.id },
          data: { loyaltyPoints: Math.max(0, user.loyaltyPoints - spent + earned) },
        });
      }

      return { order, outOfStockAlerts };
    });

    // Dispatch automated transactional notifications (non-blocking)
    sendTransactionalNotification({
      storeId: result.order.storeId,
      orderId: result.order.id,
      channel: "WHATSAPP",
      recipient: result.order.customerPhone,
      subject: `Confirmation Commande ${result.order.orderNumber}`,
      message: `Bonjour ${result.order.customerName}, votre commande de ${result.order.totalFcfa.toLocaleString("fr-FR")} FCFA est confirmée pour ${result.order.city}.`,
    }).catch(() => {});

    if (result.order.customerEmail) {
      sendTransactionalNotification({
        storeId: result.order.storeId,
        orderId: result.order.id,
        channel: "EMAIL",
        recipient: result.order.customerEmail,
        subject: `Facture & Suivi ${result.order.orderNumber}`,
        message: `Merci pour votre commande sur Albedo'o. Suivez vos 13 étapes sur /suivi?order=${result.order.orderNumber}.`,
      }).catch(() => {});
    }

    if (result.outOfStockAlerts.length > 0) {
      sendTransactionalNotification({
        storeId: result.order.storeId,
        orderId: result.order.id,
        channel: "WHATSAPP",
        recipient: "Responsable Stock",
        subject: "Alerte Rupture de Stock",
        message: result.outOfStockAlerts.join(" | "),
      }).catch(() => {});
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof StockValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Create order error:", error);
    return NextResponse.json({ error: "Erreur lors de la création de la commande." }, { status: 500 });
  }
}
