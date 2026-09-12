import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Home,
  Users,
  Package,
  Plus,
  Minus,
  Navigation,
  AlertOctagon,
  LifeBuoy,
  HeartPulse,
  Utensils,
  Droplets,
  Layers,
} from 'lucide-react';
import { getMapTileConfig } from '../../utils/mapConfig';

export interface ShelterNetworkMapProps {
  shelters: any[];
  requests: any[];
  resources: any[];
  selectedShelterId: string | null;
  selectedRequestId: string | null;
  onSelectShelter: (id: string) => void;
  onSelectRequest: (id: string) => void;
  onUpdateOccupancy: (shelterId: string, newOccupancy: number) => void;
  onOpenMatcherWithRequest?: (req: any) => void;
  onOpenSuppliesForShelter?: (shelter: any) => void;
}

// Custom Marker for Shelters with Live Circular Bed Gauge
const createShelterGaugeIcon = (shelter: any, isSelected: boolean) => {
  const capacity = shelter.capacity || 100;
  const occupancy = shelter.current_occupancy || 0;
  const availableBeds = Math.max(0, capacity - occupancy);
  const ratio = Math.min(1, Math.max(0, occupancy / capacity));
  const percent = Math.round(ratio * 100);

  // Determine color based on saturation threshold
  let color = '#10b981'; // Emerald (< 60%)
  let statusLabel = 'AVAILABLE';
  if (percent >= 85 || availableBeds < 10) {
    color = '#ef4444'; // Red (Critical saturation)
    statusLabel = 'CRITICAL';
  } else if (percent >= 60) {
    color = '#f59e0b'; // Amber (Moderate / filling up)
    statusLabel = 'FILLING';
  }

  const selectedRing = isSelected
    ? `box-shadow: 0 0 0 4px #38bdf8, 0 0 25px rgba(56, 189, 248, 0.9); transform: scale(1.18);`
    : `box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);`;

  return L.divIcon({
    className: 'shelter-gauge-icon',
    html: `
      <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; ${selectedRing} border-radius: 50%; transition: all 0.2s ease;">
        <!-- Background Donut Ring -->
        <svg style="position: absolute; width: 44px; height: 44px; transform: rotate(-90deg);" viewBox="0 0 36 36">
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="#0f172a"
            stroke="#334155"
            stroke-width="3.5"
          />
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="${color}"
            stroke-width="3.5"
            stroke-dasharray="${percent}, 100"
          />
        </svg>

        <!-- Center Badge Content -->
        <div style="z-index: 2; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <span style="font-size: 13px; font-weight: 900; color: #ffffff; line-height: 1;">${availableBeds}</span>
          <span style="font-size: 8px; font-weight: 700; color: ${color}; text-transform: uppercase; letter-spacing: -0.5px;">BEDS</span>
        </div>

        <!-- Mini Top Indicator Tag -->
        <div style="position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); background: #020617; border: 1px solid ${color}; border-radius: 4px; padding: 0 4px; font-size: 8px; font-weight: 800; color: #f8fafc; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.5);">
          ${percent}%
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  });
};

// Custom Marker for Citizen SOS Distress Calls
const createSosDistressIcon = (req: any, isSelected: boolean) => {
  const isP1 = req.urgency === 'CRITICAL' || req.urgency === 'P1';
  const isP2 = req.urgency === 'HIGH' || req.urgency === 'P2';
  const color = isP1 ? '#ef4444' : isP2 ? '#f97316' : '#38bdf8';
  const symbol = isP1 ? '🚨' : isP2 ? '⚠️' : '🆘';

  const pulseRing = isP1
    ? `<div style="position: absolute; width: 42px; height: 42px; border-radius: 50%; background: #ef4444; opacity: 0.4; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
    : '';

  const selectedBorder = isSelected
    ? 'border: 3px solid #38bdf8; box-shadow: 0 0 20px rgba(56, 189, 248, 0.9); transform: scale(1.2);'
    : 'border: 2px solid #ffffff; box-shadow: 0 4px 8px rgba(0,0,0,0.6);';

  return L.divIcon({
    className: 'sos-distress-icon',
    html: `
      <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
        ${pulseRing}
        <div style="position: relative; z-index: 2; width: 30px; height: 30px; border-radius: 50%; background: ${color}; display: flex; align-items: center; justify-content: center; ${selectedBorder} transition: all 0.2s ease;">
          <span style="font-size: 13px;">${symbol}</span>
        </div>
        <div style="position: absolute; top: -6px; right: -6px; z-index: 3; background: #0f172a; border: 1px solid #475569; border-radius: 8px; padding: 0 3px; font-size: 8px; font-weight: 800; color: #ffffff;">
          ${req.people_count || 1}P
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -17],
  });
};

// Map Pan Controller for focusing selected items smoothly
const MapFocusController: React.FC<{ targetCoords: [number, number] | null }> = ({ targetCoords }) => {
  const map = useMap();
  useEffect(() => {
    if (targetCoords && targetCoords[0] && targetCoords[1]) {
      map.flyTo(targetCoords, Math.max(map.getZoom(), 15), { duration: 1.2 });
    }
  }, [targetCoords, map]);
  return null;
};

export const ShelterNetworkMap: React.FC<ShelterNetworkMapProps> = ({
  shelters,
  requests,
  resources,
  selectedShelterId,
  selectedRequestId,
  onSelectShelter,
  onSelectRequest,
  onUpdateOccupancy,
  onOpenMatcherWithRequest,
  onOpenSuppliesForShelter,
}) => {
  const mapConfig = getMapTileConfig();
  const defaultCenter: [number, number] = [6.9050, 79.8680]; // Colombo center

  const selectedRequest = requests.find((r) => r.id === selectedRequestId);
  const selectedShelter = shelters.find((s) => s.id === selectedShelterId);

  // Target coordinates to pan map to
  const focusCoords: [number, number] | null = selectedRequest?.latitude && selectedRequest?.longitude
    ? [Number(selectedRequest.latitude), Number(selectedRequest.longitude)]
    : selectedShelter?.latitude && selectedShelter?.longitude
    ? [Number(selectedShelter.latitude), Number(selectedShelter.longitude)]
    : null;

  // Calculate proximity vector line from selected SOS to candidate shelters
  let proximityVectorLine: [number, number][] | null = null;
  let nearestShelterName: string | null = null;
  let vectorDistanceKm: number | null = null;

  if (selectedRequest?.latitude && selectedRequest?.longitude) {
    const pCount = selectedRequest.people_count || 1;
    // Find qualifying shelters
    const qualifying = shelters
      .filter((s) => s.latitude && s.longitude && (s.capacity - s.current_occupancy) >= pCount)
      .map((s) => {
        const dLat = (s.latitude - selectedRequest.latitude) * (Math.PI / 180);
        const dLon = (s.longitude - selectedRequest.longitude) * (Math.PI / 180);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(selectedRequest.latitude * (Math.PI / 180)) *
            Math.cos(s.latitude * (Math.PI / 180)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const d = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return { shelter: s, dist: d };
      })
      .sort((a, b) => a.dist - b.dist);

    if (qualifying.length > 0) {
      const top = qualifying[0];
      proximityVectorLine = [
        [Number(selectedRequest.latitude), Number(selectedRequest.longitude)],
        [Number(top.shelter.latitude), Number(top.shelter.longitude)],
      ];
      nearestShelterName = top.shelter.name;
      vectorDistanceKm = parseFloat(top.dist.toFixed(2));
    }
  }

  return (
    <div className="relative w-full h-full min-h-[480px] rounded-xl overflow-hidden border border-slate-800 bg-dark-950 flex flex-col">
      {/* Top Map Status Overlay Header */}
      <div className="absolute top-3 left-3 z-[1000] bg-dark-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700/80 shadow-2xl flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></div>
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Shelter Network Telemetry
          </span>
        </div>
        <span className="text-slate-600">|</span>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-300 flex items-center gap-1">
            <Home className="w-3.5 h-3.5 text-emerald-400" />
            <strong className="text-white">{shelters.length}</strong> Shelters
          </span>
          <span className="text-slate-300 flex items-center gap-1">
            <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
            <strong className="text-white">{requests.filter((r) => r.status === 'PENDING').length}</strong> Active SOS
          </span>
        </div>
      </div>

      {/* Map Proximity Vector Indicator Banner */}
      {proximityVectorLine && selectedRequest && nearestShelterName && (
        <div className="absolute top-3 right-3 z-[1000] bg-dark-900/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-sky-500/50 shadow-2xl flex items-center gap-2.5 text-xs text-sky-200">
          <Navigation className="w-4 h-4 text-sky-400 animate-bounce" />
          <div>
            <div className="font-bold text-white flex items-center gap-1.5">
              <span>Proximity Route Vector Active</span>
              <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono text-[10px] border border-sky-500/30">
                {vectorDistanceKm} km
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Matched to <strong>{nearestShelterName}</strong> (~{Math.round((vectorDistanceKm! / 30) * 60) + 5} min travel)
            </p>
          </div>
        </div>
      )}

      {/* Leaflet Map Canvas */}
      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        <TileLayer url={mapConfig.url} attribution={mapConfig.attribution} maxZoom={mapConfig.maxZoom || 18} />
        <MapFocusController targetCoords={focusCoords} />

        {/* Proximity Vector Polyline */}
        {proximityVectorLine && (
          <Polyline
            positions={proximityVectorLine}
            pathOptions={{
              color: '#38bdf8',
              weight: 3.5,
              dashArray: '8, 8',
              opacity: 0.9,
            }}
          />
        )}

        {/* Shelter Markers */}
        {shelters.map((shelter) => {
          if (!shelter.latitude || !shelter.longitude) return null;
          const isSelected = selectedShelterId === shelter.id;
          const capacity = shelter.capacity || 100;
          const occupancy = shelter.current_occupancy || 0;
          const availableBeds = Math.max(0, capacity - occupancy);
          const percent = Math.round((occupancy / capacity) * 100);

          // Get resources at this shelter
          const shelterRes = resources.filter((r) => r.shelter_id === shelter.id && r.status === 'AVAILABLE');

          return (
            <Marker
              key={shelter.id}
              position={[Number(shelter.latitude), Number(shelter.longitude)]}
              icon={createShelterGaugeIcon(shelter, isSelected)}
              eventHandlers={{
                click: () => onSelectShelter(shelter.id),
              }}
            >
              <Popup className="shelter-map-popup">
                <div className="p-2 space-y-3 min-w-[260px] text-slate-100">
                  {/* Header */}
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                        <Home className="w-3 h-3" />
                        <span>Emergency Shelter Center</span>
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          percent >= 85
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : percent >= 60
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {percent}% Occupied
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white mt-1">{shelter.name}</h3>
                    <p className="text-[11px] text-slate-400">{shelter.address || shelter.ward_name || 'Colombo Sector'}</p>
                  </div>

                  {/* Bed Capacity Gauge Bar */}
                  <div className="p-2.5 rounded-lg bg-dark-900 border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Available Bed Capacity:</span>
                      <strong className="text-white">
                        {availableBeds} / {capacity} Beds
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

                    {/* Inline Manual Occupancy Adjuster */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
                      <span className="text-slate-400">Manual Headcount:</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onUpdateOccupancy(shelter.id, Math.max(0, occupancy - 1))}
                          className="p-1 rounded bg-dark-800 hover:bg-dark-700 text-slate-300 hover:text-white border border-slate-700"
                          title="Decrement Occupancy (-1)"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono font-bold text-white px-1">{occupancy}</span>
                        <button
                          onClick={() => onUpdateOccupancy(shelter.id, Math.min(capacity, occupancy + 1))}
                          className="p-1 rounded bg-dark-800 hover:bg-dark-700 text-slate-300 hover:text-white border border-slate-700"
                          title="Increment Occupancy (+1)"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Warehouse Resources at this Center */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Package className="w-3 h-3 text-brand-400" />
                      <span>On-Site Emergency Inventory</span>
                    </span>
                    {shelterRes.length === 0 ? (
                      <p className="text-[10px] text-slate-500 italic">No warehouse stock currently registered.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                        {shelterRes.slice(0, 4).map((r) => (
                          <div
                            key={r.id}
                            className="p-1.5 rounded bg-dark-950/80 border border-slate-800 flex justify-between items-center"
                          >
                            <span className="text-slate-300 truncate">{r.resource_name}</span>
                            <strong className="text-brand-400 ml-1">
                              {r.quantity} {r.unit}
                            </strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions in Popup */}
                  {onOpenSuppliesForShelter && (
                    <button
                      onClick={() => onOpenSuppliesForShelter(shelter)}
                      className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-all border border-emerald-400"
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>Manage Warehouse Supplies</span>
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Citizen SOS Distress Markers */}
        {requests.map((req) => {
          if (!req.latitude || !req.longitude) return null;
          const isSelected = selectedRequestId === req.id;

          return (
            <Marker
              key={req.id}
              position={[Number(req.latitude), Number(req.longitude)]}
              icon={createSosDistressIcon(req, isSelected)}
              eventHandlers={{
                click: () => onSelectRequest(req.id),
              }}
            >
              <Popup className="sos-map-popup">
                <div className="p-2 space-y-2 min-w-[220px] text-slate-100">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-extrabold uppercase text-red-400 flex items-center gap-1">
                      <AlertOctagon className="w-3 h-3" />
                      <span>SOS Distress Call</span>
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                      {req.urgency}
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 font-medium leading-relaxed">
                    {req.description || 'Emergency SOS assistance required.'}
                  </p>

                  <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-brand-400" />
                      <span>{req.people_count} {req.people_count === 1 ? 'Person' : 'People'}</span>
                    </span>
                    <span className="font-semibold text-slate-300">{req.help_type}</span>
                  </div>

                  {onOpenMatcherWithRequest && (
                    <button
                      onClick={() => onOpenMatcherWithRequest(req)}
                      className="w-full py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-all border border-sky-400 mt-1"
                    >
                      <Home className="w-3.5 h-3.5" />
                      <span>Find Nearest Qualified Shelter</span>
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map Bottom-Right Legend */}
      <div className="absolute bottom-3 right-3 z-[1000] bg-dark-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 text-[10px] space-y-1.5 text-slate-300 shadow-xl">
        <div className="font-bold text-white uppercase tracking-wider flex items-center gap-1">
          <Layers className="w-3 h-3 text-brand-400" />
          <span>Shelter Occupancy Gauges</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>&lt; 60% (Plentiful Beds)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span>60% - 85% (Moderate Load)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
          <span>&gt; 85% (Critical Saturation)</span>
        </div>
        <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
          <span>🚨 Active SOS Pinpoint</span>
        </div>
      </div>
    </div>
  );
};
