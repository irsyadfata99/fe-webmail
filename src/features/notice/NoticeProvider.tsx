import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import {
  NoticeContext,
  type NoticeAction,
  type NoticeApi,
} from "./notice-context";

interface Notice {
  id: number;
  message: string;
  action?: NoticeAction;
}

// Small bottom-left toast, with an optional action such as "Undo".
export function NoticeProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<Notice | null>(null);

  const show = useCallback((message: string, action?: NoticeAction) => {
    setNotice((prev) => ({ id: (prev?.id ?? 0) + 1, message, action }));
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(
      () => setNotice(null),
      notice.action ? 9000 : 5000,
    );
    return () => window.clearTimeout(t);
  }, [notice]);

  const value = useMemo<NoticeApi>(() => ({ show }), [show]);

  return (
    <NoticeContext.Provider value={value}>
      {children}
      {notice && (
        <div
          role="status"
          className="glass-strong glass fixed bottom-4 left-4 z-[60] flex items-center gap-3 rounded-xl py-2 pl-4 pr-2 text-sm"
        >
          <span>{notice.message}</span>
          {notice.action && (
            <Button
              size="sm"
              variant="ghost"
              className="font-semibold text-[var(--gold-deep)] dark:text-[var(--gold)]"
              onClick={() => {
                notice.action?.onClick();
                setNotice(null);
              }}
            >
              {notice.action.label}
            </Button>
          )}
        </div>
      )}
    </NoticeContext.Provider>
  );
}
