import React, { useState, useMemo } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Package,
  Info,
  Users,
  Clock,
  Phone,
  MapPin,
  Home,
  HeartPulse,
  Droplets,
  Utensils,
  LifeBuoy,
  Search,
  CheckCircle2,
  Check,
  ChevronDown,
  Navigation,
  Sparkles,
} from 'lucide-react';

export interface SosTriageQueueProps {
  requests: any[];
  selectedRequestId: string | null;
  onSelectRequest: (id: string) => void;
  onOpenMatcher: (request: any) => void;
  onOpenSupplies: (request: any) => void;
  onUpdateStatus: (id: string, status: string) => void;
  onLocateOnMap?: (request: any) => void;
}

export const SosTriageQueue: React.FC<SosTriageQueueProps> = ({
  requests,
  selectedRequestId,
  onSelectRequest,
  onOpenMatcher,
  onOpenSupplies,
  onUpdateStatus,
  onLocateOnMap,
}) => {
  const [urgencyFilter, setUrgencyFilter] = useState<string>('ALL');
  const [helpTypeFilter, setHelpTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Map DB urgency to operational tier
  const getTier = (urgency: string): 'P1' | 'P2' | 'P3' | 'P4' => {
    switch (urgency?.toUpperCase()) {
      case 'CRITICAL':
      case 'P1':
        return 'P1';
      case 'HIGH':
      case 'P2':
        return 'P2';
      case 'MEDIUM':
      case 'P3':
        return 'P3';
      default:
        return 'P4';
    }
  };

  const getHelpIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'EVACUATION':
        return <LifeBuoy className="w-3.5 h-3.5 text-red-400" />;
      case 'MEDICAL':
        return <HeartPulse className="w-3.5 h-3.5 text-rose-400" />;
      case 'SHELTER':
        return <Home className="w-3.5 h-3.5 text-sky-400" />;
      case 'FOOD':
        return <Utensils className="w-3.5 h-3.5 text-amber-400" />;
      case 'WATER':
        return <Droplets className="w-3.5 h-3.5 text-cyan-400" />;
      default:
        return <Package className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return 'just now';
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  // Filter requests
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const tier = getTier(req.urgency);
      if (urgencyFilter !== 'ALL' && tier !== urgencyFilter) return false;
      if (helpTypeFilter !== 'ALL' && req.help_type !== helpTypeFilter) return false;
      if (statusFilter !== 'ALL' && req.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const descMatch = req.description?.toLowerCase().includes(q);
        const nameMatch = req.users?.name?.toLowerCase().includes(q) || req.user_name?.toLowerCase().includes(q);
        const phoneMatch = req.users?.phone?.includes(q) || req.user_phone?.includes(q);
        if (!descMatch && !nameMatch && !phoneMatch) return false;
      }
      return true;
    });
  }, [requests, urgencyFilter, helpTypeFilter, statusFilter, searchQuery]);

  // Urgency counter counts
  const counts = useMemo(() => {
    const p1 = requests.filter((r) => getTier(r.urgency) === 'P1').length;
    const p2 = requests.filter((r) => getTier(r.urgency) === 'P2').length;
    const p3 = requests.filter((r) => getTier(r.urgency) === 'P3').length;
    const p4 = requests.filter((r) => getTier(r.urgency) === 'P4').length;
    const pending = requests.filter((r) => r.status === 'PENDING').length;
    return { p1, p2, p3, p4, total: requests.length, pending };
  }, [requests]);

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header & Controls */}
      <div className="p-4 border-b border-slate-200 bg-white space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 tracking-wide uppercase flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-red-600" />
              <span>SOS Help Request Triage Queue</span>
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
              {counts.pending} PENDING
            </span>
          </div>
          <span className="text-xs text-slate-500">
            {filteredRequests.length} of {requests.length} Requests
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by citizen name, phone number, or SOS notes..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:bg-white transition-colors"
          />
        </div>

        {/* Urgency Tier Filter Pills (P1 to P4) */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => setUrgencyFilter('ALL')}
            className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-all ${
              urgencyFilter === 'ALL'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            All Urgencies ({counts.total})
          </button>
          <button
            onClick={() => setUrgencyFilter('P1')}
            className={`px-2.5 py-1 rounded-md font-semibold text-[11px] flex items-center gap-1.5 transition-all ${
              urgencyFilter === 'P1'
                ? 'bg-red-600 text-white shadow-sm border border-red-500'
                : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span>P1 Critical ({counts.p1})</span>
          </button>
          <button
            onClick={() => setUrgencyFilter('P2')}
            className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-all ${
              urgencyFilter === 'P2'
                ? 'bg-orange-600 text-white shadow-sm border border-orange-500'
                : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'
            }`}
          >
            P2 High ({counts.p2})
          </button>
          <button
            onClick={() => setUrgencyFilter('P3')}
            className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-all ${
              urgencyFilter === 'P3'
                ? 'bg-amber-600 text-white shadow-sm border border-amber-500'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            P3 Medium ({counts.p3})
          </button>
          <button
            onClick={() => setUrgencyFilter('P4')}
            className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-all ${
              urgencyFilter === 'P4'
                ? 'bg-blue-600 text-white shadow-sm border border-blue-500'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            P4 Low ({counts.p4})
          </button>
        </div>

        {/* Secondary Filters: Status & Help Type */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[11px]">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {['ALL', 'PENDING', 'ASSIGNED', 'COMPLETED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2 py-0.5 rounded font-medium transition-all ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Help Type Selector */}
          <div className="flex items-center gap-1 text-[11px]">
            <span className="text-slate-500">Need:</span>
            {['ALL', 'EVACUATION', 'MEDICAL', 'SHELTER', 'FOOD', 'WATER'].map((type) => (
              <button
                key={type}
                onClick={() => setHelpTypeFilter(type)}
                className={`px-1.5 py-0.5 rounded transition-all ${
                  helpTypeFilter === type
                    ? 'bg-brand-50 text-brand-700 font-bold border border-brand-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {type === 'ALL' ? 'All' : type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cards Queue List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 border border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2 opacity-80" />
            <p className="text-xs font-semibold text-slate-700">No SOS Help Requests Found</p>
            <p className="text-[11px] text-slate-500 mt-1">
              All requests matching the selected filters are cleared or triaged.
            </p>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const tier = getTier(req.urgency);
            const isSelected = selectedRequestId === req.id;
            const citizenName = req.users?.name || req.user_name || 'Anonymous Citizen';
            const citizenPhone = req.users?.phone || req.user_phone;

            return (
              <div
                key={req.id}
                onClick={() => onSelectRequest(req.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-red-50/50 border-red-400 shadow-md'
                    : tier === 'P1'
                    ? 'bg-red-50/20 border-red-200 hover:border-red-300'
                    : tier === 'P2'
                    ? 'bg-orange-50/20 border-orange-200 hover:border-orange-300'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Top Row: Urgency Badge, Help Type, Time */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Urgency Badge */}
                    {tier === 'P1' ? (
                      <span className="badge-critical font-bold flex items-center gap-1.5 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                        <span>P1 CRITICAL</span>
                      </span>
                    ) : tier === 'P2' ? (
                      <span className="badge-high font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-orange-600" />
                        <span>P2 HIGH</span>
                      </span>
                    ) : tier === 'P3' ? (
                      <span className="badge-medium font-bold flex items-center gap-1">
                        <Package className="w-3 h-3 text-amber-600" />
                        <span>P3 MEDIUM</span>
                      </span>
                    ) : (
                      <span className="badge-low font-bold flex items-center gap-1">
                        <Info className="w-3 h-3 text-blue-600" />
                        <span>P4 LOW</span>
                      </span>
                    )}

                    {/* Help Type Badge */}
                    <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                      {getHelpIcon(req.help_type)}
                      <span>{req.help_type}</span>
                    </span>

                    {/* People Headcount Badge */}
                    <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <Users className="w-3 h-3 text-brand-600" />
                      <span>{req.people_count} {req.people_count === 1 ? 'Person' : 'People'}</span>
                    </span>
                  </div>

                  {/* Timestamp & Status */}
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatRelativeTime(req.created_at)}</span>
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        req.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : req.status === 'ASSIGNED'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : req.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                </div>

                {/* Description / Distress Note */}
                <p className="text-xs text-slate-800 leading-relaxed font-normal mb-2.5">
                  {req.description || 'No description provided with emergency distress submission.'}
                </p>

                {/* Citizen Contact & GPS Metadata */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <span>👤 {citizenName}</span>
                    </span>
                    {citizenPhone && (
                      <a
                        href={`tel:${citizenPhone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-brand-600 hover:underline flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{citizenPhone}</span>
                      </a>
                    )}
                    <span className="text-slate-400 font-mono text-[10px]">
                      GPS: {Number(req.latitude).toFixed(4)}, {Number(req.longitude).toFixed(4)}
                    </span>
                  </div>
                </div>

                {/* Assigned Shelter Indicator if already matched */}
                {req.description && req.description.includes('[Assigned Shelter:') && (
                  <div className="mt-2 p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span className="font-semibold">Shelter Allocated & Bed Reserved</span>
                  </div>
                )}

                {/* Action Bar */}
                <div
                  className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2">
                    {/* One-Click Match Shelter Button */}
                    <button
                      onClick={() => onOpenMatcher(req)}
                      className="px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all border border-sky-500"
                    >
                      <Home className="w-3.5 h-3.5" />
                      <span>Match Nearest Shelter</span>
                    </button>

                    {/* Allocate Supplies Button */}
                    <button
                      onClick={() => onOpenSupplies(req)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all border border-emerald-500"
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>Allocate Supplies</span>
                    </button>

                    {/* Locate on Map Button */}
                    {onLocateOnMap && (
                      <button
                        onClick={() => onLocateOnMap(req)}
                        className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs flex items-center gap-1 border border-slate-300 transition-all"
                        title="Focus Map on Citizen Distress GPS"
                      >
                        <Navigation className="w-3 h-3 text-brand-600" />
                        <span>Locate</span>
                      </button>
                    )}
                  </div>

                  {/* Status Dropdown */}
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="text-slate-500">Status:</span>
                    <select
                      value={req.status}
                      onChange={(e) => onUpdateStatus(req.id, e.target.value)}
                      className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs font-semibold focus:outline-none focus:border-brand-500"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="ASSIGNED">ASSIGNED</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
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
