"use client";

import { CheckCircle } from "lucide-react";

interface SkinAnalysisResult {
  skinType: 'DRY' | 'OILY' | 'COMBINATION' | 'NORMAL' | 'UNKNOWN';
  confidence: number;
  concerns: {
    wrinkles: number;
    spots: number;
    redness: number;
    acne: number;
    oiliness: number;
    darkCircles: number;
    texture: number;
    moisture: number;
  };
}

interface SkinAnalysisResultsProps {
  analysis: SkinAnalysisResult;
  onConfirm: () => void;
  onRetry: () => void;
  isLoading?: boolean;
}

function ConcernCard({ concern, severity }: { concern: string; severity: number }) {
  const getSeverityColor = (val: number) => {
    if (val < 30) return 'text-green-700 bg-green-50 border-green-200';
    if (val < 60) return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    return 'text-red-700 bg-red-50 border-red-200';
  };

  const getSeverityLabel = (val: number) => {
    if (val < 30) return 'Low';
    if (val < 60) return 'Moderate';
    return 'High';
  };

  // Format concern name (camelCase to Title Case)
  const formatConcernName = (name: string) => {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  return (
    <div className={`p-4 rounded-lg border ${getSeverityColor(severity)}`}>
      <div className="flex justify-between items-start mb-1">
        <div className="font-medium">{formatConcernName(concern)}</div>
        <div className="text-xs font-semibold">{getSeverityLabel(severity)}</div>
      </div>
      <div className="text-2xl font-bold">{Math.round(severity)}%</div>
    </div>
  );
}

export default function SkinAnalysisResults({
  analysis,
  onConfirm,
  onRetry,
  isLoading = false,
}: SkinAnalysisResultsProps) {
  // Filter out concerns with 0 severity or very low values
  const significantConcerns = Object.entries(analysis.concerns)
    .filter(([_, value]) => value > 10)
    .sort((a, b) => b[1] - a[1]); // Sort by severity descending

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Your Skin Analysis Results
        </h2>
        <p className="text-sm text-gray-600">
          Based on AI-powered facial analysis
        </p>
      </div>

      {/* Primary Result - Skin Type */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-700 rounded-xl p-6 text-white text-center">
        <div className="flex items-center justify-center mb-2">
          <CheckCircle className="w-6 h-6 mr-2" />
          <span className="text-lg font-medium">Detected Skin Type</span>
        </div>
        <div className="text-5xl font-bold mb-2">
          {analysis.skinType === 'UNKNOWN' ? 'Unable to Detect' : analysis.skinType}
        </div>
        <div className="text-sm opacity-90">
          {Math.round(analysis.confidence)}% confidence
        </div>
        {analysis.confidence < 30 && (
          <div className="mt-3 text-sm bg-white/20 rounded-lg p-2">
            Low confidence. You may want to verify manually.
          </div>
        )}
      </div>

      {/* Skin Concerns Grid */}
      {significantConcerns.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Detected Skin Concerns
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {significantConcerns.map(([concern, severity]) => (
              <ConcernCard
                key={concern}
                concern={concern}
                severity={severity}
              />
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="flex-1 bg-amber-700 text-white py-3 px-6 rounded-lg hover:bg-amber-800 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Getting Recommendations...
            </span>
          ) : (
            'Use This Result'
          )}
        </button>
        <button
          onClick={onRetry}
          disabled={isLoading}
          className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Scan Again
        </button>
      </div>

      {/* Information Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> This analysis is based on AI technology and should be used as a guide.
          For medical concerns, please consult a dermatologist.
        </p>
      </div>
    </div>
  );
}
