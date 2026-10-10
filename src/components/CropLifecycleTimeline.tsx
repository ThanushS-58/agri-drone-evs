import React, { useState } from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Sparkles, 
  AlertTriangle,
  ChevronRight,
  Eye
} from 'lucide-react';
import { AgriculturalField, DroneImage, CROP_STAGES, CropLifecycleStage } from '../types';
import { generateAerialDroneImageUrl } from '../utils/droneImageFactory';

interface CropLifecycleTimelineProps {
  field: AgriculturalField;
  images: DroneImage[];
  selectedStage: CropLifecycleStage;
  onSelectStage: (stage: CropLifecycleStage) => void;
  onPreviewImage: (imageUrl: string, title: string) => void;
}

export const CropLifecycleTimeline: React.FC<CropLifecycleTimelineProps> = ({
  field,
  images,
  selectedStage,
  onSelectStage,
  onPreviewImage,
}) => {
  // Generate a map of stage snapshots
  const stageData = CROP_STAGES.map((stage, idx) => {
    // Check if an existing image matches this stage
    const matchingImg = images.find((i) => i.cropStage === stage.id);
    const hasImage = !!matchingImg;

    // Synthetic stage metrics for complete lifecycle demonstration
    let coveragePct = 0;
    let health = 'Normal';
    let damagePct = 0;

    if (idx === 0) coveragePct = 0;
    else if (idx === 1) coveragePct = 5;
    else if (idx === 2) coveragePct = 12;
    else if (idx === 3) coveragePct = 35;
    else if (idx === 4) coveragePct = 60;
    else if (idx === 5) coveragePct = 90;
    else if (idx === 6) {
      coveragePct = 94;
      if (field.monitoringStatus === 'Critical Damage') {
        damagePct = 38;
        health = 'Flooding Inundation';
      }
    } else if (idx === 7) {
      coveragePct = 88;
      if (field.monitoringStatus === 'Needs Review') {
        damagePct = 18;
        health = 'Pest Defoliation';
      }
    } else if (idx === 8) coveragePct = 85;
    else if (idx === 9) coveragePct = 20;

    const imageUrl = matchingImg
      ? matchingImg.imageUrl
      : generateAerialDroneImageUrl({
          cropType: field.cropType,
          stage: stage.id,
          damageType: damagePct > 0 ? (field.monitoringStatus === 'Critical Damage' ? 'Flooding' : 'Pest Infestation') : 'None',
        });

    return {
      stage,
      hasImage,
      imageUrl,
      coveragePct,
      health,
      damagePct,
      date: matchingImg?.captureDate || `Stage Day +${stage.daysFromSowing}`,
    };
  });

  const activeStageItem = stageData.find((s) => s.stage.id === selectedStage) || stageData[5];

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>Crop Lifecycle Monitoring Timeline</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
              10 Sowing-to-Harvest Stages
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Temporal canopy evolution tracking for {field.name} ({field.cropType} - Variety: {field.cropVariety})
          </p>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Sowing: {field.sowingDate} • Harvest: {field.expectedHarvestDate}
        </div>
      </div>

      {/* Horizontal Stage Stepper Carousel */}
      <div className="p-4 border-b border-slate-800 overflow-x-auto scrollbar-none bg-slate-950/40">
        <div className="flex items-center space-x-3 min-w-[750px]">
          {stageData.map(({ stage, damagePct, coveragePct, hasImage }, idx) => {
            const isSelected = selectedStage === stage.id;
            const isPast = idx <= 5; // e.g. current stage is vegetative/flowering

            return (
              <button
                key={stage.id}
                onClick={() => onSelectStage(stage.id)}
                className={`flex-1 p-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-emerald-950/60 border-emerald-500 shadow-lg shadow-emerald-950 text-white ring-1 ring-emerald-400'
                    : isPast
                    ? 'bg-slate-800/80 border-slate-700 hover:border-slate-600 text-slate-300'
                    : 'bg-slate-900/40 border-slate-800/60 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                  <span className={isSelected ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                    STG {idx + 1}
                  </span>
                  {damagePct > 0 ? (
                    <span className="px-1 rounded bg-rose-950 text-rose-300 font-bold">
                      {damagePct}% Loss
                    </span>
                  ) : (
                    <span className="text-slate-400">{coveragePct}% Cover</span>
                  )}
                </div>
                <div className="text-xs font-bold truncate">
                  {stage.label.split('. ')[1]}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Stage Deep-Dive Showcase */}
      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Stage Aerial Image Preview (7 cols) */}
        <div className="lg:col-span-7">
          <div className="relative aspect-[16/10] bg-black rounded-xl overflow-hidden border border-slate-800 shadow-lg group">
            <img
              src={activeStageItem.imageUrl}
              alt={activeStageItem.stage.label}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

            <div className="absolute top-3 left-3 bg-slate-950/80 px-2.5 py-1 rounded text-xs font-mono text-emerald-400 border border-slate-800">
              {activeStageItem.stage.label}
            </div>

            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
              <div>
                <span className="font-bold text-sm block">{activeStageItem.stage.label}</span>
                <span className="text-slate-300 text-[11px]">{activeStageItem.stage.description}</span>
              </div>
              <button
                onClick={() => onPreviewImage(activeStageItem.imageUrl, activeStageItem.stage.label)}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white flex items-center gap-1 text-xs shadow"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Full View</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stage Attributes & Health Analytics (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 pb-2 mb-3 border-b border-slate-700/50 flex items-center justify-between">
              <span>Stage Phenology Metrics</span>
              <span className="text-[10px] font-mono text-emerald-400">{activeStageItem.date}</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Canopy Biomass Coverage:</span>
                <span className="font-mono font-bold text-white">{activeStageItem.coveragePct}%</span>
              </div>
              <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{ width: `${activeStageItem.coveragePct}%` }}
                />
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-700/40">
                <span className="text-slate-400">Crop Health Diagnosis:</span>
                <span className={`font-semibold ${
                  activeStageItem.damagePct > 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  {activeStageItem.health}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Damage Loss Percentage:</span>
                <span className={`font-mono font-bold ${
                  activeStageItem.damagePct > 0 ? 'text-rose-400' : 'text-slate-300'
                }`}>
                  {activeStageItem.damagePct}%
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Field Monitoring Status:</span>
                <span className="font-medium text-emerald-300">
                  {field.monitoringStatus}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs text-slate-300 leading-relaxed">
            <span className="text-emerald-400 font-bold block mb-1">Agronomic Stage Guidance:</span>
            {activeStageItem.stage.description}. High-resolution drone orthomosaics at this phase enable early detection of soil moisture deficits, weed competition, and pest infestation before economic thresholds are breached.
          </div>
        </div>
      </div>
    </div>
  );
};
