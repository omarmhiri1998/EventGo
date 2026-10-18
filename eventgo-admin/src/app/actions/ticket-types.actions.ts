
"use server";

import { requireAdmin } from "@/lib/require-admin";

import {
  getAdminTicketTypes,
} from "@eventgo/backend/services/ticket-type.service";

export async function getAdminTicketTypesAction(
  page = 1,
  search = ""
) {
  await requireAdmin();

  return getAdminTicketTypes(page, search);
}
