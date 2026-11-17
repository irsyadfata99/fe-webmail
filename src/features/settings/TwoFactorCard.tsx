import { Copy } from "lucide-react";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/api/client";
import type { SecondFactor } from "@/api/auth";
import { accountApi } from "@/api/account";
import { FactorForm } from "@/features/auth/FactorForm";
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

type Mode = "idle" | "setup" | "codes" | "disable" | "regenerate";

function RecoveryCodes({
  codes,
  onDone,
}: {
  codes: string[];
  onDone: () => void;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="grid gap-3">
      <p className="text-sm">
        Save these recovery codes somewhere safe, such as a password manager.
        Each code works once, and they will not be shown again.
      </p>
      <ul className="grid grid-cols-2 gap-2 rounded-xl border bg-background/60 p-3 font-mono text-sm">
        {codes.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => {
            void navigator.clipboard
              .writeText(codes.join("\n"))
              .then(() => setCopied(true))
              .catch(() => setCopied(false));
          }}
        >
          <Copy className="size-4" />
          {copied ? "Copied" : "Copy codes"}
        </Button>
        <Button onClick={onDone}>I have saved them</Button>
      </div>
    </div>
  );
}

export function TwoFactorCard() {
  const qc = useQueryClient();
  const { data, isPending, isError } = useQuery({
    queryKey: ["twofactor"],
    queryFn: accountApi.twoFactorStatus,
  });
  const [mode, setMode] = useState<Mode>("idle");
  const [setup, setSetup] = useState<{
    secret: string;
    otpauthUri: string;
  } | null>(null);
  const [code, setCode] = useState("");
  const [codes, setCodes] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run<T>(fn: () => Promise<T>): Promise<T | null> {
    setBusy(true);
    setError(null);
    try {
      return await fn();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again.",
      );
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function refresh() {
    await qc.invalidateQueries({ queryKey: ["twofactor"] });
    await qc.invalidateQueries({ queryKey: ["session"] });
    await qc.invalidateQueries({ queryKey: ["profile"] });
  }

  async function startSetup() {
    const res = await run(accountApi.twoFactorSetup);
    if (res) {
      setSetup(res);
      setCode("");
      setMode("setup");
    }
  }

  async function enable() {
    const res = await run(() => accountApi.twoFactorEnable(code.trim()));
    if (res) {
      setCodes(res.recoveryCodes);
      setSetup(null);
      setMode("codes");
      await refresh();
    }
  }

  async function disable(factor: SecondFactor) {
    const res = await run(() => accountApi.twoFactorDisable(factor));
    if (res) {
      setMode("idle");
      await refresh();
    }
  }

  async function regenerate(factor: SecondFactor) {
    const res = await run(() => accountApi.newRecoveryCodes(factor));
    if (res) {
      setCodes(res.recoveryCodes);
      setMode("codes");
      await refresh();
    }
  }

  function cancel() {
    setMode("idle");
    setSetup(null);
    setError(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Two-step verification</CardTitle>
        <CardDescription>
          Require a code from an authenticator app when you sign in.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {isPending && (
          <p className="text-sm text-muted-foreground">Loading...</p>
        )}
        {isError && (
          <p className="text-sm text-destructive">
            Could not load the two-step verification status.
          </p>
        )}

        {data && mode === "idle" && (
          <>
            <p className="text-sm">
              Status:{" "}
              <span className="font-semibold">
                {data.enabled ? "On" : "Off"}
              </span>
              {data.enabled && (
                <span className="text-muted-foreground">
                  {" "}
                  · {data.recoveryCodesLeft} recovery codes left
                </span>
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              {!data.enabled && (
                <Button disabled={busy} onClick={() => void startSetup()}>
                  Set up
                </Button>
              )}
              {data.enabled && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setMode("regenerate")}
                  >
                    New recovery codes
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setMode("disable")}
                  >
                    Turn off
                  </Button>
                </>
              )}
            </div>
          </>
        )}

        {mode === "setup" && setup && (
          <div className="grid gap-4">
            <p className="text-sm">
              Scan this QR code with an authenticator app, then enter the
              6-digit code it shows.
            </p>
            <div className="w-fit rounded-xl bg-white p-3">
              <QRCodeSVG value={setup.otpauthUri} size={168} />
            </div>
            <div className="grid gap-1 text-sm">
              <span className="text-muted-foreground">
                Can't scan? Enter this key manually:
              </span>
              <code className="break-all rounded-lg bg-muted px-2 py-1 font-mono text-xs">
                {setup.secret}
              </code>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="enable-code">Verification code</Label>
              <Input
                id="enable-code"
                value={code}
                inputMode="numeric"
                maxLength={6}
                autoComplete="one-time-code"
                placeholder="123456"
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                disabled={busy || code.trim().length !== 6}
                onClick={() => void enable()}
              >
                {busy ? "Verifying..." : "Turn on"}
              </Button>
              <Button variant="outline" disabled={busy} onClick={cancel}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {mode === "codes" && (
          <RecoveryCodes
            codes={codes}
            onDone={() => {
              setCodes([]);
              setMode("idle");
            }}
          />
        )}

        {mode === "disable" && (
          <div className="grid gap-3">
            <p className="text-sm">
              Enter a code to confirm you want to turn off two-step
              verification.
            </p>
            <FactorForm
              submitLabel="Turn off"
              busy={busy}
              onSubmit={(f) => void disable(f)}
              onCancel={cancel}
            />
          </div>
        )}

        {mode === "regenerate" && (
          <div className="grid gap-3">
            <p className="text-sm">
              Enter a code to create new recovery codes. Your old codes will
              stop working.
            </p>
            <FactorForm
              submitLabel="Create new codes"
              busy={busy}
              onSubmit={(f) => void regenerate(f)}
              onCancel={cancel}
            />
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
