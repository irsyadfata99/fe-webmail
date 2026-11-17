import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-context";

// Placeholder sementara; nanti diganti shell inbox ala Gmail.
export default function HomePage() {
  const { session, logout } = useAuth();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-6">
      <h1 className="text-xl font-semibold">
        Halo, {session?.user.displayName}
      </h1>
      <p className="text-sm text-muted-foreground">
        {session?.user.email} ({session?.user.role})
      </p>
      <Button variant="outline" onClick={() => void logout()}>
        Keluar
      </Button>
    </main>
  );
}
