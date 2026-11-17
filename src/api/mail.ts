import { api, apiUrl } from "@/api/client";
import type {
  ComposeDraft,
  ComposeMode,
  RsvpResponse,
  DeleteResult,
  FlagName,
  Folder,
  MessageDetail,
  MessagePage,
  MoveResult,
  SavedDraft,
  SaveDraftResult,
  SendPayload,
  SearchResult,
  SendResult,
  TargetRole,
} from "@/types/mail";

// JSON when there are no files; multipart (payload + attachments) otherwise.
function postWithFiles<T>(path: string, payload: SendPayload, files: File[]) {
  if (files.length === 0) return api.post<T>(path, payload);
  const form = new FormData();
  form.append("payload", JSON.stringify(payload));
  for (const f of files) form.append("attachments", f);
  return api.post<T>(path, form);
}

export const mailApi = {
  folders: () =>
    api.get<{ folders: Folder[] }>("/api/mail/folders").then((r) => r.folders),

  messages: (folder: string, page: number, pageSize = 50) =>
    api.get<MessagePage>("/api/mail/messages", {
      query: { folder, page, pageSize },
    }),

  message: (
    folder: string,
    uid: number,
    opts: { images?: boolean; markSeen?: boolean } = {},
  ) =>
    api.get<MessageDetail>(`/api/mail/messages/${uid}`, {
      query: {
        folder,
        images: opts.images || undefined,
        markSeen: opts.markSeen || undefined,
      },
    }),

  setFlags: (
    folder: string,
    uids: number[],
    add: FlagName[],
    remove: FlagName[],
  ) =>
    api.patch<{ count: number }>("/api/mail/messages/flags", {
      folder,
      uids,
      add,
      remove,
    }),

  send: (payload: SendPayload, files: File[]) =>
    postWithFiles<SendResult>("/api/mail/send", payload, files),

  composeDraft: (folder: string, uid: number, mode: ComposeMode) =>
    api.get<ComposeDraft>(`/api/mail/messages/${uid}/draft`, {
      query: { folder, mode },
    }),

  savedDraft: (uid: number) => api.get<SavedDraft>(`/api/mail/drafts/${uid}`),

  saveDraft: (payload: SendPayload, files: File[]) =>
    postWithFiles<SaveDraftResult>("/api/mail/drafts", payload, files),

  deleteDraft: (uid: number) => api.delete<void>(`/api/mail/drafts/${uid}`),

  move: (
    folder: string,
    uids: number[],
    target: { to: string } | { toRole: TargetRole },
  ) =>
    api.post<MoveResult>("/api/mail/messages/move", {
      folder,
      uids,
      ...target,
    }),

  remove: (folder: string, uids: number[]) =>
    api.post<DeleteResult>("/api/mail/messages/delete", { folder, uids }),

  emptyFolder: (folder: string) =>
    api.post<unknown>("/api/mail/folders/empty", { folder }),

  search: (q: string, scope: "folder" | "all", page: number, folder?: string) =>
    api.get<SearchResult>("/api/mail/search", {
      query: { q, scope, page, folder },
    }),

  rsvp: (
    folder: string,
    uid: number,
    response: RsvpResponse,
    comment?: string,
  ) =>
    api.post<unknown>(`/api/mail/messages/${uid}/rsvp`, {
      folder,
      response,
      ...(comment ? { comment } : {}),
    }),

  attachmentUrl: (folder: string, uid: number, index: number) =>
    apiUrl(`/api/mail/messages/${uid}/attachments/${index}`, { folder }),
};
