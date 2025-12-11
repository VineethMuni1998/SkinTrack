"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Scan, ShoppingBag, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import FaceScanWidget from "@/components/FaceScanWidget";
import SkinAnalysisResults from "@/components/SkinAnalysisResults";
import ProductRecommendations, { ProductRecommendation } from "@/components/ProductRecommendations";
import ManualProductInput from "@/components/ManualProductInput";

const skinTypes = [
  { value: "DRY", label: "Dry" },
  { value: "OILY", label: "Oily" },
  { value: "COMBINATION", label: "Combination" },
  { value: "NORMAL", label: "Normal" },
];

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
  imageUrl: string;
  analysisDate: Date;
}

type ModalView = 'none' | 'scan' | 'scanResults' | 'products' | 'manualProduct';

export default function ProfilePage() {
  const { status } = useSession();
  const router = useRouter();
  const [computedAge, setComputedAge] = useState<number | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [skinType, setSkinType] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Skin analysis state
  const [lastAnalysis, setLastAnalysis] = useState<SkinAnalysisResult | null>(null);
  const [analysisResult, setAnalysisResult] = useState<SkinAnalysisResult | null>(null);
  const [modalView, setModalView] = useState<ModalView>('none');
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([]);
  const [customProducts, setCustomProducts] = useState<Array<{ name: string; brand: string; category: string; ingredients?: string; timeOfDay?: 'MORNING' | 'NIGHT' | 'BOTH' }>>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/profile");
    }
  }, [status, router]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/users/me");
        const data = await res.json();
        if (data?.user) {
          setComputedAge(data.user.age ?? null);
          if (data.user.dateOfBirth) {
            const dob = new Date(data.user.dateOfBirth);
            const mm = String(dob.getMonth() + 1).padStart(2, "0");
            const dd = String(dob.getDate()).padStart(2, "0");
            const yyyy = dob.getFullYear();
            setDateOfBirth(`${mm}/${dd}/${yyyy}`);
          }
          setSkinType(data.user.skinType ?? "");
          setName(data.user.name ?? "");
          setEmail(data.user.email ?? "");
        }

        // Load last skin analysis
        const analysisRes = await fetch("/api/skin-analysis/history");
        if (analysisRes.ok) {
          const analysisData = await analysisRes.json();
          if (analysisData.analyses && analysisData.analyses.length > 0) {
            setLastAnalysis(analysisData.analyses[0]);
          }
        }
      } catch (_) {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    if (status === "authenticated") {
      loadProfile();
    }
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateOfBirth: dateOfBirth || undefined,
          skinType: skinType || undefined,
          name: name || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Failed to save profile");
      }
      setMessage("Profile updated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleReScan = () => {
    setModalView('scan');
  };

  const handleAnalysisComplete = (result: SkinAnalysisResult) => {
    setAnalysisResult(result);
    setModalView('scanResults');
  };

  const handleAnalysisError = (err: Error) => {
    setError(err.message);
    setModalView('none');
  };

  const handleConfirmAnalysis = async () => {
    if (analysisResult && analysisResult.skinType !== 'UNKNOWN') {
      setSkinType(analysisResult.skinType);
      setLastAnalysis(analysisResult);
    }
    // Fetch product recommendations
    await fetchProductRecommendations(analysisResult?.skinType || skinType, analysisResult?.concerns);
  };

  const handleUpdateProducts = async () => {
    // Fetch recommendations based on current skin type
    await fetchProductRecommendations(skinType, lastAnalysis?.concerns);
  };

  const fetchProductRecommendations = async (selectedSkinType: string, concerns?: SkinAnalysisResult['concerns']) => {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/products/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skinType: selectedSkinType,
          concerns: concerns || {},
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch product recommendations");
      }

      const data = await response.json();
      setRecommendations(data.recommendations || []);
      setModalView('products');
    } catch (err) {
      console.error("Error fetching recommendations:", err);
      setError("Could not load product recommendations.");
    } finally {
      setSaving(false);
    }
  };

  const handleProductsSelected = async (selectedProducts: ProductRecommendation[]) => {
    setSaving(true);
    setError("");
    try {
      // Get user's active routine
      const routineRes = await fetch("/api/routines");
      const routineData = await routineRes.json();
      let routineId = routineData.routines?.[0]?.id;

      // Create routine if doesn't exist
      if (!routineId) {
        const createRoutineRes = await fetch("/api/routines", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "My Skincare Routine" }),
        });
        const newRoutineData = await createRoutineRes.json();
        routineId = newRoutineData.routine?.id;
      }

      // Add selected and custom products to routine
      const allProductsToAdd = [...selectedProducts, ...customProducts];

      for (const product of allProductsToAdd) {
        // Create product
        const productRes = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: product.name,
            brand: product.brand,
            category: product.category,
            ingredients: product.ingredients,
          }),
        });

        if (productRes.ok) {
          const productData = await productRes.json();

          // Add to routine with timeOfDay
          const timeOfDay = product.timeOfDay || 'BOTH';

          // If timeOfDay is BOTH, add the product separately for MORNING and NIGHT
          // This ensures each gets its own stepOrder and isn't paired as alternates
          if (timeOfDay === 'BOTH') {
            // Add for morning
            await fetch(`/api/routines/${routineId}/products`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                productId: productData.product.id,
                timeOfDay: 'MORNING',
              }),
            });

            // Add for night
            await fetch(`/api/routines/${routineId}/products`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                productId: productData.product.id,
                timeOfDay: 'NIGHT',
              }),
            });
          } else {
            // Add once for the specific time
            await fetch(`/api/routines/${routineId}/products`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                productId: productData.product.id,
                timeOfDay: timeOfDay,
              }),
            });
          }
        }
      }

      setMessage("Products added to your routine");
      setModalView('none');
      setCustomProducts([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save products");
    } finally {
      setSaving(false);
    }
  };

  const handleSkipProducts = () => {
    setModalView('none');
    setCustomProducts([]);
  };

  const handleAddCustomProduct = () => {
    setModalView('manualProduct');
  };

  const handleCustomProductSubmit = (product: { name: string; brand: string; category: string; ingredients?: string }) => {
    setCustomProducts([...customProducts, product]);
    setModalView('products');
  };

  const handleCancelCustomProduct = () => {
    setModalView('products');
  };

  const closeModal = () => {
    setModalView('none');
    setAnalysisResult(null);
  };

  const getTopConcerns = () => {
    if (!lastAnalysis) return [];
    const concerns = Object.entries(lastAnalysis.concerns)
      .filter(([_, value]) => value > 30)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([concern, value]) => ({
        name: concern.charAt(0).toUpperCase() + concern.slice(1),
        value,
      }));
    return concerns;
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white shadow rounded-xl p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Your Profile</h1>
          <p className="text-sm text-gray-600 mb-4">
            Update your details to personalize recommendations.
          </p>
          {message && <p className="text-sm text-green-700 mb-2">{message}</p>}
          {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth (MM/DD/YYYY)
              </label>
              <input
                type="text"
                value={dateOfBirth}
                onChange={(e) => {
                  const digits = e.target.value.replace(/[^\d]/g, "");
                  let formatted = digits;
                  if (digits.length > 2 && digits.length <= 4) {
                    formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
                  } else if (digits.length > 4) {
                    formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(
                      4,
                      8
                    )}`;
                  }
                  setDateOfBirth(formatted);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                placeholder="MM/DD/YYYY"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter digits only; slashes are added automatically.
              </p>
              {computedAge !== null && (
                <p className="text-xs text-gray-500 mt-1">Age: {computedAge}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Skin Type
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                value={skinType}
                onChange={(e) => setSkinType(e.target.value)}
              >
                <option value="">Select skin type</option>
                {skinTypes.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </form>
        </div>

        {/* Skin Analysis Section */}
        <div className="bg-white shadow rounded-xl p-6 mt-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Skin Analysis & Product Recommendations
          </h2>

          {lastAnalysis ? (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-indigo-900">
                      Last Analysis
                    </p>
                    <p className="text-xs text-indigo-600">
                      {new Date(lastAnalysis.analysisDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-indigo-200 text-indigo-800 text-sm font-medium rounded-full">
                    {lastAnalysis.skinType}
                  </span>
                </div>
                {lastAnalysis.confidence && (
                  <p className="text-xs text-indigo-700 mb-2">
                    Confidence: {lastAnalysis.confidence.toFixed(1)}%
                  </p>
                )}
                {getTopConcerns().length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-indigo-900 mb-1">
                      Top Concerns:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {getTopConcerns().map((concern, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-white text-indigo-700 text-xs rounded-full"
                        >
                          {concern.name} ({concern.value}%)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleReScan}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                >
                  <Scan className="w-4 h-4" />
                  Re-scan Your Skin
                </button>
                <button
                  onClick={handleUpdateProducts}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition font-medium"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Update Products
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                <Scan className="w-8 h-8 text-indigo-600" />
              </div>
              <p className="text-gray-600 mb-4">
                You haven't done a skin analysis yet. Scan your face to get personalized product recommendations!
              </p>
              <button
                onClick={handleReScan}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
              >
                <Scan className="w-4 h-4" />
                Scan Your Skin
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalView !== 'none' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto relative">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition z-10"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            <div className="p-6">
              {modalView === 'scan' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Scan Your Face
                  </h2>
                  <FaceScanWidget
                    onAnalysisComplete={handleAnalysisComplete}
                    onError={handleAnalysisError}
                    autoSaveToProfile={true}
                  />
                </div>
              )}

              {modalView === 'scanResults' && analysisResult && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Your Skin Analysis Results
                  </h2>
                  <SkinAnalysisResults
                    analysis={analysisResult}
                    onConfirm={handleConfirmAnalysis}
                    onRetry={() => setModalView('scan')}
                    isLoading={saving}
                  />
                </div>
              )}

              {modalView === 'products' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Recommended Products
                  </h2>
                  <ProductRecommendations
                    recommendations={recommendations}
                    onProductsSelected={handleProductsSelected}
                    onAddCustomProduct={handleAddCustomProduct}
                    onSkip={handleSkipProducts}
                    isSubmitting={saving}
                  />
                  {customProducts.length > 0 && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-700 font-medium mb-2">
                        Custom Products Added ({customProducts.length}):
                      </p>
                      <ul className="text-sm text-green-600 space-y-1">
                        {customProducts.map((product, index) => (
                          <li key={index}>
                            {product.name} - {product.brand}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {modalView === 'manualProduct' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Add Custom Product
                  </h2>
                  <ManualProductInput
                    onSubmit={handleCustomProductSubmit}
                    onCancel={handleCancelCustomProduct}
                    isSubmitting={saving}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
