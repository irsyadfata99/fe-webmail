import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, type FormEvent } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { adminApi, type AuditQuery } from "@/api/admin";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDateTime } from "./format";

const ACTIONS = [
  "LOGIN_SUCCESS",
  "LOGIN_FAILED",
  "LOGIN_BLOCKED",
  "LOGOUT",
  "MAIL_SENT",
  "PROFILE_UPDATED",
  "PASSWORD_CHANGED",
  "PASSWORD_CHANGE_FAILED",
  "TWO_FACTOR_SETUP_STARTED",
  "TWO_FACTOR_ENABLED",
  "TWO_FACTOR_DISABLED",
  "TWO_FACTOR_VERIFIED",
  "TWO_FACTOR_FAILED",
  "TWO_FACTOR_CODES_REGENERATED",
  "ADMIN_ACCOUNT_CREATE",
  "ADMIN_ACCOUNT_RENAME",
  "ADMIN_ACCOUNT_DELETE",
  "ADMIN_PASSWORD_RESET",
  "ADMIN_QUOTA_SET",
  "ADMIN_TWO_FACTOR_RESET",
];

const selectClass =
  "h-9 rounded-xl border bg-background/60 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function AuditTab() {
  const [filters, setFilters] = useState<Omit<AuditQuery, "page">>({});
  const [draft, setDraft] = useState({
    actor: "",
    target: "",
    action: "",
    from: "",
    to: "",
  });
  const [page, setPage] = useState(1);

  const query: AuditQuery = { page, ...filters };
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["admin", "audit", query],
    queryFn: () => adminApi.auditLogs(query),
    placeholderData: keepPreviousData,
  });

  function apply(e: FormEvent) {
    e.preventDefault();
    const next: Omit<AuditQuery, "page"> = {};
    for (const k of ["actor", "target", "action", "from", "to"] as const) {
      if (draft[k].trim()) next[k] = draft[k].trim();
    }
    setFilters(next);
    setPage(1);
  }

  return (
    <div className="grid gap-4">
      <form onSubmit={apply} className="flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-xs">
          Action
          <select
            className={selectClass}
            value={draft.action}
            onChange={(e) => setDraft({ ...draft, action: e.target.value })}
          >
            <option value="">All actions</option>
            {ACTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs">
          Actor
          <Input
            className="h-9 w-44"
            value={draft.actor}
            onChange={(e) => setDraft({ ...draft, actor: e.target.value })}
            placeholder="name"
          />
        </label>
        <label className="grid gap-1 text-xs">
          Target
          <Input
            className="h-9 w-44"
            value={draft.target}
            onChange={(e) => setDraft({ ...draft, target: e.target.value })}
            placeholder="name"
          />
        </label>
        <label className="grid gap-1 text-xs">
          From
          <Input
            className="h-9"
            type="date"
            value={draft.from}
            onChange={(e) => setDraft({ ...draft, from: e.target.value })}
          />
        </label>
        <label className="grid gap-1 text-xs">
          To
          <Input
            className="h-9"
            type="date"
            value={draft.to}
            onChange={(e) => setDraft({ ...draft, to: e.target.value })}
          />
        </label>
        <Button type="submit">Filter</Button>
      </form>

      <Card className="overflow-hidden py-0">
        <div className="flex h-12 items-center gap-1 border-b px-4">
          <span className="flex-1 text-xs text-muted-foreground">
            {data && data.page.total > 0
              ? `${data.page.start}–${data.page.end} of ${data.page.total.toLocaleString("en-US")}`
              : ""}
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Newer"
            disabled={!data?.page.hasPrev}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Older"
            disabled={!data?.page.hasNext}
            onClick={() => setPage(page + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
        {isPending && (
          <p className="p-4 text-sm text-muted-foreground">Loading...</p>
        )}
        {isError && (
          <div className="p-4 text-sm">
            <p className="text-destructive">
              {error instanceof Error
                ? error.message
                : "Could not load the audit log."}
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
        {data && data.logs.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">
            No entries match these filters.
          </p>
        )}
        {data?.logs.map((l) => (
          <div
            key={l.id}
            className="flex flex-wrap items-baseline gap-x-4 gap-y-0.5 border-b px-4 py-2.5 text-sm last:border-b-0"
          >
            <span className="w-40 shrink-0 text-xs text-muted-foreground">
              {formatDateTime(l.createdAt)}
            </span>
            <span className="w-56 shrink-0 font-mono text-xs">{l.action}</span>
            <span className="min-w-0 flex-1 basis-60 break-words text-xs">
              {l.actorEmail ?? "—"}
              {l.targetEmail && l.targetEmail !== l.actorEmail && (
                <span className="text-muted-foreground">
                  {" "}
                  → {l.targetEmail}
                </span>
              )}
            </span>
            <span className="text-xs text-muted-foreground">
              {l.ipAddress ?? ""}
            </span>
          </div>
        ))}
      </Card>
    </div>
  );
}
