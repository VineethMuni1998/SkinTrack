import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

interface TimelineEvent {
  id: string;
  type: "product_started" | "product_ended";
  timestamp: string;
  productId: string;
  productName: string;
  expectedResultsTimeframe?: string;
  timeSinceAddition?: number;
  isTimeframePassed?: boolean;
  routineProductId: string;
  isRemoved: boolean;
  removedAt?: string;
  removalReason?: string;
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
}

// Helper function to parse timeframe string to days
function parseTimeframeToDays(timeframe: string | null | undefined): number | null {
  if (!timeframe) return null;
  
  // Handle ranges like "2-4 weeks" -> use max value
  const rangeMatch = timeframe.match(/(\d+)\s*-\s*(\d+)\s*(week|month|day)/i);
  if (rangeMatch) {
    const max = parseInt(rangeMatch[2]);
    const unit = rangeMatch[3].toLowerCase();
    if (unit === "week") return max * 7;
    if (unit === "month") return max * 30;
    if (unit === "day") return max;
  }
  
  // Handle single values like "4 weeks"
  const singleMatch = timeframe.match(/(\d+)\s*(week|month|day)/i);
  if (singleMatch) {
    const value = parseInt(singleMatch[1]);
    const unit = singleMatch[2].toLowerCase();
    if (unit === "week") return value * 7;
    if (unit === "month") return value * 30;
    if (unit === "day") return value;
  }
  
  return null;
}

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const routineId =
      context?.params?.id ||
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

    // Fetch all routine products (including removed ones)
    const routineProducts = await prisma.routineProduct.findMany({
      where: {
        routineId,
      },
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
    });

    // Fetch all photos for this routine
    const photos = await prisma.photo.findMany({
      where: {
        routineId,
      },
      orderBy: {
        takenAt: "asc",
      },
    });

    // Fetch latest analysis for expected timeframes
    const latestAnalysis = await prisma.analysis.findFirst({
      where: {
        routineId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Build a map of productId -> expected timeframe from analysis
    const analysisTimeframes: Record<string, string> = {};
    if (latestAnalysis?.timeline && typeof latestAnalysis.timeline === "object") {
      const timeline = latestAnalysis.timeline as any;
      if (Array.isArray(timeline)) {
        timeline.forEach((item: any) => {
          if (item.productId && item.expectedResultsTime) {
            analysisTimeframes[item.productId] = item.expectedResultsTime;
          }
        });
      }
    }

    // Build timeline events - one per product showing started/ended status
    const events: TimelineEvent[] = [];

    routineProducts.forEach((rp) => {
      // Get expected timeframe: manual override first, then analysis
      const expectedTimeframe =
        rp.expectedResultsTimeframe ||
        analysisTimeframes[rp.productId] ||
        null;

      const addedDate = new Date(rp.addedAt);
      const now = new Date();
      const daysSinceAddition = Math.floor(
        (now.getTime() - addedDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      const expectedDays = parseTimeframeToDays(expectedTimeframe);
      const isTimeframePassed =
        expectedDays !== null && daysSinceAddition >= expectedDays;

      // Find before and after photos for this specific product by routineProductId
      let beforePhotoUrl: string | undefined;
      let afterPhotoUrl: string | undefined;

      photos.forEach((photo) => {
        // Match photos by routineProductId for precise association
        if (photo.routineProductId === rp.id) {
          if (photo.type === "before") {
            beforePhotoUrl = photo.url;
          } else if (photo.type === "after") {
            afterPhotoUrl = photo.url;
          }
        }
      });

      // Create a single event for this product showing started/ended status
      events.push({
        id: `product_${rp.id}`,
        type: rp.removedAt ? "product_ended" : "product_started",
        timestamp: rp.addedAt.toISOString(),
        productId: rp.productId,
        productName: rp.product.name,
        expectedResultsTimeframe: expectedTimeframe || undefined,
        timeSinceAddition: daysSinceAddition,
        isTimeframePassed: isTimeframePassed,
        routineProductId: rp.id,
        isRemoved: rp.removedAt !== null,
        removedAt: rp.removedAt?.toISOString(),
        removalReason: rp.removalReason || undefined,
        beforePhotoUrl,
        afterPhotoUrl,
      });
    });

    // Sort events by timestamp (when product was started)
    events.sort((a, b) => {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error fetching timeline:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
