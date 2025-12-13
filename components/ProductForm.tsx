"use client";

import { useState } from "react";

import UsageSchedulePicker, { UsageMode } from "./UsageSchedulePicker";

interface ProductFormProps {
  onSubmit: (product: {
    name: string;
    brand?: string;
    ingredients?: string;
    category?: string;
    description?: string;
  }) => Promise<void> | void;
  onCancel?: () => void;
  initialData?: {
    name: string;
    brand?: string;
    ingredients?: string;
    category?: string;
    description?: string;
  };
  usageMode: UsageMode;
  skipDays: string[];
  specificDays: string[];
  onUsageModeChange: (mode: UsageMode) => void;
  onToggleDay: (day: string, type: "skip" | "specific") => void;
}

export default function ProductForm({
  onSubmit,
  onCancel,
  initialData,
  usageMode,
  skipDays,
  specificDays,
  onUsageModeChange,
  onToggleDay,
}: ProductFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [brand, setBrand] = useState(initialData?.brand || "");
  const [ingredients, setIngredients] = useState(initialData?.ingredients || "");
  const [category, setCategory] = useState(initialData?.category || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [autoFilling, setAutoFilling] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const requestIngredients = async () => {
    if (!name) return "";
    setAutoFilling(true);
    try {
      const response = await fetch("/api/products/ingredients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          brand,
          category,
          description,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch ingredients");
      }
      setIngredients(data.ingredients || "");
      return data.ingredients as string;
    } catch (error) {
      console.error(error);
      return "";
    } finally {
      setAutoFilling(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let finalIngredients = ingredients;
      if (!finalIngredients.trim()) {
        const aiIngredients = await requestIngredients();
        if (aiIngredients) {
          finalIngredients = aiIngredients;
        }
      }

      await onSubmit({
        name,
        brand: brand || undefined,
        ingredients: finalIngredients || undefined,
        category: category || undefined,
        description: description || undefined,
      });

      setName("");
      setBrand("");
      setIngredients("");
      setCategory("");
      setDescription("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Product Name *
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
          placeholder="e.g., Retinol Serum"
        />
      </div>

      <div>
        <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
          Brand
        </label>
        <input
          id="brand"
          type="text"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
          placeholder="e.g., The Ordinary"
        />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
          Category
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900"
        >
          <option value="">Select category</option>
          <option value="Cleanser">Cleanser</option>
          <option value="Toner">Toner</option>
          <option value="Serum">Serum</option>
          <option value="Moisturizer">Moisturizer</option>
          <option value="Sunscreen">Sunscreen</option>
          <option value="Treatment">Treatment</option>
          <option value="Mask">Mask</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Describe this product (optional)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
          placeholder="Share how you use it or what it claims to do"
        />
      </div>

      <div>
        <label htmlFor="ingredients" className="block text-sm font-medium text-gray-700 mb-1">
          Key Ingredients
        </label>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-gray-500">
            Let AI fetch the actives if you&apos;re unsure
          </span>
          <button
            type="button"
            onClick={requestIngredients}
            disabled={!name || autoFilling}
            className="text-xs text-amber-700 hover:text-amber-800 disabled:opacity-40"
          >
            {autoFilling ? "Finding..." : "Auto-fill with AI"}
          </button>
        </div>
        <textarea
          id="ingredients"
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
          placeholder="e.g., Retinol, Hyaluronic Acid, Niacinamide"
        />
      </div>

      <div className="pt-2 border-t border-gray-100">
        <UsageSchedulePicker
          usageMode={usageMode}
          skipDays={skipDays}
          specificDays={specificDays}
          onUsageModeChange={onUsageModeChange}
          onToggleDay={onToggleDay}
          title="Usage cadence"
          helperText="Set how often you use this when adding it to your routine."
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-amber-700 text-white py-2 px-4 rounded-lg hover:bg-amber-800 transition disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Add Product"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
