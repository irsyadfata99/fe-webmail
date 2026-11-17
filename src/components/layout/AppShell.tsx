import {
  Archive,
  FileText,
  Folder as FolderIcon,
  Inbox,
  LogOut,
  Pencil,
  Send,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import type { ComponentType } from "react";
import { NavLink, Outlet } from "react-router";
import { Logo } from "@/components/common/Logo";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-context";
import { useFolders } from "@/features/mail/hooks";
import { cn } from "@/lib/utils";
import type { Folder, FolderRole } from "@/types/mail";

const ROLE_LABEL: Record<FolderRole, string> = {
  inbox: "Inbox",
  sent: "Sent",
  drafts: "Drafts",
  junk: "Spam",
  trash: "Trash",
  archive: "Archive",
  other: "",
};

const ROLE_ICON: Record<FolderRole, ComponentType<{ className?: string }>> = {
  inbox: Inbox,
  sent: Send,
  drafts: FileText,
  junk: ShieldAlert,
  trash: Trash2,
  archive: Archive,
  other: FolderIcon,
};

export function folderLabel(f: Pick<Folder, "role" | "name">): string {
  return ROLE_LABEL[f.role] || f.name;
}

function FolderLink({
  folder,
  compact,
}: {
  folder: Folder;
  compact?: boolean;
}) {
  const Icon = ROLE_ICON[folder.role];
  // Drafts show the total; other folders show the unread count.
  const count = folder.role === "drafts" ? folder.messages : folder.unseen;
  return (
    <NavLink
      to={`/mail/${encodeURIComponent(folder.path)}`}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-full text-sm transition-colors",
          compact ? "h-9 shrink-0 px-4" : "h-10 px-4",
          isActive
            ? "bg-accent font-semibold text-[var(--gold-deep)] dark:text-[var(--gold)]"
            : "hover:bg-muted",
        )
      }
    >
      {!compact && <Icon className="size-5 shrink-0" />}
      <span className="flex-1 truncate">{folderLabel(folder)}</span>
      {count > 0 && <span className="text-xs font-semibold">{count}</span>}
    </NavLink>
  );
}

export default function AppShell() {
  const { session, logout } = useAuth();
  const { data: folders } = useFolders();
  const user = session?.user;

  return (
    <div className="flex h-dvh flex-col gap-3 p-3 md:p-4">
      <header className="glass flex h-16 shrink-0 items-center gap-3 rounded-2xl px-4">
        <div className="flex items-center gap-2.5 md:w-56">
          <Logo className="h-9" />
          <span className="brand-name hidden text-xl sm:inline">Motionegg</span>
        </div>
        <div className="flex-1" />
        <ThemeToggle />
        <div className="hidden text-right leading-tight sm:block">
          <div className="text-sm font-semibold">{user?.displayName}</div>
          <div className="text-xs text-muted-foreground">{user?.email}</div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Sign out"
          title="Sign out"
          onClick={() => void logout()}
        >
          <LogOut className="size-4" />
        </Button>
      </header>

      <div className="flex min-h-0 flex-1 gap-3">
        <nav
          aria-label="Folders"
          className="glass hidden w-60 shrink-0 flex-col gap-1 rounded-2xl p-3 md:flex"
        >
          <Button
            className="mb-3 h-12 justify-start gap-3 rounded-2xl px-5 text-[15px] font-semibold"
            disabled
            title="Coming soon"
          >
            <Pencil className="size-5" />
            Compose
          </Button>
          {folders?.map((f) => (
            <FolderLink key={f.path} folder={f} />
          ))}
        </nav>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <nav
            aria-label="Folders"
            className="flex gap-2 overflow-x-auto md:hidden"
          >
            {folders?.map((f) => (
              <FolderLink key={f.path} folder={f} compact />
            ))}
          </nav>
          <div className="flex min-h-0 flex-1 gap-3">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
