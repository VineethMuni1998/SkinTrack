import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contextRoutineId } = await context.params;

    const routineId =
      contextRoutineId ||
      request.nextUrl.pathname.split("/api/routines/")[1]?.split("/")[0];

    if (!routineId) {
      return NextResponse.json(
        { error: "Routine ID is required" },
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

    const body = await request.json();
    const { orders } = body as {
      orders?: Array<{ routineProductId: string; stepOrder: number }>;
    };

    if (
      !orders ||
      !Array.isArray(orders) ||
      orders.length === 0 ||
      orders.some(
        (order) =>
          !order.routineProductId || typeof order.stepOrder !== "number"
      )
    ) {
      return NextResponse.json(
        { error: "Orders payload is required" },
        { status: 400 }
      );
    }

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

    const routineProductIds = orders.map((order) => order.routineProductId);

    const matchingProducts = await prisma.routineProduct.findMany({
      where: {
        id: {
          in: routineProductIds,
        },
        routineId,
      },
      select: {
        id: true,
      },
    });

    if (matchingProducts.length !== orders.length) {
      return NextResponse.json(
        { error: "One or more routine products were not found" },
        { status: 400 }
      );
    }

    await prisma.$transaction(
      orders.map((order) =>
        prisma.routineProduct.update({
          where: { id: order.routineProductId },
          data: {
            stepOrder: order.stepOrder,
          },
        })
      )
    );

    return NextResponse.json({ message: "Routine order updated" });
  } catch (error) {
    console.error("Error updating routine order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
