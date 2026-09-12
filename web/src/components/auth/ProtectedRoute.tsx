import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore, RoleName } from '../../store/authStore';
import { AccessDenied } from './AccessDenied';

interface ProtectedRouteProps {
  allowedRoles: RoleName[];
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { user, token, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-65px)] bg-slate-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <span className="text-xs font-semibold">Verifying municipal credentials...</span>
        </div>
      </div>
    );
  }

  // Not logged in -> Redirect to login with intended destination
  if (!user || !token) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Logged in but unauthorized role -> Show Access Denied view
  if (!allowedRoles.includes(user.role)) {
    return <AccessDenied requiredRoles={allowedRoles} />;
  }

  // Authorized -> Render protected workspace
  return <>{children}</>;
};
