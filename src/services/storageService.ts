import { Farmer, AgriculturalField, DroneImage, AIAnalysisResult, InsuranceClaim, ClaimVerificationRecord, EnvironmentalEvent } from '../types';
import { INITIAL_FARMERS, INITIAL_FIELDS, INITIAL_CLAIMS, INITIAL_ENVIRONMENTAL_EVENTS, buildInitialDroneImages } from '../data/mockData';

const STORAGE_KEYS = {
  FARMERS: 'agrishield_farmers_v1',
  FIELDS: 'agrishield_fields_v1',
  IMAGES: 'agrishield_images_v1',
  ANALYSES: 'agrishield_analyses_v1',
  CLAIMS: 'agrishield_claims_v1',
  VERIFICATIONS: 'agrishield_verifications_v1',
  EVENTS: 'agrishield_events_v1',
};


class StorageService {
  getFarmers(): Farmer[] {
    const raw = localStorage.getItem(STORAGE_KEYS.FARMERS);
    if (!raw) {
      this.saveFarmers(INITIAL_FARMERS);
      return INITIAL_FARMERS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_FARMERS;
    }
  }

  saveFarmers(farmers: Farmer[]): void {
    localStorage.setItem(STORAGE_KEYS.FARMERS, JSON.stringify(farmers));
  }

  addFarmer(farmer: Omit<Farmer, 'id' | 'registeredDate'>): Farmer {
    const farmers = this.getFarmers();
    const newFarmer: Farmer = {
      ...farmer,
      id: `FRM-${String(farmers.length + 1).padStart(3, '0')}`,
      registeredDate: new Date().toISOString().split('T')[0],
    };
    farmers.unshift(newFarmer);
    this.saveFarmers(farmers);
    return newFarmer;
  }

  updateFarmer(farmer: Farmer): void {
    const farmers = this.getFarmers().map((f) => (f.id === farmer.id ? farmer : f));
    this.saveFarmers(farmers);
  }

  deleteFarmer(id: string): void {
    const farmers = this.getFarmers().filter((f) => f.id !== id);
    this.saveFarmers(farmers);
  }

  // --- FIELDS ---
  getFields(): AgriculturalField[] {
    const raw = localStorage.getItem(STORAGE_KEYS.FIELDS);
    if (!raw) {
      this.saveFields(INITIAL_FIELDS);
      return INITIAL_FIELDS;
    }
    try {
      const parsed: AgriculturalField[] = JSON.parse(raw);
      // Ensure existing fields without boundaryCoordinates receive default boundaries
      const updated = parsed.map((f) => {
        if (!f.boundaryCoordinates || f.boundaryCoordinates.length === 0) {
          const init = INITIAL_FIELDS.find((item) => item.id === f.id);
          if (init && init.boundaryCoordinates) {
            return { ...f, boundaryCoordinates: init.boundaryCoordinates, isDemoData: init.isDemoData };
          }
        }
        return f;
      });
      return updated;
    } catch {
      return INITIAL_FIELDS;
    }
  }


  saveFields(fields: AgriculturalField[]): void {
    localStorage.setItem(STORAGE_KEYS.FIELDS, JSON.stringify(fields));
  }

  addField(field: Omit<AgriculturalField, 'id' | 'currentCropStage' | 'monitoringStatus'>): AgriculturalField {
    const fields = this.getFields();
    const newField: AgriculturalField = {
      ...field,
      id: `FLD-${100 + fields.length + 1}`,
      currentCropStage: 'vegetative',
      monitoringStatus: 'Active',
    };
    fields.unshift(newField);
    this.saveFields(fields);
    return newField;
  }

  updateField(field: AgriculturalField): void {
    const fields = this.getFields().map((f) => (f.id === field.id ? field : f));
    this.saveFields(fields);
  }

  deleteField(id: string): void {
    const fields = this.getFields().filter((f) => f.id !== id);
    this.saveFields(fields);
  }

  // --- DRONE IMAGES ---
  getImages(): DroneImage[] {
    const raw = localStorage.getItem(STORAGE_KEYS.IMAGES);
    if (!raw) {
      const initial = buildInitialDroneImages();
      this.saveImages(initial);
      return initial;
    }
    try {
      return JSON.parse(raw);
    } catch {
      const initial = buildInitialDroneImages();
      this.saveImages(initial);
      return initial;
    }
  }

  saveImages(images: DroneImage[]): void {
    localStorage.setItem(STORAGE_KEYS.IMAGES, JSON.stringify(images));
  }

