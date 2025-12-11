import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { recommendProducts } from "@/lib/openai";

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
    const { skinType, concerns } = body;

    if (!skinType) {
      return NextResponse.json(
        { error: "Skin type is required" },
        { status: 400 }
      );
    }

    if (!concerns || typeof concerns !== 'object') {
      return NextResponse.json(
        { error: "Skin concerns are required" },
        { status: 400 }
      );
    }

    // Call OpenAI to get product recommendations
    const recommendations = await recommendProducts({
      skinType,
      concerns,
    });

    return NextResponse.json(
      { recommendations },
      { status: 200 }
    );
  } catch (error) {
    console.error("Product recommendation error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate recommendations",
      },
      { status: 500 }
    );
  }
}
