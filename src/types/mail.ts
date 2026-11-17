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

export type RsvpResponse = "accepted" | "tentative" | "declined";

export type FlagName = "seen" | "flagged";

export interface OriginalRef {
  folder: string;
  uid: number;
  kind: "reply" | "forward";
}

export type ComposeMode = "reply" | "replyAll" | "forward";

/** Reply/forward starting point prepared by the server. */
export interface ComposeDraft {
  to: string[];
  cc: string[];
  subject: string;
  inReplyTo?: string;
  references: string[];
  text: string;
  html: string;
}

export interface DraftAttachment {
  /** Position inside the saved draft; sent back as keepAttachments. */
  index: number;
  filename: string;
  contentType: string;
  size: number;
}

export interface SavedDraft {
  uid: number;
  folder: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  text: string;
  html: string | null;
  inReplyTo: string | null;
  references: string[];
  original: OriginalRef | null;
  attachments: DraftAttachment[];
}

export interface SaveDraftResult {
  saved: boolean;
  uid: number | null;
  folder: string | null;
}

/** Body for /send and /drafts (drafts may be incomplete). */
export interface SendPayload {
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  html: string;
  text: string;
  inReplyTo?: string;
  references?: string[];
  original?: OriginalRef;
  forwardAttachments?: boolean;
  /** /send only: send from a saved draft, keeping some of its attachments. */
  draft?: { uid: number; keepAttachments: number[] };
  /** /drafts only: replace the previous version of this draft. */
  replaceUid?: number;
  keepAttachments?: number[];
}

export interface SendResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
  sentCopy: boolean | string | null;
}

export type TargetRole = "inbox" | "spam" | "trash" | "archive";

export interface UidPair {
  from: number;
  to: number;
}

export interface MoveResult {
  moved: number;
  folder: string;
  uidMap: UidPair[];
}

export interface DeleteResult {
  permanent: boolean;
  count: number;
  folder: string | null;
  uidMap: UidPair[];
}

export interface SearchHit extends MessageSummary {
  folder: string;
}

export interface SearchResult {
  q: string;
  scope: "folder" | "all";
  totalIsEstimate: boolean;
  messages: SearchHit[];
  total: number;
  page: number;
  pageSize: number;
  start: number;
  end: number;
  hasNext: boolean;
  hasPrev: boolean;
}
