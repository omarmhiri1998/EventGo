
import { NextRequest, NextResponse } from "next/server";

import { login } from "../../../../../eventgo-backend/src/services/auth.service";
import { createSession } from "../../../lib/sessions";

const COOKIE_NAME = "eventgo_refresh";
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7;

const PUBLIC_ORIGIN =
  process.env.EVENTGO_PUBLIC_ORIGIN ??
  "http://localhost:3000";

export async function POST(request: NextRequest) {
  // Validate the public application origin
  const origin = request.headers.get("origin");

  if (origin !== PUBLIC_ORIGIN) {
    return NextResponse.json(
      { message: "Forbidden origin" },
      { status: 403 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("email" in body) ||
    !("password" in body) ||
    typeof body.email !== "string" ||
    typeof body.password !== "string"
  ) {
    return NextResponse.json(
      { message: "Email and password are required" },
      { status: 400 }
    );
  }

  try {
    // Verify user credentials
    const user = await login({
      email: body.email,
      password: body.password,
    });

    // Create Access Token and Refresh Token
    const { accessToken, refreshToken } =
      await createSession(user);

    const response = NextResponse.json(
      {
        message: "Login successful",
        user,
        accessToken,
      },
      { status: 200 }
    );

    response.headers.set("Cache-Control", "no-store");

    // Remove the legacy cookie
    response.cookies.set(COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth",
      maxAge: 0,
    });

    // Store refresh token in an HttpOnly Cookie
    response.cookies.set(COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: REFRESH_MAX_AGE,
    });

    return response;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Invalid email or password"
    ) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    console.error("Login error:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
