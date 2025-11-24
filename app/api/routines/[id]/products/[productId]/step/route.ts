import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; productId: string }> }
) {
  try {
    const params = await context.params;
    const contextRoutineId = params?.id;
    const contextRoutineProductId = params?.productId;

    const routineId =
      contextRoutineId ||
      request.nextUrl.pathname.split("/api/routines/")[1]?.split("/")[0];
    // In our UI this param actually holds the routineProductId
    const routineProductId =
      contextRoutineProductId ||
      request.nextUrl.pathname.split("/products/")[1]?.split("/")[0];

    if (!routineId || !routineProductId) {
      return NextResponse.json(
        { error: "Routine ID and routine product ID are required" },
        { status: 400 }
      );
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { stepOrder } = body;

    if (typeof stepOrder !== "number" || Number.isNaN(stepOrder)) {
      return NextResponse.json(
        { error: "stepOrder must be a number" },
        { status: 400 }
      );
    }

    const routine = await prisma.routine.findFirst({
      where: { id: routineId, userId: session.user.id },
      select: { id: true },
    });

    if (!routine) {
      return NextResponse.json(
        { error: "Routine not found" },
        { status: 404 }
      );
    }

    const routineProduct = await prisma.routineProduct.findFirst({
      where: { id: routineProductId, routineId },
      select: { id: true },
    });

    if (!routineProduct) {
      return NextResponse.json(
        { error: "Routine product not found" },
        { status: 404 }
      );
    }

    await prisma.routineProduct.update({
      where: { id: routineProductId },
      data: { stepOrder },
    });

    return NextResponse.json({ message: "Step updated" });
  } catch (error) {
    console.error("Error updating step:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
