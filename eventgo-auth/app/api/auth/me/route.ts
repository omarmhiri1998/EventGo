
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../../../lib/auth";
import { pool } from "../../../../../eventgo-backend/src/db/database";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);

  if (!auth) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const result = await pool.query<{
      id: string;
      name: string | null;
      email: string;
      role: string;
    }>(
      `
      SELECT id, name, email, role
      FROM users
      WHERE id = $1
      `,
      [auth.userId]
    );

    const user = result.rows[0];

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { user },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Get user error:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
