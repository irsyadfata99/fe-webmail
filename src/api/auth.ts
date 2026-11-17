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

export const authApi = {
  me: () => api.get<SessionInfo>("/api/auth/me"),
  login: (email: string, password: string) =>
    api.post<SessionInfo>("/api/auth/login", { email, password }),
  logout: () => api.post<void>("/api/auth/logout"),
};
