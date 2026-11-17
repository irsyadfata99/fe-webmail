import { Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/api/client";
import { adminApi, type AdminAccount } from "@/api/admin";
import { PasswordInput } from "@/components/common/PasswordInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/auth-context";
import { formatDateTime } from "./format";

const QUOTA = /^[1-9]\d{0,5}[MG]$/;

function errText(err: unknown): string {
  return err instanceof ApiError
    ? err.message
    : "Something went wrong. Please try again.";
}

function CreateAccount({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [quota, setQuota] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (password.length < 12)
      return setMsg({
        ok: false,
        text: "The password must be at least 12 characters.",
      });
    if (quota.trim() && !QUOTA.test(quota.trim().toUpperCase()))
      return setMsg({ ok: false, text: "Quota must look like 500M or 2G." });
    setBusy(true);
    try {
      const res = await adminApi.create({
        email: email.trim(),
        password,
        ...(displayName.trim() ? { displayName: displayName.trim() } : {}),
        ...(quota.trim() ? { quota: quota.trim().toUpperCase() } : {}),
      });
      setMsg({
        ok: true,
        text:
          res.quotaApplied || !quota.trim()
            ? "Account created."
            : "Account created, but the quota could not be applied.",
      });
      setEmail("");
      setDisplayName("");
      setPassword("");
      setQuota("");
      onCreated();
    } catch (err) {
      setMsg({ ok: false, text: errText(err) });
    } finally {
      setBusy(false);
    }
  }

  if (!open)
    return (
      <div>
        <Button className="gap-2" onClick={() => setOpen(true)}>
          <Plus className="size-4" /> New account
        </Button>
      </div>
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle>New account</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => void submit(e)}
          className="grid gap-4 sm:grid-cols-2"
        >
          <div className="grid gap-2">
            <Label htmlFor="na-email">Email</Label>
            <Input
              id="na-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name or name@motioneggstudios.com"
              required
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="na-name">Display name (optional)</Label>
            <Input
              id="na-name"
              value={displayName}
              maxLength={80}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="na-pass">Temporary password</Label>
            <PasswordInput
              id="na-pass"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="na-quota">Quota (optional)</Label>
            <Input
              id="na-quota"
              value={quota}
              onChange={(e) => setQuota(e.target.value)}
              placeholder="2G"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
            <Button type="submit" disabled={busy}>
              {busy ? "Creating..." : "Create account"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => setOpen(false)}
            >
              Close
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

function ManagePanel({
  account,
  isSelf,
  onChanged,
}: {
  account: AdminAccount;
  isSelf: boolean;
  onChanged: () => void;
}) {
  const [quota, setQuota] = useState(account.quota ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState<null | "2fa" | "delete">(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function run(
    fn: () => Promise<unknown>,
    done: string,
    after?: () => void,
  ) {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
      setMsg({ ok: true, text: done });
      after?.();
      onChanged();
    } catch (err) {
      setMsg({ ok: false, text: errText(err) });
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  }

  return (
    <div className="grid gap-4 border-t bg-muted/30 p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <form
          className="grid gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const q = quota.trim().toUpperCase();
            if (q && !QUOTA.test(q))
              return setMsg({
                ok: false,
                text: "Quota must look like 500M or 2G.",
              });
            void run(
              () => adminApi.setQuota(account.email, q || null),
              q ? "Quota updated." : "Quota removed.",
            );
          }}
        >
          <Label htmlFor={`q-${account.email}`}>
            Quota (empty means unlimited)
          </Label>
          <div className="flex gap-2">
            <Input
              id={`q-${account.email}`}
              value={quota}
              onChange={(e) => setQuota(e.target.value)}
              placeholder="2G"
            />
            <Button type="submit" variant="outline" disabled={busy}>
              Save
            </Button>
          </div>
        </form>
        <form
          className="grid gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (password.length < 12)
              return setMsg({
                ok: false,
                text: "The password must be at least 12 characters.",
              });
            void run(
              () => adminApi.resetPassword(account.email, password),
              "Password reset. The user has been signed out everywhere.",
              () => setPassword(""),
            );
          }}
        >
          <Label htmlFor={`p-${account.email}`}>Reset password</Label>
          <div className="flex gap-2">
            <div className="min-w-0 flex-1">
              <PasswordInput
                id={`p-${account.email}`}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password"
              />
            </div>
            <Button
              type="submit"
              variant="outline"
              disabled={busy || !password}
            >
              Reset
            </Button>
          </div>
        </form>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {!isSelf && (
          <Button
            variant="outline"
            disabled={busy}
            onClick={() =>
              void run(
                () => adminApi.setActive(account.email, !account.isActive),
                account.isActive ? "Account disabled." : "Account enabled.",
              )
            }
          >
            {account.isActive ? "Disable account" : "Enable account"}
          </Button>
        )}
        {account.twoFactorEnabled &&
          (confirm === "2fa" ? (
            <span className="flex items-center gap-2 text-sm">
              Reset two-step verification?
              <Button
                size="sm"
                variant="destructive"
                disabled={busy}
                onClick={() =>
                  void run(
                    () => adminApi.resetTwoFactor(account.email),
                    "Two-step verification reset.",
                  )
                }
              >
                Reset
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirm(null)}
              >
                Cancel
              </Button>
            </span>
          ) : (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setConfirm("2fa")}
            >
              Reset 2FA
            </Button>
          ))}
        {!isSelf &&
          (confirm === "delete" ? (
            <span className="flex items-center gap-2 text-sm">
              Delete {account.email} and all its mail?
              <Button
                size="sm"
                variant="destructive"
                disabled={busy}
                onClick={() =>
                  void run(
                    () => adminApi.remove(account.email),
                    "Account deleted.",
                  )
                }
              >
                Delete
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirm(null)}
              >
                Cancel
              </Button>
            </span>
          ) : (
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() => setConfirm("delete")}
            >
              Delete account
            </Button>
          ))}
      </div>
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
  );
}

