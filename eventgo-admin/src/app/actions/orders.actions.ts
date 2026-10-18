
"use server";

import { requireAdmin } from "@/lib/require-admin";

import {
  getAdminOrders,
} from "@eventgo/backend/services/order.service";

export async function getAdminOrdersAction(
  page = 1,
  search = "",
  status = ""
) {
  await requireAdmin();

  return getAdminOrders(page, search, status);
}
