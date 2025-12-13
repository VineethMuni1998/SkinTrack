"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import TimelineView from "@/components/TimelineView";

type TimelineEventType = "product_started" | "product_ended";

interface TimelineEvent {
  id: string;
  type: TimelineEventType;
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

interface Routine {
  id: string;
  name?: string;
  status: string;
}

export default function TimelinePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    try {
      setError("");
      // Fetch routine
      const routineResponse = await fetch("/api/routines");
      const routineData = await routineResponse.json();
      const routines = routineData.routines || [];
      const activeRoutine = routines.find((r: Routine) => r.status === "active") || routines[0];
      
      if (!activeRoutine) {
        setError("No routine found. Please create a routine first.");
        setLoading(false);
        return;
      }

      setRoutine(activeRoutine);

      // Fetch timeline events
      const timelineResponse = await fetch(`/api/routines/${activeRoutine.id}/timeline`);
      if (!timelineResponse.ok) {
        throw new Error("Failed to fetch timeline");
      }
      const timelineData = await timelineResponse.json();
      setEvents(timelineData.events || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load timeline. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchData();
  };

  const handleProductRemove = (productId: string, routineProductId?: string) => {
    // Refresh timeline after removal
    fetchData();
  };

  const handleTimeframeUpdate = (routineProductId: string, timeframe: string) => {
    // Refresh timeline after update
    fetchData();
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[url('/background-pattern.png')] bg-cover bg-center bg-fixed">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold text-amber-900">Timeline</h1>
          <p className="mt-2 text-lg text-amber-800">
            View your skincare journey timeline with product additions, removals, and photos
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-100/80 backdrop-blur-sm border border-red-300/50 text-red-800 px-4 py-3 rounded-xl shadow-md">
            {error}
          </div>
        )}

        {!error && routine && (
          <div className="bg-white/20 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-white/40">
            <TimelineView
              events={events}
              routineId={routine.id}
              onProductRemove={handleProductRemove}
              onTimeframeUpdate={handleTimeframeUpdate}
              onRefresh={handleRefresh}
            />
          </div>
        )}

        {!error && !routine && (
          <div className="bg-white/20 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-white/40 text-center py-12">
            <p className="text-amber-800 mb-4">
              No routine found. Please create a routine first.
            </p>
            <a
              href="/routine"
              className="text-amber-900 hover:text-amber-800 font-medium underline decoration-amber-600/30 hover:decoration-amber-600/60 transition-colors"
            >
              Go to My Routine →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
