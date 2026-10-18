
import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "../../../lib/sessions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const refreshToken =
    request.cookies.get("eventgo_refresh")?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { authenticated: false },
      {
        status: 401,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }

  try {
    const session = await validateSession(refreshToken);

    if (!session) {
      return NextResponse.json(
        { authenticated: false },
        {
          status: 401,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    return NextResponse.json(
      {
        authenticated: true,
        userId: session.userId,
        role: session.role,
      },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("Session validation failed:", error);

    return NextResponse.json(
      { message: "Session validation unavailable" },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
