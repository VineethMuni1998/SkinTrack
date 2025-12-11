"use client";

import { useState } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";

interface ManualProductInputProps {
  onSubmit: (product: {
    name: string;
    brand: string;
    category: string;
    ingredients?: string;
  }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function ManualProductInput({
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ManualProductInputProps) {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [autoFilling, setAutoFilling] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      brand,
      category,
      ingredients: ingredients || undefined,
    });
  };

  const handleAutoFillIngredients = async () => {
    if (!name) return;

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
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch ingredients");
      }

      const data = await response.json();
      setIngredients(data.ingredients || "");
    } catch (error) {
      console.error("Failed to auto-fill ingredients:", error);
    } finally {
      setAutoFilling(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Recommendations</span>
        </button>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Add Custom Product
        </h2>
        <p className="text-gray-600">
          Enter the details of a product you already use or want to add to your routine.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Product Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Product Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
            placeholder="e.g., Hydrating Facial Cleanser"
          />
        </div>

        {/* Brand */}
        <div>
          <label
            htmlFor="brand"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Brand <span className="text-red-500">*</span>
          </label>
          <input
            id="brand"
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
            placeholder="e.g., CeraVe"
          />
        </div>

        {/* Category */}
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Category <span className="text-red-500">*</span>
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
          >
            <option value="">Select a category</option>
            <option value="Cleanser">Cleanser</option>
            <option value="Toner">Toner</option>
            <option value="Serum">Serum</option>
            <option value="Moisturizer">Moisturizer</option>
            <option value="Sunscreen">Sunscreen</option>
            <option value="Treatment">Treatment</option>
            <option value="Mask">Mask</option>
            <option value="Eye Cream">Eye Cream</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Ingredients */}
        <div>
          <label
            htmlFor="ingredients"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Key Ingredients (Optional)
          </label>
          <div className="flex justify-end mb-2">
            <button
              type="button"
              onClick={handleAutoFillIngredients}
              disabled={!name || autoFilling}
              className="text-xs text-indigo-600 hover:text-indigo-700 disabled:opacity-40 flex items-center gap-1 transition"
            >
              <Sparkles className="w-3 h-3" />
              {autoFilling ? "Finding ingredients..." : "Auto-fill with AI"}
            </button>
          </div>
          <textarea
            id="ingredients"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
            placeholder="e.g., Hyaluronic Acid, Ceramides, Niacinamide"
          />
          <p className="mt-1 text-xs text-gray-500">
            List the main active ingredients. AI can help find them if you're unsure.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isSubmitting ? "Adding Product..." : "Add Product"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
