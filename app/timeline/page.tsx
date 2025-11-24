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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Timeline</h1>
          <p className="mt-2 text-gray-600">
            View your skincare journey timeline with product additions, removals, and photos
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {!error && routine && (
          <div className="bg-white rounded-lg shadow p-6">
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
          <div className="bg-white rounded-lg shadow p-6 text-center py-12">
            <p className="text-gray-600 mb-4">
              No routine found. Please create a routine first.
            </p>
            <a
              href="/routine"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Go to My Routine →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
