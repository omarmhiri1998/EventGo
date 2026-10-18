
import { NextRequest, NextResponse } from "next/server";

import { login } from "@eventgo/backend/services/auth.service";
import { createSession } from "../../../lib/sessions";

export const runtime = "nodejs";

const COOKIE_NAME = "eventgo_refresh";
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7;

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (!origin || origin !== request.nextUrl.origin) {
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
    const user = await login({
      email: body.email,
      password: body.password,
    });

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

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
    };

    response.cookies.set(COOKIE_NAME, "", {
      ...cookieOptions,
      path: "/api/auth",
      maxAge: 0,
    });

    response.cookies.set(COOKIE_NAME, "", {
      ...cookieOptions,
      path: "/auth/api/auth",
      maxAge: 0,
    });

    response.cookies.set(COOKIE_NAME, refreshToken, {
      ...cookieOptions,
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
