
"use server";

import { requireAdmin } from "@/lib/require-admin";

import {
  getSalesOverview,
  getDailyRevenue,
  getDailyTicketSales,
  getEventsByCategory,
  getMostPopularEvents,
  getUserGrowth,
  getSalesHeatmap,
} from "@eventgo/backend/services/analytics.service";

export async function getSalesOverviewAction() {
  await requireAdmin();

  return getSalesOverview();
}

export async function getDailyRevenueAction() {
  await requireAdmin();

  return getDailyRevenue();
}

export async function getDailyTicketSalesAction() {
  await requireAdmin();

  return getDailyTicketSales();
}

export async function getEventsByCategoryAction() {
  await requireAdmin();

  return getEventsByCategory();
}

export async function getMostPopularEventsAction() {
  await requireAdmin();

  return getMostPopularEvents();
}

export async function getUserGrowthAction() {
  await requireAdmin();

  return getUserGrowth();
}

export async function getSalesHeatmapAction() {
  await requireAdmin();

  return getSalesHeatmap();
}
