import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { folderLabel } from "@/components/layout/AppShell";
import { cn } from "@/lib/utils";
import { useFolders, useSearch, useSetFlags } from "./hooks";
import { MessageRow } from "./MessageRow";
import MessageReader from "./MessageReader";

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q")?.trim() ?? "";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const uid = Number(params.get("uid")) || null;
  const openFolder = params.get("f");

  const { data, isPending, isError, error, refetch } = useSearch(q, page);
  const { data: folders } = useFolders();
  const setFlags = useSetFlags("INBOX");

  const folderInfo = (path: string) => folders?.find((f) => f.path === path);
  const roleOf = (path: string) => folderInfo(path)?.role ?? "other";
  const labelOf = (path: string) => {
    const f = folderInfo(path);
    return f ? folderLabel(f) : path;
  };

  function go(next: { uid?: number | null; f?: string | null; page?: number }) {
    const p = new URLSearchParams(params);
    if (next.uid !== undefined) {
      if (next.uid === null) {
        p.delete("uid");
        p.delete("f");
      } else p.set("uid", String(next.uid));
    }
    if (next.f) p.set("f", next.f);
    if (next.page !== undefined) {
      if (next.page <= 1) p.delete("page");
      else p.set("page", String(next.page));
    }
    setParams(p);
  }

  const open = uid && openFolder ? { uid, folder: openFolder } : null;

  return (
    <>
      <section
        aria-label="Search results"
        className={cn(
          "glass min-w-0 flex-1 flex-col overflow-hidden rounded-2xl",
          open ? "hidden lg:flex" : "flex",
        )}
      >
        <div className="flex h-13 shrink-0 items-center gap-1 border-b px-4">
          <span className="min-w-0 flex-1 truncate text-sm">
            Results for <span className="font-semibold">{q || "…"}</span>
          </span>
          {data && data.total > 0 && (
            <span className="text-xs text-muted-foreground">
              {data.start}–{data.end} of {data.totalIsEstimate ? "about " : ""}
              {data.total.toLocaleString("en-US")}
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
          {!q && (
            <p className="p-6 text-sm text-muted-foreground">
              Type something in the search box. Operators work too: from:, to:,
              subject:, has:attachment, is:unread, is:starred, after:, before:.
            </p>
          )}
          {q && isPending && (
            <p className="p-6 text-sm text-muted-foreground">Searching...</p>
          )}
          {isError && (
            <div className="p-6 text-sm">
              <p className="text-destructive">
                {error instanceof Error ? error.message : "Search failed."}
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
              No messages match your search.
            </p>
          )}
          {data?.messages.map((m) => (
            <MessageRow
              key={`${m.folder}:${m.uid}`}
              m={m}
              selected={open?.uid === m.uid && open.folder === m.folder}
              showRecipient={
                roleOf(m.folder) === "sent" || roleOf(m.folder) === "drafts"
              }
              badge={labelOf(m.folder)}
              onOpen={() => go({ uid: m.uid, f: m.folder })}
              onStar={() =>
                setFlags.mutate(
                  m.flagged
                    ? { folder: m.folder, uid: m.uid, remove: ["flagged"] }
                    : { folder: m.folder, uid: m.uid, add: ["flagged"] },
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
          open ? "flex flex-1 lg:flex-none" : "hidden lg:flex",
        )}
      >
        {open ? (
          <MessageReader
            key={`${open.folder}:${open.uid}`}
            folder={open.folder}
            role={roleOf(open.folder)}
            uid={open.uid}
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
