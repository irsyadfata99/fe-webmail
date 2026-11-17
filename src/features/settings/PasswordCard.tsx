import { useState, type FormEvent } from "react";
import { ApiError } from "@/api/client";
import { accountApi } from "@/api/account";
import { PasswordInput } from "@/components/common/PasswordInput";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const MIN = 12;

export function PasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (next.length < MIN)
      return setMsg({
        ok: false,
        text: `The new password must be at least ${MIN} characters.`,
      });
    if (next !== confirm)
      return setMsg({ ok: false, text: "The new passwords do not match." });
    setBusy(true);
    try {
      await accountApi.changePassword(current, next);
      setCurrent("");
      setNext("");
      setConfirm("");
      setMsg({
        ok: true,
        text: "Password changed. Your other devices have been signed out.",
      });
    } catch (err) {
      setMsg({
        ok: false,
        text:
          err instanceof ApiError
            ? err.message
            : "Could not change your password.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Password</CardTitle>
        <CardDescription>
          Use at least {MIN} characters. Other devices are signed out when you
          change it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => void submit(e)} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="cur">Current password</Label>
            <PasswordInput
              id="cur"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new">New password</Label>
            <PasswordInput
              id="new"
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="conf">Confirm new password</Label>
            <PasswordInput
              id="conf"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={busy}>
              {busy ? "Changing..." : "Change password"}
            </Button>
            {msg && (
              <p
                role={msg.ok ? "status" : "alert"}
                className={
                  msg.ok
                    ? "text-sm text-muted-foreground"
                    : "text-sm text-destructive"
                }
              >
                {msg.text}
              </p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
