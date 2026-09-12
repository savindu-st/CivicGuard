import React, { useState, useMemo } from 'react';
import {
  X,
  Home,
  Users,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Plus,
  Minus,
  Sparkles,
  MapPin,
  ArrowRight,
} from 'lucide-react';
import { api } from '../../services/api';

export interface NearestShelterMatcherModalProps {
  request: any | null;
  shelters: any[];
  isOpen: boolean;
  onClose: () => void;
  onMatched: (result: any) => void;
}

export const NearestShelterMatcherModal: React.FC<NearestShelterMatcherModalProps> = ({
  request,
  shelters,
  isOpen,
  onClose,
  onMatched,
}) => {
  if (!isOpen || !request) return null;

  const initialPeople = request.people_count && request.people_count > 0 ? Number(request.people_count) : 1;
  const [headcount, setHeadcount] = useState<number>(initialPeople);
  const [selectedShelterId, setSelectedShelterId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Haversine distance calculator
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // Evaluate candidate shelters ranked by proximity with headcount validation
  const candidates = useMemo(() => {
    if (!request.latitude || !request.longitude) return [];

    const reqLat = Number(request.latitude);
    const reqLon = Number(request.longitude);

    const evaluated = shelters
      .filter((s) => s.is_active && s.latitude && s.longitude)
      .map((s) => {
        const capacity = s.capacity || 100;
        const occupancy = s.current_occupancy || 0;
        const availableBeds = Math.max(0, capacity - occupancy);
        const dist = calculateDistance(reqLat, reqLon, Number(s.latitude), Number(s.longitude));
        const travelMinutes = Math.round((dist / 30) * 60) + 5; // ~30 km/h average + 5 min delay
        const hasCapacity = availableBeds >= headcount;
        const remainingBedsAfter = availableBeds - headcount;

        return {
          ...s,
          distanceKm: parseFloat(dist.toFixed(2)),
          travelMinutes,
          availableBeds,
          hasCapacity,
          remainingBedsAfter,
        };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return evaluated;
  }, [shelters, request, headcount]);

  // Pre-select top shelter with sufficient capacity
  useMemo(() => {
    const topValid = candidates.find((c) => c.hasCapacity);
    if (topValid) {
      setSelectedShelterId(topValid.id);
    } else if (candidates.length > 0) {
      setSelectedShelterId(candidates[0].id);
    }
  }, [candidates]);

  const activeCandidate = candidates.find((c) => c.id === selectedShelterId);

  // Handle atomic reservation submission (ADR-011)
  const handleConfirmReservation = async () => {
    if (!activeCandidate) {
      setErrorMessage('Please select a candidate shelter to reserve.');
      return;
    }

    if (!activeCandidate.hasCapacity) {
      setErrorMessage(
        `Selected shelter does not have enough capacity for ${headcount} people (${activeCandidate.availableBeds} beds available).`
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        latitude: Number(request.latitude),
        longitude: Number(request.longitude),
        people_count: Number(headcount),
        auto_reserve: true,
        help_request_id: request.id,
      };

      const res = await api.post('/api/relief/match-shelter', payload);
      const matchResult = res.data?.data;

      onMatched(matchResult);
      onClose();
    } catch (err: any) {
      console.error('Failed to reserve shelter beds:', err);
      setErrorMessage(err.message || 'Failed to execute atomic bed reservation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-600">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Nearest Shelter Matcher & Capacity Validation</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                  ADR-011 ATOMIC
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Proximity-ranked disaster shelter matching with household headcount verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 border border-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Target SOS Distress Call Summary */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <span>Distress Incident Details</span>
              </span>
              <span className="badge-critical font-bold text-[10px]">
                {request.urgency} • {request.help_type}
              </span>
            </div>
            <p className="text-xs text-slate-800 font-normal leading-relaxed">
              {request.description || 'Citizen emergency shelter request.'}
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-200">
              <span>👤 {request.users?.name || request.user_name || 'Citizen'}</span>
              <span className="font-mono text-[10px]">
                GPS: {Number(request.latitude).toFixed(4)}, {Number(request.longitude).toFixed(4)}
              </span>
            </div>
          </div>

          {/* Household Headcount Validation Input */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-brand-600" />
                  <span>Household Headcount Validation</span>
                </label>
                <p className="text-[11px] text-slate-500">
                  Total family members requiring emergency beds (infants, children, elderly)
                </p>
              </div>

              {/* Headcount Number Controls */}
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-300">
                <button
                  type="button"
                  onClick={() => setHeadcount(Math.max(1, headcount - 1))}
                  className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                  title="Decrease family count"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={headcount}
                  onChange={(e) => setHeadcount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-12 text-center bg-transparent font-bold text-sm text-slate-900 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setHeadcount(headcount + 1)}
                  className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                  title="Increase family count"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] text-slate-500 font-semibold pl-1 border-l border-slate-200">
                  {headcount === 1 ? 'Person' : 'People'}
                </span>
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Ranked Proximity Candidates List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-sky-600" />
                <span>Candidate Shelters Ranked by Proximity ({candidates.length})</span>
              </span>
              <span className="text-slate-500 text-[11px]">Selecting closest with full capacity</span>
            </div>

            <div className="space-y-2">
              {candidates.map((candidate, idx) => {
                const isSelected = selectedShelterId === candidate.id;
                const percent = Math.round((candidate.current_occupancy / candidate.capacity) * 100);

                return (
                  <div
                    key={candidate.id}
                    onClick={() => setSelectedShelterId(candidate.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-sky-50/50 border-sky-400 shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Left: Info */}
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-white border border-slate-300 flex items-center justify-center text-[10px] font-mono text-slate-700">
                              #{idx + 1}
                            </span>
                            <span>{candidate.name}</span>
                          </span>
                          {idx === 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-brand-50 text-brand-700 border border-brand-200">
                              CLOSEST
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {candidate.address || candidate.wards?.name || 'Sector'}
                        </p>

                        {/* Headcount Capacity Validation Check Banner */}
                        <div className="pt-1.5 flex items-center gap-2">
                          {candidate.hasCapacity ? (
                            <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Passes Headcount Check: {candidate.availableBeds} beds available ({candidate.remainingBedsAfter} remaining after placement)</span>
                            </div>
                          ) : (
                            <div className="text-[11px] text-red-700 font-semibold flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                              <span>Insufficient Beds: Only {candidate.availableBeds} beds available for {headcount} members</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Distance & Live Gauge */}
                      <div className="text-right space-y-1 flex-shrink-0">
                        <div className="font-bold text-sm text-slate-900 font-mono flex items-center justify-end gap-1">
                          <Navigation className="w-3.5 h-3.5 text-sky-600" />
                          <span>{candidate.distanceKm} km</span>
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>~{candidate.travelMinutes} mins</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {candidate.current_occupancy} / {candidate.capacity} Occupied ({percent}%)
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            {activeCandidate ? (
              <span>
                Target: <strong className="text-slate-900">{activeCandidate.name}</strong> •{' '}
                <strong className={activeCandidate.hasCapacity ? 'text-emerald-700' : 'text-red-700'}>
                  {activeCandidate.hasCapacity ? 'Valid Capacity' : 'Exceeds Capacity'}
                </strong>
              </span>
            ) : (
              <span>Select a candidate shelter</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmReservation}
              disabled={isSubmitting || !activeCandidate || !activeCandidate.hasCapacity}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs tracking-wide shadow-sm flex items-center gap-2 transition-all ${
                !activeCandidate || !activeCandidate.hasCapacity
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                  : 'bg-sky-600 hover:bg-sky-700 text-white border border-sky-500'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Executing Atomic Reservation...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirm Allocation & Reserve {headcount} Beds</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
