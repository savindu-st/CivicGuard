import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Home,
  Navigation,
  ThumbsUp,
  ThumbsDown,
  Waves,
  TreePine,
  Car,
  Mountain,
  Info,
  ExternalLink,
} from 'lucide-react';
import { getMapTileConfig } from '../../utils/mapConfig';

export interface PublicHazardMapProps {
  hazards: any[];
  closedRoads: any[];
  shelters?: any[];
  selectedHazardId: string | null;
  onSelectHazard: (id: string) => void;
  // Pin-Drop Mode for Reporting
  isPinDropMode?: boolean;
  pinDropLocation?: { latitude: number; longitude: number } | null;
  onPinDrop?: (coords: { latitude: number; longitude: number }) => void;
  // Safe Route Polyline & Avoided Hazards
  routeCoordinates?: [number, number][];
  avoidedClosedRoads?: any[];
  isRerouted?: boolean;
  // Corroboration Action
  onCorroborate?: (hazardId: string, vote: 'CONFIRM' | 'REFUTE') => Promise<void>;
  // Layer Toggles
  showPerimeters?: boolean;
  showClosedRoads?: boolean;
  showShelters?: boolean;
}

// Icon Generators
const getHazardDetails = (type: string) => {
  switch (type) {
    case 'FLOOD':
      return { icon: '🌊', label: 'Flood Inundation', color: '#0ea5e9' };
    case 'FALLEN_TREE':
      return { icon: '🌲', label: 'Fallen Tree / Debris', color: '#10b981' };
    case 'ROAD_DAMAGE':
      return { icon: '🚧', label: 'Road Damage / Cave-In', color: '#f59e0b' };
    case 'LANDSLIDE':
      return { icon: '⛰️', label: 'Landslide Hazard', color: '#ef4444' };
    default:
      return { icon: '⚠️', label: 'Hazard Warning', color: '#f59e0b' };
  }
};

const createHazardIcon = (type: string, severity: string, isSelected: boolean) => {
  const { icon } = getHazardDetails(type);
  let ringColor = '#f59e0b';
  let pulseAnim = 'animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;';

  if (severity === 'CRITICAL') {
    ringColor = '#ef4444';
  } else if (severity === 'HIGH') {
    ringColor = '#f97316';
  } else if (severity === 'LOW') {
    ringColor = '#3b82f6';
    pulseAnim = '';
  }

  const selectedBorder = isSelected
    ? 'box-shadow: 0 0 0 3px #0284c7, 0 0 15px rgba(2, 132, 199, 0.4); transform: scale(1.15);'
    : 'box-shadow: 0 2px 8px rgba(0,0,0,0.15);';

  return L.divIcon({
    className: 'public-hazard-pin',
    html: `
      <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: ${ringColor}; opacity: 0.25; ${pulseAnim}"></div>
        <div style="width: 28px; height: 28px; border-radius: 50%; background: #ffffff; border: 2.5px solid ${ringColor}; ${selectedBorder} display: flex; align-items: center; justify-content: center; font-size: 14px; transition: all 0.2s;">
          ${icon}
        </div>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -20],
  });
};

const createClosedRoadIcon = () => {
  return L.divIcon({
    className: 'public-closed-road-pin',
    html: `
      <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
        <div style="width: 24px; height: 24px; border-radius: 6px; background: #ef4444; border: 2px solid #ffffff; box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4); display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 11px;">
          ⛔
        </div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -16],
  });
};

const createShelterIcon = (availableBeds: number) => {
  const isCrowded = availableBeds <= 20;
  const isComfortable = availableBeds > 80;
  const color = isComfortable ? '#10b981' : isCrowded ? '#ef4444' : '#f59e0b';

  return L.divIcon({
    className: 'public-shelter-pin',
    html: `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <div style="width: 26px; height: 26px; border-radius: 8px; background: #ffffff; border: 2px solid ${color}; box-shadow: 0 2px 8px rgba(0,0,0,0.15); display: flex; flex-direction: column; align-items: center; justify-content: center; color: ${color}; font-size: 11px;">
          <span style="font-size: 12px; line-height: 1;">🏠</span>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
};

const createPinDropIcon = () => {
  return L.divIcon({
    className: 'pin-drop-target-icon',
    html: `
      <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: #ef4444; opacity: 0.4; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="width: 32px; height: 32px; border-radius: 50%; background: #ef4444; border: 3px solid #ffffff; box-shadow: 0 0 20px rgba(239, 68, 68, 0.9); display: flex; align-items: center; justify-content: center; color: white; font-size: 16px; font-weight: bold;">
          📍
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  });
};

