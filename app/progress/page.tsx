"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import ProgressGallery from "@/components/ProgressGallery";
import BeforeAfterComparison from "@/components/BeforeAfterComparison";
import PhotoUpload from "@/components/PhotoUpload";

interface Photo {
  id: string;
  url: string;
  type: string;
  note?: string | null;
  takenAt: string;
  createdAt: string;
  product?: {
    id: string;
    name: string;
  } | null;
}

interface Routine {
  id: string;
  name?: string;
  status?: string;
  startDate: string;
  routineProducts: Array<{
    product: {
      id: string;
      name: string;
    };
  }>;
}

export default function ProgressPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBefore, setSelectedBefore] = useState<Photo | null>(null);
  const [selectedAfter, setSelectedAfter] = useState<Photo | null>(null);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [notePhoto, setNotePhoto] = useState<Photo | null>(null);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    try {
      // Fetch routine
      const routineResponse = await fetch("/api/routines");
      const routineData = await routineResponse.json();
      const routines = routineData.routines || [];
      const activeRoutine = routines.find((r: Routine) => r.status === "active") || routines[0];
      setRoutine(activeRoutine);

      // Fetch photos
      const photosResponse = await fetch(
        activeRoutine
          ? `/api/photos?routineId=${activeRoutine.id}`
          : "/api/photos"
      );
      const photosData = await photosResponse.json();
      setPhotos(photosData.photos || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    setDeletingPhotoId(photoId);
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
      setNotePhoto(null);
      await fetchData();
    } catch (error) {
      console.error("Delete photo error:", error);
      alert(
        error instanceof Error ? error.message : "Failed to delete photo"
      );
    } finally {
      setDeletingPhotoId(null);
    }
  };

  const handlePhotoClick = (photo: Photo) => {
    // Always open the large view modal, even if there is no note.
    setNotePhoto(photo);
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const beforePhotos = photos.filter((p) => p.type === "before");
  const afterPhotos = photos.filter((p) => p.type === "after");

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Progress</h1>
                <p className="mt-2 text-gray-600">
                  Track your skincare journey with before and after photos
                </p>
              </div>
              <button
                onClick={() => setShowPhotoUpload(!showPhotoUpload)}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
              >
                {showPhotoUpload ? "Cancel" : "Upload Photo"}
              </button>
            </div>
          </div>

          {showPhotoUpload && (
            <div className="mb-8 bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Upload Progress Photo
              </h2>
              <PhotoUpload
                routineId={routine?.id}
                type="after"
                enableNotes
                noteLabel="Add a quick note (optional)"
                notePlaceholder="Describe changes, triggers, or what you noticed."
                onUploadSuccess={() => {
                  setShowPhotoUpload(false);
                  fetchData();
                }}
              />
            </div>
          )}

          {selectedBefore && selectedAfter ? (
            <div className="mb-8 bg-white rounded-lg shadow p-6">
              <button
                onClick={() => {
                  setSelectedBefore(null);
                  setSelectedAfter(null);
                }}
                className="mb-4 text-sm text-gray-600 hover:text-gray-900"
              >
                ← Back to gallery
              </button>
              <BeforeAfterComparison
                beforePhoto={selectedBefore}
                afterPhoto={selectedAfter}
              />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <ProgressGallery
                photos={photos}
                onPhotoClick={handlePhotoClick}
                onViewNote={(photo) => setNotePhoto(photo)}
                onDelete={(photo) => handleDeletePhoto(photo.id)}
              />
            </div>
          )}

          {routine && routine.routineProducts.length > 0 && (
            <div className="mt-8 bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Current Routine
              </h2>
              <div className="flex flex-wrap gap-2">
                {routine.routineProducts.map((rp) => (
                  <span
                    key={rp.product.id}
                    className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                  >
                    {rp.product.name}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-sm text-gray-600">
                Started: {new Date(routine.startDate).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {notePhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
          onClick={() => setNotePhoto(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-6 max-w-xl w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Photo note</h3>
              <button
                onClick={() => setNotePhoto(null)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close note modal"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <img
                src={notePhoto.url}
                alt="Progress"
                className="w-full max-h-[360px] object-contain rounded-lg bg-gray-50"
              />
              <div className="text-sm text-gray-600">
                Taken{" "}
                {new Date(
                  notePhoto.takenAt || notePhoto.createdAt
                ).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </div>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                {notePhoto.note && notePhoto.note.trim()
                  ? notePhoto.note
                  : "No note added for this photo."}
              </p>
              <div className="flex justify-end">
                <button
                  onClick={() => handleDeletePhoto(notePhoto.id)}
                  disabled={deletingPhotoId === notePhoto.id}
                  className="text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 disabled:opacity-50"
                >
                  {deletingPhotoId === notePhoto.id ? "Deleting..." : "Delete photo"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
