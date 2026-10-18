
import { NextRequest, NextResponse } from "next/server";

import { revokeSession } from "../../../lib/sessions";

export const runtime = "nodejs";

const COOKIE_NAME = "eventgo_refresh";

function clearRefreshCookies(response: NextResponse) {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 0,
  };

  for (const path of [
    "/api/auth",
    "/auth/api/auth",
    "/",
  ]) {
    response.cookies.set(COOKIE_NAME, "", {
      ...options,
      path,
    });
  }
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (!origin || origin !== request.nextUrl.origin) {
    return NextResponse.json(
      { message: "Forbidden origin" },
      { status: 403 }
    );
  }

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
