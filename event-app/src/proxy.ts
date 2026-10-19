import { NextResponse } from "next/server";

export function proxy() {
  return NextResponse.redirect(
    "https://event-app-nine-rose.vercel.app/auth/login"
  );
}

export const config = {
  matcher: ["/"],
};