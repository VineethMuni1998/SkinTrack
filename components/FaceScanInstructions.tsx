"use client";

import { AlertCircle, Check, X } from "lucide-react";

interface FaceScanInstructionsProps {
  variant?: "compact" | "detailed";
}

export default function FaceScanInstructions({ variant = "detailed" }: FaceScanInstructionsProps) {
  if (variant === "compact") {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-4 h-4 text-amber-700" />
          <span className="text-sm font-medium text-amber-900">
            Photo Guidelines
          </span>
        </div>

        <div className="space-y-2 text-xs text-amber-900">
          <p className="font-medium">For best results:</p>
          <ul className="space-y-1 ml-4">
            <li className="flex items-start gap-1">
              <Check className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
              Face clear and forward, hair tied back
            </li>
            <li className="flex items-start gap-1">
              <Check className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
              Well-lit environment, no makeup
            </li>
            <li className="flex items-start gap-1">
              <Check className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
              Face occupies 60-80% of image
            </li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <h3 className="text-base font-semibold text-gray-900">
        Get Ready to Start Skin Analysis
      </h3>

      {/* Preparation Instructions */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">Before you begin:</p>
        <ul className="space-y-1.5 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            Take off your glasses and make sure bangs are not covering your forehead
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            Make sure that you're in a well-lit environment
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            Remove makeup to get more accurate results
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            Look straight into the camera and keep your face in the center
          </li>
        </ul>
      </div>

      {/* Photo Requirements */}
      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
        <p className="text-sm font-medium text-gray-700">Photo requirements:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Recommendations */}
          <div className="space-y-1">
            <p className="font-semibold text-green-700 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              Recommendation
            </p>
            <ul className="space-y-1 text-gray-600 ml-5">
              <li>Choose a photo where the face is clear and facing forward</li>
              <li>Best to tie your hair up or brush your hair to the back</li>
            </ul>
          </div>

          {/* Things to Avoid */}
          <div className="space-y-1">
            <p className="font-semibold text-red-700 flex items-center gap-1">
              <X className="w-3.5 h-3.5" />
              Avoid
            </p>
            <ul className="space-y-1 text-gray-600 ml-5">
              <li>Avoid photos of side face or hair covering shoulders</li>
              <li>Avoid hands or objects covering your face</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Technical Requirements */}
      <div className="border-l-4 border-amber-400 bg-amber-50 p-3 space-y-1">
        <p className="text-sm font-semibold text-amber-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Important
        </p>
        <p className="text-xs text-amber-800">
          The face should occupy approximately 60-80% of the image width, without any overlays or obstructions.
          The lighting should be bright and evenly distributed, avoiding overexposure or blown-out highlights.
          The pose should be front-facing, neutral, and relaxed, with the mouth closed and eyes open.
        </p>
      </div>
    </div>
  );
}
