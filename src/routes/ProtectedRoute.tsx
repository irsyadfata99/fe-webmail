import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "@/features/auth/auth-context";

// Penjaga halaman: hanya lolos kalau sudah login (dan 2FA, bila ada, sudah terverifikasi).
export default function ProtectedRoute() {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }
  if (!session || session.twoFactorRequired) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
