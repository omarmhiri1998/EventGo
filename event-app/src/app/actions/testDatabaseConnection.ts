"use server";

import { connectDB } from "@eventgo/backend";

export async function testDatabaseConnection() {
  await connectDB();

  return {
    success: true,
  };
}