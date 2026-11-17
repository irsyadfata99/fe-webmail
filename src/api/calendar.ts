import { api } from "./client";

export interface InvitationInput {
  title: string;
  allDay: boolean;
  /** Timed: ISO 8601 with offset. All-day: YYYY-MM-DD. */
  start: string;
  end: string;
  timezone: string;
  attendees: string[];
  location?: string;
  description?: string;
  meetUrl?: string;
}

export interface InvitationResult {
  eventUid: string;
  sequence: number;
  accepted: string[];
  rejected: string[];
}

export const calendarApi = {
  createInvitation: (body: InvitationInput) =>
    api.post<InvitationResult>("/api/mail/invitations", body),
};
