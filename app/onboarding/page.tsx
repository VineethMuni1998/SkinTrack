"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Camera, CheckSquare, ArrowLeft } from "lucide-react";
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

type OnboardingStep = 'dob' | 'skinTypeMethod' | 'faceScan' | 'scanResults' | 'manualSelect' | 'productRecommendations' | 'manualProductInput' | 'complete';

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

function OnboardingContent() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('dob');
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [skinType, setSkinType] = useState("");
  const [skinTypeMethod, setSkinTypeMethod] = useState<'scan' | 'manual' | null>(null);
  const [analysisResult, setAnalysisResult] = useState<SkinAnalysisResult | null>(null);
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([]);
  const [customProducts, setCustomProducts] = useState<Array<{ name: string; brand: string; category: string; ingredients?: string; timeOfDay?: 'MORNING' | 'NIGHT' | 'BOTH' }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const next = searchParams?.get("next") || "/routine";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/onboarding");
    }
  }, [status, router]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/users/me");
        const data = await res.json();
        if (data?.user?.dateOfBirth) {
          const dob = new Date(data.user.dateOfBirth);
          const mm = String(dob.getMonth() + 1).padStart(2, "0");
          const dd = String(dob.getDate()).padStart(2, "0");
          const yyyy = dob.getFullYear();
          setDateOfBirth(`${mm}/${dd}/${yyyy}`);
        }
        if (data?.user?.skinType) setSkinType(data.user.skinType);
        if (data?.user?.dateOfBirth && data?.user?.skinType) {
          router.push(next);
        }
      } catch (_) {
        // ignore
      }
    };
    if (status === "authenticated") {
      loadProfile();
    }
  }, [status, router]);

  const handleDobSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateOfBirth) {
      setError("Please enter your date of birth.");
      return;
    }
    setError("");
    setCurrentStep('skinTypeMethod');
  };

  const handleSkinTypeMethodSelect = (method: 'scan' | 'manual') => {
    setSkinTypeMethod(method);
    if (method === 'scan') {
      setCurrentStep('faceScan');
    } else {
      setCurrentStep('manualSelect');
    }
  };

  const handleAnalysisComplete = (result: SkinAnalysisResult) => {
    setAnalysisResult(result);
    setCurrentStep('scanResults');
  };

  const handleAnalysisError = (err: Error) => {
    setError(err.message);
  };

  const handleConfirmAnalysis = async () => {
    if (analysisResult && analysisResult.skinType !== 'UNKNOWN') {
      setSkinType(analysisResult.skinType);
    }
    // Fetch product recommendations
    await fetchProductRecommendations(analysisResult?.skinType || skinType, analysisResult?.concerns);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skinType) {
      setError("Please select your skin type.");
      return;
    }
    setError("");
    // Fetch product recommendations for manual selection (no concerns data)
    await fetchProductRecommendations(skinType);
  };

  const fetchProductRecommendations = async (selectedSkinType: string, concerns?: SkinAnalysisResult['concerns']) => {
    setLoading(true);
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
      setCurrentStep('productRecommendations');
    } catch (err) {
      console.error("Error fetching recommendations:", err);
      // If recommendations fail, skip to completion
      setError("Could not load product recommendations. Proceeding to setup.");
      setCurrentStep('complete');
      saveProfile(selectedSkinType);
    } finally {
      setLoading(false);
    }
  };

  const handleProductsSelected = async (selectedProducts: ProductRecommendation[]) => {
    setLoading(true);
    setError("");
    try {
      // First, save the profile
      const profileRes = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateOfBirth, skinType }),
      });

      if (!profileRes.ok) {
        if (profileRes.status === 401) {
          router.push("/login?callbackUrl=/onboarding");
          return;
        }
        throw new Error("Failed to save profile");
      }

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

      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save products");
      setLoading(false);
    }
  };

  const handleSkipProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateOfBirth, skinType }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login?callbackUrl=/onboarding");
          return;
        }
        throw new Error("Failed to save profile");
      }

      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
      setLoading(false);
    }
  };

  const handleAddCustomProduct = () => {
    setCurrentStep('manualProductInput');
  };

  const handleCustomProductSubmit = (product: { name: string; brand: string; category: string; ingredients?: string }) => {
    setCustomProducts([...customProducts, product]);
    setCurrentStep('productRecommendations');
  };

  const handleCancelCustomProduct = () => {
    setCurrentStep('productRecommendations');
  };

  const saveProfile = async (selectedSkinType: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateOfBirth, skinType: selectedSkinType }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login?callbackUrl=/onboarding");
          return;
        }
        throw new Error(data?.error || "Failed to save profile");
      }
      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
      setCurrentStep('skinTypeMethod');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setError("");
    if (currentStep === 'skinTypeMethod') {
      setCurrentStep('dob');
    } else if (currentStep === 'faceScan' || currentStep === 'manualSelect') {
      setCurrentStep('skinTypeMethod');
      setSkinTypeMethod(null);
    } else if (currentStep === 'scanResults') {
      setCurrentStep('faceScan');
      setAnalysisResult(null);
    } else if (currentStep === 'productRecommendations') {
      setCurrentStep('scanResults');
    } else if (currentStep === 'manualProductInput') {
      setCurrentStep('productRecommendations');
    }
  };

  const getProgressText = () => {
    switch (currentStep) {
      case 'dob':
        return 'Step 1 of 4';
      case 'skinTypeMethod':
      case 'faceScan':
      case 'scanResults':
      case 'manualSelect':
        return 'Step 2 of 4';
      case 'productRecommendations':
      case 'manualProductInput':
        return 'Step 3 of 4';
      case 'complete':
        return 'Step 4 of 4';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[url('/background-pattern.png')] bg-cover bg-center bg-fixed px-4 py-8">
      <div className={`w-full bg-white/30 backdrop-blur-xl shadow-2xl rounded-3xl p-6 border border-white/40 ${currentStep === 'productRecommendations' || currentStep === 'manualProductInput' ? 'max-w-5xl' : 'max-w-md'}`}>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-serif font-bold text-amber-900 mb-2">Welcome to SkinTrack</h1>
          <p className="text-sm text-amber-800">
            {currentStep === 'dob' && "Let's get started with some basic information."}
            {currentStep === 'skinTypeMethod' && "Choose how you'd like to determine your skin type."}
            {currentStep === 'faceScan' && "Scan your face for AI-powered skin analysis."}
            {currentStep === 'scanResults' && "Review your skin analysis results."}
            {currentStep === 'manualSelect' && "Select your skin type manually."}
            {currentStep === 'productRecommendations' && "Choose products for your routine."}
            {currentStep === 'manualProductInput' && "Add a custom product."}
            {currentStep === 'complete' && "Setting up your profile..."}
          </p>
          <div className="mt-2 text-xs text-amber-700 font-medium">{getProgressText()}</div>
        </div>

        {/* Back Button */}
        {currentStep !== 'dob' && currentStep !== 'complete' && (
          <button
            onClick={handleBack}
            className="mb-4 flex items-center text-sm text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </button>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Step 1: Date of Birth */}
        {currentStep === 'dob' && (
          <form className="space-y-4" onSubmit={handleDobSubmit}>
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
                    formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
                  }
                  setDateOfBirth(formatted);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                placeholder="MM/DD/YYYY"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter digits only; slashes are added automatically.
              </p>
            </div>
            <button
              type="submit"
              className="w-full bg-amber-700 text-white py-3 px-4 rounded-lg hover:bg-amber-800 transition font-medium"
            >
              Continue
            </button>
          </form>
        )}

        {/* Step 2: Skin Type Method Selection */}
        {currentStep === 'skinTypeMethod' && (
          <div className="space-y-3">
            <button
              onClick={() => handleSkinTypeMethodSelect('scan')}
              className="w-full p-6 border-2 border-gray-300 rounded-xl hover:border-amber-500 hover:bg-amber-50 transition text-left group"
            >
              <div className="flex items-start">
                <Camera className="w-6 h-6 text-amber-700 mr-3 mt-1" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900">Scan My Face</h3>
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-medium">
                      Recommended
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Use AI-powered analysis to detect your skin type and concerns automatically.
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleSkinTypeMethodSelect('manual')}
              className="w-full p-6 border-2 border-gray-300 rounded-xl hover:border-amber-500 hover:bg-amber-50 transition text-left"
            >
              <div className="flex items-start">
                <CheckSquare className="w-6 h-6 text-amber-700 mr-3 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">Select Manually</h3>
                  <p className="text-sm text-gray-600">
                    Choose your skin type from a dropdown if you already know it.
                  </p>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Step 3a: Face Scan */}
        {currentStep === 'faceScan' && (
          <div>
            <FaceScanWidget
              onAnalysisComplete={handleAnalysisComplete}
              onError={handleAnalysisError}
              autoSaveToProfile={false}
            />
          </div>
        )}

        {/* Step 3b: Scan Results */}
        {currentStep === 'scanResults' && analysisResult && (
          <div>
            <SkinAnalysisResults
              analysis={analysisResult}
              onConfirm={handleConfirmAnalysis}
              onRetry={() => {
                setAnalysisResult(null);
                setCurrentStep('faceScan');
              }}
              isLoading={loading}
            />
          </div>
        )}

        {/* Step 3c: Manual Selection */}
        {currentStep === 'manualSelect' && (
          <form className="space-y-4" onSubmit={handleManualSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Skin Type
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900"
                value={skinType}
                onChange={(e) => setSkinType(e.target.value)}
                required
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
              className="w-full bg-amber-700 text-white py-3 px-4 rounded-lg hover:bg-amber-800 transition font-medium"
            >
              Continue
            </button>
          </form>
        )}

        {/* Step 4: Product Recommendations */}
        {currentStep === 'productRecommendations' && (
          <div>
            <ProductRecommendations
              recommendations={recommendations}
              onProductsSelected={handleProductsSelected}
              onAddCustomProduct={handleAddCustomProduct}
              onSkip={handleSkipProducts}
              isSubmitting={loading}
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

        {/* Step 5: Manual Product Input */}
        {currentStep === 'manualProductInput' && (
          <div>
            <ManualProductInput
              onSubmit={handleCustomProductSubmit}
              onCancel={handleCancelCustomProduct}
              isSubmitting={loading}
            />
          </div>
        )}

        {/* Step 6: Completing */}
        {currentStep === 'complete' && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-amber-200 border-t-amber-700 mb-4"></div>
            <p className="text-gray-600">Setting up your profile...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <OnboardingContent />
    </Suspense>
  );
}
