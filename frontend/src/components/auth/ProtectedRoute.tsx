import { Navigate, useLocation } from "react-router-dom";
import type { PropsWithChildren } from "react";

import { useAuth } from "../../context/AuthContext";
import type { Role } from "../../lib/types";

export function ProtectedRoute({
  children,
  roles
}: PropsWithChildren<{ roles?: Role[] }>) {
  const { session, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="grid min-h-screen place-items-center bg-slate-100">Loading...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (session.user.mustChangePassword && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  if (!session.user.mustChangePassword && location.pathname === "/change-password") {
    return <Navigate to="/dashboard" replace />;
  }

  if (roles && !roles.includes(session.user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
