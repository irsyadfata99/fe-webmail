import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { AuthProvider } from "@/features/auth/AuthProvider";
import LoginPage from "@/features/auth/LoginPage";
import MailPage from "@/features/mail/MailPage";
import AppShell from "@/components/layout/AppShell";
import ProtectedRoute from "@/routes/ProtectedRoute";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/mail/:folder" element={<MailPage />} />
              <Route path="*" element={<Navigate to="/mail/INBOX" replace />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
