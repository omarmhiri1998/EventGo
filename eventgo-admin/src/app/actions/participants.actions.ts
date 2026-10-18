
"use server";

import { requireAdmin } from "@/lib/require-admin";

import {
  getParticipants,
  getParticipantEvents,
} from "@eventgo/backend/services/participant.service";

export async function getParticipantsAction(
  page = 1,
  search = "",
  eventId = ""
) {
  await requireAdmin();

  return getParticipants(page, search, eventId);
}

export async function getParticipantEventsAction() {
  await requireAdmin();

  return getParticipantEvents();
}
