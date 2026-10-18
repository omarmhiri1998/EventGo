
"use server";

import { requireAdmin } from "@/lib/require-admin";
import { connectDB } from "@eventgo/backend";

export async function testDatabaseConnection() {
  await requireAdmin();

  await connectDB();

  return {
    success: true,
  };
}
