"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import ProductForm from "@/components/ProductForm";
import ProductList from "@/components/ProductList";
import PhotoUpload from "@/components/PhotoUpload";
import AnalysisTimelineView from "@/components/AnalysisTimelineView";
import UsageSchedulePicker, { UsageMode, getWeekdayValues } from "@/components/UsageSchedulePicker";
import ChatWidget from "@/components/ChatWidget";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  ingredients?: string;
  skipDays?: string[];
}

type RoutineTimeOfDay = "MORNING" | "NIGHT" | "BOTH";

interface RoutinePhoto {
  id: string;
  url: string;
  type: string;
  note?: string | null;
  takenAt: string;
  createdAt: string;
  routineId?: string | null;
}

interface Routine {
  id: string;
  name?: string;
  startDate: string;
  status: string;
  routineProducts: Array<{
    id: string;
    routineProductId?: string;
    timeOfDay: RoutineTimeOfDay;
    product: Product;
    removedAt?: string | null;
    addedAt: string;
    stepOrder?: number | null;
    skipDays?: string[];
  }>;
  analyses: Array<{
    id: string;
    timeline: any;
    interactions: any;
    recommendations: any;
    createdAt: string;
  }>;
}

export default function RoutinePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTimeOfDay, setSelectedTimeOfDay] =
    useState<RoutineTimeOfDay>("MORNING");
  const pendingReanalysisRef = useRef<Routine | null>(null);
  const [weeklyPhotos, setWeeklyPhotos] = useState<RoutinePhoto[]>([]);
  const [weeklyPhotosLoading, setWeeklyPhotosLoading] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);
  const [deletingWeeklyPhotoId, setDeletingWeeklyPhotoId] = useState<string | null>(null);
  const [reorderingProductId, setReorderingProductId] = useState<string | null>(null);
  const [usageMode, setUsageMode] = useState<UsageMode>("DAILY");
  const [skipDays, setSkipDays] = useState<string[]>([]);
  const [specificDays, setSpecificDays] = useState<string[]>([]);
  const [routineActionError, setRoutineActionError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const res = await fetch("/api/users/me");
        const contentType = res.headers.get("content-type") || "";
        const data = contentType.includes("application/json")
          ? await res.json().catch(() => ({}))
          : {};
        if (!data?.user?.age || !data?.user?.skinType) {
          router.push("/onboarding?next=/routine");
          return;
        }
        setProfileComplete(true);
        fetchRoutine();
        fetchAllProducts();
      } catch (error) {
        console.error("Error checking profile:", error);
        setProfileComplete(false);
      }
    };

    if (status === "authenticated") {
      checkProfile();
    }
  }, [status, router]);

  const fetchRoutine = async () => {
    let activeRoutine: Routine | null = null;
    try {
      const response = await fetch("/api/routines");
      const data = await response.json();
      const routines = data.routines || [];
      activeRoutine =
        routines.find((r: Routine) => r.status === "active") ||
        routines[0] ||
        null;

      setRoutine(activeRoutine);
    } catch (error) {
      console.error("Error fetching routine:", error);
      setRoutine(null);
    } finally {
      setLoading(false);
    }
    return activeRoutine;
  };

  const fetchAllProducts = async () => {
    try {
      const response = await fetch("/api/products");
      const data = await response.json();
      setAllProducts(data.products || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchWeeklyPhotos = async (routineId?: string | null) => {
    setWeeklyPhotosLoading(true);
    try {
      const url = routineId
        ? `/api/photos?routineId=${routineId}`
        : "/api/photos";
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        console.error(
          "Error fetching weekly photos:",
          data?.error || response.statusText || "Unknown error"
        );
        return;
      }
      const data = await response.json();
      const photos = (data.photos || []) as RoutinePhoto[];
      const filtered = routineId
        ? photos.filter((photo) => photo.routineId === routineId)
        : photos;
      const fallback = filtered.length > 0 ? filtered : photos;
      const sorted = fallback.sort((a, b) => {
        const aDate = new Date(a.takenAt || a.createdAt).getTime();
        const bDate = new Date(b.takenAt || b.createdAt).getTime();
        return bDate - aDate;
      });
      setWeeklyPhotos(sorted);
    } catch (error) {
      console.error("Error fetching weekly photos:", error);
    } finally {
      setWeeklyPhotosLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchWeeklyPhotos(routine?.id);
    }
  }, [status, routine?.id]);

  useEffect(() => {
    if (weeklyPhotos.length === 0) {
      setCurrentPhotoIndex(0);
    } else {
      setCurrentPhotoIndex((prev) =>
        Math.min(prev, weeklyPhotos.length - 1)
      );
    }
  }, [weeklyPhotos.length]);

  const toggleSkipDay = (day: string) => {
    setSkipDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day]
    );
  };

  const toggleSpecificDay = (day: string) => {
    setSpecificDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day]
    );
  };

  const computeSkipDaysForSubmit = () => {
    if (usageMode === "DAILY") return [];
    if (usageMode === "SKIP_DAYS") return skipDays;
    const week = getWeekdayValues();
    if (specificDays.length === 0) return [];
    return week.filter((day) => !specificDays.includes(day));
  };

  const handleCreateProduct = async (productData: {
    name: string;
    brand?: string;
    ingredients?: string;
    category?: string;
    description?: string;
  }) => {
    try {
      setRoutineActionError("");
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to create product. Please try again."
        );
      }

      await addProductToRoutine(data.product.id, selectedTimeOfDay);
      setShowProductForm(false);
      fetchAllProducts();
    } catch (error) {
      console.error("Error creating product:", error);
      setRoutineActionError(
        error instanceof Error
          ? error.message
          : "Failed to save product. Please try again."
      );
    }
  };

  const addProductToRoutine = async (
    productId: string,
    timeOfDay: RoutineTimeOfDay
  ) => {
    setRoutineActionError("");
    try {
      const payloadSkipDays = computeSkipDaysForSubmit();
      let response: Response;

      if (!routine) {
        // Create new routine
        response = await fetch("/api/routines", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            products: [{ productId, timeOfDay, skipDays: payloadSkipDays }],
          }),
        });
      } else {
        response = await fetch(`/api/routines/${routine.id}/products`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId,
            timeOfDay,
            skipDays: payloadSkipDays,
          }),
        });
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          data?.error ||
          (response.status === 401
            ? "Your session is invalid or your account was reset. Please sign in again."
            : "Failed to add product to routine. Please try again.");
        throw new Error(message);
      }

      await fetchRoutine();
      setSkipDays([]);
      setSpecificDays([]);
      setUsageMode("DAILY");
    } catch (error) {
      console.error("Error adding product to routine:", error);
      setRoutineActionError(
        error instanceof Error
          ? error.message
          : "Failed to add product to routine. Please try again."
      );
    }
  };

  const removeProductFromRoutine = async (
    productId: string,
    timeOfDay?: string,
    routineProductId?: string
  ) => {
    if (!routine) return;

    const params = new URLSearchParams();
    if (routineProductId) {
      // Use routineProductId for precise removal
      params.set("routineProductId", routineProductId);
    } else {
      // Fallback to productId and timeOfDay
      params.set("productId", productId);
      if (timeOfDay) {
        params.set("timeOfDay", timeOfDay);
      }
    }

    const response = await fetch(
      `/api/routines/${routine.id}/products?${params.toString()}`,
      {
        method: "DELETE",
      }
    );

    if (response.ok) {
      const updatedRoutine = await fetchRoutine();
      const hasActiveProducts =
        updatedRoutine?.routineProducts?.some((rp) => !rp.removedAt) ?? false;

      if (hasActiveProducts) {
        if (analyzing) {
          pendingReanalysisRef.current = updatedRoutine;
        } else {
          await handleAnalyze(updatedRoutine);
        }
      }
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error("Failed to remove product:", errorData);
      alert("Failed to remove product. Please try again.");
    }
  };

  const handleAnalyze = async (routineOverride?: Routine | null) => {
    const routineToAnalyze = routineOverride ?? routine;
    const hasActiveProducts =
      routineToAnalyze?.routineProducts?.some((rp) => !rp.removedAt) ?? false;

    if (!routineToAnalyze || !hasActiveProducts) return;

    if (analyzeError) setAnalyzeError("");
    setAnalyzing(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ routineId: routineToAnalyze.id }),
      });

      if (response.ok) {
        fetchRoutine();
      } else {
        const data = await response.json();
        setAnalyzeError(
          data.error ||
            "We couldn't analyze your routine right now. Please try again later."
        );
      }
    } catch (error) {
      console.error("Error analyzing routine:", error);
      setAnalyzeError(
        error instanceof Error
          ? error.message
          : "Failed to analyze routine. Please try again."
      );
    } finally {
      setAnalyzing(false);
      if (pendingReanalysisRef.current) {
        const routineForNextAnalysis = pendingReanalysisRef.current;
        pendingReanalysisRef.current = null;
        await handleAnalyze(routineForNextAnalysis);
      }
    }
  };

  const handleWeeklyUploadSuccess = async () => {
    const updatedRoutine = await fetchRoutine();
    const routineId = updatedRoutine?.id || routine?.id;
    await fetchWeeklyPhotos(routineId);
  };

  const handlePrevPhoto = () => {
    if (weeklyPhotos.length === 0) return;
    setCurrentPhotoIndex((prev) =>
      prev === 0 ? weeklyPhotos.length - 1 : prev - 1
    );
  };

  const handleNextPhoto = () => {
    if (weeklyPhotos.length === 0) return;
    setCurrentPhotoIndex((prev) =>
      prev === weeklyPhotos.length - 1 ? 0 : prev + 1
    );
  };

  const handleDeleteWeeklyPhoto = async (photoId: string) => {
    setDeletingWeeklyPhotoId(photoId);
    try {
      const response = await fetch("/api/photos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to delete photo");
      }
      await fetchWeeklyPhotos(routine?.id);
      const nextIndex = Math.max(0, currentPhotoIndex - 1);
      setCurrentPhotoIndex(nextIndex);
    } catch (error) {
      console.error("Error deleting weekly photo:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete photo. Please try again."
      );
    } finally {
      setDeletingWeeklyPhotoId(null);
    }
  };

  const filteredProducts = allProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMergeWithPrevious = async (
    routineProductId: string,
    targetStepOrder: number
  ) => {
    if (!routine) return;
    try {
      const response = await fetch(
        `/api/routines/${routine.id}/products/${routineProductId}/step`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stepOrder: targetStepOrder }),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const message =
          data?.error ||
          (response.status === 404
            ? "Item not found. Refresh and try again."
            : "Failed to merge steps");
        throw new Error(message);
      }

      await fetchRoutine();
    } catch (error) {
      console.error("Error merging steps:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to merge steps. Please try again."
      );
    }
  };

  const handleUnmerge = async (routineProductId: string, nextStepOrder: number) => {
    if (!routine) return;
    try {
      const response = await fetch(
        `/api/routines/${routine.id}/products/${routineProductId}/step`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stepOrder: nextStepOrder }),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const message =
          data?.error ||
          (response.status === 404
            ? "Item not found. Refresh and try again."
            : "Failed to unmerge step");
        throw new Error(message);
      }

      await fetchRoutine();
    } catch (error) {
      console.error("Error unmerging step:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to unmerge step. Please try again."
      );
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const latestAnalysis = routine?.analyses?.[0];
  // Filter out removed products for display
  const routineProducts = (routine?.routineProducts || [])
    .filter((rp) => !rp.removedAt)
    .sort((a, b) => {
      const orderA = a.stepOrder ?? 0;
      const orderB = b.stepOrder ?? 0;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
    });
  const mapProductsForList = (entries: Routine["routineProducts"]) =>
    entries.map((entry) => ({
      ...entry.product,
      timeOfDay: entry.timeOfDay,
      routineProductId: entry.id, // Include the routineProduct id
      stepOrder: entry.stepOrder ?? undefined,
      skipDays: entry.skipDays ?? [],
    }));

  const morningProducts = routineProducts.filter(
    (rp) => rp.timeOfDay === "MORNING" || rp.timeOfDay === "BOTH"
  );
  const nightProducts = routineProducts.filter(
    (rp) => rp.timeOfDay === "NIGHT" || rp.timeOfDay === "BOTH"
  );
  const allProductsForAnalysis = routineProducts.map((rp) => rp.product);
  const lastWeeklyPhoto = weeklyPhotos[0];
  const lastCheckInDateSource =
    lastWeeklyPhoto?.takenAt || lastWeeklyPhoto?.createdAt;
  const lastCheckInDate = lastCheckInDateSource
    ? new Date(lastCheckInDateSource)
    : null;
  const daysSinceCheckIn = lastCheckInDate
    ? Math.floor(
        (Date.now() - lastCheckInDate.getTime()) / (1000 * 60 * 60 * 24)
      )
    : null;
  const isWeeklyOverdue =
    !weeklyPhotosLoading &&
    (!lastCheckInDate || (daysSinceCheckIn !== null && daysSinceCheckIn >= 7));
  const lastCheckInLabel = lastCheckInDate
    ? lastCheckInDate.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : weeklyPhotosLoading
      ? "Loading..."
      : "No check-ins yet";
  const cautionMessage = lastCheckInDate
    ? `It's been ${daysSinceCheckIn} day${
        daysSinceCheckIn === 1 ? "" : "s"
      } since your last check-in.`
    : "You haven't uploaded a weekly progress photo yet.";
  const currentProgressPhoto =
    weeklyPhotos.length > 0 ? weeklyPhotos[currentPhotoIndex] : null;
  const showProgressNavigation = weeklyPhotos.length > 1;
  const recentWeeklyPhotos = weeklyPhotos.slice(0, 3);
  const formatDateKey = (dateValue: string) =>
    new Date(dateValue).toDateString();
  const calendarDates = Array.from(
    new Set(
      weeklyPhotos.map((photo) =>
        formatDateKey(photo.takenAt || photo.createdAt)
      )
    )
  );

  const handleSelectCalendarDate = (dateKey: string) => {
    const targetIndex = weeklyPhotos.findIndex(
      (photo) => formatDateKey(photo.takenAt || photo.createdAt) === dateKey
    );
    if (targetIndex >= 0) {
      setCurrentPhotoIndex(targetIndex);
      setShowProgressModal(true);
    }
    setShowCalendarPicker(false);
  };

  const getContextProducts = (context?: RoutineTimeOfDay) => {
    if (context === "MORNING") {
      return routineProducts.filter(
        (rp) => rp.timeOfDay === "MORNING" || rp.timeOfDay === "BOTH"
      );
    }
    if (context === "NIGHT") {
      return routineProducts.filter(
        (rp) => rp.timeOfDay === "NIGHT" || rp.timeOfDay === "BOTH"
      );
    }
    return routineProducts;
  };

  const handleProductReorder = async (
    routineProductId: string,
    direction: "up" | "down",
    context?: RoutineTimeOfDay
  ) => {
    if (!routine) return;

    const contextProducts = getContextProducts(context);
    const orderedProducts = [...contextProducts];
    const currentIndex = orderedProducts.findIndex(
      (rp) => rp.id === routineProductId
    );

    if (currentIndex === -1) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= orderedProducts.length) {
      return;
    }

    const updatedProducts = [...orderedProducts];
    const currentStep =
      updatedProducts[currentIndex].stepOrder ?? currentIndex + 1;
    const targetStep =
      updatedProducts[targetIndex].stepOrder ?? targetIndex + 1;

    // Swap stepOrder values so ordering is preserved without reindexing shared steps
    updatedProducts[currentIndex].stepOrder = targetStep;
    updatedProducts[targetIndex].stepOrder = currentStep;

    const orders = updatedProducts.map((product, index) => ({
      routineProductId: product.id,
      stepOrder: product.stepOrder ?? index + 1,
    }));

    setReorderingProductId(routineProductId);

    try {
      const response = await fetch(
        `/api/routines/${routine.id}/products/reorder`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ orders }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update routine order");
      }

      fetchRoutine();
    } catch (error) {
      console.error("Error updating routine order:", error);
      alert("Failed to update routine steps. Please try again.");
    } finally {
      setReorderingProductId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <ChatWidget />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Routine</h1>
          <p className="mt-2 text-gray-600">
            Manage your skincare products and get AI-powered insights
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Your Products
                </h2>
                <button
                  onClick={() => setShowProductForm(!showProductForm)}
                  className="text-sm text-indigo-600 hover:text-indigo-700"
                >
                  {showProductForm ? "Cancel" : "+ Add Product"}
                </button>
              </div>

              {routineActionError && (
                <p className="mb-4 text-sm text-red-600">
                  {routineActionError}
                </p>
              )}

              {showProductForm && (
                <div className="mb-6">
                  <ProductForm
                    onSubmit={handleCreateProduct}
                    onCancel={() => setShowProductForm(false)}
                    usageMode={usageMode}
                    skipDays={skipDays}
                    specificDays={specificDays}
                    onUsageModeChange={(mode) => setUsageMode(mode)}
                    onToggleDay={(day, type) =>
                      type === "skip" ? toggleSkipDay(day) : toggleSpecificDay(day)
                    }
                  />
                </div>
              )}

              {!showProductForm && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700">
                      Add product to
                    </label>
                    <div className="inline-flex rounded-full border border-gray-200 bg-gray-50 p-1 text-xs font-medium">
                      {(["MORNING", "NIGHT"] as RoutineTimeOfDay[]).map(
                        (slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedTimeOfDay(slot)}
                            className={`px-3 py-1 rounded-full transition ${
                              selectedTimeOfDay === slot
                                ? "bg-white text-indigo-600 shadow"
                                : "text-gray-500"
                            }`}
                          >
                            {slot === "MORNING" ? "Morning" : "Night"}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                  <UsageSchedulePicker
                    usageMode={usageMode}
                    skipDays={skipDays}
                    specificDays={specificDays}
                    onUsageModeChange={(mode) => setUsageMode(mode)}
                    onToggleDay={(day, type) =>
                      type === "skip" ? toggleSkipDay(day) : toggleSpecificDay(day)
                    }
                    className="mb-3"
                    helperText="Daily by default. Choose skip days or exact days before adding."
                    title="Usage cadence for this add"
                  />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                  />
                  {searchQuery && (
                    <div className="mt-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                      {filteredProducts.map((product) => (
                        <div
                          key={product.id}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          onClick={() => {
                            addProductToRoutine(product.id, selectedTimeOfDay);
                            setSearchQuery("");
                          }}
                        >
                          <div className="font-medium">{product.name}</div>
                          {product.brand && (
                            <div className="text-sm text-gray-600">
                              {product.brand}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">
                    Morning Routine
                  </h3>
                  <ProductList
                    products={mapProductsForList(morningProducts)}
                    onRemove={removeProductFromRoutine}
                    showRemove={true}
                    onReorder={handleProductReorder}
                    onMergeWithPrevious={handleMergeWithPrevious}
                    onUnmerge={handleUnmerge}
                    timeOfDayContext="MORNING"
                    reorderingProductId={reorderingProductId}
                    emptyLabel="No morning products yet"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">
                    Night Routine
                  </h3>
                  <ProductList
                    products={mapProductsForList(nightProducts)}
                    onRemove={removeProductFromRoutine}
                    showRemove={true}
                    onReorder={handleProductReorder}
                    onMergeWithPrevious={handleMergeWithPrevious}
                    onUnmerge={handleUnmerge}
                    timeOfDayContext="NIGHT"
                    reorderingProductId={reorderingProductId}
                    emptyLabel="No night products yet"
                  />
                </div>
              </div>

              {routineProducts.length > 0 && (
                <button
                  onClick={() => handleAnalyze()}
                  disabled={analyzing}
                  className="mt-4 w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {analyzing ? "Analyzing..." : "Analyze Routine with AI"}
                </button>
              )}
              {analyzeError && (
                <p className="mt-3 text-sm text-red-600">{analyzeError}</p>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Weekly Skin Check-In
                  </h2>
                  <p className="text-sm text-gray-600">
                    Stay consistent by uploading a weekly progress photo.
                  </p>
                </div>
                <button
                  onClick={() => setShowProgressModal(true)}
                  disabled={weeklyPhotosLoading}
                  className={`text-sm px-4 py-2 rounded-lg border ${
                    weeklyPhotos.length === 0
                      ? "border-gray-200 text-gray-500 hover:bg-gray-50"
                      : "border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                  }`}
                >
                  See progress
                </button>
              </div>

              {isWeeklyOverdue && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg flex items-start gap-3">
                  <span className="text-xl">⚠️</span>
                  <div>
                    <p className="font-semibold">Time for a new check-in</p>
                    <p className="text-sm">{cautionMessage}</p>
                  </div>
                </div>
              )}

              {weeklyPhotosLoading ? (
                <p className="mt-4 text-sm text-gray-500">
                  Loading your progress photos...
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  <p className="text-sm text-gray-600">
                    Last check-in:{" "}
                    <span className="font-medium text-gray-900">
                      {lastCheckInLabel}
                    </span>
                  </p>

                  {lastWeeklyPhoto ? (
                    <div className="flex flex-col sm:flex-row gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <div className="sm:w-48 w-full">
                        <img
                          src={lastWeeklyPhoto.url}
                          alt="Most recent weekly progress"
                          className="w-full h-full object-cover rounded-lg bg-white"
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className="text-sm text-gray-600">
                          Uploaded {lastCheckInLabel}
                        </p>
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">
                          {lastWeeklyPhoto.note && lastWeeklyPhoto.note.trim()
                            ? lastWeeklyPhoto.note
                            : "No note added for this check-in."}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-gray-200 p-4 text-sm text-gray-600">
                      No check-ins yet. Upload your first weekly photo to start tracking.
                    </div>
                  )}

                  {recentWeeklyPhotos.length > 1 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-800">
                        Recent check-ins
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {recentWeeklyPhotos.map((photo, idx) => (
                          <div
                            key={photo.id}
                            className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-2"
                          >
                            <img
                              src={photo.url}
                              alt={`Weekly progress ${idx + 1}`}
                              className="w-full h-32 object-cover rounded-md bg-gray-50"
                            />
                            <p className="text-xs text-gray-600">
                              {new Date(photo.takenAt || photo.createdAt).toLocaleDateString(
                                "en-US",
                                { month: "short", day: "numeric", year: "numeric" }
                              )}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <PhotoUpload
                    routineId={routine?.id}
                    type="after"
                    label={
                      lastWeeklyPhoto
                        ? "Add another weekly progress photo"
                        : "Select weekly progress photo"
                    }
                    buttonLabel="Upload check-in photo"
                    inputId="weekly-photo-upload"
                    enableNotes
                    noteLabel="Add a quick note (optional)"
                    notePlaceholder="Describe changes, triggers, or products you used this week."
                    onUploadSuccess={handleWeeklyUploadSuccess}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              AI Analysis
            </h2>
            {latestAnalysis ? (
              <AnalysisTimelineView
                timeline={latestAnalysis.timeline || []}
                interactions={latestAnalysis.interactions}
                recommendations={latestAnalysis.recommendations}
                productNames={allProductsForAnalysis.reduce(
                  (acc, p) => ({ ...acc, [p.id]: p.name }),
                  {}
                )}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-4">
                  Add products to your routine and click "Analyze Routine with AI"
                  to get personalized insights
                </p>
                <Link
                  href="/progress"
                  className="text-indigo-600 hover:text-indigo-700"
                >
                  View Progress →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {showProgressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-3xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Weekly Progress Photos
              </h3>
              <div className="flex items-center gap-3">
                {calendarDates.length > 0 && (
                  <button
                    onClick={() => setShowCalendarPicker((prev) => !prev)}
                    className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                  >
                    {showCalendarPicker ? "Hide calendar" : "Calendar view"}
                  </button>
                )}
                <button
                  onClick={() => setShowProgressModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close progress modal"
                >
                  ✕
                </button>
              </div>
            </div>
            {showCalendarPicker && calendarDates.length > 0 && (
              <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-sm font-medium text-gray-800 mb-2">Jump to date</p>
                <div className="flex flex-wrap gap-2">
                  {calendarDates.map((dateKey) => (
                    <button
                      key={dateKey}
                      onClick={() => handleSelectCalendarDate(dateKey)}
                      className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white hover:bg-indigo-50 hover:border-indigo-200 text-gray-900"
                    >
                      {new Date(dateKey).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {weeklyPhotos.length > 0 ? (
              <div className="flex flex-col items-center">
                <div className="w-full flex items-center justify-between gap-4">
                  {showProgressNavigation ? (
                    <button
                      onClick={handlePrevPhoto}
                      className="h-10 w-10 flex items-center justify-center rounded-full border text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                      aria-label="Previous photo"
                    >
                      {"<"}
                    </button>
                  ) : (
                    <div className="w-10 h-10" aria-hidden />
                  )}
                  <div className="flex-1 flex flex-col items-center">
                    {currentProgressPhoto && (
                      <>
                        <img
                          src={currentProgressPhoto.url}
                          alt="Weekly progress"
                          className="max-h-[400px] w-full object-contain rounded-lg bg-gray-50"
                        />
                        <div className="mt-4 text-center space-y-2">
                          <p className="text-sm text-gray-900 whitespace-pre-wrap">
                            {currentProgressPhoto.note &&
                            currentProgressPhoto.note.trim()
                              ? currentProgressPhoto.note
                              : "No note added for this check-in."}
                          </p>
                          <p className="text-xs text-gray-500">
                            Taken{" "}
                            {new Date(
                              currentProgressPhoto.takenAt ||
                                currentProgressPhoto.createdAt
                            ).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                  {showProgressNavigation ? (
                    <button
                      onClick={handleNextPhoto}
                      className="h-10 w-10 flex items-center justify-center rounded-full border text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                      aria-label="Next photo"
                    >
                      {">"}
                    </button>
                  ) : (
                    <div className="w-10 h-10" aria-hidden />
                  )}
                </div>
                <p className="mt-4 text-xs text-gray-500">
                  Photo {currentPhotoIndex + 1} of {weeklyPhotos.length}
                </p>
                {currentProgressPhoto && (
                  <button
                    onClick={() => handleDeleteWeeklyPhoto(currentProgressPhoto.id)}
                    disabled={deletingWeeklyPhotoId === currentProgressPhoto.id}
                    className="mt-3 text-sm text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 disabled:opacity-50"
                  >
                    {deletingWeeklyPhotoId === currentProgressPhoto.id
                      ? "Deleting..."
                      : "Delete photo"}
                  </button>
                )}
              </div>
            ) : (
              <p className="text-center text-gray-500">
                No weekly progress photos yet.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
