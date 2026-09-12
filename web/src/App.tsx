import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Activity,
  MapPin,
  Users,
  CheckCircle2,
  Navigation,
  ExternalLink,
  Home,
  Compass,
  ArrowRight,
  User,
  LogOut,
  Radio,
  Clock,
  Sparkles,
  AlertTriangle,
  Lock,
  ChevronDown,
  ChevronUp,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
} from 'lucide-react';
import { useAuthStore, RoleName, DEMO_CREDENTIALS } from './store/authStore';
import { FieldCrewPortal } from './pages/crew/FieldCrewPortal';
import { CouncilOfficerControlCenter } from './pages/officer/CouncilOfficerControlCenter';
import { ReliefLogisticsDesk } from './pages/relief/ReliefLogisticsDesk';
import { PublicHazardSafeRouteMap } from './pages/public/PublicHazardSafeRouteMap';
import { LoginPage } from './pages/auth/LoginPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

const OperationsOverview: React.FC = () => {
  const { user, loginWithPassword, loginWithDemo, logout, isLoading } = useAuthStore();
  const navigate = useNavigate();

  // State for homepage inline sign-in
  const [expandedRole, setExpandedRole] = useState<RoleName | null>(null);
  const [emails, setEmails] = useState<Record<string, string>>({
    COUNCIL_OFFICER: DEMO_CREDENTIALS.COUNCIL_OFFICER.email,
    FIELD_CREW: DEMO_CREDENTIALS.FIELD_CREW.email,
    RELIEF_COORDINATOR: DEMO_CREDENTIALS.RELIEF_COORDINATOR.email,
  });
  const [passwords, setPasswords] = useState<Record<string, string>>({
    COUNCIL_OFFICER: DEMO_CREDENTIALS.COUNCIL_OFFICER.password,
    FIELD_CREW: DEMO_CREDENTIALS.FIELD_CREW.password,
    RELIEF_COORDINATOR: DEMO_CREDENTIALS.RELIEF_COORDINATOR.password,
  });
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [submittingRole, setSubmittingRole] = useState<RoleName | null>(null);
  const [roleError, setRoleError] = useState<{ role: RoleName; message: string } | null>(null);

  const handleInstantDemoLogin = async (role: RoleName, destination: string) => {
    setSubmittingRole(role);
    setRoleError(null);
    try {
      await loginWithDemo(role);
      navigate(destination);
    } catch (err: any) {
      setRoleError({ role, message: err.message || 'Failed to authenticate.' });
    } finally {
      setSubmittingRole(null);
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent, role: RoleName, destination: string) => {
    e.preventDefault();
    setSubmittingRole(role);
    setRoleError(null);

    const email = emails[role]?.trim();
    const password = passwords[role]?.trim();

    if (!email || !password) {
      setRoleError({ role, message: 'Please enter both email and password.' });
      setSubmittingRole(null);
      return;
    }

    try {
      await loginWithPassword(email, password);
      navigate(destination);
    } catch (err: any) {
      setRoleError({ role, message: err.message || 'Invalid credentials.' });
    } finally {
      setSubmittingRole(null);
    }
  };

  const toggleExpand = (role: RoleName) => {
    setRoleError(null);
    setExpandedRole(expandedRole === role ? null : role);
  };

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full p-6 space-y-8">
      {/* Top Headline & Quick Metrics Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              National Disaster Response
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-500">CMC & DMC Operational Grid</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Operations Command Center
          </h1>
          <p className="text-xs text-slate-600">
            Unified multi-agency coordination across municipal command, field rescue units, humanitarian relief desks, and public evacuation corridors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <button
              onClick={() => logout()}
              className="px-4 py-2 rounded-xl bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out ({user.name.split(' ')[0]})</span>
            </button>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-slate-800 font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5 text-slate-600" />
              <span>Sign In with Account</span>
            </Link>
          )}
          <Link
            to="/map"
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs shadow-rose-600/20 transition-all flex items-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Public Live Map</span>
          </Link>
        </div>
      </div>

      {/* KPI Grid - Clean White Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>CRITICAL FLOODS</span>
            <ShieldAlert className="w-4 h-4 text-red-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">4 Active</div>
          <div className="mt-1 text-xs text-red-600 font-medium">2 Road Closures Enforced</div>
        </div>

        <div className="glass-panel p-5 border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>AI TRIAGE QUEUE</span>
            <Activity className="w-4 h-4 text-orange-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">12 Verified</div>
          <div className="mt-1 text-xs text-slate-500 flex items-center justify-between">
            <span>Avg Confidence: 94.2%</span>
            <span className="text-[11px] text-emerald-600 font-semibold">Gemini 3.5</span>
          </div>
        </div>

        <div className="glass-panel p-5 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>FIELD CREWS DEPLOYED</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">3 Teams</div>
          <div className="mt-1 text-xs text-slate-500 flex items-center justify-between">
            <span className="text-blue-600 font-medium">Rapid Response Active</span>
            <span className="text-[11px] text-slate-400 font-mono">10 Squads/Dist</span>
          </div>
        </div>

        <div className="glass-panel p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>RELIEF SHELTERS</span>
            <MapPin className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">650 Beds</div>
          <div className="mt-1 text-xs text-slate-500 flex items-center justify-between">
            <span className="text-emerald-600 font-medium">518 Available</span>
            <span className="text-[11px] text-teal-600 font-semibold">Red Cross</span>
          </div>
        </div>
      </div>

      {/* Main Operations Section: DYNAMIC BASED ON AUTH STATUS */}
      <div className="space-y-4">
        {user ? (
          /* ============================================================ */
          /* STATE: LOGGED IN - SINGLE ROLE ISOLATION (NO OTHER ROLES!)   */
          /* ============================================================ */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Your Active Operational Station</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Welcome back, <strong className="text-slate-800">{user.name}</strong>. Only your authorized municipal station and the public map are displayed.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Role Isolated & Protected</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: User's Active Authorized Role Station */}
              {user.role === 'COUNCIL_OFFICER' && (
                <div className="glass-panel p-6 border-t-4 border-t-emerald-500 flex flex-col justify-between shadow-md">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        MUNICIPAL COMMAND & DISPATCH • AUTHORIZED
                      </span>
                      <ShieldAlert className="w-5 h-5 text-emerald-600" />
                    </div>

                    <h3 className="text-lg font-black text-slate-900">
                      Council Officer Control Center
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Multi-ward live hazard triage grid, deep Tri-Signal AI verification scorecards (Gemini 3.5 Flash-Lite vision, weather correlation, location authenticity), proximity-ranked squad dispatch, and authoritative road closure controls.
                    </p>

                    <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-medium text-slate-600">
                      <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200/80">
                        ⚡ 5-Signal AI Pipeline
                      </span>
                      <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200/80">
                        📍 Distance-Ranked Dispatch
                      </span>
                      <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200/80">
                        ⛔ Authoritative Road Closures
                      </span>
                    </div>
                  </div>

                  <div className="pt-6 mt-4 border-t border-slate-200/80 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{user.name}</div>
                      <div className="text-[11px] text-slate-500">{user.department || 'Colombo Municipal Council'}</div>
                    </div>
                    <Link
                      to="/officer"
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all"
                    >
                      <span>Launch Control Center</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              )}

              {user.role === 'FIELD_CREW' && (
                <div className="glass-panel p-6 border-t-4 border-t-blue-500 flex flex-col justify-between shadow-md">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        EMERGENCY FIELD OPERATIONS • AUTHORIZED
                      </span>
                      <Navigation className="w-5 h-5 text-blue-600" />
                    </div>

                    <h3 className="text-lg font-black text-slate-900">
                      Field Crew Mobile Terminal
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Equips rescue squads with live GPS beacon telematics, dynamic detour routing avoiding submerged roads, offline-first task queueing, and mandatory photo-verified evidence capture to reopen roads.
                    </p>

                    <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-medium text-slate-600">
                      <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200/80">
                        🛰️ GPS Telematics
                      </span>
                      <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200/80">
                        🧭 Tactical Detour Routing
                      </span>
                      <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200/80">
                        📸 Photo Evidence Proof
                      </span>
                    </div>
                  </div>

                  <div className="pt-6 mt-4 border-t border-slate-200/80 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{user.name}</div>
                      <div className="text-[11px] text-slate-500">{user.squadName || 'Water Rescue Unit #01'}</div>
                    </div>
                    <Link
                      to="/crew"
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all"
                    >
                      <span>Launch Field Terminal</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              )}

              {user.role === 'RELIEF_COORDINATOR' && (
                <div className="glass-panel p-6 border-t-4 border-t-teal-500 flex flex-col justify-between shadow-md">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                        HUMANITARIAN DISASTER RELIEF • AUTHORIZED
                      </span>
                      <Home className="w-5 h-5 text-teal-600" />
                    </div>

                    <h3 className="text-lg font-black text-slate-900">
                      Relief Logistics Desk
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      P1–P4 operational urgency triage queue, interactive shelter network map with live circular bed capacity gauges, one-click nearest shelter matcher with household headcount validation, and supplies allocation.
                    </p>

                    <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-medium text-slate-600">
                      <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200/80">
                        🛏️ Live Bed Telemetry
                      </span>
                      <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200/80">
                        👨‍👩‍👧‍👦 Family Headcount
                      </span>
                      <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200/80">
                        📦 Supplies Allocation
                      </span>
                    </div>
                  </div>

                  <div className="pt-6 mt-4 border-t border-slate-200/80 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{user.name}</div>
                      <div className="text-[11px] text-slate-500">{user.department || 'Sri Lanka Red Cross'}</div>
                    </div>
                    <Link
                      to="/relief"
                      className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all"
                    >
                      <span>Launch Relief Desk</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              )}

              {/* Card 2: Public Disaster Map (Always available to all roles) */}
              <div className="glass-panel p-6 border-t-4 border-t-rose-500 flex flex-col justify-between shadow-md">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                      CIVIC RESILIENCE & EVACUATION • UNIVERSAL ACCESS
                    </span>
                    <Compass className="w-5 h-5 text-rose-600" />
                  </div>

                  <h3 className="text-lg font-black text-slate-900">
                    Public Hazard & Safe Route Map
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Real-time severity-scaled flood perimeters (100m–350m), closed road overlays, one-click citizen hazard reporting with interactive GPS pin-drop and photo proof, and automated safe detour routing to nearest shelters.
                  </p>

                  <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-medium text-slate-600">
                    <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200/80">
                      🌊 100m–350m Flood Radii
                    </span>
                    <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200/80">
                      📍 Real-Time Incident Pins
                    </span>
                    <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200/80">
                      🛡️ Safe Evacuation Detours
                    </span>
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-200/80 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-semibold">Live Public Evacuation Grid</span>
                  <Link
                    to="/map"
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all"
                  >
                    <span>Launch Public Map</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Role Isolation Switcher Footer */}
            <div className="p-4 rounded-2xl bg-slate-100/90 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <span>
                  Signed in as <strong className="text-slate-900 font-semibold">{user.name}</strong>. Other administrative role portals are hidden to prevent cross-role interference.
                </span>
              </div>
              <button
                onClick={() => logout()}
                className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:border-rose-300 hover:text-rose-700 text-slate-700 font-bold transition-all shadow-xs flex items-center gap-1.5 flex-shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out to Switch Accounts</span>
              </button>
            </div>
          </div>
        ) : (
          /* ============================================================ */
          /* STATE: LOGGED OUT - HOMEPAGE ROLE-BASED SIGN-IN GATEWAY     */
          /* ============================================================ */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Direct Role Sign-In & Operations Gateway</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Select your role below to authenticate directly from this homepage, or explore the live public map without credentials.
                </p>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                1-Click Demo or Official Credentials
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Role 1: Council Officer Card */}
              <div className="glass-panel p-6 border-t-4 border-t-emerald-500 flex flex-col justify-between shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      MUNICIPAL COMMAND & DISPATCH
                    </span>
                    <ShieldAlert className="w-5 h-5 text-emerald-600" />
                  </div>

                  <h3 className="text-base font-black text-slate-900">
                    Council Officer Control Center
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Authoritative road closures, multi-ward live hazard triage grid, and deep Tri-Signal AI verification scorecards (Gemini 3.5 Flash-Lite).
                  </p>

                  <div className="pt-1 flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700">Demo Persona:</span>
                    <span>Kasun Perera (Colombo Lead)</span>
                  </div>

                  {roleError?.role === 'COUNCIL_OFFICER' && (
                    <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{roleError.message}</span>
                    </div>
                  )}

                  {/* Expandable Credentials Form */}
                  {expandedRole === 'COUNCIL_OFFICER' && (
                    <form
                      onSubmit={(e) => handleCredentialsSubmit(e, 'COUNCIL_OFFICER', '/officer')}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs animate-in fade-in"
                    >
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                          Official Email
                        </label>
                        <input
                          type="email"
                          required
                          value={emails.COUNCIL_OFFICER}
                          onChange={(e) => setEmails({ ...emails, COUNCIL_OFFICER: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                          Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword.COUNCIL_OFFICER ? 'text' : 'password'}
                            required
                            value={passwords.COUNCIL_OFFICER}
                            onChange={(e) => setPasswords({ ...passwords, COUNCIL_OFFICER: e.target.value })}
                            className="w-full px-3 py-1.5 pr-8 rounded-lg border border-slate-300 text-xs bg-white font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword({ ...showPassword, COUNCIL_OFFICER: !showPassword.COUNCIL_OFFICER })}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
                          >
                            {showPassword.COUNCIL_OFFICER ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={submittingRole === 'COUNCIL_OFFICER'}
                        className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span>Authenticate & Enter Officer Center</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  )}
                </div>

                <div className="pt-4 mt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => toggleExpand('COUNCIL_OFFICER')}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                  >
                    <span>{expandedRole === 'COUNCIL_OFFICER' ? 'Hide Form' : 'Use Email / Password'}</span>
                    {expandedRole === 'COUNCIL_OFFICER' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="button"
                    disabled={submittingRole === 'COUNCIL_OFFICER'}
                    onClick={() => handleInstantDemoLogin('COUNCIL_OFFICER', '/officer')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all"
                  >
                    <span>⚡ 1-Click Instant Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Role 2: Field Crew Lead Card */}
              <div className="glass-panel p-6 border-t-4 border-t-blue-500 flex flex-col justify-between shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      EMERGENCY FIELD OPERATIONS
                    </span>
                    <Navigation className="w-5 h-5 text-blue-600" />
                  </div>

                  <h3 className="text-base font-black text-slate-900">
                    Field Crew Mobile Terminal
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    GPS beacon telematics, tactical detour navigation around submerged corridors, and mandatory photo-verified evidence capture to reopen roads.
                  </p>

                  <div className="pt-1 flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700">Demo Persona:</span>
                    <span>Sunil Shantha (Swift Water Unit #01)</span>
                  </div>

                  {roleError?.role === 'FIELD_CREW' && (
                    <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{roleError.message}</span>
                    </div>
                  )}

                  {/* Expandable Credentials Form */}
                  {expandedRole === 'FIELD_CREW' && (
                    <form
                      onSubmit={(e) => handleCredentialsSubmit(e, 'FIELD_CREW', '/crew')}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs animate-in fade-in"
                    >
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                          Official Email
                        </label>
                        <input
                          type="email"
                          required
                          value={emails.FIELD_CREW}
                          onChange={(e) => setEmails({ ...emails, FIELD_CREW: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                          Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword.FIELD_CREW ? 'text' : 'password'}
                            required
                            value={passwords.FIELD_CREW}
                            onChange={(e) => setPasswords({ ...passwords, FIELD_CREW: e.target.value })}
                            className="w-full px-3 py-1.5 pr-8 rounded-lg border border-slate-300 text-xs bg-white font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword({ ...showPassword, FIELD_CREW: !showPassword.FIELD_CREW })}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
                          >
                            {showPassword.FIELD_CREW ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={submittingRole === 'FIELD_CREW'}
                        className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span>Authenticate & Enter Field Terminal</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  )}
                </div>

                <div className="pt-4 mt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => toggleExpand('FIELD_CREW')}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                  >
                    <span>{expandedRole === 'FIELD_CREW' ? 'Hide Form' : 'Use Email / Password'}</span>
                    {expandedRole === 'FIELD_CREW' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="button"
                    disabled={submittingRole === 'FIELD_CREW'}
                    onClick={() => handleInstantDemoLogin('FIELD_CREW', '/crew')}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all"
                  >
                    <span>⚡ 1-Click Instant Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Role 3: Relief Coordinator Card */}
              <div className="glass-panel p-6 border-t-4 border-t-teal-500 flex flex-col justify-between shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                      HUMANITARIAN DISASTER RELIEF
                    </span>
                    <Home className="w-5 h-5 text-teal-600" />
                  </div>

                  <h3 className="text-base font-black text-slate-900">
                    Relief Logistics Desk
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    P1–P4 operational urgency triage, live bed capacity gauges across emergency shelters, and zero-family-separation nearest shelter matching.
                  </p>

                  <div className="pt-1 flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700">Demo Persona:</span>
                    <span>Anoma Wickramasinghe (Red Cross Lead)</span>
                  </div>

                  {roleError?.role === 'RELIEF_COORDINATOR' && (
                    <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{roleError.message}</span>
                    </div>
                  )}

                  {/* Expandable Credentials Form */}
                  {expandedRole === 'RELIEF_COORDINATOR' && (
                    <form
                      onSubmit={(e) => handleCredentialsSubmit(e, 'RELIEF_COORDINATOR', '/relief')}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs animate-in fade-in"
                    >
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                          Official Email
                        </label>
                        <input
                          type="email"
                          required
                          value={emails.RELIEF_COORDINATOR}
                          onChange={(e) => setEmails({ ...emails, RELIEF_COORDINATOR: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                          Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword.RELIEF_COORDINATOR ? 'text' : 'password'}
                            required
                            value={passwords.RELIEF_COORDINATOR}
                            onChange={(e) => setPasswords({ ...passwords, RELIEF_COORDINATOR: e.target.value })}
                            className="w-full px-3 py-1.5 pr-8 rounded-lg border border-slate-300 text-xs bg-white font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword({ ...showPassword, RELIEF_COORDINATOR: !showPassword.RELIEF_COORDINATOR })}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
                          >
                            {showPassword.RELIEF_COORDINATOR ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={submittingRole === 'RELIEF_COORDINATOR'}
                        className="w-full py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span>Authenticate & Enter Relief Desk</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  )}
                </div>

                <div className="pt-4 mt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => toggleExpand('RELIEF_COORDINATOR')}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                  >
                    <span>{expandedRole === 'RELIEF_COORDINATOR' ? 'Hide Form' : 'Use Email / Password'}</span>
                    {expandedRole === 'RELIEF_COORDINATOR' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="button"
                    disabled={submittingRole === 'RELIEF_COORDINATOR'}
                    onClick={() => handleInstantDemoLogin('RELIEF_COORDINATOR', '/relief')}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all"
                  >
                    <span>⚡ 1-Click Instant Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Role 4: Public Citizen (Open Access) */}
              <div className="glass-panel p-6 border-t-4 border-t-rose-500 flex flex-col justify-between shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                      PUBLIC ACCESS • NO LOGIN NEEDED
                    </span>
                    <Compass className="w-5 h-5 text-rose-600" />
                  </div>

                  <h3 className="text-base font-black text-slate-900">
                    Public Hazard & Safe Route Map
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Open access to real-time flood perimeters, closed road networks, photo hazard reports, and automated safe detours to emergency shelters.
                  </p>

                  <div className="pt-1 flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700">Access:</span>
                    <span>100% Free & Open to All Sri Lankan Citizens</span>
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-200/80 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-semibold">Instant Public Launch</span>
                  <Link
                    to="/map"
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all"
                  >
                    <span>Open Public Map</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Verification & AI System Overview - 2-Column Clean Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Municipal Operations Summary */}
        <div className="lg:col-span-2 glass-panel p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-500" />
              <span>Municipal Operations Monitor (Colombo & Provincial Basins)</span>
            </h3>
            <span className="badge-critical">2 Wards Alerted</span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-300 rounded-xl p-6 text-center space-y-2.5 bg-slate-50/50">
            <div className="p-3 rounded-full bg-emerald-100 text-emerald-700">
              <Navigation className="w-6 h-6 animate-pulse" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              National Disaster Response Command System Active
            </h4>
            <p className="text-xs text-slate-600 max-w-md">
              Real-time telemetry and hazard aggregation across Colombo, Kandy, Galle, and Ratnapura. Detours automatically bypass impassable road segments.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <Link
                to="/map"
                className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                View Live Flood Grid &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Right 1 Col: 5-Signal AI Pipeline Status */}
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>5-Check AI Pipeline Status</span>
            </h3>
            <span className="badge-success">Operational</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-semibold text-slate-700">1. Image AI (Gemini 3.5 Flash-Lite)</span>
              <span className="badge-success">Operational</span>
            </div>
            <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-semibold text-slate-700">2. Weather Correlation Check</span>
              <span className="badge-success">Active</span>
            </div>
            <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-semibold text-slate-700">3. Spatio-temporal Cluster (200m)</span>
              <span className="badge-success">Active</span>
            </div>
            <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-semibold text-slate-700">4. Location & Scene Validator</span>
              <span className="badge-success">Online</span>
            </div>
            <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-semibold text-slate-700">5. Risk Urgency AI (P1–P4)</span>
              <span className="badge-success">Online</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

const NavigationHeader: React.FC = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  // Role display metadata
  const getRoleBadge = (role?: RoleName) => {
    switch (role) {
      case 'COUNCIL_OFFICER':
        return {
          label: 'Council Officer',
          icon: '🏛️',
          destination: '/officer',
          workspaceName: 'Officer Center',
        };
      case 'FIELD_CREW':
        return {
          label: 'Field Crew Lead',
          icon: '👷',
          destination: '/crew',
          workspaceName: 'Field Terminal',
        };
      case 'RELIEF_COORDINATOR':
        return {
          label: 'Relief Coordinator',
          icon: '🏠',
          destination: '/relief',
          workspaceName: 'Relief Desk',
        };
      case 'CITIZEN':
        return {
          label: 'Citizen',
          icon: '👤',
          destination: '/map',
          workspaceName: 'Public Map',
        };
      default:
        return {
          label: 'Officer',
          icon: '🏛️',
          destination: '/officer',
          workspaceName: 'Officer Center',
        };
    }
  };

  const roleMeta = getRoleBadge(user?.role);

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-50 px-6 py-3 flex items-center justify-between gap-4 shadow-xs">
      {/* Left: Branding ONLY (ALL Role tabs removed as requested) */}
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 shadow-xs">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-black tracking-tight text-slate-900">
                CivicGuard
              </h1>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                LIVE OPS
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">Disaster Response Intelligence</p>
          </div>
        </Link>
      </div>

      {/* Right: User Profile, Active Workspace Shortcut & Sign Out / Guest Sign In */}
      <div className="flex items-center gap-3 text-xs">
        {user ? (
          <>
            {/* Active Staff Persona Pill with Account Name */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 shadow-2xs">
              <span className="text-sm">{roleMeta.icon}</span>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {user.name}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {roleMeta.label}
                </div>
              </div>
            </div>

            {/* Direct Shortcut to Authenticated Role Workspace */}
            <Link
              to={roleMeta.destination}
              className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
              title={`Open ${roleMeta.workspaceName}`}
            >
              <span>{roleMeta.workspaceName}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {/* Sign Out Action */}
            <button
              onClick={() => logout()}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-rose-300 text-slate-700 hover:text-rose-700 font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
              title="Sign out of municipal session"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500" />
              <span>Sign Out</span>
            </button>
          </>
        ) : (
          <>
            {/* Citizen Guest Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
              <span className="text-sm">👤</span>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900 leading-tight">Public Citizen</div>
                <div className="text-[10px] text-emerald-700 font-semibold">Open Access</div>
              </div>
            </div>

            {/* Public Map Link */}
            <Link
              to="/map"
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Compass className="w-3.5 h-3.5 text-rose-500" />
              <span>Public Map</span>
            </Link>

            {/* Staff Sign In Link */}
            <Link
              to="/login"
              className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <User className="w-3.5 h-3.5" />
              <span>Staff Login</span>
            </Link>
          </>
        )}
      </div>
    </header>
  );
};

export const App: React.FC = () => {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        <NavigationHeader />
        <Routes>
          <Route path="/" element={<OperationsOverview />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/map" element={<PublicHazardSafeRouteMap />} />
          <Route path="/public" element={<PublicHazardSafeRouteMap />} />
          <Route
            path="/officer"
            element={
              <ProtectedRoute allowedRoles={['COUNCIL_OFFICER']}>
                <CouncilOfficerControlCenter />
              </ProtectedRoute>
            }
          />
          <Route
            path="/crew"
            element={
              <ProtectedRoute allowedRoles={['FIELD_CREW']}>
                <FieldCrewPortal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/relief"
            element={
              <ProtectedRoute allowedRoles={['RELIEF_COORDINATOR', 'COUNCIL_OFFICER']}>
                <ReliefLogisticsDesk />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<OperationsOverview />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
