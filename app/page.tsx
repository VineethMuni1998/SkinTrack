"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/routine");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[url('/background-pattern.png')] bg-cover bg-center bg-fixed">
        <div className="text-amber-900">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[url('/background-pattern.png')] bg-cover bg-center bg-fixed">
      <div className="text-center bg-white/20 backdrop-blur-xl rounded-3xl p-12 border border-white/40 shadow-2xl">
        <h1 className="text-5xl font-serif text-amber-900 mb-4">SkinTrack</h1>
        <p className="text-xl text-amber-800 mb-8">Track your skincare journey</p>
        <div className="space-x-4">
          <Link
            href="/login"
            className="px-8 py-3 bg-amber-900 text-amber-50 rounded-2xl hover:bg-amber-800 transition-all shadow-lg hover:shadow-xl font-medium inline-block"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="px-8 py-3 bg-white/80 text-amber-900 border border-amber-900/20 rounded-2xl hover:bg-white transition-all shadow-lg hover:shadow-xl font-medium inline-block"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}

