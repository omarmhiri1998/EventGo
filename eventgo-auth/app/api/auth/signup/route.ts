
import { NextRequest, NextResponse } from "next/server";
import { signup } from "@eventgo/backend/services/auth.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const user = await signup({
      name: body.name,
      email: body.email,
      password: body.password,
    });

    return NextResponse.json(
      {
        message: "Account created successfully",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup failed:", error);

    if (error instanceof Error) {
      if (error.message === "Email already registered") {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        );
      }

      if (
        error.message === "Invalid email address" ||
        error.message.startsWith("Name must") ||
        error.message.startsWith("Password must")
      ) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
