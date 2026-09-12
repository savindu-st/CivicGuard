import React, { useState } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  Award,
  Truck,
  AlertTriangle,
  Radio,
  Phone,
  Calendar,
  MapPin,
  Sparkles,
  Search,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../services/api';

interface VolunteerEntry {
  notification_id: string;
  user_id: string;
  name: string;
  phone: string;
  email: string;
  opportunity_id: string;
  mission_title: string;
  district: string;
  joined_at: string;
  checked_in_at?: string | null;
  status: string; // 'REGISTERED' | 'ON_SITE_VERIFIED' | 'COMPLETED'
}

interface ShelterForceBreakdown {
  shelter_id: string;
  shelter_name: string;
  address: string;
  capacity: number;
  current_occupancy: number;
  target_volunteers: number;
  registered_volunteers: number;
  onsite_volunteers: number;
  completed_volunteers: number;
  is_coverage_sufficient: boolean;
  supply_dispatch_recommendation: string;
  volunteers: VolunteerEntry[];
}

interface VolunteerRosterDeskProps {
  roster: VolunteerEntry[];
  shelterBreakdowns: ShelterForceBreakdown[];
  summary: {
    total_registered: number;
    total_onsite: number;
    total_completed: number;
  };
  onRefresh: () => void;
  onOpenSuppliesForShelter?: (shelter: any) => void;
}

