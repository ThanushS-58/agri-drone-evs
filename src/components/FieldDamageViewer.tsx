import React, { useState } from 'react';
import { 
  Sparkles, 
  Layers, 
  MapPin, 
  Calendar, 
  AlertTriangle, 
  ShieldAlert, 
  Info, 
  CheckCircle2, 
  Maximize2,
  Crosshair,
  Sliders,
  FileCheck
} from 'lucide-react';
import { AgriculturalField, DroneImage, AIAnalysisResult, DamageRegion } from '../types';

interface FieldDamageViewerProps {
  field: AgriculturalField;
  image: DroneImage;
  analysis?: AIAnalysisResult;
  isAnalyzing: boolean;
  onTriggerAnalysis: () => void;
  onGenerateClaim: () => void;
  onViewReport: () => void;
  hasClaim: boolean;
  claimStatus?: string;
}

export const FieldDamageViewer: React.FC<FieldDamageViewerProps> = ({
  field,
  image,
  analysis,
  isAnalyzing,
  onTriggerAnalysis,
  onGenerateClaim,
  onViewReport,
  hasClaim,
  claimStatus,
}) => {
  const [viewMode, setViewMode] = useState<'overlay' | 'original' | 'mask' | 'split'>('overlay');
  const [selectedRegion, setSelectedRegion] = useState<DamageRegion | null>(null);
  const [splitPosition, setSplitPosition] = useState<number>(50);

  // Fallback estimates if analysis hasn't been run yet for this image
  const damagePct = analysis ? analysis.damagePercentage : (image.damageScenario === 'Flooding' ? 38 : image.damageScenario === 'Drought' ? 32 : image.damageScenario === 'Pest Infestation' ? 18 : 0);
  const affectedAcres = analysis ? analysis.damagedArea : Number(((field.areaAcres * damagePct) / 100).toFixed(2));
  const healthyAcres = analysis ? analysis.healthyArea : Number((field.areaAcres - affectedAcres).toFixed(2));
  const stressedAcres = analysis ? analysis.stressedArea : Number(((field.areaAcres * 0.12)).toFixed(2));
  const severity = analysis ? analysis.damageSeverity : (damagePct >= 50 ? 'High' : damagePct >= 20 ? 'Moderate' : 'Low');

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Top Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-900/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
              {field.id}
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight">{field.name}</h2>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
              severity === 'High' 
                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                : severity === 'Moderate'
                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
            }`}>
              {severity} Damage Severity
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-1">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              {field.village}, {field.district} ({field.latitude.toFixed(4)}° N, {field.longitude.toFixed(4)}° E)
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Capture: {image.captureDate} ({image.captureTime})
            </span>
            <span className="text-slate-300 font-medium">
              Stage: <span className="capitalize text-emerald-400">{image.cropStage.replace('_', ' ')}</span>
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onTriggerAnalysis}
            disabled={isAnalyzing}
            className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-md ${
              isAnalyzing 
                ? 'bg-emerald-800 text-emerald-200 cursor-wait'
                : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white shadow-emerald-900/40 hover:scale-[1.02]'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Analyzing Field...' : 'ANALYZE FIELD'}</span>
          </button>

          {damagePct > 0 && !hasClaim && (
            <button
              onClick={onGenerateClaim}
              className="px-3.5 py-2 rounded-xl text-sm font-semibold bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1.5 transition shadow-md shadow-amber-950/40"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Generate Claim</span>
            </button>
          )}

          {hasClaim && (
            <button
              onClick={onViewReport}
              className="px-3.5 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 transition shadow-md"
            >
              <FileCheck className="w-4 h-4" />
              <span>Claim Report ({claimStatus || 'Pending'})</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Visualizer Left + Metrics Beside */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Left Column: Aerial Imagery & Interactive Canvas (8 cols) */}
        <div className="lg:col-span-8 p-4 sm:p-5 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
          {/* View Mode Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 text-xs">
              <button
                onClick={() => setViewMode('overlay')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  viewMode === 'overlay' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                AI Overlay
              </button>
              <button
                onClick={() => setViewMode('original')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  viewMode === 'original' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Original Drone
              </button>
              <button
                onClick={() => setViewMode('mask')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  viewMode === 'mask' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Damage Mask
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  viewMode === 'split' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Split Compare
              </button>
            </div>

            <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
              <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
              Source: {image.imageSource} | Res: {image.resolution}
            </span>
          </div>

          {/* Interactive Aerial Display Container */}
          <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-black rounded-xl overflow-hidden border border-slate-800 select-none group">
            {/* Base Drone Aerial Image */}
            <img
              src={image.imageUrl}
              alt="Aerial Field Orthomosaic"
              className="w-full h-full object-cover"
            />

            {/* AI Segmentation Overlay */}
            {viewMode === 'overlay' && analysis?.segmentedMaskUrl && (
              <img
                src={analysis.segmentedMaskUrl}
                alt="AI Segmentation Overlay"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none mix-blend-screen opacity-90 transition-opacity"
              />
            )}

            {/* Mask Only Mode */}
            {viewMode === 'mask' && (
              <div className="absolute inset-0 bg-slate-950 flex items-center justify-center">
                {analysis?.segmentedMaskUrl ? (
                  <img
                    src={analysis.segmentedMaskUrl}
                    alt="AI Segmentation Mask"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-6 text-slate-400 text-xs">
                    <Layers className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                    Click "ANALYZE FIELD" to generate semantic segmentation mask.
                  </div>
                )}
              </div>
            )}

            {/* Split Comparison Slider Mode */}
            {viewMode === 'split' && (
              <div className="absolute inset-0 pointer-events-none">
                <div 
                  className="absolute inset-y-0 left-0 overflow-hidden" 
                  style={{ width: `${splitPosition}%` }}
                >
                  <img
                    src={image.imageUrl}
                    alt="Original"
                    className="w-full h-full object-cover max-w-none"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {analysis?.segmentedMaskUrl && (
                    <img
                      src={analysis.segmentedMaskUrl}
                      alt="Overlay"
                      className="absolute inset-0 w-full h-full object-cover max-w-none mix-blend-screen opacity-95"
                    />
                  )}
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-emerald-400 text-[10px] font-mono border border-emerald-900/60">
                    AI DAMAGE MASK
                  </span>
                </div>
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize shadow-lg"
                  style={{ left: `${splitPosition}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -left-3 w-6 h-6 rounded-full bg-white text-slate-900 flex items-center justify-center text-xs shadow-md">
                    ⇄
                  </div>
                </div>
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/70 text-slate-300 text-[10px] font-mono border border-slate-800">
                  ORIGINAL DRONE
                </span>
              </div>
            )}

            {/* Split Drag Range Input */}
            {viewMode === 'split' && (
              <input
                type="range"
                min="0"
                max="100"
                value={splitPosition}
                onChange={(e) => setSplitPosition(Number(e.target.value))}
                className="absolute inset-x-4 bottom-4 z-20 opacity-80 hover:opacity-100 transition cursor-ew-resize accent-emerald-500"
              />
            )}

            {/* Interactive Damage Hotspot Bounding Boxes */}
            {viewMode !== 'original' && analysis?.damageRegions.map((region) => {
              const [x, y, w, h] = region.bounds;
              const isSelected = selectedRegion?.id === region.id;
              return (
                <button
                  key={region.id}
                  onClick={() => setSelectedRegion(region)}
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    width: `${Math.max(w, 8)}%`,
                    height: `${Math.max(h, 8)}%`,
                  }}
                  className={`absolute rounded border-2 cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-white bg-rose-500/40 shadow-lg shadow-rose-900 ring-2 ring-white z-20 scale-105'
                      : region.severity === 'High'
                      ? 'border-rose-500 bg-rose-500/20 hover:bg-rose-500/35'
                      : region.severity === 'Moderate'
                      ? 'border-amber-500 bg-amber-500/20 hover:bg-amber-500/35'
                      : 'border-yellow-400 bg-yellow-400/20 hover:bg-yellow-400/35'
                  }`}
                  title={`${region.label}: ${region.category} (${region.areaAcres} acres)`}
                >
                  <span className="absolute -top-3.5 left-0 px-1 py-0.2 rounded bg-slate-900/90 text-white text-[9px] font-mono border border-slate-700 whitespace-nowrap">
                    {region.category} • {region.areaAcres}ac
                  </span>
                </button>
              );
            })}

            {/* Compass / Telemetry HUD overlay */}
            <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-slate-950/80 px-2 py-1 rounded-md text-[10px] font-mono text-slate-300 border border-slate-800">
              <span className="text-emerald-400">N ↑</span>
              <span>ALT: 45m AGL</span>
              <span>GSD: 1.4cm/px</span>
            </div>
          </div>

          {/* Color Legend (as specified in Section 2) */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-slate-400 text-[11px] uppercase tracking-wider">Classification Legend:</span>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-emerald-500 border border-emerald-400 shadow-sm" />
                <span className="text-slate-300 font-medium">Healthy Crops</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-yellow-400 border border-yellow-300 shadow-sm" />
                <span className="text-slate-300 font-medium">Crop Stress</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-amber-500 border border-amber-400 shadow-sm" />
                <span className="text-slate-300 font-medium">Moderate Damage</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-rose-600 border border-rose-500 shadow-sm" />
                <span className="text-slate-300 font-medium">Severe Damage</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-slate-500 border border-slate-400 shadow-sm" />
                <span className="text-slate-400">Bare Land / Canal</span>
              </div>
            </div>
          </div>

          {/* Clicked Region Inspector Banner */}
          {selectedRegion && (
            <div className="mt-3 p-3 rounded-xl bg-slate-800/90 border border-rose-800/60 flex items-start justify-between gap-3 animate-fadeIn">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{selectedRegion.label}</span>
                    <span className="text-[10px] font-mono px-1.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                      {selectedRegion.severity} Severity
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Confidence: {selectedRegion.confidence}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">{selectedRegion.description}</p>
                  <p className="text-[11px] text-emerald-400 mt-1 font-mono">
                    Estimated Affected Ground Area: {selectedRegion.areaAcres} Acres
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRegion(null)}
                className="text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-700"
              >
                ✕ Close
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Live Telemetry & Verification Panels (4 cols) */}
        <div className="lg:col-span-4 p-4 sm:p-5 flex flex-col justify-between space-y-4 bg-slate-900/60">
          {/* Card 1: FIELD MONITORING STATUS */}
          <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-700/60">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700/50">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                Field Monitoring
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                {field.cropVariety || 'Standard'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Crop Type</span>
                <span className="font-semibold text-white">{field.cropType}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Total Field Area</span>
                <span className="font-semibold text-white">{field.areaAcres} Acres</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Growth Stage</span>
                <span className="font-medium text-emerald-400 capitalize">{image.cropStage.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Monitoring Status</span>
                <span className={`font-semibold ${
                  field.monitoringStatus === 'Critical Damage' ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  {field.monitoringStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: CROP HEALTH RATIOS (Section 18) */}
          <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-700/60">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 pb-2 mb-2 border-b border-slate-700/50 flex items-center justify-between">
              <span>Crop Health Breakdown</span>
              <span className="text-[10px] text-slate-400">CV VARI Index</span>
            </h3>
            
            {/* Visual Progress Bar */}
            <div className="h-3 w-full bg-slate-700 rounded-full overflow-hidden flex mb-3">
              <div 
                style={{ width: `${Math.max(0, 100 - damagePct - 15)}%` }} 
                className="bg-emerald-500 h-full" 
                title="Healthy Crop"
              />
              <div 
                style={{ width: '15%' }} 
                className="bg-yellow-400 h-full" 
                title="Crop Stress"
              />
              <div 
                style={{ width: `${damagePct}%` }} 
                className="bg-rose-500 h-full" 
                title="Damaged Crop"
              />
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Healthy Crop Canopy:
                </span>
                <span className="font-semibold text-emerald-400">
                  {Math.max(0, 100 - damagePct - 15)}% ({healthyAcres} ac)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-yellow-400" />
                  Stressed Crop Area:
                </span>
                <span className="font-semibold text-yellow-400">
                  15% ({stressedAcres} ac)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Damaged Crop Area:
                </span>
                <span className="font-semibold text-rose-400">
                  {damagePct}% ({affectedAcres} ac)
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: DAMAGE ESTIMATION MATHEMATICAL MODEL (Section 11 & 22) */}
          <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-700/60">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 pb-2 mb-2 border-b border-slate-700/50 flex items-center justify-between">
              <span>Damage Estimation Model</span>
              <span className="text-[10px] font-mono text-emerald-400">GSD Calibrated</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs mb-2">
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Estimated Damage</span>
                <span className={`text-xl font-black ${
                  damagePct >= 50 ? 'text-rose-400' : damagePct >= 20 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {damagePct}%
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Affected Acreage</span>
                <span className="text-xl font-black text-white">
                  {affectedAcres} <span className="text-xs font-normal text-slate-400">Acres</span>
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
              Model: Affected Area = Total ({field.areaAcres}ac) × ({damagePct}% / 100) = {affectedAcres} acres
            </p>
          </div>

          {/* Card 4: AI CV ENGINE STATUS */}
          <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-700/60">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 pb-2 mb-2 border-b border-slate-700/50 flex items-center justify-between">
              <span>AI Computer Vision Engine</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </h3>
            <div className="text-xs space-y-1 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Architecture:</span>
                <span className="font-mono text-[11px] text-emerald-300">AgriVision ResNet-UNet</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Confidence:</span>
                <span className="font-mono text-[11px] text-white">
                  {analysis?.confidenceScore ? `${analysis.confidenceScore}%` : '94.6%'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Inference Time:</span>
                <span className="font-mono text-[11px] text-white">
                  {analysis?.processingTimeMs ? `${analysis.processingTimeMs} ms` : '312 ms'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Identified Cause:</span>
                <span className="font-semibold text-rose-300">
                  {analysis?.damageCategory && analysis.damageCategory !== 'None' 
                    ? analysis.damageCategory 
                    : image.damageScenario || 'Normal Canopy'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
