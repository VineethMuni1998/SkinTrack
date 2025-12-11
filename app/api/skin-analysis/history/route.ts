import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user's skin analysis history, most recent first
    const analyses = await prisma.skinAnalysis.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        analysisDate: 'desc',
      },
      take: 10, // Return last 10 analyses
      select: {
        id: true,
        imageUrl: true,
        detectedSkinType: true,
        confidence: true,
        wrinkles: true,
        spots: true,
        redness: true,
        acne: true,
        oiliness: true,
        darkCircles: true,
        texture: true,
        moisture: true,
        analysisDate: true,
        usedForOnboarding: true,
      },
    });

    // Transform to match the frontend interface
    const transformedAnalyses = analyses.map(analysis => ({
      id: analysis.id,
      skinType: analysis.detectedSkinType || 'UNKNOWN',
      confidence: analysis.confidence || 0,
      concerns: {
        wrinkles: analysis.wrinkles || 0,
        spots: analysis.spots || 0,
        redness: analysis.redness || 0,
        acne: analysis.acne || 0,
        oiliness: analysis.oiliness || 0,
        darkCircles: analysis.darkCircles || 0,
        texture: analysis.texture || 0,
        moisture: analysis.moisture || 0,
      },
      imageUrl: analysis.imageUrl,
      analysisDate: analysis.analysisDate,
      usedForOnboarding: analysis.usedForOnboarding,
    }));

    return NextResponse.json(
      { analyses: transformedAnalyses },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching skin analysis history:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
