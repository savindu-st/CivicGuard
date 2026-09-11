import React, { useEffect, useState, useRef } from 'react';
import {
  ShieldAlert,
  Navigation,
  CheckCircle2,
  AlertOctagon,
  Clock,
  RotateCcw,
  Camera,
  MapPin,
  Radio,
  WifiOff,
  Wifi,
  ChevronRight,
  Layers,
  PhoneCall,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useSocket } from '../../hooks/useSocket';
import {
  queuePendingAction,
  getPendingActions,
  syncPendingActions,
  PendingAction,
} from '../../utils/offlineSync';
import { GpsBeaconSimulator } from '../../components/crews/GpsBeaconSimulator';
import { CrewNavigationMap } from '../../components/crews/CrewNavigationMap';
import { CrewTaskHistory } from '../../components/crews/CrewTaskHistory';

export const FieldCrewPortal: React.FC = () => {
  const { user } = useAuthStore();
  const [crew, setCrew] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingQueue, setPendingQueue] = useState<PendingAction[]>([]);
  const [rerouteTrigger, setRerouteTrigger] = useState<boolean>(false);

  // Modals state
  const [showCompleteModal, setShowCompleteModal] = useState<boolean>(false);
  const [showReturnModal, setShowReturnModal] = useState<boolean>(false);
  const [showSosModal, setShowSosModal] = useState<boolean>(false);

  // Form states
  const [resolutionPhoto, setResolutionPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [returnReason, setReturnReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Socket for real-time dispatch alerts
  useSocket({
    crewId: crew?.id,
    onEvent: (event, payload) => {
      if (event === 'ticket:assigned') {
        fetchCrewProfile();
        setActionSuccessMessage('🚨 New Response Order Assigned to Your Crew!');
      } else if (event === 'road:closed' || event === 'hazard:created') {
        setRerouteTrigger((prev) => !prev);
      }
    },
  });

  // Network online/offline event listeners
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      const res = await syncPendingActions(api);
      if (res.synced > 0) {
        setActionSuccessMessage(`Synced ${res.synced} offline updates to server`);
        refreshPendingQueue();
        fetchCrewProfile();
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    refreshPendingQueue();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const refreshPendingQueue = async () => {
    const items = await getPendingActions();
    setPendingQueue(items);
  };

  const fetchCrewProfile = async () => {
    try {
      const res = await api.get('/api/tickets/crews/me');
      const data = res.data?.data;
      if (data?.crew) {
        setCrew(data.crew);
        const taskList = data.tasks || [];
        setTasks(taskList);

        // Select first non-completed task as active if not set
        const active = taskList.find((t: any) => ['IN_PROGRESS', 'ACCEPTED', 'ASSIGNED'].includes(t.status));
        if (active) {
          setActiveTicketId(active.id);
        }
      }
    } catch (err: any) {
      console.warn('Could not fetch crew profile via /me:', err.message);
      // Fallback: fetch directly using demo crew ID
      try {
        const resAll = await api.get('/api/tickets/crews');
        const crews = resAll.data?.data?.crews || [];
        const myCrew = crews.find((c: any) => c.user_id === user?.userId) || crews[0];
        if (myCrew) {
          setCrew(myCrew);
          const tasksRes = await api.get(`/api/tickets/crews/${myCrew.id}/tasks`);
          const taskList = tasksRes.data?.data?.tasks || [];
          setTasks(taskList);
          const active = taskList.find((t: any) => ['IN_PROGRESS', 'ACCEPTED', 'ASSIGNED'].includes(t.status));
          if (active) setActiveTicketId(active.id);
        }
      } catch {}
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCrewProfile();
  }, [user]);

  // Handle availability update
  const handleAvailabilityChange = async (availability: 'AVAILABLE' | 'BUSY' | 'OFF_DUTY') => {
    if (!crew) return;
    try {
      await api.patch(`/api/tickets/crews/${crew.id}/availability`, { availability });
      setCrew((prev: any) => ({ ...prev, availability }));
    } catch (e: any) {
      alert(`Failed to update status: ${e.message}`);
    }
  };

  // Handle ticket lifecycle status transition
  const handleStatusTransition = async (ticketId: string, nextStatus: 'ACCEPTED' | 'IN_PROGRESS') => {
    setIsSubmitting(true);
    try {
      if (!isOnline) {
        await queuePendingAction({
          type: 'STATUS_UPDATE',
          ticketId,
          payload: { status: nextStatus },
        });
        await refreshPendingQueue();
        // Optimistically update local state
        setTasks((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status: nextStatus } : t)));
      } else {
        await api.patch(`/api/tickets/${ticketId}/status`, { status: nextStatus });
        fetchCrewProfile();
      }
    } catch (e: any) {
      alert(`Error updating ticket status: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Photo Proof Resolution Completion
  const handleCompleteTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicketId) return;

    if (!resolutionPhoto && !photoPreview) {
      alert('Resolution proof photo is mandatory to close ticket and reopen roads');
      return;
    }

    setIsSubmitting(true);
    try {
      if (!isOnline) {
        await queuePendingAction({
          type: 'COMPLETE_TICKET',
          ticketId: activeTicketId,
          photoBlob: resolutionPhoto || undefined,
          payload: { notes: resolutionNotes },
        });
        await refreshPendingQueue();
        setShowCompleteModal(false);
        setActionSuccessMessage('Task resolution queued offline. Will sync once connectivity returns.');
        setTasks((prev) =>
          prev.map((t) => (t.id === activeTicketId ? { ...t, status: 'COMPLETED' } : t))
        );
      } else {
        const formData = new FormData();
        if (resolutionPhoto) {
          formData.append('photo', resolutionPhoto);
        }
        if (resolutionNotes) {
          formData.append('notes', resolutionNotes);
        }

        await api.post(`/api/tickets/${activeTicketId}/complete`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        setShowCompleteModal(false);
        setActionSuccessMessage('Ticket completed! Resolution verified & road reopened on public map.');
        setResolutionPhoto(null);
        setPhotoPreview(null);
        setResolutionNotes('');
        fetchCrewProfile();
      }
    } catch (e: any) {
      alert(`Error completing ticket: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Task Return
  const handleReturnTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicketId || !returnReason) return;

    setIsSubmitting(true);
    try {
      if (!isOnline) {
        await queuePendingAction({
          type: 'RETURN_TICKET',
          ticketId: activeTicketId,
          payload: { reason: returnReason, crew_id: crew?.id },
        });
        await refreshPendingQueue();
        setShowReturnModal(false);
        setActionSuccessMessage('Ticket return queued offline.');
        setTasks((prev) => prev.filter((t) => t.id !== activeTicketId));
      } else {
        await api.post(`/api/tickets/${activeTicketId}/return`, {
          reason: returnReason,
          crew_id: crew?.id,
        });
        setShowReturnModal(false);
        setReturnReason('');
        setActionSuccessMessage('Ticket returned to council dispatch queue.');
        fetchCrewProfile();
      }
    } catch (e: any) {
      alert(`Error returning ticket: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle SOS Emergency Panic Beacon
  const handleTriggerSos = async () => {
    if (!crew) return;
    setIsSubmitting(true);
    try {
      await api.post(`/api/tickets/crews/${crew.id}/sos`, {
        latitude: crew.latitude || 6.879,
        longitude: crew.longitude || 79.866,
        message: 'EMERGENCY: Field crew unit requested immediate backup / rescue intervention!',
      });
      setShowSosModal(false);
      setActionSuccessMessage('🚨 EMERGENCY SOS SENT: Dispatchers alerted with live telemetry.');
    } catch (e: any) {
      alert(`SOS transmit failed: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Active task object
  const activeTask = tasks.find((t) => t.id === activeTicketId);
  const pendingOrAssignedTasks = tasks.filter((t) =>
    ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'].includes(t.status)
  );

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col pb-12">
      {/* High-Contrast Mobile Emergency Header */}
      <header className="border-b border-slate-800 bg-dark-900/90 backdrop-blur-md sticky top-0 z-40 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-white tracking-tight truncate max-w-[200px] sm:max-w-xs">
                  {crew?.crew_name || 'Field Response Unit'}
                </h1>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase">
                  {crew?.crew_type || 'ARMY / DMC RESCUE'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Lead: <span className="text-slate-300 font-medium">{crew?.user_name || 'Sunil Shantha'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* SOS Panic Trigger Button */}
            <button
              onClick={() => setShowSosModal(true)}
              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs tracking-wider flex items-center gap-1.5 shadow-lg shadow-red-600/30 animate-pulse border border-red-400"
            >
              <AlertOctagon className="w-4 h-4" />
              <span>SOS</span>
            </button>

            {/* Offline Status Badge */}
            <div
              className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 ${
                isOnline
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              }`}
              title={isOnline ? 'Network Connected' : 'Working Offline'}
            >
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            </div>
          </div>
        </div>
      </header>

      {/* Alert Notification Toast */}
      {actionSuccessMessage && (
        <div className="max-w-4xl mx-auto w-full px-4 pt-3">
          <div className="p-3 bg-brand-500/20 border border-brand-500/40 rounded-xl text-xs font-semibold text-brand-300 flex items-center justify-between shadow-lg">
            <span>{actionSuccessMessage}</span>
            <button
              onClick={() => setActionSuccessMessage(null)}
              className="text-slate-400 hover:text-white ml-2 text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-4xl mx-auto w-full p-4 space-y-4 flex-1">
        {/* Availability & Shift Status Selector */}
        <div className="glass-panel p-3 bg-dark-900/80 flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-slate-400" /> Operational Readiness:
          </span>
          <div className="flex rounded-lg bg-dark-950 p-1 border border-slate-800 text-xs">
            {(['AVAILABLE', 'BUSY', 'OFF_DUTY'] as const).map((status) => (
              <button
                key={status}
                onClick={() => handleAvailabilityChange(status)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  crew?.availability === status
                    ? status === 'AVAILABLE'
                      ? 'bg-emerald-500 text-dark-950 shadow'
                      : status === 'BUSY'
                      ? 'bg-orange-500 text-white shadow'
                      : 'bg-slate-700 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Multi-Ticket Proximity Tabs (if multiple tickets assigned) */}
        {pendingOrAssignedTasks.length > 1 && (
          <div className="glass-panel p-3 bg-dark-900/80 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-blue-400" /> Multi-Incident Queue ({pendingOrAssignedTasks.length} Assigned):
              </span>
              <span className="text-[11px] text-amber-400">Co-assigned within 2 km</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {pendingOrAssignedTasks.map((t, idx) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTicketId(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                    activeTicketId === t.id
                      ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                      : 'bg-dark-850 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  #{idx + 1}: {t.incidents?.incident_type?.replace(/_/g, ' ') || 'Incident'} ({t.status})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active Response Order Card */}
        {activeTask ? (
          <div className="glass-panel p-5 bg-dark-900/90 border border-slate-700/80 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      activeTask.priority === 'CRITICAL'
                        ? 'bg-red-500/20 text-red-400 border-red-500/30'
                        : activeTask.priority === 'HIGH'
                        ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                        : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                    }`}
                  >
                    PRIORITY {activeTask.priority}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    STATUS: <span className="text-brand-400">{activeTask.status}</span>
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1.5">
                  {activeTask.incidents?.incident_type?.replace(/_/g, ' ') || 'Hazard Clearance'}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                  <span className="font-semibold text-white">{activeTask.incidents?.roads?.name || 'Road Segment'}</span>, {activeTask.incidents?.wards?.name || 'Ward'}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 flex items-center gap-1 justify-end">
                  <Clock className="w-3 h-3" />
                  {new Date(activeTask.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                  ID: #{activeTask.id.slice(0, 8)}
                </span>
              </div>
            </div>

            {/* Description & Citizen Report Info */}
            {activeTask.incidents?.description && (
              <div className="p-3 rounded-xl bg-dark-950/70 border border-slate-800/80 text-xs text-slate-300">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
                  Citizen Hazard Description:
                </span>
                "{activeTask.incidents.description}"
              </div>
            )}

            {/* Tactical Safe Detour Navigation Map */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-emerald-400" /> Tactical Detour Route (Live GPS):
                </span>
                <span className="text-[11px] text-slate-400">Avoids closed roads & hazards</span>
              </div>

              <CrewNavigationMap
                crewLat={crew?.latitude || 6.879}
                crewLon={crew?.longitude || 79.866}
                crewName={crew?.crew_name}
                targetLat={activeTask.incidents?.latitude}
                targetLon={activeTask.incidents?.longitude}
                targetTitle={activeTask.incidents?.roads?.name || 'Incident Site'}
                hazardType={activeTask.incidents?.incident_type}
                onRerouteEvent={rerouteTrigger}
              />
            </div>

            {/* Step-by-Step Execution Action Buttons */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              {activeTask.status === 'ASSIGNED' && (
                <button
                  onClick={() => handleStatusTransition(activeTask.id, 'ACCEPTED')}
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-brand-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Accept Assignment & Depart</span>
                </button>
              )}

              {activeTask.status === 'ACCEPTED' && (
                <button
                  onClick={() => handleStatusTransition(activeTask.id, 'IN_PROGRESS')}
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Arrived on Site — Begin Clearance</span>
                </button>
              )}

              {activeTask.status === 'IN_PROGRESS' && (
                <button
                  onClick={() => setShowCompleteModal(true)}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm tracking-wide shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 border border-emerald-400"
                >
                  <Camera className="w-5 h-5" />
                  <span>Verify Resolution with Photo Proof</span>
                </button>
              )}

              {/* Unable to complete / return ticket option */}
              <button
                onClick={() => setShowReturnModal(true)}
                className="w-full py-2 rounded-lg bg-dark-950 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/40 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Unable to Complete / Return to Council Queue</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="glass-panel p-8 text-center space-y-3 bg-dark-900/60 border-slate-800">
            <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-slate-400">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-base font-bold text-white">No Active Response Orders</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Your crew is currently standing by. Council officers will dispatch high-priority disaster tickets to your terminal in real-time.
            </p>
          </div>
        )}

        {/* GPS Telemetry Beacon Simulator */}
        {crew && (
          <GpsBeaconSimulator
            crewId={crew.id}
            hasActiveTask={Boolean(activeTask)}
            onLocationUpdate={(lat, lon) => {
              setCrew((prev: any) => ({ ...prev, latitude: lat, longitude: lon }));
            }}
          />
        )}

        {/* Completed Shift History */}
        <div className="glass-panel p-5 bg-dark-900/80 rounded-2xl space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" /> Completed Clearance Missions
          </h4>
          <CrewTaskHistory tasks={tasks} />
        </div>
      </main>

      {/* --- MODAL 1: Photo-Verified Task Completion Modal --- */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-dark-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400" /> Submit Resolution Photo Proof
              </h3>
              <button
                onClick={() => setShowCompleteModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCompleteTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Resolution Proof Photo <span className="text-red-400">* (Mandatory)</span>
                </label>
                <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-xl p-4 text-center cursor-pointer bg-dark-950/60 relative">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    required
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setResolutionPhoto(file);
                        setPhotoPreview(URL.createObjectURL(file));
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  {photoPreview ? (
                    <div className="space-y-2">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="max-h-40 mx-auto rounded-lg object-cover border border-slate-700"
                      />
                      <span className="text-[11px] text-emerald-400 font-semibold block">
                        Photo selected. Tap to change.
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1.5 text-slate-400">
                      <Camera className="w-8 h-8 mx-auto text-slate-500" />
                      <p className="text-xs font-medium text-slate-300">Tap to Capture Camera Photo</p>
                      <p className="text-[10px] text-slate-500">
                        Shows road cleared or water pumped down
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Field Resolution Notes (Optional)
                </label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g. Fallen tree cut and hauled away. Drainage culvert unblocked. Road safe for traffic."
                  rows={3}
                  className="w-full bg-dark-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300">
                Submitting this proof will automatically mark the ticket COMPLETED and reopen the road on the public map.
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30"
                >
                  {isSubmitting ? 'Uploading Proof...' : 'Verify & Reopen Road'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: Return Ticket Workflow Modal --- */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-dark-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-orange-400" /> Return Response Order
              </h3>
              <button onClick={() => setShowReturnModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleReturnTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Mandatory Return Justification <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="Explain why this order cannot be completed (e.g. Flood depth exceeds 1.5m, amphibious boat or heavy crane required, live electrical power line down)..."
                  rows={4}
                  className="w-full bg-dark-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-600/30"
                >
                  {isSubmitting ? 'Returning...' : 'Return to Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: Emergency SOS Panic Beacon Confirmation --- */}
      {showSosModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-dark-950 border-2 border-red-500 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl shadow-red-500/30">
            <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center mx-auto text-red-500 animate-pulse">
              <AlertOctagon className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-white tracking-tight">CONFIRM SOS PANIC BEACON</h3>
              <p className="text-xs text-red-300 mt-1">
                This triggers a critical priority emergency siren across all Council Officer command terminals with your live GPS location.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-dark-900 border border-slate-800 text-xs text-slate-300 text-left space-y-1">
              <p>
                <strong>Crew:</strong> {crew?.crew_name}
              </p>
              <p>
                <strong>Location:</strong> {crew?.latitude?.toFixed(5)}, {crew?.longitude?.toFixed(5)}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSosModal(false)}
                className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleTriggerSos}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs shadow-xl shadow-red-600/40 animate-bounce border border-red-400"
              >
                {isSubmitting ? 'Transmitting...' : 'CONFIRM SOS'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default FieldCrewPortal;
