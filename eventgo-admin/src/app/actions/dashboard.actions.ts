
"use server";

import { requireAdmin } from "@/lib/require-admin";

import {
  getDashboardData,
} from "@eventgo/backend/services/dashboard.service";

export async function getDashboardDataAction() {
  await requireAdmin();

  return getDashboardData();
}
