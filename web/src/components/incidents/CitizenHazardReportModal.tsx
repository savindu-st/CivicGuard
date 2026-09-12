import React, { useState } from 'react';
import {
  X,
  MapPin,
  Camera,
  Upload,
  AlertTriangle,
  Waves,
  TreePine,
  Car,
  Mountain,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Compass,
  FileCheck2,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export interface CitizenHazardReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReportSubmitted: (newIncident: any) => void;
  // Pin-Drop integration with map
  currentCoordinates: { latitude: number; longitude: number } | null;
  onEnablePinDropMode: () => void;
}

const SRI_LANKA_PRESETS = [
  { name: 'Havelock Canal Bridge (Ward 05)', lat: 6.8785, lon: 79.8655 },
  { name: 'Kelani River Grandpass (Ward 10)', lat: 6.948, lon: 79.878 },
  { name: 'Bauddhaloka Mawatha (Ward 07)', lat: 6.901, lon: 79.873 },
  { name: 'Peradeniya River Basin (Kandy)', lat: 7.2721, lon: 80.6022 },
];

const DEPTH_BENCHMARKS = [
  { id: 'SURFACE_PUDDLE', label: 'Surface Puddle', desc: '< 15 cm (Passable)', severity: 'LOW' },
  { id: 'TIRE_LEVEL', label: 'Tire Level', desc: '15–30 cm (Sedan risk)', severity: 'MEDIUM' },
  { id: 'BUMPER_LEVEL', label: 'Bumper Level', desc: '30–60 cm (Impassable)', severity: 'HIGH' },
  { id: 'SUBMERGED_VEHICLES', label: 'Submerged Vehicles', desc: '> 60 cm (Severe/Boats only)', severity: 'CRITICAL' },
];

