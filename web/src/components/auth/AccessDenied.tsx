import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogIn, Compass, ArrowRight } from 'lucide-react';
import { useAuthStore, RoleName } from '../../store/authStore';

interface AccessDeniedProps {
  requiredRoles: RoleName[];
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ requiredRoles }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const getWorkspaceDestination = (role?: RoleName): string => {
    switch (role) {
      case 'COUNCIL_OFFICER':
        return '/officer';
      case 'FIELD_CREW':
        return '/crew';
      case 'RELIEF_COORDINATOR':
        return '/relief';
      default:
        return '/map';
    }
  };

  const formatRoleName = (role: string) => {
    return role
      .toLowerCase()
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  const handleSwitchAccount = async () => {
    await logout();
    navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
  };

  return (
    <div className="min-h-[calc(100vh-65px)] bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-xl p-6 sm:p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Authoritative Badge & Icon */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-xs">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            Authorization Required
          </span>
          <h1 className="text-xl font-black text-slate-900 tracking-tight sm:text-2xl">
            Restricted Operational Workspace
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            This terminal requires <strong className="text-slate-900 font-semibold">{requiredRoles.map(formatRoleName).join(' or ')}</strong> credentials.
          </p>
        </div>

        {/* Current Identity Details */}
        {user ? (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-1 text-xs">
            <div className="text-[10px] uppercase font-bold text-slate-400">Current Session</div>
            <div className="font-bold text-slate-900">{user.name}</div>
            <div className="text-slate-500 font-mono text-[11px] flex items-center justify-between">
              <span>{user.email}</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-semibold">
                {formatRoleName(user.role)}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            You are not currently signed into an authorized municipal account.
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2 pt-2">
          {user && (
            <button
              onClick={() => navigate(getWorkspaceDestination(user.role))}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <span>Go to Your Assigned Workspace ({formatRoleName(user.role)})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={handleSwitchAccount}
            className="w-full py-2.5 px-4 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-slate-800 text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2"
          >
            <LogIn className="w-3.5 h-3.5 text-slate-600" />
            <span>Sign In with Authorized Account</span>
          </button>

          <button
            onClick={() => navigate('/map')}
            className="w-full py-2 px-4 rounded-xl text-slate-500 hover:text-slate-700 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Return to Public Disaster Map</span>
          </button>
        </div>
      </div>
    </div>
  );
};
