"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Plus, ChevronRight } from "lucide-react";

export interface ProductRecommendation {
  name: string;
  brand: string;
  category: string;
  reason: string;
  expectedTimeframe: string;
  ingredients?: string;
  timeOfDay?: 'MORNING' | 'NIGHT' | 'BOTH';
}

interface ProductRecommendationsProps {
  recommendations: ProductRecommendation[];
  onProductsSelected: (selectedProducts: ProductRecommendation[]) => void;
  onAddCustomProduct: () => void;
  onSkip: () => void;
  isSubmitting?: boolean;
}

// Helper function to determine time of day for a product
function determineTimeOfDay(product: ProductRecommendation): 'MORNING' | 'NIGHT' | 'BOTH' {
  const name = product.name.toLowerCase();
  const category = product.category.toLowerCase();
  const reason = product.reason.toLowerCase();

  // Sunscreen is always morning
  if (category.includes('sunscreen') || name.includes('sunscreen') || name.includes('spf')) {
    return 'MORNING';
  }

  // Retinoids/Retinol are always night (light sensitive)
  if (name.includes('retinol') || name.includes('retinoid') || name.includes('tretinoin') ||
      name.includes('adapalene') || reason.includes('retinol')) {
    return 'NIGHT';
  }

  // AHA/BHA exfoliants are typically night
  if (name.includes('aha') || name.includes('bha') || name.includes('glycolic') ||
      name.includes('salicylic') || name.includes('lactic acid')) {
    return 'NIGHT';
  }

  // Vitamin C is typically morning (antioxidant protection)
  if (name.includes('vitamin c') || name.includes('ascorbic')) {
    return 'MORNING';
  }

  // Niacinamide can be used both times
  if (name.includes('niacinamide')) {
    return 'BOTH';
  }

  // Heavy moisturizers and sleeping masks are night
  if (name.includes('sleeping') || name.includes('night cream') || name.includes('overnight')) {
    return 'NIGHT';
  }

  // Cleansers, toners, and basic moisturizers can be used both times
  if (category.includes('cleanser') || category.includes('toner') ||
      category.includes('moisturizer') || category.includes('serum')) {
    return 'BOTH';
  }

  // Default to BOTH for flexibility
  return 'BOTH';
}

