import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const routineId = searchParams.get("routineId");
    const type = searchParams.get("type");

    const photos = await prisma.photo.findMany({
      where: {
        userId: session.user.id,
        ...(routineId && { routineId }),
        ...(type && { type }),
      },
      orderBy: {
        takenAt: "desc",
      },
      include: {
        routine: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Fetch product information for photos with routineProductId
    type PhotoWithRoutine = Awaited<
      ReturnType<typeof prisma.photo.findMany>
    >[number];

    const photosWithProducts = await Promise.all(
      photos.map(async (photo: PhotoWithRoutine) => {
        if (photo.routineProductId) {
          const routineProduct = await prisma.routineProduct.findUnique({
            where: { id: photo.routineProductId },
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          });
          return {
            ...photo,
            product: routineProduct?.product || null,
          };
        }
        return {
          ...photo,
          product: null,
        };
      })
    );

    return NextResponse.json({ photos: photosWithProducts });
  } catch (error) {
    console.error("Error fetching photos:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const photoId = body?.photoId as string | undefined;

    if (!photoId) {
      return NextResponse.json(
        { error: "photoId is required" },
        { status: 400 }
      );
    }

    const photo = await prisma.photo.findFirst({
      where: { id: photoId, userId: session.user.id },
    });

    if (!photo) {
      return NextResponse.json(
        { error: "Photo not found" },
        { status: 404 }
      );
    }

    await prisma.photo.delete({
      where: { id: photoId },
    });

    return NextResponse.json({ message: "Photo deleted" });
  } catch (error) {
    console.error("Error deleting photo:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
