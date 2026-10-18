"use server";

import { requireAdmin } from "@/lib/require-admin";

import {
  getAdminEvents,
  createEvent,
  type CreateEventInput,
} from "@eventgo/backend/services/event.service";

export async function getAdminEventsAction() {
  await requireAdmin();

  return getAdminEvents();
}

export async function createEventAction(
  input: CreateEventInput
) {
  await requireAdmin();

  try {
    const result = await createEvent(input);

    return {
      success: true as const,
      eventId: result.eventId,
    };
  } catch (error) {
    console.error("Create event failed:", error);

    return {
      success: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create event.",
    };
  }
}