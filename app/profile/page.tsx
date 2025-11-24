"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";

const skinTypes = [
  { value: "DRY", label: "Dry" },
  { value: "OILY", label: "Oily" },
  { value: "COMBINATION", label: "Combination" },
  { value: "NORMAL", label: "Normal" },
];

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
      </div>
    </div>
  );
}
