import { CalendarPlus, Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/api/client";
import { calendarApi } from "@/api/calendar";
import { Button } from "@/components/ui/button";
import {
  RecipientInput,
  isValidEmail,
} from "@/features/compose/RecipientInput";
import { useNotice } from "@/features/notice/notice-context";
import { refreshMail } from "@/features/mail/hooks";

// Jakarta has no daylight saving, so a fixed offset is exact.
const TIMEZONE = "Asia/Jakarta";
const OFFSET = "+07:00";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// Next full hour, as a datetime-local value.
function defaultStart(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`;
}

function addHour(local: string): string {
  const d = new Date(`${local}:00`);
  d.setHours(d.getHours() + 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const fieldClass =
  "h-10 w-full rounded-xl border bg-background/60 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}

export default function InvitePage() {
  const qc = useQueryClient();
  const { show } = useNotice();
  const [title, setTitle] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(() => addHour(defaultStart()));
  const [startDay, setStartDay] = useState(() => defaultStart().slice(0, 10));
  const [endDay, setEndDay] = useState(() => defaultStart().slice(0, 10));
  const [attendees, setAttendees] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [meetUrl, setMeetUrl] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) return setError("Please enter a title.");
    if (attendees.length === 0) return setError("Add at least one attendee.");
    const bad = attendees.find((a) => !isValidEmail(a));
    if (bad) return setError(`"${bad}" is not a valid email address.`);
    const s = allDay ? startDay : `${start}:00${OFFSET}`;
    const en = allDay ? endDay : `${end}:00${OFFSET}`;
    if (allDay ? endDay < startDay : new Date(en) <= new Date(s))
      return setError("The end must be after the start.");
    if (meetUrl.trim() && !/^https?:\/\//i.test(meetUrl.trim()))
      return setError("The meeting link must start with http:// or https://.");

    setBusy(true);
    try {
      const res = await calendarApi.createInvitation({
        title: title.trim(),
        allDay,
        start: s,
        end: en,
        timezone: TIMEZONE,
        attendees,
        ...(location.trim() ? { location: location.trim() } : {}),
        ...(meetUrl.trim() ? { meetUrl: meetUrl.trim() } : {}),
        ...(description.trim() ? { description: description.trim() } : {}),
      });
      refreshMail(qc);
      show(
        res.rejected.length > 0
          ? `Invitation sent, but rejected for: ${res.rejected.join(", ")}`
          : "Invitation sent.",
      );
      setTitle("");
      setAttendees([]);
      setLocation("");
      setMeetUrl("");
      setDescription("");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not send the invitation. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      aria-label="New invitation"
      className="glass min-w-0 flex-1 overflow-y-auto rounded-2xl"
    >
      <form
        onSubmit={(e) => void submit(e)}
        className="mx-auto flex max-w-2xl flex-col gap-4 p-6"
      >
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <CalendarPlus className="size-5 text-[var(--gold-deep)] dark:text-[var(--gold)]" />
          New invitation
        </h1>

        <Field label="Title">
          <input
            className={fieldClass}
            value={title}
            maxLength={200}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Weekly animation review"
            autoFocus
          />
        </Field>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={allDay}
            onChange={(e) => setAllDay(e.target.checked)}
            className="size-4 accent-[var(--gold)]"
          />
          All day
        </label>

        {allDay ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Start date">
              <input
                type="date"
                className={fieldClass}
                value={startDay}
                onChange={(e) => {
                  setStartDay(e.target.value);
                  if (endDay < e.target.value) setEndDay(e.target.value);
                }}
              />
            </Field>
            <Field label="End date (inclusive)">
              <input
                type="date"
                className={fieldClass}
                value={endDay}
                min={startDay}
                onChange={(e) => setEndDay(e.target.value)}
              />
            </Field>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Starts">
              <input
                type="datetime-local"
                className={fieldClass}
                value={start}
                onChange={(e) => {
                  setStart(e.target.value);
                  if (e.target.value) setEnd(addHour(e.target.value));
                }}
              />
            </Field>
            <Field label="Ends">
              <input
                type="datetime-local"
                className={fieldClass}
                value={end}
                min={start}
                onChange={(e) => setEnd(e.target.value)}
              />
            </Field>
          </div>
        )}
        <p className="-mt-2 text-xs text-muted-foreground">
          Times use Western Indonesia Time (WIB, UTC+7).
        </p>

        <div className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Attendees</span>
          <div className="overflow-hidden rounded-xl border bg-background/60 [&>div]:border-b-0">
            <RecipientInput
              label="To"
              value={attendees}
              onChange={setAttendees}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            Press Enter, comma, or space after each email address.
          </span>
        </div>

        <Field label="Meeting link (optional)">
          <input
            className={fieldClass}
            value={meetUrl}
            maxLength={500}
            onChange={(e) => setMeetUrl(e.target.value)}
            placeholder="Paste a Google Meet or Zoom link"
            inputMode="url"
          />
        </Field>
        <Field label="Location (optional)">
          <input
            className={fieldClass}
            value={location}
            maxLength={300}
            onChange={(e) => setLocation(e.target.value)}
          />
        </Field>
        <Field label="Description (optional)">
          <textarea
            className={`${fieldClass} h-28 py-2`}
            value={description}
            maxLength={5000}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <div>
          <Button type="submit" disabled={busy} className="gap-2">
            <Send className="size-4" />
            {busy ? "Sending..." : "Send invitation"}
          </Button>
        </div>
      </form>
    </section>
  );
}
