import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Auth and Admin are handled by their own applications.
  if (
    pathname === "/auth" ||
    pathname.startsWith("/auth/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/")
  ) {
    return NextResponse.next();
  }

  const refreshToken = request.cookies.get("eventgo_refresh")?.value;

  if (!refreshToken) {
    return NextResponse.redirect(
      new URL("/auth/login", request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|.*\\..*).*)"],
};