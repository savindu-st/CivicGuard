import React, { useEffect, useState, useRef } from 'react';
import { Navigation, Radio, Play, Square, MapPin } from 'lucide-react';
import { api } from '../../services/api';

interface GpsBeaconProps {
  crewId: string;
  hasActiveTask: boolean;
  onLocationUpdate?: (lat: number, lon: number) => void;
}

const SRI_LANKA_WAYPOINTS = [
  { name: 'Havelock Rd (Canal Bridge)', lat: 6.8790, lon: 79.8660 },
  { name: 'Dickmans Rd (Lester James)', lat: 6.8830, lon: 79.8610 },
  { name: 'Bauddhaloka Mawatha', lat: 6.9010, lon: 79.8730 },
  { name: 'Baseline Rd (Kelani Sector)', lat: 6.9480, lon: 79.8780 },
  { name: 'Peradeniya Rd (Getambe)', lat: 7.2721, lon: 80.6022 },
];

export const GpsBeaconSimulator: React.FC<GpsBeaconProps> = ({
  crewId,
  hasActiveTask,
  onLocationUpdate,
}) => {
  const [isBeaconActive, setIsBeaconActive] = useState<boolean>(true);
  const [currentWaypointIdx, setCurrentWaypointIdx] = useState<number>(0);
  const [lastCoords, setLastCoords] = useState<{ lat: number; lon: number }>({
    lat: SRI_LANKA_WAYPOINTS[0].lat,
    lon: SRI_LANKA_WAYPOINTS[0].lon,
  });
  const [lastSentTime, setLastSentTime] = useState<string>('Just now');
  const [isSimulatingMovement, setIsSimulatingMovement] = useState<boolean>(false);

  const intervalSeconds = hasActiveTask ? 5 : 30;
  const timerRef = useRef<any>(null);

  const transmitLocation = async (lat: number, lon: number) => {
    try {
      await api.patch(`/api/tickets/crews/${crewId}/location`, {
        latitude: lat,
        longitude: lon,
      });
      setLastCoords({ lat, lon });
      setLastSentTime(new Date().toLocaleTimeString());
      if (onLocationUpdate) {
        onLocationUpdate(lat, lon);
      }
    } catch (err) {
      console.warn('Beacon location transmit error:', err);
    }
  };

  // Periodic beacon transmitter
  useEffect(() => {
    if (!isBeaconActive || !crewId) return;

    // Send initial ping
    transmitLocation(lastCoords.lat, lastCoords.lon);

    timerRef.current = setInterval(() => {
      if (isSimulatingMovement) {
        setCurrentWaypointIdx((prev) => {
          const nextIdx = (prev + 1) % SRI_LANKA_WAYPOINTS.length;
          const target = SRI_LANKA_WAYPOINTS[nextIdx];
          transmitLocation(target.lat, target.lon);
          return nextIdx;
        });
      } else {
        // Ping current position with micro-jitter (0.0001 deg ~ 10m)
        const jitterLat = Number((lastCoords.lat + (Math.random() - 0.5) * 0.0002).toFixed(6));
        const jitterLon = Number((lastCoords.lon + (Math.random() - 0.5) * 0.0002).toFixed(6));
        transmitLocation(jitterLat, jitterLon);
      }
    }, intervalSeconds * 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isBeaconActive, isSimulatingMovement, intervalSeconds, crewId]);

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Radio className={`w-5 h-5 ${isBeaconActive ? 'text-emerald-600' : 'text-slate-400'}`} />
            {isBeaconActive && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            )}
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 tracking-wide uppercase">
              Field Telemetry Beacon
            </h4>
            <p className="text-[10px] text-slate-500">
              Ping Rate: <span className="text-emerald-600 font-semibold">{intervalSeconds}s</span> ({hasActiveTask ? 'Active Task' : 'Standby'})
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsBeaconActive(!isBeaconActive)}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
            isBeaconActive
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
              : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
          }`}
        >
          {isBeaconActive ? 'Beacon ON' : 'Beacon OFF'}
        </button>
      </div>

      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs font-mono text-slate-700">
        <div className="flex items-center gap-1.5 truncate">
          <MapPin className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
          <span className="truncate">
            {lastCoords.lat.toFixed(5)}, {lastCoords.lon.toFixed(5)}
          </span>
        </div>
        <span className="text-[10px] text-slate-400">{lastSentTime}</span>
      </div>

      <div className="flex items-center justify-between pt-1 text-xs">
        <div className="text-[11px] text-slate-500">
          Waypoint: <span className="text-slate-800 font-medium">{SRI_LANKA_WAYPOINTS[currentWaypointIdx].name}</span>
        </div>

        <button
          onClick={() => setIsSimulatingMovement(!isSimulatingMovement)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-brand-50 text-brand-700 border border-brand-200 hover:bg-brand-100 font-medium text-[11px] transition-colors"
        >
          {isSimulatingMovement ? (
            <>
              <Square className="w-3 h-3 text-red-600" /> Stop Simulation
            </>
          ) : (
            <>
              <Play className="w-3 h-3 text-brand-600" /> Simulate Move
            </>
          )}
        </button>
      </div>
    </div>
  );
};
