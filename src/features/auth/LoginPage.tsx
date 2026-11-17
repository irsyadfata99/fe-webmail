import { useState, type FormEvent } from "react";
import { Navigate, useLocation } from "react-router";
import { ApiError } from "@/api/client";
import { Logo } from "@/components/common/Logo";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/common/PasswordInput";
import { Label } from "@/components/ui/label";
import { useAuth } from "./auth-context";

export default function LoginPage() {
  const { session, login } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? "/";
  if (session && !session.twoFactorRequired)
    return <Navigate to={from} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center p-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-3">
          <Logo className="h-20" />
          <span className="brand-name text-2xl">Motionegg Studios</span>
        </div>
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Sign in to Webmail</CardTitle>
            <CardDescription>Use your work email and password.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  placeholder="name@motioneggstudios.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <PasswordInput
                  id="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {session?.twoFactorRequired && (
                <p className="text-sm text-muted-foreground">
                  This account uses two-factor authentication. The verification
                  screen is coming in the next step.
                </p>
              )}
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button type="submit" disabled={busy}>
                {busy ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
