import { createContext, useContext } from "react";

export interface NoticeAction {
  label: string;
  onClick: () => void;
}

export interface NoticeApi {
  show: (message: string, action?: NoticeAction) => void;
}

export const NoticeContext = createContext<NoticeApi | null>(null);

export function useNotice(): NoticeApi {
  const ctx = useContext(NoticeContext);
  if (!ctx) throw new Error("useNotice must be used inside NoticeProvider");
  return ctx;
}
