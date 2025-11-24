"use client";

import { useState } from "react";

interface Photo {
  id: string;
  url: string;
  type: string;
  takenAt: string;
}

interface BeforeAfterComparisonProps {
  beforePhoto: Photo;
  afterPhoto: Photo;
}

export default function BeforeAfterComparison({
  beforePhoto,
  afterPhoto,
}: BeforeAfterComparisonProps) {
  const [sliderPosition, setSliderPosition] = useState(50);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  const beforeDate = new Date(beforePhoto.takenAt).toLocaleDateString();
  const afterDate = new Date(afterPhoto.takenAt).toLocaleDateString();
  const daysDiff = Math.floor(
    (new Date(afterPhoto.takenAt).getTime() -
      new Date(beforePhoto.takenAt).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>
          <span className="font-medium">Before:</span> {beforeDate}
        </div>
        <div className="text-indigo-600 font-medium">
          {daysDiff} days later
        </div>
        <div>
          <span className="font-medium">After:</span> {afterDate}
        </div>
      </div>

      <div
        className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-gray-300 cursor-col-resize"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setSliderPosition(50)}
      >
        {/* After image (background) */}
        <div className="absolute inset-0">
          <img
            src={afterPhoto.url}
            alt="After"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Before image (foreground with clip) */}
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <img
            src={beforePhoto.url}
            alt="Before"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Slider line */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-lg z-10"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 9l4-4 4 4m0 6l-4 4-4-4"
              />
            </svg>
          </div>
        </div>

        {/* Labels */}
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm font-medium">
          Before
        </div>
        <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm font-medium">
          After
        </div>
      </div>

      <p className="text-sm text-gray-500 text-center">
        Drag the slider or move your mouse to compare
      </p>
    </div>
  );
}

