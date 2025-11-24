import { NextResponse } from "next/server";
import { fetchProductIngredients } from "@/lib/openai";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, brand, category, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Product name is required for ingredient lookup" },
        { status: 400 }
      );
    }

    const ingredients = await fetchProductIngredients({
      name,
      brand,
      category,
      description,
    });

    return NextResponse.json({ ingredients });
  } catch (error: any) {
    console.error("Ingredient fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Unable to fetch ingredients right now." },
      { status: 500 }
    );
  }
}
