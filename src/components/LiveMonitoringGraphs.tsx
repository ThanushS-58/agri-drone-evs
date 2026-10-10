import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Activity, 
  Calendar, 
  ShieldCheck, 
  Layers
} from 'lucide-react';
import { AgriculturalField, InsuranceClaim, AIAnalysisResult, DroneImage } from '../types';

interface LiveMonitoringGraphsProps {
  field: AgriculturalField;
  images: DroneImage[];
  claims: InsuranceClaim[];
  currentAnalysis?: AIAnalysisResult;
}

export const LiveMonitoringGraphs: React.FC<LiveMonitoringGraphsProps> = ({
  field,
  images,
  claims,
  currentAnalysis,
}) => {
  // Current health distribution
  const damagePct = currentAnalysis?.damagePercentage ?? (field.monitoringStatus === 'Critical Damage' ? 38 : field.monitoringStatus === 'Needs Review' ? 18 : 0);
  const stressedPct = 15;
  const healthyPct = Math.max(0, 100 - damagePct - stressedPct);

  // Time series mock data points synchronized with field history
  const timeSeriesData = [
    { date: 'Stage 1 (Prep)', healthPct: 98, damagePct: 0, coverPct: 5, affectedAcres: 0 },
    { date: 'Stage 3 (Sowing)', healthPct: 95, damagePct: 0, coverPct: 15, affectedAcres: 0 },
    { date: 'Stage 5 (Early)', healthPct: 92, damagePct: 4, coverPct: 45, affectedAcres: Number(((field.areaAcres * 0.04)).toFixed(2)) },
    { date: 'Stage 6 (Veg)', healthPct: 88, damagePct: 8, coverPct: 85, affectedAcres: Number(((field.areaAcres * 0.08)).toFixed(2)) },
    { date: 'Stage 7 (Current)', healthPct: healthyPct, damagePct: damagePct, coverPct: Math.min(100, healthyPct + stressedPct), affectedAcres: Number(((field.areaAcres * damagePct) / 100).toFixed(2)) },
  ];

  // Claim status aggregation
  const claimStats = {
    submitted: claims.filter((c) => c.status === 'Submitted').length,
    underReview: claims.filter((c) => c.status === 'Under Review').length,
    approved: claims.filter((c) => c.status === 'Approved').length,
    rejected: claims.filter((c) => c.status === 'Rejected').length,
  };
  const totalClaims = claims.length || 1;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Live Agricultural Monitoring &amp; Temporal Analytics
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              Field: {field.name}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time biometric trends, canopy divergence trajectories, and digital insurance processing metrics.
          </p>
        </div>
      </div>

      {/* 6 Grid Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* GRAPH 1 — CROP HEALTH OVER TIME */}
        <div className="bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between mb-1">
              <span>Graph 1 — Crop Health Distribution</span>
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
            </h3>
            <p className="text-[11px] text-slate-400 mb-4">Healthy vs. Stressed vs. Damaged crop proportion</p>

            {/* Visual Donut / Stacked Bar */}
            <div className="h-40 flex items-end gap-3 justify-center pt-4">
              <div className="flex flex-col items-center gap-2 h-full justify-end">
                <div 
                  style={{ height: `${healthyPct}%` }} 
                  className="w-12 bg-emerald-500 rounded-t-lg transition-all"
                />
                <span className="text-[10px] text-slate-300 font-mono">{healthyPct}%</span>
                <span className="text-[10px] text-emerald-400 font-medium">Healthy</span>
              </div>

              <div className="flex flex-col items-center gap-2 h-full justify-end">
                <div 
                  style={{ height: `${stressedPct * 2}%` }} 
                  className="w-12 bg-yellow-400 rounded-t-lg transition-all"
                />
                <span className="text-[10px] text-slate-300 font-mono">{stressedPct}%</span>
                <span className="text-[10px] text-yellow-400 font-medium">Stressed</span>
              </div>

              <div className="flex flex-col items-center gap-2 h-full justify-end">
                <div 
                  style={{ height: `${Math.max(5, damagePct)}%` }} 
                  className="w-12 bg-rose-500 rounded-t-lg transition-all"
                />
                <span className="text-[10px] text-slate-300 font-mono">{damagePct}%</span>
                <span className="text-[10px] text-rose-400 font-medium">Damaged</span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono">
            VARI Spectral Segmentation Output
          </div>
        </div>

        {/* GRAPH 2 — DAMAGE PERCENTAGE OVER TIME */}
        <div className="bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between mb-1">
              <span>Graph 2 — Damage Percentage Over Time</span>
              <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
            </h3>
            <p className="text-[11px] text-slate-400 mb-3">Estimated crop loss trajectory across flight dates</p>

            {/* SVG Line Chart */}
            <div className="h-36 w-full flex items-center justify-center">
              <svg viewBox="0 0 300 120" className="w-full h-full overflow-visible">
                {/* Horizontal Grid lines */}
                <line x1="20" y1="20" x2="280" y2="20" stroke="#1e293b" strokeDasharray="2 2" />
                <line x1="20" y1="60" x2="280" y2="60" stroke="#1e293b" strokeDasharray="2 2" />
                <line x1="20" y1="100" x2="280" y2="100" stroke="#334155" />

                {/* Path line */}
                <path
                  d="M 30,95 L 90,95 L 150,85 L 210,70 L 270,30"
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="3"
                />

                {/* Data Points */}
                {[
                  { cx: 30, cy: 95, val: '0%' },
                  { cx: 90, cy: 95, val: '0%' },
                  { cx: 150, cy: 85, val: '4%' },
                  { cx: 210, cy: 70, val: '8%' },
                  { cx: 270, cy: 30, val: `${damagePct}%` },
                ].map((pt, i) => (
                  <g key={i}>
                    <circle cx={pt.cx} cy={pt.cy} r="4" fill="#ffffff" stroke="#f43f5e" strokeWidth="2" />
                    <text x={pt.cx} y={pt.cy - 8} fill="#fda4af" fontSize="9" textAnchor="middle" fontFamily="monospace">
                      {pt.val}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex justify-between font-mono">
            <span>Sowing (0%)</span>
            <span className="text-rose-400">Peak Calamity ({damagePct}%)</span>
          </div>
        </div>

        {/* GRAPH 3 — CROP CANOPY COVERAGE (%) */}
        <div className="bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between mb-1">
              <span>Graph 3 — Crop Coverage %</span>
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
            </h3>
            <p className="text-[11px] text-slate-400 mb-3">Green vegetation fraction from sowing to harvest</p>

            {/* Area Line Chart */}
            <div className="h-36 w-full flex items-center justify-center">
              <svg viewBox="0 0 300 120" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="coverGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <polygon
                  points="30,105 30,95 90,85 150,55 210,25 270,35 270,105"
                  fill="url(#coverGrad)"
                />
                <polyline
                  points="30,95 90,85 150,55 210,25 270,35"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                />
                <circle cx="210" cy="25" r="4" fill="#ffffff" stroke="#10b981" strokeWidth="2" />
                <text x="210" y="15" fill="#a7f3d0" fontSize="9" textAnchor="middle" fontFamily="monospace">
                  Peak: 92%
                </text>
              </svg>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex justify-between font-mono">
            <span>Bare Soil (5%)</span>
            <span className="text-emerald-400">Canopy Closure (92%)</span>
          </div>
        </div>

        {/* GRAPH 4 — AFFECTED GROUND AREA (ACRES) */}
        <div className="bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between mb-1">
              <span>Graph 4 — Affected Area (Acres)</span>
              <Activity className="w-3.5 h-3.5 text-amber-400" />
            </h3>
            <p className="text-[11px] text-slate-400 mb-3">Calculated loss acreage: Total ({field.areaAcres}ac) × Damage %</p>

            <div className="h-36 flex items-end gap-2 justify-between px-2 pt-4">
              {timeSeriesData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div
                    style={{ height: `${Math.max(4, (d.affectedAcres / field.areaAcres) * 100)}%` }}
                    className="w-full bg-gradient-to-t from-amber-600 to-rose-500 rounded-t transition-all"
                  />
                  <span className="text-[9px] text-slate-300 font-mono">{d.affectedAcres}ac</span>
                  <span className="text-[8px] text-slate-500 truncate w-full text-center">T{i + 1}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono flex justify-between">
            <span>Undamaged: {(field.areaAcres - (field.areaAcres * damagePct / 100)).toFixed(2)}ac</span>
            <span className="text-rose-400">Affected: {(field.areaAcres * damagePct / 100).toFixed(2)}ac</span>
          </div>
        </div>

        {/* GRAPH 5 — CROP GROWTH LIFECYCLE PROGRESSION */}
        <div className="bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between mb-1">
              <span>Graph 5 — Crop Growth Progression</span>
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
            </h3>
            <p className="text-[11px] text-slate-400 mb-3">Lifecycle stage accumulation vs. sowing target</p>

            <div className="space-y-2.5 pt-2 text-xs">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">Vegetative Growth Phase:</span>
                  <span className="font-mono text-emerald-400 font-bold">70% Reached</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '70%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">Days Elapsed Since Sowing:</span>
                  <span className="font-mono text-white">74 / 125 Days</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: '59%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">Harvest Readiness:</span>
                  <span className="font-mono text-amber-400">In 51 Days</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '41%' }} />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono">
            Sown: {field.sowingDate} • Harvest: {field.expectedHarvestDate}
          </div>
        </div>

        {/* GRAPH 6 — INSURANCE CLAIM MONITORING PIPELINE */}
        <div className="bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between mb-1">
              <span>Graph 6 — Claim Pipeline Status</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </h3>
            <p className="text-[11px] text-slate-400 mb-3">State-wide PMFBY claim adjudication breakdown</p>

            <div className="space-y-2 pt-1 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-300 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  Claims Submitted:
                </span>
                <span className="font-mono font-bold text-white">{claimStats.submitted}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-300 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                  Under Active Review:
                </span>
                <span className="font-mono font-bold text-white">{claimStats.underReview}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-300 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  Approved &amp; Compensated:
                </span>
                <span className="font-mono font-bold text-emerald-400">{claimStats.approved}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-300 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  Rejected / Ineligible:
                </span>
                <span className="font-mono font-bold text-rose-400">{claimStats.rejected}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono">
            {claims.length} Total Claims Processed
          </div>
        </div>
      </div>
    </div>
  );
};
