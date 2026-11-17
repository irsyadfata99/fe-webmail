import { Paperclip, Star } from "lucide-react";
import { displayName, formatListDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MessageSummary } from "@/types/mail";

interface Props {
  m: MessageSummary;
  selected: boolean;
  showRecipient: boolean;
  onOpen: () => void;
  onStar: () => void;
  /** Bulk-selection checkbox (omit to hide it). */
  checked?: boolean;
  onCheck?: (checked: boolean) => void;
  /** Folder name shown as a small badge (search results). */
  badge?: string;
}

export function MessageRow({
  m,
  selected,
  showRecipient,
  onOpen,
  onStar,
  checked,
  onCheck,
  badge,
}: Props) {
  const who = showRecipient
    ? `To: ${displayName(m.to[0])}`
    : displayName(m.from[0]);
  const weight = m.seen ? "font-normal" : "font-semibold";
  return (
    <div
      className={cn(
        "flex items-center gap-1 border-b px-2 transition-colors hover:bg-muted",
        (selected || checked) && "bg-accent",
      )}
    >
      {onCheck && (
        <input
          type="checkbox"
          aria-label={`Select message from ${who}`}
          checked={checked ?? false}
          onChange={(e) => onCheck(e.target.checked)}
          className="mx-2 size-4 shrink-0 cursor-pointer accent-[var(--gold)]"
        />
      )}
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
      {/* Phones: sender and date on the first line, subject below. Wider screens: one row. */}
      <button
        type="button"
        onClick={onOpen}
        className="flex min-h-14 min-w-0 flex-1 flex-col justify-center gap-0.5 py-2 text-left sm:flex-row sm:items-center sm:gap-3"
      >
        <span className="flex min-w-0 items-center gap-2 sm:contents">
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-sm sm:order-1 sm:w-40 sm:flex-none",
              weight,
            )}
          >
            {who}
          </span>
          <span
            className={cn(
              "shrink-0 text-right text-xs sm:order-3 sm:w-14",
              weight,
            )}
          >
            {formatListDate(m.date)}
          </span>
        </span>
        <span className="flex min-w-0 items-center gap-2 text-sm sm:order-2 sm:flex-1">
          {badge && (
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {badge}
            </span>
          )}
          <span className={cn("min-w-0 truncate", weight)}>
            {m.subject || "(no subject)"}
          </span>
          {m.hasAttachments && (
            <Paperclip
              className="ml-auto size-4 shrink-0 text-muted-foreground"
              aria-label="Has attachment"
            />
          )}
        </span>
      </button>
    </div>
  );
}
