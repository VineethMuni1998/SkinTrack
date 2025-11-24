import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; productId: string }> }
) {
  try {
    const { id: contextRoutineId, productId: contextProductId } =
      await context.params;

    const routineId =
      contextRoutineId ||
      request.nextUrl.pathname.split("/api/routines/")[1]?.split("/")[0];
    const productId =
      contextProductId ||
      request.nextUrl.pathname
        .split("/api/routines/")[1]
        ?.split("/products/")[1]
        ?.split("/")[0];

    if (!routineId || !productId) {
      return NextResponse.json(
        { error: "Routine ID and Product ID are required" },
        { status: 400 }
      );
    }

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify routine belongs to user
    const routine = await prisma.routine.findFirst({
      where: {
        id: routineId,
        userId: session.user.id,
      },
    });

    if (!routine) {
      return NextResponse.json(
        { error: "Routine not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { expectedResultsTimeframe } = body;

    // Find the routine product (get the most recent active one, or allow specifying which one)
    const routineProduct = await prisma.routineProduct.findFirst({
      where: {
        routineId,
        productId,
        removedAt: null, // Only update active products
      },
      orderBy: {
        addedAt: "desc",
      },
    });

    if (!routineProduct) {
      return NextResponse.json(
        { error: "Product not found in routine" },
        { status: 404 }
      );
    }

    // Update the expected results timeframe
    const updated = await prisma.routineProduct.update({
      where: {
        id: routineProduct.id,
      },
      data: {
        expectedResultsTimeframe: expectedResultsTimeframe || null,
      },
      include: {
        product: true,
      },
    });

    return NextResponse.json({ routineProduct: updated });
  } catch (error) {
    console.error("Error updating timeframe:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
