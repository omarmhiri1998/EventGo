
import "server-only";

import { getSession } from "@/lib/auth";

export async function requireAdmin() {
  const session = await getSession();

  if (!session) {
    throw new Error("Unauthorized: Authentication required");
  }

  if (session.role !== "admin") {
    throw new Error("Forbidden: Admin access required");
  }

  return session;
}
