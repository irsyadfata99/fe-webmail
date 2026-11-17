import { useState, type FormEvent } from "react";
import type { SecondFactor } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  submitLabel: string;
  busy: boolean;
  onSubmit: (factor: SecondFactor) => void;
  onCancel?: () => void;
}

// Asks for a 6-digit authenticator code, or a recovery code as an alternative.
export function FactorForm({ submitLabel, busy, onSubmit, onCancel }: Props) {
  const [useRecovery, setUseRecovery] = useState(false);
  const [value, setValue] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    const v = value.trim();
    if (!v) return;
    onSubmit(useRecovery ? { recoveryCode: v } : { code: v });
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <div className="grid gap-2">
        <Label htmlFor="factor">
          {useRecovery ? "Recovery code" : "Authenticator code"}
        </Label>
        <Input
          id="factor"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoComplete="one-time-code"
          inputMode={useRecovery ? "text" : "numeric"}
          maxLength={useRecovery ? 40 : 6}
          placeholder={useRecovery ? "xxxxx-xxxxx" : "123456"}
          autoFocus
          required
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={busy}>
          {busy ? "Verifying..." : submitLabel}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
        <button
          type="button"
          className="ml-auto text-xs text-muted-foreground underline-offset-2 hover:underline"
          onClick={() => {
            setUseRecovery((v) => !v);
            setValue("");
          }}
        >
          {useRecovery ? "Use authenticator code" : "Use a recovery code"}
        </button>
      </div>
    </form>
  );
}
