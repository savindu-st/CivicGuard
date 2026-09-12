import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ShieldAlert,
  Navigation,
  Lock,
  ArrowRight,
  CheckCircle2,
  Building2,
  Eye,
  EyeOff,
  AlertCircle,
  Compass,
  Sparkles,
  KeyRound,
  Home,
  Check,
  LogOut,
  User,
  Users,
} from 'lucide-react';
import { useAuthStore, RoleName, DEMO_CREDENTIALS } from '../../store/authStore';

type RoleTab = 'COUNCIL_OFFICER' | 'FIELD_CREW' | 'RELIEF_COORDINATOR' | 'CITIZEN';

interface DemoChip {
  label: string;
  sublabel: string;
  email: string;
  password: string;
  role: RoleName;
}

const DEMO_CHIPS: Record<'COUNCIL_OFFICER' | 'FIELD_CREW' | 'RELIEF_COORDINATOR', DemoChip[]> = {
  COUNCIL_OFFICER: [
    {
      label: 'Kasun Perera (Colombo)',
      sublabel: 'Colombo District Command (10 Squads)',
      email: 'kasun.officer@cmc.gov.lk',
      password: 'Officer@123',
      role: 'COUNCIL_OFFICER',
    },
    {
      label: 'Officer Kandy',
      sublabel: 'Central Province Command (10 Squads)',
      email: 'officer.kandy@civicguard.gov.lk',
      password: 'Officer@123',
      role: 'COUNCIL_OFFICER',
    },
    {
      label: 'Officer Galle',
      sublabel: 'Southern Coastal Command (10 Squads)',
      email: 'officer.galle@civicguard.gov.lk',
      password: 'Officer@123',
      role: 'COUNCIL_OFFICER',
    },
    {
      label: 'Officer Ratnapura',
      sublabel: 'Sabaragamuwa Command (10 Squads)',
      email: 'officer.ratnapura@civicguard.gov.lk',
      password: 'Officer@123',
      role: 'COUNCIL_OFFICER',
    },
  ],
  FIELD_CREW: [
    {
      label: 'Sunil Shantha',
      sublabel: 'Water Rescue Lead (Colombo)',
      email: 'sunil.water@cmc.gov.lk',
      password: 'Crew@123',
      role: 'FIELD_CREW',
    },
    {
      label: 'Bandara Senanayake',
      sublabel: '4x4 Debris Lead (Ratnapura)',
      email: 'bandara.4x4@civicguard.lk',
      password: 'Crew@123',
      role: 'FIELD_CREW',
    },
    {
      label: 'Dr. Nimal Gamage',
      sublabel: 'Medical Lead (Kandy)',
      email: 'nimal.medical@civicguard.lk',
      password: 'Crew@123',
      role: 'FIELD_CREW',
    },
  ],
  RELIEF_COORDINATOR: [
    {
      label: 'Anoma Wickramasinghe',
      sublabel: 'Sri Lanka Red Cross — Logistics Lead',
      email: 'anoma.relief@redcross.lk',
      password: 'Relief@123',
      role: 'RELIEF_COORDINATOR',
    },
  ],
};

