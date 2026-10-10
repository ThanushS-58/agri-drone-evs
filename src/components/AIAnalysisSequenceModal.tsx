import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  Loader2, 
  Clock, 
  Sparkles, 
  Layers, 
  Scale, 
  FileCheck2, 
  ShieldAlert, 
  Terminal,
  ArrowRight
} from 'lucide-react';
import { AgriculturalField, DroneImage, AIAnalysisResult } from '../types';

interface AIAnalysisSequenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  field: AgriculturalField;
  image: DroneImage;
  currentPhase: number;
  currentDetails: string;
  result: AIAnalysisResult | null;
  onViewReport: () => void;
  onGenerateClaim: () => void;
}

const PHASES = [
  { id: 1, title: 'VALIDATING IMAGE', sub: 'Checking EXIF, 4K resolution, camera telemetry & field boundary' },
  { id: 2, title: 'PREPROCESSING IMAGE', sub: 'Gaussian smoothing kernel 3x3, CLAHE contrast & illumination normalization' },
  { id: 3, title: 'DETECTING CROPS', sub: 'Isolating crop canopy pixels from bare soil, bunds, and irrigation canals' },
  { id: 4, title: 'ANALYZING CROP HEALTH', sub: 'Evaluating Visible Atmospherically Resistant Index (VARI) & chlorosis' },
  { id: 5, title: 'DETECTING DAMAGE', sub: 'Executing U-Net damage segmentation & necrotic cluster extraction' },
  { id: 6, title: 'COMPARING HISTORICAL IMAGES', sub: 'Aligning with pre-event baseline orthomosaic to calculate temporal loss delta' },
  { id: 7, title: 'CALCULATING CROP LOSS', sub: 'Mathematical model: Damage % = (Damaged Pixels / Total Crop Pixels) * 100' },
  { id: 8, title: 'GENERATING INSURANCE REPORT', sub: 'Compiling surveyor telemetry, spatial coordinates & verifiable evidence digest' },
  { id: 9, title: 'AWAITING ADMIN VERIFICATION', sub: 'Dispatching notification to District Agricultural Surveyor for review' },
  { id: 10, title: 'PIPELINE COMPLETE', sub: 'Analysis finalized and synchronized with central claims repository' },
];

export const AIAnalysisSequenceModal: React.FC<AIAnalysisSequenceModalProps> = ({
  isOpen,
  onClose,
  field,
  image,
  currentPhase,
  currentDetails,
  result,
  onViewReport,
  onGenerateClaim,
}) => {
  if (!isOpen) return null;

  const isDone = currentPhase >= 10 && !!result;
  const progressPercent = Math.min(100, (currentPhase / 10) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isDone ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30'
            }`}>
              {isDone ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>AI Damage Analysis Pipeline</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {field.name}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                10-Phase Agricultural Computer Vision &amp; Loss Verification Workflow
              </p>
            </div>
          </div>
          {isDone && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700"
            >
              ✕ Close
            </button>
          )}
        </div>

        {/* Overall Progress Bar */}
        <div className="w-full bg-slate-800 h-1.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-emerald-500 via-teal-400 to-green-500 h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Body: Sequence List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1 text-xs">
          {PHASES.map((p) => {
            const isCurrent = currentPhase === p.id;
            const isCompleted = currentPhase > p.id || (p.id === 10 && isDone);
            const isPending = currentPhase < p.id;

            return (
              <div
                key={p.id}
                className={`p-3 rounded-xl border transition-all flex items-start gap-3 ${
                  isCurrent
                    ? 'bg-emerald-950/40 border-emerald-500/60 shadow-md shadow-emerald-950/50'
                    : isCompleted
                    ? 'bg-slate-800/40 border-slate-700/60'
                    : 'bg-slate-900/30 border-slate-800/40 opacity-50'
                }`}
              >
                <div className="pt-0.5 shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-600 flex items-center justify-center text-[9px] text-slate-400 font-mono">
                      {p.id}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`font-bold tracking-tight ${
                      isCurrent ? 'text-emerald-300' : isCompleted ? 'text-slate-200' : 'text-slate-400'
                    }`}>
                      PHASE {p.id} — {p.title}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {isCompleted ? 'COMPLETE' : isCurrent ? 'RUNNING' : 'QUEUED'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{p.sub}</p>

                  {isCurrent && currentDetails && (
                    <div className="mt-2 p-2 rounded bg-slate-950/80 font-mono text-[10px] text-emerald-400 border border-slate-800 flex items-center gap-1.5">
                      <Terminal className="w-3 h-3 text-emerald-500" />
                      <span>{currentDetails}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Finished Outcome Summary Card */}
          {isDone && result && (
            <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-emerald-950/80 to-slate-900 border border-emerald-700/60 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-emerald-800/40">
                <span className="font-bold text-white text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Analysis Synthesis Results
                </span>
                <span className="text-[11px] font-mono text-emerald-300">
                  {result.confidenceScore}% Confidence Score
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center my-3">
                <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Identified Condition</span>
                  <span className="font-bold text-rose-300 text-xs">
                    {result.damageCategory}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Damage Percentage</span>
                  <span className="font-black text-rose-400 text-sm">
                    {result.damagePercentage}%
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Affected Ground Area</span>
                  <span className="font-bold text-white text-xs">
                    {result.damagedArea} Acres
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Damage Severity</span>
                  <span className={`font-bold text-xs ${
                    result.damageSeverity === 'High' ? 'text-rose-400' : 'text-amber-400'
                  }`}>
                    {result.damageSeverity}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-300 italic">
                "{result.methodologyNotes}"
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">
            {isDone ? `Total Processing: ${result?.processingTimeMs}ms` : `Executing Phase ${currentPhase} of 10...`}
          </span>

          {isDone ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onGenerateClaim}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1.5 transition shadow"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Generate Claim</span>
              </button>
              <button
                onClick={() => {
                  onClose();
                  onViewReport();
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition shadow"
              >
                <span>View Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Model Inference Active...
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
