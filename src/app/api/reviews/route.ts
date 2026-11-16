import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, authorName, city, rating, comment } = body as {
      productId: string;
      authorName: string;
      city: string;
      rating: number;
      comment: string;
    };

    if (!productId || !authorName || !comment || !rating) {
      return NextResponse.json({ error: "Tous les champs sont requis." }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        productId,
        authorName: authorName.trim(),
        city: city || "Douala",
        rating: Math.min(5, Math.max(1, Number(rating))),
        comment: comment.trim(),
        verifiedPurchase: true,
      },
    });

    // Recalculate product rating & reviewCount
    const allReviews = await prisma.review.findMany({ where: { productId } });
    const avg =
      allReviews.reduce((s, r) => s + r.rating, 0) / Math.max(1, allReviews.length);

    await prisma.product.update({
      where: { id: productId },
      data: {
        rating: Number(avg.toFixed(1)),
        reviewCount: allReviews.length,
      },
    });

    return NextResponse.json({ review, rating: Number(avg.toFixed(1)), reviewCount: allReviews.length }, { status: 201 });
  } catch (error) {
    console.error("Create review error:", error);
    return NextResponse.json({ error: "Erreur lors de l'enregistrement de l'avis." }, { status: 500 });
  }
}

