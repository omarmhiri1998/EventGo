
"use server";

import { requireAdmin } from "@/lib/require-admin";

import {
  getAdminCities,
} from "@eventgo/backend/services/city.service";

export async function getAdminCitiesAction(
  page = 1,
  search = ""
) {
  await requireAdmin();

  return getAdminCities(page, search);
}
