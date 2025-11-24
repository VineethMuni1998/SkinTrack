"use client";

import { useState } from "react";

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

interface TimelineViewProps {
  events: TimelineEvent[];
  routineId?: string;
  onProductRemove?: (productId: string, routineProductId?: string) => void;
  onTimeframeUpdate?: (routineProductId: string, timeframe: string) => void;
  onRefresh?: () => void;
}

export default function TimelineView({
  events,
  routineId,
  onProductRemove,
  onTimeframeUpdate,
  onRefresh,
}: TimelineViewProps) {
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showTimeframeModal, setShowTimeframeModal] = useState(false);
  const [removingProduct, setRemovingProduct] = useState<TimelineEvent | null>(null);
  const [editingTimeframe, setEditingTimeframe] = useState<TimelineEvent | null>(null);
  const [newTimeframe, setNewTimeframe] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingPhotoType, setUploadingPhotoType] = useState<"before" | "after" | null>(null);
  const [uploadingProductId, setUploadingProductId] = useState<string | null>(null);
  const [showRemovedProducts, setShowRemovedProducts] = useState(true);
  const [removalReason, setRemovalReason] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<TimelineEvent | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getDateKey = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toISOString().split("T")[0]; // YYYY-MM-DD
  };

  // Filter events based on showRemovedProducts toggle
  const filteredEvents = showRemovedProducts
    ? events
    : events.filter((event) => !event.isRemoved);

  // Group events by date
  const groupedEvents = filteredEvents.reduce((acc, event) => {
    const dateKey = getDateKey(event.timestamp);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, TimelineEvent[]>);

  // Sort date keys chronologically
  const sortedDateKeys = Object.keys(groupedEvents).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  const handleRemoveClick = (event: TimelineEvent) => {
    if (event.isRemoved) return; // Can't remove already removed products
    setRemovingProduct(event);
    setRemovalReason("");
    setShowRemoveModal(true);
  };

  const handleDeleteClick = (event: TimelineEvent) => {
    if (!event.isRemoved) return;
    setDeletingProduct(event);
    setShowDeleteModal(true);
  };

  const handleEditTimeframe = (event: TimelineEvent) => {
    setEditingTimeframe(event);
    setNewTimeframe(event.expectedResultsTimeframe || "");
    setShowTimeframeModal(true);
  };

  const handlePhotoUpload = async (
    event: TimelineEvent,
    type: "before" | "after",
    file: File
  ) => {
    if (!routineId) return;

    setUploadingPhoto(true);
    setUploadingPhotoType(type);
    setUploadingProductId(event.routineProductId);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);
      formData.append("routineId", routineId);
      formData.append("routineProductId", event.routineProductId);

      const response = await fetch("/api/photos/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload photo");
      }

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
      alert("Failed to upload photo. Please try again.");
    } finally {
      setUploadingPhoto(false);
      setUploadingPhotoType(null);
      setUploadingProductId(null);
    }
  };

  const handleRemoveConfirm = async () => {
    if (!removingProduct || !routineId) return;

    setUploadingPhoto(true);
    try {
      const productId = removingProduct.productId;
      const routineProductId = removingProduct.routineProductId;

      const params = new URLSearchParams();
      if (routineProductId) {
        params.set("routineProductId", routineProductId);
      }
      if (productId) {
        params.set("productId", productId);
      }

      const response = await fetch(
        `/api/routines/${routineId}/products?${params.toString()}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            removalReason: removalReason.trim() || null,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove product");
      }

      setShowRemoveModal(false);
      setRemovingProduct(null);
      setRemovalReason("");

      if (onRefresh) {
        onRefresh();
      }
      if (onProductRemove && productId) {
        onProductRemove(productId, routineProductId);
      }
    } catch (error) {
      console.error("Error removing product:", error);
      alert("Failed to remove product. Please try again.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleTimeframeSave = async () => {
    if (!editingTimeframe || !routineId) return;

    try {
      const response = await fetch(
        `/api/routines/${routineId}/products/${editingTimeframe.productId}/timeframe`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            expectedResultsTimeframe: newTimeframe || null,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update timeframe");
      }

      setShowTimeframeModal(false);
      setEditingTimeframe(null);
      setNewTimeframe("");

      if (onRefresh) {
        onRefresh();
      }
      if (onTimeframeUpdate) {
        onTimeframeUpdate(editingTimeframe.routineProductId, newTimeframe);
      }
    } catch (error) {
      console.error("Error updating timeframe:", error);
      alert("Failed to update timeframe. Please try again.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProduct || !routineId || !deletingProduct.routineProductId)
      return;

    setIsDeletingProduct(true);
    try {
      const params = new URLSearchParams();
      params.set("routineProductId", deletingProduct.routineProductId);
      params.set("permanent", "true");

      const response = await fetch(
        `/api/routines/${routineId}/products?${params.toString()}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove product entry");
      }

      setShowDeleteModal(false);
      setDeletingProduct(null);

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to remove product entry. Please try again.");
    } finally {
      setIsDeletingProduct(false);
    }
  };

  const handlePhotoFileChange = (
    event: TimelineEvent,
    type: "before" | "after",
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePhotoUpload(event, type, file);
    }
  };

  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No timeline events yet. Add products to your routine to see them here.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Toggle for showing/hiding removed products */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showRemoved"
            checked={showRemovedProducts}
            onChange={(e) => setShowRemovedProducts(e.target.checked)}
            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <label htmlFor="showRemoved" className="text-sm text-gray-700 cursor-pointer">
            Show removed products
          </label>
        </div>
      </div>

      {/* Horizontal Timeline */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute top-12 left-0 right-0 h-1 bg-gray-200 z-0" />

        {/* Events Container */}
        <div className="relative overflow-x-auto pb-8" style={{ scrollBehavior: "smooth" }}>
          <div className="flex gap-8 px-4 min-w-max">
            {sortedDateKeys.map((dateKey) => {
              const dateEvents = groupedEvents[dateKey];
              const firstEvent = dateEvents[0];
              const displayDate = formatDate(firstEvent.timestamp);

              return (
                <div
                  key={dateKey}
                  className="flex flex-col items-center relative z-10"
                  style={{ minWidth: "250px" }}
                >
                  {/* Timeline Dot */}
                  <div className="w-6 h-6 rounded-full border-4 border-white z-10 bg-indigo-500" />

                  {/* Date Label */}
                  <div className="mt-2 mb-2 text-xs font-semibold text-gray-700">
                    {displayDate}
                  </div>

                  {/* Stacked Events for this date */}
                  <div className="flex flex-col gap-3 w-full">
                    {dateEvents.map((event) => {
                      const isEnded = event.isRemoved;
                      const isUploadingBefore =
                        uploadingPhoto &&
                        uploadingPhotoType === "before" &&
                        uploadingProductId === event.routineProductId;
                      const isUploadingAfter =
                        uploadingPhoto &&
                        uploadingPhotoType === "after" &&
                        uploadingProductId === event.routineProductId;

                      return (
                        <div
                          key={event.id}
                          className={`p-4 rounded-lg shadow-md w-full ${
                            isEnded
                              ? "bg-red-50 border-2 border-red-200"
                              : "bg-green-50 border-2 border-green-200"
                          }`}
                        >
                          {/* Time */}
                          <div className="text-xs text-gray-500 mb-2">
                            {formatTime(event.timestamp)}
                          </div>

                          {/* Product Name and Status */}
                          <div className="flex items-center gap-2 mb-2">
                            <div className="font-semibold text-gray-900">
                              {event.productName}
                            </div>
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${
                                isEnded
                                  ? "bg-red-200 text-red-800"
                                  : "bg-green-200 text-green-800"
                              }`}
                            >
                              {isEnded ? "Ended" : "Started"}
                            </span>
                          </div>

                          {/* Expected Timeframe */}
                          {event.expectedResultsTimeframe && !isEnded && (
                            <div className="text-xs text-indigo-600 mb-2">
                              Expected: {event.expectedResultsTimeframe}
                            </div>
                          )}

                          {/* Timeframe Passed Warning */}
                          {event.isTimeframePassed && !isEnded && (
                            <div className="text-xs text-red-600 font-semibold mb-2">
                              ⚠️ Timeframe passed
                            </div>
                          )}

                          {/* Removal Reason */}
                          {isEnded && event.removalReason && (
                            <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-700">
                              <div className="font-medium mb-1">Reason:</div>
                              <div>{event.removalReason}</div>
                            </div>
                          )}

                          {/* Before/After Photos */}
                          <div className="mt-3 space-y-2">
                            {/* Before Photo Section */}
                            {!isEnded && (
                              <div className="border border-gray-200 rounded p-2 bg-white">
                                <div className="text-xs font-medium text-gray-700 mb-2">
                                  Before Photo
                                </div>
                                {event.beforePhotoUrl ? (
                                  <div className="relative">
                                    <img
                                      src={event.beforePhotoUrl}
                                      alt="Before"
                                      className="w-full h-32 object-cover rounded cursor-pointer"
                                      onClick={() => event.beforePhotoUrl && setSelectedPhotoUrl(event.beforePhotoUrl)}
                                    />
                                  </div>
                                ) : (
                                  <div>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      id={`before-${event.routineProductId}`}
                                      className="hidden"
                                      onChange={(e) => handlePhotoFileChange(event, "before", e)}
                                      disabled={isUploadingBefore || isEnded}
                                    />
                                    <label
                                      htmlFor={`before-${event.routineProductId}`}
                                      className={`block text-center text-xs py-2 px-3 rounded cursor-pointer ${
                                        isUploadingBefore || isEnded
                                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                          : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                                      }`}
                                    >
                                      {isUploadingBefore ? "Uploading..." : "Upload Before Photo"}
                                    </label>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* After Photo Section */}
                            {isEnded && (
                              <div className="border border-gray-200 rounded p-2 bg-white">
                                <div className="text-xs font-medium text-gray-700 mb-2">
                                  After Photo
                                </div>
                                {event.afterPhotoUrl ? (
                                  <div className="relative">
                                    <img
                                      src={event.afterPhotoUrl}
                                      alt="After"
                                    className="w-full h-32 object-cover rounded cursor-pointer"
                                    onClick={() => event.afterPhotoUrl && setSelectedPhotoUrl(event.afterPhotoUrl)}
                                    />
                                  </div>
                                ) : (
                                  <div>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      id={`after-${event.routineProductId}`}
                                      className="hidden"
                                      onChange={(e) => handlePhotoFileChange(event, "after", e)}
                                      disabled={isUploadingAfter}
                                    />
                                    <label
                                      htmlFor={`after-${event.routineProductId}`}
                                      className={`block text-center text-xs py-2 px-3 rounded cursor-pointer ${
                                        isUploadingAfter
                                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                          : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                                      }`}
                                    >
                                      {isUploadingAfter ? "Uploading..." : "Upload After Photo"}
                                    </label>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          {!isEnded && (
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => handleEditTimeframe(event)}
                                className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                              >
                                Edit Timeframe
                              </button>
                              <button
                                onClick={() => handleRemoveClick(event)}
                                className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                              >
                                End Product
                              </button>
                            </div>
                          )}
                          {isEnded && (
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => handleDeleteClick(event)}
                                className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100"
                              >
                                Remove Entry
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Remove Product Modal */}
      {showRemoveModal && removingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              End Product
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to end <strong>{removingProduct.productName}</strong>?
            </p>
            {removingProduct.expectedResultsTimeframe && (
              <p className="text-xs text-gray-500 mb-4">
                Expected results: {removingProduct.expectedResultsTimeframe}
                {removingProduct.timeSinceAddition !== undefined && (
                  <span className="ml-2">
                    (Used for {removingProduct.timeSinceAddition} days)
                  </span>
                )}
              </p>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for ending (Optional)
              </label>
              <textarea
                value={removalReason}
                onChange={(e) => setRemovalReason(e.target.value)}
                placeholder="e.g., Didn't see results, caused irritation, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRemoveConfirm}
                disabled={uploadingPhoto}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingPhoto ? "Ending..." : "End Product"}
              </button>
              <button
                onClick={() => {
                  setShowRemoveModal(false);
                  setRemovingProduct(null);
                  setRemovalReason("");
                }}
                disabled={uploadingPhoto}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Product Modal */}
      {showDeleteModal && deletingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Remove Product Entry
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Remove <strong>{deletingProduct.productName}</strong> from your timeline? This will delete the ended entry so you can reassign it.
            </p>
            <p className="text-xs text-gray-500 mb-4">
              This action only deletes the timeline entry.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeletingProduct}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeletingProduct ? "Removing..." : "Remove Entry"}
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingProduct(null);
                }}
                disabled={isDeletingProduct}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Timeframe Modal */}
      {showTimeframeModal && editingTimeframe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Edit Expected Results Timeframe
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Product: <strong>{editingTimeframe.productName}</strong>
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Results Timeframe
              </label>
              <input
                type="text"
                value={newTimeframe}
                onChange={(e) => setNewTimeframe(e.target.value)}
                placeholder="e.g., 2-4 weeks, 1 month"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Examples: "2-4 weeks", "1 month", "6 weeks"
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleTimeframeSave}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowTimeframeModal(false);
                  setEditingTimeframe(null);
                  setNewTimeframe("");
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Preview Modal */}
      {selectedPhotoUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setSelectedPhotoUrl(null)}
        >
          <img
            src={selectedPhotoUrl}
            alt="Full size photo"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  );
}
