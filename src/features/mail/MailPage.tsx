import {
  ChevronLeft,
  ChevronRight,
  Paperclip,
  RefreshCw,
  Star,
} from "lucide-react";
import { useParams, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { displayName, formatListDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MessageSummary } from "@/types/mail";
import { useFolders, useMessages, useSetFlags } from "./hooks";
import MessageReader from "./MessageReader";

function MessageRow({
  m,
  selected,
  showRecipient,
  onOpen,
  onStar,
}: {
  m: MessageSummary;
  selected: boolean;
  showRecipient: boolean;
  onOpen: () => void;
  onStar: () => void;
}) {
  const who = showRecipient
    ? `To: ${displayName(m.to[0])}`
    : displayName(m.from[0]);
  const weight = m.seen ? "font-normal" : "font-semibold";
  return (
    <div
      className={cn(
        "flex items-center gap-1 border-b px-2 transition-colors hover:bg-muted",
        selected && "bg-accent",
      )}
    >
      <button
        type="button"
        onClick={onStar}
        aria-label={m.flagged ? "Remove star" : "Add star"}
        aria-pressed={m.flagged}
        className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
      >
        <Star
          className={cn(
            "size-[18px]",
            m.flagged && "fill-[var(--gold)] text-[var(--gold)]",
          )}
        />
      </button>
      <button
        type="button"
        onClick={onOpen}
        className="flex min-h-14 min-w-0 flex-1 items-center gap-3 py-2 text-left"
      >
        <span className={cn("w-32 shrink-0 truncate text-sm sm:w-40", weight)}>
          {who}
        </span>
        <span className="flex min-w-0 flex-1 items-center gap-2 text-sm">
          <span className={cn("truncate", weight)}>
            {m.subject || "(no subject)"}
          </span>
        </span>
        {m.hasAttachments && (
          <Paperclip
            className="size-4 shrink-0 text-muted-foreground"
            aria-label="Has attachment"
          />
        )}
        <span className={cn("w-14 shrink-0 text-right text-xs", weight)}>
          {formatListDate(m.date)}
        </span>
      </button>
    </div>
  );
}

export default function MailPage() {
  const { folder = "INBOX" } = useParams();
  const [params, setParams] = useSearchParams();
  const uid = Number(params.get("uid")) || null;
  const page = Math.max(1, Number(params.get("page")) || 1);

  const { data, isPending, isError, error, refetch, isFetching } = useMessages(
    folder,
    page,
  );
  const { data: folders } = useFolders();
  const setFlags = useSetFlags(folder);
  const role = folders?.find((f) => f.path === folder)?.role ?? "other";
  const showRecipient = role === "sent" || role === "drafts";

  function go(next: { uid?: number | null; page?: number }) {
    const p = new URLSearchParams(params);
    if (next.uid !== undefined) {
      if (next.uid === null) p.delete("uid");
      else p.set("uid", String(next.uid));
    }
    if (next.page !== undefined) {
      if (next.page <= 1) p.delete("page");
      else p.set("page", String(next.page));
    }
    setParams(p);
  }

  return (
    <>
      <section
        aria-label="Message list"
        className={cn(
          "glass min-w-0 flex-1 flex-col overflow-hidden rounded-2xl",
          uid ? "hidden lg:flex" : "flex",
        )}
      >
        <div className="flex h-13 shrink-0 items-center gap-1 border-b px-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Refresh"
            onClick={() => void refetch()}
          >
            <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
          </Button>
          <div className="flex-1" />
          {data && data.total > 0 && (
            <span className="text-xs text-muted-foreground">
              {data.start}–{data.end} of {data.total.toLocaleString("en-US")}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Newer"
            disabled={!data?.hasPrev}
            onClick={() => go({ page: page - 1, uid: null })}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Older"
            disabled={!data?.hasNext}
            onClick={() => go({ page: page + 1, uid: null })}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {isPending && (
            <p className="p-6 text-sm text-muted-foreground">
              Loading messages...
            </p>
          )}
          {isError && (
            <div className="p-6 text-sm">
              <p className="text-destructive">
                {error instanceof Error
                  ? error.message
                  : "Failed to load messages."}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => void refetch()}
              >
                Try again
              </Button>
            </div>
          )}
          {data && data.messages.length === 0 && (
            <p className="p-6 text-sm text-muted-foreground">
              No messages in this folder.
            </p>
          )}
          {data?.messages.map((m) => (
            <MessageRow
              key={m.uid}
              m={m}
              selected={m.uid === uid}
              showRecipient={showRecipient}
              onOpen={() => go({ uid: m.uid })}
              onStar={() =>
                setFlags.mutate(
                  m.flagged
                    ? { uid: m.uid, remove: ["flagged"] }
                    : { uid: m.uid, add: ["flagged"] },
                )
              }
            />
          ))}
        </div>
      </section>

      <article
        aria-label="Message"
        className={cn(
          "glass-strong glass min-w-0 flex-col overflow-hidden rounded-2xl lg:w-[44%] lg:max-w-[560px] lg:shrink-0",
          uid ? "flex flex-1 lg:flex-none" : "hidden lg:flex",
        )}
      >
        {uid ? (
          <MessageReader
            key={`${folder}:${uid}`}
            folder={folder}
            uid={uid}
            onBack={() => go({ uid: null })}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
            Select a message to read
          </div>
        )}
      </article>
    </>
  );
}
