import "server-only";

import { cookies } from "next/headers";

export type AuthSession = {
  authenticated: true;
  userId: string;
  role: "user" | "admin";
};

const AUTH_SESSION_URL =
  process.env.EVENTGO_AUTH_SESSION_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://eventgo-auth.vercel.app/auth/api/auth/session"
    : "http://localhost:3002/auth/api/auth/session");

async function validateAuthCookie(
  cookieHeader: string
): Promise<AuthSession | null> {
  let response: Response;

  try {
    response = await fetch(AUTH_SESSION_URL, {
      method: "GET",
      headers: {
        Cookie: cookieHeader,
      },
      cache: "no-store",
    });
  } catch (error) {
    console.error("Authentication service connection failed:", error);

    throw new Error("Authentication service unavailable");
  }

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `Authentication service unavailable: HTTP ${response.status}`
    );
  }

  const data: unknown = await response.json();

  if (
    typeof data !== "object" ||
    data === null ||
    !("authenticated" in data) ||
    data.authenticated !== true ||
    !("userId" in data) ||
    typeof data.userId !== "string" ||
    !("role" in data) ||
    (data.role !== "user" && data.role !== "admin")
  ) {
    return null;
  }

  return {
    authenticated: true,
    userId: data.userId,
    role: data.role,
  };
}

export async function getSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();

  const refreshToken =
    cookieStore.get("eventgo_refresh")?.value;

  if (!refreshToken) {
    return null;
  }

  return validateAuthCookie(
    `eventgo_refresh=${encodeURIComponent(refreshToken)}`
  );
}

export async function requireAuth(
  request: Request
): Promise<AuthSession | null> {
  const cookieHeader = request.headers.get("cookie");

  if (!cookieHeader) {
    return null;
  }

  return validateAuthCookie(cookieHeader);
}