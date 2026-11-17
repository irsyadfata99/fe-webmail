export type FolderRole =
  | "inbox"
  | "drafts"
  | "sent"
  | "junk"
  | "trash"
  | "archive"
  | "other";

export interface Folder {
  path: string;
  name: string;
  delimiter: string | null;
  role: FolderRole;
  messages: number;
  unseen: number;
  subscribed: boolean;
}

export interface MailAddress {
  name: string;
  address: string;
}

export interface MessageSummary {
  uid: number;
  subject: string;
  from: MailAddress[];
  to: MailAddress[];
  date: string | null;
  size: number;
  seen: boolean;
  flagged: boolean;
  answered: boolean;
  draft: boolean;
  hasAttachments: boolean;
}

export interface MessagePage {
  folder: string;
  messages: MessageSummary[];
  total: number;
  page: number;
  pageSize: number;
  start: number;
  end: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface AttachmentInfo {
  index: number;
  filename: string;
  contentType: string;
  size: number;
  inline: boolean;
  cid: string | null;
}

export interface Invitation {
  method: string;
  eventUid: string;
  title: string;
  description: string | null;
  location: string | null;
  allDay: boolean;
  start: string;
  end: string;
  timezone: string | null;
  meetUrl: string | null;
  cancelled: boolean;
  canRespond: boolean;
}

export interface MessageDetail {
  folder: string;
  uid: number;
  subject: string;
  from: MailAddress[];
  to: MailAddress[];
  cc: MailAddress[];
  bcc: MailAddress[];
  replyTo: MailAddress[];
  date: string | null;
  messageId: string | null;
  text: string | null;
  html: string | null;
  blockedImages: number;
  attachments: AttachmentInfo[];
  invitation?: Invitation | null;
  size: number;
  seen: boolean;
  flagged: boolean;
  answered: boolean;
  draft: boolean;
  rsvp: string | null;
}

export type FlagName = "seen" | "flagged";
