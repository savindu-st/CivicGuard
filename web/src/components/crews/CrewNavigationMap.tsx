import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { getMapTileConfig } from '../../utils/mapConfig';

interface CrewNavMapProps {
  crewLat: number;
  crewLon: number;
  crewName?: string;
  targetLat?: number;
  targetLon?: number;
  targetTitle?: string;
  hazardType?: string;
  onRerouteEvent?: boolean;
}

// Custom Leaflet Icons
const crewIcon = L.divIcon({
  className: 'crew-pin',
  html: `
    <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: rgba(5, 150, 105, 0.3); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="width: 22px; height: 22px; border-radius: 50%; background: #059669; border: 2.5px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.18); display: flex; align-items: center; justify-content: center;">
        <span style="width: 6px; height: 6px; border-radius: 50%; background: white;"></span>
      </div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const incidentIcon = L.divIcon({
  className: 'incident-pin',
  html: `
    <div style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
      <div style="width: 26px; height: 26px; border-radius: 50%; background: #dc2626; border: 2.5px solid #ffffff; box-shadow: 0 2px 8px rgba(220,38,38,0.35); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 13px;">
        !
      </div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const closedRoadIcon = L.divIcon({
  className: 'closed-road-pin',
  html: `
    <div style="width: 24px; height: 24px; border-radius: 4px; background: #dc2626; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: 800;">
      ✕
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Helper component to smoothly fit map view to route bounds
const MapBoundsAdjuster: React.FC<{ bounds: [number, number][] }> = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    }
  }, [bounds, map]);
  return null;
};

export const CrewNavigationMap: React.FC<CrewNavMapProps> = ({
  crewLat,
  crewLon,
  crewName = 'Field Rescue Unit',
  targetLat,
  targetLon,
  targetTitle = 'Assigned Incident',
  hazardType = 'Flood Hazard',
  onRerouteEvent = false,
}) => {
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [avoidedRoads, setAvoidedRoads] = useState<any[]>([]);
  const [isRerouted, setIsRerouted] = useState<boolean>(false);
  const [routeDistanceKm, setRouteDistanceKm] = useState<number | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState<boolean>(false);
  const [rerouteAlert, setRerouteAlert] = useState<string | null>(null);
  const tileConfig = getMapTileConfig();

  const fetchSafeDetour = async () => {
    if (!targetLat || !targetLon) return;

    setIsCalculatingRoute(true);
    try {
      const res = await api.post('/api/incidents/routes/safe-path', {
        origin: { latitude: crewLat, longitude: crewLon },
        destination: { latitude: targetLat, longitude: targetLon },
      });

      const data = res.data?.data;
      if (data?.path && data.path.length > 0) {
        const polylineCoords: [number, number][] = data.path.map((pt: any) => [pt.latitude, pt.longitude]);
        setRouteCoordinates(polylineCoords);
        setAvoidedRoads(data.avoided_roads || []);
        setIsRerouted(data.is_rerouted || false);
        setRouteDistanceKm(data.safe_distance_km || data.direct_distance_km);

        if (data.is_rerouted && data.avoided_roads?.length > 0) {
          setRerouteAlert(`Safe Detour: Avoiding closed road (${data.avoided_roads[0].name})`);
        } else {
          setRerouteAlert(null);
        }
      } else {
        // Direct straight line fallback
        setRouteCoordinates([
          [crewLat, crewLon],
          [targetLat, targetLon],
        ]);
      }
    } catch (e) {
      // Straight line fallback
      setRouteCoordinates([
        [crewLat, crewLon],
        [targetLat, targetLon],
      ]);
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  useEffect(() => {
    fetchSafeDetour();
  }, [crewLat, crewLon, targetLat, targetLon, onRerouteEvent]);

  const mapCenter: [number, number] = [crewLat || 6.879, crewLon || 79.866];
  const bounds: [number, number][] = targetLat && targetLon
    ? [
        [crewLat, crewLon],
        [targetLat, targetLon],
      ]
    : [[crewLat, crewLon]];

  return (
    <div className="relative w-full h-[360px] md:h-[420px] rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
      {/* Route Info Overlay Banner */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap gap-2 items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          {isRerouted ? (
            <div className="px-3 py-1.5 rounded-lg bg-amber-500 text-white backdrop-blur-md shadow-sm flex items-center gap-1.5 text-xs font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Safe Detour Active</span>
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-lg bg-white/95 text-emerald-700 border border-emerald-200 backdrop-blur-md shadow-sm flex items-center gap-1.5 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Clear Passage ({routeDistanceKm ? `${routeDistanceKm.toFixed(1)} km` : 'Direct'})</span>
            </div>
          )}

          {rerouteAlert && (
            <div className="hidden sm:flex px-3 py-1.5 rounded-lg bg-white/95 text-slate-700 border border-slate-200 backdrop-blur-md text-[11px] shadow-sm">
              {rerouteAlert}
            </div>
          )}
        </div>

        <button
          onClick={fetchSafeDetour}
          disabled={isCalculatingRoute}
          className="pointer-events-auto p-2 rounded-lg bg-white/95 text-slate-700 hover:text-slate-900 border border-slate-200 shadow-sm backdrop-blur-md hover:bg-slate-50 text-xs flex items-center gap-1"
          title="Recalculate Safe Detour"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isCalculatingRoute ? 'animate-spin text-brand-600' : ''}`} />
          <span className="hidden xs:inline">Recalculate</span>
        </button>
      </div>

      <MapContainer
        center={mapCenter}
        zoom={14}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution={tileConfig.attribution}
          url={tileConfig.url}
          maxZoom={tileConfig.maxZoom || 19}
        />

        <MapBoundsAdjuster bounds={bounds} />

        {/* Crew Current Location Pin */}
        <Marker position={[crewLat, crewLon]} icon={crewIcon}>
          <Popup>
            <div className="p-1 text-xs">
              <div className="font-bold text-emerald-700 flex items-center gap-1">
                <Navigation className="w-3 h-3" /> {crewName}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Coordinates: {crewLat.toFixed(5)}, {crewLon.toFixed(5)}
              </p>
            </div>
          </Popup>
        </Marker>

        {/* Target Incident Pin */}
        {targetLat && targetLon && (
          <Marker position={[targetLat, targetLon]} icon={incidentIcon}>
            <Popup>
              <div className="p-1 text-xs">
                <div className="font-bold text-red-600">{hazardType.replace(/_/g, ' ')}</div>
                <p className="text-[11px] text-slate-800 font-medium mt-0.5">{targetTitle}</p>
                <p className="text-[10px] text-slate-500 mt-1">Resolution photo required upon clearance</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Avoided Closed Roads Markers */}
        {avoidedRoads.map((road) => (
          <Marker key={road.id} position={[road.latitude, road.longitude]} icon={closedRoadIcon}>
            <Popup>
              <div className="p-1 text-xs">
                <span className="badge-critical text-[10px]">ROAD CLOSED</span>
                <p className="font-semibold text-slate-900 mt-1">{road.name}</p>
                <p className="text-[10px] text-slate-500">Detour route navigated around this segment</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Safe Navigation Detour Polyline */}
        {routeCoordinates.length > 1 && (
          <Polyline
            positions={routeCoordinates}
            pathOptions={{
              color: isRerouted ? '#f59e0b' : '#059669',
              weight: 5,
              opacity: 0.85,
              dashArray: isRerouted ? '8, 8' : undefined,
            }}
          />
        )}
      </MapContainer>
    </div>
  );
};
