import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  ShieldAlert,
  Activity,
  MapPin,
  Users,
  CheckCircle2,
  Navigation,
  UserCheck,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { useAuthStore, RoleName } from './store/authStore';
import { FieldCrewPortal } from './pages/crew/FieldCrewPortal';

const OperationsOverview: React.FC = () => {
  return (
    <main className="flex-1 max-w-7xl mx-auto w-full p-6 space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>CRITICAL FLOODS</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">4 Active</div>
          <div className="mt-1 text-xs text-red-400">2 Road Closures Enforced</div>
        </div>

        <div className="glass-panel p-5 border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>AI TRIAGE QUEUE</span>
            <Activity className="w-4 h-4 text-orange-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">12 Verified</div>
          <div className="mt-1 text-xs text-slate-400">Avg Confidence: 94.2%</div>
        </div>

        <div className="glass-panel p-5 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>FIELD CREWS DEPLOYED</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">3 Teams</div>
          <div className="mt-1 text-xs text-blue-400 flex items-center justify-between">
            <span>Rapid Response Unit Active</span>
            <Link to="/crew" className="underline hover:text-white flex items-center gap-0.5">
              Open Portal &rarr;
            </Link>
          </div>
        </div>

        <div className="glass-panel p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>RELIEF SHELTERS</span>
            <MapPin className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">650 Beds</div>
          <div className="mt-1 text-xs text-emerald-400">518 Available</div>
        </div>
      </div>

      {/* Field Crew Portal Banner */}
      <div className="glass-panel p-6 bg-gradient-to-r from-blue-900/40 via-dark-850 to-emerald-950/30 border border-blue-500/30 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="badge-critical">EMERGENCY FIELD OPERATIONS</span>
            <span className="text-xs text-slate-400">• Tri-Forces & Municipal Response</span>
          </div>
          <h2 className="text-lg font-extrabold text-white">
            Field Crew Mobile Terminal & Tactical Detour Navigation
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Equips rescue squads with live GPS beacon telematics, dynamic detour routing around active flood zones, offline-first task queueing, and mandatory photo-verified evidence capture to reopen roads on the public disaster map.
          </p>
        </div>

        <Link
          to="/crew"
          className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-blue-600/30 flex items-center gap-2 flex-shrink-0 transition-all border border-blue-400"
        >
          <Navigation className="w-4 h-4" />
          <span>Launch Field Crew Portal</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Verification & AI System Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6 min-h-[340px] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-400" /> Municipal Operations Map (Colombo & Kandy)
            </h3>
            <span className="badge-critical">2 Wards Alerted</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-700/80 rounded-xl my-4 bg-dark-950/60 p-6 text-center space-y-2">
            <Navigation className="w-8 h-8 text-emerald-400 animate-pulse" />
            <h4 className="text-sm font-bold text-white">Field Crew Rapid Response #04 On Site</h4>
            <p className="text-xs text-slate-400 max-w-md">
              Field telematics stream active: Havelock Road & Kelani Bridge corridors. Dispatched teams receive automated turn-by-turn detours avoiding submerged roads.
            </p>
            <Link
              to="/crew"
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold hover:underline"
            >
              Simulate Field Crew GPS Beacon &rarr;
            </Link>
          </div>
        </div>

        <div className="glass-panel p-6 space-y-4">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 5-Check AI Pipeline Status
          </h3>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center p-2.5 rounded-lg bg-dark-800/60 border border-slate-700/50">
              <span className="text-slate-300">1. Image AI (YOLO)</span>
              <span className="badge-success">Operational</span>
            </div>
            <div className="flex justify-between items-center p-2.5 rounded-lg bg-dark-800/60 border border-slate-700/50">
              <span className="text-slate-300">2. Weather Correlation Check</span>
              <span className="badge-success">System Active</span>
            </div>
            <div className="flex justify-between items-center p-2.5 rounded-lg bg-dark-800/60 border border-slate-700/50">
              <span className="text-slate-300">3. Spatio-temporal Cluster (200m)</span>
              <span className="badge-success">System Active</span>
            </div>
            <div className="flex justify-between items-center p-2.5 rounded-lg bg-dark-800/60 border border-slate-700/50">
              <span className="text-slate-300">4. Location & Scene Validator</span>
              <span className="badge-success">AI Online</span>
            </div>
            <div className="flex justify-between items-center p-2.5 rounded-lg bg-dark-800/60 border border-slate-700/50">
              <span className="text-slate-300">5. Risk Urgency AI (P1-P4)</span>
              <span className="badge-success">AI Online</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

const NavigationHeader: React.FC = () => {
  const { user, switchPersona, isLoading } = useAuthStore();
  const location = useLocation();

  return (
    <header className="border-b border-slate-800 bg-dark-900/80 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              CivicGuard <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30">LIVE OPS</span>
            </h1>
            <p className="text-[10px] text-slate-400">Disaster Response Intelligence & Field Dispatch</p>
          </div>
        </Link>

        <nav className="hidden sm:flex items-center gap-2 ml-6 text-xs font-semibold">
          <Link
            to="/"
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              location.pathname === '/'
                ? 'bg-dark-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Overview Desk
          </Link>
          <Link
            to="/crew"
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              location.pathname === '/crew'
                ? 'bg-blue-600 text-white border border-blue-400 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Field Crew Portal</span>
          </Link>
        </nav>
      </div>

      {/* Persona Switcher Dropdown / Pills */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-slate-400 hidden lg:inline text-[11px] mr-1">Active Role:</span>
        {(['FIELD_CREW', 'COUNCIL_OFFICER', 'CITIZEN'] as RoleName[]).map((role) => (
          <button
            key={role}
            onClick={() => switchPersona(role)}
            disabled={isLoading}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
              user?.role === role
                ? role === 'FIELD_CREW'
                  ? 'bg-blue-600 text-white shadow-md border border-blue-400'
                  : role === 'COUNCIL_OFFICER'
                  ? 'bg-emerald-600 text-white shadow-md border border-emerald-400'
                  : 'bg-purple-600 text-white shadow-md border border-purple-400'
                : 'bg-dark-800 text-slate-400 border border-slate-700/80 hover:text-slate-200'
            }`}
          >
            {role === 'FIELD_CREW' ? '👷 Field Crew' : role === 'COUNCIL_OFFICER' ? '🏛️ Officer' : '👤 Citizen'}
          </button>
        ))}

        <div className="hidden md:flex items-center gap-1.5 pl-3 border-l border-slate-800 text-[11px] text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span>Gateway:8000</span>
        </div>
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
      <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col">
        <NavigationHeader />
        <Routes>
          <Route path="/" element={<OperationsOverview />} />
          <Route path="/crew" element={<FieldCrewPortal />} />
          <Route path="*" element={<OperationsOverview />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
