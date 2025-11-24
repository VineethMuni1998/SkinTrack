import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const routine = await prisma.routine.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        routineProducts: {
          include: {
            product: true,
          },
        },
        photos: {
          orderBy: {
            takenAt: "asc",
          },
        },
        analyses: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!routine) {
      return NextResponse.json(
        { error: "Routine not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ routine });
  } catch (error) {
    console.error("Error fetching routine:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, status, productIds } = body;

    // Verify routine belongs to user
    const existingRoutine = await prisma.routine.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingRoutine) {
      return NextResponse.json(
        { error: "Routine not found" },
        { status: 404 }
      );
    }

    // Update routine
    const routine = await prisma.routine.update({
      where: {
        id,
      },
      data: {
        ...(name !== undefined && { name }),
        ...(status !== undefined && { status }),
      },
      include: {
        routineProducts: {
          include: {
            product: true,
          },
        },
      },
    });

    // Handle product additions/removals
    if (productIds !== undefined) {
      // Get current products
      const currentProducts = await prisma.routineProduct.findMany({
        where: {
          routineId: id,
          removedAt: null,
        },
      });

      const currentProductIds = currentProducts.map((rp) => rp.productId);
      const productsToAdd = productIds.filter(
        (id: string) => !currentProductIds.includes(id)
      );
      const productsToRemove = currentProductIds.filter(
        (id: string) => !productIds.includes(id)
      );

      // Add new products
      if (productsToAdd.length > 0) {
        await prisma.routineProduct.createMany({
          data: productsToAdd.map((productId: string) => ({
            routineId: id,
            productId,
          })),
        });
      }

      // Remove products
      if (productsToRemove.length > 0) {
        await prisma.routineProduct.updateMany({
          where: {
            routineId: id,
            productId: { in: productsToRemove },
            removedAt: null,
          },
          data: {
            removedAt: new Date(),
          },
        });
      }
    }

    const updatedRoutine = await prisma.routine.findUnique({
      where: { id },
      include: {
        routineProducts: {
          include: {
            product: true,
          },
          where: {
            removedAt: null,
          },
        },
      },
    });

    return NextResponse.json({ routine: updatedRoutine });
  } catch (error) {
    console.error("Error updating routine:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
