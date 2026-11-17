import { api, apiUrl } from "@/api/client";
import type {
  FlagName,
  Folder,
  MessageDetail,
  MessagePage,
} from "@/types/mail";

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

  attachmentUrl: (folder: string, uid: number, index: number) =>
    apiUrl(`/api/mail/messages/${uid}/attachments/${index}`, { folder }),
};
