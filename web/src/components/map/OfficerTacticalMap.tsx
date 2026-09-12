import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Users,
  Navigation,
  Ban,
  Radio,
} from 'lucide-react';
import { getMapTileConfig } from '../../utils/mapConfig';

export interface OfficerTacticalMapProps {
  incidents: any[];
  roads: any[];
  crews: any[];
  tickets: any[];
  selectedIncidentId: string | null;
  onSelectIncident: (id: string) => void;
  onSelectRoad?: (roadId: string) => void;
  activeSosAlert?: any | null;
}

// Custom Marker Generators
const createHazardIcon = (status: string, severity: string, isSelected: boolean) => {
  let bgColor = '#f59e0b'; // Amber for NEEDS_VERIFICATION
  let ringAnim = 'animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;';
  let symbol = '!';

  if (status === 'CONFIRMED') {
    bgColor = severity === 'CRITICAL' ? '#ef4444' : '#f97316';
    ringAnim = '';
    symbol = '▲';
  } else if (status === 'IN_PROGRESS' || status === 'DISPATCHED') {
    bgColor = '#3b82f6';
    ringAnim = '';
    symbol = '⚙';
  } else if (status === 'RESOLVED') {
    bgColor = '#10b981';
    ringAnim = '';
    symbol = '✓';
  } else if (status === 'REJECTED') {
    bgColor = '#64748b';
    ringAnim = '';
    symbol = '✕';
  }

  const selectedRing = isSelected
    ? `box-shadow: 0 0 0 4px #38bdf8, 0 0 20px rgba(56, 189, 248, 0.8); transform: scale(1.15);`
    : `box-shadow: 0 4px 10px rgba(0,0,0,0.6);`;

  return L.divIcon({
    className: 'hazard-custom-icon',
    html: `
      <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
        ${
          status === 'NEEDS_VERIFICATION' || severity === 'CRITICAL'
            ? `<div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: ${bgColor}; opacity: 0.35; ${ringAnim}"></div>`
            : ''
        }
        <div style="width: 26px; height: 26px; border-radius: 50%; background: ${bgColor}; border: 2.5px solid #0f172a; ${selectedRing} display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 13px; transition: all 0.2s;">
          ${symbol}
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });
};

