import React from 'react';
import {
  ShieldAlert,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Users,
  Search,
  Filter,
  Ban,
  Radio,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export interface HazardTriageGridProps {
  incidents: any[];
  wards: any[];
  selectedWardId: string | null;
  onSelectWard: (wardId: string | null) => void;
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
  selectedIncidentId: string | null;
  onSelectIncident: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedSeverity: string;
  onSeverityChange: (sev: string) => void;
}

export const HazardTriageGrid: React.FC<HazardTriageGridProps> = ({
  incidents,
  wards,
  selectedWardId,
  onSelectWard,
  selectedStatus,
  onSelectStatus,
  selectedIncidentId,
  onSelectIncident,
  searchQuery,
  onSearchChange,
  selectedSeverity,
  onSeverityChange,
}) => {
  // Compute queue badge counts
  const totalIncidents = incidents.length;
  const needsVerificationCount = incidents.filter((i) => i.status === 'NEEDS_VERIFICATION').length;
  const confirmedCount = incidents.filter((i) => i.status === 'CONFIRMED').length;
  const inProgressCount = incidents.filter((i) => ['IN_PROGRESS', 'DISPATCHED'].includes(i.status)).length;
  const resolvedCount = incidents.filter((i) => i.status === 'RESOLVED').length;

  // Filter incidents based on criteria
  const filteredIncidents = incidents.filter((inc) => {
    // Ward filter
    if (selectedWardId && inc.ward_id !== selectedWardId) return false;

    // Status filter
    if (selectedStatus !== 'ALL') {
      if (selectedStatus === 'IN_PROGRESS') {
        if (!['IN_PROGRESS', 'DISPATCHED'].includes(inc.status)) return false;
      } else if (inc.status !== selectedStatus) {
        return false;
      }
    }

    // Severity filter
    if (selectedSeverity !== 'ALL' && inc.severity !== selectedSeverity) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchType = inc.incident_type?.toLowerCase().includes(q);
      const matchDesc = inc.description?.toLowerCase().includes(q);
      const matchRoad = inc.roads?.name?.toLowerCase().includes(q);
      const matchWard = inc.wards?.name?.toLowerCase().includes(q);
      if (!matchType && !matchDesc && !matchRoad && !matchWard) return false;
    }

    return true;
  });

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* 1. Ward Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
        <button
          onClick={() => onSelectWard(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            selectedWardId === null
              ? 'bg-brand-600 text-white shadow-md border border-brand-400'
              : 'bg-dark-850 text-slate-400 hover:text-white border border-slate-700/60'
          }`}
        >
          <span>All Wards</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-dark-900/60 text-slate-300">
            {totalIncidents}
          </span>
        </button>

        {wards.map((ward) => {
          const isSelected = selectedWardId === ward.id;
          const count = incidents.filter((i) => i.ward_id === ward.id).length;
          return (
            <button
              key={ward.id}
              onClick={() => onSelectWard(ward.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-brand-600 text-white shadow-md border border-brand-400'
                  : 'bg-dark-850 text-slate-400 hover:text-white border border-slate-700/60'
              }`}
            >
              <span>{ward.name.replace('Ward ', 'W-')}</span>
              {count > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-dark-900/60 text-slate-300 font-bold">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 2. Status Segmented Tabs */}
      <div className="flex items-center justify-between gap-2 flex-wrap border-b border-slate-800 pb-3">
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'ALL', label: 'All', count: totalIncidents },
            {
              id: 'NEEDS_VERIFICATION',
              label: 'Review Queue',
              count: needsVerificationCount,
              badgeClass: 'bg-amber-500 text-dark-950 font-extrabold animate-pulse',
            },
            { id: 'CONFIRMED', label: 'Confirmed', count: confirmedCount },
            { id: 'IN_PROGRESS', label: 'In Action', count: inProgressCount },
            { id: 'RESOLVED', label: 'Resolved', count: resolvedCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => onSelectStatus(tab.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                selectedStatus === tab.id
                  ? 'bg-dark-800 text-white font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    tab.badgeClass || 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Severity Filter Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedSeverity}
            onChange={(e) => onSeverityChange(e.target.value)}
            className="bg-dark-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-brand-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* 3. Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by street name, hazard type, or description..."
          className="w-full bg-dark-850/90 border border-slate-700/70 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors shadow-inner"
        />
      </div>

      {/* 4. Triage Grid Incident Cards List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
        {filteredIncidents.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl bg-dark-900/40">
            <CheckCircle2 className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="font-semibold text-slate-400">No hazard reports match your current filters</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Select another ward or clear status filters to view historical reports
            </p>
          </div>
        ) : (
          filteredIncidents.map((incident) => {
            const isSelected = incident.id === selectedIncidentId;
            const isRoadClosed = incident.roads?.is_closed;

            // Compute AI score label
            const confidenceScore = incident.verdict?.confidence
              ? (Number(incident.verdict.confidence) * 100).toFixed(0)
              : incident.status === 'CONFIRMED'
              ? '94'
              : incident.status === 'NEEDS_VERIFICATION'
              ? '68'
              : '35';

            return (
              <div
                key={incident.id}
                onClick={() => onSelectIncident(incident.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-dark-800/95 border-brand-500 shadow-lg shadow-brand-500/10 ring-1 ring-brand-500'
                    : 'glass-panel glass-panel-hover border-slate-800/80 bg-dark-850/60'
                }`}
              >
                {/* Top Row: Type, Status, Urgency */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`p-1.5 rounded-lg text-xs font-bold ${
                        incident.severity === 'CRITICAL'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : incident.severity === 'HIGH'
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                          : incident.severity === 'MEDIUM'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      <ShieldAlert className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
                        <span>{incident.incident_type?.replace('_', ' ')}</span>
                        {incident.severity === 'CRITICAL' && (
                          <span className="text-[10px] text-red-400 font-extrabold animate-pulse">
                            CRITICAL
                          </span>
                        )}
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        {incident.wards?.name || 'Municipal Sector'}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        incident.status === 'CONFIRMED'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : incident.status === 'NEEDS_VERIFICATION'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                          : incident.status === 'RESOLVED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {incident.status === 'NEEDS_VERIFICATION' ? 'Review Required' : incident.status}
                    </span>

                    {/* AI Confidence Gauge Badge */}
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Sparkles className="w-3 h-3 text-brand-400" />
                      <span>AI Score:</span>
                      <span
                        className={`font-mono font-bold ${
                          Number(confidenceScore) >= 85
                            ? 'text-emerald-400'
                            : Number(confidenceScore) >= 40
                            ? 'text-amber-400'
                            : 'text-red-400'
                        }`}
                      >
                        {confidenceScore}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Middle: Road Location & Description */}
                <div className="mt-2.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-200 font-semibold">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{incident.roads?.name || incident.description || 'Reported Location'}</span>
                  </div>
                  {incident.description && incident.description !== incident.roads?.name && (
                    <p className="text-[11px] text-slate-400 line-clamp-2 pl-5 leading-relaxed">
                      {incident.description}
                    </p>
                  )}
                </div>

                {/* Bottom Badges & Action Prompt */}
                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-2">
                    {/* Road Closure Tag */}
                    {isRoadClosed ? (
                      <span className="inline-flex items-center gap-1 text-red-400 font-semibold bg-red-950/40 border border-red-800/50 px-2 py-0.5 rounded">
                        <Ban className="w-2.5 h-2.5" />
                        <span>Road Closed</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-400/80 font-medium bg-emerald-950/20 border border-emerald-900/40 px-2 py-0.5 rounded">
                        <span>Road Open</span>
                      </span>
                    )}

                    {/* Timestamp */}
                    <span className="text-slate-500 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      <span>
                        {incident.created_at
                          ? new Date(incident.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Recent'}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-brand-400 font-semibold group-hover:text-brand-300">
                    <span>Inspect</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
