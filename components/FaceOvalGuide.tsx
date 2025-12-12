"use client";

interface FaceOvalGuideProps {
  isActive?: boolean;
}

export default function FaceOvalGuide({ isActive = true }: FaceOvalGuideProps) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg
        className="w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* Semi-transparent overlay outside the oval */}
        <defs>
          <mask id="oval-mask">
            <rect width="100" height="100" fill="white" />
            {/* Oval cutout - vertical portrait orientation for face */}
            <ellipse
              cx="50"
              cy="50"
              rx="18"
              ry="36"
              fill="black"
            />
          </mask>
        </defs>

        {/* Dark overlay with oval cutout */}
        <rect
          width="100"
          height="100"
          fill="black"
          opacity="0.4"
          mask="url(#oval-mask)"
        />

        {/* Oval border */}
        <ellipse
          cx="50"
          cy="50"
          rx="18"
          ry="36"
          fill="none"
          stroke={isActive ? "#6366f1" : "#10b981"}
          strokeWidth="0.5"
          strokeDasharray={isActive ? "2,1" : "0"}
          className={isActive ? "animate-pulse" : ""}
        />

        {/* Guide markers at top, bottom, left, right */}
        <line
          x1="50"
          y1="12"
          x2="50"
          y2="15"
          stroke="#6366f1"
          strokeWidth="0.5"
        />
        <line
          x1="50"
          y1="85"
          x2="50"
          y2="88"
          stroke="#6366f1"
          strokeWidth="0.5"
        />
        <line
          x1="30"
          y1="50"
          x2="32"
          y2="50"
          stroke="#6366f1"
          strokeWidth="0.5"
        />
        <line
          x1="68"
          y1="50"
          x2="70"
          y2="50"
          stroke="#6366f1"
          strokeWidth="0.5"
        />
      </svg>

      {/* Instruction text */}
      <div className="absolute top-2 left-0 right-0 text-center">
        <p className="text-white text-xs sm:text-sm font-medium drop-shadow-lg bg-black bg-opacity-50 inline-block px-3 py-1 rounded-full">
          {isActive ? "Position your face in the oval" : "Perfect! Ready to capture"}
        </p>
      </div>
    </div>
  );
}
