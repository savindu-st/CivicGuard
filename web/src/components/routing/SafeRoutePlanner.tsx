import React, { useState, useEffect } from 'react';
import {
  Navigation,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  Home,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Clock,
  Milestone,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../../services/api';

export interface SafeRoutePlannerProps {
  shelters: any[];
  currentLocation: { latitude: number; longitude: number } | null;
  onRouteCalculated: (routeData: {
    coordinates: [number, number][];
    avoidedRoads: any[];
    distanceKm: number;
    isRerouted: boolean;
  } | null) => void;
  // External triggers like Socket.IO road closure events
  rerouteTrigger?: number;
}

const ORIGIN_PRESETS = [
  { name: 'Havelock Town (Colombo 05)', lat: 6.879, lon: 79.866 },
  { name: 'Bambalapitiya Junction', lat: 6.892, lon: 79.855 },
  { name: 'Cinnamon Gardens (Ward 07)', lat: 6.904, lon: 79.871 },
  { name: 'Grandpass Kelani Bank (Ward 10)', lat: 6.945, lon: 79.876 },
  { name: 'Peradeniya Junction (Kandy)', lat: 7.271, lon: 80.601 },
];

export const SafeRoutePlanner: React.FC<SafeRoutePlannerProps> = ({
  shelters = [],
  currentLocation,
  onRouteCalculated,
  rerouteTrigger,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Origin Coordinates
  const [originLat, setOriginLat] = useState<number>(currentLocation?.latitude || 6.879);
  const [originLon, setOriginLon] = useState<number>(currentLocation?.longitude || 79.866);
  const [originName, setOriginName] = useState<string>('My Location / Havelock');

  // Destination Coordinates
  const [destLat, setDestLat] = useState<number>(6.904);
  const [destLon, setDestLon] = useState<number>(79.862);
  const [destName, setDestName] = useState<string>('Royal College Pavilion Shelter');

  // Calculated Results
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [routeResult, setRouteResult] = useState<any | null>(null);
  const [alertBanner, setAlertBanner] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync with currentLocation prop when updated
  useEffect(() => {
    if (currentLocation) {
      setOriginLat(currentLocation.latitude);
      setOriginLon(currentLocation.longitude);
      setOriginName('Current GPS Beacon');
    }
  }, [currentLocation?.latitude, currentLocation?.longitude]);

  // Safe Route Calculation
  const calculateSafeRoute = async (oLat = originLat, oLon = originLon, dLat = destLat, dLon = destLon) => {
    setIsCalculating(true);
    setErrorMessage(null);
    try {
      const res = await api.post('/api/incidents/routes/safe-path', {
        origin: { latitude: oLat, longitude: oLon },
        destination: { latitude: dLat, longitude: dLon },
      });

      const data = res.data?.data;
      if (data && data.path) {
        const polylineCoords: [number, number][] = data.path.map((pt: any) => [pt.latitude, pt.longitude]);
        const avoided = data.avoidedClosedRoads || data.avoided_roads || [];
        const isRerouted = avoided.length > 0;
        const distance = data.distanceKm || data.safe_distance_km || 0;

        setRouteResult({
          path: data.path,
          distanceKm: distance,
          avoidedRoads: avoided,
          isRerouted,
        });

        onRouteCalculated({
          coordinates: polylineCoords,
          avoidedRoads: avoided,
          distanceKm: distance,
          isRerouted,
        });

        if (isRerouted && avoided.length > 0) {
          setAlertBanner(`Safe detour active: Bypassing closed road (${avoided[0].name})`);
        } else {
          setAlertBanner(null);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not calculate safe route');
    } finally {
      setIsCalculating(false);
    }
  };

  // Re-run route when external socket road closure arrives
  useEffect(() => {
    if (rerouteTrigger && routeResult) {
      setAlertBanner('⚠️ Road closure event received! Recalculating safe detour corridor...');
      calculateSafeRoute();
    }
  }, [rerouteTrigger]);

  // One-Click "Evacuate to Nearest Safe Shelter" (ADR-011 & ADR-014)
  const handleEvacuateToNearestShelter = async () => {
    setIsCalculating(true);
    setErrorMessage(null);
    try {
      const res = await api.post('/api/relief/match-shelter', {
        latitude: originLat,
        longitude: originLon,
        people_count: 1,
        auto_reserve: false,
      });

      const matched = res.data?.data;
      if (matched && matched.shelter) {
        const s = matched.shelter;
        setDestLat(s.latitude);
        setDestLon(s.longitude);
        setDestName(`${s.name} (${matched.distance_km?.toFixed(1)} km)`);
        await calculateSafeRoute(originLat, originLon, s.latitude, s.longitude);
      } else if (shelters.length > 0) {
        // Fallback to first available shelter
        const s = shelters[0];
        setDestLat(s.latitude);
        setDestLon(s.longitude);
        setDestName(s.name);
        await calculateSafeRoute(originLat, originLon, s.latitude, s.longitude);
      }
    } catch (err: any) {
      // If endpoint fails, pick first seeded shelter
      if (shelters.length > 0) {
        const s = shelters[0];
        setDestLat(s.latitude);
        setDestLon(s.longitude);
        setDestName(s.name);
        await calculateSafeRoute(originLat, originLon, s.latitude, s.longitude);
      } else {
        setErrorMessage('No active relief shelters found within range.');
      }
    } finally {
      setIsCalculating(false);
    }
  };

  const clearRoute = () => {
    setRouteResult(null);
    setAlertBanner(null);
    onRouteCalculated(null);
  };

  return (
    <div className="absolute top-4 right-4 z-[1000] w-full max-w-sm rounded-2xl bg-dark-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-md overflow-hidden text-xs transition-all pointer-events-auto">
      {/* Header Bar */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-dark-850/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-xs flex items-center gap-1.5">
              Safe Evacuation Corridor
              <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                ADR-014
              </span>
            </h3>
            <p className="text-[10px] text-slate-400">Routes dynamically around submerged roads</p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Alert Banner for Detours */}
      {alertBanner && (
        <div className="px-3.5 py-2 bg-orange-500/15 border-b border-orange-500/30 text-orange-300 flex items-center gap-2 text-[11px] font-semibold animate-pulse">
          <AlertTriangle className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
          <span>{alertBanner}</span>
        </div>
      )}

      {errorMessage && (
        <div className="px-3.5 py-2 bg-red-500/15 border-b border-red-500/30 text-red-300 flex items-center gap-2 text-[11px]">
          <ShieldAlert className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {isExpanded && (
        <div className="p-3.5 space-y-3.5">
          {/* Quick Action: Evacuate to Nearest Shelter */}
          <button
            type="button"
            onClick={handleEvacuateToNearestShelter}
            disabled={isCalculating}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all border border-emerald-400 text-xs"
          >
            <Home className="w-4 h-4" />
            <span>Evacuate to Nearest Safe Shelter</span>
          </button>

          {/* Origin Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Start / Origin:
              </span>
              <span className="text-slate-300 font-mono text-[10px]">
                {originLat.toFixed(4)}, {originLon.toFixed(4)}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-dark-800 border border-slate-700 text-white font-medium text-xs">
              {originName}
            </div>

            {/* Quick Origin Presets */}
            <div className="flex flex-wrap gap-1 pt-1">
              {ORIGIN_PRESETS.slice(0, 3).map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => {
                    setOriginLat(p.lat);
                    setOriginLon(p.lon);
                    setOriginName(p.name);
                  }}
                  className="px-2 py-0.5 rounded bg-dark-800 hover:bg-dark-750 text-slate-400 hover:text-slate-200 border border-slate-700/60 text-[10px] transition-colors"
                >
                  {p.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Destination Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span> Destination / Shelter:
              </span>
              <span className="text-slate-300 font-mono text-[10px]">
                {destLat.toFixed(4)}, {destLon.toFixed(4)}
              </span>
            </div>

            {shelters.length > 0 ? (
              <select
                value={`${destLat},${destLon}`}
                onChange={(e) => {
                  const [lat, lon] = e.target.value.split(',').map(Number);
                  const selected = shelters.find((s) => s.latitude === lat && s.longitude === lon);
                  setDestLat(lat);
                  setDestLon(lon);
                  setDestName(selected?.name || 'Selected Shelter');
                }}
                className="w-full p-2 rounded-xl bg-dark-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
              >
                {shelters.map((s) => (
                  <option key={s.id} value={`${s.latitude},${s.longitude}`}>
                    🏠 {s.name} ({s.capacity - (s.current_occupancy || 0)} beds)
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-2 rounded-xl bg-dark-800 border border-slate-700 text-white font-medium text-xs">
                {destName}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => calculateSafeRoute()}
              disabled={isCalculating}
              className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-cyan-600/30"
            >
              {isCalculating ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Navigation className="w-3.5 h-3.5" />
              )}
              <span>Calculate Safe Detour</span>
            </button>

            {routeResult && (
              <button
                type="button"
                onClick={clearRoute}
                className="px-3 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-400 hover:text-white border border-slate-700 transition-colors"
                title="Clear route"
              >
                Clear
              </button>
            )}
          </div>

          {/* Route Summary Card */}
          {routeResult && (
            <div className="p-3 rounded-xl bg-dark-800/90 border border-slate-700 space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold text-white">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Passable Corridor</span>
                </div>
                <span className="text-cyan-400 font-extrabold text-sm font-mono">
                  {routeResult.distanceKm} km
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Car: ~{Math.round((routeResult.distanceKm / 30) * 60)} min</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Foot: ~{Math.round((routeResult.distanceKm / 4.5) * 60)} min</span>
                </div>
              </div>

              {/* Avoided Closed Roads List */}
              {routeResult.avoidedRoads && routeResult.avoidedRoads.length > 0 && (
                <div className="pt-2 border-t border-slate-700/60 space-y-1">
                  <div className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">
                    Avoided Closed Hazards:
                  </div>
                  {routeResult.avoidedRoads.map((r: any) => (
                    <div
                      key={r.id || r.name}
                      className="text-[10px] text-slate-300 flex items-center gap-1 bg-red-950/40 p-1 rounded border border-red-800/40"
                    >
                      <span className="text-red-400">⛔</span>
                      <span className="truncate">{r.name}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Step-by-Step Waypoint Preview */}
              {routeResult.path && routeResult.path.length > 0 && (
                <div className="pt-2 border-t border-slate-700/60 space-y-1 text-[10px]">
                  <div className="text-slate-400 font-semibold">Waypoint Itinerary:</div>
                  <div className="space-y-0.5 text-slate-300 font-mono">
                    {routeResult.path.map((step: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-1">
                        <span className="text-cyan-400">{idx + 1}.</span>
                        <span>{step.name || `Waypoint (${step.latitude.toFixed(3)}, ${step.longitude.toFixed(3)})`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
