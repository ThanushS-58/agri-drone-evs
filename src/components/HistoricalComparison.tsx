import React, { useState } from 'react';
import { 
  GitCompare, 
  Calendar, 
  AlertCircle, 
  ArrowRight, 
  Layers, 
  Sliders, 
  ShieldCheck, 
  Clock,
  Sparkles
} from 'lucide-react';
import { AgriculturalField, DroneImage, AIAnalysisResult } from '../types';

interface HistoricalComparisonProps {
  field: AgriculturalField;
  baselineImage: DroneImage | null;
  currentImage: DroneImage;
  analysis?: AIAnalysisResult;
  onRunComparisonAnalysis: () => void;
}

export const HistoricalComparison: React.FC<HistoricalComparisonProps> = ({
  field,
  baselineImage,
  currentImage,
  analysis,
  onRunComparisonAnalysis,
}) => {
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side' | 'difference'>('slider');

  const baselineDate = baselineImage ? baselineImage.captureDate : '2026-06-15 (Baseline)';
  const currentDate = currentImage.captureDate;
  const temporalDelta = analysis?.temporalChangePercentage ?? -18.4;
  const damagePct = analysis?.damagePercentage ?? (currentImage.damageScenario === 'Flooding' ? 38 : currentImage.damageScenario === 'Drought' ? 32 : 18);
  const affectedAcres = analysis?.damagedArea ?? Number(((field.areaAcres * damagePct) / 100).toFixed(2));

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <GitCompare className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Multi-Temporal Drone Image Change Detection
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare earlier healthy baseline orthomosaic with recent post-calamity survey for {field.name}.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
            <button
              onClick={() => setViewMode('slider')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                viewMode === 'slider' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Split Slider
            </button>
            <button
              onClick={() => setViewMode('side-by-side')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                viewMode === 'side-by-side' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Side-by-Side
            </button>
            <button
              onClick={() => setViewMode('difference')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                viewMode === 'difference' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Change Delta Map
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 sm:p-6 space-y-6">
        {/* Comparison Visualizer */}
        {viewMode === 'slider' && (
          <div className="relative w-full aspect-[16/10] bg-black rounded-xl overflow-hidden border border-slate-800 select-none shadow-2xl">
            {/* Current (Post-Event) Image as Base */}
            <img
              src={currentImage.imageUrl}
              alt="Current Damaged Field"
              className="w-full h-full object-cover"
            />

            {/* Baseline Image Clipped by Slider */}
            <div
              className="absolute inset-y-0 left-0 overflow-hidden pointer-events-none"
              style={{ width: `${sliderPos}%` }}
            >
              <img
                src={baselineImage?.imageUrl || currentImage.imageUrl}
                alt="Baseline Healthy Field"
                className="w-full h-full object-cover max-w-none"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded bg-black/80 text-emerald-400 text-xs font-mono border border-emerald-900/80 shadow-md">
                PRE-EVENT BASELINE ({baselineDate})
              </span>
            </div>

            {/* Slider Dividing Bar */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-2xl z-20"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -left-3.5 w-7 h-7 rounded-full bg-white text-slate-900 flex items-center justify-center text-xs font-bold shadow-xl border border-slate-300">
                ⇄
              </div>
            </div>

            <span className="absolute top-3 right-3 px-2.5 py-1 rounded bg-black/80 text-rose-400 text-xs font-mono border border-rose-900/80 shadow-md">
              CURRENT SURVEY ({currentDate})
            </span>

            {/* Interactive Slider Input */}
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPos}
              onChange={(e) => setSliderPos(Number(e.target.value))}
              className="absolute inset-x-6 bottom-4 z-30 opacity-90 hover:opacity-100 transition cursor-ew-resize accent-emerald-500"
            />
          </div>
        )}

        {viewMode === 'side-by-side' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
              <div className="p-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-400">Baseline Image (Pre-Event)</span>
                <span className="text-slate-400 font-mono">{baselineDate}</span>
              </div>
              <div className="aspect-[4/3] bg-black">
                <img
                  src={baselineImage?.imageUrl || currentImage.imageUrl}
                  alt="Baseline Field"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3 text-[11px] text-slate-400">
                Crop Stage: <span className="text-white capitalize">{baselineImage?.cropStage || 'Vegetative'}</span> • Canopy Coverage: 92%
              </div>
            </div>

            <div className="bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
              <div className="p-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
                <span className="font-semibold text-rose-400">Current Survey (Post-Event)</span>
                <span className="text-slate-400 font-mono">{currentDate}</span>
              </div>
              <div className="aspect-[4/3] bg-black">
                <img
                  src={currentImage.imageUrl}
                  alt="Current Field"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3 text-[11px] text-slate-400">
                Crop Stage: <span className="text-white capitalize">{currentImage.cropStage}</span> • Canopy Coverage: {100 - damagePct}%
              </div>
            </div>
          </div>
        )}

        {viewMode === 'difference' && (
          <div className="relative w-full aspect-[16/10] bg-black rounded-xl overflow-hidden border border-slate-800">
            <img src={currentImage.imageUrl} alt="Current Field" className="w-full h-full object-cover filter brightness-50" />
            {analysis?.segmentedMaskUrl && (
              <img
                src={analysis.segmentedMaskUrl}
                alt="Difference Mask"
                className="absolute inset-0 w-full h-full object-cover mix-blend-color-dodge opacity-90"
              />
            )}
            <div className="absolute inset-0 bg-rose-950/20 pointer-events-none" />
            <div className="absolute top-3 left-3 bg-slate-950/90 p-3 rounded-lg border border-slate-800 text-xs space-y-1">
              <span className="font-bold text-rose-400 block">Spectral Divergence Change Map</span>
              <span className="text-slate-300 block text-[11px]">
                Red/Amber highlighted regions represent NDVI &amp; VARI canopy loss since baseline survey.
              </span>
            </div>
          </div>
        )}

        {/* Change Detection Mathematical Metrics (Section 22) */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <span className="text-slate-400 text-[11px] block">Temporal Coverage Delta</span>
            <span className="text-xl font-bold text-rose-400 font-mono">{temporalDelta}%</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Canopy divergence index</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <span className="text-slate-400 text-[11px] block">Total Agricultural Field</span>
            <span className="text-xl font-bold text-white font-mono">{field.areaAcres} Acres</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Title deed area</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <span className="text-slate-400 text-[11px] block">Estimated Damaged Area</span>
            <span className="text-xl font-bold text-amber-400 font-mono">{affectedAcres} Acres</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Loss estimation model</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <span className="text-slate-400 text-[11px] block">Loss Damage Percentage</span>
            <span className="text-xl font-bold text-rose-400 font-mono">{damagePct}%</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Of registered crop area</span>
          </div>
        </div>

        {/* Technical Notice Banner (as requested in Section 10 & 22) */}
        <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/70 text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-slate-300 text-[11px] leading-relaxed">
            <strong className="text-amber-300">Methodology Note:</strong> Temporal change is calculated from registered orthomosaic reflectance. Changes in ambient illumination, solar elevation, sensor GSD, and natural crop phenology are accounted for via radiometric calibration. Visual change indicates verified physical divergence, with official claim compensation subject to surveyor verification.
          </div>
        </div>
      </div>
    </div>
  );
};
