"use client";

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

interface ProgressGalleryProps {
  photos: Photo[];
  onPhotoClick?: (photo: Photo) => void;
  onDelete?: (photo: Photo) => void;
}

export default function ProgressGallery({
  photos,
  onPhotoClick,
  onDelete,
}: ProgressGalleryProps) {
  if (photos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No photos uploaded yet
      </div>
    );
  }

  // Separate before and after photos
  const beforePhotos = photos.filter((p) => p.type === "before");
  const afterPhotos = photos.filter((p) => p.type === "after");

  return (
    <div className="space-y-6">
      {beforePhotos.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Before Photos</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {beforePhotos.map((photo) => (
              <div
                key={photo.id}
                className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 cursor-pointer hover:border-amber-500 transition"
                onClick={() => onPhotoClick?.(photo)}
              >
                <img
                  src={photo.url}
                  alt="Before photo"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2">
                  <div>{new Date(photo.takenAt).toLocaleDateString()}</div>
                  {photo.product && (
                    <div className="font-semibold mt-1">{photo.product.name}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {afterPhotos.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Photos</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {afterPhotos.map((photo) => (
              <div
                key={photo.id}
                className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 cursor-pointer hover:border-amber-500 transition group"
                onClick={() => onPhotoClick?.(photo)}
              >
                <img
                  src={photo.url}
                  alt="After photo"
                  className="w-full h-full object-cover"
                />
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(photo);
                    }}
                    className="absolute top-2 right-2 h-8 w-8 flex items-center justify-center rounded-full bg-white/90 text-gray-800 border border-gray-200 opacity-0 group-hover:opacity-100 transition hover:bg-white"
                    aria-label="Delete photo"
                  >
                    ✕
                  </button>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2">
                  <div>{new Date(photo.takenAt).toLocaleDateString()}</div>
                  {photo.product && (
                    <div className="font-semibold mt-1">{photo.product.name}</div>
                  )}
                  {photo.note && photo.note.trim() && (
                    <div className="mt-1 text-[11px] opacity-80 max-h-9 overflow-hidden">
                      {photo.note}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