export default function ProductRecommendations({
  recommendations,
  onProductsSelected,
  onAddCustomProduct,
  onSkip,
  isSubmitting = false,
}: ProductRecommendationsProps) {
  // Track selections by "index-section" key (e.g., "0-morning", "0-night")
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  // Categorize products by time of day
  const morningProducts = recommendations
    .map((product, index) => ({ product, index, timeOfDay: determineTimeOfDay(product) }))
    .filter(item => item.timeOfDay === 'MORNING' || item.timeOfDay === 'BOTH');

  const nightProducts = recommendations
    .map((product, index) => ({ product, index, timeOfDay: determineTimeOfDay(product) }))
    .filter(item => item.timeOfDay === 'NIGHT' || item.timeOfDay === 'BOTH');

  const toggleSelection = (index: number, section: 'morning' | 'night') => {
    const key = `${index}-${section}`;
    const newSelection = new Set(selectedKeys);
    if (newSelection.has(key)) {
      newSelection.delete(key);
    } else {
      newSelection.add(key);
    }
    setSelectedKeys(newSelection);
  };

  const handleContinue = () => {
    // Build a map of index -> sections where that product was selected
    const productSections = new Map<number, Set<'morning' | 'night'>>();

    selectedKeys.forEach(key => {
      const [indexStr, section] = key.split('-');
      const index = parseInt(indexStr);

      if (!productSections.has(index)) {
        productSections.set(index, new Set());
      }
      productSections.get(index)!.add(section as 'morning' | 'night');
    });

    // Create products with timeOfDay information
    const selectedProducts = Array.from(productSections.entries())
      .map(([index, sections]) => {
        const product = recommendations[index];
        if (!product) return null;

        // Determine timeOfDay based on which sections were selected
        let timeOfDay: 'MORNING' | 'NIGHT' | 'BOTH';
        if (sections.has('morning') && sections.has('night')) {
          timeOfDay = 'BOTH';
        } else if (sections.has('morning')) {
          timeOfDay = 'MORNING';
        } else {
          timeOfDay = 'NIGHT';
        }

        return {
          ...product,
          timeOfDay,
        };
      })
      .filter(Boolean) as ProductRecommendation[];

    onProductsSelected(selectedProducts);
  };

  const getCategoryColor = (category: string) => {
    const normalized = category.toLowerCase();
    if (normalized.includes("cleanser")) return "bg-blue-100 text-blue-700";
    if (normalized.includes("toner")) return "bg-amber-100 text-amber-700";
    if (normalized.includes("serum")) return "bg-pink-100 text-pink-700";
    if (normalized.includes("moisturizer")) return "bg-green-100 text-green-700";
    if (normalized.includes("sunscreen")) return "bg-yellow-100 text-yellow-700";
    if (normalized.includes("treatment")) return "bg-red-100 text-red-700";
    return "bg-gray-100 text-gray-700";
  };

  const renderProductCard = (product: ProductRecommendation, index: number, timeOfDay: 'MORNING' | 'NIGHT' | 'BOTH', section: 'morning' | 'night') => {
    const selectionKey = `${index}-${section}`;
    const isSelected = selectedKeys.has(selectionKey);
    return (
      <button
        key={`${index}-${section}`}
        onClick={() => toggleSelection(index, section)}
        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
          isSelected
            ? "border-amber-600 bg-amber-50"
            : "border-gray-200 bg-white hover:border-gray-300"
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Checkbox Icon */}
          <div className="flex-shrink-0 mt-1">
            {isSelected ? (
              <CheckCircle2 className="w-6 h-6 text-amber-700" />
            ) : (
              <Circle className="w-6 h-6 text-gray-400" />
            )}
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {product.brand}
                </p>
              </div>
              <div className="flex flex-col gap-1 items-end">
                <span
                  className={`flex-shrink-0 px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(
                    product.category
                  )}`}
                >
                  {product.category}
                </span>
                {timeOfDay === 'BOTH' && (
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                    AM & PM
                  </span>
                )}
              </div>
            </div>

            <p className="text-sm text-gray-700 mb-2">
              {product.reason}
            </p>

            <p className="text-xs text-gray-500">
              Expected results: {product.expectedTimeframe}
            </p>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Recommended Products
        </h2>
        <p className="text-gray-600">
          Based on your skin analysis, we recommend these products organized by when to use them.
        </p>
      </div>

      {/* Morning Routine Section */}
      {morningProducts.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-amber-100 rounded-lg">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Morning Routine</h3>
          </div>
          <div className="space-y-3">
            {morningProducts.map(({ product, index, timeOfDay }) =>
              renderProductCard(product, index, timeOfDay, 'morning')
            )}
          </div>
        </div>
      )}

      {/* Night Routine Section */}
      {nightProducts.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-amber-100 rounded-lg">
              <svg className="w-5 h-5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Night Routine</h3>
          </div>
          <div className="space-y-3">
            {nightProducts.map(({ product, index, timeOfDay }) =>
              renderProductCard(product, index, timeOfDay, 'night')
            )}
          </div>
        </div>
      )}

      {/* Add Custom Product Button */}
      <button
        onClick={onAddCustomProduct}
        className="w-full mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-amber-500 hover:bg-amber-50 transition-all flex items-center justify-center gap-2 text-gray-600 hover:text-amber-700"
      >
        <Plus className="w-5 h-5" />
        <span className="font-medium">Add Custom Product</span>
      </button>

      {/* Selection Summary */}
      {selectedKeys.size > 0 && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            {selectedKeys.size} selection{selectedKeys.size !== 1 ? "s" : ""} made ({Array.from(new Set(Array.from(selectedKeys).map(k => k.split('-')[0]))).length} unique product{Array.from(new Set(Array.from(selectedKeys).map(k => k.split('-')[0]))).length !== 1 ? "s" : ""})
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleContinue}
          disabled={isSubmitting}
          className="flex-1 bg-amber-700 text-white py-3 px-6 rounded-lg hover:bg-amber-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
        >
          {isSubmitting ? (
            "Saving..."
          ) : (
            <>
              {selectedKeys.size > 0 ? "Continue with Selected" : "Continue without Products"}
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
        <button
          onClick={onSkip}
          disabled={isSubmitting}
          className="sm:w-auto px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-medium"
        >
          Skip for Now
        </button>
      </div>

      {/* Helper Text */}
      <p className="mt-4 text-xs text-center text-gray-500">
        You can always add or remove products later from your routine page
      </p>
    </div>
  );
}
