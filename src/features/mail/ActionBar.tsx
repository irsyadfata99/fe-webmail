import {
  Archive,
  Inbox,
  Mail,
  MailOpen,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useState, type ComponentType } from "react";
import { Button } from "@/components/ui/button";
import type { FolderRole } from "@/types/mail";
import { useMailActions } from "./actions";

interface Props {
  folder: string;
  role: FolderRole;
  uids: number[];
  /** Called after an action succeeds (clear selection, close the reader, ...). */
  onDone: () => void;
  /** Bulk mode also offers "Mark as read". */
  bulk?: boolean;
}

function IconAction({
  label,
  icon: Icon,
  disabled,
  onClick,
}: {
  label: string;
  icon: ComponentType<{ className?: string }>;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon className="size-4" />
    </Button>
  );
}

// Archive / spam / delete / read-state actions, adapted to the folder they apply to.
export function ActionBar({ folder, role, uids, onDone, bulk }: Props) {
  const actions = useMailActions(folder);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const permanent = role === "junk" || role === "trash" || role === "drafts";

  async function run(fn: () => Promise<boolean>) {
    setBusy(true);
    const ok = await fn();
    setBusy(false);
    setConfirming(false);
    if (ok) onDone();
  }

  if (confirming) {
    return (
      <div role="alert" className="flex items-center gap-2 text-sm">
        <span>
          Delete{" "}
          {uids.length === 1 ? "this message" : `${uids.length} messages`}{" "}
          forever?
        </span>
        <Button
          size="sm"
          variant="destructive"
          disabled={busy}
          onClick={() => void run(() => actions.remove(uids))}
        >
          Delete
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => setConfirming(false)}
        >
          Cancel
        </Button>
      </div>
    );
  }

  const canArchive = role === "inbox" || role === "sent" || role === "other";
  const canSpam = role === "inbox" || role === "archive" || role === "other";

  return (
    <div className="flex items-center gap-0.5">
      {canArchive && (
        <IconAction
          label="Archive"
          icon={Archive}
          disabled={busy}
          onClick={() => void run(() => actions.moveTo(uids, "archive"))}
        />
      )}
      {canSpam && (
        <IconAction
          label="Report spam"
          icon={ShieldAlert}
          disabled={busy}
          onClick={() => void run(() => actions.moveTo(uids, "spam"))}
        />
      )}
      {role === "junk" && (
        <IconAction
          label="Not spam"
          icon={ShieldCheck}
          disabled={busy}
          onClick={() => void run(() => actions.moveTo(uids, "inbox"))}
        />
      )}
      {role === "trash" && (
        <IconAction
          label="Move to Inbox"
          icon={Inbox}
          disabled={busy}
          onClick={() => void run(() => actions.moveTo(uids, "inbox"))}
        />
      )}
      <IconAction
        label={permanent ? "Delete forever" : "Delete"}
        icon={Trash2}
        disabled={busy}
        onClick={() =>
          permanent ? setConfirming(true) : void run(() => actions.remove(uids))
        }
      />
      {role !== "drafts" && (
        <>
          {bulk && (
            <IconAction
              label="Mark as read"
              icon={MailOpen}
              disabled={busy}
              onClick={() => void run(() => actions.markRead(uids, true))}
            />
          )}
          <IconAction
            label="Mark as unread"
            icon={Mail}
            disabled={busy}
            onClick={() => void run(() => actions.markRead(uids, false))}
          />
        </>
      )}
    </div>
  );
}
