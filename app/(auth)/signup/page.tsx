"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Check if passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const responseClone = response.clone();
      let data: any = {};

      try {
        data = await response.json();
      } catch {
        const fallbackText = await responseClone.text().catch(() => "");
        if (fallbackText) {
          data = { message: fallbackText };
        }
      }

      if (!response.ok) {
        const message =
          data?.error ||
          data?.message ||
          "Unable to sign you up right now. Please try again.";
        setError(message);
        console.error("Signup error:", data || message);
        return;
      }

      // Redirect to login after successful signup
      router.push("/login?registered=true");
    } catch (error: any) {
      console.error("Signup error:", error);
      setError(error.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[url('/background-pattern.png')] bg-cover bg-center bg-fixed">
      <div className="bg-white/30 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/40">
        <h1 className="text-4xl font-serif font-bold text-center mb-6 text-amber-900">Sign Up</h1>

        {error && (
          <div className="bg-red-100/80 backdrop-blur-sm border border-red-300/50 text-red-800 px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-amber-900 mb-1">
              Name (optional)
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-white/40 backdrop-blur-sm border border-amber-300/50 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-amber-900 placeholder:text-amber-700/60"
              placeholder="Your name"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-amber-900 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/40 backdrop-blur-sm border border-amber-300/50 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-amber-900 placeholder:text-amber-700/60"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-amber-900 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 bg-white/40 backdrop-blur-sm border border-amber-300/50 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-amber-900 placeholder:text-amber-700/60"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-amber-900 mb-1">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 bg-white/40 backdrop-blur-sm border border-amber-300/50 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-amber-900 placeholder:text-amber-700/60"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-900 text-amber-50 py-3 px-4 rounded-xl hover:bg-amber-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-amber-800">
          Already have an account?{" "}
          <Link href="/login" className="text-amber-900 hover:text-amber-800 font-medium underline decoration-amber-600/30 hover:decoration-amber-600/60 transition-colors">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
