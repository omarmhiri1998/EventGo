import "server-only";

import { cookies } from "next/headers";

type AuthSession = {
  authenticated: true;
  userId: string;
  role: "user" | "admin";
};

export async function getSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("eventgo_refresh")?.value;

  if (!refreshToken) {
    return null;
  }

  const authUrl =
    process.env.EVENTGO_AUTH_URL ??
    "http://127.0.0.1:3002";

  const response = await fetch(
    `${authUrl}/auth/api/auth/session`,
    {
      method: "GET",
      headers: {
        Cookie: `eventgo_refresh=${encodeURIComponent(refreshToken)}`,
      },
      cache: "no-store",
    }
  );

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
    !data ||
    typeof data !== "object" ||
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