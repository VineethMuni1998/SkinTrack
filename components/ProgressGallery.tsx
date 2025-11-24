"use client";

interface Photo {
  id: string;
  url: string;
  type: string;
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
}

export default function ProgressGallery({
  photos,
  onPhotoClick,
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
                className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 cursor-pointer hover:border-indigo-500 transition"
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
                className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 cursor-pointer hover:border-indigo-500 transition"
                onClick={() => onPhotoClick?.(photo)}
              >
                <img
                  src={photo.url}
                  alt="After photo"
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
    </div>
  );
}

