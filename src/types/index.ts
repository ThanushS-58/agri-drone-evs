export type CropLifecycleStage =
  | 'empty_land'
  | 'land_prep'
  | 'seed_sowing'
  | 'germination'
  | 'early_growth'
  | 'vegetative'
  | 'flowering'
  | 'maturity'
  | 'pre_harvest'
  | 'harvest';

export const CROP_STAGES: { id: CropLifecycleStage; label: string; daysFromSowing: number; description: string }[] = [
  { id: 'empty_land', label: '1. Empty Land', daysFromSowing: -15, description: 'Post-harvest fallow or unplowed field soil' },
  { id: 'land_prep', label: '2. Land Preparation', daysFromSowing: -5, description: 'Plowing, leveling, and canal irrigation readiness' },
  { id: 'seed_sowing', label: '3. Seed Sowing', daysFromSowing: 0, description: 'Direct seeding or nursery transplantation into paddies' },
  { id: 'germination', label: '4. Germination', daysFromSowing: 12, description: 'Sprouting of initial green shoots across furrows' },
  { id: 'early_growth', label: '5. Early Growth', daysFromSowing: 25, description: 'Tillering and root establishment phase' },
  { id: 'vegetative', label: '6. Vegetative Growth', daysFromSowing: 45, description: 'Vigorous leaf canopy formation and biomass accumulation' },
  { id: 'flowering', label: '7. Flowering / Heading', daysFromSowing: 70, description: 'Inflorescence emergence and pollination' },
  { id: 'maturity', label: '8. Crop Maturity', daysFromSowing: 95, description: 'Grain or boll filling, senescence transition' },
  { id: 'pre_harvest', label: '9. Pre-Harvest', daysFromSowing: 115, description: 'Golden field ripening, moisture drop to harvest threshold' },
  { id: 'harvest', label: '10. Harvest', daysFromSowing: 125, description: 'Combine reaping and crop collection' },
];

export interface Farmer {
  id: string; // e.g. "FRM-2026-081"
  name: string;
  phone: string;
  email: string;
  address: string;
  village: string;
  district: string;
  state: string;
  landOwnership: string; // e.g. "Freehold Owner (8.5 Acres)"
  policyNumber: string; // e.g. "PMFBY-2026-IN-49281"
  registeredDate: string;
}

export interface AgriculturalField {
  id: string; // e.g. "FLD-104"
  farmerId: string;
  name: string;
  cropType: 'Paddy (Rice)' | 'Wheat' | 'Cotton' | 'Sugarcane' | 'Maize' | 'Soybean';
  cropVariety: string;
  areaAcres: number;
  latitude: number;
  longitude: number;
  village: string;
  district: string;
  state: string;
  sowingDate: string;
  expectedHarvestDate: string;
  soilType?: string;
  policyNumber: string;
  currentCropStage: CropLifecycleStage;
  monitoringStatus: 'Active' | 'Needs Review' | 'Critical Damage' | 'Harvested';
  boundaryCoordinates?: [number, number][]; // lat, lng polygon
  isDemoData?: boolean;
}

export interface DroneImage {
  id: string;
  fieldId: string;
  farmerId: string;
  captureDate: string;
  captureTime: string;
  latitude: number;
  longitude: number;
  cropStage: CropLifecycleStage;
  imageSource: 'Drone' | 'Upload' | 'Simulation' | 'Webcam';
  resolution: string;
  imageUrl: string;
  isBaseline?: boolean;
  notes?: string;
  damageScenario?: 'None' | 'Flooding' | 'Drought' | 'Pest Infestation' | 'Disease Blight' | 'Physical Lodging';
  damagePercentage?: number;
  affectedArea?: number;
}

export type EnvironmentalEventType = 'Heavy Rain' | 'Flood' | 'Drought' | 'Pest' | 'Disease' | 'Storm';

export interface EnvironmentalEvent {
  id: string;
  fieldId: string;
  eventType: EnvironmentalEventType;
  severity: 'Low' | 'Moderate' | 'High' | 'Critical';
  timestamp: string;
  damagePercentage: number;
  description?: string;
  latitude: number;
  longitude: number;
}

export interface DamageRegion {
  id: string;
  category: 'Flooding' | 'Drought' | 'Pest Infestation' | 'Disease Blight' | 'Physical Lodging' | 'Stress';
  areaAcres: number;
  severity: 'Low' | 'Moderate' | 'High';
  bounds: [number, number, number, number]; // [xPercent, yPercent, widthPercent, heightPercent]
  confidence: number;
  label: string;
  description: string;
}

export interface AIAnalysisResult {
  id: string;
  imageId: string;
  fieldId: string;
  farmerId: string;
  modelName: string;
  analysisDate: string;
  processingTimeMs: number;
  confidenceScore: number;
  cropHealth: 'Healthy' | 'Mild Stress' | 'Moderate Stress' | 'Severe Stress' | 'Visible Crop Damage';
  damageCategory: 'Flooding' | 'Drought' | 'Pest Infestation' | 'Disease Blight' | 'Physical Lodging' | 'None';
  damageSeverity: 'Low' | 'Moderate' | 'High';
  damagePercentage: number;
  totalFieldArea: number;
  healthyArea: number;
  stressedArea: number;
  damagedArea: number;
  cropCoveragePercentage: number;
  temporalChangePercentage: number;
  damageRegions: DamageRegion[];
  segmentedMaskUrl?: string;
  isDemonstrationMode?: boolean;
  phasesLog?: {
    phase: number;
    name: string;
    status: 'completed' | 'in_progress' | 'pending';
    durationMs: number;
    details: string;
  }[];
  methodologyNotes?: string;
}

export interface InsuranceClaim {
  id: string;
  farmerId: string;
  farmerName: string;
  fieldId: string;
  cropType: string;
  fieldArea: number;
  policyNumber: string;
  sowingDate: string;
  observationDate: string;
  damageCategory: string;
  damageSeverity: 'Low' | 'Moderate' | 'High';
  damagePercentage: number;
  affectedArea: number;
  supportingImageId: string;
  supportingImageUrl: string;
  analysisId: string;
  aiAnalysisSummary: string;
  submissionDate: string;
  submittedByName?: string;
  submittedByEmail?: string | null;
  status: 'Draft' | 'Submitted' | 'Under Review' | 'Approved' | 'Rejected' | 'More Information Required';
  adminRemarks?: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface ClaimVerificationRecord {
  id: string;
  claimId: string;
  adminId: string;
  adminName: string;
  decision: 'Approved' | 'Rejected' | 'More Information Required';
  remarks: string;
  verificationDate: string;
  officialSealId: string;
}
