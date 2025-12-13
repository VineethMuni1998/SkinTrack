"use client";

interface TimelineItem {
  productId: string;
  productName: string;
  expectedResultsTime: string;
  description: string;
}

interface Interaction {
  conflicts?: Array<{
    productIds: string[];
    reason: string;
    recommendation: string;
  }>;
  synergies?: Array<{
    productIds: string[];
    benefit: string;
    description: string;
  }>;
}

interface AnalysisTimelineViewProps {
  timeline: TimelineItem[];
  interactions?: Interaction;
  recommendations?: string[];
  overallTimeline?: string;
  productNames?: Record<string, string>;
}

export default function AnalysisTimelineView({
  timeline,
  interactions,
  recommendations,
  overallTimeline,
  productNames = {},
}: AnalysisTimelineViewProps) {
  const synergies = interactions?.synergies ?? [];
  const conflicts = interactions?.conflicts ?? [];
  const hasSynergies = synergies.length > 0;
  const hasConflicts = conflicts.length > 0;

  return (
    <div className="space-y-6">
      {overallTimeline && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Overall Timeline</h3>
          <p className="text-blue-800">{overallTimeline}</p>
        </div>
      )}

      {timeline.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Expected Results Timeline
          </h3>
          <div className="space-y-4">
            {timeline.map((item, index) => (
              <div
                key={item.productId || index}
                className="border-l-4 border-amber-500 pl-4 py-2"
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-gray-900">
                    {item.productName}
                  </h4>
                  <span className="text-sm font-medium text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                    {item.expectedResultsTime}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {(hasSynergies || hasConflicts) && (
        <div>
          <h3 className="text-lg font-semibold text-green-900 mb-4">
            Product Synergies
          </h3>
          <div className="space-y-3">
            {hasSynergies &&
              synergies.map((synergy, index) => (
                <div
                  key={index}
                  className="bg-green-50 border border-green-200 rounded-lg p-4"
                >
                  <p className="font-medium text-green-900 mb-2">
                    {synergy.productIds
                      .map((id) => productNames[id] || id)
                      .join(" + ")}
                  </p>
                  <p className="text-sm font-semibold text-green-800 mb-1">
                    {synergy.benefit}
                  </p>
                  <p className="text-sm text-green-700">
                    {synergy.description}
                  </p>
                </div>
              ))}

            {hasConflicts && (
              <div className="space-y-3 border-t border-red-100 pt-4 mt-2">
                <p className="text-sm font-semibold text-red-900">
                  Not recommended together
                </p>
                {conflicts.map((conflict, index) => (
                  <div
                    key={index}
                    className="bg-red-50 border border-red-200 rounded-lg p-4"
                  >
                    <p className="font-medium text-red-900 mb-2">
                      {conflict.productIds
                        .map((id) => productNames[id] || id)
                        .join(" + ")}
                    </p>
                    <p className="text-sm text-red-800 mb-2">
                      {conflict.reason}
                    </p>
                    <p className="text-sm font-medium text-red-900">
                      Recommendation: {conflict.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {recommendations && recommendations.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recommendations
          </h3>
          <ul className="space-y-2">
            {recommendations.map((rec, index) => (
              <li key={index} className="flex items-start">
                <span className="text-amber-700 mr-2">•</span>
                <span className="text-gray-700">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
