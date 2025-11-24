import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { analyzeProducts } from "@/lib/openai";

const computeAge = (dob?: Date | null) => {
  if (!dob) return undefined;
  const now = new Date();
  const birth = new Date(dob);
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age : undefined;
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { routineId } = body;

    if (!routineId) {
      return NextResponse.json(
        { error: "Routine ID is required" },
        { status: 400 }
      );
    }

    // Verify routine belongs to user
    const routine = await prisma.routine.findFirst({
      where: {
        id: routineId,
        userId: session.user.id,
      },
      include: {
        routineProducts: {
          where: {
            removedAt: null,
          },
          include: {
            product: true,
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

    if (routine.routineProducts.length === 0) {
      return NextResponse.json(
        { error: "Routine has no products to analyze" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { age: true, skinType: true, dateOfBirth: true },
    });

    const derivedAge = computeAge(user?.dateOfBirth) ?? user?.age ?? undefined;

    // Prepare products for analysis
    type RoutineProductWithProduct =
      (typeof routine.routineProducts)[number];

    const products = routine.routineProducts.map((rp: RoutineProductWithProduct) => ({
      id: rp.product.id,
      name: rp.product.name,
      brand: rp.product.brand || undefined,
      ingredients: rp.product.ingredients || undefined,
      category: rp.product.category || undefined,
      timeOfDay: rp.timeOfDay,
      skipDays: rp.skipDays || [],
    }));

    // Run AI analysis
    const analysisResult = await analyzeProducts(products, {
      age: derivedAge,
      skinType: user?.skinType ?? undefined,
    });

    // Save analysis to database
    const analysis = await prisma.analysis.create({
      data: {
        routineId,
        products: products,
        timeline: analysisResult.timeline,
        interactions: analysisResult.interactions,
        recommendations: analysisResult.recommendations,
      },
    });

    return NextResponse.json({
      analysis: {
        ...analysis,
        overallTimeline: analysisResult.overallTimeline,
      },
    });
  } catch (error: any) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to analyze products",
      },
      { status: 500 }
    );
  }
}
