import { useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/api/client";
import { mailApi } from "@/api/mail";
import { useNotice } from "@/features/notice/notice-context";
import type { TargetRole } from "@/types/mail";
import { refreshMail } from "./hooks";

function plural(n: number): string {
  return n === 1 ? "1 message" : `${n} messages`;
}

const MOVE_LABEL: Record<TargetRole, string> = {
  archive: "archived",
  spam: "reported as spam",
  inbox: "moved to Inbox",
  trash: "moved to Trash",
};

// Message actions for one folder. Moves and deletes offer "Undo" through the toast.
export function useMailActions(folder: string) {
  const qc = useQueryClient();
  const { show } = useNotice();

  async function guard<T>(fn: () => Promise<T>): Promise<T | null> {
    try {
      return await fn();
    } catch (err) {
      show(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again.",
      );
      return null;
    }
  }

  function undoMove(from: string, uids: number[]) {
    return {
      label: "Undo",
      onClick: () => {
        mailApi
          .move(from, uids, { to: folder })
          .then(() => refreshMail(qc))
          .catch(() => show("Could not undo."));
      },
    };
  }

  async function moveTo(uids: number[], toRole: TargetRole): Promise<boolean> {
    const r = await guard(() => mailApi.move(folder, uids, { toRole }));
    if (!r) return false;
    refreshMail(qc);
    show(
      `${plural(r.moved)} ${MOVE_LABEL[toRole]}.`,
      undoMove(
        r.folder,
        r.uidMap.map((p) => p.to),
      ),
    );
    return true;
  }

  async function remove(uids: number[]): Promise<boolean> {
    const r = await guard(() => mailApi.remove(folder, uids));
    if (!r) return false;
    refreshMail(qc);
    if (r.permanent || !r.folder)
      show(`${plural(r.count)} deleted permanently.`);
    else
      show(
        `${plural(r.count)} moved to Trash.`,
        undoMove(
          r.folder,
          r.uidMap.map((p) => p.to),
        ),
      );
    return true;
  }

  async function markRead(uids: number[], read: boolean): Promise<boolean> {
    const r = await guard(() =>
      mailApi.setFlags(
        folder,
        uids,
        read ? ["seen"] : [],
        read ? [] : ["seen"],
      ),
    );
    if (!r) return false;
    refreshMail(qc);
    show(read ? "Marked as read." : "Marked as unread.");
    return true;
  }

  async function emptyFolder(): Promise<boolean> {
    const r = await guard(() => mailApi.emptyFolder(folder));
    if (r === null) return false;
    refreshMail(qc);
    show("Folder emptied.");
    return true;
  }

  return { moveTo, remove, markRead, emptyFolder };
}
