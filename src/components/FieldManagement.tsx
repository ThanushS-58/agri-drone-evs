import React, { useState } from 'react';
import { 
  MapPin, 
  Plus, 
  Layers, 
  Trash2, 
  Calendar, 
  Compass, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Plane,
  Eye,
  Sparkles
} from 'lucide-react';
import { AgriculturalField, Farmer, DroneImage, AIAnalysisResult } from '../types';
import { generateAerialDroneImageUrl } from '../utils/droneImageFactory';

interface FieldManagementProps {
  fields: AgriculturalField[];
  farmers: Farmer[];
  images: DroneImage[];
  analyses: AIAnalysisResult[];
  onAddField: (field: Omit<AgriculturalField, 'id' | 'currentCropStage' | 'monitoringStatus'>) => void;
  onSelectField: (fieldId: string) => void;
  onDeleteField: (fieldId: string) => void;
  onFlyDrone: (fieldId: string) => void;
  onAnalyzeField: (fieldId: string) => void;
  onViewOnMap?: (fieldId: string) => void;
}

export const FieldManagement: React.FC<FieldManagementProps> = ({
  fields,
  farmers,
  images,
  analyses,
  onAddField,
  onSelectField,
  onDeleteField,
  onFlyDrone,
  onAnalyzeField,
  onViewOnMap,
}) => {

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form inputs
  const [formFarmerId, setFormFarmerId] = useState(farmers[0]?.id || 'FRM-001');
  const [formName, setFormName] = useState('');
  const [formCropType, setFormCropType] = useState<AgriculturalField['cropType']>('Paddy (Rice)');
  const [formVariety, setFormVariety] = useState('Pusa Basmati 1509');
  const [formAreaAcres, setFormAreaAcres] = useState<number>(4.5);
  const [formLat, setFormLat] = useState<number>(29.6857);
  const [formLng, setFormLng] = useState<number>(76.9905);
  const [formVillage, setFormVillage] = useState('Taraori');
  const [formDistrict, setFormDistrict] = useState('Karnal');
  const [formState, setFormState] = useState('Haryana');
  const [formSowingDate, setFormSowingDate] = useState('2026-06-15');
  const [formHarvestDate, setFormHarvestDate] = useState('2026-10-30');
  const [formSoilType, setFormSoilType] = useState('Clay Loam');

  const selectedFarmer = farmers.find((f) => f.id === formFarmerId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    onAddField({
      farmerId: formFarmerId,
      name: formName,
      cropType: formCropType,
      cropVariety: formVariety,
      areaAcres: Number(formAreaAcres),
      latitude: Number(formLat),
      longitude: Number(formLng),
      village: formVillage,
      district: formDistrict,
      state: formState,
      sowingDate: formSowingDate,
      expectedHarvestDate: formHarvestDate,
      soilType: formSoilType,
      policyNumber: selectedFarmer?.policyNumber || 'PMFBY-2026-IN-DEFAULT',
    });

    setIsModalOpen(false);
    setFormName('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Registered Agricultural Plots &amp; Fields
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {fields.length} Monitored Fields
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Georeferenced cadastral boundaries, crop variety schedules, and multi-sensor aerial survey histories.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 transition shadow-md shadow-emerald-950"
        >
          <Plus className="w-4 h-4" />
          <span>REGISTER NEW FIELD</span>
        </button>
      </div>

      {/* Field Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {fields.map((field) => {
          const farmer = farmers.find((f) => f.id === field.farmerId);
          const fieldImages = images.filter((img) => img.fieldId === field.id);
          const latestImg = fieldImages[fieldImages.length - 1];
          const latestAnalysis = analyses.find((a) => a.fieldId === field.id);

          const damagePercentage = latestAnalysis?.damagePercentage ?? (
            field.monitoringStatus === 'Critical Damage' ? 38 : field.monitoringStatus === 'Needs Review' ? 18 : 0
          );

          const displayThumbnail = latestImg?.imageUrl || generateAerialDroneImageUrl({
            cropType: field.cropType,
            stage: field.currentCropStage,
            damageType: damagePercentage > 0 ? (field.monitoringStatus === 'Critical Damage' ? 'Flooding' : 'Pest Infestation') : 'None',
          });

          return (
            <div
              key={field.id}
              className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-lg hover:border-slate-700 transition flex flex-col justify-between group"
            >
              {/* Image Preview & Badges */}
              <div className="relative aspect-[16/10] bg-black overflow-hidden">
                <img
                  src={displayThumbnail}
                  alt={field.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/40 pointer-events-none" />

                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-950/80 text-emerald-300 border border-slate-700">
                    {field.id}
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-black/60 text-white backdrop-blur-sm">
                    {field.areaAcres} Acres
                  </span>
                </div>

                <div className="absolute top-3 right-3">
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold shadow-md ${
                    field.monitoringStatus === 'Critical Damage'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : field.monitoringStatus === 'Needs Review'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}>
                    {field.monitoringStatus}
                  </span>
                </div>

                <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between text-xs">
                  <div>
                    <h3 className="font-bold text-white text-sm drop-shadow">{field.name}</h3>
                    <span className="text-slate-300 text-[11px] block">
                      Farmer: {farmer?.name || 'Assigned Owner'}
                    </span>
                  </div>
                  {damagePercentage > 0 && (
                    <div className="text-right">
                      <span className="text-[10px] text-rose-300 block">Est. Damage</span>
                      <span className="font-black text-rose-400 text-sm font-mono">{damagePercentage}%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Body Attributes */}
              <div className="p-4 space-y-3 text-xs flex-1">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Crop &amp; Variety</span>
                    <span className="font-semibold text-slate-200">{field.cropType}</span>
                    <span className="text-slate-400 block truncate">{field.cropVariety}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Growth Phase</span>
                    <span className="font-semibold text-emerald-400 capitalize">
                      {field.currentCropStage.replace('_', ' ')}
                    </span>
                    <span className="text-slate-400 block">Sown: {field.sowingDate}</span>
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-[11px] text-slate-300 font-mono">
                  <span>GPS: {field.latitude.toFixed(4)}°N, {field.longitude.toFixed(4)}°E</span>
                  <span className="text-slate-400">{field.village}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Policy: <strong className="text-slate-300 font-mono">{field.policyNumber}</strong></span>
                  <span>{fieldImages.length} Aerial Orthos</span>
                </div>
              </div>

                {/* Actions Footer */}
                <div className="p-3 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectField(field.id)}
                    className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-1 transition shadow"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect</span>
                  </button>

                  {onViewOnMap && (
                    <button
                      onClick={() => onViewOnMap(field.id)}
                      title="View on Google Map"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 transition border border-emerald-500/20"
                    >
                      <MapPin className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => onFlyDrone(field.id)}
                    title="Launch Drone Survey"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                  >
                    <Plane className="w-4 h-4 text-emerald-400" />
                  </button>


                <button
                  onClick={() => onAnalyzeField(field.id)}
                  title="Run AI Computer Vision Loss Detection"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </button>

                <button
                  onClick={() => {
                    if (confirm(`Remove field ${field.name}?`)) {
                      onDeleteField(field.id);
                    }
                  }}
                  title="Delete Field"
                  className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900 text-rose-300 transition border border-rose-900/60"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Register Field Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <form
            onSubmit={handleSubmit}
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>Register Agricultural Field Plot</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕ Cancel
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Select Registered Farmer Owner *</label>
                <select
                  value={formFarmerId}
                  onChange={(e) => setFormFarmerId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  {farmers.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.id}) - {f.village}, {f.district}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Field Plot Name / Survey Title *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. South Canal Paddy Sector C"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Crop Type *</label>
                  <select
                    value={formCropType}
                    onChange={(e) => setFormCropType(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Paddy (Rice)">Paddy (Rice)</option>
                    <option value="Wheat">Wheat</option>
                    <option value="Cotton">Cotton</option>
                    <option value="Sugarcane">Sugarcane</option>
                    <option value="Maize">Maize</option>
                    <option value="Soybean">Soybean</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Crop Variety *</label>
                  <input
                    type="text"
                    required
                    value={formVariety}
                    onChange={(e) => setFormVariety(e.target.value)}
                    placeholder="e.g. Basmati Pusa-1509"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Area (Acres) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    required
                    value={formAreaAcres}
                    onChange={(e) => setFormAreaAcres(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Latitude (°N)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formLat}
                    onChange={(e) => setFormLat(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Longitude (°E)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formLng}
                    onChange={(e) => setFormLng(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Sowing Date *</label>
                  <input
                    type="date"
                    required
                    value={formSowingDate}
                    onChange={(e) => setFormSowingDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Expected Harvest Date *</label>
                  <input
                    type="date"
                    required
                    value={formHarvestDate}
                    onChange={(e) => setFormHarvestDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Soil Classification Type</label>
                <input
                  type="text"
                  value={formSoilType}
                  onChange={(e) => setFormSoilType(e.target.value)}
                  placeholder="e.g. Clay Loam / Black Regur"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950"
              >
                Save &amp; Register Field
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
