import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { uploadImage } from "@/lib/cloudinary";

type RoutineTimeOfDay = "MORNING" | "NIGHT" | "BOTH";

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

const parseTimeOfDay = (value: unknown): RoutineTimeOfDay | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  if (
    normalized === "MORNING" ||
    normalized === "NIGHT" ||
    normalized === "BOTH"
  ) {
    return normalized as RoutineTimeOfDay;
  }
  return null;
};

export async function POST(
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

    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "Account not found. Please sign in again." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { productId, timeOfDay, skipDays } = body;

    const parsedTimeOfDay = parseTimeOfDay(timeOfDay);

    if (!productId || !parsedTimeOfDay) {
      return NextResponse.json(
        { error: "Product ID and valid time of day are required" },
        { status: 400 }
      );
    }

    const normalizedSkip = normalizeSkipDays(skipDays);

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

    const existing = await prisma.routineProduct.findFirst({
      where: {
        routineId,
        productId,
        timeOfDay: parsedTimeOfDay,
        removedAt: null,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Product already in this routine section" },
        { status: 400 }
      );
    }

    const maxOrder = await prisma.routineProduct.aggregate({
      where: {
        routineId,
        timeOfDay: parsedTimeOfDay,
      },
      _max: {
        stepOrder: true,
      },
    });

    const nextOrder = (maxOrder._max?.stepOrder ?? 0) + 1;

    const routineProduct = await prisma.routineProduct.create({
      data: {
        routineId,
        productId,
        timeOfDay: parsedTimeOfDay,
        skipDays: normalizedSkip,
        stepOrder: nextOrder,
      },
      include: {
        product: true,
      },
    });

    return NextResponse.json({ routineProduct }, { status: 201 });
  } catch (error) {
    console.error("Error adding product to routine:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const routineProductId = searchParams.get("routineProductId");
    const timeOfDay = searchParams.get("timeOfDay");
    const permanent = searchParams.get("permanent") === "true";
    const parsedTimeOfDay = parseTimeOfDay(timeOfDay);

    // Get removal reason from request body if provided
    let removalReason: string | null = null;
    try {
      const contentType = request.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const body = await request.json();
        removalReason = body.removalReason || null;
      }
    } catch (error) {
      // No JSON body, that's fine
    }

    if (!productId && !routineProductId) {
      return NextResponse.json(
        { error: "Product ID or Routine Product ID is required" },
        { status: 400 }
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

    if (permanent) {
      if (!routineProductId) {
        return NextResponse.json(
          { error: "Routine Product ID is required for permanent removal" },
          { status: 400 }
        );
      }

      const routineProduct = await prisma.routineProduct.findFirst({
        where: {
          id: routineProductId,
          routineId,
        },
      });

      if (!routineProduct) {
        return NextResponse.json(
          { error: "Routine product not found" },
          { status: 404 }
        );
      }

      await prisma.photo.deleteMany({
        where: {
          routineProductId,
        },
      });

      await prisma.routineProduct.delete({
        where: {
          id: routineProductId,
        },
      });

      return NextResponse.json({
        message: "Product removed from routine permanently",
      });
    }

    // Check if request has FormData (for file upload) or JSON (for already uploaded photo URL)
    const contentType = request.headers.get("content-type") || "";
    let photoUrl: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      // Handle file upload
      try {
        const formData = await request.formData();
        const file = formData.get("afterPhoto") as File | null;
        
        if (file && file.size > 0) {
          photoUrl = await uploadImage(file);
        }
      } catch (error) {
        console.error("Error processing photo upload:", error);
        // Continue without photo if upload fails
      }
    } else if (contentType.includes("application/json")) {
      // Handle JSON with photo URL (if photo was already uploaded separately)
      try {
        const body = await request.json();
        photoUrl = body.afterPhotoUrl || null;
      } catch (error) {
        // No JSON body or invalid JSON, that's fine - photo is optional
      }
    }
    // If no content-type or other type, photo is null (optional)

    // Create after photo if provided
    if (photoUrl) {
      await prisma.photo.create({
        data: {
          userId: session.user.id,
          routineId,
          url: photoUrl,
          type: "after",
        },
      });
    }

    // Remove product from routine
    if (routineProductId) {
      // Use routineProductId for precise removal
      await prisma.routineProduct.update({
        where: {
          id: routineProductId,
          routineId, // Verify it belongs to this routine
          removedAt: null,
        },
        data: {
          removedAt: new Date(),
          removalReason: removalReason || null,
        },
      });
    } else if (productId) {
      // Fallback to productId (removes all instances of this product)
      await prisma.routineProduct.updateMany({
        where: {
          routineId,
          productId,
          removedAt: null,
          ...(parsedTimeOfDay
            ? { timeOfDay: parsedTimeOfDay }
            : {}),
        },
        data: {
          removedAt: new Date(),
          removalReason: removalReason || null,
        },
      });
    }

    return NextResponse.json({ 
      message: "Product removed from routine",
      photoUploaded: !!photoUrl,
    });
  } catch (error) {
    console.error("Error removing product from routine:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
