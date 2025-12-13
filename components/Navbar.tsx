"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (!session) {
    return null;
  }

  const navLinks = [
    { href: "/routine", label: "My Routine" },
    { href: "/progress", label: "Progress" },
    { href: "/timeline", label: "Timeline" },
    { href: "/profile", label: "Profile" },
  ];

  return (
    <nav className="bg-white/10 backdrop-blur-lg border-b border-white/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/routine" className="flex items-center">
              <span className="text-2xl font-serif text-amber-900">SkinTrack</span>
            </Link>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center px-3 pt-1 border-b-2 text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? "border-amber-800 text-amber-900"
                      : "border-transparent text-amber-700 hover:border-amber-400 hover:text-amber-900"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center">
            <span className="text-sm text-amber-800 mr-4 hidden md:block">
              {session.user?.email}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="px-4 py-2 text-sm text-amber-50 bg-amber-900 hover:bg-amber-800 rounded-xl transition-all shadow-md hover:shadow-lg font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