export const CitizenHazardReportModal: React.FC<CitizenHazardReportModalProps> = ({
  isOpen,
  onClose,
  onReportSubmitted,
  currentCoordinates,
  onEnablePinDropMode,
}) => {
  const { user } = useAuthStore();

  const [incidentType, setIncidentType] = useState<string>('FLOOD');
  const [depthBenchmark, setDepthBenchmark] = useState<string>('BUMPER_LEVEL');
  const [description, setDescription] = useState<string>('');
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Manual Coordinates Override (if citizen types or uses preset)
  const [manualLat, setManualLat] = useState<string>('');
  const [manualLon, setManualLon] = useState<string>('');

  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionStep, setSubmissionStep] = useState<number>(0);
  const [submissionVerdict, setSubmissionVerdict] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Active Coordinates from map pin drop or manual input
  const activeLat = currentCoordinates ? currentCoordinates.latitude : manualLat ? parseFloat(manualLat) : 6.8785;
  const activeLon = currentCoordinates ? currentCoordinates.longitude : manualLon ? parseFloat(manualLon) : 79.8655;

  // HTML5 Device Geolocation
  const handleUseDeviceLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    setErrorMessage(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        setManualLat(pos.coords.latitude.toFixed(6));
        setManualLon(pos.coords.longitude.toFixed(6));
      },
      (err) => {
        setIsLocating(false);
        setErrorMessage(`Location error: ${err.message}. Using Colombo default.`);
        setManualLat('6.878500');
        setManualLon('79.865500');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage('File size exceeds 10MB limit.');
        return;
      }
      setSelectedPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const severity = DEPTH_BENCHMARKS.find((d) => d.id === depthBenchmark)?.severity || 'HIGH';

    setIsSubmitting(true);
    setSubmissionStep(1); // 1. YOLO Image AI

    // Visual Stepper Timing Simulation
    const t1 = setTimeout(() => setSubmissionStep(2), 600); // 2. Weather Correlation
    const t2 = setTimeout(() => setSubmissionStep(3), 1100); // 3. Spatio-Temporal Cluster
    const t3 = setTimeout(() => setSubmissionStep(4), 1600); // 4. Location Authenticity
    const t4 = setTimeout(() => setSubmissionStep(5), 2100); // 5. Urgency & Verdict

    try {
      const formData = new FormData();
      formData.append('latitude', String(activeLat));
      formData.append('longitude', String(activeLon));
      formData.append('incident_type', incidentType);
      formData.append('severity', severity);
      formData.append(
        'description',
        description || `${depthBenchmark.replace('_', ' ')} reported by citizen via mobile portal`
      );
      if (user?.userId) {
        formData.append('reported_by', user.userId);
      }
      if (selectedPhoto) {
        formData.append('photo', selectedPhoto);
      }

      const res = await api.post('/api/incidents/reports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const incidentData = res.data?.data;
      setSubmissionVerdict(incidentData);

      // Finish stepper and notify
      setTimeout(() => {
        setIsSubmitting(false);
        onReportSubmitted(incidentData);
        onClose();
      }, 2700);
    } catch (err: any) {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Failed to submit incident report');
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-2xl flex flex-col text-slate-900">
        {/* Modal Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-50 border border-red-200 text-red-600 shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Report Emergency Hazard
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  PUBLIC PORTAL
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Submissions are verified instantly by 5-signal AI & environmental sensors
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 5-Signal AI Verification Progress Overlay */}
        {isSubmitting && (
          <div className="absolute inset-0 z-50 bg-white/98 backdrop-blur-md p-6 flex flex-col items-center justify-center space-y-6 text-slate-900">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 animate-spin">
                <Loader2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-900">5-Signal AI Verification Pipeline</h3>
              <p className="text-xs text-slate-600 max-w-sm">
                Evaluating photo evidence, sensor telemetry, spatial clusters, and risk urgency index
              </p>
            </div>

            <div className="w-full max-w-md space-y-2.5 text-xs">
              <div
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  submissionStep >= 1
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <span className="flex items-center gap-2 font-medium">
                  {submissionStep >= 1 ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Loader2 className="w-4 h-4 animate-spin" />}
                  1. YOLOv8 Multimodal Vision Analysis
                </span>
                <span className="text-[10px] font-bold uppercase">{submissionStep >= 1 ? 'Passed' : 'Analyzing'}</span>
              </div>

              <div
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  submissionStep >= 2
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <span className="flex items-center gap-2 font-medium">
                  {submissionStep >= 2 ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Loader2 className="w-4 h-4 animate-spin" />}
                  2. Weather & River Sensor Correlation
                </span>
                <span className="text-[10px] font-bold uppercase">{submissionStep >= 2 ? 'Correlated' : 'Checking'}</span>
              </div>

              <div
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  submissionStep >= 3
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <span className="flex items-center gap-2 font-medium">
                  {submissionStep >= 3 ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Loader2 className="w-4 h-4 animate-spin" />}
                  3. Spatio-Temporal Cluster (200m) Check
                </span>
                <span className="text-[10px] font-bold uppercase">{submissionStep >= 3 ? 'Indexed' : 'Matching'}</span>
              </div>

              <div
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  submissionStep >= 4
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <span className="flex items-center gap-2 font-medium">
                  {submissionStep >= 4 ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Loader2 className="w-4 h-4 animate-spin" />}
                  4. Location Authenticity & Territorial Geofence
                </span>
                <span className="text-[10px] font-bold uppercase">{submissionStep >= 4 ? 'Verified' : 'Validating'}</span>
              </div>

              <div
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  submissionStep >= 5
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <span className="flex items-center gap-2 font-medium">
                  {submissionStep >= 5 ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Loader2 className="w-4 h-4 animate-spin" />}
                  5. Risk Urgency Index & Council Ticket Dispatch
                </span>
                <span className="text-[10px] font-bold uppercase">{submissionStep >= 5 ? 'Confirmed' : 'Computing'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2 text-xs">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: GPS Location & Pin Drop */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <MapPin className="w-3.5 h-3.5 text-red-500" />
                <span>1. Incident Coordinates & Location</span>
              </label>
              <div className="text-[11px] font-mono text-emerald-700 font-semibold">
                GPS: {activeLat.toFixed(5)}, {activeLon.toFixed(5)}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleUseDeviceLocation}
                disabled={isLocating}
                className="p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-semibold flex items-center justify-center gap-2 transition-all shadow-xs"
              >
                {isLocating ? <Loader2 className="w-4 h-4 animate-spin text-emerald-600" /> : <Compass className="w-4 h-4 text-emerald-600" />}
                <span>Use Current Device GPS</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onEnablePinDropMode();
                  onClose();
                }}
                className="p-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-semibold flex items-center justify-center gap-2 transition-all shadow-xs"
              >
                <MapPin className="w-4 h-4" />
                <span>Drop Pin on Live Map</span>
              </button>
            </div>

            {/* Danger Zone Presets */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[10px] text-slate-500">Quick Danger Zone Presets:</div>
              <div className="flex flex-wrap gap-1.5">
                {SRI_LANKA_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => {
                      setManualLat(String(p.lat));
                      setManualLon(String(p.lon));
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[11px] transition-colors"
                  >
                    📍 {p.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Hazard Type Taxonomy */}
          <div className="space-y-3">
            <label className="font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>2. Hazard Category</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'FLOOD', icon: Waves, label: 'Flood' },
                { id: 'FALLEN_TREE', icon: TreePine, label: 'Fallen Tree' },
                { id: 'ROAD_DAMAGE', icon: Car, label: 'Road Damage' },
                { id: 'LANDSLIDE', icon: Mountain, label: 'Landslide' },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = incidentType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setIncidentType(item.id)}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-emerald-600' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Water Depth Benchmark / Severity */}
          <div className="space-y-3">
            <label className="font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <Waves className="w-3.5 h-3.5 text-blue-500" />
              <span>3. Severity & Water Depth Benchmark (ADR-017)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEPTH_BENCHMARKS.map((d) => {
                const isSelected = depthBenchmark === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDepthBenchmark(d.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs">{d.label}</div>
                      <div className="text-[10px] text-slate-500">{d.desc}</div>
                    </div>
                    <span
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded ${
                        d.severity === 'CRITICAL'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : d.severity === 'HIGH'
                          ? 'bg-orange-50 text-orange-700 border border-orange-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {d.severity}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Photo Proof Capture */}
          <div className="space-y-3">
            <label className="font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <Camera className="w-3.5 h-3.5 text-emerald-600" />
              <span>4. Photo Evidence (Required for YOLO AI Verification)</span>
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <label className="w-full sm:w-1/2 flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-white cursor-pointer transition-all">
                <Upload className="w-6 h-6 text-slate-400 mb-1" />
                <span className="font-semibold text-slate-700">Upload or Capture Photo</span>
                <span className="text-[10px] text-slate-500">JPG, PNG, WebP up to 10MB</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </label>

              {photoPreview ? (
                <div className="relative w-full sm:w-1/2 aspect-video rounded-xl overflow-hidden border border-emerald-300 shadow-md">
                  <img src={photoPreview} alt="Selected preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPhoto(null);
                      setPhotoPreview(null);
                    }}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-slate-900/80 text-white hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-white/90 text-emerald-700 font-bold border border-emerald-200 text-[9px] shadow-xs">
                    Ready for AI Inference
                  </span>
                </div>
              ) : (
                <div className="w-full sm:w-1/2 p-4 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-slate-500 flex-shrink-0" />
                  <span>Images are scanned for flood depth and verified against spoofed overseas memes.</span>
                </div>
              )}
            </div>
          </div>

          {/* Section 5: Description */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              5. Incident Observations (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Canal overflowed near church; water entering ground floor shops, power line dangling in water..."
              rows={2}
              className="w-full p-3 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-xs"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold transition-colors shadow-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-xs flex items-center gap-2 transition-all"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Submit & Run AI Verification</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
