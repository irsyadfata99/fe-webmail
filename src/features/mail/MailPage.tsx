import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useParams, useSearchParams } from "react-router";
import { ApiError } from "@/api/client";
import { mailApi } from "@/api/mail";
import { Button } from "@/components/ui/button";
import { useCompose } from "@/features/compose/compose-context";
import { cn } from "@/lib/utils";
import { ActionBar } from "./ActionBar";
import { useMailActions } from "./actions";
import { useFolders, useMessages, useSetFlags } from "./hooks";
import { MessageRow } from "./MessageRow";
import MessageReader from "./MessageReader";

function EmptyFolderButton({
  folder,
  label,
}: {
  folder: string;
  label: string;
}) {
  const actions = useMailActions(folder);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!confirming) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
        Empty {label} now
      </Button>
    );
  }
  return (
    <div role="alert" className="flex items-center gap-2 text-sm">
      <span>Delete everything in {label}?</span>
      <Button
        size="sm"
        variant="destructive"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          void actions.emptyFolder().finally(() => {
            setBusy(false);
            setConfirming(false);
          });
        }}
      >
        Empty
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
  const compose = useCompose();
  const [openError, setOpenError] = useState<string | null>(null);

  // Selection belongs to one folder + page; changing either clears it.
  const selectionKey = `${folder}:${page}`;
  const [selection, setSelection] = useState<{ key: string; uids: number[] }>({
    key: selectionKey,
    uids: [],
  });
  const selected = selection.key === selectionKey ? selection.uids : [];
  const setSelected = (uids: number[]) =>
    setSelection({ key: selectionKey, uids });

  const folderInfo = folders?.find((f) => f.path === folder);
  const role = folderInfo?.role ?? "other";
  const showRecipient = role === "sent" || role === "drafts";
  const allChecked =
    !!data &&
    data.messages.length > 0 &&
    selected.length === data.messages.length;

  // Messages in Drafts reopen in the compose window instead of the reading pane.
  async function openDraft(draftUid: number) {
    setOpenError(null);
    try {
      const d = await mailApi.savedDraft(draftUid);
      const esc = (t: string) =>
        t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      compose.open({
        to: d.to,
        cc: d.cc,
        bcc: d.bcc,
        subject: d.subject,
        html:
          d.html ??
          d.text
            .split(/\r?\n/)
            .map((l) => `<p>${esc(l)}</p>`)
            .join(""),
        inReplyTo: d.inReplyTo ?? undefined,
        references: d.references,
        original: d.original ?? undefined,
        draft: { uid: d.uid, attachments: d.attachments },
        noSignature: true,
      });
    } catch (err) {
      setOpenError(
        err instanceof ApiError ? err.message : "Could not open the draft.",
      );
    }
  }

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
          <input
            type="checkbox"
            aria-label="Select all"
            checked={allChecked}
            disabled={!data || data.messages.length === 0}
            onChange={(e) =>
              setSelected(
                e.target.checked && data ? data.messages.map((m) => m.uid) : [],
              )
            }
            className="mx-2 size-4 cursor-pointer accent-[var(--gold)]"
          />
          {selected.length > 0 ? (
            <>
              <span className="mr-1 text-sm text-muted-foreground">
                {selected.length} selected
              </span>
              <ActionBar
                folder={folder}
                role={role}
                uids={selected}
                bulk
                onDone={() => {
                  setSelected([]);
                  if (uid && selected.includes(uid)) go({ uid: null });
                }}
              />
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Refresh"
                onClick={() => void refetch()}
              >
                <RefreshCw
                  className={cn("size-4", isFetching && "animate-spin")}
                />
              </Button>
              {(role === "trash" || role === "junk") &&
                data &&
                data.total > 0 && (
                  <EmptyFolderButton
                    folder={folder}
                    label={role === "trash" ? "Trash" : "Spam"}
                  />
                )}
            </>
          )}
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
          {openError && (
            <p role="alert" className="px-4 py-2 text-sm text-destructive">
              {openError}
            </p>
          )}
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
              checked={selected.includes(m.uid)}
              onCheck={(on) =>
                setSelected(
                  on
                    ? [...selected, m.uid]
                    : selected.filter((u) => u !== m.uid),
                )
              }
              onOpen={() =>
                role === "drafts" ? void openDraft(m.uid) : go({ uid: m.uid })
              }
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
            role={role}
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
