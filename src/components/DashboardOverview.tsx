import React from 'react';
import { 
  Users, 
  MapPin, 
  Camera, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Plane, 
  Sparkles, 
  ArrowRight,
  TrendingUp,
  FileCheck2,
  Clock
} from 'lucide-react';
import { Farmer, AgriculturalField, DroneImage, InsuranceClaim, AIAnalysisResult } from '../types';
import { FieldDamageViewer } from './FieldDamageViewer';

interface DashboardOverviewProps {
  farmers: Farmer[];
  fields: AgriculturalField[];
  images: DroneImage[];
  claims: InsuranceClaim[];
  currentField: AgriculturalField;
  currentImage: DroneImage;
  currentAnalysis?: AIAnalysisResult;
  isAnalyzing: boolean;
  onTriggerAnalysis: () => void;
  onFlyDrone: () => void;
  onHistoricalCompare: () => void;
  onGenerateClaim: () => void;
  onViewReport: () => void;
  onSelectTab: (tab: any) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  farmers,
  fields,
  images,
  claims,
  currentField,
  currentImage,
  currentAnalysis,
  isAnalyzing,
  onTriggerAnalysis,
  onFlyDrone,
  onHistoricalCompare,
  onGenerateClaim,
  onViewReport,
  onSelectTab,
}) => {
  // Aggregate Metrics (Section 2)
  const totalMonitoredAcres = fields.reduce((acc, f) => acc + f.areaAcres, 0).toFixed(1);
  const activeFieldsCount = fields.filter((f) => f.monitoringStatus === 'Active').length;
  const damagedFieldsCount = fields.filter((f) => f.monitoringStatus === 'Critical Damage' || f.monitoringStatus === 'Needs Review').length;
  const pendingClaimsCount = claims.filter((c) => c.status === 'Submitted' || c.status === 'Under Review').length;
  const verifiedClaimsCount = claims.filter((c) => c.status === 'Approved').length;

  const fieldClaim = claims.find((c) => c.fieldId === currentField.id);

  return (
    <div className="space-y-6">
      {/* 8 Metric Overview KPI Cards (Section 2) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-md">
          <span className="text-[11px] text-slate-400 block flex items-center gap-1">
            <Users className="w-3 h-3 text-emerald-400" /> Farmers
          </span>
          <span className="text-xl font-bold text-white font-mono">{farmers.length}</span>
          <span className="text-[10px] text-slate-500 block">Registered</span>
        </div>

        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-md">
          <span className="text-[11px] text-slate-400 block flex items-center gap-1">
            <MapPin className="w-3 h-3 text-emerald-400" /> Plots
          </span>
          <span className="text-xl font-bold text-white font-mono">{fields.length}</span>
          <span className="text-[10px] text-slate-500 block">Cadastral fields</span>
        </div>

        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-md">
          <span className="text-[11px] text-slate-400 block flex items-center gap-1">
            <Layers className="w-3 h-3 text-teal-400" /> Total Area
          </span>
          <span className="text-xl font-bold text-teal-300 font-mono">{totalMonitoredAcres}</span>
          <span className="text-[10px] text-slate-500 block">Acres covered</span>
        </div>

        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-md">
          <span className="text-[11px] text-slate-400 block flex items-center gap-1">
            <Camera className="w-3 h-3 text-purple-400" /> Orthos
          </span>
          <span className="text-xl font-bold text-white font-mono">{images.length}</span>
          <span className="text-[10px] text-slate-500 block">Drone imagery</span>
        </div>

        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-md">
          <span className="text-[11px] text-slate-400 block flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Active
          </span>
          <span className="text-xl font-bold text-emerald-400 font-mono">{activeFieldsCount}</span>
          <span className="text-[10px] text-slate-500 block">Under monitoring</span>
        </div>

        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-md">
          <span className="text-[11px] text-slate-400 block flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-400" /> Damaged
          </span>
          <span className="text-xl font-bold text-rose-400 font-mono">{damagedFieldsCount}</span>
          <span className="text-[10px] text-slate-500 block">Loss detected</span>
        </div>

        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-md">
          <span className="text-[11px] text-slate-400 block flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" /> Claims Pending
          </span>
          <span className="text-xl font-bold text-amber-300 font-mono">{pendingClaimsCount}</span>
          <span className="text-[10px] text-slate-500 block">Awaiting audit</span>
        </div>

        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-md">
          <span className="text-[11px] text-slate-400 block flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> Claims Verified
          </span>
          <span className="text-xl font-bold text-emerald-300 font-mono">{verifiedClaimsCount}</span>
          <span className="text-[10px] text-slate-500 block">Endorsed</span>
        </div>
      </div>

      {/* Main Hero: Large Interactive Agricultural Field Visualization */}
      <FieldDamageViewer
        field={currentField}
        image={currentImage}
        analysis={currentAnalysis}
        isAnalyzing={isAnalyzing}
        onTriggerAnalysis={onTriggerAnalysis}
        onGenerateClaim={onGenerateClaim}
        onViewReport={onViewReport}
        hasClaim={!!fieldClaim}
        claimStatus={fieldClaim?.status}
      />

      {/* Quick Access Action Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => onSelectTab('map')}
          className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-950/80 to-slate-900 hover:from-emerald-900/90 hover:to-slate-800 border border-emerald-500/30 text-left transition group shadow-md"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <MapPin className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
            <span className="text-[10px] font-mono text-emerald-400 font-bold">Google Map</span>
          </div>
          <div className="text-sm font-bold text-white">Interactive Field Map</div>
          <p className="text-[11px] text-slate-400 mt-0.5">GPS markers, boundaries &amp; damage</p>
        </button>

        <button
          onClick={onFlyDrone}
          className="p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left transition group shadow-md"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <Plane className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
            <span className="text-[10px] font-mono text-emerald-400">Launch UAV</span>
          </div>
          <div className="text-sm font-bold text-white">Simulate Drone Survey</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Autonomous flight path &amp; ortho capture</p>
        </button>

        <button
          onClick={onHistoricalCompare}
          className="p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left transition group shadow-md"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <Layers className="w-4 h-4 text-blue-400 group-hover:scale-110 transition" />
            <span className="text-[10px] font-mono text-blue-400">Compare</span>
          </div>
          <div className="text-sm font-bold text-white">Multi-Temporal Delta</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Split slider before &amp; after comparison</p>
        </button>

        <button
          onClick={() => onSelectTab('graphs')}
          className="p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left transition group shadow-md"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <TrendingUp className="w-4 h-4 text-purple-400 group-hover:scale-110 transition" />
            <span className="text-[10px] font-mono text-purple-400">Biometrics</span>
          </div>
          <div className="text-sm font-bold text-white">Live Monitoring Graphs</div>
          <p className="text-[11px] text-slate-400 mt-0.5">6 temporal vegetative loss charts</p>
        </button>

        <button
          onClick={() => onSelectTab('claims')}
          className="p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left transition group shadow-md"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <ShieldCheck className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
            <span className="text-[10px] font-mono text-amber-400">PMFBY Portal</span>
          </div>
          <div className="text-sm font-bold text-white">Insurance Claims Hub</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Surveyor endorsement &amp; PDF reports</p>
        </button>
      </div>

    </div>
  );
};
