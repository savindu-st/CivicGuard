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
  const { user } = useAuthStore();

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
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50 text-slate-900">
      {/* 1. Top KPI Command Ribbon */}
      <div className="border-b border-slate-200 bg-white/95 backdrop-blur-md px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        {/* Left: Branding & Role info */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black text-slate-900 tracking-wide uppercase">
                Council Officer Control Center
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <Radio className="w-2.5 h-2.5" />
                <span>LIVE COMMAND</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Ward Triage • 5-Signal AI Verification • Tactical Crew Dispatch • Road Closures
            </p>
          </div>
        </div>

        {/* Center: Live KPI Counters */}
        <div className="hidden lg:flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <div>
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Active Hazards</div>
              <div className="text-sm font-black text-slate-900">{activeHazardsCount} Verified</div>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200"></div>

          <div className="flex items-center gap-2.5">
            <div className="p-1 rounded bg-amber-50 text-amber-600 border border-amber-200">
              <Activity className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Review Queue</div>
              <div className="text-sm font-black text-amber-700">
                {needsVerificationCount} Needs Action
              </div>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200"></div>

          <div className="flex items-center gap-2.5">
            <div className="p-1 rounded bg-red-50 text-red-600 border border-red-200">
              <Ban className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Closed Roads</div>
              <div className="text-sm font-black text-slate-900">{closedRoadsCount} Segments</div>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200"></div>

          <div className="flex items-center gap-2.5">
            <div className="p-1 rounded bg-blue-50 text-blue-600 border border-blue-200">
              <Users className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Deployed Crews</div>
              <div className="text-sm font-black text-slate-900">
                {activeCrewsCount} / {crews.length} Active
              </div>
            </div>
          </div>
        </div>

        {/* Right: Sub-View Toggles & Refresh */}
        <div className="flex items-center gap-2 text-xs">
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center gap-1">
            <button
              onClick={() => setViewMode('TRIAGE')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                viewMode === 'TRIAGE'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hazard Triage & Map
            </button>
            <button
              onClick={() => setViewMode('ROADS')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                viewMode === 'ROADS'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Ban className="w-3 h-3" />
              <span>Roads Network ({closedRoadsCount})</span>
            </button>
          </div>

          <button
            onClick={fetchOperationsData}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors shadow-xs"
            title="Refresh All Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Critical Emergency SOS Distress Banner - Clean High-Priority Alert Card */}
      {activeSosAlert && (
        <div className="bg-white border-l-4 border-l-red-600 border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-md z-20">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center shadow-xs">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-red-100 text-red-800 uppercase tracking-wider border border-red-200">
                  DISTRESS PANIC BEACON ACTIVE
                </span>
                <span className="text-[11px] text-slate-500 font-semibold">
                  {new Date(activeSosAlert.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <h2 className="text-sm font-extrabold text-slate-900 mt-0.5">
                {activeSosAlert.crew_name || 'Field Response Unit'} — {activeSosAlert.message}
              </h2>
              <p className="text-xs text-slate-600">
                Distress GPS: <span className="font-mono font-bold text-slate-900">{Number(activeSosAlert.latitude).toFixed(5)}, {Number(activeSosAlert.longitude).toFixed(5)}</span> • Immediate rescue backup required!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                setSelectedIncidentId(null);
                setActiveSosAlert({ ...activeSosAlert, focusTrigger: Date.now() });
              }}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
            >
              <Navigation className="w-4 h-4" />
              <span>Locate Distress GPS</span>
            </button>
            <button
              onClick={() => setActiveSosAlert(null)}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs transition-colors shadow-xs"
            >
              Acknowledge & Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Real-time Alert Toast Notification */}
      {liveAlertToast && (
        <div className="bg-slate-900 border-l-4 border-l-emerald-500 px-6 py-2.5 text-xs text-white font-bold flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            <span>{liveAlertToast}</span>
          </div>
          <button
            onClick={() => setLiveAlertToast(null)}
            className="text-slate-400 hover:text-white text-xs underline"
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
