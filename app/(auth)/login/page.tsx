"use client";

import { Suspense, useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const callbackUrl = searchParams?.get("callbackUrl") || "/routine";
  const successMessage = searchParams?.get("registered")
    ? "Account created successfully. Please log in."
    : searchParams?.get("reset")
    ? "Password reset successful. Please log in."
    : "";

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.replace(callbackUrl);
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[url('/background-pattern.png')] bg-cover bg-center bg-fixed">
      <div className="bg-white/30 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/40">
        <h1 className="text-4xl font-serif font-bold text-center mb-6 text-amber-900">Login</h1>

        {error && (
          <div className="bg-red-100/80 backdrop-blur-sm border border-red-300/50 text-red-800 px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="bg-green-100/80 backdrop-blur-sm border border-green-300/50 text-green-800 px-4 py-3 rounded-xl mb-4">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
              className="w-full px-4 py-3 bg-white/40 backdrop-blur-sm border border-amber-300/50 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-amber-900 placeholder:text-amber-700/60"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-900 text-amber-50 py-3 px-4 rounded-xl hover:bg-amber-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-amber-800">
          Don't have an account?{" "}
          <Link href="/signup" className="text-amber-900 hover:text-amber-800 font-medium underline decoration-amber-600/30 hover:decoration-amber-600/60 transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
