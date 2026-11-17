import { lazy, Suspense, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { AuthProvider } from "@/features/auth/AuthProvider";
import LoginPage from "@/features/auth/LoginPage";
import MailPage from "@/features/mail/MailPage";
import SearchPage from "@/features/mail/SearchPage";
import AppShell from "@/components/layout/AppShell";
import ProtectedRoute from "@/routes/ProtectedRoute";

const AdminPage = lazy(() => import("@/features/admin/AdminPage"));
const SettingsPage = lazy(() => import("@/features/settings/SettingsPage"));
const InvitePage = lazy(() => import("@/features/calendar/InvitePage"));

function Lazy({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={<p className="p-6 text-sm text-muted-foreground">Loading...</p>}
    >
      {children}
    </Suspense>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/mail/:folder" element={<MailPage />} />
              <Route
                path="/admin"
                element={
                  <Lazy>
                    <AdminPage />
                  </Lazy>
                }
              />
              <Route
                path="/settings"
                element={
                  <Lazy>
                    <SettingsPage />
                  </Lazy>
                }
              />
              <Route
                path="/invite"
                element={
                  <Lazy>
                    <InvitePage />
                  </Lazy>
                }
              />
              <Route path="/search" element={<SearchPage />} />
              <Route path="*" element={<Navigate to="/mail/INBOX" replace />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
