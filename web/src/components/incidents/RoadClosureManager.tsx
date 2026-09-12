import React, { useState } from 'react';
import { Ban, CheckCircle2, Search, MapPin, AlertTriangle, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';

export interface RoadClosureManagerProps {
  roads: any[];
  onRoadUpdated: () => void;
  onSelectRoadOnMap?: (road: any) => void;
}

export const RoadClosureManager: React.FC<RoadClosureManagerProps> = ({
  roads,
  onRoadUpdated,
  onSelectRoadOnMap,
}) => {
  const [search, setSearch] = useState('');
  const [togglingRoadId, setTogglingRoadId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filteredRoads = roads.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.name?.toLowerCase().includes(q) ||
      r.ward_name?.toLowerCase().includes(q) ||
      r.road_type?.toLowerCase().includes(q)
    );
  });

  const handleToggle = async (road: any) => {
    setTogglingRoadId(road.id);
    setErrorMsg(null);
    try {
      await api.patch(`/api/incidents/roads/${road.id}/closure`, {
        is_closed: !road.is_closed,
      });
      onRoadUpdated();
    } catch (err: any) {
      setErrorMsg(`Failed to toggle road: ${err.message}`);
    } finally {
      setTogglingRoadId(null);
    }
  };

  const closedCount = roads.filter((r) => r.is_closed).length;

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header & Stats */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-dark-850 border border-slate-800">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Ban className="w-4 h-4 text-red-400" />
            <span>Municipal Road Infrastructure Network</span>
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Authoritative municipal road closures and flood detour management
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-slate-400">Enforced Closures:</span>
            <div className="text-sm font-bold text-red-400">{closedCount} Roads Closed</div>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/40 text-xs text-red-300">
          {errorMsg}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search road network by name or municipal ward..."
          className="w-full bg-dark-850 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 shadow-inner"
        />
      </div>

      {/* Roads Table / Cards */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
        {filteredRoads.map((road) => {
          const isToggling = togglingRoadId === road.id;
          const isClosed = road.is_closed;
          const activeIncidents = road.active_incidents || [];

          return (
            <div
              key={road.id}
              className={`p-3.5 rounded-xl border transition-all ${
                isClosed
                  ? 'bg-red-950/20 border-red-500/40'
                  : 'bg-dark-850/60 border-slate-800/80 hover:bg-dark-800/80'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{road.name}</span>
                    <span
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                        isClosed
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {isClosed ? '🔴 CLOSED' : '🟢 OPEN'}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                      {road.road_type}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span>{road.ward_name || road.wards?.name || 'Assigned Ward'}</span>
                    </span>
                    {activeIncidents.length > 0 && (
                      <span className="text-amber-400 font-semibold">
                        • {activeIncidents.length} active hazard{activeIncidents.length > 1 ? 's' : ''} blocking
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {onSelectRoadOnMap && (
                    <button
                      onClick={() => onSelectRoadOnMap(road)}
                      className="px-2.5 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
                      title="View on Map"
                    >
                      View on Map
                    </button>
                  )}

                  <button
                    onClick={() => handleToggle(road)}
                    disabled={isToggling}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 ${
                      isClosed
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30'
                        : 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/30'
                    }`}
                  >
                    {isToggling ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Ban className="w-3.5 h-3.5" />
                    )}
                    <span>{isClosed ? 'Reopen Road' : 'Close Road'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