const createCrewIcon = (availability: string) => {
  const isAvail = availability === 'AVAILABLE';
  const isBusy = availability === 'BUSY';
  const color = isAvail ? '#10b981' : isBusy ? '#f97316' : '#64748b';

  return L.divIcon({
    className: 'crew-custom-icon',
    html: `
      <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
        ${
          isAvail
            ? `<div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: rgba(16, 185, 129, 0.35); animation: ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
            : ''
        }
        <div style="width: 22px; height: 22px; border-radius: 6px; background: ${color}; border: 2.5px solid #0f172a; box-shadow: 0 4px 8px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: bold;">
          👷
        </div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
};

const createClosedRoadIcon = () => {
  return L.divIcon({
    className: 'closed-road-custom-icon',
    html: `
      <div style="display: flex; align-items: center; justify-content: center; width: 26px; height: 26px; background: #ef4444; border: 2px solid white; border-radius: 4px; box-shadow: 0 2px 8px rgba(239, 68, 68, 0.7); color: white; font-weight: 900; font-size: 11px;">
        ⛔
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -14],
  });
};

const createCrewSosIcon = () => {
  return L.divIcon({
    className: 'crew-sos-custom-icon',
    html: `
      <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: rgba(239, 68, 68, 0.45); animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: absolute; width: 75%; height: 75%; border-radius: 50%; background: rgba(239, 68, 68, 0.6); animation: pulse 1.5s infinite;"></div>
        <div style="position: relative; width: 28px; height: 28px; border-radius: 8px; background: #dc2626; border: 2.5px solid #ffffff; box-shadow: 0 0 15px rgba(239, 68, 68, 1); display: flex; align-items: center; justify-content: center; font-size: 14px;">
          🚨
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  });
};

// Auto-pan to selected incident helper
const MapPanController: React.FC<{ selectedIncident: any }> = ({ selectedIncident }) => {
  const map = useMap();
  useEffect(() => {
    if (selectedIncident?.latitude && selectedIncident?.longitude) {
      map.flyTo([Number(selectedIncident.latitude), Number(selectedIncident.longitude)], 15, {
        duration: 1.2,
      });
    }
  }, [selectedIncident, map]);
  return null;
};

// Auto-pan to SOS distress location helper
const MapSosPanController: React.FC<{ activeSosAlert: any }> = ({ activeSosAlert }) => {
  const map = useMap();
  useEffect(() => {
    if (activeSosAlert?.latitude && activeSosAlert?.longitude) {
      map.flyTo([Number(activeSosAlert.latitude), Number(activeSosAlert.longitude)], 16, {
        duration: 1.5,
      });
    }
  }, [activeSosAlert, map]);
  return null;
};

export const OfficerTacticalMap: React.FC<OfficerTacticalMapProps> = ({
  incidents,
  roads,
  crews,
  tickets,
  selectedIncidentId,
  onSelectIncident,
  onSelectRoad,
  activeSosAlert,
}) => {
  // Default centered around Colombo South / Havelock & Kelani Basin
  const defaultCenter: [number, number] = [6.9010, 79.8730];
  const defaultZoom = 13;
  const tileConfig = getMapTileConfig();

  const selectedIncident = incidents.find((i) => i.id === selectedIncidentId);

  // Compute active dispatch vectors (between assigned crew and target incident)
  const dispatchVectors: {
    ticketId: string;
    crewName: string;
    fromCoords: [number, number];
    toCoords: [number, number];
    priority: string;
  }[] = [];

  tickets.forEach((ticket) => {
    if (['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'].includes(ticket.status) && ticket.assigned_crew_id) {
      const crew = crews.find((c) => c.id === ticket.assigned_crew_id);
      const inc = incidents.find((i) => i.id === ticket.incident_id) || ticket.incidents;

      if (crew?.latitude && crew?.longitude && inc?.latitude && inc?.longitude) {
        dispatchVectors.push({
          ticketId: ticket.id,
          crewName: crew.crew_name || 'Assigned Crew',
          fromCoords: [Number(crew.latitude), Number(crew.longitude)],
          toCoords: [Number(inc.latitude), Number(inc.longitude)],
          priority: ticket.priority || 'HIGH',
        });
      }
    }
  });

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-xl overflow-hidden border border-slate-800 shadow-2xl bg-dark-900">
      {/* Tactical Map Overlay Legend */}
      <div className="absolute top-3 left-3 z-[400] bg-dark-900/90 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-700/60 text-xs shadow-lg space-y-1.5 pointer-events-auto">
        <div className="flex items-center gap-2 font-bold text-white tracking-wider text-[11px] uppercase pb-1 border-b border-slate-700/50">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>Live Tactical Grid</span>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span>Confirmed Hazard</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span>Needs Verification</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span>
            <span>Field Crew Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-red-600 border border-white"></span>
            <span>Closed Road</span>
          </div>
        </div>
        {dispatchVectors.length > 0 && (
          <div className="pt-1 border-t border-slate-700/40 text-[10px] text-sky-400 font-semibold flex items-center gap-1">
            <Navigation className="w-3 h-3" />
            <span>{dispatchVectors.length} Active Dispatch Vectors</span>
          </div>
        )}
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        className="w-full h-full z-0"
        style={{ height: '100%', minHeight: '520px', width: '100%' }}
      >
        {/* Dark-mode Tactical Basemap (Clean Free Esri Dark Gray or Custom API Key) */}
        <TileLayer
          attribution={tileConfig.attribution}
          url={tileConfig.url}
          maxZoom={tileConfig.maxZoom || 19}
        />

        {/* Selected Incident Pan Hook */}
        <MapPanController selectedIncident={selectedIncident} />
        {/* SOS Alert Pan Hook */}
        <MapSosPanController activeSosAlert={activeSosAlert} />

        {/* 1. Closed Roads */}
        {roads
          .filter((r) => r.is_closed)
          .map((road) => (
            <React.Fragment key={`road-${road.id}`}>
              <Marker
                position={[Number(road.latitude), Number(road.longitude)]}
                icon={createClosedRoadIcon()}
                eventHandlers={{
                  click: () => onSelectRoad && onSelectRoad(road.id),
                }}
              >
                <Popup>
                  <div className="space-y-1 text-xs">
                    <div className="font-bold text-red-400 flex items-center gap-1">
                      <Ban className="w-3.5 h-3.5" />
                      <span>ROAD CLOSED</span>
                    </div>
                    <div className="font-semibold text-white">{road.name}</div>
                    <div className="text-[10px] text-slate-400">
                      Ward: {road.ward_name || road.wards?.name || 'Assigned Ward'}
                    </div>
                    <div className="text-[10px] text-amber-300">
                      Traffic detoured via safe alternate corridors
                    </div>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          ))}

        {/* 2. Incidents & Hazard Perimeter Circles */}
        {incidents.map((incident) => {
          const isSelected = incident.id === selectedIncidentId;
          const lat = Number(incident.latitude);
          const lon = Number(incident.longitude);

          if (!lat || !lon) return null;

          return (
            <React.Fragment key={`inc-${incident.id}`}>
              {/* Semi-transparent 200m cluster/hazard radius for confirmed & needs verification */}
              {['CONFIRMED', 'NEEDS_VERIFICATION'].includes(incident.status) && (
                <Circle
                  center={[lat, lon]}
                  radius={200}
                  pathOptions={{
                    color: incident.status === 'CONFIRMED' ? '#ef4444' : '#f59e0b',
                    fillColor: incident.status === 'CONFIRMED' ? '#ef4444' : '#f59e0b',
                    fillOpacity: isSelected ? 0.25 : 0.12,
                    weight: isSelected ? 2 : 1,
                    dashArray: incident.status === 'NEEDS_VERIFICATION' ? '4, 6' : undefined,
                  }}
                />
              )}

              <Marker
                position={[lat, lon]}
                icon={createHazardIcon(incident.status, incident.severity, isSelected)}
                eventHandlers={{
                  click: () => onSelectIncident(incident.id),
                }}
              >
                <Popup>
                  <div className="p-1 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-white uppercase tracking-wide">
                        {incident.incident_type?.replace('_', ' ')}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          incident.status === 'CONFIRMED'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : incident.status === 'NEEDS_VERIFICATION'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {incident.status}
                      </span>
                    </div>
                    <div className="text-slate-300 text-[11px]">
                      {incident.roads?.name || incident.description || 'Reported Hazard Area'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Ward: {incident.wards?.name || 'Municipal Sector'} • Severity: {incident.severity}
                    </div>
                    <button
                      onClick={() => onSelectIncident(incident.id)}
                      className="w-full mt-2 py-1 px-2.5 rounded bg-brand-600 hover:bg-brand-500 text-white font-semibold text-[11px] transition-colors"
                    >
                      Inspect in Command Panel &rarr;
                    </button>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}

        {/* 3. Field Crews */}
        {crews.map((crew) => {
          const lat = Number(crew.latitude);
          const lon = Number(crew.longitude);

          if (!lat || !lon) return null;

          return (
            <Marker
              key={`crew-${crew.id}`}
              position={[lat, lon]}
              icon={createCrewIcon(crew.availability)}
            >
              <Popup>
                <div className="p-1 space-y-1 text-xs">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{crew.crew_name}</span>
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Status:{' '}
                    <span
                      className={`font-semibold ${
                        crew.availability === 'AVAILABLE'
                          ? 'text-emerald-400'
                          : crew.availability === 'BUSY'
                          ? 'text-orange-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {crew.availability}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Vehicle: {crew.vehicle_type || 'Rapid Response Van'} • Sector: Colombo / Kandy
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* 4. Animated Dispatch Vectors (Connecting Assigned Crews to Target Hazards) */}
        {dispatchVectors.map((vec) => (
          <React.Fragment key={`vector-${vec.ticketId}`}>
            <Polyline
              positions={[vec.fromCoords, vec.toCoords]}
              pathOptions={{
                color: '#38bdf8',
                weight: 3.5,
                opacity: 0.85,
                dashArray: '8, 12',
                lineCap: 'round',
              }}
            >
              <Popup>
                <div className="p-1 text-xs space-y-1">
                  <div className="font-bold text-sky-400 flex items-center gap-1">
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Active Field Dispatch Route</span>
                  </div>
                  <div className="text-[11px] text-white">
                    Assigned: <span className="font-semibold">{vec.crewName}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Priority: {vec.priority}</div>
                </div>
              </Popup>
            </Polyline>
          </React.Fragment>
        ))}
        {/* 5. Active SOS Emergency Distress Pin & Radar Pulse */}
        {activeSosAlert && activeSosAlert.latitude && activeSosAlert.longitude && (
          <React.Fragment key={`active-sos-distress-${activeSosAlert.timestamp || Date.now()}`}>
            <Circle
              center={[Number(activeSosAlert.latitude), Number(activeSosAlert.longitude)]}
              radius={350}
              pathOptions={{
                color: '#ef4444',
                fillColor: '#ef4444',
                fillOpacity: 0.25,
                weight: 2.5,
                dashArray: '6, 8',
              }}
            />
            <Marker
              position={[Number(activeSosAlert.latitude), Number(activeSosAlert.longitude)]}
              icon={createCrewSosIcon()}
            >
              <Popup>
                <div className="p-1.5 space-y-1.5 text-xs max-w-xs">
                  <div className="font-extrabold text-red-500 flex items-center gap-1.5">
                    <span className="animate-pulse">🚨 CREW IN DISTRESS</span>
                  </div>
                  <div className="text-[12px] font-bold text-white">
                    {activeSosAlert.crew_name || 'Field Response Unit'}
                  </div>
                  <div className="text-[11px] text-red-200 bg-red-950/60 p-1.5 rounded border border-red-500/40">
                    {activeSosAlert.message}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    GPS: {Number(activeSosAlert.latitude).toFixed(4)}, {Number(activeSosAlert.longitude).toFixed(4)}
                  </div>
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        )}
      </MapContainer>
    </div>
  );
};
