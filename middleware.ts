import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  let token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Fall back to legacy cookie names for local dev compatibility
  if (!token) {
    const legacyCookieName =
      process.env.NODE_ENV === "production"
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token";

    token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: legacyCookieName,
    });
  }

  const { pathname } = request.nextUrl;

  // Protected routes
  const isProtectedRoute = 
    pathname.startsWith("/routine") ||
    pathname.startsWith("/progress");

  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/routine/:path*", "/progress/:path*"],
};
