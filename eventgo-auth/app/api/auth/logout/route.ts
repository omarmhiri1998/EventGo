
import { NextRequest, NextResponse } from "next/server";

import { revokeSession } from "../../../lib/sessions";

const COOKIE_NAME = "eventgo_refresh";

const PUBLIC_ORIGIN =
  process.env.EVENTGO_PUBLIC_ORIGIN ??
  "http://localhost:3000";

function clearRefreshCookies(response: NextResponse) {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 0,
  };

  // Remove previous cookie with old path
  response.cookies.set(COOKIE_NAME, "", {
    ...options,
    path: "/api/auth",
  });

  // Remove any cookie using the proxied auth path
  response.cookies.set(COOKIE_NAME, "", {
    ...options,
    path: "/auth/api/auth",
  });

  // Remove current shared cookie
  response.cookies.set(COOKIE_NAME, "", {
    ...options,
    path: "/",
  });
}

export async function POST(request: NextRequest) {
  // 1. Verify request origin
  const origin = request.headers.get("origin");

  if (origin !== PUBLIC_ORIGIN) {
    return NextResponse.json(
      { message: "Forbidden origin" },
      { status: 403 }
    );
  }

  try {
    // 2. Read HttpOnly refresh cookie
    const refreshToken =
      request.cookies.get(COOKIE_NAME)?.value;

    // 3. Revoke session in PostgreSQL
    if (refreshToken) {
      await revokeSession(refreshToken);
    }

    // 4. Prepare response
    const response = NextResponse.json(
      {
        message: "Logged out successfully",
      },
      { status: 200 }
    );

    response.headers.set("Cache-Control", "no-store");

    // 5. Delete refresh cookies
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
