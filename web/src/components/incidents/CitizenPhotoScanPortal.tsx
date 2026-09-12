import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  Upload,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Eye,
  RefreshCw,
  Layers,
  Waves,
  TreePine,
  Car,
  Mountain,
  Zap,
} from 'lucide-react';
import { api } from '../../services/api';

export interface YoloDetection {
  class_name: string;
  class_id: number;
  confidence: number;
  box: [number, number, number, number]; // [x1, y1, x2, y2] normalized 0..1
}

export interface PhotoScanResult {
  status: string;
  overall_confidence: number;
  hazard_classification: string;
  image_score: number;
  depth_benchmark?: string | null;
  is_spam: boolean;
  reason: string;
  detected_objects: string[];
  detections: YoloDetection[];
  yolo_model_status: string;
  verification_engine?: string;
  background_detector?: string;
  gemini_status?: string;
  inference_time_ms: number;
  photo_url?: string;
}

export interface CitizenPhotoScanPortalProps {
  isOpen: boolean;
  onClose: () => void;
  onEscalateToReport: (scanData: {
    photoFile: File | null;
    photoUrl: string | null;
    hazardType: string;
    depthBenchmark: string;
    confidence: number;
    detections: YoloDetection[];
  }) => void;
}

// Preset samples with real encoded disaster evidence for instant 1-click testing
const SAMPLE_PRESETS = [
  {
    id: 'deep_flood',
    label: '🌊 Deep Flood (Canal Overflow)',
    hazard: 'FLOOD',
    color: '#3b82f6',
    generateDataUrl: () => {
      const c = document.createElement('canvas');
      c.width = 400;
      c.height = 300;
      const ctx = c.getContext('2d');
      if (ctx) {
        // Sky & Buildings
        ctx.fillStyle = '#64748b';
        ctx.fillRect(0, 0, 400, 120);
        ctx.fillStyle = '#475569';
        ctx.fillRect(40, 40, 80, 80);
        ctx.fillRect(160, 20, 100, 100);
        // Deep Turbid Floodwater
        ctx.fillStyle = '#785b3b';
        ctx.fillRect(0, 120, 400, 180);
        // Submerged vehicle roof
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(140, 160, 120, 40);
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(170, 140, 60, 25);
      }
      return c.toDataURL('image/jpeg', 0.85);
    },
  },
  {
    id: 'fallen_tree',
    label: '🌲 Fallen Tree Obstruction',
    hazard: 'FALLEN_TREE',
    color: '#10b981',
    generateDataUrl: () => {
      const c = document.createElement('canvas');
      c.width = 400;
      c.height = 300;
      const ctx = c.getContext('2d');
      if (ctx) {
        // Asphalt Road
        ctx.fillStyle = '#334155';
        ctx.fillRect(0, 0, 400, 300);
        // Fallen Tree Trunk & Heavy Foliage
        ctx.fillStyle = '#451a03';
        ctx.lineWidth = 20;
        ctx.beginPath();
        ctx.moveTo(30, 200);
        ctx.lineTo(360, 120);
        ctx.stroke();
        // Green Leaves Cluster
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(160, 140, 60, 0, Math.PI * 2);
        ctx.arc(240, 120, 50, 0, Math.PI * 2);
        ctx.arc(300, 110, 45, 0, Math.PI * 2);
        ctx.fill();
      }
      return c.toDataURL('image/jpeg', 0.85);
    },
  },
  {
    id: 'puddle_flood',
    label: '🚗 Minor Surface Puddle',
    hazard: 'FLOOD',
    color: '#06b6d4',
    generateDataUrl: () => {
      const c = document.createElement('canvas');
      c.width = 400;
      c.height = 300;
      const ctx = c.getContext('2d');
      if (ctx) {
        // Wet road
        ctx.fillStyle = '#475569';
        ctx.fillRect(0, 0, 400, 300);
        // Shallow water puddle
        ctx.fillStyle = '#6b7280';
        ctx.beginPath();
        ctx.ellipse(200, 200, 120, 40, 0, 0, Math.PI * 2);
        ctx.fill();
        // Car on side
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(80, 100, 90, 45);
      }
      return c.toDataURL('image/jpeg', 0.85);
    },
  },
  {
    id: 'spam_meme',
    label: '🚫 Meme / Irrelevant Graphic',
    hazard: 'AUTO',
    color: '#f43f5e',
    generateDataUrl: () => {
      const c = document.createElement('canvas');
      c.width = 400;
      c.height = 300;
      const ctx = c.getContext('2d');
      if (ctx) {
        // Plain solid pink background with low entropy
        ctx.fillStyle = '#fce7f3';
        ctx.fillRect(0, 0, 400, 300);
        ctx.fillStyle = '#be185d';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText('FLAT MEME SCREENSHOT', 40, 150);
      }
      return c.toDataURL('image/jpeg', 0.85);
    },
  },
];

