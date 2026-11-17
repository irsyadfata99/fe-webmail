import { api } from "@/api/client";

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: "ADMIN" | "USER";
  twoFactorEnabled?: boolean;
}

export interface SessionInfo {
  user: User;
  twoFactorRequired: boolean;
}

/** Second factor: an authenticator code or one recovery code. */
export type SecondFactor = { code: string } | { recoveryCode: string };

export const authApi = {
  me: () => api.get<SessionInfo>("/api/auth/me"),
  login: (email: string, password: string) =>
    api.post<SessionInfo>("/api/auth/login", { email, password }),
  verifyTwoFactor: (factor: SecondFactor) =>
    api.post<{ verified: boolean; method: string; recoveryCodesLeft: number }>(
      "/api/auth/2fa/verify",
      factor,
    ),
  logout: () => api.post<void>("/api/auth/logout"),
};
