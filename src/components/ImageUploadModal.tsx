import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Camera, 
  Layers, 
  CheckCircle2, 
  Plane, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { AgriculturalField, DroneImage, CropLifecycleStage, CROP_STAGES } from '../types';
import { generateAerialDroneImageUrl } from '../utils/droneImageFactory';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  field: AgriculturalField;
  onImageAdded: (image: Omit<DroneImage, 'id'>) => void | Promise<void>;
}

export const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  isOpen,
  onClose,
  field,
  onImageAdded,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'upload' | 'simulate' | 'webcam'>('simulate');
  const [selectedStage, setSelectedStage] = useState<CropLifecycleStage>(field.currentCropStage || 'vegetative');
  const [selectedDamage, setSelectedDamage] = useState<'None' | 'Flooding' | 'Drought' | 'Pest Infestation'>('Flooding');
  const [severity, setSeverity] = useState<'None' | 'Low' | 'Moderate' | 'High'>('Moderate');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>('Post-event multi-spectral aerial survey.');
  
  // Webcam state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // File upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPreviewUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Generate synthetic drone image preview
  const handleGenerateSimulation = () => {
    const url = generateAerialDroneImageUrl({
      cropType: field.cropType,
      stage: selectedStage,
      damageType: selectedDamage,
      severityLevel: severity,
    });
    setPreviewUrl(url);
  };

  // Start webcam
  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err: any) {
      setCameraError(err.message || 'Camera permission denied or camera not found');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  const captureCameraSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, 640, 480);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setPreviewUrl(dataUrl);
    stopCamera();
  };

  const handleSave = async () => {
    const finalUrl = previewUrl || generateAerialDroneImageUrl({
      cropType: field.cropType,
      stage: selectedStage,
      damageType: selectedDamage,
      severityLevel: severity,
    });

    await onImageAdded({
      fieldId: field.id,
      farmerId: field.farmerId,
      captureDate: new Date().toISOString().split('T')[0],
      captureTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      latitude: field.latitude,
      longitude: field.longitude,
      cropStage: selectedStage,
      imageSource: activeTab === 'upload' ? 'Upload' : activeTab === 'webcam' ? 'Webcam' : 'Simulation',
      resolution: activeTab === 'upload' ? 'Uploaded Ortho' : '3840 x 2160 (4K UHD)',
      imageUrl: finalUrl,
      damageScenario: selectedDamage,
      notes,
    });

    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-400" />
              <span>Acquire / Upload Drone Orthophoto</span>
            </h3>
            <p className="text-xs text-slate-400">Target Field: {field.name} ({field.cropType})</p>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-slate-400 hover:text-white text-xs"
          >
            ✕ Cancel
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center bg-slate-800 p-1 rounded-xl text-xs">
          <button
            onClick={() => {
              stopCamera();
              setActiveTab('simulate');
            }}
            className={`flex-1 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'simulate' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Simulate Drone Capture
          </button>
          <button
            onClick={() => {
              stopCamera();
              setActiveTab('upload');
            }}
            className={`flex-1 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'upload' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Upload Drone Image
          </button>
          <button
            onClick={() => {
              setActiveTab('webcam');
              startCamera();
            }}
            className={`flex-1 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'webcam' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Connected Camera
          </button>
        </div>

        {/* Body content based on tab */}
        <div className="space-y-3 text-xs">
          {activeTab === 'simulate' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Crop Lifecycle Stage</label>
                  <select
                    value={selectedStage}
                    onChange={(e) => setSelectedStage(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {CROP_STAGES.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Damage Calamity Scenario</label>
                  <select
                    value={selectedDamage}
                    onChange={(e) => setSelectedDamage(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="None">None (Healthy Crop)</option>
                    <option value="Flooding">Flooding / Water Inundation</option>
                    <option value="Drought">Severe Drought Desiccation</option>
                    <option value="Pest Infestation">Pest Defoliation / Blight</option>
                  </select>
                </div>
              </div>

              {selectedDamage !== 'None' && (
                <div>
                  <label className="text-slate-400 block mb-1">Damage Severity Intensity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Low">Low (&lt; 20% loss)</option>
                    <option value="Moderate">Moderate (20% - 50% loss)</option>
                    <option value="High">High (≥ 50% severe loss)</option>
                  </select>
                </div>
              )}

              <button
                type="button"
                onClick={handleGenerateSimulation}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold border border-slate-700 flex items-center justify-center gap-1.5 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Synthetic Aerial Ortho Preview</span>
              </button>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-3">
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-xl p-6 cursor-pointer bg-slate-800/40 transition">
                <Upload className="w-8 h-8 text-emerald-400 mb-2" />
                <span className="font-bold text-white text-xs">Click or drop drone aerial image (GeoTIFF / JPG / PNG)</span>
                <span className="text-[11px] text-slate-400 mt-1">Supports high-res aerial drone captures</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {activeTab === 'webcam' && (
            <div className="space-y-2 text-center">
              {cameraError ? (
                <div className="p-4 bg-rose-950/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{cameraError}</span>
                </div>
              ) : (
                <div className="relative aspect-[4/3] bg-black rounded-xl overflow-hidden border border-slate-800">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {cameraActive && (
                    <button
                      type="button"
                      onClick={captureCameraSnapshot}
                      className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg flex items-center gap-1.5"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Take Photo Snapshot</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Preview Image if Available */}
          {previewUrl && (
            <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-1">Generated Orthophoto Preview:</span>
              <div className="aspect-[16/10] bg-black rounded-lg overflow-hidden">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            </div>
          )}

          <div>
            <label className="text-slate-400 block mb-1">Field Inspection Remarks</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-xs bg-slate-800 text-slate-300 hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950"
          >
            Save &amp; Associate to Field
          </button>
        </div>
      </div>
    </div>
  );
};
