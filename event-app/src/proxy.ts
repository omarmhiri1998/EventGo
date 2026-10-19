import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (
    pathname === "/auth" ||
    pathname.startsWith("/auth/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/")
  ) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/auth/login", request.url);
  const refreshToken = request.cookies.get("eventgo_refresh")?.value;

  if (!refreshToken) {
    return NextResponse.redirect(loginUrl);
  }

  try {
    const authUrl =
      process.env.EVENTGO_AUTH_SESSION_URL ||
      "https://eventgo-auth.vercel.app/auth/api/auth/session";

    const response = await fetch(authUrl, {
      method: "GET",
      headers: {
        Cookie: `eventgo_refresh=${encodeURIComponent(refreshToken)}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.redirect(loginUrl);
    }

    const session: unknown = await response.json();

    if (
      typeof session !== "object" ||
      session === null ||
      !("authenticated" in session) ||
      session.authenticated !== true ||
      !("role" in session) ||
      (session.role !== "user" && session.role !== "admin")
    ) {
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Session verification failed:", error);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};