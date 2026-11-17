import {
  lazy,
  Suspense,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNotice } from "@/features/notice/notice-context";
import {
  ComposeContext,
  type ComposeApi,
  type ComposeInit,
} from "./compose-context";

// The rich-text editor is large, so it only loads when the first message is composed.
const ComposePanel = lazy(() => import("./ComposePanel"));

export function ComposeProvider({ children }: { children: ReactNode }) {
  const { show } = useNotice();
  const [session, setSession] = useState<{
    id: number;
    init: ComposeInit;
  } | null>(null);

  const open = useCallback((init: ComposeInit = {}) => {
    setSession((prev) => ({ id: (prev?.id ?? 0) + 1, init }));
  }, []);
  const close = useCallback(() => setSession(null), []);

  const value = useMemo<ComposeApi>(
    () => ({ open, close, isOpen: session !== null }),
    [open, close, session],
  );

  return (
    <ComposeContext.Provider value={value}>
      {children}
      {session && (
        <Suspense fallback={null}>
          <ComposePanel
            key={session.id}
            init={session.init}
            onFinish={(message) => {
              close();
              if (message) show(message);
            }}
          />
        </Suspense>
      )}
    </ComposeContext.Provider>
  );
}