export const LoginPage: React.FC = () => {
  const { loginWithPassword, loginWithDemo, logout, isLoading, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine initial tab based on query param or referrer
  const queryParams = new URLSearchParams(location.search);
  const redirectTarget = queryParams.get('redirect') || '';

  const initialStaffTab = redirectTarget.includes('crew')
    ? 'FIELD_CREW'
    : redirectTarget.includes('relief')
    ? 'RELIEF_COORDINATOR'
    : 'COUNCIL_OFFICER';

  const [activeTab, setActiveTab] = useState<RoleTab>(initialStaffTab);
  const [email, setEmail] = useState<string>(DEMO_CREDENTIALS[initialStaffTab]?.email || '');
  const [password, setPassword] = useState<string>(DEMO_CREDENTIALS[initialStaffTab]?.password || '');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [activeChip, setActiveChip] = useState<string>(DEMO_CHIPS[initialStaffTab][0]?.email || '');

  // When switching tabs, update default pre-filled credentials
  const handleTabChange = (tab: RoleTab) => {
    setActiveTab(tab);
    setFormError(null);
    if (tab !== 'CITIZEN') {
      const defaultChip = DEMO_CHIPS[tab][0];
      if (defaultChip) {
        setEmail(defaultChip.email);
        setPassword(defaultChip.password);
        setActiveChip(defaultChip.email);
      }
    }
  };

  const handleSelectChip = (chip: DemoChip) => {
    setEmail(chip.email);
    setPassword(chip.password);
    setActiveChip(chip.email);
    setFormError(null);
  };

  const getWorkspaceDestination = (role: RoleName): string => {
    if (redirectTarget) return redirectTarget;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email || !password) {
      setFormError('Please enter both email and password.');
      return;
    }

    try {
      const loggedUser = await loginWithPassword(email, password);
      navigate(getWorkspaceDestination(loggedUser.role));
    } catch (err: any) {
      setFormError(err.message || 'Invalid email or password. Please try again.');
    }
  };

  const handleOneClickLogin = async (role: RoleName) => {
    setFormError(null);
    try {
      const loggedUser = await loginWithDemo(role);
      navigate(getWorkspaceDestination(loggedUser.role));
    } catch (err: any) {
      setFormError(err.message || 'Failed to authenticate demo account.');
    }
  };

  const getRoleBadgeTitle = (role?: RoleName) => {
    switch (role) {
      case 'COUNCIL_OFFICER':
        return 'Council Officer';
      case 'FIELD_CREW':
        return 'Field Crew Lead';
      case 'RELIEF_COORDINATOR':
        return 'Relief Coordinator';
      case 'CITIZEN':
        return 'Citizen';
      default:
        return 'Municipal User';
    }
  };

  // State: Already authenticated user visiting /login
  if (user) {
    return (
      <div className="min-h-[calc(100vh-65px)] bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-lg w-full bg-white border border-slate-200 rounded-3xl shadow-xl p-8 space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Active Municipal Session
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              You Are Already Signed In
            </h1>
            <p className="text-xs text-slate-600">
              You are currently authenticated as an active municipal operative.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-900">{user.name}</div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                {getRoleBadgeTitle(user.role)}
              </span>
            </div>
            <div className="text-xs text-slate-500 font-mono">{user.email}</div>
            {user.department && (
              <div className="text-[11px] text-slate-600 font-medium">{user.department}</div>
            )}
            {user.squadName && (
              <div className="text-[11px] text-blue-600 font-medium">{user.squadName}</div>
            )}
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => navigate(getWorkspaceDestination(user.role))}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <span>Continue to Your Assigned Workspace ({getRoleBadgeTitle(user.role)})</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={async () => {
                await logout();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out to Switch Accounts</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-65px)] bg-slate-50 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Top Public Citizen Notice Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white shadow-xs border border-emerald-200 text-emerald-700 flex-shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <span>Are you a citizen or commuter?</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                  NO ACCOUNT NEEDED
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Live flood hazard maps, safe evacuation routing, emergency shelter telemetry, and photo reporting are open to all.
              </p>
            </div>
          </div>
          <Link
            to="/map"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 flex-shrink-0 self-end sm:self-auto"
          >
            <span>Open Public Live Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Main Card Container */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden">
          {/* Header Title Section */}
          <div className="p-6 sm:p-8 border-b border-slate-200 bg-white space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>CivicGuard Municipal Access Gateway</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight sm:text-3xl">
              Sign In to Your Operational Station
            </h1>
            <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
              Select your municipal role below to authenticate with official credentials or use one-click demo personnel for instant evaluation.
            </p>
          </div>

          {/* Role Tabs */}
          <div className="grid grid-cols-2 md:grid-cols-4 border-b border-slate-200 bg-slate-50/70 p-2 gap-2">
            {/* Officer Tab */}
            <button
              type="button"
              onClick={() => handleTabChange('COUNCIL_OFFICER')}
              className={`p-3 rounded-2xl text-left transition-all border ${
                activeTab === 'COUNCIL_OFFICER'
                  ? 'bg-white border-emerald-400 shadow-sm ring-2 ring-emerald-500/20'
                  : 'border-transparent text-slate-600 hover:bg-white/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded-lg ${
                    activeTab === 'COUNCIL_OFFICER'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Council Officer</div>
                  <div className="text-[10px] text-slate-500 truncate hidden sm:block">Command & Closures</div>
                </div>
              </div>
            </button>

            {/* Crew Tab */}
            <button
              type="button"
              onClick={() => handleTabChange('FIELD_CREW')}
              className={`p-3 rounded-2xl text-left transition-all border ${
                activeTab === 'FIELD_CREW'
                  ? 'bg-white border-blue-400 shadow-sm ring-2 ring-blue-500/20'
                  : 'border-transparent text-slate-600 hover:bg-white/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded-lg ${
                    activeTab === 'FIELD_CREW'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Navigation className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Field Crew Lead</div>
                  <div className="text-[10px] text-slate-500 truncate hidden sm:block">Rescue & Detours</div>
                </div>
              </div>
            </button>

            {/* Relief Tab */}
            <button
              type="button"
              onClick={() => handleTabChange('RELIEF_COORDINATOR')}
              className={`p-3 rounded-2xl text-left transition-all border ${
                activeTab === 'RELIEF_COORDINATOR'
                  ? 'bg-white border-teal-400 shadow-sm ring-2 ring-teal-500/20'
                  : 'border-transparent text-slate-600 hover:bg-white/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded-lg ${
                    activeTab === 'RELIEF_COORDINATOR'
                      ? 'bg-teal-50 text-teal-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Home className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Relief Desk</div>
                  <div className="text-[10px] text-slate-500 truncate hidden sm:block">Shelters & Beds</div>
                </div>
              </div>
            </button>

            {/* Citizen Tab */}
            <button
              type="button"
              onClick={() => handleTabChange('CITIZEN')}
              className={`p-3 rounded-2xl text-left transition-all border ${
                activeTab === 'CITIZEN'
                  ? 'bg-white border-rose-400 shadow-sm ring-2 ring-rose-500/20'
                  : 'border-transparent text-slate-600 hover:bg-white/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded-lg ${
                    activeTab === 'CITIZEN'
                      ? 'bg-rose-50 text-rose-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Public Citizen</div>
                  <div className="text-[10px] text-slate-500 truncate hidden sm:block">Open Access</div>
                </div>
              </div>
            </button>
          </div>

          {/* Form Content Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {activeTab === 'CITIZEN' ? (
              /* Citizen Open Access View */
              <div className="text-center py-6 space-y-4 max-w-md mx-auto">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
                  <Compass className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900">
                    Public Disaster Access Is Free & Open
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    No sign-in or password is required for citizens. View authoritative flood zones, navigate safe detours, check emergency shelter bed availability, and report hazards.
                  </p>
                </div>
                <Link
                  to="/map"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all"
                >
                  <span>Launch Public Live Map</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <>
                {/* Quick Demo Pre-Fill Chips */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Pre-Configured Staff Personas (1-Click Fill or Login)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOneClickLogin(activeTab)}
                      className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
                    >
                      <span>1-Click Instant Sign In &rarr;</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {DEMO_CHIPS[activeTab].map((chip) => {
                      const isSelected = activeChip === chip.email;
                      return (
                        <div
                          key={chip.email}
                          onClick={() => handleSelectChip(chip)}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                            isSelected
                              ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-500/20 shadow-2xs'
                              : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                              <span>{chip.label}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 inline" />}
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                              {chip.sublabel}
                            </div>
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                            <span className="text-slate-400 font-mono truncate mr-2">{chip.email}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOneClickLogin(chip.role);
                              }}
                              className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-white font-bold text-[9px] shadow-2xs transition-colors flex items-center gap-0.5 flex-shrink-0"
                              title="Instant test login"
                            >
                              <span>Sign In</span>
                              <ArrowRight className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Error Banner */}
                {formError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <div className="flex-1">{formError}</div>
                  </div>
                )}

                {/* Credentials Input Form */}
                <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Email Address */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        Official Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. officer@cmc.gov.lk"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs text-slate-900 bg-white shadow-2xs font-mono"
                      />
                      <span className="text-[10px] text-slate-400">
                        Government or emergency domain (@cmc.gov.lk, @civicguard.lk)
                      </span>
                    </div>

                    {/* Password Input */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        Account Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs text-slate-900 bg-white shadow-2xs font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Test password: <code className="text-slate-700 font-bold">Officer@123</code> or <code className="text-slate-700 font-bold">Crew@123</code>
                      </span>
                    </div>
                  </div>

                  {/* Submit Actions */}
                  <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                      <span>Encrypted via Supabase GoTrue Auth • Secure 24h Session</span>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <span>Authenticating...</span>
                      ) : (
                        <>
                          <span>
                            Sign In as {getRoleBadgeTitle(activeTab)}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>

          {/* Footer note */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span>CivicGuard Emergency Command Infrastructure • Colombo & Provincial Councils</span>
            </div>
            <div className="text-slate-400">
              Kong API Gateway :8000
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
