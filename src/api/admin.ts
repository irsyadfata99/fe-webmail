import { api } from "./client";

export interface AdminAccount {
  email: string;
  quota: string | null;
  displayName: string;
  role: "ADMIN" | "USER";
  isActive: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt: string | null;
  registered: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  actorEmail: string | null;
  targetEmail: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: unknown;
  createdAt: string;
}

export interface PageInfo {
  total: number;
  page: number;
  pageSize: number;
  start: number;
  end: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface AuditQuery {
  page: number;
  actor?: string;
  target?: string;
  action?: string;
  from?: string;
  to?: string;
}

const acct = (email: string) =>
  `/api/admin/accounts/${encodeURIComponent(email)}`;

export const adminApi = {
  accounts: () =>
    api
      .get<{ accounts: AdminAccount[] }>("/api/admin/accounts")
      .then((r) => r.accounts),
  create: (body: {
    email: string;
    password: string;
    displayName?: string;
    quota?: string;
  }) =>
    api.post<{ account: AdminAccount; quotaApplied: boolean }>(
      "/api/admin/accounts",
      body,
    ),
  setActive: (email: string, isActive: boolean) =>
    api.patch<unknown>(acct(email), { isActive }),
  setQuota: (email: string, quota: string | null) =>
    api.put<unknown>(`${acct(email)}/quota`, { quota }),
  resetPassword: (email: string, password: string) =>
    api.put<unknown>(`${acct(email)}/password`, { password }),
  resetTwoFactor: (email: string) => api.delete<unknown>(`${acct(email)}/2fa`),
  remove: (email: string) => api.delete<unknown>(acct(email)),
  auditLogs: (q: AuditQuery) =>
    api.get<{ logs: AuditLog[]; page: PageInfo }>("/api/admin/audit-logs", {
      query: { ...q, pageSize: 25 },
    }),
};
