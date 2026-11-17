import { X } from "lucide-react";
import { useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL.test(value);
}

interface Props {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  autoFocus?: boolean;
}

// Chip-style recipient field: Enter, comma, semicolon or space turns the text into a chip.
export function RecipientInput({ label, value, onChange, autoFocus }: Props) {
  const [draft, setDraft] = useState("");

  function commit(raw: string) {
    const parts = raw
      .split(/[\s,;]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (parts.length === 0) return;
    const next = [...value];
    for (const p of parts) if (!next.includes(p)) next.push(p);
    onChange(next);
    setDraft("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (
      (e.key === "Enter" || e.key === "," || e.key === ";" || e.key === " ") &&
      draft.trim()
    ) {
      e.preventDefault();
      commit(draft);
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text");
    if (/[\s,;]/.test(text.trim())) {
      e.preventDefault();
      commit(draft + text);
    }
  }

  return (
    <div className="flex items-start gap-2 border-b px-4 py-2">
      <span className="w-10 shrink-0 pt-1.5 text-xs text-muted-foreground">
        {label}
      </span>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        {value.map((addr) => (
          <span
            key={addr}
            className={cn(
              "flex max-w-full items-center gap-1 rounded-full bg-accent py-0.5 pl-3 pr-1 text-sm",
              !isValidEmail(addr) && "bg-destructive/15 text-destructive",
            )}
          >
            <span className="truncate">{addr}</span>
            <button
              type="button"
              aria-label={`Remove ${addr}`}
              className="flex size-5 items-center justify-center rounded-full hover:bg-muted"
              onClick={() => onChange(value.filter((a) => a !== addr))}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          aria-label={label}
          autoFocus={autoFocus}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          onBlur={() => commit(draft)}
          className="h-8 min-w-32 flex-1 bg-transparent text-sm outline-none"
          type="text"
          inputMode="email"
          autoComplete="off"
        />
      </div>
    </div>
  );
}
