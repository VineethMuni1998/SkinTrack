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

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // If the DB was reset (e.g., Supabase reset), bail early with a clear error
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (!dbUser) {
      return NextResponse.json(
        { error: "Account not found. Please sign in again." },
        { status: 401 }
      );
    }

    const routines = await prisma.routine.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        routineProducts: {
          include: {
            product: true,
          },
          orderBy: [
            {
              stepOrder: "asc",
            },
            {
              addedAt: "asc",
            },
          ],
        },
        photos: {
          orderBy: {
            takenAt: "desc",
          },
          take: 1,
        },
        analyses: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ routines });
  } catch (error) {
    console.error("Error fetching routines:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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
    const { name, products } = body;

    const stepCounters: Record<string, number> = {
      MORNING: 0,
      NIGHT: 0,
      BOTH: 0,
    };

    const routine = await prisma.routine.create({
      data: {
        userId: session.user.id,
        name: name || null,
        routineProducts: {
          create:
            products?.map(
              (product: { productId: string; timeOfDay?: string }) => {
                const normalizedTime = (product.timeOfDay ?? "MORNING").toUpperCase();
                stepCounters[normalizedTime] = (stepCounters[normalizedTime] || 0) + 1;
                return {
                  productId: product.productId,
                  timeOfDay: normalizedTime,
                  skipDays: normalizeSkipDays(product.skipDays),
                  stepOrder: stepCounters[normalizedTime],
                };
              }
            ) || [],
        },
      },
      include: {
        routineProducts: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json({ routine }, { status: 201 });
  } catch (error) {
    console.error("Error creating routine:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
