
import { NextRequest, NextResponse } from "next/server";

import { refreshSession } from "../../../lib/sessions";

export const runtime = "nodejs";

const COOKIE_NAME = "eventgo_refresh";
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7;

function clearRefreshCookies(response: NextResponse) {
  const baseOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 0,
  };

  response.cookies.set(COOKIE_NAME, "", {
    ...baseOptions,
    path: "/api/auth",
  });

  response.cookies.set(COOKIE_NAME, "", {
    ...baseOptions,
    path: "/",
  });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json(
      { message: "Forbidden origin" },
      { status: 403 }
    );
  }

  const refreshToken =
    request.cookies.get(COOKIE_NAME)?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { message: "Refresh token missing" },
      { status: 401 }
    );
  }

  try {
    // Rotate refresh token
    const session = await refreshSession(refreshToken);

    if (!session) {
      const response = NextResponse.json(
        { message: "Invalid or expired session" },
        { status: 401 }
      );

      response.headers.set("Cache-Control", "no-store");

      clearRefreshCookies(response);

      return response;
    }

    const response = NextResponse.json(
      {
        accessToken: session.accessToken,
      },
      { status: 200 }
    );

    response.headers.set("Cache-Control", "no-store");

    // Remove old cookie using previous path
    response.cookies.set(COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth",
      maxAge: 0,
    });

    // Store rotated token with new path
    response.cookies.set(
      COOKIE_NAME,
      session.refreshToken,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: REFRESH_MAX_AGE,
      }
    );

    return response;
  } catch (error) {
    console.error("Refresh error:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
