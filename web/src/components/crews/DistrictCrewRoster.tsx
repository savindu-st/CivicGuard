import React, { useState } from 'react';
import {
  Users,
  Shield,
  LifeBuoy,
  Truck,
  HeartPulse,
  Radio,
  Eye,
  AlertTriangle,
  Phone,
  MapPin,
  CheckCircle2,
  Clock,
  Send,
  Sparkles,
  Package,
} from 'lucide-react';

interface DistrictCrewRosterProps {
  crews: any[];
  selectedDistrict: string;
  incidents: any[];
  selectedIncidentId: string | null;
  onDispatchCrew?: (crewId: string, incidentId: string) => void;
  onSelectIncident?: (incidentId: string) => void;
}

export const DistrictCrewRoster: React.FC<DistrictCrewRosterProps> = ({
  crews,
  selectedDistrict,
  incidents,
  selectedIncidentId,
  onDispatchCrew,
  onSelectIncident,
}) => {
  const [filterSpecialty, setFilterSpecialty] = useState<string>('ALL');
  const [filterAvailability, setFilterAvailability] = useState<string>('ALL');

  const selectedIncident = incidents.find((i) => i.id === selectedIncidentId);

  const getSpecialtyBadge = (specialty: string) => {
    switch (specialty) {
      case 'WATER_RESCUE':
        return {
          label: 'Water Rescue',
          icon: <LifeBuoy className="w-3.5 h-3.5 text-blue-600" />,
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      case '4X4_DEBRIS':
        return {
          label: '4x4 Clearance',
          icon: <Truck className="w-3.5 h-3.5 text-amber-600" />,
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'MEDICAL_TRIAGE':
        return {
          label: 'Medical Triage',
          icon: <HeartPulse className="w-3.5 h-3.5 text-rose-600" />,
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
        };
      case 'DRONE_RECON':
        return {
          label: 'Drone Recon',
          icon: <Eye className="w-3.5 h-3.5 text-purple-600" />,
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
        };
      case 'HAZMAT_EVAC':
        return {
          label: 'Hazmat / Evac',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />,
          bg: 'bg-orange-50 text-orange-700 border-orange-200',
        };
      case 'HAM_RADIO':
        return {
          label: 'Comms / Radio',
          icon: <Radio className="w-3.5 h-3.5 text-emerald-600" />,
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      default:
        return {
          label: specialty || 'General Rescue',
          icon: <Shield className="w-3.5 h-3.5 text-slate-600" />,
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
        };
    }
  };

  const getAvailabilityBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return {
          label: 'Available / On-Duty',
          dot: 'bg-emerald-500',
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'BUSY':
      case 'DISPATCHED':
        return {
          label: 'Dispatched / Engaged',
          dot: 'bg-amber-500 animate-pulse',
          badge: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'OFF_DUTY':
        return {
          label: 'Off-Duty / Standby',
          dot: 'bg-slate-400',
          badge: 'bg-slate-50 text-slate-600 border-slate-200',
        };
      default:
        return {
          label: status,
          dot: 'bg-slate-400',
          badge: 'bg-slate-50 text-slate-600 border-slate-200',
        };
    }
  };

  const filteredCrews = crews.filter((c) => {
    const matchSpecialty = filterSpecialty === 'ALL' || c.specialty === filterSpecialty;
    const matchAvailability = filterAvailability === 'ALL' || c.availability === filterAvailability;
    return matchSpecialty && matchAvailability;
  });

  const availableCount = crews.filter((c) => c.availability === 'AVAILABLE').length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>{selectedDistrict} District Command Roster</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-extrabold border border-blue-200">
                  {crews.length} Assigned Squads
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                10 Specialized Field Crews directly managed by {selectedDistrict} District Officer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{availableCount} Ready for Dispatch</span>
          </div>
        </div>

        {/* Action Prompt if Incident is Selected */}
        {selectedIncident ? (
          <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-blue-900">
              <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>
                Target Incident: <strong>{selectedIncident.title || selectedIncident.incident_type}</strong> (Priority: {selectedIncident.priority || 'HIGH'})
              </span>
            </div>
            <span className="text-[11px] font-bold text-blue-700">Click Dispatch below</span>
          </div>
        ) : (
          <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Select an incident from the Triage Map to dispatch squads with 1-click order.</span>
          </div>
        )}

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
          <select
            value={filterSpecialty}
            onChange={(e) => setFilterSpecialty(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium text-xs focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Specialties (5 Tracks)</option>
            <option value="WATER_RESCUE">Water Rescue</option>
            <option value="4X4_DEBRIS">4x4 Winch & Debris</option>
            <option value="MEDICAL_TRIAGE">Medical & Trauma</option>
            <option value="DRONE_RECON">Drone Recon UAV</option>
            <option value="HAZMAT_EVAC">Hazmat & Evac</option>
            <option value="HAM_RADIO">HAM Radio Comms</option>
          </select>

          <select
            value={filterAvailability}
            onChange={(e) => setFilterAvailability(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium text-xs focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="AVAILABLE">Available Only</option>
            <option value="BUSY">Dispatched Only</option>
            <option value="OFF_DUTY">Off-Duty</option>
          </select>
        </div>
      </div>

      {/* Crew Cards List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredCrews.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No squads match current filters in {selectedDistrict} district.
          </div>
        ) : (
          filteredCrews.map((crew, idx) => {
            const spec = getSpecialtyBadge(crew.specialty);
            const avail = getAvailabilityBadge(crew.availability);

            return (
              <div
                key={crew.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-xs transition-all flex flex-col gap-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-mono font-bold text-xs flex items-center justify-center border border-slate-200">
                      #{idx + 1}
                    </span>
                    <div>
                      <h3 className="text-xs font-extrabold text-slate-900 leading-tight">
                        {crew.crew_name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-400" />
                          <span>{crew.user_name || 'Squad Lead'}</span>
                        </span>
                        {crew.phone && (
                          <span className="flex items-center gap-1 font-mono text-slate-600">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{crew.phone}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${spec.bg}`}
                    >
                      {spec.icon}
                      <span>{spec.label}</span>
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${avail.badge}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${avail.dot}`} />
                      <span>{avail.label}</span>
                    </span>
                  </div>
                </div>

                {/* Equipment Chips */}
                {crew.equipment && Array.isArray(crew.equipment) && crew.equipment.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-100">
                    <Package className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    {crew.equipment.slice(0, 3).map((eq: string, eqIdx: number) => (
                      <span
                        key={eqIdx}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200"
                      >
                        {eq}
                      </span>
                    ))}
                    {crew.equipment.length > 3 && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        +{crew.equipment.length - 3} more gear
                      </span>
                    )}
                  </div>
                )}

                {/* Footer with GPS & Dispatch Action */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                  <div className="flex items-center gap-1 font-mono text-slate-400 text-[10px]">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>
                      {Number(crew.latitude).toFixed(4)}, {Number(crew.longitude).toFixed(4)}
                    </span>
                  </div>

                  {selectedIncident && crew.availability === 'AVAILABLE' && onDispatchCrew && (
                    <button
                      onClick={() => onDispatchCrew(crew.id, selectedIncident.id)}
                      className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      <span>Dispatch Squad</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