  addImage(image: Omit<DroneImage, 'id'>): DroneImage {
    const images = this.getImages();
    const newImage: DroneImage = {
      ...image,
      id: `IMG-${Date.now().toString(36).toUpperCase()}`,
    };
    images.unshift(newImage);
    this.saveImages(images);
    return newImage;
  }

  getImagesForField(fieldId: string): DroneImage[] {
    return this.getImages().filter((img) => img.fieldId === fieldId);
  }

  // --- ANALYSES ---
  getAnalyses(): AIAnalysisResult[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ANALYSES);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  saveAnalyses(analyses: AIAnalysisResult[]): void {
    localStorage.setItem(STORAGE_KEYS.ANALYSES, JSON.stringify(analyses));
  }

  addAnalysis(analysis: AIAnalysisResult): void {
    const list = this.getAnalyses();
    const existingIndex = list.findIndex((a) => a.id === analysis.id || a.imageId === analysis.imageId);
    if (existingIndex >= 0) {
      list[existingIndex] = analysis;
    } else {
      list.unshift(analysis);
    }
    this.saveAnalyses(list);
  }

  getAnalysisForImage(imageId: string): AIAnalysisResult | undefined {
    return this.getAnalyses().find((a) => a.imageId === imageId);
  }

  // --- CLAIMS ---
  getClaims(): InsuranceClaim[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CLAIMS);
    if (!raw) {
      const images = this.getImages();
      const initial = INITIAL_CLAIMS.map((c) => {
        const found = images.find((i) => i.id === c.supportingImageId);
        return {
          ...c,
          supportingImageUrl: found ? found.imageUrl : '',
        };
      });
      this.saveClaims(initial);
      return initial;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_CLAIMS;
    }
  }

  saveClaims(claims: InsuranceClaim[]): void {
    const compactClaims = claims.map((claim) => ({
      ...claim,
      supportingImageUrl: claim.supportingImageUrl?.startsWith('data:')
        ? ''
        : claim.supportingImageUrl || '',
    }));
    localStorage.setItem(STORAGE_KEYS.CLAIMS, JSON.stringify(compactClaims));
  }

  addClaim(claim: Omit<InsuranceClaim, 'id' | 'submissionDate' | 'status'>): InsuranceClaim {
    const claims = this.getClaims();
    const newClaim: InsuranceClaim = {
      ...claim,
      id: `CLM-2026-${String(claims.length + 1).padStart(3, '0')}`,
      submissionDate: new Date().toISOString().split('T')[0],
      status: 'Submitted',
    };
    claims.unshift(newClaim);
    this.saveClaims(claims);
    return newClaim;
  }

  updateClaim(claim: InsuranceClaim): void {
    const claims = this.getClaims().map((c) => (c.id === claim.id ? claim : c));
    this.saveClaims(claims);
  }

  // --- VERIFICATIONS ---
  getVerifications(): ClaimVerificationRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.VERIFICATIONS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  saveVerifications(records: ClaimVerificationRecord[]): void {
    localStorage.setItem(STORAGE_KEYS.VERIFICATIONS, JSON.stringify(records));
  }

  addVerification(record: ClaimVerificationRecord): void {
    const list = this.getVerifications();
    list.unshift(record);
    this.saveVerifications(list);
  }

  // --- EVENTS ---
  getEvents(): EnvironmentalEvent[] {
    const raw = localStorage.getItem(STORAGE_KEYS.EVENTS);
    if (!raw) {
      this.saveEvents(INITIAL_ENVIRONMENTAL_EVENTS);
      return INITIAL_ENVIRONMENTAL_EVENTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_ENVIRONMENTAL_EVENTS;
    }
  }

  saveEvents(events: EnvironmentalEvent[]): void {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  }

  addEvent(event: Omit<EnvironmentalEvent, 'id'>): EnvironmentalEvent {
    const list = this.getEvents();
    const newEvent: EnvironmentalEvent = {
      ...event,
      id: `EVT-${String(list.length + 1).padStart(3, '0')}`,
    };
    list.unshift(newEvent);
    this.saveEvents(list);
    return newEvent;
  }

  // RESET
  resetAllToDefaults(): void {
    localStorage.removeItem(STORAGE_KEYS.FARMERS);
    localStorage.removeItem(STORAGE_KEYS.FIELDS);
    localStorage.removeItem(STORAGE_KEYS.IMAGES);
    localStorage.removeItem(STORAGE_KEYS.ANALYSES);
    localStorage.removeItem(STORAGE_KEYS.CLAIMS);
    localStorage.removeItem(STORAGE_KEYS.VERIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.EVENTS);
  }

}

export const storage = new StorageService();
