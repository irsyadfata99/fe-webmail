import { useEffect, useMemo, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi, type SessionInfo } from "@/api/auth";
import { ApiError, AUTH_EXPIRED_EVENT } from "@/api/client";
import { AuthContext, type AuthState } from "./auth-context";

const SESSION_KEY = ["session"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();

  const { data, isPending } = useQuery<SessionInfo | null>({
    queryKey: SESSION_KEY,
    queryFn: async () => {
      try {
        return await authApi.me();
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) return null;
        throw err;
      }
    },
    retry: false,
    staleTime: 60_000,
  });

  // Sesi berakhir di tengah jalan (401 dari endpoint mana pun) → anggap keluar.
  useEffect(() => {
    const onExpired = () => qc.setQueryData(SESSION_KEY, null);
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, [qc]);

  const value = useMemo<AuthState>(
    () => ({
      session: data ?? null,
      loading: isPending,
      login: async (email, password) => {
        const s = await authApi.login(email, password);
        qc.setQueryData(SESSION_KEY, s);
        return s;
      },
      verifyTwoFactor: async (factor) => {
        await authApi.verifyTwoFactor(factor);
        const s = await authApi.me();
        qc.setQueryData(SESSION_KEY, s);
        return s;
      },
      logout: async () => {
        try {
          await authApi.logout();
        } finally {
          qc.clear();
          qc.setQueryData(SESSION_KEY, null);
        }
      },
    }),
    [data, isPending, qc],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
