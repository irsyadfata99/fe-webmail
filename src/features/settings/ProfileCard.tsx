import { useEffect, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/api/client";
import { accountApi } from "@/api/account";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileCard() {
  const qc = useQueryClient();
  const { data, isPending, isError } = useQuery({
    queryKey: ["profile"],
    queryFn: accountApi.profile,
  });
  const [displayName, setDisplayName] = useState("");
  const [signature, setSignature] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (data) {
      setDisplayName(data.displayName);
      setSignature(data.signature ?? "");
    }
  }, [data]);

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await accountApi.updateProfile({ displayName, signature });
      await qc.invalidateQueries({ queryKey: ["profile"] });
      await qc.invalidateQueries({ queryKey: ["session"] });
      setMsg({ ok: true, text: "Profile saved." });
    } catch (err) {
      setMsg({
        ok: false,
        text:
          err instanceof ApiError
            ? err.message
            : "Could not save your profile.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Your name and the signature added to new messages.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isPending && (
          <p className="text-sm text-muted-foreground">Loading...</p>
        )}
        {isError && (
          <p className="text-sm text-destructive">
            Could not load your profile.
          </p>
        )}
        {data && (
          <form onSubmit={(e) => void save(e)} className="grid gap-4">
            <div className="grid gap-2">
              <Label>Email</Label>
              <p className="text-sm text-muted-foreground">{data.email}</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                value={displayName}
                maxLength={80}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="signature">Signature</Label>
              <textarea
                id="signature"
                value={signature}
                maxLength={2000}
                onChange={(e) => setSignature(e.target.value)}
                className="h-28 w-full rounded-xl border bg-background/60 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={busy}>
                {busy ? "Saving..." : "Save"}
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
        )}
      </CardContent>
    </Card>
  );
}
