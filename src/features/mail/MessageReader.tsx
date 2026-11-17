import {
  ArrowLeft,
  Calendar,
  FileText,
  Forward,
  Reply,
  ReplyAll,
  Star,
  Video,
} from "lucide-react";
import { useMemo, useState } from "react";
import { ApiError } from "@/api/client";
import { mailApi } from "@/api/mail";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  displayName,
  formatEventRange,
  formatFullDate,
  formatSize,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ComposeMode, FolderRole, MailAddress } from "@/types/mail";
import { ActionBar } from "./ActionBar";
import { RsvpButtons } from "./RsvpButtons";
import { useCompose } from "@/features/compose/compose-context";
import { useMessage, useSetFlags } from "./hooks";

function addressLine(list: MailAddress[]): string {
  return list
    .map((a) => (a.name ? `${a.name} <${a.address}>` : a.address))
    .join(", ");
}

function buildDoc(html: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><base target="_blank"><style>body{margin:0;padding:16px;font:14px/1.55 Inter,system-ui,sans-serif;color:#1b1710;word-wrap:break-word}img{max-width:100%;height:auto}a{color:#8a5f0e}</style></head><body>${html}</body></html>`;
}

export default function MessageReader({
  folder,
  role,
  uid,
  onBack,
}: {
  folder: string;
  role: FolderRole;
  uid: number;
  onBack: () => void;
}) {
  const [showImages, setShowImages] = useState(false);
  const {
    data: msg,
    isPending,
    isError,
    error,
  } = useMessage(folder, uid, showImages);
  const setFlags = useSetFlags(folder);
  const compose = useCompose();
  const [opening, setOpening] = useState<ComposeMode | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const doc = useMemo(
    () => (msg?.html ? buildDoc(msg.html) : null),
    [msg?.html],
  );

  if (isPending)
    return (
      <p className="p-6 text-sm text-muted-foreground">Opening message...</p>
    );
  if (isError || !msg) {
    return (
      <div className="p-6 text-sm">
        <Button
          variant="ghost"
          size="sm"
          className="mb-3 lg:hidden"
          onClick={onBack}
        >
          <ArrowLeft className="size-4" /> Back
        </Button>
        <p className="text-destructive">
          {error instanceof Error ? error.message : "Failed to open message."}
        </p>
      </div>
    );
  }

  const sender = msg.from[0];
  const inv = msg.invitation;
  const meetUrl =
    inv?.meetUrl && inv.meetUrl.startsWith("https://") ? inv.meetUrl : null;
  const files = msg.attachments.filter((a) => !a.inline);
  const canReplyAll = msg.to.length + msg.cc.length > 1;

  async function startCompose(mode: ComposeMode) {
    setOpening(mode);
    setActionError(null);
    try {
      const d = await mailApi.composeDraft(folder, uid, mode);
      compose.open({
        to: d.to,
        cc: d.cc,
        subject: d.subject,
        html: d.html,
        inReplyTo: d.inReplyTo,
        references: d.references,
        original: {
          folder,
          uid,
          kind: mode === "forward" ? "forward" : "reply",
        },
        forwardAttachments: mode === "forward" && files.length > 0,
      });
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? err.message
          : "Could not start the reply. Please try again.",
      );
    } finally {
      setOpening(null);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5">
      <div className="-mt-1 flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Back"
          onClick={onBack}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <ActionBar folder={folder} role={role} uids={[uid]} onDone={onBack} />
      </div>
      <div className="flex items-start gap-2">
        <h2 className="flex-1 text-xl font-semibold leading-snug">
          {msg.subject || "(no subject)"}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          aria-label={msg.flagged ? "Remove star" : "Add star"}
          aria-pressed={msg.flagged}
          onClick={() =>
            setFlags.mutate(
              msg.flagged
                ? { uid, remove: ["flagged"] }
                : { uid, add: ["flagged"] },
            )
          }
        >
          <Star
            className={cn(
              "size-4",
              msg.flagged && "fill-[var(--gold)] text-[var(--gold)]",
            )}
          />
        </Button>
      </div>

      <div className="flex items-start gap-3">
        <div
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent font-semibold text-[var(--gold-deep)] dark:text-[var(--gold)]"
        >
          {displayName(sender).charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1 leading-snug">
          <div className="truncate text-sm font-semibold">
            {displayName(sender)}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {sender?.address}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {formatFullDate(msg.date)}
          </div>
          {msg.to.length > 0 && (
            <div className="mt-0.5 break-words text-xs text-muted-foreground">
              To: {addressLine(msg.to)}
            </div>
          )}
          {msg.cc.length > 0 && (
            <div className="break-words text-xs text-muted-foreground">
              Cc: {addressLine(msg.cc)}
            </div>
          )}
        </div>
      </div>

      {inv && (
        <div className="flex flex-col gap-3 rounded-2xl border bg-accent p-4">
          <div className="flex items-start gap-3">
            <Calendar className="mt-0.5 size-5 shrink-0 text-[var(--gold-deep)] dark:text-[var(--gold)]" />
            <div className="min-w-0 leading-snug">
              <div className="text-sm font-semibold">
                {inv.title}
                {inv.cancelled && (
                  <span className="ml-2 text-xs font-normal text-destructive">
                    Cancelled
                  </span>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {formatEventRange(inv.start, inv.end, inv.allDay)}
              </div>
              {inv.location && (
                <div className="text-sm text-muted-foreground">
                  {inv.location}
                </div>
              )}
            </div>
          </div>
          {meetUrl && (
            <a
              href={meetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "justify-center gap-2",
              )}
            >
              <Video className="size-4" /> Join meeting
            </a>
          )}
          {inv.canRespond && !inv.cancelled && (
            <RsvpButtons
              key={`${folder}:${uid}`}
              folder={folder}
              uid={uid}
              current={msg.rsvp}
            />
          )}
        </div>
      )}

      {msg.blockedImages > 0 && !showImages && (
        <div className="flex items-center gap-3 rounded-xl border px-3 py-2 text-sm">
          <span className="flex-1 text-muted-foreground">
            {msg.blockedImages} external images blocked.
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowImages(true)}
          >
            Show
          </Button>
        </div>
      )}

      {doc ? (
        <iframe
          title="Message body"
          sandbox="allow-popups allow-popups-to-escape-sandbox"
          srcDoc={doc}
          className="min-h-[360px] w-full flex-1 rounded-xl border bg-white"
        />
      ) : (
        <pre className="whitespace-pre-wrap break-words rounded-xl border bg-card p-4 font-sans text-sm leading-relaxed">
          {msg.text ?? "(empty message)"}
        </pre>
      )}

      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          {files.map((a) => (
            <a
              key={a.index}
              href={mailApi.attachmentUrl(folder, uid, a.index)}
              className="flex h-12 items-center gap-3 rounded-xl border px-4 text-sm hover:bg-muted"
            >
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate font-medium">
                {a.filename || "attachment"}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatSize(a.size)}
              </span>
            </a>
          ))}
        </div>
      )}

      {actionError && (
        <p role="alert" className="text-sm text-destructive">
          {actionError}
        </p>
      )}
      <div className="flex flex-wrap gap-2 pt-1">
        <Button
          variant="outline"
          className="gap-2 rounded-full"
          disabled={opening !== null}
          onClick={() => void startCompose("reply")}
        >
          <Reply className="size-4" />{" "}
          {opening === "reply" ? "Opening..." : "Reply"}
        </Button>
        {canReplyAll && (
          <Button
            variant="outline"
            className="gap-2 rounded-full"
            disabled={opening !== null}
            onClick={() => void startCompose("replyAll")}
          >
            <ReplyAll className="size-4" />{" "}
            {opening === "replyAll" ? "Opening..." : "Reply all"}
          </Button>
        )}
        <Button
          variant="outline"
          className="gap-2 rounded-full"
          disabled={opening !== null}
          onClick={() => void startCompose("forward")}
        >
          <Forward className="size-4" />{" "}
          {opening === "forward" ? "Opening..." : "Forward"}
        </Button>
      </div>
    </div>
  );
}
