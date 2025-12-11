"use client";

interface Product {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  ingredients?: string;
  timeOfDay?: string;
  routineProductId?: string;
  stepOrder?: number;
  skipDays?: string[];
}

interface ProductListProps {
  products: Product[];
  onRemove?: (productId: string, timeOfDay?: string, routineProductId?: string) => void;
  showRemove?: boolean;
  emptyLabel?: string;
  onReorder?: (
    routineProductId: string,
    direction: "up" | "down",
    context?: "MORNING" | "NIGHT"
  ) => void;
  onMergeWithPrevious?: (routineProductId: string, targetStepOrder: number) => void;
  onUnmerge?: (routineProductId: string, nextStepOrder: number) => void;
  onEdit?: (routineProductId: string, currentSkipDays: string[]) => void;
  timeOfDayContext?: "MORNING" | "NIGHT";
  reorderingProductId?: string | null;
}

const formatTimeOfDay = (value?: string) => {
  if (!value) return "";
  if (value === "MORNING") return "Morning";
  if (value === "NIGHT") return "Night";
  return "All Day";
};

const formatSkipDays = (days?: string[]) => {
  if (!days || days.length === 0) return "Daily";
  const shortMap: Record<string, string> = {
    MONDAY: "Mon",
    TUESDAY: "Tue",
    WEDNESDAY: "Wed",
    THURSDAY: "Thu",
    FRIDAY: "Fri",
    SATURDAY: "Sat",
    SUNDAY: "Sun",
  };
  const formatted = days.map((d) => shortMap[d] || d);
  return `Skips ${formatted.join(", ")}`;
};

export default function ProductList({
  products,
  onRemove,
  showRemove = false,
  emptyLabel = "No products added yet",
  onReorder,
  onMergeWithPrevious,
  onUnmerge,
  onEdit,
  timeOfDayContext,
  reorderingProductId,
}: ProductListProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 text-sm">
        {emptyLabel}
      </div>
    );
  }

  // Group products that share the same stepOrder to display as one step with alternates
  const groups = products.reduce<
    Array<{
      step: number;
      items: Array<typeof products[number] & { originalIndex: number }>;
    }>
  >((acc, product, index) => {
    const step = product.stepOrder ?? index + 1;
    const existing = acc.find((g) => g.step === step);
    if (existing) {
      existing.items.push({ ...product, originalIndex: index });
    } else {
      acc.push({ step, items: [{ ...product, originalIndex: index }] });
    }
    return acc;
  }, []);

  const nextStepOrder =
    products.reduce(
      (max, p, idx) => Math.max(max, p.stepOrder ?? idx + 1),
      0
    ) + 1;

  return (
    <div className="space-y-3">
      {groups.map((group, groupIndex) => {
        const showAlternates = group.items.length > 1;
        const prevGroup = groups[groupIndex - 1];
        const canMergeGroup =
          !!onMergeWithPrevious &&
          !!prevGroup &&
          group.step !== prevGroup.step &&
          !!group.items[0]?.routineProductId;
        return (
          <div
            key={`step-${group.step}`}
            className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
                <span className="text-indigo-600">Step {group.step}</span>
                {showAlternates && (
                  <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                    Alternates for this step
                  </span>
                )}
              </div>
              {canMergeGroup && (
                <button
                  type="button"
                  onClick={() =>
                    onMergeWithPrevious?.(
                      group.items[0].routineProductId!,
                      prevGroup.step
                    )
                  }
                  className="text-xs px-3 py-1 rounded border border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                >
                  Merge with previous step
                </button>
              )}
            </div>
            <div className="space-y-4">
              {group.items.map((product, idx) => {
                const prev = group.items[idx - 1];
                const canMergeWithPrev =
                  !!onMergeWithPrevious &&
                  !!product.routineProductId &&
                  idx > 0 &&
                  prev?.stepOrder !== undefined &&
                  prev.stepOrder !== product.stepOrder;
                const canUnmerge =
                  !!onUnmerge &&
                  group.items.length > 1 &&
                  !!product.routineProductId;
                return (
                  <div
                    key={product.routineProductId || product.id}
                    className="flex items-start justify-between gap-3 border border-gray-100 rounded-lg p-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {product.name}
                        </h3>
                        {showAlternates && (
                          <span className="text-[11px] uppercase tracking-wide text-gray-500">
                            {idx === 0 ? "Primary" : "Alternate"}
                          </span>
                        )}
                      </div>
                      {(product.brand || product.timeOfDay) && (
                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mt-1">
                          {product.brand && <span>{product.brand}</span>}
                          {product.timeOfDay && (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                              {formatTimeOfDay(product.timeOfDay)}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        {formatSkipDays(product.skipDays)}
                      </div>
                      {product.category && (
                        <span className="inline-block mt-1 px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded">
                          {product.category}
                        </span>
                      )}
                      {product.ingredients && (
                        <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                          {product.ingredients}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 ml-4">
                      {onEdit && product.routineProductId && (
                        <button
                          type="button"
                          onClick={() =>
                            onEdit(
                              product.routineProductId!,
                              product.skipDays || []
                            )
                          }
                          className="text-gray-600 hover:text-indigo-600 transition p-1"
                          title="Edit frequency"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                      )}
                      {onReorder && product.routineProductId && (
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            disabled={
                              product.originalIndex === 0 ||
                              reorderingProductId !== null
                            }
                            onClick={() =>
                              onReorder(
                                product.routineProductId!,
                                "up",
                                timeOfDayContext
                              )
                            }
                            className={`text-xs px-2 py-1 rounded border ${
                              product.originalIndex === 0 ||
                              reorderingProductId !== null
                                ? "text-gray-400 border-gray-200 cursor-not-allowed bg-gray-50"
                                : "text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                            }`}
                          >
                            Move Up
                          </button>
                          <button
                            type="button"
                            disabled={
                              product.originalIndex === products.length - 1 ||
                              reorderingProductId !== null
                            }
                            onClick={() =>
                              onReorder(
                                product.routineProductId!,
                                "down",
                                timeOfDayContext
                              )
                            }
                            className={`text-xs px-2 py-1 rounded border ${
                              product.originalIndex === products.length - 1 ||
                              reorderingProductId !== null
                                ? "text-gray-400 border-gray-200 cursor-not-allowed bg-gray-50"
                                : "text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                            }`}
                          >
                            Move Down
                          </button>
                        </div>
                      )}
                      {canMergeWithPrev && (
                        <button
                          type="button"
                          onClick={() =>
                            onMergeWithPrevious?.(
                              product.routineProductId!,
                              prev?.stepOrder as number
                            )
                          }
                          className="text-xs px-2 py-1 rounded border border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                        >
                          Merge with previous step
                        </button>
                      )}
                      {showRemove && onRemove && (
                        <button
                          onClick={() =>
                            onRemove(product.id, product.timeOfDay, product.routineProductId)
                          }
                          className="text-red-600 hover:text-red-700 transition"
                          title="Remove product"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      )}
                      {canUnmerge && (
                        <button
                          type="button"
                          onClick={() =>
                            onUnmerge?.(product.routineProductId!, nextStepOrder)
                          }
                          className="text-[11px] px-2 py-1 rounded border border-gray-200 text-gray-700 hover:bg-gray-50"
                        >
                          Make own step
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
