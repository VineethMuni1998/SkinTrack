import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const validDays = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const normalizeSkipDays = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => (typeof v === "string" ? v.trim().toUpperCase() : ""))
    .filter((v) => validDays.includes(v));
};

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; productId: string }> }
) {
  try {
    const { id: routineId, productId: routineProductId } = await context.params;

    if (!routineId || !routineProductId) {
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

    const body = await request.json();
    const { skipDays } = body;

    const normalizedSkipDays = normalizeSkipDays(skipDays);

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

    // Verify routine product exists in this routine
    const routineProduct = await prisma.routineProduct.findFirst({
      where: {
        id: routineProductId,
        routineId,
      },
    });

    if (!routineProduct) {
      return NextResponse.json(
        { error: "Product not found in routine" },
        { status: 404 }
      );
    }

    // Update the skipDays
    const updatedRoutineProduct = await prisma.routineProduct.update({
      where: {
        id: routineProductId,
      },
      data: {
        skipDays: normalizedSkipDays,
      },
      include: {
        product: true,
      },
    });

    return NextResponse.json({ routineProduct: updatedRoutineProduct });
  } catch (error) {
    console.error("Error updating product schedule:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
