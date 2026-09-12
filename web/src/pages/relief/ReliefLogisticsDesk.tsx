import React, { useEffect, useState, useCallback } from 'react';
import {
  Home,
  Users,
  Package,
  AlertOctagon,
  LifeBuoy,
  RefreshCw,
  Plus,
  Radio,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Layers,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useSocket } from '../../hooks/useSocket';
import { SosTriageQueue } from '../../components/relief/SosTriageQueue';
import { ShelterNetworkMap } from '../../components/relief/ShelterNetworkMap';
import { NearestShelterMatcherModal } from '../../components/relief/NearestShelterMatcherModal';
import { EmergencySuppliesModal } from '../../components/relief/EmergencySuppliesModal';

export const ReliefLogisticsDesk: React.FC = () => {
  const { user, switchPersona } = useAuthStore();

  // Core Data States
  const [shelters, setShelters] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Selection States
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedShelterId, setSelectedShelterId] = useState<string | null>(null);

  // View Mode: Split-Screen Triage vs Registry Table
  const [viewMode, setViewMode] = useState<'TRIAGE' | 'REGISTRY'>('TRIAGE');

  // Modal States
  const [isMatcherOpen, setIsMatcherOpen] = useState<boolean>(false);
  const [matcherRequest, setMatcherRequest] = useState<any | null>(null);

  const [isSuppliesOpen, setIsSuppliesOpen] = useState<boolean>(false);
  const [suppliesTargetRequest, setSuppliesTargetRequest] = useState<any | null>(null);
  const [suppliesTargetShelter, setSuppliesTargetShelter] = useState<any | null>(null);

  // Real-time Alerts & Simulation
  const [liveAlertToast, setLiveAlertToast] = useState<string | null>(null);
  const [activeP1Distress, setActiveP1Distress] = useState<any | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Auto-switch to RELIEF_COORDINATOR role when landing on desk
  useEffect(() => {
    if (user && user.role !== 'RELIEF_COORDINATOR') {
      switchPersona('RELIEF_COORDINATOR');
    }
  }, [user, switchPersona]);

  // Fetch all core relief logistics data
  const fetchReliefData = useCallback(async () => {
    try {
      const [sheltersRes, requestsRes, resourcesRes] = await Promise.all([
        api.get('/api/relief/shelters'),
        api.get('/api/relief/help-requests?limit=100'),
        api.get('/api/relief/resources'),
      ]);

      const fetchedShelters = sheltersRes.data?.data?.shelters || [];
      const fetchedRequests = requestsRes.data?.data?.requests || [];
      const fetchedResources = resourcesRes.data?.data?.resources || [];

      setShelters(fetchedShelters);
      setRequests(fetchedRequests);
      setResources(fetchedResources);

      // Check if there is an active pending P1 request
      const topP1 = fetchedRequests.find(
        (r: any) => (r.urgency === 'CRITICAL' || r.urgency === 'P1') && r.status === 'PENDING'
      );
      if (topP1) {
        setActiveP1Distress(topP1);
      }
    } catch (err: any) {
      console.error('Failed to load relief logistics data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReliefData();
  }, [fetchReliefData]);

  // Real-time Socket Synchronization (ADR-004 & ADR-020)
  useSocket({
    onEvent: (event, payload) => {
      if (
        ['relief:sos_new', 'relief:updated', 'relief:shelter_updated', 'relief:resource_allocated'].includes(
          event
        )
      ) {
        fetchReliefData();

        if (event === 'relief:sos_new') {
          setLiveAlertToast('🚨 New Citizen Emergency SOS Ingested for Triage');
          if (payload?.urgency === 'CRITICAL' || payload?.urgency === 'P1') {
            setActiveP1Distress(payload);
          }
        } else if (event === 'relief:shelter_updated') {
          setLiveAlertToast('🏠 Shelter Bed Occupancy Telemetry Synchronized');
        } else if (event === 'relief:resource_allocated') {
          setLiveAlertToast('📦 Emergency Supplies Parcel Allocated to Help Request');
        } else if (event === 'relief:updated') {
          setLiveAlertToast(`✓ SOS Help Request Status Transitioned to ${payload?.status}`);
        }

        setTimeout(() => setLiveAlertToast(null), 5000);
      }
    },
  });

  // Calculate High-Level Operational Metrics
  const totalShelters = shelters.length;
  const totalCapacity = shelters.reduce((acc, s) => acc + (s.capacity || 0), 0);
  const totalOccupancy = shelters.reduce((acc, s) => acc + (s.current_occupancy || 0), 0);
  const totalAvailableBeds = Math.max(0, totalCapacity - totalOccupancy);
  const overallOccupancyPercent = totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0;

  const pendingRequests = requests.filter((r) => r.status === 'PENDING');
  const p1Count = pendingRequests.filter((r) => r.urgency === 'CRITICAL' || r.urgency === 'P1').length;
  const p2Count = pendingRequests.filter((r) => r.urgency === 'HIGH' || r.urgency === 'P2').length;
  const allocatedSuppliesCount = resources.filter((r) => r.status === 'ASSIGNED').length;

  // Manual Occupancy Adjuster Handler
  const handleUpdateOccupancy = async (shelterId: string, newOccupancy: number) => {
    try {
      await api.patch(`/api/relief/shelters/${shelterId}/occupancy`, {
        current_occupancy: newOccupancy,
      });
      fetchReliefData();
    } catch (err: any) {
      console.error('Failed to update occupancy:', err);
    }
  };

  // SOS Status Update Handler
  const handleUpdateStatus = async (requestId: string, status: string) => {
    try {
      await api.patch(`/api/relief/help-requests/${requestId}/status`, { status });
      fetchReliefData();
      if (activeP1Distress && activeP1Distress.id === requestId && status !== 'PENDING') {
        setActiveP1Distress(null);
      }
    } catch (err: any) {
      console.error('Failed to update request status:', err);
    }
  };

  // Trigger Matcher Modal
  const handleOpenMatcher = (req: any) => {
    setMatcherRequest(req);
    setSelectedRequestId(req.id);
    setIsMatcherOpen(true);
  };

  // Trigger Supplies Modal
  const handleOpenSupplies = (req: any) => {
    setSuppliesTargetRequest(req);
    setSelectedRequestId(req.id);
    setIsSuppliesOpen(true);
  };

  // Trigger Supplies Modal from Shelter Card
  const handleOpenSuppliesForShelter = (shelter: any) => {
    setSuppliesTargetShelter(shelter);
    setSelectedShelterId(shelter.id);
    setIsSuppliesOpen(true);
  };

  // Focus Map on Request
  const handleLocateOnMap = (req: any) => {
    setSelectedRequestId(req.id);
  };

  // Live SOS Simulation Trigger
  const handleSimulateSos = async () => {
    setIsSimulating(true);
    try {
      const res = await api.post('/api/relief/simulate-sos', {});
      const newSOS = res.data?.data;
      if (newSOS) {
        setSelectedRequestId(newSOS.id);
        setActiveP1Distress(newSOS);
      }
      fetchReliefData();
    } catch (err: any) {
      console.error('Failed to simulate SOS:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-dark-950 text-slate-100">
      {/* 1. Top KPI Command Ribbon */}
      <div className="border-b border-slate-800 bg-dark-900/90 backdrop-blur-md px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Branding & Role */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Home className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black text-white tracking-wide uppercase">
                Relief Logistics Desk
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Radio className="w-2.5 h-2.5 animate-pulse" />
                <span>HUMANITARIAN DESK</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              SOS Triage (P1–P4) • Live Shelter Bed Gauges • Proximity Matching • Supplies Allocation
            </p>
          </div>
        </div>

        {/* Center: Live KPI Counters */}
        <div className="hidden xl:flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="p-1 rounded bg-emerald-500/20 text-emerald-400">
              <Home className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Shelters Active</div>
              <div className="text-sm font-extrabold text-white">{totalShelters} Centers</div>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800"></div>

          <div className="flex items-center gap-2.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                overallOccupancyPercent >= 85 ? 'bg-red-500' : 'bg-emerald-500'
              } animate-ping`}
            ></span>
            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Bed Occupancy</div>
              <div className="text-sm font-extrabold text-white">
                {totalOccupancy} / {totalCapacity} ({overallOccupancyPercent}%)
              </div>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800"></div>

          <div className="flex items-center gap-2.5">
            <div className="p-1 rounded bg-sky-500/20 text-sky-400">
              <Users className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Available Beds</div>
              <div className="text-sm font-extrabold text-sky-400">{totalAvailableBeds} Open</div>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800"></div>

          <div className="flex items-center gap-2.5">
            <div className="p-1 rounded bg-red-500/20 text-red-400">
              <AlertOctagon className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">SOS Triage Queue</div>
              <div className="text-sm font-extrabold text-red-400 flex items-center gap-1.5">
                <span>{pendingRequests.length} Pending</span>
                {p1Count > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500 text-white font-black animate-pulse">
                    {p1Count} P1
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800"></div>

          <div className="flex items-center gap-2.5">
            <div className="p-1 rounded bg-amber-500/20 text-amber-400">
              <Package className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Supplies Dispatched</div>
              <div className="text-sm font-extrabold text-white">{allocatedSuppliesCount} Parcels</div>
            </div>
          </div>
        </div>

        {/* Right: Simulation Button & Sub-View Toggles */}
        <div className="flex items-center gap-2 text-xs">
          {/* Simulate SOS Button */}
          <button
            onClick={handleSimulateSos}
            disabled={isSimulating}
            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-red-600/30 transition-all border border-red-400"
            title="Simulate realistic emergency flood distress call in Colombo or Kandy"
          >
            {isSimulating ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <AlertOctagon className="w-3.5 h-3.5 animate-pulse" />
            )}
            <span>Simulate SOS Distress Call</span>
          </button>

          {/* Sub-View Tabs */}
          <div className="bg-dark-850 p-1 rounded-lg border border-slate-800 flex items-center gap-1">
            <button
              onClick={() => setViewMode('TRIAGE')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                viewMode === 'TRIAGE' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Triage & Shelter Map
            </button>
            <button
              onClick={() => setViewMode('REGISTRY')}
              className={`px-3 py-1 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                viewMode === 'REGISTRY' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Home className="w-3 h-3" />
              <span>Shelter Registry ({shelters.length})</span>
            </button>
          </div>

          <button
            onClick={fetchReliefData}
            className="p-1.5 rounded-lg bg-dark-850 hover:bg-dark-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
            title="Refresh All Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Real-time Notification Banner Toast */}
      {liveAlertToast && (
        <div className="bg-emerald-950/80 border-b border-emerald-500/50 px-6 py-2 text-xs text-emerald-200 flex items-center justify-between animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>{liveAlertToast}</span>
          </div>
          <button
            onClick={() => setLiveAlertToast(null)}
            className="text-emerald-400 hover:text-white text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 3. High-Priority P1 Distress Banner (ADR-020) */}
      {activeP1Distress && (
        <div className="bg-gradient-to-r from-red-950/90 via-dark-900 to-red-950/90 border-b-2 border-red-500 px-6 py-3 text-xs text-red-100 flex flex-wrap items-center justify-between gap-3 shadow-2xl animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-600 text-white shadow-lg shadow-red-600/50 animate-bounce">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold uppercase tracking-wider text-red-300">
                  🚨 HIGH-PRIORITY P1 DISTRESS BEACON ACTIVE
                </span>
                <span className="px-2 py-0.2 rounded bg-red-500/30 text-red-200 font-bold text-[10px] border border-red-400/40">
                  {activeP1Distress.help_type} • {activeP1Distress.people_count || 1} PEOPLE
                </span>
              </div>
              <p className="text-slate-200 font-medium max-w-3xl truncate mt-0.5">
                {activeP1Distress.description || 'Immediate emergency rescue and evacuation required.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => handleLocateOnMap(activeP1Distress)}
              className="px-3 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-white font-bold text-xs border border-slate-700 flex items-center gap-1.5 transition-all shadow"
            >
              <Navigation className="w-3.5 h-3.5 text-sky-400" />
              <span>Pinpoint Distress GPS</span>
            </button>
            <button
              onClick={() => handleOpenMatcher(activeP1Distress)}
              className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-lg shadow-red-600/40 border border-red-400 flex items-center gap-1.5 transition-all"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Triage & Match Shelter</span>
            </button>
            <button
              onClick={() => setActiveP1Distress(null)}
              className="text-slate-400 hover:text-white text-xs px-2"
              title="Acknowledge & Hide Banner"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* 4. Main Operations Content */}
      <main className="flex-1 p-6 flex flex-col overflow-hidden">
        {viewMode === 'TRIAGE' ? (
          /* Split-Screen: Left Pane Map (50%), Right Pane Triage Queue (50%) */
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
            {/* Left Pane: Interactive Shelter Network Map */}
            <div className="flex flex-col h-full min-h-[500px]">
              <ShelterNetworkMap
                shelters={shelters}
                requests={requests}
                resources={resources}
                selectedShelterId={selectedShelterId}
                selectedRequestId={selectedRequestId}
                onSelectShelter={(id) => {
                  setSelectedShelterId(id);
                  setSelectedRequestId(null);
                }}
                onSelectRequest={(id) => {
                  setSelectedRequestId(id);
                  setSelectedShelterId(null);
                }}
                onUpdateOccupancy={handleUpdateOccupancy}
                onOpenMatcherWithRequest={handleOpenMatcher}
                onOpenSuppliesForShelter={handleOpenSuppliesForShelter}
              />
            </div>

            {/* Right Pane: Urgency Triage Queue */}
            <div className="flex flex-col h-full min-h-[500px]">
              <SosTriageQueue
                requests={requests}
                selectedRequestId={selectedRequestId}
                onSelectRequest={(id) => {
                  setSelectedRequestId(id);
                  setSelectedShelterId(null);
                }}
                onOpenMatcher={handleOpenMatcher}
                onOpenSupplies={handleOpenSupplies}
                onUpdateStatus={handleUpdateStatus}
                onLocateOnMap={handleLocateOnMap}
              />
            </div>
          </div>
        ) : (
          /* Shelter & Warehouse Registry Management Table */
          <div className="flex-1 bg-dark-900/60 rounded-xl border border-slate-800 p-6 space-y-6 overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Home className="w-5 h-5 text-emerald-400" />
                  <span>Municipal Emergency Relief Shelter Registry</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Comprehensive shelter capacity gauges, address coordinates, and warehouse resource allocations
                </p>
              </div>
              <button
                onClick={() => {
                  setSuppliesTargetShelter(shelters[0] || null);
                  setIsSuppliesOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg border border-brand-400"
              >
                <Plus className="w-4 h-4" />
                <span>Register Warehouse Shipment</span>
              </button>
            </div>

            {/* Shelters Grid Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {shelters.map((shelter) => {
                const capacity = shelter.capacity || 100;
                const occupancy = shelter.current_occupancy || 0;
                const available = Math.max(0, capacity - occupancy);
                const percent = Math.round((occupancy / capacity) * 100);
                const shelterStock = resources.filter((r) => r.shelter_id === shelter.id && r.status === 'AVAILABLE');

                return (
                  <div
                    key={shelter.id}
                    className="p-5 rounded-xl bg-dark-850 border border-slate-800 space-y-4 shadow-lg hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-white">{shelter.name}</h3>
                        <p className="text-xs text-slate-400">{shelter.address || shelter.ward_name || 'Colombo'}</p>
                      </div>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          percent >= 85
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : percent >= 60
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {percent}% Full
                      </span>
                    </div>

                    {/* Progress Meter */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Available Beds:</span>
                        <strong className="text-white">
                          {available} / {capacity}
                        </strong>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            percent >= 85 ? 'bg-red-500' : percent >= 60 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Manual Adjuster */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-dark-900 border border-slate-800 text-xs">
                      <span className="text-slate-400">Occupancy Counter:</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateOccupancy(shelter.id, Math.max(0, occupancy - 1))}
                          className="p-1 rounded bg-dark-800 hover:bg-dark-700 text-slate-300 hover:text-white"
                        >
                          -
                        </button>
                        <span className="font-mono font-bold text-white px-1">{occupancy}</span>
                        <button
                          onClick={() => handleUpdateOccupancy(shelter.id, Math.min(capacity, occupancy + 1))}
                          className="p-1 rounded bg-dark-800 hover:bg-dark-700 text-slate-300 hover:text-white"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Stock Summary */}
                    <div className="space-y-1 pt-1 border-t border-slate-800 text-xs">
                      <div className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider flex items-center gap-1">
                        <Package className="w-3 h-3 text-brand-400" />
                        <span>Allocated Stock ({shelterStock.length})</span>
                      </div>
                      <div className="space-y-1 text-[11px]">
                        {shelterStock.slice(0, 3).map((st) => (
                          <div key={st.id} className="flex justify-between text-slate-300">
                            <span>{st.resource_name}</span>
                            <strong className="text-brand-400">
                              {st.quantity} {st.unit}
                            </strong>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenSuppliesForShelter(shelter)}
                      className="w-full py-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 border border-slate-700"
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>Manage Warehouse Supplies</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <NearestShelterMatcherModal
        request={matcherRequest}
        shelters={shelters}
        isOpen={isMatcherOpen}
        onClose={() => setIsMatcherOpen(false)}
        onMatched={() => {
          fetchReliefData();
        }}
      />

      <EmergencySuppliesModal
        isOpen={isSuppliesOpen}
        onClose={() => setIsSuppliesOpen(false)}
        targetRequest={suppliesTargetRequest}
        targetShelter={suppliesTargetShelter}
        shelters={shelters}
        resources={resources}
        requests={requests}
        onAllocated={() => {
          fetchReliefData();
        }}
      />
    </div>
  );
};
export default ReliefLogisticsDesk;
