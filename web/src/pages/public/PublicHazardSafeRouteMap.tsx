import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  MapPin,
  Home,
  Navigation,
  Layers,
  Filter,
  Plus,
  Compass,
  CheckCircle2,
  RefreshCw,
  Waves,
  TreePine,
  Car,
  Mountain,
  Info,
  Radio,
  Camera,
  Sparkles,
} from 'lucide-react';
import { api } from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import { PublicHazardMap } from '../../components/map/PublicHazardMap';
import { CitizenHazardReportModal } from '../../components/incidents/CitizenHazardReportModal';
import { CitizenPhotoScanPortal, YoloDetection } from '../../components/incidents/CitizenPhotoScanPortal';
import { SafeRoutePlanner } from '../../components/routing/SafeRoutePlanner';

export const PublicHazardSafeRouteMap: React.FC = () => {
  const [hazards, setHazards] = useState<any[]>([]);
  const [closedRoads, setClosedRoads] = useState<any[]>([]);
  const [shelters, setShelters] = useState<any[]>([]);
  const [selectedHazardId, setSelectedHazardId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters & Layer Toggles
  const [filterType, setFilterType] = useState<string>('ALL');
  const [showPerimeters, setShowPerimeters] = useState<boolean>(true);
  const [showClosedRoads, setShowClosedRoads] = useState<boolean>(true);
  const [showShelters, setShowShelters] = useState<boolean>(true);

  // Pin-Drop & Reporting Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isPinDropMode, setIsPinDropMode] = useState<boolean>(false);
  const [pinDropLocation, setPinDropLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Citizen AI Photo Scanner Portal State
  const [isScanPortalOpen, setIsScanPortalOpen] = useState<boolean>(false);
  const [prefilledScanData, setPrefilledScanData] = useState<{
    photoFile: File | null;
    photoUrl: string | null;
    hazardType: string;
    depthBenchmark: string;
    confidence: number;
    detections: YoloDetection[];
  } | null>(null);

  // Safe Detour Route State
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [avoidedRoads, setAvoidedRoads] = useState<any[]>([]);
  const [isRerouted, setIsRerouted] = useState<boolean>(false);
  const [rerouteTrigger, setRerouteTrigger] = useState<number>(0);

  // Status Notification Toast
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'alert' } | null>(null);

  const showToast = (message: string, type: 'success' | 'alert' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch Public Hazards & Closed Roads
  const fetchHazardData = useCallback(async () => {
    try {
      const res = await api.get('/api/incidents/map/hazards');
      const data = res.data?.data;
      if (data) {
        setHazards(data.hazards || []);
        setClosedRoads(data.closed_roads || []);
      }
    } catch (err: any) {
      console.error('Error fetching hazards:', err);
    }
  }, []);

  // Fetch Relief Shelters
  const fetchShelters = useCallback(async () => {
    try {
      const res = await api.get('/api/relief/shelters');
      const data = res.data?.data;
      if (data) {
        setShelters(data.shelters || []);
      }
    } catch (err: any) {
      console.error('Error fetching shelters:', err);
    }
  }, []);

  // Initial Data Load
  useEffect(() => {
    const loadAll = async () => {
      setIsLoading(true);
      await Promise.all([fetchHazardData(), fetchShelters()]);
      setIsLoading(false);
    };
    loadAll();
  }, [fetchHazardData, fetchShelters]);

  // Real-Time Socket.IO Synchronization
  const handleSocketEvent = useCallback(
    (event: string, payload: any) => {
      console.log(`[Socket:PublicMap] Event received: ${event}`, payload);
      fetchHazardData();

      if (event === 'road:closed') {
        showToast('⚠️ New road closure confirmed. Updating live map overlays...', 'alert');
        setRerouteTrigger((prev) => prev + 1);
      } else if (event === 'hazard:created' || event === 'hazard:updated') {
        showToast('Live hazard verified by Council Officer Command.', 'alert');
        setRerouteTrigger((prev) => prev + 1);
      } else if (event === 'relief:shelter_updated') {
        fetchShelters();
      }
    },
    [fetchHazardData, fetchShelters]
  );

  const { isConnected } = useSocket({ onEvent: handleSocketEvent });

  // Handle Pin Drop on Map
  const handlePinDrop = (coords: { latitude: number; longitude: number }) => {
    setPinDropLocation(coords);
    setIsPinDropMode(false);
    setIsReportModalOpen(true);
    showToast(`GPS Pin dropped at (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})`);
  };

  // Handle Corroboration Action (ADR-012)
  const handleCorroborate = async (hazardId: string, vote: 'CONFIRM' | 'REFUTE') => {
    try {
      const res = await api.post(`/api/incidents/${hazardId}/corroborate`, { vote });
      const data = res.data?.data;
      showToast(
        `Vote registered: ${vote}. New confidence score: ${Math.round((data.new_confidence || 0.8) * 100)}%`
      );
      fetchHazardData();
    } catch (err: any) {
      showToast(err.message || 'Could not record vote', 'alert');
    }
  };

  // Handle Escalation from YOLO Photo Scanner to Official Report
  const handleEscalateToReport = (scanData: {
    photoFile: File | null;
    photoUrl: string | null;
    hazardType: string;
    depthBenchmark: string;
    confidence: number;
    detections: YoloDetection[];
  }) => {
    setPrefilledScanData(scanData);
    setIsScanPortalOpen(false);
    setIsReportModalOpen(true);
    showToast(
      `Photo verified by Gemini 3.5 (${Math.round(scanData.confidence * 100)}% confidence). Ready to report hazard!`,
      'success'
    );
  };

  // Filtered Hazards
  const filteredHazards = hazards.filter((h) => {
    if (filterType === 'ALL') return true;
    return h.incident_type === filterType;
  });

  // Calculate Aggregates for Emergency Header
  const criticalCount = hazards.filter((h) => h.severity === 'CRITICAL').length;
  const totalClosedRoads = closedRoads.length;
  const totalAvailableBeds = shelters.reduce(
    (acc, s) => acc + ((s.capacity || 0) - (s.current_occupancy || 0)),
    0
  );

  return (
    <div className="relative flex-1 flex flex-col h-[calc(100vh-65px)] bg-slate-50 overflow-hidden">
      {/* Top Emergency Telemetry Status Ticker */}
      <div className="border-b border-slate-200 bg-white/95 backdrop-blur-md px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 z-20 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <span className="font-black text-slate-900 text-xs tracking-wider uppercase">
              Live Disaster Hazard Map
            </span>
          </div>
          <span className="hidden md:inline text-xs text-slate-400">•</span>
          <span className="hidden md:inline text-xs text-slate-600">
            Real-time verified flood perimeters, road closures & emergency shelters
          </span>
        </div>

        {/* Quick KPI Badges */}
        <div className="flex items-center gap-3 text-xs">
          <div className="badge-critical">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{criticalCount} Critical Flood Zones</span>
          </div>

          <div className="badge-high">
            <span>⛔ {totalClosedRoads} Closed Roads</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 badge-success">
            <Home className="w-3.5 h-3.5" />
            <span>{totalAvailableBeds} Available Beds</span>
          </div>

          <button
            onClick={() => setIsScanPortalOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs transition-all shadow-xs"
          >
            <Camera className="w-3.5 h-3.5 text-blue-600" />
            <span>Scan Photo with Gemini AI ⚡</span>
          </button>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pl-2 border-l border-slate-200">
            <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span className="hidden lg:inline font-medium">{isConnected ? 'Telematics Live' : 'Connecting...'}</span>
          </div>
        </div>
      </div>

      {/* Main Map Workspace Area */}
      <div className="relative flex-1 w-full h-full">
        {/* Floating Top-Left Controls: Layer Toggles & Hazard Category Filter */}
        <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2 pointer-events-auto max-w-sm">
          {/* Layer Toggles Pill Bar */}
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-white/95 border border-slate-200 shadow-md backdrop-blur-md text-xs">
            <button
              onClick={() => setShowPerimeters(!showPerimeters)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                showPerimeters
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span>Perimeters</span>
            </button>

            <button
              onClick={() => setShowClosedRoads(!showClosedRoads)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                showClosedRoads
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span>Closed Roads</span>
            </button>

            <button
              onClick={() => setShowShelters(!showShelters)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                showShelters
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span>Shelters</span>
            </button>
          </div>

          {/* Hazard Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1 p-1.5 rounded-xl bg-white/95 border border-slate-200 shadow-md backdrop-blur-md text-[11px]">
            {[
              { id: 'ALL', label: 'All Hazards' },
              { id: 'FLOOD', label: '🌊 Floods' },
              { id: 'ROAD_DAMAGE', label: '🚧 Roads' },
              { id: 'FALLEN_TREE', label: '🌲 Trees' },
              { id: 'LANDSLIDE', label: '⛰️ Landslides' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilterType(cat.id)}
                className={`px-2 py-0.5 rounded-lg font-medium transition-colors ${
                  filterType === cat.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Floating Bottom Action Bar: Report Hazard & AI Scanner FABs */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-[1000] flex flex-wrap items-center justify-center gap-3 pointer-events-auto">
          <button
            onClick={() => {
              setIsPinDropMode(false);
              setPrefilledScanData(null);
              setIsReportModalOpen(true);
            }}
            className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-sm tracking-wide shadow-2xl shadow-red-600/40 flex items-center gap-2 border border-red-400 transition-all transform hover:scale-105"
          >
            <AlertTriangle className="w-4 h-4 animate-pulse" />
            <span>REPORT HAZARD ⚠️</span>
          </button>

          <button
            onClick={() => setIsScanPortalOpen(true)}
            className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 hover:from-slate-800 hover:to-indigo-900 text-white font-extrabold text-sm tracking-wide shadow-2xl shadow-blue-900/40 flex items-center gap-2 border border-blue-400/40 transition-all transform hover:scale-105"
          >
            <Camera className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>AI PHOTO SCANNER ⚡</span>
          </button>
        </div>

        {/* Status Toast Notification */}
        {notification && (
          <div
            className={`absolute bottom-20 left-1/2 transform -translate-x-1/2 z-[1000] px-4 py-2 rounded-xl text-xs font-bold shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 ${
              notification.type === 'alert'
                ? 'bg-orange-500/90 text-white border border-orange-300'
                : 'bg-emerald-600/90 text-white border border-emerald-300'
            }`}
          >
            {notification.message}
          </div>
        )}

        {/* The Leaflet Map Component */}
        <PublicHazardMap
          hazards={filteredHazards}
          closedRoads={closedRoads}
          shelters={shelters}
          selectedHazardId={selectedHazardId}
          onSelectHazard={(id) => setSelectedHazardId(id)}
          isPinDropMode={isPinDropMode}
          pinDropLocation={pinDropLocation}
          onPinDrop={handlePinDrop}
          routeCoordinates={routeCoordinates}
          avoidedClosedRoads={avoidedRoads}
          isRerouted={isRerouted}
          onCorroborate={handleCorroborate}
          showPerimeters={showPerimeters}
          showClosedRoads={showClosedRoads}
          showShelters={showShelters}
        />

        {/* Floating Safe Route & Evacuation Planner Drawer */}
        <SafeRoutePlanner
          shelters={shelters}
          currentLocation={pinDropLocation}
          rerouteTrigger={rerouteTrigger}
          onRouteCalculated={(route) => {
            if (route) {
              setRouteCoordinates(route.coordinates);
              setAvoidedRoads(route.avoidedRoads);
              setIsRerouted(route.isRerouted);
            } else {
              setRouteCoordinates([]);
              setAvoidedRoads([]);
              setIsRerouted(false);
            }
          }}
        />
      </div>

      {/* Citizen AI Photo Scan & YOLO Verification Portal */}
      <CitizenPhotoScanPortal
        isOpen={isScanPortalOpen}
        onClose={() => setIsScanPortalOpen(false)}
        onEscalateToReport={handleEscalateToReport}
      />

      {/* Citizen Hazard Report Modal */}
      <CitizenHazardReportModal
        isOpen={isReportModalOpen}
        onClose={() => {
          setIsReportModalOpen(false);
          setPrefilledScanData(null);
        }}
        currentCoordinates={pinDropLocation}
        initialScanData={prefilledScanData}
        onEnablePinDropMode={() => {
          setIsPinDropMode(true);
          showToast('Click anywhere on the map to place your hazard report pin!', 'alert');
        }}
        onReportSubmitted={(newInc) => {
          showToast('Hazard report verified and registered! Map camera focused.');
          fetchHazardData();
          if (newInc?.id) {
            setSelectedHazardId(newInc.id);
          }
        }}
      />
    </div>
  );
};
