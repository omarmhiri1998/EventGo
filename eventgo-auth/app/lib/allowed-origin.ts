
import type { NextRequest } from "next/server";

export function isAllowedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");

  if (!origin) {
    return false;
  }

  const configuredOrigins = [
    process.env.EVENTGO_PUBLIC_ORIGIN,
    process.env.AUTH_ORIGIN,
    ...(process.env.EVENTGO_TRUSTED_ORIGINS ?? "")
      .split(","),
  ]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.trim().replace(/\/$/, ""));

  const developmentOrigins =
    process.env.NODE_ENV !== "production"
      ? [
          "http://localhost:3000",
          "http://localhost:3001",
          "http://localhost:3002",
          "http://127.0.0.1:3000",
          "http://127.0.0.1:3001",
          "http://127.0.0.1:3002",
        ]
      : [];

  const allowedOrigins = new Set([
    ...configuredOrigins,
    ...developmentOrigins,
  ]);

  return allowedOrigins.has(origin);
}