export const CitizenPhotoScanPortal: React.FC<CitizenPhotoScanPortalProps> = ({
  isOpen,
  onClose,
  onEscalateToReport,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [targetHazard, setTargetHazard] = useState<string>('AUTO');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<PhotoScanResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hoveredBoxIdx, setHoveredBoxIdx] = useState<number | null>(null);
  const [showYoloBoxes, setShowYoloBoxes] = useState<boolean>(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('File size exceeds 10MB limit.');
      return;
    }
    setSelectedFile(file);
    setScanResult(null);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (preset: (typeof SAMPLE_PRESETS)[0]) => {
    setErrorMessage(null);
    setScanResult(null);
    setSelectedFile(null);
    setTargetHazard(preset.hazard);
    const dataUrl = preset.generateDataUrl();
    setPhotoPreview(dataUrl);
  };

  const handleRunScan = async () => {
    if (!photoPreview) {
      setErrorMessage('Please upload a photo or choose a test sample first.');
      return;
    }

    setIsScanning(true);
    setErrorMessage(null);

    try {
      let res;
      if (selectedFile) {
        const formData = new FormData();
        formData.append('photo', selectedFile);
        formData.append('hazard_type', targetHazard);
        res = await api.post('/api/incidents/scan-photo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        res = await api.post('/api/incidents/scan-photo', {
          photo_url: photoPreview,
          hazard_type: targetHazard,
        });
      }

      const data = res.data?.data;
      if (data) {
        setScanResult(data);
      } else {
        throw new Error('No analysis payload returned');
      }
    } catch (err: any) {
      console.error('Scan error:', err);
      setErrorMessage(err.message || 'Error executing Gemini 3.5 Flash-Lite AI photo verification');
    } finally {
      setIsScanning(false);
    }
  };

  const handleEscalate = () => {
    if (!scanResult) return;
    const depth = scanResult.depth_benchmark || 'BUMPER_LEVEL';
    let hazard = targetHazard === 'AUTO' ? 'FLOOD' : targetHazard;
    if (scanResult.hazard_classification.includes('Flood')) hazard = 'FLOOD';
    else if (scanResult.hazard_classification.includes('Tree')) hazard = 'FALLEN_TREE';
    else if (scanResult.hazard_classification.includes('Damage')) hazard = 'ROAD_DAMAGE';

    onEscalateToReport({
      photoFile: selectedFile,
      photoUrl: scanResult.photo_url || photoPreview,
      hazardType: hazard,
      depthBenchmark: depth,
      confidence: scanResult.overall_confidence,
      detections: scanResult.detections || [],
    });
    onClose();
  };

  // Compute confidence percentage and tier color
  const confPct = scanResult ? Math.round(scanResult.overall_confidence * 100) : 0;
  const isHighConfidence = confPct >= 85;
  const isModerateConfidence = confPct >= 60 && confPct < 85;

  return (
    <div className="fixed inset-0 z-[2500] flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white border border-slate-200 shadow-2xl flex flex-col text-slate-900">
        {/* Header Bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white/95 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center flex-wrap gap-2">
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Citizen AI Photo Scanner
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs">
                  Gemini 3.5 Flash-Lite
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                  YOLOv8 Spatial Layer
                </span>
                {scanResult?.verification_engine === 'heuristic_fallback' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                    ⚙️ Dev Mode: CV Fallback
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Authoritative multimodal hazard verification, depth benchmarking &amp; background spatial telemetry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Quick 1-Click Disaster Test Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
              <span>Quick Test Samples (Instant 1-Click Evaluation):</span>
              <span className="text-[10px] text-slate-400 font-normal">Or upload your own camera photo below</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SAMPLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-white hover:border-blue-400 hover:shadow-xs transition-all text-left text-xs font-semibold text-slate-800 flex items-center gap-2"
                >
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: preset.color }} />
                  <span className="truncate">{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Upload & Preview Split Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left Column: Photo Upload Zone & Action Controls (5 cols) */}
            <div className="md:col-span-5 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-blue-600" />
                  <span>1. Photo Input</span>
                </label>

                {/* Dropzone Container */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative group border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 bg-slate-50/50 hover:bg-white text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3"
                >
                  <div className="p-3.5 rounded-2xl bg-white group-hover:bg-blue-50 text-slate-500 group-hover:text-blue-600 border border-slate-200 group-hover:border-blue-200 shadow-xs transition-colors">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      Drop disaster photo here or click to browse
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      JPG, PNG, WebP up to 10MB
                    </div>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                  className="hidden"
                />

                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                  className="hidden"
                />

                {/* Camera Snap Button */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <Camera className="w-4 h-4 text-emerald-600" />
                  <span>Take Live Photo with Camera</span>
                </button>
              </div>

              {/* Target Hazard Filter Option */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>2. Hazard Focus</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  {[
                    { id: 'AUTO', label: '⚡ Auto Detect' },
                    { id: 'FLOOD', label: '🌊 Flood Depth' },
                    { id: 'FALLEN_TREE', label: '🌲 Fallen Tree' },
                    { id: 'ROAD_DAMAGE', label: '🚧 Road Damage' },
                  ].map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => setTargetHazard(h.id)}
                      className={`p-2 rounded-xl border font-bold transition-all text-center ${
                        targetHazard === h.id
                          ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Scan Trigger CTA */}
              <button
                type="button"
                onClick={handleRunScan}
                disabled={!photoPreview || isScanning}
                className={`w-full py-3.5 px-5 rounded-2xl font-extrabold text-sm tracking-wide shadow-lg flex items-center justify-center gap-2.5 transition-all ${
                  photoPreview && !isScanning
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-blue-500/25 transform hover:scale-[1.02]'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Verifying with Gemini 3.5 &amp; YOLO...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-cyan-200 fill-cyan-200" />
                    <span>VERIFY WITH GEMINI 3.5 ⚡</span>
                  </>
                )}
              </button>
            </div>

            {/* Right Column: Interactive Annotated Canvas & Verification Results (7 cols) */}
            <div className="md:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-cyan-600" />
                  <span>3. Gemini 3.5 Verification &amp; Spatial Telemetry</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowYoloBoxes(!showYoloBoxes)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border transition-colors flex items-center gap-1 ${
                      showYoloBoxes
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : 'bg-slate-100 border-slate-300 text-slate-500'
                    }`}
                  >
                    <Layers className="w-3 h-3" />
                    <span>YOLO Layer: {showYoloBoxes ? 'ON' : 'OFF'}</span>
                  </button>
                  {scanResult && (
                    <span className="text-[11px] font-mono text-emerald-600 font-bold">
                      Latency: {scanResult.inference_time_ms}ms
                    </span>
                  )}
                </div>
              </div>

              {/* Image Viewport with SVG Bounding Box Overlay & Scan Line */}
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-300 shadow-inner flex items-center justify-center">
                {photoPreview ? (
                  <>
                    <img
                      src={photoPreview}
                      alt="Uploaded disaster preview"
                      className="w-full h-full object-contain"
                    />

                    {/* Scanning radar laser animation */}
                    {isScanning && (
                      <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-bounce" />
                        <div className="absolute inset-0 bg-cyan-500/10 backdrop-blur-[0.5px] flex items-center justify-center">
                          <span className="px-3 py-1.5 rounded-xl bg-slate-900/90 text-cyan-300 border border-cyan-400/50 text-xs font-mono font-bold tracking-widest uppercase flex items-center gap-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Analyzing Multimodal Evidence...
                          </span>
                        </div>
                      </div>
                    )}

                    {/* SVG Bounding Boxes Overlay */}
                    {showYoloBoxes && scanResult?.detections && scanResult.detections.length > 0 && (
                      <svg
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                      >
                        {scanResult.detections.map((d, idx) => {
                          const [x1, y1, x2, y2] = d.box;
                          const width = (x2 - x1) * 100;
                          const height = (y2 - y1) * 100;
                          const left = x1 * 100;
                          const top = y1 * 100;
                          const isHovered = hoveredBoxIdx === idx;

                          return (
                            <g key={idx} className="transition-all">
                              <rect
                                x={left}
                                y={top}
                                width={width}
                                height={height}
                                fill={isHovered ? 'rgba(34, 211, 238, 0.25)' : 'rgba(16, 185, 129, 0.15)'}
                                stroke={isHovered ? '#22d3ee' : '#10b981'}
                                strokeWidth={isHovered ? '0.8' : '0.5'}
                                strokeDasharray={isHovered ? 'none' : '1.5, 1'}
                              />
                            </g>
                          );
                        })}
                      </svg>
                    )}

                    {/* HTML Overlay Bounding Box Tags for Tooltips */}
                    {showYoloBoxes && scanResult?.detections && scanResult.detections.length > 0 && (
                      <div className="absolute inset-0 pointer-events-none">
                        {scanResult.detections.map((d, idx) => {
                          const [x1, y1] = d.box;
                          const left = `${x1 * 100}%`;
                          const top = `${y1 * 100}%`;
                          const isHovered = hoveredBoxIdx === idx;

                          return (
                            <div
                              key={idx}
                              style={{ left, top }}
                              className="absolute transform -translate-y-full pointer-events-auto transition-transform"
                            >
                              <span
                                onMouseEnter={() => setHoveredBoxIdx(idx)}
                                onMouseLeave={() => setHoveredBoxIdx(null)}
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-black tracking-tight shadow-md cursor-pointer ${
                                  isHovered
                                    ? 'bg-cyan-400 text-slate-950 scale-110'
                                    : 'bg-emerald-600 text-white'
                                }`}
                              >
                                <span>{d.class_name}</span>
                                <span>{Math.round(d.confidence * 100)}%</span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center p-6 text-slate-400 space-y-2">
                    <Camera className="w-10 h-10 mx-auto opacity-30" />
                    <div className="text-xs font-semibold">No Image Selected</div>
                    <div className="text-[11px] text-slate-500 max-w-xs">
                      Select a disaster scenario preset or upload a file from your device to begin inference.
                    </div>
                  </div>
                )}
              </div>

              {/* Confidence Score & Inspection Card */}
              {scanResult && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  {/* Top Gauge & Classification Banner */}
                  <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                    <div className="flex items-center gap-3">
                      {/* Circular Animated Confidence Gauge */}
                      <div className="relative w-14 h-14 flex items-center justify-center">
                        <svg className="w-14 h-14 transform -rotate-90">
                          <circle
                            cx="28"
                            cy="28"
                            r="22"
                            stroke="currentColor"
                            strokeWidth="5"
                            className="text-slate-100"
                            fill="transparent"
                          />
                          <circle
                            cx="28"
                            cy="28"
                            r="22"
                            stroke="currentColor"
                            strokeWidth="5"
                            strokeDasharray={2 * Math.PI * 22}
                            strokeDashoffset={2 * Math.PI * 22 * (1 - scanResult.overall_confidence)}
                            strokeLinecap="round"
                            className={
                              isHighConfidence
                                ? 'text-emerald-500'
                                : isModerateConfidence
                                ? 'text-amber-500'
                                : 'text-rose-500'
                            }
                            fill="transparent"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-xs font-black text-slate-900 font-mono">
                            {confPct}%
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <span>Gemini 3.5 Confidence Value</span>
                          <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 text-[9px] font-extrabold border border-indigo-200">
                            {scanResult.verification_engine?.startsWith('gemini') ? 'Gemini 3.5 Flash-Lite' : 'CV Fallback Engine'}
                          </span>
                        </div>
                        <div className="text-sm font-black text-slate-900">
                          {scanResult.hazard_classification}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.2 rounded text-[10px] font-extrabold ${
                              isHighConfidence
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : isModerateConfidence
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {isHighConfidence ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                            )}
                            {isHighConfidence
                              ? 'HIGH CONFIDENCE (PASSED)'
                              : isModerateConfidence
                              ? 'MODERATE CONFIDENCE'
                              : 'LOW / UNVERIFIED'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Flood Depth or Severity Tag */}
                    {scanResult.depth_benchmark && (
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">
                          Flood Depth Benchmark
                        </div>
                        <div className="text-xs font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 inline-block mt-0.5">
                          {scanResult.depth_benchmark.replace('_', ' ')}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Forensic Reasoning & Spam Filter Badge */}
                  <div className="space-y-1.5 text-xs text-slate-600 bg-white p-3.5 rounded-xl border border-slate-200">
                    <div className="font-bold text-slate-900 flex items-center justify-between">
                      <span>Reasoning &amp; Forensic Analysis</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                          scanResult.is_spam
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {scanResult.is_spam ? (
                          <ShieldAlert className="w-3 h-3" />
                        ) : (
                          <ShieldCheck className="w-3 h-3" />
                        )}
                        {scanResult.is_spam ? 'FLAGGED MEME/SPAM (REJECTED)' : 'AUTHENTIC DISASTER EVIDENCE'}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-600">
                      {scanResult.reason}
                    </p>
                  </div>

                  {/* Detected Entities Tag Cloud with Individual Confidences */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <span>YOLOv8 Background Detected Objects ({scanResult.detections?.length || 0}):</span>
                      <span className="text-[9px] text-slate-400 font-normal italic">Visual telemetry only &bull; Verdict by Gemini 3.5</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {scanResult.detections && scanResult.detections.length > 0 ? (
                        scanResult.detections.map((d, i) => (
                          <button
                            key={i}
                            type="button"
                            onMouseEnter={() => setHoveredBoxIdx(i)}
                            onMouseLeave={() => setHoveredBoxIdx(null)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold border transition-all flex items-center gap-1.5 ${
                              hoveredBoxIdx === i
                                ? 'bg-cyan-50 border-cyan-400 text-cyan-900 scale-105 shadow-xs'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span>{d.class_name}</span>
                            <span className="text-[10px] text-emerald-600 font-black">
                              {Math.round(d.confidence * 100)}%
                            </span>
                          </button>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          No distinct COCO foreground objects detected (geometry computed via surface telemetry).
                        </span>
                      )}
                    </div>
                  </div>

                  {/* One-Click Escalation Button to Citizen Hazard Report */}
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setScanResult(null);
                        setSelectedFile(null);
                        setPhotoPreview(null);
                      }}
                      className="px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-200 border border-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Scan Another Photo</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleEscalate}
                      disabled={scanResult.is_spam}
                      className={`px-5 py-2.5 rounded-xl font-extrabold text-xs tracking-wide shadow-md flex items-center gap-2 transition-all ${
                        scanResult.is_spam
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                          : 'bg-slate-900 hover:bg-slate-800 text-white transform hover:scale-105'
                      }`}
                    >
                      <span>{scanResult.is_spam ? 'Cannot Report Spam Photo' : 'Report Hazard with this Photo'}</span>
                      {!scanResult.is_spam && <ArrowRight className="w-4 h-4 text-emerald-400" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