// Map Click Listener for Interactive Pin-Drop
const MapClickPinDropHandler: React.FC<{
  isPinDropMode?: boolean;
  onPinDrop?: (coords: { latitude: number; longitude: number }) => void;
}> = ({ isPinDropMode, onPinDrop }) => {
  useMapEvents({
    click(e) {
      if (isPinDropMode && onPinDrop) {
        onPinDrop({ latitude: e.latlng.lat, longitude: e.latlng.lng });
      }
    },
  });
  return null;
};

// Camera Controller to Pan to Selected Items
const MapPanController: React.FC<{
  selectedHazard: any;
  pinDropLocation?: { latitude: number; longitude: number } | null;
}> = ({ selectedHazard, pinDropLocation }) => {
  const map = useMap();

  useEffect(() => {
    if (pinDropLocation) {
      map.flyTo([pinDropLocation.latitude, pinDropLocation.longitude], 16, { duration: 1.2 });
    } else if (selectedHazard?.latitude && selectedHazard?.longitude) {
      map.flyTo([selectedHazard.latitude, selectedHazard.longitude], 16, { duration: 1.2 });
    }
  }, [selectedHazard?.id, pinDropLocation?.latitude, pinDropLocation?.longitude, map]);

  return null;
};

// Dynamic Route Auto-Fit Controller
const RouteBoundsAdjuster: React.FC<{ coordinates: [number, number][] }> = ({ coordinates }) => {
  const map = useMap();
  useEffect(() => {
    if (coordinates && coordinates.length > 1) {
      map.fitBounds(coordinates, { padding: [50, 50], maxZoom: 16 });
    }
  }, [coordinates, map]);
  return null;
};