export function AccountsTab() {
  const qc = useQueryClient();
  const { session } = useAuth();
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["admin", "accounts"],
    queryFn: adminApi.accounts,
  });
  const [openEmail, setOpenEmail] = useState<string | null>(null);
  const reload = () =>
    void qc.invalidateQueries({ queryKey: ["admin", "accounts"] });

  return (
    <div className="grid gap-4">
      <CreateAccount onCreated={reload} />
      <Card className="overflow-hidden py-0">
        {isPending && (
          <p className="p-4 text-sm text-muted-foreground">
            Loading accounts...
          </p>
        )}
        {isError && (
          <div className="p-4 text-sm">
            <p className="text-destructive">
              {error instanceof Error
                ? error.message
                : "Could not load accounts."}
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
        {data?.map((a) => (
          <div key={a.email} className="border-b last:border-b-0">
            <button
              type="button"
              aria-expanded={openEmail === a.email}
              onClick={() =>
                setOpenEmail(openEmail === a.email ? null : a.email)
              }
              className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-left hover:bg-muted"
            >
              <span className="min-w-0 flex-1 basis-56">
                <span className="block truncate text-sm font-semibold">
                  {a.displayName}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {a.email}
                </span>
              </span>
              <span className="w-16 text-xs">
                {a.role === "ADMIN" ? "Admin" : "User"}
              </span>
              <span
                className={
                  a.isActive ? "w-20 text-xs" : "w-20 text-xs text-destructive"
                }
              >
                {a.isActive ? "Active" : "Disabled"}
              </span>
              <span className="w-14 text-xs text-muted-foreground">
                {a.twoFactorEnabled ? "2FA on" : "2FA off"}
              </span>
              <span className="w-14 text-xs text-muted-foreground">
                {a.quota ?? "No limit"}
              </span>
              <span className="w-36 text-xs text-muted-foreground">
                {a.lastLoginAt
                  ? formatDateTime(a.lastLoginAt)
                  : "Never signed in"}
              </span>
            </button>
            {openEmail === a.email && (
              <ManagePanel
                account={a}
                isSelf={a.email === session?.user.email}
                onChanged={reload}
              />
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}
