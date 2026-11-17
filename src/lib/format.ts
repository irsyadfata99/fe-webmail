import { format, isSameYear, isToday } from "date-fns";
import type { MailAddress } from "@/types/mail";

export function displayName(addr: MailAddress | undefined): string {
  if (!addr) return "(no sender)";
  return addr.name.trim() || addr.address;
}

// Message list: today → time, this year → short date, otherwise full date.
export function formatListDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  if (isToday(d)) return format(d, "h:mm a");
  if (isSameYear(d, new Date())) return format(d, "MMM d");
  return format(d, "MMM d, yyyy");
}

export function formatFullDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return format(d, "EEEE, MMMM d, yyyy 'at' h:mm a");
}

export function formatEventRange(
  start: string,
  end: string,
  allDay: boolean,
): string {
  const s = new Date(allDay ? `${start}T00:00:00` : start);
  const e = new Date(allDay ? `${end}T00:00:00` : end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return "";
  if (allDay) {
    return s.getTime() === e.getTime()
      ? format(s, "EEEE, MMMM d, yyyy")
      : `${format(s, "MMM d")} – ${format(e, "MMM d, yyyy")}`;
  }
  const sameDay = format(s, "yyyyMMdd") === format(e, "yyyyMMdd");
  return sameDay
    ? `${format(s, "EEEE, MMMM d, yyyy")} · ${format(s, "h:mm a")} – ${format(e, "h:mm a")}`
    : `${format(s, "MMM d, yyyy, h:mm a")} – ${format(e, "MMM d, yyyy, h:mm a")}`;
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