export const PublicHazardMap: React.FC<PublicHazardMapProps> = ({
  hazards,
  closedRoads,
  shelters = [],
  selectedHazardId,
  onSelectHazard,
  isPinDropMode = false,
  pinDropLocation = null,
  onPinDrop,
  routeCoordinates = [],
  avoidedClosedRoads = [],
  isRerouted = false,
  onCorroborate,
  showPerimeters = true,
  showClosedRoads = true,
  showShelters = true,
}) => {
  const tileConfig = getMapTileConfig();
  const selectedHazard = hazards.find((h) => h.id === selectedHazardId);

  // Default Center: Colombo 05 / Havelock Town Corridor
  const defaultCenter: [number, number] = [6.883, 79.865];

  // Helper to determine perimeter radius (in meters) and color based on severity
  const getPerimeterConfig = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return { radius: 350, color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.22 };
      case 'HIGH':
        return { radius: 250, color: '#f97316', fillColor: '#f97316', fillOpacity: 0.18 };
      case 'MEDIUM':
        return { radius: 180, color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.15 };
      default:
        return { radius: 120, color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.12 };
    }
  };

  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden rounded-2xl border border-slate-700/60 bg-dark-950 shadow-2xl">
      {/* Pin-Drop Active Banner Mode */}
      {isPinDropMode && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] px-4 py-2 rounded-xl bg-red-600/95 text-white border border-red-400 shadow-2xl backdrop-blur-md flex items-center gap-2.5 text-xs font-bold animate-bounce pointer-events-auto">
          <MapPin className="w-4 h-4 animate-pulse" />
          <span>Interactive Pin-Drop Active: Click anywhere on the map to mark the hazard!</span>
        </div>
      )}

      {/* Reroute Alert Banner */}
      {isRerouted && routeCoordinates.length > 0 && (
        <div className="absolute top-4 left-4 z-[1000] max-w-sm px-3.5 py-2 rounded-xl bg-dark-900/95 text-orange-300 border border-orange-500/40 shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs font-semibold pointer-events-auto">
          <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0 animate-pulse" />
          <div>
            <span className="font-bold text-white">Safe Detour Active:</span> Bypassing{' '}
            {avoidedClosedRoads.length > 0 ? avoidedClosedRoads[0].name : 'closed flood segment'}
          </div>
        </div>
      )}

      <MapContainer
        center={defaultCenter}
        zoom={14}
        scrollWheelZoom={true}
        className="w-full h-full z-0 cursor-crosshair"
      >
        <TileLayer
          attribution={tileConfig.attribution}
          url={tileConfig.url}
          maxZoom={tileConfig.maxZoom || 19}
        />

        <MapClickPinDropHandler isPinDropMode={isPinDropMode} onPinDrop={onPinDrop} />
        <MapPanController selectedHazard={selectedHazard} pinDropLocation={pinDropLocation} />
        {routeCoordinates.length > 1 && <RouteBoundsAdjuster coordinates={routeCoordinates} />}

        {/* 1. Dropped Pin Target Marker */}
        {pinDropLocation && (
          <Marker
            position={[pinDropLocation.latitude, pinDropLocation.longitude]}
            icon={createPinDropIcon()}
          >
            <Popup>
              <div className="p-2 space-y-1 text-xs">
                <div className="font-bold text-slate-900 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                  <span>Report Location Selected</span>
                </div>
                <div className="text-slate-600 font-mono text-[11px]">
                  {pinDropLocation.latitude.toFixed(5)}, {pinDropLocation.longitude.toFixed(5)}
                </div>
                <div className="text-[10px] text-emerald-600 font-semibold">Ready to submit in hazard report form</div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* 2. Live Hazard Perimeters & Markers */}
        {hazards.map((hazard) => {
          const isSelected = hazard.id === selectedHazardId;
          const { radius, color, fillColor, fillOpacity } = getPerimeterConfig(hazard.severity);
          const hazardMeta = getHazardDetails(hazard.incident_type);

          return (
            <React.Fragment key={`hazard-${hazard.id}`}>
              {/* Animated Danger Buffer Circle */}
              {showPerimeters && (
                <Circle
                  center={[hazard.latitude, hazard.longitude]}
                  radius={radius}
                  pathOptions={{
                    color,
                    fillColor,
                    fillOpacity: isSelected ? fillOpacity * 1.6 : fillOpacity,
                    weight: isSelected ? 2.5 : 1.5,
                    dashArray: isSelected ? undefined : '6, 6',
                  }}
                />
              )}

              {/* Pinpoint Hazard Marker */}
              <Marker
                position={[hazard.latitude, hazard.longitude]}
                icon={createHazardIcon(hazard.incident_type, hazard.severity, isSelected)}
                eventHandlers={{
                  click: () => onSelectHazard(hazard.id),
                }}
              >
                <Popup>
                  <div className="p-2.5 max-w-[260px] space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1.5">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                        <span>{hazardMeta.icon}</span>
                        <span>{hazardMeta.label}</span>
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          hazard.severity === 'CRITICAL'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : hazard.severity === 'HIGH'
                            ? 'bg-orange-50 text-orange-700 border border-orange-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {hazard.severity}
                      </span>
                    </div>

                    {hazard.evidence_url && (
                      <div className="relative rounded-lg overflow-hidden border border-slate-200 aspect-video bg-slate-100">
                        <img
                          src={hazard.evidence_url}
                          alt="Citizen evidence proof"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1 right-1 text-[9px] px-1.5 py-0.5 rounded bg-white/90 text-slate-700 font-semibold shadow-xs">
                          Verified Photo
                        </span>
                      </div>
                    )}

                    <div className="space-y-1 text-slate-600 text-[11px]">
                      {hazard.road_name && (
                        <div>
                          <span className="text-slate-500">Road:</span>{' '}
                          <span className="font-bold text-slate-900">{hazard.road_name}</span>
                        </div>
                      )}
                      {hazard.ward_name && (
                        <div>
                          <span className="text-slate-500">Ward:</span>{' '}
                          <span className="text-slate-700">{hazard.ward_name}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-500">Status:</span>{' '}
                        <span className="font-bold text-emerald-600">{hazard.status}</span>
                      </div>
                    </div>

                    {/* Community Corroboration Action (ADR-012) */}
                    {onCorroborate && (
                      <div className="pt-2 border-t border-slate-200 space-y-1.5">
                        <div className="text-[10px] text-slate-500 font-medium flex items-center justify-between">
                          <span>Citizen Corroboration:</span>
                          <span className="text-emerald-700 font-bold">Community Vote</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            onClick={() => onCorroborate(hazard.id, 'CONFIRM')}
                            className="py-1 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold text-[10px] flex items-center justify-center gap-1 transition-colors shadow-xs"
                          >
                            <ThumbsUp className="w-3 h-3" />
                            <span>Confirm</span>
                          </button>
                          <button
                            onClick={() => onCorroborate(hazard.id, 'REFUTE')}
                            className="py-1 px-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-semibold text-[10px] flex items-center justify-center gap-1 transition-colors shadow-xs"
                          >
                            <ThumbsDown className="w-3 h-3" />
                            <span>Refute</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}

        {/* 3. Closed Road Overlays & Barrier Markers */}
        {showClosedRoads &&
          closedRoads.map((road) => (
            <React.Fragment key={`road-${road.id}`}>
              <Circle
                center={[road.latitude, road.longitude]}
                radius={80}
                pathOptions={{
                  color: '#ef4444',
                  fillColor: '#ef4444',
                  fillOpacity: 0.3,
                  weight: 2,
                }}
              />
              <Marker position={[road.latitude, road.longitude]} icon={createClosedRoadIcon()}>
                <Popup>
                  <div className="p-2 space-y-1.5 text-xs max-w-[220px]">
                    <div className="flex items-center gap-1.5 text-red-600 font-black">
                      <AlertTriangle className="w-4 h-4" />
                      <span>ROAD CLOSED</span>
                    </div>
                    <div className="font-bold text-slate-900 text-sm">{road.name}</div>
                    {road.wards?.name && (
                      <div className="text-[11px] text-slate-500">{road.wards.name}</div>
                    )}
                    <div className="p-1.5 rounded bg-red-50 border border-red-200 text-[10px] text-red-700 leading-snug">
                      Closed by Municipal Council due to active flooding / debris. Detour routing enforced.
                    </div>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          ))}

        {/* 4. Emergency Relief Shelter Pins */}
        {showShelters &&
          shelters.map((shelter) => {
            const availableBeds = (shelter.capacity || 100) - (shelter.current_occupancy || 0);
            return (
              <Marker
                key={`shelter-${shelter.id}`}
                position={[shelter.latitude, shelter.longitude]}
                icon={createShelterIcon(availableBeds)}
              >
                <Popup>
                  <div className="p-2 space-y-1.5 text-xs max-w-[240px]">
                    <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                      <Home className="w-3.5 h-3.5" />
                      <span>Emergency Relief Shelter</span>
                    </div>
                    <div className="font-bold text-slate-900 text-sm">{shelter.name}</div>
                    <div className="text-[11px] text-slate-600">{shelter.address}</div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[11px]">
                      <span className="text-slate-500">Available Beds:</span>
                      <span className="font-extrabold text-emerald-700">
                        {availableBeds} / {shelter.capacity}
                      </span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* 5. Safe Detour Transit Corridor Polyline */}
        {routeCoordinates.length > 1 && (
          <>
            {/* Outer Glow Halo */}
            <Polyline
              positions={routeCoordinates}
              pathOptions={{
                color: '#10b981',
                weight: 8,
                opacity: 0.3,
              }}
            />
            {/* Core Route Line */}
            <Polyline
              positions={routeCoordinates}
              pathOptions={{
                color: '#059669',
                weight: 4,
                opacity: 0.95,
              }}
            />
          </>
        )}
      </MapContainer>
    </div>
  );
};
