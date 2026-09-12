import React, { useEffect, useState, useCallback } from 'react';
import {
  ShieldAlert,
  Activity,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Users,
  Navigation,
  Ban,
  Radio,
  RefreshCw,
  Sparkles,
  Layers,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useSocket } from '../../hooks/useSocket';
import { OfficerTacticalMap } from '../../components/map/OfficerTacticalMap';
import { HazardTriageGrid } from '../../components/incidents/HazardTriageGrid';
import { IncidentCommandInspector } from '../../components/incidents/IncidentCommandInspector';
import { RoadClosureManager } from '../../components/incidents/RoadClosureManager';

export const CouncilOfficerControlCenter: React.FC = () => {
  const { user, switchPersona } = useAuthStore();

  // Data states
  const [incidents, setIncidents] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [roads, setRoads] = useState<any[]>([]);
  const [crews, setCrews] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters & Selection
  const [selectedWardId, setSelectedWardId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

  // Sub-view mode (Triage vs Full Roads)
  const [viewMode, setViewMode] = useState<'TRIAGE' | 'ROADS'>('TRIAGE');
  const [liveAlertToast, setLiveAlertToast] = useState<string | null>(null);
  const [activeSosAlert, setActiveSosAlert] = useState<any | null>(null);

  // Auto-switch to COUNCIL_OFFICER persona when viewing control center
  useEffect(() => {
    if (user && user.role !== 'COUNCIL_OFFICER') {
      switchPersona('COUNCIL_OFFICER');
    }
  }, [user, switchPersona]);

  // Fetch all core operational data
  const fetchOperationsData = useCallback(async () => {
    try {
      const [incRes, wardsRes, roadsRes, crewsRes, ticketsRes] = await Promise.all([
        api.get('/api/incidents?limit=100'),
        api.get('/api/incidents/wards'),
        api.get('/api/incidents/roads'),
        api.get('/api/tickets/crews'),
        api.get('/api/tickets?limit=100'),
      ]);

      setIncidents(incRes.data?.data?.incidents || []);
      setWards(wardsRes.data?.data?.wards || []);
      setRoads(roadsRes.data?.data?.roads || []);
      setCrews(crewsRes.data?.data?.crews || []);
      setTickets(ticketsRes.data?.data?.tickets || []);
    } catch (err: any) {
      console.error('Failed to load control center data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOperationsData();
  }, [fetchOperationsData]);

  // Real-time updates via Socket.IO
  useSocket({
    onEvent: (event, payload) => {
      if (event === 'crew:sos') {
        setActiveSosAlert(payload);
        setLiveAlertToast(`🚨 EMERGENCY DISTRESS: Crew ${payload.crew_name || payload.crew_id} transmitted SOS!`);
        fetchOperationsData();
        return;
      }

      if (
        [
          'hazard:new',
          'hazard:updated',
          'hazard:resolved',
          'ticket:assigned',
          'ticket:status_changed',
          'road:closed',
          'road:reopened',
          'crew:location_updated',
          'crew:availability_changed',
          'corroboration:vote',
          'crew:sos',
        ].includes(event)
      ) {
        fetchOperationsData();

        if (event === 'hazard:new') {
          setLiveAlertToast('🚨 New Citizen Hazard Ingested for Triage');
        } else if (event === 'ticket:assigned') {
          setLiveAlertToast('👷 Field Crew Dispatched to Emergency Scene');
        } else if (event === 'road:closed') {
          setLiveAlertToast('⛔ Road Closure Enforced on Public Disaster Map');
        } else if (event === 'hazard:resolved') {
          setLiveAlertToast('✓ Hazard Resolved & Road Reopened by Crew Photo Proof');
        }

        setTimeout(() => setLiveAlertToast(null), 5000);
      }
    },
  });

  // Calculate top KPI statistics
  const activeHazardsCount = incidents.filter((i) =>
    ['CONFIRMED', 'IN_PROGRESS', 'DISPATCHED'].includes(i.status)
  ).length;
  const needsVerificationCount = incidents.filter((i) => i.status === 'NEEDS_VERIFICATION').length;
  const closedRoadsCount = roads.filter((r) => r.is_closed).length;
  const activeCrewsCount = crews.filter((c) => c.availability === 'BUSY').length;

  const selectedIncident = incidents.find((i) => i.id === selectedIncidentId);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-dark-950 text-slate-100">
      {/* 1. Top KPI Command Ribbon */}
      <div className="border-b border-slate-800 bg-dark-900/90 backdrop-blur-md px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Branding & Role info */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-brand-500/10 border border-brand-500/30 text-brand-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black text-white tracking-wide uppercase">
                Council Officer Control Center
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Radio className="w-2.5 h-2.5 animate-pulse" />
                <span>LIVE COMMAND</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Ward Triage • 5-Signal AI Verification • Tactical Crew Dispatch • Road Closures
            </p>
          </div>
        </div>

        {/* Center: Live KPI Counters */}
        <div className="hidden lg:flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Active Hazards</div>
              <div className="text-sm font-extrabold text-white">{activeHazardsCount} Verified</div>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800"></div>

          <div className="flex items-center gap-2.5">
            <div className="p-1 rounded bg-amber-500/20 text-amber-400">
              <Activity className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Review Queue</div>
              <div className="text-sm font-extrabold text-amber-400">
                {needsVerificationCount} Needs Action
              </div>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800"></div>

          <div className="flex items-center gap-2.5">
            <div className="p-1 rounded bg-red-500/20 text-red-400">
              <Ban className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Closed Roads</div>
              <div className="text-sm font-extrabold text-white">{closedRoadsCount} Segments</div>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800"></div>

          <div className="flex items-center gap-2.5">
            <div className="p-1 rounded bg-blue-500/20 text-blue-400">
              <Users className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Deployed Crews</div>
              <div className="text-sm font-extrabold text-white">
                {activeCrewsCount} / {crews.length} Active
              </div>
            </div>
          </div>
        </div>

        {/* Right: Sub-View Toggles & Refresh */}
        <div className="flex items-center gap-2 text-xs">
          <div className="bg-dark-850 p-1 rounded-lg border border-slate-800 flex items-center gap-1">
            <button
              onClick={() => setViewMode('TRIAGE')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                viewMode === 'TRIAGE'
                  ? 'bg-brand-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Hazard Triage & Map
            </button>
            <button
              onClick={() => setViewMode('ROADS')}
              className={`px-3 py-1 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                viewMode === 'ROADS'
                  ? 'bg-brand-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Ban className="w-3 h-3" />
              <span>Roads Network ({closedRoadsCount})</span>
            </button>
          </div>

          <button
            onClick={fetchOperationsData}
            className="p-1.5 rounded-lg bg-dark-850 hover:bg-dark-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
            title="Refresh All Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Critical Emergency SOS Distress Banner */}
      {activeSosAlert && (
        <div className="bg-red-950/95 border-b-2 border-red-500 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl animate-pulse z-20">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-red-600 text-white shadow-lg shadow-red-600/50 flex items-center justify-center animate-bounce">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-red-600 text-white uppercase tracking-wider">
                  DISTRESS PANIC BEACON ACTIVE
                </span>
                <span className="text-[11px] text-red-300 font-semibold">
                  {new Date(activeSosAlert.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <h2 className="text-sm font-extrabold text-white mt-0.5">
                {activeSosAlert.crew_name || 'Field Response Unit'} — {activeSosAlert.message}
              </h2>
              <p className="text-xs text-red-200">
                Distress GPS: <span className="font-mono font-bold text-white">{Number(activeSosAlert.latitude).toFixed(5)}, {Number(activeSosAlert.longitude).toFixed(5)}</span> • Immediate rescue backup required!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                setSelectedIncidentId(null);
                setActiveSosAlert({ ...activeSosAlert, focusTrigger: Date.now() });
              }}
              className="px-4 py-2 rounded-xl bg-white text-red-700 hover:bg-red-50 font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <Navigation className="w-4 h-4 text-red-600" />
              <span>Locate Distress GPS</span>
            </button>
            <button
              onClick={() => setActiveSosAlert(null)}
              className="px-3.5 py-2 rounded-xl bg-red-900/60 hover:bg-red-900 text-red-200 hover:text-white border border-red-500/40 font-semibold text-xs transition-colors"
            >
              Acknowledge & Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Real-time Alert Toast Notification */}
      {liveAlertToast && (
        <div className="bg-gradient-to-r from-brand-600 via-blue-600 to-indigo-600 px-6 py-2 text-xs text-white font-bold flex items-center justify-between shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 animate-ping" />
            <span>{liveAlertToast}</span>
          </div>
          <button
            onClick={() => setLiveAlertToast(null)}
            className="text-white/80 hover:text-white text-xs underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Main Workspace: Split-Screen Layout */}
      <div className="flex-1 p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-130px)]">
        {/* Left Pane (50% desktop): Interactive Tactical Map */}
        <div className="lg:col-span-6 flex flex-col h-full min-h-[500px]">
          <OfficerTacticalMap
            incidents={incidents}
            roads={roads}
            crews={crews}
            tickets={tickets}
            selectedIncidentId={selectedIncidentId}
            activeSosAlert={activeSosAlert}
            onSelectIncident={(id) => {
              setSelectedIncidentId(id);
              setViewMode('TRIAGE');
            }}
            onSelectRoad={(roadId) => {
              const road = roads.find((r) => r.id === roadId);
              if (road) {
                // If road has associated incident, select it
                const linkedInc = incidents.find((i) => i.road_id === road.id);
                if (linkedInc) {
                  setSelectedIncidentId(linkedInc.id);
                  setViewMode('TRIAGE');
                } else {
                  setViewMode('ROADS');
                }
              }
            }}
          />
        </div>

        {/* Right Pane (50% desktop): Master-Detail Inspector / Triage Grid / Roads */}
        <div className="lg:col-span-6 flex flex-col h-full min-h-[500px]">
          {viewMode === 'ROADS' ? (
            <RoadClosureManager
              roads={roads}
              onRoadUpdated={fetchOperationsData}
              onSelectRoadOnMap={(road) => {
                // Pan map to road by selecting any linked incident
                const linkedInc = incidents.find((i) => i.road_id === road.id);
                if (linkedInc) {
                  setSelectedIncidentId(linkedInc.id);
                }
              }}
            />
          ) : selectedIncident ? (
            <IncidentCommandInspector
              incident={selectedIncident}
              crews={crews}
              tickets={tickets}
              onBack={() => setSelectedIncidentId(null)}
              onIncidentUpdated={fetchOperationsData}
            />
          ) : (
            <HazardTriageGrid
              incidents={incidents}
              wards={wards}
              selectedWardId={selectedWardId}
              onSelectWard={setSelectedWardId}
              selectedStatus={selectedStatus}
              onSelectStatus={setSelectedStatus}
              selectedIncidentId={selectedIncidentId}
              onSelectIncident={setSelectedIncidentId}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedSeverity={selectedSeverity}
              onSeverityChange={setSelectedSeverity}
            />
          )}
        </div>
      </div>
    </div>
  );
};
