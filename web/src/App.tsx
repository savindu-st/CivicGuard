import React from 'react';
import { ShieldAlert, Activity, MapPin, Users, CheckCircle2 } from 'lucide-react';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-dark-900/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              CivicGuard <span className="text-xs font-semibold px-2 py-0.5 rounded bg-brand-500/20 text-brand-500 border border-brand-500/30">LIVE OPS</span>
            </h1>
            <p className="text-xs text-slate-400">Disaster Response Intelligence & Coordination</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-800 border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-slate-300 font-medium">Kong Gateway: Connected</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
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
            <div className="mt-1 text-xs text-blue-400">1 Job In Progress</div>
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

        {/* Placeholder Map & Triage Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-panel p-6 min-h-[380px] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-400" /> Live Public Hazard Map (Colombo & Kandy)
              </h2>
              <span className="badge-critical">2 Wards Alerted</span>
            </div>
            <div className="flex-1 flex items-center justify-center border border-dashed border-slate-700 rounded-lg my-4 bg-dark-950/50">
              <p className="text-sm text-slate-500">Interactive Leaflet Disaster Map Component</p>
            </div>
          </div>

          <div className="glass-panel p-6 space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 5-Check AI Pipeline Status
            </h2>
            <div className="space-y-3 text-xs">
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
    </div>
  );
};

export default App;
