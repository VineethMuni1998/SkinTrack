import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { uploadImage } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const routineId = formData.get("routineId") as string | null;
    const routineProductId = formData.get("routineProductId") as string | null;
    const type = formData.get("type") as string; // "before" or "after"

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!type || (type !== "before" && type !== "after")) {
      return NextResponse.json(
        { error: "Invalid photo type. Must be 'before' or 'after'" },
        { status: 400 }
      );
    }

    // Upload to Cloudinary
    const imageUrl = await uploadImage(file);

    // Save to database
    const photo = await prisma.photo.create({
      data: {
        userId: session.user.id,
        routineId: routineId || null,
        routineProductId: routineProductId || null,
        url: imageUrl,
        type,
      },
    });

    return NextResponse.json(
      { photo },
      { status: 201 }
    );
  } catch (error) {
    console.error("Photo upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
