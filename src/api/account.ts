import { api } from "@/api/client";
import type { SecondFactor } from "@/api/auth";

export interface Profile {
  email: string;
  displayName: string;
  signature: string | null;
  role: "ADMIN" | "USER";
  twoFactorEnabled: boolean;
}

export interface TwoFactorStatus {
  enabled: boolean;
  pendingSetup: boolean;
  recoveryCodesLeft: number;
}

export const accountApi = {
  profile: () => api.get<Profile>("/api/account/profile"),
  updateProfile: (body: { displayName?: string; signature?: string | null }) =>
    api.patch<unknown>("/api/account/profile", body),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put<unknown>("/api/account/password", { currentPassword, newPassword }),

  twoFactorStatus: () => api.get<TwoFactorStatus>("/api/auth/2fa"),
  twoFactorSetup: () =>
    api.post<{ secret: string; otpauthUri: string }>("/api/auth/2fa/setup"),
  twoFactorEnable: (code: string) =>
    api.post<{ recoveryCodes: string[] }>("/api/auth/2fa/enable", { code }),
  twoFactorDisable: (factor: SecondFactor) =>
    api.post<{ disabled: boolean }>("/api/auth/2fa/disable", factor),
  newRecoveryCodes: (factor: SecondFactor) =>
    api.post<{ recoveryCodes: string[] }>(
      "/api/auth/2fa/recovery-codes",
      factor,
    ),
};
