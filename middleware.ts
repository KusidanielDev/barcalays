// FILE: src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname, origin } = req.nextUrl;

  // Only guard /admin here — do NOT redirect to /app
  if (pathname.startsWith("/admin")) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const url = new URL("/login", origin);
      url.searchParams.set("from", "/admin");
      return NextResponse.redirect(url);
    }
    // Let the page itself decide if user is ADMIN (shows Forbidden if not)
    return NextResponse.next();
  }

  return NextResponse.next();
}

// Only run for these paths
export const config = {
  matcher: ["/admin/:path*"],
};