export const VolunteerRosterDesk: React.FC<VolunteerRosterDeskProps> = ({
  roster,
  shelterBreakdowns,
  summary,
  onRefresh,
  onOpenSuppliesForShelter,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionToast, setActionToast] = useState<string | null>(null);

  // Status Updater Handler (Officers can verify or mark completed)
  const handleUpdateMemberStatus = async (
    userId: string,
    oppId: string,
    newStatus: 'ON_SITE_VERIFIED' | 'COMPLETED'
  ) => {
    setActionLoadingId(`${userId}-${oppId}`);
    try {
      await api.post('/api/relief/volunteers/check-in', {
        user_id: userId,
        opportunity_id: oppId,
        status: newStatus,
      });
      setActionToast(
        newStatus === 'ON_SITE_VERIFIED'
          ? '✓ Volunteer verified on-site at shelter reception!'
          : '✓ Volunteer mission logged as Completed (+2 hours credit)!'
      );
      setTimeout(() => setActionToast(null), 4000);
      onRefresh();
    } catch (err: any) {
      console.error('Failed to update volunteer check-in status:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered Roster
  const filteredRoster = roster.filter((m) => {
    const statusNormalized = (m.status || '').toUpperCase();
    if (filterStatus === 'ON_SITE' && !statusNormalized.includes('ON_SITE')) return false;
    if (filterStatus === 'REGISTERED' && (statusNormalized.includes('ON_SITE') || statusNormalized.includes('COMPLETED'))) return false;
    if (filterStatus === 'COMPLETED' && !statusNormalized.includes('COMPLETED')) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.phone.toLowerCase().includes(q) ||
        m.mission_title.toLowerCase().includes(q) ||
        m.district.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col space-y-6 bg-white rounded-2xl border border-slate-200 p-6 overflow-y-auto shadow-sm">
      {/* 1. Header & Live Telemetry Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Shelter Volunteer Forces & Member Roster</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>LIVE RECEPTION SYNC</span>
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time operational visibility: Monitor volunteer arrivals per shelter to clear food trucks and medical shipments.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all text-xs font-semibold flex items-center gap-1.5"
            title="Refresh volunteer roster"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Ledger</span>
          </button>
        </div>
      </div>

      {/* Action Toast Alert */}
      {actionToast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionToast}</span>
        </div>
      )}

      {/* 2. Operational KPIs Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Enrolled Volunteers</div>
            <div className="text-xl font-black text-slate-900">{summary.total_registered} Registered</div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-emerald-700 uppercase">On-Site Verified</div>
            <div className="text-xl font-black text-emerald-800">{summary.total_onsite} Active On-Site</div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/30 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-purple-100 text-purple-700 border border-purple-200">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-purple-700 uppercase">Shifts Completed</div>
            <div className="text-xl font-black text-purple-800">{summary.total_completed} Shifts Logged</div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 border border-amber-200">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-amber-700 uppercase">Supply Truck Clearance</div>
            <div className="text-xs font-bold text-slate-900 mt-0.5">
              {shelterBreakdowns.filter((s) => s.is_coverage_sufficient).length} / {shelterBreakdowns.length} Shelters Cleared
            </div>
          </div>
        </div>
      </div>

      {/* 3. Shelter Force Coverage & Readiness Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
            <Truck className="w-4 h-4 text-slate-600" />
            <span>Shelter Volunteer Coverage & Supply Dispatch Readiness</span>
          </h3>
          <span className="text-xs text-slate-500">
            Rule: Food trucks and medical drops require on-site volunteer support to distribute safely.
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shelterBreakdowns.map((group) => {
            const pct = group.target_volunteers > 0
              ? Math.min(100, Math.round((group.onsite_volunteers / group.target_volunteers) * 100))
              : 0;

            return (
              <div
                key={group.shelter_id}
                className={`p-4 rounded-xl border transition-all ${
                  group.is_coverage_sufficient
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{group.shelter_name}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{group.address}</span>
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      group.is_coverage_sufficient
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {group.is_coverage_sufficient ? 'READY FOR TRUCK' : 'NEED VOLUNTEERS'}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mt-3 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-600">
                    <span>On-Site Forces:</span>
                    <span className="font-bold text-slate-900">
                      {group.onsite_volunteers} / {group.target_volunteers} Target ({group.registered_volunteers} Enrolled)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        pct >= 50 ? 'bg-emerald-500' : pct >= 25 ? 'bg-amber-500' : 'bg-slate-300'
                      }`}
                      style={{ width: `${Math.max(5, pct)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Operational Recommendation & Action */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <p className="text-[10px] font-medium text-slate-500 leading-tight line-clamp-2">
                    {group.supply_dispatch_recommendation}
                  </p>
                  {group.is_coverage_sufficient ? (
                    <button
                      onClick={() => onOpenSuppliesForShelter && onOpenSuppliesForShelter(group)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shrink-0 shadow-sm"
                    >
                      <Truck className="w-3 h-3" />
                      <span>Dispatch</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-amber-700 font-bold flex items-center gap-0.5 shrink-0">
                      <Clock className="w-3 h-3" />
                      <span>Awaiting</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Live Member Attendance Table */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Live Member Roster & Verification Ledger
            </h3>
            <p className="text-xs text-slate-500">
              Each volunteer's check-in status updates immediately when they tap on-site verification in the mobile app.
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search volunteer name, phone..."
                className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-52"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setFilterStatus('ALL')}
                className={`px-2.5 py-1 rounded font-medium ${
                  filterStatus === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({roster.length})
              </button>
              <button
                onClick={() => setFilterStatus('ON_SITE')}
                className={`px-2.5 py-1 rounded font-medium ${
                  filterStatus === 'ON_SITE' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                On-Site ({summary.total_onsite})
              </button>
              <button
                onClick={() => setFilterStatus('REGISTERED')}
                className={`px-2.5 py-1 rounded font-medium ${
                  filterStatus === 'REGISTERED' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                En Route
              </button>
            </div>
          </div>
        </div>

        {/* Member Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                <th className="py-3 px-4">Volunteer Member</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4">Mission Assignment</th>
                <th className="py-3 px-4">District</th>
                <th className="py-3 px-4">Enrolled At</th>
                <th className="py-3 px-4">Live Status</th>
                <th className="py-3 px-4 text-right">Officer Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRoster.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    No volunteer records match the active search or filter.
                  </td>
                </tr>
              ) : (
                filteredRoster.map((vol) => {
                  const isVerified = (vol.status || '').toUpperCase().includes('ON_SITE');
                  const isCompleted = (vol.status || '').toUpperCase().includes('COMPLETED');
                  const isBusy = actionLoadingId === `${vol.user_id}-${vol.opportunity_id}`;

                  return (
                    <tr key={`${vol.notification_id}-${vol.opportunity_id}`} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-black text-xs flex items-center justify-center">
                          {vol.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div>{vol.name}</div>
                          <div className="text-[10px] text-slate-400 font-normal">ID: {vol.user_id?.slice(0, 8)}...</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        <a href={`tel:${vol.phone}`} className="flex items-center gap-1 hover:text-emerald-600 transition-colors">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{vol.phone}</span>
                        </a>
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-medium max-w-xs truncate">
                        {vol.mission_title}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {vol.district}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {vol.joined_at ? new Date(vol.joined_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="py-3 px-4">
                        {isCompleted ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[10px] flex items-center gap-1 w-fit">
                            <Award className="w-3 h-3 text-blue-600" />
                            <span>COMPLETED</span>
                          </span>
                        ) : isVerified ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px] flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>ON-SITE VERIFIED</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[10px] flex items-center gap-1 w-fit">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>REGISTERED (EN ROUTE)</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {!isVerified && !isCompleted && (
                          <button
                            onClick={() => handleUpdateMemberStatus(vol.user_id, vol.opportunity_id, 'ON_SITE_VERIFIED')}
                            disabled={isBusy}
                            className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold text-[11px] transition-all"
                          >
                            {isBusy ? 'Saving...' : '✓ Verify Arrival'}
                          </button>
                        )}
                        {isVerified && !isCompleted && (
                          <button
                            onClick={() => handleUpdateMemberStatus(vol.user_id, vol.opportunity_id, 'COMPLETED')}
                            disabled={isBusy}
                            className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-bold text-[11px] transition-all"
                          >
                            {isBusy ? 'Saving...' : '★ Mark Completed'}
                          </button>
                        )}
                        {isCompleted && (
                          <span className="text-[11px] text-slate-400 font-medium">Logged</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
