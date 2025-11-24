"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

const skinTypes = [
  { value: "DRY", label: "Dry" },
  { value: "OILY", label: "Oily" },
  { value: "COMBINATION", label: "Combination" },
  { value: "NORMAL", label: "Normal" },
];

function OnboardingContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [skinType, setSkinType] = useState("");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateOfBirth || !skinType) {
      setError("Add your date of birth and skin type to continue.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateOfBirth, skinType }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Failed to save profile");
      }
      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white shadow rounded-xl p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to SkinTrack</h1>
        <p className="text-sm text-gray-600 mb-4">
          Tell us a bit about you so we can tailor recommendations.
        </p>
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <form className="space-y-4" onSubmit={handleSubmit}>
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
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter digits only; slashes are added automatically.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Skin Type
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
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
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? "Saving..." : "Continue to My Routine"}
          </button>
        </form>
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
