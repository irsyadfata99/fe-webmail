import { createContext, useContext } from "react";
import type { DraftAttachment, OriginalRef } from "@/types/mail";

export interface ComposeInit {
  to?: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  /** Initial HTML body (e.g. quoted text for replies). */
  html?: string;
  /** Message being replied to / forwarded. */
  original?: OriginalRef;
  inReplyTo?: string;
  references?: string[];
  /** Forward: include the original message's attachments. */
  forwardAttachments?: boolean;
  /** Reopened saved draft (its attachments are kept unless removed). */
  draft?: { uid: number; attachments: DraftAttachment[] };
  /** Skip adding the signature (a saved draft already contains it). */
  noSignature?: boolean;
}

export interface ComposeApi {
  open: (init?: ComposeInit) => void;
  close: () => void;
  isOpen: boolean;
}

export const ComposeContext = createContext<ComposeApi | null>(null);

export function useCompose(): ComposeApi {
  const ctx = useContext(ComposeContext);
  if (!ctx) throw new Error("useCompose must be used inside ComposeProvider");
  return ctx;
}
