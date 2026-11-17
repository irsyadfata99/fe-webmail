import {
  Archive,
  CalendarPlus,
  FileText,
  Folder as FolderIcon,
  Inbox,
  LogOut,
  Pencil,
  Search,
  Send,
  Settings,
  ShieldCheck,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import type { ComponentType } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router";
import { Logo } from "@/components/common/Logo";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useCompose } from "@/features/compose/compose-context";
import { ComposeProvider } from "@/features/compose/ComposeProvider";
import { useAuth } from "@/features/auth/auth-context";
import { NoticeProvider } from "@/features/notice/NoticeProvider";
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
  return (
    <NoticeProvider>
      <ComposeProvider>
        <ShellLayout />
      </ComposeProvider>
    </NoticeProvider>
  );
}

function ShellLayout() {
  const { session, logout } = useAuth();
  const compose = useCompose();
  const { data: folders } = useFolders();
  const user = session?.user;
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const currentQuery =
    location.pathname === "/search" ? (params.get("q") ?? "") : "";

  return (
    <div className="flex h-dvh flex-col gap-3 p-3 md:p-4">
      <header className="glass flex h-16 shrink-0 items-center gap-3 rounded-2xl px-4">
        <div className="flex items-center gap-2.5 md:w-56">
          <Logo className="h-9" />
          <span className="brand-name hidden text-xl sm:inline">Motionegg</span>
        </div>
        <form
          role="search"
          key={currentQuery}
          className="mx-auto flex h-11 min-w-0 max-w-2xl flex-1 items-center gap-2 rounded-full bg-muted/60 px-4"
          onSubmit={(e) => {
            e.preventDefault();
            const q = String(
              new FormData(e.currentTarget).get("q") ?? "",
            ).trim();
            if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
          }}
        >
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            name="q"
            type="search"
            defaultValue={currentQuery}
            aria-label="Search mail"
            placeholder="Search mail (from:, to:, subject:, has:attachment)"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </form>
        <ThemeToggle />
        <NavLink
          to="/settings"
          aria-label="Account settings"
          title="Account settings"
          className="hidden rounded-xl px-2 py-1 text-right leading-tight hover:bg-muted sm:block"
        >
          <div className="text-sm font-semibold">{user?.displayName}</div>
          <div className="text-xs text-muted-foreground">{user?.email}</div>
        </NavLink>
        <NavLink
          to="/settings"
          aria-label="Account settings"
          className="flex size-9 items-center justify-center rounded-full hover:bg-muted sm:hidden"
        >
          <Settings className="size-4" />
        </NavLink>
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

      <Button
        className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-30 h-14 gap-2 rounded-2xl px-5 text-[15px] font-semibold shadow-lg md:hidden"
        onClick={() => compose.open()}
      >
        <Pencil className="size-5" />
        Compose
      </Button>

      <div className="flex min-h-0 flex-1 gap-3">
        <nav
          aria-label="Folders"
          className="glass hidden w-60 shrink-0 flex-col gap-1 rounded-2xl p-3 md:flex"
        >
          <Button
            className="mb-3 h-12 justify-start gap-3 rounded-2xl px-5 text-[15px] font-semibold"
            onClick={() => compose.open()}
          >
            <Pencil className="size-5" />
            Compose
          </Button>
          {folders?.map((f) => (
            <FolderLink key={f.path} folder={f} />
          ))}
          <NavLink
            to="/invite"
            className={({ isActive }) =>
              cn(
                "mt-3 flex h-10 items-center gap-3 rounded-full px-4 text-sm transition-colors",
                isActive
                  ? "bg-accent font-semibold text-[var(--gold-deep)] dark:text-[var(--gold)]"
                  : "hover:bg-muted",
              )
            }
          >
            <CalendarPlus className="size-5 shrink-0" />
            New invitation
          </NavLink>
          {user?.role === "ADMIN" && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                cn(
                  "flex h-10 items-center gap-3 rounded-full px-4 text-sm transition-colors",
                  isActive
                    ? "bg-accent font-semibold text-[var(--gold-deep)] dark:text-[var(--gold)]"
                    : "hover:bg-muted",
                )
              }
            >
              <ShieldCheck className="size-5 shrink-0" />
              Administration
            </NavLink>
          )}
        </nav>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <nav
            aria-label="Folders"
            className="flex gap-2 overflow-x-auto md:hidden"
          >
            {folders?.map((f) => (
              <FolderLink key={f.path} folder={f} compact />
            ))}
            <NavLink
              to="/invite"
              className="flex h-9 shrink-0 items-center rounded-full px-4 text-sm hover:bg-muted"
            >
              Invite
            </NavLink>
            {user?.role === "ADMIN" && (
              <NavLink
                to="/admin"
                className="flex h-9 shrink-0 items-center rounded-full px-4 text-sm hover:bg-muted"
              >
                Admin
              </NavLink>
            )}
          </nav>
          <div className="flex min-h-0 flex-1 gap-3">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
