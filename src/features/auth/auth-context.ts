import { createContext, useContext } from "react";
import type { SecondFactor, SessionInfo } from "@/api/auth";

export interface AuthState {
  session: SessionInfo | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<SessionInfo>;
  verifyTwoFactor: (factor: SecondFactor) => Promise<SessionInfo>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam AuthProvider");
  return ctx;
}
