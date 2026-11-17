import { useState } from "react";
import { Navigate } from "react-router";
import { useAuth } from "@/features/auth/auth-context";
import { cn } from "@/lib/utils";
import { AccountsTab } from "./AccountsTab";
import { AuditTab } from "./AuditTab";

export default function AdminPage() {
  const { session } = useAuth();
  const [tab, setTab] = useState<"accounts" | "audit">("accounts");
  if (session?.user.role !== "ADMIN")
    return <Navigate to="/mail/INBOX" replace />;

  return (
    <section aria-label="Admin" className="min-w-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 pb-6">
        <h1 className="px-1 text-lg font-semibold">Administration</h1>
        <div role="tablist" className="flex gap-2">
          {(
            [
              ["accounts", "Accounts"],
              ["audit", "Audit log"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={cn(
                "h-9 rounded-full px-4 text-sm transition-colors",
                tab === id
                  ? "bg-accent font-semibold text-[var(--gold-deep)] dark:text-[var(--gold)]"
                  : "hover:bg-muted",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {tab === "accounts" ? <AccountsTab /> : <AuditTab />}
      </div>
    </section>
  );
}
