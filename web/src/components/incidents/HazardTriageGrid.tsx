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
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <span>All Wards</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 font-bold">
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
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <span>{ward.name.replace('Ward ', 'W-')}</span>
              {count > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 font-bold">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 2. Status Segmented Tabs */}
      <div className="flex items-center justify-between gap-2 flex-wrap border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'ALL', label: 'All', count: totalIncidents },
            {
              id: 'NEEDS_VERIFICATION',
              label: 'Review Queue',
              count: needsVerificationCount,
              badgeClass: 'bg-amber-100 text-amber-800 font-extrabold border border-amber-200',
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
                  ? 'bg-slate-900 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    tab.badgeClass || 'bg-slate-100 text-slate-600 font-bold'
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
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={selectedSeverity}
            onChange={(e) => onSeverityChange(e.target.value)}
            className="bg-white border border-slate-300 text-slate-700 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-emerald-500 shadow-xs"
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
          className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors shadow-xs"
        />
      </div>

      {/* 4. Triage Grid Incident Cards List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
        {filteredIncidents.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs border border-dashed border-slate-300 rounded-xl bg-slate-50">
            <CheckCircle2 className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="font-semibold text-slate-700">No hazard reports match your current filters</p>
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
                    ? 'bg-emerald-50/60 border-emerald-500 shadow-md ring-1 ring-emerald-500'
                    : 'bg-white border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                {/* Top Row: Type, Status, Urgency */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`p-1.5 rounded-lg text-xs font-bold ${
                        incident.severity === 'CRITICAL'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : incident.severity === 'HIGH'
                          ? 'bg-orange-50 text-orange-700 border border-orange-200'
                          : incident.severity === 'MEDIUM'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      <ShieldAlert className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                        <span>{incident.incident_type?.replace('_', ' ')}</span>
                        {incident.severity === 'CRITICAL' && (
                          <span className="text-[10px] text-red-600 font-extrabold">
                            CRITICAL
                          </span>
                        )}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {incident.wards?.name || 'Municipal Sector'}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        incident.status === 'CONFIRMED'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : incident.status === 'NEEDS_VERIFICATION'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : incident.status === 'RESOLVED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {incident.status === 'NEEDS_VERIFICATION' ? 'Review Required' : incident.status}
                    </span>

                    {/* AI Confidence Gauge Badge */}
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      <span>AI Score:</span>
                      <span
                        className={`font-mono font-bold ${
                          Number(confidenceScore) >= 85
                            ? 'text-emerald-700'
                            : Number(confidenceScore) >= 40
                            ? 'text-amber-700'
                            : 'text-red-700'
                        }`}
                      >
                        {confidenceScore}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Middle: Road Location & Description */}
                <div className="mt-2.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-800 font-bold">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    <span className="truncate">{incident.roads?.name || incident.description || 'Reported Location'}</span>
                  </div>
                  {incident.description && incident.description !== incident.roads?.name && (
                    <p className="text-[11px] text-slate-600 line-clamp-2 pl-5 leading-relaxed">
                      {incident.description}
                    </p>
                  )}
                </div>

                {/* Bottom Badges & Action Prompt */}
                <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-2">
                    {/* Road Closure Tag */}
                    {isRoadClosed ? (
                      <span className="inline-flex items-center gap-1 text-red-700 font-semibold bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                        <Ban className="w-2.5 h-2.5" />
                        <span>Road Closed</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
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

                  <div className="flex items-center gap-1 text-slate-900 font-bold hover:text-emerald-700">
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
