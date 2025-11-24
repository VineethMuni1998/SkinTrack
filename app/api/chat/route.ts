import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { messages } = body as {
      messages?: Array<{ role: "user" | "assistant"; content: string }>;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { age: true, skinType: true },
    });

    const routine = await prisma.routine.findFirst({
      where: {
        userId: session.user.id,
        status: "active",
      },
      include: {
        routineProducts: {
          where: { removedAt: null },
          include: { product: true },
        },
      },
    });

    const routineProducts = routine?.routineProducts ?? [];
    const routineSummary = routineProducts.map((rp) => ({
      name: rp.product.name,
      brand: rp.product.brand,
      category: rp.product.category,
      timeOfDay: rp.timeOfDay,
      skipDays: rp.skipDays,
    }));

    const systemPrompt = `You are SkinTrack's skincare assistant. You ONLY answer skincare-related questions, routines, ingredients, efficacy, safety, timing, layering, and product recommendations. Do not answer unrelated topics. If asked non-skincare, say: "I can only help with skincare."

User context:
- Age: ${user?.age ?? "unknown"}
- Skin type: ${user?.skinType ?? "unknown"}
- Current routine items: ${JSON.stringify(routineSummary)}

Rules:
- Tailor advice to the user's age and skin type.
- Keep within safe usage; note sensitivities for younger/sensitive skin.
- If a question is not about skincare, refuse politely.
- Be concise and actionable.`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_ANALYSIS_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      ],
      temperature: 0.6,
      max_tokens: 600,
    });

    const rawReply = completion.choices[0]?.message?.content;

    if (!rawReply) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    // Normalize to simple bullet formatting for readability
    const reply = rawReply
      .replace(/\n\s*\n/g, "\n")
      .replace(/(\d+)\.\s+/g, "• ")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*\*/g, "")
      .replace(/^\s+|\s+$/g, "");

    return NextResponse.json({ message: reply });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to process chat" },
      { status: 500 }
    );
  }
}
