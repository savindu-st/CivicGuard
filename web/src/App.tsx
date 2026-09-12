import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
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
} from 'lucide-react';
import { useAuthStore, RoleName } from './store/authStore';
import { FieldCrewPortal } from './pages/crew/FieldCrewPortal';
import { CouncilOfficerControlCenter } from './pages/officer/CouncilOfficerControlCenter';
import { ReliefLogisticsDesk } from './pages/relief/ReliefLogisticsDesk';
import { PublicHazardSafeRouteMap } from './pages/public/PublicHazardSafeRouteMap';
import { LoginPage } from './pages/auth/LoginPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

const OperationsOverview: React.FC = () => {
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
          <Link
            to="/login"
            className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-slate-800 font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
          >
            <User className="w-3.5 h-3.5 text-slate-600" />
            <span>Switch Role / Login</span>
          </Link>
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
            <Link to="/officer" className="font-semibold text-orange-600 hover:underline">
              Queue &rarr;
            </Link>
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
            <Link to="/crew" className="font-semibold text-blue-600 hover:underline">
              Portal &rarr;
            </Link>
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
            <Link to="/relief" className="font-semibold text-emerald-600 hover:underline">
              Logistics &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Main 4-Card Command Portals Hub (Clean 2x2 Grid) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Dedicated Operations Portals</span>
          </h2>
          <span className="text-xs text-slate-500">All 4 subsystems operational</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Council Officer Control Center */}
          <div className="glass-panel glass-panel-hover p-6 border-t-4 border-t-emerald-500 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  MUNICIPAL COMMAND & DISPATCH
                </span>
                <ShieldAlert className="w-5 h-5 text-emerald-600" />
              </div>

              <h3 className="text-base font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                Council Officer Control Center
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Multi-ward live hazard triage grid, deep 5-signal AI verification scorecards (YOLOv8 vision, weather sensor correlation, 200m spatial clusters), proximity-ranked crew dispatch, and authoritative road closure controls.
              </p>

              <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-medium text-slate-600">
                <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200/80">
                  ⚡ 5-Signal AI Pipeline
                </span>
                <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200/80">
                  📍 Distance-Ranked Dispatch
                </span>
                <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200/80">
                  ⛔ Road Closure Network
                </span>
              </div>
            </div>

            <div className="pt-5 mt-4 border-t border-slate-200/80 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-semibold">Kasun Perera • CMC Lead</span>
              <Link
                to="/officer"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all"
              >
                <span>Launch Center</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 2: Field Crew Mobile Terminal */}
          <div className="glass-panel glass-panel-hover p-6 border-t-4 border-t-blue-500 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  EMERGENCY FIELD OPERATIONS
                </span>
                <Navigation className="w-5 h-5 text-blue-600" />
              </div>

              <h3 className="text-base font-black text-slate-900 group-hover:text-blue-700 transition-colors">
                Field Crew Mobile Terminal
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Equips rescue squads with live GPS beacon telematics, dynamic detour routing avoiding submerged roads, offline-first task queueing, and mandatory photo-verified evidence capture to reopen roads.
              </p>

              <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-medium text-slate-600">
                <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200/80">
                  🛰️ GPS Beacon Telematics
                </span>
                <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200/80">
                  🧭 Tactical Detour Routing
                </span>
                <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200/80">
                  📸 Photo Evidence Proof
                </span>
              </div>
            </div>

            <div className="pt-5 mt-4 border-t border-slate-200/80 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-semibold">Sunil Shantha • Rapid Unit #04</span>
              <Link
                to="/crew"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all"
              >
                <span>Launch Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 3: Relief Logistics Desk */}
          <div className="glass-panel glass-panel-hover p-6 border-t-4 border-t-teal-500 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                  HUMANITARIAN DISASTER RELIEF
                </span>
                <Home className="w-5 h-5 text-teal-600" />
              </div>

              <h3 className="text-base font-black text-slate-900 group-hover:text-teal-700 transition-colors">
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
                  👨‍👩‍👧‍👦 Zero Family Separation
                </span>
                <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200/80">
                  📦 Multi-Resource Parcels
                </span>
              </div>
            </div>

            <div className="pt-5 mt-4 border-t border-slate-200/80 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-semibold">Anoma Wickramasinghe • Red Cross</span>
              <Link
                to="/relief"
                className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all"
              >
                <span>Launch Desk</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 4: Public Hazard & Safe Route Map */}
          <div className="glass-panel glass-panel-hover p-6 border-t-4 border-t-rose-500 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  CIVIC RESILIENCE & EVACUATION
                </span>
                <Compass className="w-5 h-5 text-rose-600" />
              </div>

              <h3 className="text-base font-black text-slate-900 group-hover:text-rose-700 transition-colors">
                Public Hazard & Safe Route Map
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Real-time severity-scaled flood perimeters (100m–350m), closed road overlays, one-click citizen hazard reporting with interactive GPS pin-drop and photo proof, and automated safe detour routing to nearest shelters.
              </p>

              <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-medium text-slate-600">
                <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200/80">
                  🌊 100m–350m Flood Perimeters
                </span>
                <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200/80">
                  📍 Interactive GPS Pin-Drop
                </span>
                <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200/80">
                  🛡️ Safe Evacuation Detours
                </span>
              </div>
            </div>

            <div className="pt-5 mt-4 border-t border-slate-200/80 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-semibold">General Public & Community Safety</span>
              <Link
                to="/map"
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all"
              >
                <span>Launch Public Map</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Verification & AI System Overview - 2-Column Clean Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Municipal Operations Summary */}
        <div className="lg:col-span-2 glass-panel p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-500" />
              <span>Municipal Operations Monitor (Colombo & Kandy Basins)</span>
            </h3>
            <span className="badge-critical">2 Wards Alerted</span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-300 rounded-xl p-6 text-center space-y-2.5 bg-slate-50/50">
            <div className="p-3 rounded-full bg-emerald-100 text-emerald-700">
              <Navigation className="w-6 h-6 animate-pulse" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              Field Crew Rapid Response Unit #04 On Site
            </h4>
            <p className="text-xs text-slate-600 max-w-md">
              Active telemetry streaming across Havelock Road and Kelani Bridge flood corridors. Detours automatically bypass impassable road segments.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <Link
                to="/crew"
                className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Open Field Crew Telematics &rarr;
              </Link>
              <Link
                to="/officer"
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Dispatch Queue &rarr;
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
              <span className="font-semibold text-slate-700">1. Image AI (YOLOv8 Vision)</span>
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
        return { label: 'Council Officer', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: '🏛️' };
      case 'FIELD_CREW':
        return { label: 'Field Crew Lead', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: '👷' };
      case 'RELIEF_COORDINATOR':
        return { label: 'Relief Coordinator', color: 'bg-teal-50 text-teal-700 border-teal-200', icon: '🏠' };
      case 'CITIZEN':
        return { label: 'Citizen', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: '👤' };
      default:
        return { label: 'Officer', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: '🏛️' };
    }
  };

  const roleMeta = getRoleBadge(user?.role);

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-50 px-6 py-3 flex flex-wrap items-center justify-between gap-4 shadow-xs">
      {/* Left: Branding & Segmented Nav */}
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

        {/* Dynamic Role-Tailored Nav Links */}
        <nav className="hidden sm:flex items-center gap-1.5 ml-4 text-xs font-semibold">
          <Link
            to="/"
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              location.pathname === '/'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Overview
          </Link>

          {/* Officer Link */}
          {(user?.role === 'COUNCIL_OFFICER' || !user) && (
            <Link
              to="/officer"
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                location.pathname === '/officer'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Officer Center</span>
            </Link>
          )}

          {/* Crew Link */}
          {(user?.role === 'FIELD_CREW' || user?.role === 'COUNCIL_OFFICER' || !user) && (
            <Link
              to="/crew"
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                location.pathname === '/crew'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Field Crew</span>
            </Link>
          )}

          {/* Relief Link */}
          {(user?.role === 'RELIEF_COORDINATOR' || user?.role === 'COUNCIL_OFFICER' || !user) && (
            <Link
              to="/relief"
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                location.pathname === '/relief'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Relief Desk</span>
            </Link>
          )}

          {/* Public Map Link */}
          <Link
            to="/map"
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              location.pathname === '/map' || location.pathname === '/public'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Public Map</span>
          </Link>
        </nav>
      </div>

      {/* Right: User Profile & Role Switcher / Citizen Status */}
      <div className="flex items-center gap-3 text-xs">
        {user ? (
          <>
            {/* Active Staff Persona Pill */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-100 border border-slate-200">
              <span className="text-sm">{roleMeta.icon}</span>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-800 leading-tight">
                  {user.name}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {roleMeta.label}
                </div>
              </div>
            </div>

            {/* Switch / Change Account Button */}
            <Link
              to="/login"
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
              title="Switch Active Staff Account"
            >
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden md:inline">Switch</span>
            </Link>

            {/* Sign Out Action */}
            <button
              onClick={() => logout()}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-rose-300 text-slate-700 hover:text-rose-700 font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
              title="Sign out of municipal session"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500 group-hover:text-rose-600" />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </>
        ) : (
          <>
            {/* Citizen Guest Indicator */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-50/70 border border-emerald-200">
              <span className="text-sm">👤</span>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900 leading-tight">Public Citizen</div>
                <div className="text-[10px] text-emerald-700 font-semibold">Open Access Active</div>
              </div>
            </div>

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

        {/* Gateway Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 pl-3 border-l border-slate-200 text-[11px] text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
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
