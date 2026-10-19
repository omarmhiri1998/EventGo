import { NextRequest, NextResponse } from "next/server";

import { revokeSession } from "../../../lib/sessions";

export const runtime = "nodejs";

const COOKIE_NAME = "eventgo_refresh";

const allowedOrigins = new Set([
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "https://event-app-nine-rose.vercel.app",
  "https://eventgo-auth.vercel.app",
]);

function clearRefreshCookies(response: NextResponse) {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 0,
  };

  for (const path of ["/api/auth", "/auth/api/auth", "/"]) {
    response.cookies.set(COOKIE_NAME, "", {
      ...options,
      path,
    });
  }
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (!origin || !allowedOrigins.has(origin)) {
    return NextResponse.json(
      { message: "Forbidden origin" },
      { status: 403 }
    );
  }

  // Cross-origin requests still require an appropriate
  // CORS response at the HTTP proxy/API layer.
  try {
    const refreshToken =
      request.cookies.get(COOKIE_NAME)?.value;

    if (refreshToken) {
      await revokeSession(refreshToken);
    }

    const response = NextResponse.json(
      { message: "Logged out successfully" },
      { status: 200 }
    );

    response.headers.set("Cache-Control", "no-store");

    clearRefreshCookies(response);

    return response;
  } catch (error) {
    console.error("Logout error:", error);

    return NextResponse.json(
      { message: "Logout failed" },
      { status: 500 }
    );
  }
}