import { Check, HelpCircle, X } from "lucide-react";
import { useState, type ComponentType } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/api/client";
import { mailApi } from "@/api/mail";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RsvpResponse } from "@/types/mail";
import { refreshMail } from "./hooks";

const OPTIONS: {
  value: RsvpResponse;
  label: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  { value: "accepted", label: "Accept", icon: Check },
  { value: "tentative", label: "Maybe", icon: HelpCircle },
  { value: "declined", label: "Decline", icon: X },
];

const SENT_LABEL: Record<RsvpResponse, string> = {
  accepted: "You accepted this invitation.",
  tentative: "You replied Maybe.",
  declined: "You declined this invitation.",
};

function asResponse(v: string | null | undefined): RsvpResponse | null {
  return v === "accepted" || v === "tentative" || v === "declined" ? v : null;
}

interface Props {
  folder: string;
  uid: number;
  /** Response already recorded on the message, if any. */
  current: string | null;
}

// Accept / Maybe / Decline for an incoming invitation. The reply goes to the organizer.
export function RsvpButtons({ folder, uid, current }: Props) {
  const qc = useQueryClient();
  const [pending, setPending] = useState<RsvpResponse | null>(null);
  const [done, setDone] = useState<RsvpResponse | null>(asResponse(current));
  const [error, setError] = useState<string | null>(null);

  async function respond(response: RsvpResponse) {
    setPending(response);
    setError(null);
    try {
      await mailApi.rsvp(folder, uid, response);
      setDone(response);
      refreshMail(qc);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not send your reply. Please try again.",
      );
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {done && <p className="text-sm font-medium">{SENT_LABEL[done]}</p>}
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map(({ value, label, icon: Icon }) => (
          <Button
            key={value}
            size="sm"
            variant={done === value ? "default" : "outline"}
            disabled={pending !== null}
            aria-pressed={done === value}
            className={cn("gap-1.5")}
            onClick={() => void respond(value)}
          >
            <Icon className="size-4" />
            {pending === value ? "Sending..." : label}
          </Button>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
