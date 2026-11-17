import { format } from "date-fns";

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : format(d, "MMM d, yyyy h:mm a");
}
